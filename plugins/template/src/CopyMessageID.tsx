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
          // Initialize with current message content
          const [content, setContent] = React.useState(message.content);

          // We create a "key" based on the content length/hash to force React to 
          // unmount and remount the ChatItemWrapper when text changes.
          const renderKey = React.useMemo(() => Date.now(), [content]);

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                defaultValue={content}
                size="md"
                placeholder="Type new content..."
                onChange={(v: string) => setContent(v)}
                autoFocus={true}
                style={{ 
                  color: "#fff", 
                  backgroundColor: "rgba(0,0,0,0.2)", 
                  padding: 12, 
                  borderRadius: 8,
                  marginBottom: 15,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)"
                }}
              />
              <RN.Text style={{ color: "#bbb", marginBottom: 8, fontSize: 12, fontWeight: "bold" }}>PREVIEW:</RN.Text>
              <RN.View style={{ 
                padding: 10, 
                backgroundColor: "#313338", 
                borderRadius: 8,
                overflow: "hidden"
              }}>
                <ChatItemWrapper
                  key={renderKey} // THIS FORCES THE UI TO RE-RENDER
                  rowGenerator={new RowManager()}
                  message={new MessageRecord({
                    ...message,
                    content: content,
                    // Completely wipe these to ensure the new content is parsed fresh
                    content_parsed: undefined,
                    content_formatted: undefined,
                    _contentMarkup: undefined,
                    contentParsed: undefined,
                    contentFormatted: undefined
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
