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
const LinearGradient = findByName("LinearGradient");

// Stores to find missing member data
const GuildMemberStore = findByProps("getMember");
const SelectedGuildStore = findByProps("getGuildId");

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  const author = message.author;
  const guildId = SelectedGuildStore.getGuildId();
  
  // Fetch full member data for gradients/colors
  const member = guildId ? GuildMemberStore.getMember(guildId, author.id) : null;
  
  const displayName = member?.nick || author.globalName || author.username;
  const avatarUrl = author.getAvatarURL?.() || `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`;
  
  const primaryGuild = author.primaryGuild;
  const guildTag = primaryGuild?.tag;
  const guildBadgeUrl = primaryGuild?.badge 
    ? `https://cdn.discordapp.com/clan-badges/${primaryGuild.identityGuildId}/${primaryGuild.badge}.png` 
    : null;

  // COLOR & GRADIENT LOGIC
  const roleColor = member?.colorString || message.colorString || "#ffffff";
  const gradient = member?.colorGradient;
  const hasGradient = !!(gradient && gradient.colors && gradient.colors.length > 0);
  const gradientColors = hasGradient ? gradient.colors.map(c => c.color) : [roleColor, roleColor];

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          const [text, setText] = React.useState(message.content || "");
          const formattedTime = React.useMemo(() => {
            try { return moment(message.timestamp).calendar(); } 
            catch { return "Today at 12:00 PM"; }
          }, []);

          const NameAndTag = (
            <RN.View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
              <RN.Text 
                numberOfLines={1} 
                ellipsizeMode="tail" 
                style={{ 
                  color: hasGradient ? "#fff" : roleColor, 
                  fontWeight: "700", 
                  fontSize: 16, 
                  letterSpacing: -0.3, 
                  includeFontPadding: false, 
                  flexShrink: 1 
                }}
              >
                {displayName}
              </RN.Text>
              
              {guildTag && (
                <RN.View style={{ 
                  backgroundColor: "rgba(255,255,255,0.12)", 
                  paddingHorizontal: 6, 
                  borderRadius: 4, 
                  marginLeft: 6, 
                  flexShrink: 0,
                  flexDirection: "row",
                  alignItems: "center",
                  height: 18
                }}>
                  {guildBadgeUrl && (
                    <RN.Image source={{ uri: guildBadgeUrl }} style={{ width: 12, height: 12, marginRight: 4 }} />
                  )}
                  <RN.Text style={{ color: "#caccce", fontSize: 11, fontWeight: "700", includeFontPadding: false }}>
                    {guildTag}
                  </RN.Text>
                </RN.View>
              )}
            </RN.View>
          );

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput value={text} placeholder="Edit..." onChange={(v: any) => setText(v?.nativeEvent?.text ?? v ?? "")} multiline={true} autoFocus={true} style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", padding: 12, borderRadius: 8, marginBottom: 20 }} />
              
              <RN.View style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#313338", borderRadius: 8, flexDirection: "row" }}>
                <RN.View style={{ width: 42, height: 42, marginRight: 14 }}>
                   <RN.Image source={{ uri: avatarUrl }} style={{ width: 42, height: 42, borderRadius: 21 }} />
                   {author.avatarDecorationData && (
                     <RN.Image 
                       source={{ uri: `https://cdn.discordapp.com/avatar-decoration-presets/${author.avatarDecorationData.asset}.png` }} 
                       style={{ position: "absolute", width: 50, height: 50, top: -4, left: -4 }} 
                     />
                   )}
                </RN.View>

                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 2 }}>
                    {hasGradient && LinearGradient ? (
                       <LinearGradient 
                         colors={gradientColors} 
                         start={{x: 0, y: 0}} 
                         end={{x: 1, y: 0}} 
                         style={{ flexShrink: 1, borderRadius: 2 }} // Small radius helps the gradient clip correctly
                       >
                         {NameAndTag}
                       </LinearGradient>
                    ) : NameAndTag}
                    <RN.Text style={{ color: "#949ba4", fontSize: 12, marginLeft: 8, flexShrink: 0, includeFontPadding: false }}>
                      {formattedTime}
                    </RN.Text>
                  </RN.View>
                  <RN.Text style={{ color: "#dbdee1", fontSize: 16, lineHeight: 22, letterSpacing: -0.2, includeFontPadding: false }}>
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

      // Verify buttons exist and inject
      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");
      if (buttons) {
        buttons.push(copyIdButton, previewButton);
      } else {
        const group = findInReactTree(component, (x) => x?.[0]?.type?.name === "ActionSheetRowGroup" || x?.type?.name === "ActionSheetRowGroup");
        const target = Array.isArray(group) ? group[0] : group;
        if (target?.props?.children) target.props.children.push(copyIdButton, previewButton);
      }
    });
  });
});

export const onUnload = () => unpatch();
