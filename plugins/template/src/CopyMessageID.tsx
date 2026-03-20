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

// Stores for Server-specific data
const GuildMemberStore = findByProps("getMember", "getNick");
const SelectedGuildStore = findByProps("getGuildId");

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  // --- SERVER DATA CAPTURE ---
  const guildId = SelectedGuildStore.getGuildId();
  const member = guildId ? GuildMemberStore.getMember(guildId, message.author.id) : null;

  // Fallback to global if no server-specific data exists
  const displayName = member?.nick || message.author.globalName || message.author.username;
  const avatarUrl = member?.avatar 
    ? `https://cdn.discordapp.com/guilds/${guildId}/users/${message.author.id}/avatars/${member.avatar}.png`
    : message.author.getAvatarURL?.() || `https://cdn.discordapp.com/embed/avatars/0.png`;

  // Role Color Logic
  const roleColor = member?.colorString || "#ffffff"; 
  
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
              
              <RN.View style={{ 
                paddingVertical: 10, 
                paddingHorizontal: 12,
                backgroundColor: "#313338", 
                borderRadius: 8,
                flexDirection: "row"
              }}>
                <RN.Image 
                  source={{ uri: avatarUrl }} 
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 14 }} 
                />
                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
                    <RN.Text style={{ 
                      color: roleColor, // Dynamic Role Color applied here
                      fontWeight: "700", 
                      fontSize: 15, 
                      marginRight: 6,
                      includeFontPadding: false 
                    }}>
                      {displayName}
                    </RN.Text>
                    <RN.Text style={{ color: "#949ba4", fontSize: 11, includeFontPadding: false }}>
                      {formattedTime}
                    </RN.Text>
                  </RN.View>
                  <RN.Text style={{ color: "#dbdee1", fontSize: 15, lineHeight: 18, includeFontPadding: false }}>
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
