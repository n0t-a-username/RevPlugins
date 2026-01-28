import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";

const MessageActions = findByProps("sendMessage", "editMessage");
const commands = [];

const getRandomNumber = () => Math.floor(Math.random() * 100);

const words = [
  "### Get Raided LOL!",
  "### BOZO ASS SERVER!",
  "### I should have brought a condom because this server has no protection",
  "### Look I did the funny",
  "# Hey look || @everyone ||",
  "# Sorry for the ping || @here ||",
  "### This server is getting raided by a plugin LMAO!!!",
  "### Skill Issue"
];

function randomWord(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

      if (!amount || amount <= 0) return;

      for (let i = 0; i < amount; i++) {
        const msgTemplate = randomWord(words);
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
