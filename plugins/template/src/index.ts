import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps, findByStoreName } from "@vendetta/metro";

const MessageActions = findByProps("sendMessage", "editMessage");
const UserStore = findByStoreName("UserStore");
const commands: (() => void)[] = [];

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

// /raid command
commands.push(
  registerCommand({
    name: "raid",
    displayName: "raid",
    description: "Start a Raid!",
    options: [
      {
        name: "amount",
        displayName: "amount",
        description: "Number of times to send",
        required: true,
        type: 4,
      },
      {
        name: "delay",
        displayName: "delay",
        description: "Delay between messages (ms)",
        required: true,
        type: 4,
      },
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

// /fetchprofile command
commands.push(
  registerCommand({
    name: "fetchprofile",
    displayName: "Fetch Profile",
    description: "Fetch a user's avatar as Bemmo",
    options: [
      {
        name: "user",
        displayName: "user",
        description: "Mention or ID of the user",
        required: true,
        type: 3,
      },
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

      // Get avatar URL
      const avatarUrl =
        user.getAvatarURL?.({ format: "png", size: 512 }) ||
        `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`;

      // Send as Bemmo bot message using your avatar
      const currentUser = UserStore.getCurrentUser();
      receiveMessage(
        ctx.channel.id,
        Object.assign(
          createBotMessage({
            channelId: ctx.channel.id,
            content: avatarUrl, // just send the URL
          }),
          { author: currentUser } // Bemmo uses your avatar
        )
      );
    },
  })
);

export default {
  onLoad: () => {
    logger.log("Raid + FetchProfile plugin loaded!");
  },
  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Raid + FetchProfile plugin unloaded.");
  },
  settings: Settings,
};
