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

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          const [text, setText] = React.useState(initialContent);

          const formattedTime = React.useMemo(() => {
            try { return moment(timestamp).format("LT"); } 
            catch { return "12:00 PM"; }
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
              
              {/* CONTAINER */}
              <RN.View style={{ 
                paddingVertical: 10, 
                paddingHorizontal: 12,
                backgroundColor: "#313338", 
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "flex-start" // Align avatar to top
              }}>
                {/* AVATAR */}
                <RN.Image 
                  source={{ uri: avatarUrl }} 
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 14 }} 
                />

                <RN.View style={{ flex: 1 }}>
                  {/* HEADER ROW (Name + Time) */}
                  <RN.View style={{ 
                    flexDirection: "row", 
                    alignItems: "center", // Perfectly centers time string with name string
                    marginBottom: 2 
                  }}>
                    <RN.Text style={{ 
                      color: "#fff", 
                      fontWeight: "700", // Discord names are quite bold
                      fontSize: 15, 
                      marginRight: 6,
                      includeFontPadding: false
                    }}>
                      {username}
                    </RN.Text>
                    <RN.Text style={{ 
                      color: "#949ba4", 
                      fontSize: 11,
                      fontWeight: "400",
                      includeFontPadding: false
                    }}>
                      {formattedTime}
                    </RN.Text>
                  </RN.View>

                  {/* MESSAGE TEXT */}
                  <RN.Text style={{ 
                    color: "#dbdee1", 
                    fontSize: 15, 
                    lineHeight: 18, // Reduced spacing between header and text
                    includeFontPadding: false
                  }}>
                    {text}
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

      const previewButton = (
        <FormRow
          key="screenshot-preview"
          label="Screenshot Preview"
          leading={<FormIcon source={getAssetIDByName("eye")} />}
          onPress={openScreenshotPreview}
        />
      );

      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");
      if (buttons) {
        buttons.push(previewButton);
      }
    });
  });
});

export const onUnload = () => unpatch();
