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
const MessageStore = findByProps("getMessage");

// Patch MessageStore safely
if (MessageStore) {
  after("getMessage", MessageStore, ([channelId, messageId], message) => {
    if (message && localEdits[messageId]) {
      message.content = localEdits[messageId];
    }
  });
}

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      // Find the group of rows in the action sheet
      const root = findInReactTree(component, (x) => x?.type?.name === "ActionSheet");
      const content = findInReactTree(root, (x) => Array.isArray(x?.props?.children));

      if (!content) return;

      const openEditModal = () => {
        let currentText = message.content;
        showConfirmationAlert({
          title: "Client Side Edit",
          confirmText: "Edit",
          cancelText: "Cancel",
          onConfirm: () => {
            localEdits[message.id] = currentText;
            message.content = currentText;

            Dispatcher?.dispatch({
              type: "MESSAGE_UPDATE",
              message: { ...message, content: currentText },
            });

            showToast("Edited locally!", getAssetIDByName("Check"));
          },
          children: React.createElement(TextInput, {
            defaultValue: message.content,
            onChange: (v) => (currentText = v),
            style: { color: "#ffffff", marginTop: 8 }
          }),
        });
        LazyActionSheet.hideActionSheet();
      };

      // Create the buttons
      const newButtons = [
        <FormRow
          key="copy-id-alt"
          label="Copy Message ID"
          leading={<FormIcon source={getAssetIDByName("IdIcon")} />}
          onPress={() => {
            clipboard.setString(String(message.id));
            showToast("Copied ID", getAssetIDByName("toast_copy_link"));
            LazyActionSheet.hideActionSheet();
          }}
        />,
        <FormRow
          key="client-edit-alt"
          label="Client Side Edit"
          leading={<FormIcon source={getAssetIDByName("edit")} />}
          onPress={openEditModal}
        />
      ];

      // Insert at the top of the list for maximum visibility and stability
      content.props.children.unshift(...newButtons);
    });
  });
});

export const onUnload = () => unpatch();
