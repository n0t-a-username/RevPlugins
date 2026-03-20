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
const MessageStore = findByProps("getMessage");

// This map will store our edits during the current session
const localEdits = new Map<string, string>();

// PATCH 1: The "Visual Mask"
// This intercepts any message being retrieved for display and swaps the text
const unpatchStore = MessageStore ? after("getMessage", MessageStore, ([channelId, messageId], message) => {
  if (message && localEdits.has(messageId)) {
    // We modify the text property that the UI uses, but keep the original object intact
    message.content = localEdits.get(messageId);
  }
  return message;
}) : null;

// PATCH 2: The Action Sheet (Long Press Menu)
const unpatchActionSheet = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
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
          confirmText: "Apply",
          cancelText: "Cancel",
          onConfirm: () => {
            // Save to our map so the Visual Mask (Patch 1) picks it up
            localEdits.set(message.id, currentText);
            
            // Force the current object to update so the UI refreshes immediately
            message.content = currentText;

            showToast("Local edit applied!", getAssetIDByName("Check"));
          },
          children: React.createElement(TextInput, {
            defaultValue: message.content,
            onChange: (v: string) => (currentText = v),
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
  unpatchActionSheet();
  if (unpatchStore) unpatchStore();
};
