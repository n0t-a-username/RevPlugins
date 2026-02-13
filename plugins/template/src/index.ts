import { storage } from "@vendetta/plugin";
import { registerCommand } from "@vendetta/commands";
import { after } from "@vendetta/patcher";
import { findByTypeName } from "@vendetta/metro";
import { findInReactTree } from "@vendetta/utils";
import { React } from "@vendetta/metro/common";
import Settings from "./settings";
import GiveawaySection from "./GiveawaySection";

/* ============================= */
/* STORAGE INIT */
/* ============================= */

if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = ["", "", "", "", "", "", "", "", "", ""];
}

if (typeof storage.eventGiveawayPing !== "string") {
  storage.eventGiveawayPing = "";
}

/* ============================= */
/* COMMANDS + PATCH */
/* ============================= */

let unregisterRaid: any;
let unregisterFetch: any;
let unregisterUserId: any;
const patches: Function[] = [];

export const settings = Settings;

export const onLoad = () => {

  /* /raid */
  unregisterRaid = registerCommand({
    name: "raid",
    description: "Send configured raid messages.",
    options: [],
    execute: async (_, ctx) => {
      const channelId = ctx.channel.id;

      for (const msg of storage.words) {
        if (!msg?.trim()) continue;

        const random = Math.floor(Math.random() * 1000);
        ctx.sendMessage(channelId, { content: `${msg} ${random}` });

        await new Promise(res => setTimeout(res, 800));
      }
    }
  });

  /* /fetchprofile */
  unregisterFetch = registerCommand({
    name: "fetchprofile",
    description: "Get avatar URL of mentioned user.",
    options: [
      { name: "user", description: "User", type: 6, required: true }
    ],
    execute: async (args) => {
      const user = args[0];
      if (!user?.avatar) return { content: "No avatar found." };

      return {
        content: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`
      };
    }
  });

  /* /userid */
  unregisterUserId = registerCommand({
    name: "userid",
    description: "Get user ID of mentioned user.",
    options: [
      { name: "user", description: "User", type: 6, required: true }
    ],
    execute: async (args) => {
      return { content: args[0]?.id ?? "Unknown user." };
    }
  });

  /* PROFILE PATCH */

  let UserProfile = findByTypeName("UserProfile");
  if (!UserProfile)
    UserProfile = findByTypeName("UserProfileContent");

  if (!UserProfile) return;

  patches.push(
    after("type", UserProfile, (args, ret) => {
      const profileSections = findInReactTree(
        ret,
        r =>
          r?.type?.displayName === "View" &&
          r?.props?.children?.findIndex(
            (i: any) =>
              i?.type?.name === "UserProfileBio" ||
              i?.type?.name === "UserProfileAboutMeCard"
          ) !== -1
      )?.props?.children;

      let userId = args[0]?.userId;
      if (!userId) userId = args[0]?.user?.id;

      if (!userId || !profileSections) return;

      if (profileSections.some((c: any) => c?.key === "giveaway-section"))
        return;

      profileSections.push(
        React.createElement(GiveawaySection, {
          key: "giveaway-section",
          userId
        })
      );
    })
  );
};

export const onUnload = () => {
  unregisterRaid?.();
  unregisterFetch?.();
  unregisterUserId?.();
  patches.forEach(p => p());
};
