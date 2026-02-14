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
const HTTP = findByProps("del", "post", "put");

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

// ---- /raid ----
commands.push(
  registerCommand({
    name: "raid",
    displayName: "raid",
    description: "Start a Raid!",
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
    displayName: "Fetch Profile",
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

// ---- /userid ----
commands.push(
  registerCommand({
    name: "userid",
    displayName: "User ID",
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

      if (!user) {
        MessageActions.sendMessage(
          ctx.channel.id,
          { content: "❌ User not found" },
          void 0,
          { nonce: Date.now().toString() }
        );
        return;
      }

      const content = `<@${user.id}>`;
      const currentUser = UserStore.getCurrentUser();

      receiveMessage(
        ctx.channel.id,
        Object.assign(
          createBotMessage({ channelId: ctx.channel.id, content }),
          { author: currentUser }
        )
      );
    },
  })
);

// ---- /mass-ping ----
commands.push(
  registerCommand({
    name: "mass-ping",
    displayName: "Mass Ping",
    description: "Outputs all user IDs collected from the mass ping button",
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
      const shouldClear =
        args.find(a => a.name === "clear")?.value ?? false;

      const currentUser = UserStore.getCurrentUser();
      const list = storage.eventGiveawayPing.trim();

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

// ---- /delete-channel (HTTP VERSION) ----
commands.push(
  registerCommand({
    name: "delete-channel",
    displayName: "Delete Channel",
    description: "Deletes a channel using its ID",
    options: [
      {
        name: "channel_id",
        displayName: "channel_id",
        description: "ID of the channel to delete",
        required: true,
        type: 3,
      },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const channelId = args.find(a => a.name === "channel_id")?.value;
      if (!channelId) return;

      const channel = ChannelStore.getChannel(channelId);

      if (!channel) {
        receiveMessage(
          ctx.channel.id,
          createBotMessage({
            channelId: ctx.channel.id,
            content: "❌ Invalid channel ID."
          })
        );
        return;
      }

      try {
        await HTTP.del({
          url: `/channels/${channelId}`
        });

        receiveMessage(
          ctx.channel.id,
          createBotMessage({
            channelId: ctx.channel.id,
            content: "🗑️ Channel deleted successfully."
          })
        );
      } catch (err) {
        receiveMessage(
          ctx.channel.id,
          createBotMessage({
            channelId: ctx.channel.id,
            content: `⚠️ Delete failed: ${String(err)}`
          })
        );
      }
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
    logger.log("Raid + FetchProfile + UserID + Giveaway + DeleteChannel plugin loaded!"),
  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Plugin unloaded.");
  },
  settings: Settings,
};
