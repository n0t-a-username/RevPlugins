import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const MessageActions = findByProps("sendMessage", "editMessage");
const ChannelActions = findByProps("deleteChannel");

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
      {
        name: "amount",
        displayName: "amount",
        description: "Number of times to send",
        required: true,
        type: 4
      },
      {
        name: "delay",
        displayName: "delay",
        description: "Delay between messages (ms)",
        required: true,
        type: 4
      }
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

// ======== /deletechannels command (current channel only) ========
commands.push(
  registerCommand({
    name: "deletechannels",
    displayName: "Delete Channel",
    description: "Deletes the channel you run this command in (must have permission)",
    options: [], // No arguments needed
    applicationId: "-1",
    inputType: 1,
    type: 1,

    execute: async (_args, ctx) => {
      const channelId = ctx.channel.id;

      // Safety: confirm deletion via message
      MessageActions.sendMessage(
        ctx.channel.id,
        { content: `⚠️ Deleting this channel: <#${channelId}>` },
        void 0,
        { nonce: Date.now().toString() }
      );

      try {
        await ChannelActions.deleteChannel(channelId);
      } catch (err: any) {
        console.error("Failed to delete channel:", err);
        MessageActions.sendMessage(
          ctx.channel.id,
          { content: `❌ Failed to delete channel: ${err.message}` },
          void 0,
          { nonce: Date.now().toString() }
        );
      }
    }
  })
);

// ======== Export ========
export default {
  onLoad: () => {
    logger.log("Raid + DeleteChannels plugin loaded!");
  },

  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Raid + DeleteChannels plugin unloaded.");
  },

  settings: Settings
};
