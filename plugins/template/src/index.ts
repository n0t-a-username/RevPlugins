import { Logger, Settings } from "@vendetta";
import { registerCommand } from "@vendetta/commands";
import { findByStoreName, findByProps } from "@vendetta/metro";
import { ReactNative } from "@vendetta/metro";

// Utilities
const logger = Logger;
const UserStore = findByStoreName("UserStore");
const MessageActions = findByProps("sendMessage", "receiveMessage");
const tokenGetter = findByProps("getToken");
const token = tokenGetter.getToken?.() || "";

// Helpers
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomNumber = () => Math.floor(Math.random() * 100);
const randomWord = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Fun image commands setup
async function fetchAndUpload(url: string) {
  const blob = await fetch(url).then(r => r.blob());
  const files = await findByProps("uploadLocalFiles").uploadLocalFiles([blob], token);
  return files.map((f: any) => ({ id: f.id, filename: f.name }));
}
function makeImageCommand({ name, desc, api }: { name: string; desc: string; api: string; }) {
  return registerCommand({
    name,
    displayName: name,
    description: desc,
    options: [{ name: "user", description: "Target user", type: 6, required: true }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      await ctx.defer();
      const user = UserStore.getUser(args[0].value);
      if (!user) return { content: "User not found", flags: 1 << 6 };
      const url = `${api}?image=${encodeURIComponent(user.getAvatarURL(512).replace("webp","png"))}`;
      const res = await fetch(url);
      if (!res.ok) return { content: "API error", flags: 1 << 6 };
      const { url: img } = await res.json();
      const attachments = await fetchAndUpload(img);
      return { content: `<@${user.id}>`, attachments };
    }
  });
}

// Commands array
const unregisters: any[] = [];

// On load register commands
export default {
  onLoad() {
    logger.log("Plugin loaded");

// Ping
    unregisters.push(registerCommand({
      name: "ping",
      displayName: "ping",
      description: "Check latency",
      applicationId: "-1",
      inputType: 1,
      type: 1,
      execute: async (_args, ctx) => {
        const start = Date.now();
        await ctx.defer();
        const end = Date.now();
        return { content: `Pong: \`${end - start}ms\`` };
      }
    }));

// Purge (self messages)
    unregisters.push(registerCommand({
      name: "purge",
      displayName: "purge",
      description: "Delete your last N messages",
      options: [{ name: "count", description: "Number to delete", type: 4, required: true }],
      applicationId: "-1",
      inputType: 1,
      type: 1,
      execute: async (args, ctx) => {
        const count = Number(args[0].value);
        const messages = findByProps("getMessages").getMessages(ctx.channel.id).array();
        const own = messages.filter((m: any) => m.author.id === UserStore.getCurrentUser().id).slice(0, count);
        for (const m of own) await MessageActions.deleteMessage(ctx.channel.id, m.id);
        return { content: `Deleted ${own.length} messages.` };
      }
    }));

// User info
    unregisters.push(registerCommand({
      name: "userinfo",
      displayName: "userinfo",
      description: "Get info about a user",
      options: [{ name: "user", description: "Target user", type: 6, required: true }],
      applicationId: "-1",
      inputType: 1,
      type: 1,
      execute: async (args) => {
        const user = UserStore.getUser(args[0].value);
        if (!user) return { content: "User not found", flags: 1 << 6 };
        return {
          content: \`
**\${user.username}#\${user.discriminator}**
ID: \${user.id}
Avatar: \${user.getAvatarURL(512)}
Created: \${new Date(user.createdAt).toLocaleString()}
\`
        };
      }
    }));

// Server info
    unregisters.push(registerCommand({
      name: "serverinfo",
      displayName: "serverinfo",
      description: "Get current server info",
      applicationId: "-1",
      inputType: 1,
      type: 1,
      execute: async (_args, ctx) => {
        const guild = findByProps("getGuild").getGuild(ctx.guild.id);
        return {
          content: \`
**\${guild.name}**
ID: \${guild.id}
Members: \${guild.memberCount}
Created: \${new Date(guild.createdAt).toLocaleString()}
\`
        };
      }
    }));

// Text transforms
    unregisters.push(registerCommand({
      name: "fliptext",
      displayName: "fliptext",
      description: "Flip your text upside-down",
      options: [{ name: "text", description: "Text to flip", type: 3, required: true }],
      applicationId: "-1",
      inputType: 1,
      type: 1,
      execute: async (args) => {
        const map: any = { 'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ᴉ','j':'ɾ','k':'ʞ','l':'ʃ','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','0':'0'};
        const input = args[0].value as string;
        const flipped = input.split('').map(c => map[c.toLowerCase()]||c).reverse().join('');
        return { content: flipped };
      }
    }));

// OwOify
    unregisters.push(registerCommand({
      name: "owoify",
      displayName: "owoify",
      description: "OwO speak",
      options: [{ name: "text", description: "Text to owo-ify", type: 3, required: true }],
      applicationId: "-1",
      inputType: 1,
      type: 1,
      execute: async (args) => {
        const txt = (args[0].value as string)
          .replace(/r|l/g, "w")
          .replace(/R|L/g, "W")
          .replace(/n([aeiou])/g, "ny$1")
          .replace(/N([aeiou])/g, "Ny$1")
          .replace(/N([AEIOU])/g, "NY$1");
        return { content: txt };
      }
    }));

// Announce embed
    unregisters.push(registerCommand({
      name: "announce",
      displayName: "announce",
      description: "Send an announcement embed",
      options: [
        { name: "title", description: "Embed title", type: 3, required: true },
        { name: "desc", description: "Embed description", type: 3, required: true }
      ],
      applicationId: "-1",
      inputType: 1,
      type: 1,
      execute: async (args, ctx) => {
        const title = args[0].value as string;
        const desc = args[1].value as string;
        MessageActions.sendMessage(ctx.channel.id, { 
          content: "", 
          embed: { title, description: desc, type: "rich", color: 0x00ff00 } 
        });
        return { content: "Announcement sent." };
      }
    }));

// Fun image filters
    const imageCmds = [
      { name: "petpet",  desc: "PetPet someone", api: "https://api.obamabot.me/v2/image/petpet" },
      { name: "triggered", desc: "Triggered GIF", api: "https://api.obamabot.me/v2/image/triggered" },
      { name: "jail",     desc: "Jail someone", api: "https://api.obamabot.me/v2/image/jail" },
      { name: "rip",      desc: "RIP tombstone", api: "https://api.obamabot.me/v2/image/rip" },
      { name: "pixelate", desc: "Pixelate avatar", api: "https://api.obamabot.me/v2/image/pixelate" }
    ];
    for (const cfg of imageCmds) unregisters.push(makeImageCommand(cfg));
  },
  onUnload() {
    unregisters.forEach(u => u());
    logger.log("Plugin unloaded");
  },
  settings: Settings
};