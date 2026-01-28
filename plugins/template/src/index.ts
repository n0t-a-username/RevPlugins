import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const MessageActions = findByProps("sendMessage", "editMessage");
const commands = [];

// ---- Utilities ----
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

// ---- Bemmo bot message helper ----
const UserStore = findByStoreName("UserStore");
const { receiveMessage, createBotMessage } = findByProps("receiveMessage", "createBotMessage");

function sendBemmoMessage(channelId: string, content: string) {
  const author = UserStore.getCurrentUser(); // plugin user's avatar
  receiveMessage(
    channelId,
    Object.assign(
      createBotMessage({ channelId, content }),
      { author }
    )
  );
}

// ---- /raid ----
commands.push(
  registerCommand({
    name: "raid",
    displayName: "raid",
    description: "Start a Raid!",
    options: [
      { name: "amount", displayName: "amount", description: "Number of times to send", required: true, type: 4 },
      { name: "delay", displayName: "delay", description: "Delay between messages (ms)", required: true, type: 4 }
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
    }
  })
);

// ---- /fetchprofile ----
commands.push(
  registerCommand({
    name: "fetchprofile",
    displayName: "Fetch Profile",
    description: "Displays a user's profile link",
    options: [{ name: "user", displayName: "user", description: "User to fetch", required: true, type: 6 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: (args, ctx) => {
      const userId = args.find(a => a.name === "user")?.value;
      if (!userId) return;

      const user = UserStore.getUser(userId);
      if (!user) return;

      const content = `https://discord.com/users/${user.id}`;
      sendBemmoMessage(ctx.channel.id, content);
    }
  })
);

// ---- /userid ----
commands.push(
  registerCommand({
    name: "userid",
    displayName: "User ID",
    description: "Displays a user's ID",
    options: [{ name: "user", displayName: "user", description: "User to fetch ID for", required: true, type: 6 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: (args, ctx) => {
      const userId = args.find(a => a.name === "user")?.value;
      if (!userId) return;

      const user = UserStore.getUser(userId);
      if (!user) return;

      const content = `${user.username}'s ID: ${user.id}`;
      sendBemmoMessage(ctx.channel.id, content);
    }
  })
);

// ---- /pingrandom (simplified: 1 random user, include bots) ----
commands.push(
  registerCommand({
    name: "pingrandom",
    displayName: "Ping Random User",
    description: "Ping a single random user",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: (args, ctx) => {
      if (!ctx.guildId) return;

      const GuildMemberStore = findByStoreName("GuildMemberStore");
      if (!GuildMemberStore) return;

      const members = Object.values(GuildMemberStore.getGuildMembers(ctx.guildId) || {}).map(m => m.user);
      if (!members.length) return;

      const selected = members[Math.floor(Math.random() * members.length)];
      const mention = `<@${selected.id}>`;

      MessageActions.sendMessage(
        ctx.channel.id,
        { content: mention },
        void 0,
        { nonce: Date.now().toString() }
      );
    }
  })
);

// ---- Plugin lifecycle ----
export default {
  onLoad: () => {
    logger.log("Raid plugin loaded!");
  },
  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Raid plugin unloaded.");
  },
  settings: Settings
};
