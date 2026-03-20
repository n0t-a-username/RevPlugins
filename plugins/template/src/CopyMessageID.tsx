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
const MessageStore = findByProps("getMessage", "getMessages");

// This object will store our local edits during the app session
const localEdits = {};

// Patch MessageStore so it returns our edited content even after switching channels
const patchStore = after("getMessage", MessageStore, ([channelId, messageId], message) => {
  if (message && localEdits[messageId]) {
    message.content = localEdits[messageId];
  }
  return message;
});

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");

      const openEditModal = () => {
        let currentText = message.content;
        showConfirmationAlert({
          title: "Client Side Edit",
          confirmText: "Edit",
          cancelText: "Cancel",
          onConfirm: () => {
            // Save to our persistent session object
            localEdits[message.id] = currentText;
            message.content = currentText;

            // Update UI immediately
            Dispatcher.dispatch({
              type: "MESSAGE_UPDATE",
              message: { ...message, content: currentText },
            });

            showToast("Session edit applied!", getAssetIDByName("Check"));
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
      }
    });
  });
});

export const onUnload = () => {
  unpatch();
  patchStore(); // Stop hijacking the MessageStore when plugin is off
};
