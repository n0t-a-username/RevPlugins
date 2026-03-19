import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";
import { React, clipboard, Toasts } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { ReactNative } from "@vendetta/metro/common";

const { Alert } = ReactNative;
const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

const unpatch = before("openLazy", LazyActionSheet, ([component, key, props]) => {
  const message = props?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");

      // Logic to trigger the client-side edit
      const handleClientEdit = () => {
        Alert.prompt(
          "Client Side Edit",
          "This will only change the text for you locally.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Edit",
              onPress: (newContent) => {
                message.content = newContent;
                // We don't need to force a re-render here because 
                // Discord usually updates the message object in the store directly.
                Toasts.showToast("Local edit applied!", getAssetIDByName("Check"));
                LazyActionSheet.hideActionSheet();
              },
            },
          ],
          "plain-text",
          message.content
        );
      };

      const createButtons = () => [
        <FormRow
          key="copy-message-id"
          label="Copy Message ID"
          leading={<FormIcon source={getAssetIDByName("IdIcon")} />}
          onPress={() => {
            clipboard.setString(String(message.id));
            Toasts.showToast("Copied Message ID", getAssetIDByName("toast_copy_link"));
            LazyActionSheet.hideActionSheet();
          }}
        />,
        <FormRow
          key="client-side-edit"
          label="Client Side Edit"
          leading={<FormIcon source={getAssetIDByName("copy")} />} // You can swap "copy" for any icon name
          onPress={handleClientEdit}
        />
      ];

      if (buttons) {
        buttons.push(...createButtons());
      }
    });
  });
});

export const onUnload = () => unpatch();
