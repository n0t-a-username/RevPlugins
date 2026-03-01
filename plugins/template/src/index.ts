import { logger } from "@vendetta";
import Settings from "./Settings";
import GiveawaySection from "./GiveawaySection";

import { registerCommand } from "@vendetta/commands";
import { findByProps, findByStoreName, findByTypeName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";

const MessageActions = findByProps("sendMessage", "editMessage");
const UserStore = findByStoreName("UserStore");
const ChannelStore = findByProps("getChannel");

// expanded to include GET for mass-delete
const HTTP = findByProps("get", "del", "post", "put");

const commands: (() => void)[] = [];

const { receiveMessage } = findByProps("receiveMessage");
const { createBotMessage } = findByProps("createBotMessage");

const getRandomNumber = () => Math.floor(Math.random() * 100);

function sleep(ms: number) {
return new Promise(resolve => setTimeout(resolve, ms));
}

function getConfiguredWords() {
if (!Array.isArray(storage.words)) return [];
return storage.words.filter(w => typeof w === "string" && w.trim().length);
}

function randomWord() {
const words = getConfiguredWords();
if (!words.length) return "### (no spam messages configured)";
return words[Math.floor(Math.random() * words.length)];
}

commands.push(
  registerCommand({
    name: "react",
    displayName: "react",
    description: "Adds regional indicator reactions to spell a desired word",
    options: [
      {
        name: "message_id",
        displayName: "message_id",
        description: "Message ID to react to",
        required: true,
        type: 3,
      },
      {
        name: "letters",
        displayName: "letters",
        description: "Text to convert (e.g. WHAT)",
        required: true,
        type: 3,
      },
      {
        name: "delay",
        displayName: "delay",
        description: "Delay between each reaction (ms)",
        required: false,
        type: 4,
      },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,

    execute: async (args, ctx) => {
      const channelId = ctx.channel.id;
      const messageId = args.find(a => a.name === "message_id")?.value;
      const letters = args.find(a => a.name === "letters")?.value;
      const delay = Number(args.find(a => a.name === "delay")?.value ?? 0);

      if (!messageId || !letters) return;

      const text = String(letters).toUpperCase();

      const regionalMap: Record<string, string> = {
        A: "🇦", B: "🇧", C: "🇨", D: "🇩", E: "🇪",
        F: "🇫", G: "🇬", H: "🇭", I: "🇮", J: "🇯",
        K: "🇰", L: "🇱", M: "🇲", N: "🇳", O: "🇴",
        P: "🇵", Q: "🇶", R: "🇷", S: "🇸", T: "🇹",
        U: "🇺", V: "🇻", W: "🇼", X: "🇽", Y: "🇾",
        Z: "🇿",
      };

      for (const char of text) {
        const emoji = regionalMap[char];
        if (!emoji) continue;

        try {
          await HTTP.put({
            url: `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
          });

          if (delay > 0) {
            await sleep(delay);
          }
        } catch (err) {
          logger.error("Failed to add reaction:", err);
        }
      }
    },
  })
);

// ---- /raid ----
commands.push(
registerCommand({
name: "raid",
displayName: "raid",
description: "Start a raid",
options: [
{ name: "amount", displayName: "amount", description: "Number of times to send", required: true, type: 4 },
{ name: "delay", displayName: "delay", description: "Delay between messages (ms)", required: true, type: 4 },
],
applicationId: "-1",
inputType: 1,
type: 1,
execute: async (args, ctx) => {
const amount = Number(args.find(a => a.name === "amount")?.value ?? 0);
const delay = Number(args.find(a => a.name === "delay")?.value ?? 0);
if (amount <= 0) return;

for (let i = 0; i < amount; i++) {  
    const msgTemplate = randomWord();  
    const rnd = getRandomNumber();  
    const content = `${msgTemplate} \`${rnd}\``;  
    await sleep(delay);  
    MessageActions.sendMessage(  
      ctx.channel.id,  
      { content },  
      void 0,  
      { nonce: Date.now().toString() }  
    );  
  }  
},

})
);



// ---- /fetchprofile ----
commands.push(
registerCommand({
name: "fetchprofile",
displayName: "fetchprofile",
description: "Fetch a user's avatar",
options: [
{ name: "user", displayName: "user", description: "Mention or ID of the user", required: true, type: 3 }
],
applicationId: "-1",
inputType: 1,
type: 1,
execute: async (args, ctx) => {
const input = args.find(a => a.name === "user")?.value?.trim();
if (!input) return;

const userId = input.replace(/[<@!>]/g, "");  
  const user = UserStore.getUser(userId);  

  if (!user) {  
    MessageActions.sendMessage(  
      ctx.channel.id,  
      { content: "❌ User not found" },  
      void 0,  
      { nonce: Date.now().toString() }  
    );  
    return;  
  }  

  const avatarUrl =  
    user.getAvatarURL?.({ format: "png", size: 512 }) ||  
    `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`;  

  const currentUser = UserStore.getCurrentUser();  

  receiveMessage(  
    ctx.channel.id,  
    Object.assign(  
      createBotMessage({ channelId: ctx.channel.id, content: avatarUrl }),  
      { author: currentUser }  
    )  
  );  
},

})
);

// ---- /mcs ----
commands.push(
  registerCommand({
    name: "mcs",
    displayName: "mcs",
    description: "Send a message in every channel",
    options: [
      {
        name: "message",
        displayName: "message",
        description: "Type a message to broadcast",
        required: true,
        type: 3,
      },
      {
        name: "delay",
        displayName: "delay",
        description: "Delay between messages (ms)",
        required: false,
        type: 4,
      },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const guildId = ctx.channel.guild_id;
      if (!guildId) return;

      const message = args.find(a => a.name === "message")?.value;
      const delay = Number(args.find(a => a.name === "delay")?.value ?? 500);

      if (!message || !message.trim().length) return;

      const currentUser = UserStore.getCurrentUser();

      try {
        const res = await HTTP.get({ url: `/guilds/${guildId}/channels` });
        const channels = res?.body;

        if (!Array.isArray(channels)) return;

        let sent = 0;

        for (const ch of channels) {
          // Only normal text + announcement channels
          if (ch.type !== 0 && ch.type !== 5) continue;

          try {
            await sleep(delay);

            MessageActions.sendMessage(
              ch.id,
              { content: message },
              void 0,
              { nonce: Date.now().toString() }
            );

            sent++;
          } catch {}
        }

        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({
              channelId: ctx.channel.id,
              content: `📢 Message was sent to ${sent} channel(s).`,
            }),
            { author: currentUser }
          )
        );
      } catch (err) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({
              channelId: ctx.channel.id,
              content: `⚠️ Message failed: ${String(err)}`,
            }),
            { author: currentUser }
          )
        );
      }
    },
  })
);



