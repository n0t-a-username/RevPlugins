import { before, after } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { findInReactTree } from "@vendetta/utils";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import * as clipboard from "expo-clipboard";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");

let unpatch: (() => void) | undefined;

export function onLoad() {
  unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message;
    if (key !== "MessageLongPressActionSheet" || !message?.id) return;

    component.then((instance) => {
      const innerUnpatch = after("default", instance, (_, tree) => {
        React.useEffect(() => () => innerUnpatch(), []);

        const actionSheetContainer = findInReactTree(
          tree,
          (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup"
        );

        const buttons = findInReactTree(
          tree,
          (x) => x?.[0]?.type?.name === "ButtonRow"
        );

        const copyAction = {
          onPress: async () => {
            await clipboard.setStringAsync(message.id);
            showToast(
              "Message ID copied",
              getAssetIDByName("toast_copy_link")
            );
            LazyActionSheet.hideActionSheet();
          },
        };

        // Button layout
        if (buttons) {
          if (!buttons.some((b: any) => b?.key === "copy-message-id")) {
            const FormRow = buttons[0].type;
            buttons.push(
              <FormRow
                key="copy-message-id"
                label="Copy Message ID"
                onPress={copyAction.onPress}
              />
            );
          }
        }

        // ActionSheetRowGroup layout
        else if (actionSheetContainer?.[1]) {
          const group = actionSheetContainer[1];
          const ActionSheetRow = group.props.children[0].type;

          if (
            !group.props.children.some(
              (r: any) => r?.key === "copy-message-id"
            )
          ) {
            group.props.children.push(
              <ActionSheetRow
                key="copy-message-id"
                label="Copy Message ID"
                onPress={copyAction.onPress}
              />
            );
          }
        }
      });
    });
  });
}

export function onUnload() {
  unpatch?.();
}
