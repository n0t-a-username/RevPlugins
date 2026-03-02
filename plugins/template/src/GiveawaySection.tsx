import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findByName, findByProps } from "@vendetta/metro";
import { before, after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

const { View, Text, TouchableOpacity, Clipboard } = RN;

const UserProfileCard = findByName("UserProfileCard");
const LazyActionSheet = findByProps("openLazy", "hideActionSheet");

let unpatchActionSheet: (() => void) | undefined;

/* ----------------------------- */
/*  COPY MESSAGE ID PATCH       */
/* ----------------------------- */

export function onLoad() {
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

          const actionSheetGroups = findInReactTree(
            res,
            (x) =>
              Array.isArray(x) &&
              x[0]?.type?.name === "ActionSheetRowGroup"
          );

          if (!actionSheetGroups) return;

          const middleGroup = actionSheetGroups[1];
          if (!middleGroup?.props?.children?.length) return;

          const ActionSheetRow =
            middleGroup.props.children[0].type;

          const copyButton = (
            <ActionSheetRow
              label="Copy Message ID"
              icon={{
                type: middleGroup.props.children[0].props.icon.type,
                key: null,
                ref: null,
                props: {
                  IconComponent: () => (
                    <RN.Image
                      source={{
                        uri: getAssetIDByName("ic_copy_24px"),
                      }}
                      style={{ width: 24, height: 24 }}
                    />
                  ),
                },
              }}
              onPress={() => {
                Clipboard.setString(message.id);
                showToast("Message ID copied to clipboard");
                LazyActionSheet.hideActionSheet();
              }}
              key="copy-message-id"
            />
          );

          middleGroup.props.children.push(copyButton);
        });
      });
    }
  );
}

export function onUnload() {
  if (unpatchActionSheet) unpatchActionSheet();
}

/* ----------------------------- */
/*  YOUR EXISTING COMPONENT     */
/* ----------------------------- */

interface Props {
  userId: string;
}

export default function GiveawaySection({ userId }: Props) {
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
