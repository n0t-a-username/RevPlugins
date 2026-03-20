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

// We'll use these for a pixel-perfect replica
const moment = findByProps("moment")?.moment || findByProps("tz");

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  // Capture only the visual data we need
  const username = message.author?.username || "Unknown";
  const avatarUrl = message.author?.getAvatarURL?.() || `https://cdn.discordapp.com/embed/avatars/0.png`;
  const timestamp = message.timestamp;
  const initialContent = message.content;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          const [text, setText] = React.useState(initialContent);

          // Format the timestamp exactly like Discord (e.g., "9:36 PM")
          const formattedTime = React.useMemo(() => {
            try {
               return moment(timestamp).format("LT");
            } catch {
               return "Today at 12:00 PM";
            }
          }, [timestamp]);

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                value={text}
                placeholder="Edit message text..."
                onChange={(v: string) => setText(v)}
                multiline={true}
                autoFocus={true}
                style={{ 
                  color: "#fff", 
                  backgroundColor: "rgba(255,255,255,0.07)", 
                  padding: 12, 
                  borderRadius: 8,
                  marginBottom: 20,
                  fontSize: 16
                }}
              />
              
              <RN.Text style={{ color: "#aaa", marginBottom: 8, fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 }}>PREVIEW</RN.Text>
              
              {/* THE MANUAL UI REPLICA */}
              <RN.View style={{ 
                padding: 12, 
                backgroundColor: "#313338", 
                borderRadius: 12,
                flexDirection: "row",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.05)"
              }}>
                {/* Avatar */}
                <RN.Image 
                  source={{ uri: avatarUrl }} 
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} 
                />

                {/* Message Body */}
                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 2 }}>
                    <RN.Text style={{ color: "#fff", fontWeight: "600", fontSize: 15, marginRight: 8 }}>
                      {username}
                    </RN.Text>
                    <RN.Text style={{ color: "#949ba4", fontSize: 11 }}>
                      {formattedTime}
                    </RN.Text>
                  </RN.View>
                  
                  <RN.Text style={{ color: "#dbdee1", fontSize: 15, lineHeight: 20 }}>
                    {text || " "}
                  </RN.Text>
                </RN.View>
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
