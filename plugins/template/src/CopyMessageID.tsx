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

const GuildMemberStore = findByProps("getMember", "getNick");
const SelectedGuildStore = findByProps("getGuildId");

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  const guildId = SelectedGuildStore.getGuildId();
  const member = guildId ? GuildMemberStore.getMember(guildId, message.author.id) : null;

  const displayName = member?.nick || message.author.globalName || message.author.username;
  const avatarUrl = member?.avatar 
    ? `https://cdn.discordapp.com/guilds/${guildId}/users/${message.author.id}/avatars/${member.avatar}.png`
    : message.author.getAvatarURL?.() || `https://cdn.discordapp.com/embed/avatars/0.png`;

  // --- Identity Extras ---
  const author = message.author;
  const decorationData = author.avatarDecorationData;
  const primaryGuild = author.primaryGuild;
  const guildTag = primaryGuild?.tag;
  const guildBadgeUrl = primaryGuild?.badge 
    ? `https://cdn.discordapp.com/clan-badges/${primaryGuild.identityGuildId}/${primaryGuild.badge}.png` 
    : null;

  const roleColor = member?.colorString || "#ffffff"; 
  const initialContent = message.content;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      // Your working button detection
      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          const [text, setText] = React.useState(initialContent || "");

          const handleTextChange = (v: any) => {
            if (typeof v === "string") setText(v);
            else if (v?.nativeEvent?.text !== undefined) setText(v.nativeEvent.text);
          };

          const NameAndTag = (
            <RN.View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
              <RN.Text 
                numberOfLines={1} 
                ellipsizeMode="tail"
                style={{ color: roleColor, fontWeight: "700", fontSize: 15, includeFontPadding: false, flexShrink: 1 }}
              >
                {displayName}
              </RN.Text>
              
              {guildTag && (
                <RN.View style={{ 
                  backgroundColor: "rgba(255,255,255,0.1)", 
                  paddingHorizontal: 3, // Tightened
                  borderRadius: 4, 
                  marginLeft: 4, 
                  flexShrink: 0,
                  flexDirection: "row",
                  alignItems: "center",
                  height: 14 // Tightened
                }}>
                  {guildBadgeUrl && (
                    <RN.Image source={{ uri: guildBadgeUrl }} style={{ width: 10, height: 10, marginRight: 2 }} />
                  )}
                  <RN.Text style={{ color: "#caccce", fontSize: 9, fontWeight: "700", includeFontPadding: false }}>
                    {guildTag}
                  </RN.Text>
                </RN.View>
              )}
            </RN.View>
          );

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                value={text}
                placeholder="Edit message..."
                onChange={handleTextChange}
                multiline={true}
                autoFocus={true}
                style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", padding: 12, borderRadius: 8, marginBottom: 20 }}
              />
              
              <RN.View style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#313338", borderRadius: 8, flexDirection: "row" }}>
                <RN.View style={{ width: 40, height: 40, marginRight: 14 }}>
                  <RN.Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  {decorationData && (
                    <RN.Image 
                      source={{ uri: `https://cdn.discordapp.com/avatar-decoration-presets/${decorationData.asset}.png` }} 
                      style={{ position: "absolute", width: 48, height: 48, top: -4, left: -4 }} 
                    />
                  )}
                </RN.View>
                
                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
                    {NameAndTag}

                    <RN.Text style={{ color: "#949ba4", fontSize: 11, marginLeft: 6, flexShrink: 0, includeFontPadding: false }}>
                      1:37 PM
                    </RN.Text>
                  </RN.View>

                  <RN.Text style={{ color: "#dbdee1", fontSize: 15, lineHeight: 18, includeFontPadding: false }}>
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
          leading={<FormIcon source={getAssetIDByName("copy")} />}
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
