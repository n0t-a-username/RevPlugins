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

// Persistent session storage
const localEdits = {};

// Safely grab modules
const TextInput = findByProps("render", "displayName")?.default || findByName("TextInput");
const Dispatcher = findByProps("dispatch", "subscribe");
const MessageStore = findByProps("getMessage", "getMessages");

// 1. Patch the MessageStore to keep edits visible after channel swaps
let unpatchStore;
if (MessageStore) {
  unpatchStore = after("getMessage", MessageStore, ([channelId, messageId], message) => {
    if (message && localEdits[messageId]) {
      message.content = localEdits[messageId];
    }
    return message;
  });
}

const unpatchActionSheet = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      // Find where buttons live
      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow") || 
                      findInReactTree(component, (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup");

      const openEditModal = () => {
        let currentText = message.content;
        showConfirmationAlert({
          title: "Client Side Edit",
          confirmText: "Edit",
          cancelText: "Cancel",
          onConfirm: () => {
            // Store the edit so the MessageStore patch can find it later
            localEdits[message.id] = currentText;
            message.content = currentText;

            // Update UI immediately
            Dispatcher?.dispatch({
              type: "MESSAGE_UPDATE",
              message: { ...message, content: currentText },
            });

            showToast("Local edit saved!", getAssetIDByName("Check"));
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

      // Button Components
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

      // Injection logic
      if (Array.isArray(buttons)) {
        buttons.push(copyIdButton, clientEditButton);
      } else if (buttons?.props?.children) {
        // Fallback for different ActionSheet structures
        buttons.props.children.push(copyIdButton, clientEditButton);
      }
    });
  });
});

export const onUnload = () => {
  unpatchActionSheet();
  if (unpatchStore) unpatchStore();
};