// ---- /purge ----
commands.push(
registerCommand({
  name: "purge",
  displayName: "purge",
  description: "Delete messages in this channel, optionally only your own",
  options: [
    { name: "amount", displayName: "amount", description: "Number of messages to delete", required: false, type: 4 },
    { name: "self", displayName: "self", description: "true = delete only your messages, false = delete all", required: true, type: 5 },
    { name: "delay", displayName: "delay", description: "Delay between deletions in ms", required: false, type: 4 },
  ],
  applicationId: "-1",
  inputType: 1,
  type: 1,
  execute: async (args, ctx) => {
    const currentUser = UserStore.getCurrentUser();
    const myId = currentUser.id;
    const channelId = ctx.channel.id;

    const amount = Number(args.find(a => a.name === "amount")?.value ?? 50);
    const selfOnly = args.find(a => a.name === "self")?.value ?? true;
    const delay = Number(args.find(a => a.name === "delay")?.value ?? 100);

    try {
      const res = await HTTP.get({ url: `/channels/${channelId}/messages?limit=100` });
      const messages = res?.body;
      if (!Array.isArray(messages)) return;

      let toDelete: any[];

      if (selfOnly) {
        // Filter FIRST, then slice
        toDelete = messages
          .filter((m: any) => m.author?.id === myId)
          .slice(0, amount);
      } else {
        // Normal behavior
        toDelete = messages.slice(0, amount);
      }

      let deletedCount = 0;

      for (const msg of toDelete) {
        try {
          await HTTP.del({ url: `/channels/${channelId}/messages/${msg.id}` });
          deletedCount++;
          await sleep(delay);
        } catch {}
      }

      receiveMessage(
        channelId,
        Object.assign(
          createBotMessage({
            channelId,
            content: `🧹 Purged ${deletedCount} message(s)${selfOnly ? " (self-only)" : ""}.`,
          }),
          { author: currentUser }
        )
      );

    } catch (err) {
      receiveMessage(
        channelId,
        Object.assign(
          createBotMessage({
            channelId,
            content: `⚠️ Purge failed: ${String(err)}`,
          }),
          { author: currentUser }
        )
      );
    }
  },
})
);

