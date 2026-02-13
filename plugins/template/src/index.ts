import { storage } from "@vendetta/plugin";
import { registerCommand } from "@vendetta/commands";
import { after } from "@vendetta/patcher";
import { findByTypeName, findByName } from "@vendetta/metro";
import { findInReactTree } from "@vendetta/utils";
import { React, ReactNative as RN } from "@vendetta/metro/common";

/* ============================= */
/* STORAGE INITIALIZATION */
/* ============================= */

if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = [
    "", "", "", "", "",
    "", "", "", "", ""
  ];
}

if (typeof storage.eventGiveawayPing !== "string") {
  storage.eventGiveawayPing = "";
}

/* ============================= */
/* GIVEAWAY PROFILE SECTION */
/* ============================= */

const UserProfileCard = findByName("UserProfileCard");

function GiveawaySection({ userId }: { userId: string }) {
  return (
    <RN.View style={{ paddingHorizontal: 16, marginTop: 12 }}>
      <UserProfileCard title="Event Giveaway">
        <RN.TouchableOpacity
          style={{
            backgroundColor: "#5865F2",
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: "center"
          }}
          onPress={() => {
            const mention = `<@${userId}>`;

            if (!storage.eventGiveawayPing.includes(mention)) {
              storage.eventGiveawayPing =
                storage.eventGiveawayPing.trim().length > 0
                  ? storage.eventGiveawayPing + "\n" + mention
                  : mention;
            }
          }}
        >
          <RN.Text style={{ color: "white", fontWeight: "600" }}>
            Add To Giveaway
          </RN.Text>
        </RN.TouchableOpacity>
      </UserProfileCard>
    </RN.View>
  );
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
    execute: async (args) => {
      const user = args[0];
      if (!user?.avatar) return { content: "No avatar found." };

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
  /* PROFILE PATCH */
  /* ============================= */

  let UserProfile = findByTypeName("UserProfile");
  if (!UserProfile)
    UserProfile = findByTypeName("UserProfileContent");

  if (UserProfile) {
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