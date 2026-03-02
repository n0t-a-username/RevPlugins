import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findByName, findByProps, findByTypeName } from "@vendetta/metro";
import { before, after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { logger } from "@vendetta";
import { Forms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import * as Clipboard from "expo-clipboard";
import Settings from "./Settings";

const { View, Text, TouchableOpacity } = RN;
const { FormRow, FormIcon } = Forms;

/* ========================================================= */
/* ===================== GIVEAWAY SECTION ================== */
/* ========================================================= */

const UserProfileCardModule = findByName("UserProfileCard");
const UserProfileCard =
  UserProfileCardModule?.default ?? UserProfileCardModule;

interface Props {
  userId: string;
}

function GiveawaySection({ userId }: Props) {
  if (!UserProfileCard) return null;

  const handlePress = () => {
    const mention = `<@${userId}>`;

    if (!storage.eventGiveawayPing.includes(mention)) {
      storage.eventGiveawayPing =
        storage.eventGiveawayPing.trim().length > 0
          ? storage.eventGiveawayPing + "\n" + mention
          : mention;

      showToast("Successfully added to list!");
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, marginTop: -18 }}>
      <UserProfileCard title="Mass Ping">
        <TouchableOpacity
          style={{
            backgroundColor: "#FF4444",
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={handlePress}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Add To Mass Selective Ping List
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 32, color: "transparent" }}> </Text>
      </UserProfileCard>
    </View>
  );
}

/* ========================================================= */
/* ===================== PATCH TRACKERS ==================== */
/* ========================================================= */

let unpatchProfile: (() => void) | undefined;
let unpatchActionSheet: (() => void) | undefined;

/* ========================================================= */
/* ===================== PLUGIN LIFECYCLE ================== */
/* ========================================================= */

export default {
  onLoad: () => {
    logger.log("Plugin loaded.");

    /* ---------- Profile Injection ---------- */

    const UserProfile =
      findByTypeName("UserProfile") ??
      findByTypeName("UserProfileContent");

    if (UserProfile) {
      unpatchProfile = after("type", UserProfile, (args, ret) => {
        const sections = ret?.props?.children;
        if (!sections) return;

        const userId = args[0]?.userId ?? args[0]?.user?.id;
        if (!userId) return;

        sections.push(
          React.createElement(GiveawaySection, { userId })
        );
      });
    }

    /* ---------- Copy Message ID Injection ---------- */

    const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
    if (!LazyActionSheet) return;

    unpatchActionSheet = before(
      "openLazy",
      LazyActionSheet,
      ([component, key, data]) => {
        const message = data?.message;
        if (key !== "MessageLongPressActionSheet" || !message?.id) return;

        component.then((instance: any) => {
          const cleanup = after("default", instance, (_, tree) => {
            React.useEffect(() => () => cleanup(), []);

            const buttonRows = findInReactTree(
              tree,
              (x) => x?.[0]?.type?.name === "ButtonRow"
            );

            if (!buttonRows) return;

            // Prevent duplicates
            if (
              buttonRows.some(
                (btn: any) => btn?.key === "copy-message-id"
              )
            )
              return;

            buttonRows.push(
              <FormRow
                key="copy-message-id"
                label="Copy Message ID"
                leading={
                  <FormIcon
                    style={{ opacity: 1 }}
                    source={getAssetIDByName("ic_copy_24px")}
                  />
                }
                onPress={async () => {
                  await Clipboard.setStringAsync(message.id);
                  showToast("Message ID copied to clipboard");
                  LazyActionSheet.hideActionSheet();
                }}
              />
            );
          });
        });
      }
    );
  },

  onUnload: () => {
    if (unpatchProfile) unpatchProfile();
    if (unpatchActionSheet) unpatchActionSheet();
    logger.log("Plugin unloaded.");
  },

  settings: Settings,
};
