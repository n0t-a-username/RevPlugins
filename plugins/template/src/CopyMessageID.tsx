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

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  const author = message.author;
  const displayName = message.nick || author.globalName || author.username;
  const avatarUrl = author.getAvatarURL?.() || `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`;
  
  const primaryGuild = author.primaryGuild;
  const guildTag = primaryGuild?.tag;
  const guildBadgeUrl = primaryGuild?.badge 
    ? `https://cdn.discordapp.com/clan-badges/${primaryGuild.identityGuildId}/${primaryGuild.badge}.png` 
    : null;

  const roleColor = message.colorString || "#ffffff";
  const member = message.member; 
  const hasGradient = !!member?.colorGradient;
  const gradientColors = member?.colorGradient?.colors?.map(c => c.color) || [roleColor, roleColor];

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          const [text, setText] = React.useState(message.content);
          
          // Matches the "Yesterday at" / "Today at" format in your screenshot
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
                  letterSpacing: -0.2, // gg sans characteristic
                  includeFontPadding: false, 
                  flexShrink: 1 
                }}
              >
                {displayName}
              </RN.Text>
              
              {guildTag && (
                <RN.View style={{ 
                  backgroundColor: "rgba(255,255,255,0.12)", // Slightly more visible
                  paddingHorizontal: 6, // Wider pill
                  borderRadius: 4, 
                  marginLeft: 6, 
                  flexShrink: 0,
                  flexDirection: "row",
                  alignItems: "center",
                  height: 18 // Taller pill
                }}>
                  {guildBadgeUrl && (
                    <RN.Image source={{ uri: guildBadgeUrl }} style={{ width: 12, height: 12, marginRight: 4 }} />
                  )}
                  <RN.Text style={{ 
                    color: "#caccce", // Lighter silver text
                    fontSize: 11, 
                    fontWeight: "700", 
                    includeFontPadding: false 
                  }}>
                    {guildTag}
                  </RN.Text>
                </RN.View>
              )}
            </RN.View>
          );

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput value={text} placeholder="Edit..." onChange={(v: any) => setText(v?.nativeEvent?.text || v)} multiline={true} autoFocus={true} style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", padding: 12, borderRadius: 8, marginBottom: 20 }} />
              
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
                       <LinearGradient colors={gradientColors} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ flexShrink: 1 }}>{NameAndTag}</LinearGradient>
                    ) : NameAndTag}
                    <RN.Text style={{ color: "#949ba4", fontSize: 12, marginLeft: 8, flexShrink: 0, includeFontPadding: false }}>
                      {formattedTime}
                    </RN.Text>
                  </RN.View>
                  <RN.Text style={{ 
                    color: "#dbdee1", 
                    fontSize: 16, 
                    lineHeight: 22, 
                    letterSpacing: -0.1, 
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

      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");
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
