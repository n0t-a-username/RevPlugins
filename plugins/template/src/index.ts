import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const MessageActions = findByProps("sendMessage", "editMessage");
const UserStore = findByStoreName("UserStore");
const commands: (() => void)[] = [];

const { receiveMessage, createBotMessage } = findByProps("receiveMessage", "createBotMessage");

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
function sendBemmoMessage(channelId: string, content: string) {
  const author = UserStore.getCurrentUser(); // Bemmo uses your avatar
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
    description: "Fetch a user's avatar as Bemmo",
    options: [{ name: "user", displayName: "user", description: "Mention or ID of the user", required: true, type: 3 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const input = args.find(a => a.name === "user")?.value?.trim();
      if (!input) return;

      const userId = input.replace(/[<@!>]/g, "");
      const user = UserStore.getUser(userId);
      if (!user) return;

      const avatarUrl =
        user.getAvatarURL?.({ format: "png", size: 512 }) ||
        `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`;

      sendBemmoMessage(ctx.channel.id, avatarUrl);
    }
  })
);

// ---- /userid ----
commands.push(
  registerCommand({
    name: "userid",
    displayName: "User ID",
    description: "Displays a user's ID",
    options: [{ name: "user", displayName: "user", description: "User to fetch ID for", required: true, type: 3 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: (args, ctx) => {
      const input = args.find(a => a.name === "user")?.value?.trim();
      if (!input) return;

      const userId = input.replace(/[<@!>]/g, "");
      const user = UserStore.getUser(userId);
      if (!user) return;

      sendBemmoMessage(ctx.channel.id, `${user.username}'s ID: ${user.id}`);
    }
  })
);

// ---- /pingrandom (1 random user, safe) ----
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

      try {
        const GuildMemberStore = findByStoreName("GuildMemberStore");
        if (!GuildMemberStore) return;

        const guildMembers = GuildMemberStore.getGuildMembers(ctx.guildId) || {};
        const memberIds = Object.keys(guildMembers);
        if (!memberIds.length) return;

        // Random member ID
        const selectedId = memberIds[Math.floor(Math.random() * memberIds.length)];
        const selectedUser = UserStore.getUser(selectedId);
        if (!selectedUser) return;

        MessageActions.sendMessage(
          ctx.channel.id,
          { content: `<@${selectedUser.id}>` },
          void 0,
          { nonce: Date.now().toString() }
        );
      } catch (e) {
        console.error("PingRandom failed", e);
      }
    }
  })
);

// ---- Plugin lifecycle ----
export default {
  onLoad: () => logger.log("Raid + FetchProfile + UserID + PingRandom plugin loaded!"),
  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Plugin unloaded.");
  },
  settings: Settings,
};
