import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";

const MessageActions = findByProps("sendMessage", "receiveMessage");
const ChannelActions = findByProps("createChannel", "deleteChannel");
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

commands.push(registerCommand({
  name: "spam",
  displayName: "spam",
  description: "Spam a random meme message",
  options: [
    { name: "amount", description: "Number of times to send", required: true, type: 4 },
    { name: "delay", description: "Delay between messages (ms)", required: true, type: 4 }
  ],
  applicationId: "-1",
  inputType: 1,
  type: 1,
  execute: async (args, ctx) => {
    const amount = Number(args[0].value);
    const delay = Number(args[1].value);
    for (let i = 0; i < amount; i++) {
      const msgTemplate = randomWord(words);
      const rnd = getRandomNumber();
      const content = `${msgTemplate} \`${rnd}\``;
      await sleep(delay);
      MessageActions.sendMessage(ctx.channel.id, { content });
    }
  }
}));

commands.push(registerCommand({
  name: "createchannel",
  displayName: "createchannel",
  description: "Create a new text channel",
  options: [
    { name: "name", description: "Channel name", required: true, type: 3 }
  ],
  applicationId: "-1",
  inputType: 1,
  type: 1,
  execute: async (args, ctx) => {
    const name = args[0].value;
    ChannelActions.createChannel(ctx.guild.id, { name, type: 0 });
    MessageActions.sendMessage(ctx.channel.id, { content: `Channel '${name}' created.` });
  }
}));

commands.push(registerCommand({
  name: "deletechannel",
  displayName: "deletechannel",
  description: "Delete a specified channel",
  options: [
    { name: "channel", description: "Channel to delete", required: true, type: 7 }
  ],
  applicationId: "-1",
  inputType: 1,
  type: 1,
  execute: async (args, ctx) => {
    const channelId = args[0].value;
    ChannelActions.deleteChannel(channelId);
    MessageActions.sendMessage(ctx.channel.id, { content: `Channel <#${channelId}> deleted.` });
  }
}));

export default {
  onLoad: () => {
    logger.log("Plugin loaded");
  },
  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Plugin unloaded");
  },
  settings: Settings
};