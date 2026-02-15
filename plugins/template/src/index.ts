import { logger } from "@vendetta";
import Settings from "./Settings";
import GiveawaySection from "./GiveawaySection";

import { registerCommand } from "@vendetta/commands";
import { findByProps, findByStoreName, findByTypeName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { React, HTTP } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";

const MessageActions = findByProps("sendMessage", "editMessage");
const ChannelStore = findByStoreName("ChannelStore");
const UserStore = findByStoreName("UserStore");

const { receiveMessage } = findByProps("receiveMessage");
const { createBotMessage } = findByProps("createBotMessage");

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

//
// ---- /raid ----
//
commands.push(
  registerCommand({
    name: "raid",
    description: "Start a Raid!",
    options: [
      { name: "amount", required: true, type: 4 },
      { name: "delay", required: true, type: 4 },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const amount = Number(args.find(a => a.name === "amount")?.value ?? 0);
      const delay = Number(args.find(a => a.name === "delay")?.value ?? 0);
      if (amount <= 0) return;

      for (let i = 0; i < amount; i++) {
        const content = `${randomWord()} \`${getRandomNumber()}\``;
        await sleep(delay);
        MessageActions.sendMessage(ctx.channel.id, { content });
      }
    },
  })
);

//
// ---- /fetchprofile ----
//
commands.push(
  registerCommand({
    name: "fetchprofile",
    description: "Fetch a user's avatar",
    options: [{ name: "user", required: true, type: 3 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const input = args.find(a => a.name === "user")?.value?.trim();
      if (!input) return;

      const userId = input.replace(/[<@!>]/g, "");
      const user = UserStore.getUser(userId);

      if (!user) {
        MessageActions.sendMessage(ctx.channel.id, { content: "❌ User not found" });
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

//
// ---- /userid ----
//
commands.push(
  registerCommand({
    name: "userid",
    description: "Displays a user's ID",
    options: [{ name: "user", required: true, type: 3 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: (args, ctx) => {
      const input = args.find(a => a.name === "user")?.value?.trim();
      if (!input) return;

      const userId = input.replace(/[<@!>]/g, "");
      const user = UserStore.getUser(userId);

      if (!user) {
        MessageActions.sendMessage(ctx.channel.id, { content: "❌ User not found" });
        return;
      }

      const currentUser = UserStore.getCurrentUser();
      receiveMessage(
        ctx.channel.id,
        Object.assign(
          createBotMessage({ channelId: ctx.channel.id, content: `<@${user.id}>` }),
          { author: currentUser }
        )
      );
    },
  })
);

//
// ---- /mass-ping ----
//
commands.push(
  registerCommand({
    name: "mass-ping",
    description: "Outputs stored user IDs",
    options: [{ name: "clear", required: false, type: 5 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: (args, ctx) => {
      const shouldClear = args.find(a => a.name === "clear")?.value ?? false;
      const currentUser = UserStore.getCurrentUser();

      if (shouldClear) {
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

      const list = storage.eventGiveawayPing?.trim();
      if (!list) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({ channelId: ctx.channel.id, content: "⚠️ No users stored." }),
            { author: currentUser }
          )
        );
        return;
      }

      MessageActions.sendMessage(ctx.channel.id, {
        content: `Wake up:\n${list.split("\n").join(", ")}`
      });
    },
  })
);

//
// ---- /mass-delete ----
//
commands.push(
  registerCommand({
    name: "mass-delete",
    description: "Deletes all channels in a guild or all channels in a category",
    options: [
      { name: "guild_id", required: true, type: 3 },
      { name: "category_id", required: false, type: 3 },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args, ctx) => {
      const guildId = args.find(a => a.name === "guild_id")?.value;
      const categoryId = args.find(a => a.name === "category_id")?.value;
      const currentUser = UserStore.getCurrentUser();

      if (!guildId) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({
              channelId: ctx.channel.id,
              content: "❌ Guild ID required."
            }),
            { author: currentUser }
          )
        );
        return;
      }

      try {
        const response = await HTTP.get({
          url: `/guilds/${guildId}/channels`,
        });

        const guildChannels = response.body;

        if (!Array.isArray(guildChannels)) {
          throw new Error("Failed to fetch guild channels.");
        }

        let channelsToDelete = guildChannels;

        if (categoryId) {
          channelsToDelete = guildChannels.filter(
            (ch: any) => ch.parent_id === categoryId
          );
        }

        if (!channelsToDelete.length) {
          receiveMessage(
            ctx.channel.id,
            Object.assign(
              createBotMessage({
                channelId: ctx.channel.id,
                content: "⚠️ No channels to delete."
              }),
              { author: currentUser }
            )
          );
          return;
        }

        let deletedCount = 0;

        for (const ch of channelsToDelete) {
          try {
            await HTTP.del({ url: `/channels/${ch.id}` });
            deletedCount++;
            await sleep(400);
          } catch {}
        }

        if (categoryId) {
          try {
            await HTTP.del({ url: `/channels/${categoryId}` });
            deletedCount++;
          } catch {}
        }

        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({
              channelId: ctx.channel.id,
              content: `🗑️ Deleted ${deletedCount} channel(s).`
            }),
            { author: currentUser }
          )
        );

      } catch (err) {
        receiveMessage(
          ctx.channel.id,
          Object.assign(
            createBotMessage({
              channelId: ctx.channel.id,
              content: `⚠️ Delete failed: ${String(err)}`
            }),
            { author: currentUser }
          )
        );
      }
    },
  })
);

//
// ---- Profile Patch ----
//
let UserProfile =
  findByTypeName("UserProfile") || findByTypeName("UserProfileContent");

after("type", UserProfile, (args, ret) => {
  const children = ret?.props?.children;
  if (!children) return;

  const userId = args[0]?.userId ?? args[0]?.user?.id;
  if (!userId) return;

  children.push(React.createElement(GiveawaySection, { userId }));
});

//
// ---- Lifecycle ----
//
export default {
  onLoad: () => logger.log("Plugin loaded."),
  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Plugin unloaded.");
  },
  settings: Settings,
};