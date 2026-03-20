import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps, findByName } from "@vendetta/metro";
import { React, clipboard, ReactNative as RN } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

// Metro Modules
const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;
const TextInput = findByProps("render", "displayName")?.default || findByName("TextInput");

// Chat UI Modules
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
        // Inner component to handle live text state for the preview
        const Sandbox = () => {
          const [content, setContent] = React.useState(message.content);

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
                    ...message,
                    content: content,
                    // Clear cache to force re-render of edited text
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
          // @ts-expect-error - valid property for alerts
          children: <Sandbox />,
        });
        
        LazyActionSheet.hideActionSheet();
      };

      // Button 1: Copy ID
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

      // Button 2: Screenshot Preview (Replaces the broken Client Side Edit)
      const previewButton = (
        <FormRow
          key="screenshot-preview"
          label="Screenshot Preview"
          leading={<FormIcon source={getAssetIDByName("eye")} />}
          onPress={openScreenshotPreview}
        />
      );

      // Injecting both buttons
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
