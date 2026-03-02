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

        const groups = findInReactTree(
          tree,
          (x) =>
            Array.isArray(x) &&
            x[0]?.type?.name === "ActionSheetRowGroup"
        );

        if (!groups?.length) return;

        const group = groups[1] ?? groups[0];
        if (!group?.props?.children) return;

        if (
          group.props.children.some(
            (c: any) => c?.key === "copy-message-id"
          )
        )
          return;

        const ActionSheetRow = group.props.children[0].type;

        group.props.children.push(
          <ActionSheetRow
            key="copy-message-id"
            label="Copy Message ID"
            onPress={async () => {
              await clipboard.setStringAsync(message.id);
              showToast(
                "Message ID copied",
                getAssetIDByName("toast_copy_link")
              );
              LazyActionSheet.hideActionSheet();
            }}
          />
        );
      });
    });
  });
}

export function onUnload() {
  unpatch?.();
}