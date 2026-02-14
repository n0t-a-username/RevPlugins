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
      const shouldClear = args.find(a => a.name === "clear")?.value ?? false;
      const currentUser = UserStore.getCurrentUser();
      const list = storage.eventGiveawayPing.trim();

      // CLEAR MODE
      if (shouldClear === true) {
        storage.eventGiveawayPing = "";
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: "✅ Ping list cleared." }),
            { author: currentUser }
          )
        );
        return;
      }

      // NORMAL MODE
      if (!list) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: "⚠️ No users in the ping list." }),
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

// ---- /delete-category ----
commands.push(
  registerCommand({
    name: "delete-category",
    displayName: "Delete Category",
    description: "Deletes a category and all channels within it",
    options: [
      { name: "categoryid", displayName: "categoryid", description: "ID of the category to delete", required: true, type: 3 },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const categoryId = args.find(a => a.name === "categoryid")?.value?.trim();
      if (!categoryId) return;

      const currentUser = UserStore.getCurrentUser();
      const Request = findByProps("default", "getToken", "getAPIBase");
      if (!Request || !Request.default) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: "⚠️ Delete failed: request module not found." }),
            { author: currentUser }
          )
        );
        return;
      }

      try {
        const catRes = await Request.default(`/channels/${categoryId}`, { method: "GET" });
        const category = await catRes.json();

        if (!category || category.type !== 4) {
          receiveMessage(
            ctx.channel.id,
            Object.assign(
              createBotMessage({ channelId: ctx.channel.id, content: "⚠️ Invalid category ID." }),
              { author: currentUser }
            )
          );
          return;
        }

        const allRes = await Request.default(`/guilds/${category.guild_id}/channels`, { method: "GET" });
        const allChannels = await allRes.json();

        for (const ch of allChannels.filter(c => c.parent_id === categoryId)) {
          await Request.default(`/channels/${ch.id}`, { method: "DELETE" });
        }

        await Request.default(`/channels/${categoryId}`, { method: "DELETE" });

        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: "✅ Category and all its channels deleted." }),
            { author: currentUser }
          )
        );
      } catch (err) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: `⚠️ Delete failed: ${err}` }),
            { author: currentUser }
          )
        );
      }
    },
  })
);

// ---- Patch User Profiles to add GiveawaySection ----
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
    logger.log("Raid + FetchProfile + UserID + Giveaway plugin loaded!"),
  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Plugin unloaded.");
  },
  settings: Settings,
};
