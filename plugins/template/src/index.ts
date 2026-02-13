import { storage } from "@vendetta/plugin";
import { registerCommand } from "@vendetta/commands";
import { after } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";

/* ============================= */
/* STORAGE INITIALIZATION */
/* ============================= */

// Ensure 10 raid slots exist
if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = [
    "", "", "", "", "",
    "", "", "", "", ""
  ];
}

// Giveaway storage
if (typeof storage.eventGiveawayPing !== "string") {
  storage.eventGiveawayPing = "";
}

/* ============================= */
/* COMMAND REGISTRATION */
/* ============================= */

let unregisterRaid: any;
let unregisterFetch: any;
let unregisterUserId: any;

const patches: Function[] = [];

export const onLoad = () => {

  /* ============================= */
  /* /raid COMMAND */
  /* ============================= */

  unregisterRaid = registerCommand({
    name: "raid",
    description: "Send configured raid messages.",
    options: [],
    execute: async (_, ctx) => {
      const channelId = ctx.channel.id;

      for (const msg of storage.words) {
        if (!msg || !msg.trim()) continue;

        const random = Math.floor(Math.random() * 1000);
        const content = `${msg} ${random}`;

        ctx.sendMessage(channelId, { content });

        await new Promise(res => setTimeout(res, 800));
      }
    }
  });

  /* ============================= */
  /* /fetchprofile COMMAND */
  /* ============================= */

  unregisterFetch = registerCommand({
    name: "fetchprofile",
    description: "Get avatar URL of mentioned user.",
    options: [
      {
        name: "user",
        description: "User to fetch",
        type: 6,
        required: true
      }
    ],
    execute: async (args, ctx) => {
      const user = args[0];
      if (!user?.avatar) {
        return { content: "No avatar found." };
      }

      return {
        content: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`
      };
    }
  });

  /* ============================= */
  /* /userid COMMAND */
  /* ============================= */

  unregisterUserId = registerCommand({
    name: "userid",
    description: "Get user ID of mentioned user.",
    options: [
      {
        name: "user",
        description: "User",
        type: 6,
        required: true
      }
    ],
    execute: async (args) => {
      const user = args[0];
      return { content: user?.id ?? "Unknown user." };
    }
  });

  /* ============================= */
  /* PROFILE GIVEAWAY BUTTON */
  /* ============================= */

  const UserProfileActions = findByProps("UserProfileActions")?.UserProfileActions;
  const Button = findByProps("Button")?.Button;

  if (UserProfileActions && Button) {
    patches.push(
      after("default", UserProfileActions, (_, args, res) => {
        try {
          const user = args?.[0]?.user;
          if (!user?.id) return;

          const children = res?.props?.children;
          if (!Array.isArray(children)) return;

          // Prevent duplicate button
          if (children.some(c => c?.key === "event-giveaway-button")) return;

          children.push(
            React.createElement(Button, {
              key: "event-giveaway-button",
              text: "Giveaway",
              size: "SMALL",
              onPress: () => {
                const mention = `<@${user.id}>`;

                if (!storage.eventGiveawayPing.includes(mention)) {
                  storage.eventGiveawayPing =
                    storage.eventGiveawayPing.trim().length > 0
                      ? storage.eventGiveawayPing + "\n" + mention
                      : mention;
                }
              }
            })
          );
        } catch (err) {
          console.log("Giveaway button injection error:", err);
        }
      })
    );
  }
};

/* ============================= */
/* CLEANUP */
/* ============================= */

export const onUnload = () => {
  unregisterRaid?.();
  unregisterFetch?.();
  unregisterUserId?.();
  patches.forEach(p => p());
};