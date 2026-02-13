import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps, findByStoreName, findByName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { after } from "@vendetta/patcher";
import { React } from "@vendetta/metro/common";
import { Button } from "@vendetta/ui/components";

const MessageActions = findByProps("sendMessage", "editMessage");
const UserStore = findByStoreName("UserStore");
const commands: (() => void)[] = [];
const patches: (() => void)[] = [];

const { receiveMessage } = findByProps("receiveMessage");
const { createBotMessage } = findByProps("createBotMessage");

const getRandomNumber = () => Math.floor(Math.random() * 100);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getConfiguredWords() {
  if (!Array.isArray(storage.words)) return [];
  return storage.words.filter((w) => typeof w === "string" && w.trim().length);
}

function randomWord() {
  const words = getConfiguredWords();
  if (!words.length) return "### (no spam messages configured)";
  return words[Math.floor(Math.random() * words.length)];
}

// Ensure giveaway storage exists
if (typeof storage.eventGiveawayPing !== "string") {
  storage.eventGiveawayPing = "";
}

/* ========================
   RAID COMMAND
======================== */
commands.push(
  registerCommand({
    name: "raid",
    displayName: "raid",
    description: "Start a Raid!",
    options: [
      { name: "amount", displayName: "amount", required: true, type: 4 },
      { name: "delay", displayName: "delay", required: true, type: 4 },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,

    execute: async (args, ctx) => {
      const amount = Number(args.find((a) => a.name === "amount")?.value ?? 0);
      const delay = Number(args.find((a) => a.name === "delay")?.value ?? 0);
      if (amount <= 0) return;

      for (let i = 0; i < amount; i++) {
        const content = `${randomWord()} \`${getRandomNumber()}\``;

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

/* ========================
   FETCH PROFILE
======================== */
commands.push(
  registerCommand({
    name: "fetchprofile",
    displayName: "Fetch Profile",
    description: "Fetch avatar",
    options: [{ name: "user", required: true, type: 3 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,

    execute: async (args, ctx) => {
      const input = args.find((a) => a.name === "user")?.value?.trim();
      if (!input) return;

      const userId = input.replace(/[<@!>]/g, "");
      const user = UserStore.getUser(userId);
      if (!user) return;

      const avatarUrl =
        user.getAvatarURL?.({ format: "png", size: 512 }) ||
        `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`;

      const currentUser = UserStore.getCurrentUser();

      receiveMessage(
        ctx.channel.id,
        Object.assign(
          createBotMessage({
            channelId: ctx.channel.id,
            content: avatarUrl,
          }),
          { author: currentUser }
        )
      );
    },
  })
);

/* ========================
   USER ID COMMAND
======================== */
commands.push(
  registerCommand({
    name: "userid",
    displayName: "User ID",
    description: "Displays user ID",
    options: [{ name: "user", required: true, type: 3 }],
    applicationId: "-1",
    inputType: 1,
    type: 1,

    execute: (args, ctx) => {
      const input = args.find((a) => a.name === "user")?.value?.trim();
      if (!input) return;

      const userId = input.replace(/[<@!>]/g, "");
      const user = UserStore.getUser(userId);
      if (!user) return;

      const currentUser = UserStore.getCurrentUser();

      receiveMessage(
        ctx.channel.id,
        Object.assign(
          createBotMessage({
            channelId: ctx.channel.id,
            content: `${user.username}'s ID: ${user.id}`,
          }),
          { author: currentUser }
        )
      );
    },
  })
);

/* ========================
   GIVEAWAY PROFILE BUTTON
======================== */
const UserProfileActions = findByName("UserProfileActions", false);

if (UserProfileActions) {
  patches.push(
    after("default", UserProfileActions, (_, component) => {
      const user = component?.props?.user;
      if (!user?.id) return;

      const tag = `<@${user.id}>`;

      const btn = React.createElement(Button, {
        text: "Add to Giveaway",
        size: "small",
        onPress: () => {
          if (!storage.eventGiveawayPing.includes(tag)) {
            storage.eventGiveawayPing =
              storage.eventGiveawayPing.length > 0
                ? storage.eventGiveawayPing + " " + tag
                : tag;
          }
        },
      });

      let container = component?.props?.children?.props?.children;

      if (Array.isArray(container)) container.push(btn);
    })
  );
}

/* ========================
   LIFECYCLE
======================== */
export default {
  onLoad: () => {
    logger.log("Raid + Giveaway plugin loaded!");
  },

  onUnload: () => {
    for (const unregister of commands) unregister();
    for (const unpatch of patches) unpatch();
  },

  settings: Settings,
};
