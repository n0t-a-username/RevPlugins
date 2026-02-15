import { logger } from "@vendetta";
import { registerCommand } from "@vendetta/commands";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { before } from "@vendetta/patcher";
import { FluxDispatcher } from "@vendetta/metro/common";

const UserStore = findByStoreName("UserStore");
const MessageStore = findByStoreName("MessageStore");
const { receiveMessage } = findByProps("receiveMessage");
const { createBotMessage } = findByProps("createBotMessage");

storage.deletedMessages ??= {};
storage.editedMessages ??= {};

const commands = [];
const patches = [];

const sendLocal = (id, content, embeds = []) => {
    const msg = createBotMessage({ channelId: id, content, embeds });
    receiveMessage(id, Object.assign(msg, { author: UserStore.getCurrentUser() }));
};

const getArg = (args, name) => args.find(a => a.name === name)?.value;

// --- MESSAGE LOGGER LOGIC ---
patches.push(before("dispatch", FluxDispatcher, ([event]) => {
    if (event.type === "MESSAGE_DELETE") {
        const msg = MessageStore.getMessage(event.channelId, event.id);
        if (!msg?.content) return;
        (storage.deletedMessages[event.channelId] ??= []).unshift({ c: msg.content, a: msg.author, t: Date.now() });
        storage.deletedMessages[event.channelId].splice(20);
    }
    if (event.type === "MESSAGE_UPDATE" && event.message.content) {
        const old = MessageStore.getMessage(event.message.channel_id, event.message.id);
        if (!old?.content || old.content === event.message.content) return;
        (storage.editedMessages[event.message.channel_id] ??= []).unshift({ o: old.content, n: event.message.content, a: old.author, t: Date.now() });
        storage.editedMessages[event.message.channel_id].splice(20);
    }
}));

