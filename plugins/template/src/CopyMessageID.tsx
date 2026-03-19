import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";
import { React, clipboard, ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;
const { Alert } = ReactNative;

// Find the Dispatcher to force the UI to update
const Dispatcher = findByProps("dispatch", "subscribe");

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const buttons = findInReactTree(
        component,
        (x) => x?.[0]?.type?.name === "ButtonRow",
      );

      const openEditPrompt = () => {
        Alert.prompt(
          "Client Side Edit",
          "This edit is local and will disappear if you reload the app.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Edit",
              onPress: (newText) => {
                if (newText !== undefined) {
                  // 1. Update the local object
                  message.content = newText;

                  // 2. Dispatch the update to force the UI to re-render
                  Dispatcher.dispatch({
                    type: "MESSAGE_UPDATE",
                    message: {
                      ...message,
                      content: newText,
                    },
                  });

                  showToast("Local edit applied!", getAssetIDByName("Check"));
                }
              },
            },
          ],
          "plain-text",
          message.content,
        );
        LazyActionSheet.hideActionSheet();
      };

      const copyIdButton = (
        <FormRow
          key="copy-message-id"
          label="Copy Message ID"
          leading={<FormIcon source={getAssetIDByName("IdIcon")} />}
          onPress={() => {
            clipboard.setString(String(message.id));
            showToast("Copied Message ID", getAssetIDByName("toast_copy_link"));
            LazyActionSheet.hideActionSheet();
          }}
        />
      );

      const clientEditButton = (
        <FormRow
          key="client-side-edit"
          label="Client Side Edit"
          leading={<FormIcon source={getAssetIDByName("edit")} />}
          onPress={openEditPrompt}
        />
      );

      if (buttons) {
        buttons.push(copyIdButton, clientEditButton);
      } else {
        const actionSheetContainer = findInReactTree(
          component,
          (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
        );

        if (actionSheetContainer && actionSheetContainer[1]) {
          const middleGroup = actionSheetContainer[1];
          middleGroup.props.children.push(copyIdButton, clientEditButton);
        }
      }
    });
  });
});

export const onUnload = () => unpatch();
