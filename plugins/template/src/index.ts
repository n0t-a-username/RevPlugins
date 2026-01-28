import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const UserStore = findByStoreName("UserStore");
const MessageActions = findByProps("sendMessage", "editMessage");
const { receiveMessage } = findByProps("receiveMessage");
const { createBotMessage } = findByProps("createBotMessage");

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

// ======== /raid command (normal messages) ========
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

        // Send normal message as your account
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

// ======== /fetchprofile command (Bemmo, avatar only) ========
const avatarIndexMap: Record<string, number> = {};

commands.push(
  registerCommand({
    name: "fetchprofile",
    displayName: "Fetch Profile",
    description: "Get a user's avatar (Bemmo message)",
    options: [
      {
        name: "user",
        displayName: "user",
        description: "User mention or ID",
        required: true,
        type: 3
      }
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
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({
              channelId: ctx.channel.id,
              content: `❌ User not found`,
            }),
            {
              author: { 
                username: "Bemmo", 
                avatar: "https://cdn.discordapp.com/avatars/1349946018132787333/3cacc98160499f04ed8927e201e690d2.webp?size=480", 
                id: "1" 
              },
            }
          )
        );
        return;
      }

      // Cycle avatar URLs
      const avatarPng = user.getAvatarURL?.({ format: "png", size: 512 });
      const avatarGif = user.getAvatarURL?.({ format: "gif", size: 512 });
      const avatars = [];
      if (avatarGif && avatarGif !== avatarPng) avatars.push(avatarGif);
      if (avatarPng) avatars.push(avatarPng);
      if (!avatars.length) avatars.push(`https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`);

      const idx = avatarIndexMap[user.id] ?? 0;
      const avatarToSend = avatars[idx % avatars.length];
      avatarIndexMap[user.id] = (idx + 1) % avatars.length;

      // Send avatar as "Bemmo" with image attachment
      receiveMessage(
        ctx.channel.id,
        Object.assign(
          createBotMessage({
            channelId: ctx.channel.id,
            content: "",
            attachments: [
              {
                url: avatarToSend,
                proxy_url: avatarToSend,
                id: "avatar-" + Date.now(),
                filename: "avatar.png",
                content_type: "image/png",
                size: 0,
              },
            ],
          }),
          {
            author: { 
              username: "Bemmo", 
              avatar: "https://cdn.discordapp.com/avatars/1349946018132787333/3cacc98160499f04ed8927e201e690d2.webp?size=480", 
              id: "1" 
            },
          }
        )
      );
    }
  })
);

// ======== Export ========
export default {
  onLoad: () => {
    logger.log("Raid + Bemmo FetchProfile plugin loaded!");
  },

  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Raid + Bemmo FetchProfile plugin unloaded.");
  },

  settings: Settings
};
