import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findByName, findByProps, findByTypeName } from "@vendetta/metro";
import { before, after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { logger } from "@vendetta";
import Settings from "./Settings";

const { View, Text, TouchableOpacity } = RN;

/* ========================================================= */
/* ===================== GIVEAWAY SECTION ================== */
/* ========================================================= */

const UserProfileCard = findByName("UserProfileCard");

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

    let UserProfile =
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

    unpatchActionSheet = before(
      "openLazy",
      LazyActionSheet,
      ([component, key, data]) => {
        if (key !== "MessageLongPressActionSheet") return;

        const message = data?.message;
        if (!message?.id) return;

        component.then((instance: any) => {
          const cleanup = after("default", instance, (_, res) => {
            React.useEffect(() => () => cleanup(), []);

            const groups = findInReactTree(
              res,
              x =>
                Array.isArray(x) &&
                x[0]?.type?.name === "ActionSheetRowGroup"
            );

            if (!groups?.length) return;

            // Find group containing "Edit"
            let targetGroup = groups.find(group =>
              group?.some?.(
                (row: any) =>
                  typeof row?.props?.label === "string" &&
                  row.props.label.toLowerCase().includes("edit")
              )
            );

            // Fallback to last group
            if (!targetGroup)
              targetGroup = groups[groups.length - 1];

            if (!targetGroup?.length) return;

            const ActionSheetRow = targetGroup[0].type;

            // Prevent duplicates
            if (
              targetGroup.some(
                (r: any) => r?.key === "copy-message-id"
              )
            )
              return;

            const copyButton = (
              <ActionSheetRow
                label="Copy Message ID"
                icon={targetGroup[0].props.icon}
                onPress={() => {
                  RN.Clipboard.setString(message.id);
                  showToast("Message ID copied to clipboard");
                  LazyActionSheet.hideActionSheet();
                }}
                key="copy-message-id"
              />
            );

            targetGroup.push(copyButton);
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
