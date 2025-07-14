import { logger } from "@vendetta";
import Settings from "./Settings";
import { registerCommand } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";

const MessageActions = findByProps("sendMessage", "receiveMessage");
const commands = [];

const getRandomNumber = (max = 100) => Math.floor(Math.random() * max);
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const spamWords = [
  "### Get Raided LOL!",
  "### BOZO ASS SERVER!",
  "### I should have brought a condom because this server has no protection",
  "### Look I did the funny",
  "# Hey look || @everyone ||",
  "# Sorry for the ping || @here ||",
  "### This server is getting raided by a plugin LMAO!!!",
  "### Skill Issue",
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// /spam
commands.push(
  registerCommand({
    name: "spam",
    displayName: "spam",
    description: "Spam a random meme message",
    options: [
      { name: "amount", displayName: "amount", description: "times", required: true, type: 4 },
      { name: "delay", displayName: "delay(ms)", description: "delay between messages", required: true, type: 4 },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const amount = Number(args[0].value);
      const delay = Number(args[1].value);
      for (let i = 0; i < amount; i++) {
        const content = `${randomFrom(spamWords)} \`${getRandomNumber()}\``;
        await sleep(delay);
        MessageActions.sendMessage(ctx.channel.id, { content });
      }
    },
  })
);

// /ping
commands.push(
  registerCommand({
    name: "ping",
    displayName: "ping",
    description: "Check plugin latency",
    options: [],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (_, ctx) => {
      const start = Date.now();
      await MessageActions.sendMessage(ctx.channel.id, { content: "Pinging..." });
      const latency = Date.now() - start;
      MessageActions.sendMessage(ctx.channel.id, { content: `Pong! ${latency}ms` });
    },
  })
);

// /echo
commands.push(
  registerCommand({
    name: "echo",
    displayName: "echo",
    description: "Echo your message",
    options: [{ name: "text", displayName: "text", description: "what to echo", required: true, type: 3 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const text = args[0].value;
      MessageActions.sendMessage(ctx.channel.id, { content: text });
    },
  })
);

// /roll
commands.push(
  registerCommand({
    name: "roll",
    displayName: "roll",
    description: "Roll a d# dice (e.g. d6, d20)",
    options: [{ name: "sides", displayName: "sides", description: "number of sides", required: true, type: 4 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const sides = Number(args[0].value);
      const result = getRandomNumber(sides) + 1;
      MessageActions.sendMessage(ctx.channel.id, { content: `You rolled a d${sides}: **${result}**` });
    },
  })
);

// /meme (placeholder)
commands.push(
  registerCommand({
    name: "meme",
    displayName: "meme",
    description: "Fetch a random meme",
    options: [],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (_, ctx) => {
      try {
        const memeUrl = "https://i.imgur.com/randomMeme.jpg"; // replace with real API later
        MessageActions.sendMessage(ctx.channel.id, { content: memeUrl });
      } catch (e) {
        MessageActions.sendMessage(ctx.channel.id, { content: "Failed to fetch meme lol." });
      }
    },
  })
);

export default {
  onLoad: () => {
    logger.log("Spam plugin with extras loaded!");
  },
  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Spam plugin unloaded.");
  },
  settings: Settings,
};
