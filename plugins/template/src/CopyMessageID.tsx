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
          // 1. Hold the edited text in state
          const [content, setContent] = React.useState(message.content);

          // 2. Create a stable MessageRecord that stays in memory
          const fakeMessage = React.useMemo(() => {
            return new MessageRecord({
              id: message.id, // Keep original ID for stability
              channel_id: message.channel_id,
              author: message.author,
              timestamp: message.timestamp,
              content: content,
            });
          }, []);

          // 3. Manually update the content of that record when state changes
          React.useEffect(() => {
             fakeMessage.content = content;
             // Purge all possible cache keys
             delete fakeMessage.content_parsed;
             delete fakeMessage.content_formatted;
             delete fakeMessage._contentMarkup;
             delete fakeMessage.contentParsed;
             delete fakeMessage.contentFormatted;
          }, [content]);

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                value={content} // This prevents the text from clearing
                placeholder="Edit content..."
                onChange={(v: string) => setContent(v)}
                multiline={true}
                autoFocus={true}
                style={{ 
                  color: "#fff", 
                  backgroundColor: "rgba(255,255,255,0.05)", 
                  padding: 12, 
                  borderRadius: 8,
                  marginBottom: 20
                }}
              />
              
              <RN.View style={{ 
                padding: 10, 
                backgroundColor: "#313338", 
                borderRadius: 8,
              }}>
                <ChatItemWrapper
                  key={`preview-${content.length}`} // Nudge refresh
                  rowGenerator={new RowManager()}
                  message={fakeMessage}
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