// ---- /lockdown ----
commands.push(
registerCommand({
name: "lockdown",
displayName: "lockdown",
description: "Toggle full server privacy",
options: [
{
name: "enabled",
displayName: "enabled",
description: "true = private all channels, false = restore",
required: true,
type: 5,
},
{
name: "delay",
displayName: "delay",
description: "Delay between updates (ms)",
required: false,
type: 4,
},
],
applicationId: "-1",
inputType: 1,
type: 1,
execute: async (args, ctx) => {

const guildId = ctx.channel.guild_id;
if (!guildId) return;

const enabled = args.find(a => a.name === "enabled")?.value;
const delay = Number(args.find(a => a.name === "delay")?.value ?? 300);
const currentUser = UserStore.getCurrentUser();

if (!storage.lockdownCache) storage.lockdownCache = {};

try {

const res = await HTTP.get({ url: `/guilds/${guildId}/channels` });
const channels = res?.body;

if (!Array.isArray(channels)) return;

let affected = 0;

for (const ch of channels) {

if (ch.type !== 0 && ch.type !== 5) continue;

await sleep(delay);

// Cache original overwrites once
if (!(ch.id in storage.lockdownCache)) {
storage.lockdownCache[ch.id] = ch.permission_overwrites ?? [];
}

let newOverwrites = [...(ch.permission_overwrites ?? [])];

const everyoneIndex = newOverwrites.findIndex(o => o.id === guildId);

if (enabled) {

// Create or modify @everyone overwrite
if (everyoneIndex !== -1) {

const overwrite = newOverwrites[everyoneIndex];

newOverwrites[everyoneIndex] = {
...overwrite,
deny: (
BigInt(overwrite.deny ?? 0) |
BigInt(1 << 10) | // VIEW_CHANNEL
BigInt(1 << 11)   // SEND_MESSAGES
).toString(),
};

} else {

newOverwrites.push({
id: guildId,
type: 0,
allow: "0",
deny: (
BigInt(1 << 10) |
BigInt(1 << 11)
).toString(),
});

}

} else {

// Restore original overwrites
newOverwrites = storage.lockdownCache[ch.id] ?? [];
}

await HTTP.patch({
url: `/channels/${ch.id}`,
body: {
permission_overwrites: newOverwrites
}
});

affected++;
}

if (!enabled) storage.lockdownCache = {};

receiveMessage(
ctx.channel.id,
Object.assign(
createBotMessage({
channelId: ctx.channel.id,
content: enabled
? `🔒 ${affected} channel(s) privatized.`
: `🔓 ${affected} channel(s) restored.`,
}),
{ author: currentUser }
)
);

} catch (err) {

receiveMessage(
ctx.channel.id,
Object.assign(
createBotMessage({
channelId: ctx.channel.id,
content: `⚠️ Lockdown failed: ${String(err)}`,
}),
{ author: currentUser }
)
);

}

},
})
);

// ---- /userid ----
commands.push(
  registerCommand({
    name: "userid",
    displayName: "userid",
    description: "Displays a user's ID",
    options: [
      { name: "user", displayName: "user", description: "Mention or ID of the user", required: true, type: 3 }
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: (args, ctx) => {
      const input = args.find(a => a.name === "user")?.value?.trim();
      if (!input) return;

      const userId = input.replace(/[<@!>]/g, "");
      const user = UserStore.getUser(userId);
      const currentUser = UserStore.getCurrentUser();

      if (!user) {
        // ❌ User not found as a bot message
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({
              channelId: ctx.channel.id,
              content: "❌ User not found"
            }),
            { author: currentUser }
          )
        );
        return;
      }

      // ✅ User found
      const content = `ID: ${user.id}`;
      receiveMessage(
        ctx.channel.id,
        Object.assign(
          createBotMessage({
            channelId: ctx.channel.id,
            content
          }),
          { author: currentUser }
        )
      );
    },
  })
);

