import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const MessageActions = findByProps("sendMessage", "editMessage");
const UserStore = findByProps("getUser");

const commands = [];

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

// ======== /raid command ========
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

// ======== /fetchprofile command ========
commands.push(
  registerCommand({
    name: "fetchprofile",
    displayName: "Fetch Profile",
    description: "Fetch info about a Discord user by mention or ID",
    options: [
      {
        name: "user",
        displayName: "user",
        description: "User mention or ID",
        required: true,
        type: 3 // String
      }
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,

    execute: async (args, ctx) => {
      const input = args.find(a => a.name === "user")?.value?.trim();
      if (!input) return;

      // Extract ID if input is a mention <@!ID>
      const userId = input.replace(/[<@!>]/g, "");
      const user = UserStore.getUser(userId);

      if (!user) {
        MessageActions.sendMessage(
          ctx.channel.id,
          { content: `❌ Could not find user with ID or mention: ${input}` },
          void 0,
          { nonce: Date.now().toString() }
        );
        return;
      }

      const username = `${user.username}#${user.discriminator}`;
      const avatarUrl = user.getAvatarURL?.() || `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`;
      const botText = user.bot ? "Yes 🤖" : "No";
      const createdAt = new Date(user.id / 4194304 + 1420070400000).toUTCString(); // Discord snowflake to timestamp

      const content = `**Profile Info for ${username}**
ID: \`${user.id}\`
Bot: ${botText}
Created: ${createdAt}
Avatar: ${avatarUrl}`;

      MessageActions.sendMessage(
        ctx.channel.id,
        { content },
        void 0,
        { nonce: Date.now().toString() }
      );
    }
  })
);

// ======== Export ========
export default {
  onLoad: () => {
    logger.log("Raid + ProfileFetch plugin loaded!");
  },

  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Raid + ProfileFetch plugin unloaded.");
  },

  settings: Settings
};
