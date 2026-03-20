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

// Discord's internal Text component (includes their custom fonts)
const Text = findByProps("Colors", "Sizes")?.default || findByName("Text");
const moment = findByProps("moment")?.moment || findByProps("tz");

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

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

          const formattedTime = React.useMemo(() => {
            try { return moment(timestamp).format("LT"); } 
            catch { return "Today at 12:00 PM"; }
          }, [timestamp]);

          const handleTextChange = (v: any) => {
            if (typeof v === "string") setText(v);
            else if (v?.nativeEvent?.text !== undefined) setText(v.nativeEvent.text);
          };

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                value={text}
                placeholder="Edit message..."
                onChange={handleTextChange}
                multiline={true}
                autoFocus={true}
                style={{ 
                  color: "#fff", 
                  backgroundColor: "rgba(255,255,255,0.07)", 
                  padding: 12, 
                  borderRadius: 8,
                  marginBottom: 20
                }}
              />
              
              <RN.View style={{ 
                paddingVertical: 14, 
                paddingHorizontal: 16,
                backgroundColor: "#313338", 
                borderRadius: 8,
                flexDirection: "row"
              }}>
                {/* Avatar */}
                <RN.Image 
                  source={{ uri: avatarUrl }} 
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 16 }} 
                />

                <RN.View style={{ flex: 1 }}>
                  {/* Name & Time Row */}
                  <RN.View style={{ 
                    flexDirection: "row", 
                    alignItems: "center", // This centers the time with the name
                    marginBottom: 1 // Tight spacing
                  }}>
                    <Text style={{ 
                      color: "#fff", 
                      fontWeight: "500", 
                      fontSize: 16, 
                      marginRight: 8 
                    }}>
                      {username}
                    </Text>
                    <Text style={{ 
                      color: "#949ba4", 
                      fontSize: 12 
                    }}>
                      {formattedTime}
                    </Text>
                  </RN.View>

                  {/* Message Content */}
                  <Text style={{ 
                    color: "#dbdee1", 
                    fontSize: 16, 
                    lineHeight: 22 // Standard Discord leading
                  }}>
                    {text}
                  </Text>
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

      const previewButton = (
        <FormRow
          key="screenshot-preview"
          label="Screenshot Preview"
          leading={<FormIcon source={getAssetIDByName("eye")} />}
          onPress={openScreenshotPreview}
        />
      );

      // (Keep existing Copy ID button logic here)
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