// --- FEATURE LIST (50+ Items) ---
const toolset = [
    // [Utilities]
    { n: "snipe", d: "Last deleted message", e: (a, c) => {
        const m = storage.deletedMessages[c.channel.id]?.[0];
        sendLocal(c.channel.id, m ? `**${m.a.username}**: ${m.c}` : "Empty.");
    }},
    { n: "editsnipe", d: "Last edited message", e: (a, c) => {
        const m = storage.editedMessages[c.channel.id]?.[0];
        sendLocal(c.channel.id, m ? `**${m.a.username}** changed: \`${m.o}\` -> \`${m.n}\`` : "Empty.");
    }},
    { n: "translate", d: "No-API Translate", o: [{n:"q", t:3, r:true}, {n:"to", t:3}], e: async (a, c) => {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${getArg(a,"to")||"en"}&dt=t&q=${encodeURIComponent(getArg(a,"q"))}`);
        const body = await res.json();
        sendLocal(c.channel.id, body[0][0][0]);
    }},

    // [Text Fun]
    { n: "reverse", d: "esrever", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").split("").reverse().join("")) },
    { n: "mock", d: "mOcK tExT", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").split("").map((l,i)=>i%2?l.toUpperCase():l.toLowerCase()).join("")) },
    { n: "clap", d: "Clap👏Text", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").replace(/ /g, "👏")) },
    { n: "bold", d: "Boldify", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, `**${getArg(a,"t")}**`) },
    { n: "italic", d: "Italicize", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, `*${getArg(a,"t")}*`) },
    { n: "strike", d: "Strikethrough", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, `~~${getArg(a,"t")}~~`) },
    { n: "spoiler", d: "Spoiler", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, `||${getArg(a,"t")}||`) },
    { n: "code", d: "Codeblock", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, `\`${getArg(a,"t")}\``) },
    { n: "upper", d: "ALL CAPS", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").toUpperCase()) },
    { n: "lower", d: "all lower", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").toLowerCase()) },
    { n: "binary", d: "Text to Binary", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").split("").map(x=>x.charCodeAt(0).toString(2)).join(" ")) },
    { n: "leet", d: "L33t sp34k", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").replace(/e/gi,"3").replace(/a/gi,"4").replace(/o/gi,"0").replace(/i/gi,"1").replace(/s/gi,"5")) },
    { n: "uwu", d: "UwU-ify", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").replace(/r|l/g,"w").replace(/R|L/g,"W")+" uwu") },
    { n: "emojify", d: "E m o j i", o: [{n:"t", t:3, r:true}], e: (a, c) => sendLocal(c.channel.id, getArg(a,"t").toLowerCase().split("").map(c=>/[a-z]/.test(c)?`:regional_indicator_${c}:` : c).join(" ")) },
    
    // [Math & Numbers]
    { n: "add", d: "a+b", o: [{n:"a",t:4,r:true},{n:"b",t:4,r:true}], e: (a, c) => sendLocal(c.channel.id, String(getArg(a,"a")+getArg(a,"b"))) },
    { n: "sub", d: "a-b", o: [{n:"a",t:4,r:true},{n:"b",t:4,r:true}], e: (a, c) => sendLocal(c.channel.id, String(getArg(a,"a")-getArg(a,"b"))) },
    { n: "mul", d: "a*b", o: [{n:"a",t:4,r:true},{n:"b",t:4,r:true}], e: (a, c) => sendLocal(c.channel.id, String(getArg(a,"a")*getArg(a,"b"))) },
    { n: "div", d: "a/b", o: [{n:"a",t:4,r:true},{n:"b",t:4,r:true}], e: (a, c) => sendLocal(c.channel.id, String(getArg(a,"a")/getArg(a,"b"))) },
    { n: "pow", d: "Power", o: [{n:"a",t:4,r:true},{n:"b",t:4,r:true}], e: (a, c) => sendLocal(c.channel.id, String(Math.pow(getArg(a,"a"),getArg(a,"b")))) },
    { n: "sqrt", d: "Square Root", o: [{n:"n",t:4,r:true}], e: (a, c) => sendLocal(c.channel.id, String(Math.sqrt(getArg(a,"n")))) },
    { n: "rand", d: "Random Number", o: [{n:"m",t:4,r:true}], e: (a, c) => sendLocal(c.channel.id, String(Math.floor(Math.random()*getArg(a,"m")))) },
    { n: "pi", d: "Value of Pi", e: (a, c) => sendLocal(c.channel.id, String(Math.PI)) },
    
    // [Fun / Games]
    { n: "coin", d: "Flip Coin", e: (a, c) => sendLocal(c.channel.id, Math.random()>0.5?"Heads":"Tails") },
    { n: "dice", d: "Roll d6", e: (a, c) => sendLocal(c.channel.id, `Rolled ${Math.floor(Math.random()*6)+1}`) },
    { n: "8ball", d: "Magic 8-Ball", o: [{n:"q",t:3,r:true}], e: (a, c) => {
        const res = ["Yes", "No", "Maybe", "Ask again", "Outlook good", "Very doubtful"];
        sendLocal(c.channel.id, `🎱 ${res[Math.floor(Math.random()*res.length)]}`);
    }},
    { n: "tictactoe", d: "Board UI", e: (a,c) => sendLocal(c.channel.id, "⬜⬜⬜\n⬜⬜⬜\n⬜⬜⬜\n(Demo UI)") },
    { n: "shrug", d: "¯\\_(ツ)_/¯", e: (a,c) => sendLocal(c.channel.id, "¯\\_(ツ)_/¯") },
    { n: "tableflip", d: "(╯°□°）╯︵ ┻━┻", e: (a,c) => sendLocal(c.channel.id, "(╯°□°）╯︵ ┻━┻") },
    { n: "lenny", d: "( ͡° ͜ʖ ͡°)", e: (a,c) => sendLocal(c.channel.id, "( ͡° ͜ʖ ͡°)") },

    // [Discord Utils]
    { n: "userid", d: "Your ID", e: (a,c) => sendLocal(c.channel.id, UserStore.getCurrentUser().id) },
    { n: "chanid", d: "Channel ID", e: (a,c) => sendLocal(c.channel.id, c.channel.id) },
    { n: "guildid", d: "Server ID", e: (a,c) => sendLocal(c.channel.id, c.channel.guild_id || "DM") },
    { n: "avatar", d: "Get User Avatar", o: [{n:"u",t:3,r:true}], e: (a,c) => {
        const u = UserStore.getUser(getArg(a,"u").replace(/[<@!>]/g,""));
        sendLocal(c.channel.id, u?.getAvatarURL({size:512}) || "No user");
    }},
    { n: "unix", d: "Current Unix Time", e: (a,c) => sendLocal(c.channel.id, String(Math.floor(Date.now()/1000))) },
    { n: "ping", d: "Bot Latency", e: (a,c) => sendLocal(c.channel.id, "Pong! 🏓") },
    
    // [Data / Dev]
    { n: "b64en", d: "B64 Encode", o: [{n:"t",t:3,r:true}], e: (a,c) => sendLocal(c.channel.id, btoa(getArg(a,"t"))) },
    { n: "b64de", d: "B64 Decode", o: [{n:"t",t:3,r:true}], e: (a,c) => { try { sendLocal(c.channel.id, atob(getArg(a,"t"))); } catch { sendLocal(c.channel.id, "Invalid"); }} },
    { n: "urlen", d: "URL Encode", o: [{n:"t",t:3,r:true}], e: (a,c) => sendLocal(c.channel.id, encodeURIComponent(getArg(a,"t"))) },
    { n: "urlde", d: "URL Decode", o: [{n:"t",t:3,r:true}], e: (a,c) => sendLocal(c.channel.id, decodeURIComponent(getArg(a,"t"))) },
    { n: "hex", d: "Text to Hex", o: [{n:"t",t:3,r:true}], e: (a,c) => sendLocal(c.channel.id, getArg(a,"t").split("").map(c=>c.charCodeAt(0).toString(16)).join(" ")) },
    { n: "length", d: "Char count", o: [{n:"t",t:3,r:true}], e: (a,c) => sendLocal(c.channel.id, `Length: ${getArg(a,"t").length}`) },
    { n: "sha256", d: "Fake Hash (Demo)", o: [{n:"t",t:3,r:true}], e: (a,c) => sendLocal(c.channel.id, "Requires Crypto Library") },
    
    // [Misc]
    { n: "timer", d: "Start 10s timer", e: (a,c) => { sendLocal(c.channel.id, "Timer set for 10s!"); setTimeout(()=>sendLocal(c.channel.id,"⏰ Time up!"), 10000); }},
    { n: "coffee", d: "Get coffee", e: (a,c) => sendLocal(c.channel.id, "☕ Here is your coffee!") },
    { n: "echo", d: "Repeat text", o: [{n:"t",t:3,r:true}], e: (a,c) => sendLocal(c.channel.id, getArg(a,"t")) },
    { n: "clearlogs", d: "Flush snipers", e: (a,c) => { storage.deletedMessages = {}; storage.editedMessages = {}; sendLocal(c.channel.id, "Cleared."); }},
    { n: "version", d: "Plugin Ver", e: (a,c) => sendLocal(c.channel.id, "v2.0 - Clean & Optimized") }
];

export default {
    onLoad: () => {
        toolset.forEach(f => {
            commands.push(registerCommand({
                name: f.n, displayName: f.n, description: f.d,
                options: f.o || [], execute: f.e,
                applicationId: "-1", inputType: 1, type: 1
            }));
        });
        logger.log(`Success: 50+ Features Loaded.`);
    },
    onUnload: () => {
        commands.forEach(c => c());
        patches.forEach(p => p());
    }
};