// ---- /mass-ping ----
commands.push(
registerCommand({
name: "msp",
displayName: "msp",
description: "Outputs all user IDs collected from the selective mass ping button",
options: [
{
name: "clear",
displayName: "clear",
description: "Clear the ping list",
required: false,
type: 5,
},
],
applicationId: "-1",
inputType: 1,
type: 1,
execute: (args, ctx) => {
const shouldClear = args.find(a => a.name === "clear")?.value ?? false;
const currentUser = UserStore.getCurrentUser();
const list = storage.eventGiveawayPing?.trim() ?? "";

if (shouldClear === true) {  
    const wasEmpty = !list;  
    storage.eventGiveawayPing = "";  

    receiveMessage(  
      ctx.channel.id,  
      Object.assign(  
        createBotMessage({  
          channelId: ctx.channel.id,  
          content: wasEmpty  
            ? "⚠️ Ping list was already empty."  
            : "✅ Ping list cleared."  
        }),  
        { author: currentUser }  
      )  
    );  
    return;  
  }  

  if (!list) {  
    receiveMessage(  
      ctx.channel.id,  
      Object.assign(  
        createBotMessage({  
          channelId: ctx.channel.id,  
          content: "⚠️ No users in the ping list."  
        }),  
        { author: currentUser }  
      )  
    );  
    return;  
  }  

  const formatted = list.split("\n").join(", ");  

  MessageActions.sendMessage(  
    ctx.channel.id,  
    { content: `Wake up: \n${formatted}` },  
    void 0,  
    { nonce: Date.now().toString() }  
  );  
},

})
);

// ---- /delete-channel ----
commands.push(
  registerCommand({
    name: "delete-channel",
    displayName: "delete-channel",
    description: "Deletes a selected channel",
    options: [
      {
        name: "channel",
        displayName: "Channel",
        description: "Select the channel to delete",
        required: true,
        type: 7, // Channel select
      },
      {
        name: "delay",
        displayName: "Delay",
        description: "Delay before deletion in ms",
        required: false,
        type: 4, // Integer
      },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const selectedChannelId = args.find(a => a.name === "channel")?.value;
      const delay = Number(args.find(a => a.name === "delay")?.value ?? 0);
      if (!selectedChannelId) return;

      const channel = ChannelStore.getChannel(selectedChannelId);
      const currentUser = UserStore.getCurrentUser();

      if (!channel) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: "❌ Invalid channel." }),
            { author: currentUser }
          )
        );
        return;
      }

      if (delay > 0) await sleep(delay);

      try {
        await HTTP.del({ url: `/channels/${selectedChannelId}` });
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: "🗑️ Channel deleted successfully." }),
            { author: currentUser }
          )
        );
      } catch (err) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: `⚠️ Delete failed: ${String(err)}` }),
            { author: currentUser }
          )
        );
      }
    },
  })
);

