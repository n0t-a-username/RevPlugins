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
const MessageStore = findByProps("getMessage");

// Session storage for edits
const localEdits = new Map<string, string>();

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  // 1. Persistent Hook: We patch getMessage ONLY when the action sheet is actually opened.
  // This avoids the "startup crash" but ensures the edit stays if you switch channels.
  if (MessageStore && !MessageStore.getMessage.__patched) {
    after("getMessage", MessageStore, ([channelId, messageId], msgObj) => {
      if (msgObj && localEdits.has(messageId)) {
        msgObj.content = localEdits.get(messageId);
      }
      return msgObj;
    });
    MessageStore.getMessage.__patched = true;
  }

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
            // Update our local memory
            localEdits.set(message.id, currentText);
            message.content = currentText;

            // Trigger a UI refresh without a full, dangerous Dispatch
            Dispatcher?.dispatch({
              type: "MESSAGE_UPDATE",
              message: {
                id: message.id,
                channel_id: message.channel_id,
                content: currentText,
              },
            });

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
      } else {
        const actionSheetContainer = findInReactTree(component, (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup");
        if (actionSheetContainer?.[1]) {
          actionSheetContainer[1].props.children.push(copyIdButton, clientEditButton);
        }
      }
    });
  });
});

export const onUnload = () => unpatch();
