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
          const [content, setContent] = React.useState(message.content);
          const [displayComponent, setDisplayComponent] = React.useState(true);

          // Every time content changes, we briefly unmount and remount 
          // to kill any ghost cache in ChatItemWrapper
          React.useEffect(() => {
            setDisplayComponent(false);
            const timeout = setTimeout(() => setDisplayComponent(true), 10);
            return () => clearTimeout(timeout);
          }, [content]);

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                defaultValue={content}
                placeholder="Type something new..."
                onChange={(v: string) => setContent(v)}
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
                minHeight: 80,
                justifyContent: 'center'
              }}>
                {displayComponent && (
                  <ChatItemWrapper
                    rowGenerator={new RowManager()}
                    message={new MessageRecord({
                      ...message.toJS?.() || message, // Try to convert to plain object first
                      id: `temp-${Date.now()}`, // New ID to prevent internal memoization
                      content: content,
                      content_parsed: undefined,
                      content_formatted: undefined,
                      _contentMarkup: undefined,
                      contentParsed: undefined,
                      contentFormatted: undefined
                    })}
                  />
                )}
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
