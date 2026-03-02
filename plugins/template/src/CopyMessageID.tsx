import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByName, findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(
        () => () => {
          unpatchInner();
        },
        [],
      );

      const actionSheetContainer = findInReactTree(
        component,
        (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
      );

      const buttons = findInReactTree(
        component,
        (x) => x?.[0]?.type?.name === "ButtonRow",
      );

      const createCopyRow = () => (
        <FormRow
          key="copy-message-id"
          label="Copy Message ID"
          leading={
            <FormIcon
              style={{ opacity: 1 }}
              source={getAssetIDByName("IdIcon")}
            />
          }
          onPress={() => {
            clipboard.setString(String(message.id));
            showToast(
              "Copied Message ID",
              getAssetIDByName("toast_copy_link"),
            );
            LazyActionSheet.hideActionSheet();
          }}
        />
      );

      // Preferred path (ButtonRow)
      if (buttons) {
        buttons.push(createCopyRow());
      }
      // Fallback path (ActionSheetRowGroup)
      else if (actionSheetContainer && actionSheetContainer[1]) {
        const middleGroup = actionSheetContainer[1];

        const ActionSheetRow = middleGroup.props.children[0].type;

        const copyButton = (
          <ActionSheetRow
            label="Copy Message ID"
            icon={{
              $$typeof: middleGroup.props.children[0].props.icon.$$typeof,
              type: middleGroup.props.children[0].props.icon.type,
              key: null,
              ref: null,
              props: {
                source: getAssetIDByName("IdIcon"),
              },
            }}
            onPress={() => {
              clipboard.setString(String(message.id));
              showToast(
                "Copied Message ID",
                getAssetIDByName("toast_copy_link"),
              );
              LazyActionSheet.hideActionSheet();
            }}
            key="copy-message-id"
          />
        );

        middleGroup.props.children.push(copyButton);
      } else {
        console.log("[CopyMessageID] Error: Could not find ActionSheet");
      }
    });
  });
});

export const onUnload = () => unpatch();