// ---- /mass-delete ----
commands.push(
registerCommand({
name: "nuke",
displayName: "nuke",
description: "Deletes all channels in a server",
options: [
{
name: "delay",
displayName: "delay",
description: "Delay between each channel deletion in ms",
required: false,
type: 4,
},
],
applicationId: "-1",
inputType: 1,
type: 1,
execute: async (args, ctx) => {
const guildId = ctx.channel.guild_id;
if (!guildId) return;
const delay = Number(args.find(a => a.name === "delay")?.value ?? 400);
const currentUser = UserStore.getCurrentUser();

try {  
    const res = await HTTP.get({ url: `/guilds/${guildId}/channels` });  
    const channels = res?.body;  

    if (!Array.isArray(channels) || !channels.length) {  
      receiveMessage(ctx.channel.id, Object.assign(createBotMessage({ channelId: ctx.channel.id, content: "⚠️ No channels found." }), { author: currentUser }));  
      return;  
    }  

    let deleted = 0;  
    for (const ch of channels) {  
      try {  
        await HTTP.del({ url: `/channels/${ch.id}` });  
        deleted++;  
        await sleep(delay);  
      } catch {}  
    }  

    // Auto-create default text channel after deletion  
    await HTTP.post({  
      url: `/guilds/${guildId}/channels`,  
      body: { name: "nuked-by-bemmo", type: 0 }  
    });  

    receiveMessage(ctx.channel.id, Object.assign(createBotMessage({ channelId: ctx.channel.id, content: `🗑️ Deleted ${deleted} channel(s).\n✅ Created default channel #general` }), { author: currentUser }));  

  } catch (err) {  
    receiveMessage(ctx.channel.id, Object.assign(createBotMessage({ channelId: ctx.channel.id, content: `⚠️ Delete failed: ${String(err)}` }), { author: currentUser }));  
  }  
},

})
);

// ---- /duplicate-channel ----
commands.push(
registerCommand({
name: "dupe-channel",
displayName: "dupe-channel",
description: "Duplicates a selected channel a number of times with a delay",
options: [
{
name: "channel",
displayName: "channel",
description: "Select a channel to duplicate",
required: true,
type: 7, // Channel select
},
{
name: "amount",
displayName: "amount",
description: "Number of duplicates to create",
required: true,
type: 4,
},
{
name: "delay",
displayName: "delay",
description: "Delay between creating duplicates (ms)",
required: false,
type: 4,
},
],
applicationId: "-1",
inputType: 1,
type: 1,
execute: async (args, ctx) => {
const selectedChannelId = args.find(a => a.name === "channel")?.value;
const amount = Number(args.find(a => a.name === "amount")?.value ?? 0);
const delay = Number(args.find(a => a.name === "delay")?.value ?? 400);
if (!selectedChannelId || amount <= 0) return;

const guildId = ctx.channel.guild_id;  
  if (!guildId) return;  

  const channelData: any = await HTTP.get({ url: `/channels/${selectedChannelId}` }).then(r => r.body).catch(() => null);  
  if (!channelData) {  
    const currentUser = UserStore.getCurrentUser();  
    receiveMessage(ctx.channel.id, Object.assign(createBotMessage({ channelId: ctx.channel.id, content: "❌ Failed to fetch the channel data." }), { author: currentUser }));  
    return;  
  }  

  let created = 0;  
  const currentUser = UserStore.getCurrentUser();  
  for (let i = 0; i < amount; i++) {  
    try {  
      await sleep(delay);  
      await HTTP.post({  
        url: `/guilds/${guildId}/channels`,  
        body: {  
          name: channelData.name,  
          type: channelData.type,  
          topic: channelData.topic,  
          nsfw: channelData.nsfw,  
          parent_id: channelData.parent_id,  
          permission_overwrites: channelData.permission_overwrites,  
          bitrate: channelData.bitrate,  
          user_limit: channelData.user_limit  
        }  
      });  
      created++;  
    } catch {}  
  }  

  receiveMessage(ctx.channel.id, Object.assign(createBotMessage({ channelId: ctx.channel.id, content: `✅ Duplicated channel **${channelData.name}** ${created} time(s).` }), { author: currentUser }));  
},

})
);



// ---- Patch User Profiles ----
let UserProfile = findByTypeName("UserProfile");
if (!UserProfile) UserProfile = findByTypeName("UserProfileContent");

after("type", UserProfile, (args, ret) => {
const profileSections = ret?.props?.children;
if (!profileSections) return;

const userId = args[0]?.userId ?? args[0]?.user?.id;
if (!userId) return;

profileSections.push(
React.createElement(GiveawaySection, { userId })
);
});

// ---- Plugin lifecycle ----
export default {
onLoad: () =>
logger.log("All commands loaded: Raid, FetchProfile, UserID, MassPing, DeleteChannel, MassDelete, DuplicateChannel, EventPing"),
onUnload: () => {
for (const unregister of commands) unregister();
logger.log("Plugin unloaded.");
},
settings: Settings,
};
