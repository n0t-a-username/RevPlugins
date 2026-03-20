import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps, findByName } from "@vendetta/metro";
import { React, clipboard, ReactNative as RN } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;
const TextInput = findByProps("render", "displayName")?.default || findByName("TextInput");

const ChatItemWrapper = findByProps("DCDAutoModerationSystemMessageView", "default")?.default;
const MessageRecord = findByName("MessageRecord");
const RowManager = findByName("RowManager");

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          // We initialize state with a COPY of the content
          const [content, setContent] = React.useState(String(message.content));

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                defaultValue={content}
                onChange={(v: string) => setContent(v)}
                placeholder="Edit text for screenshot..."
                autoFocus={true}
                style={{ 
                  color: "#fff", 
                  backgroundColor: "rgba(0,0,0,0.1)", 
                  padding: 10, 
                  borderRadius: 8,
                  marginBottom: 10
                }}
              />
              <RN.View style={{ 
                padding: 10, 
                backgroundColor: "#313338", 
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#444"
              }}>
                <ChatItemWrapper
                  rowGenerator={new RowManager()}
                  message={new MessageRecord({
                    // Manually copying properties to ensure zero link to the original 'message' object
                    id: message.id,
                    channel_id: message.channel_id,
                    author: message.author,
                    attachments: message.attachments,
                    embeds: message.embeds,
                    components: message.components,
                    timestamp: message.timestamp,
                    state: message.state,
                    // Use our local state 'content' instead of message.content
                    content: content, 
                    // Ensure the renderer doesn't try to use old cached markup
                    content_parsed: undefined,
                    content_formatted: undefined,
                    _contentMarkup: undefined
                  })}
                />
              </RN.View>
            </RN.View>
          );
        };

        showConfirmationAlert({
          title: "Screenshot Preview",
          confirmText: "Done",
          onConfirm: () => {},
          // @ts-expect-error
          children: <Sandbox />,
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

      const previewButton = (
        <FormRow
          key="screenshot-preview"
          label="Screenshot Preview"
          leading={<FormIcon source={getAssetIDByName("eye")} />}
          onPress={openScreenshotPreview}
        />
      );

      if (buttons) {
        buttons.push(copyIdButton, previewButton);
      } else {
        const actionSheetContainer = findInReactTree(component, (x) => 
          Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup"
        );
        if (actionSheetContainer?.[1]) {
          actionSheetContainer[1].props.children.push(copyIdButton, previewButton);
        }
      }
    });
  });
});

export const onUnload = () => unpatch();
