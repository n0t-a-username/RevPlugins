import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps, findByName } from "@vendetta/metro";
import { React, clipboard } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

const TextInput = findByProps("render", "displayName")?.default || findByName("TextInput");
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

      const openEditModal = () => {
        let currentText = message.content;

        showConfirmationAlert({
          title: "Client Side Edit",
          confirmText: "Edit",
          cancelText: "Cancel",
          onConfirm: () => {
            // 1. Manually overwrite the text in the message object
            message.content = currentText;

            // 2. THE INSTANT REFRESH TRICK:
            // Instead of MESSAGE_UPDATE (which crashes/vanishes), we use
            // LOAD_MESSAGES_SUCCESS. This tells Discord "Hey, we just got this 
            // message fresh from the server," forcing an instant UI refresh.
            Dispatcher.dispatch({
              type: "LOAD_MESSAGES_SUCCESS",
              channelId: message.channel_id,
              messages: [message]
            });

            showToast("Local edit applied!", getAssetIDByName("Check"));
          },
          children: React.createElement(TextInput, {
            defaultValue: message.content,
            onChange: (v) => (currentText = v),
            placeholder: "Enter new text...",
            autoFocus: true,
            style: { color: "#fff", marginTop: 10 }
          }),
        });
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
          onPress={openEditModal}
        />
      );

      if (buttons) {
        buttons.push(copyIdButton, clientEditButton);
      } else {
        const actionSheetContainer = findInReactTree(
          component,
          (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
        );
        if (actionSheetContainer?.[1]) {
          actionSheetContainer[1].props.children.push(copyIdButton, clientEditButton);
        }
      }
    });
  });
});

export const onUnload = () => unpatch();
