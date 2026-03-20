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

  // --- DATA EXTRACTION FROM YOUR JSON ---
  const author = message.author;
  const displayName = message.nick || author.globalName || author.username;
  
  // Avatar & Decor
  const avatarUrl = author.getAvatarURL?.() || `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`;
  const decorationData = author.avatarDecorationData;
  const decorationUrl = decorationData 
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${decorationData.asset}.png` 
    : null;

  // Primary Guild (The Tag & Icon)
  const primaryGuild = author.primaryGuild;
  const guildTag = primaryGuild?.tag;
  const guildBadgeUrl = primaryGuild?.badge 
    ? `https://cdn.discordapp.com/clan-badges/${primaryGuild.identityGuildId}/${primaryGuild.badge}.png` 
    : null;

  // Colors
  const roleColor = message.colorString || "#ffffff";
  // Check if member object exists for gradients, else fallback to roleColor
  const member = message.member; 
  const hasGradient = !!member?.colorGradient;
  const gradientColors = member?.colorGradient?.colors?.map(c => c.color) || [roleColor, roleColor];

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          const [text, setText] = React.useState(message.content);
          const formattedTime = React.useMemo(() => {
            try { return moment(message.timestamp).format("LT"); } 
            catch { return "12:00 PM"; }
          }, []);

          const handleTextChange = (v: any) => {
            if (typeof v === "string") setText(v);
            else if (v?.nativeEvent?.text !== undefined) setText(v.nativeEvent.text);
          };

          const NameAndTag = (
            <RN.View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
              <RN.Text 
                numberOfLines={1} 
                ellipsizeMode="tail" 
                style={{ 
                  color: hasGradient ? "#fff" : roleColor, 
                  fontWeight: "700", 
                  fontSize: 15, 
                  includeFontPadding: false, 
                  flexShrink: 1 
                }}
              >
                {displayName}
              </RN.Text>
              
              {guildTag && (
                <RN.View style={{ 
                  backgroundColor: "rgba(255,255,255,0.1)", 
                  paddingHorizontal: 5, 
                  borderRadius: 4, 
                  marginLeft: 4, 
                  flexShrink: 0,
                  flexDirection: "row",
                  alignItems: "center",
                  height: 15
                }}>
                  {guildBadgeUrl && (
                    <RN.Image 
                      source={{ uri: guildBadgeUrl }} 
                      style={{ width: 10, height: 10, marginRight: 3 }} 
                    />
                  )}
                  <RN.Text style={{ color: "#b5bac1", fontSize: 10, fontWeight: "700", includeFontPadding: false }}>
                    {guildTag}
                  </RN.Text>
                </RN.View>
              )}
            </RN.View>
          );

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput value={text} placeholder="Edit..." onChange={handleTextChange} multiline={true} autoFocus={true} style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", padding: 12, borderRadius: 8, marginBottom: 20 }} />
              
              <RN.View style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#313338", borderRadius: 8, flexDirection: "row" }}>
                <RN.View style={{ width: 40, height: 40, marginRight: 14 }}>
                   <RN.Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                   {decorationUrl && <RN.Image source={{ uri: decorationUrl }} style={{ position: "absolute", width: 48, height: 48, top: -4, left: -4 }} />}
                </RN.View>

                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
                    {hasGradient && LinearGradient ? (
                       <LinearGradient colors={gradientColors} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ flexShrink: 1 }}>{NameAndTag}</LinearGradient>
                    ) : NameAndTag}
                    <RN.Text style={{ color: "#949ba4", fontSize: 11, marginLeft: 6, flexShrink: 0, includeFontPadding: false }}>{formattedTime}</RN.Text>
                  </RN.View>
                  <RN.Text style={{ color: "#dbdee1", fontSize: 15, lineHeight: 18, includeFontPadding: false }}>{text}</RN.Text>
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
      } else {
        const actionSheetContainer = findInReactTree(component, (x) => 
          Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup"
        );
        if (actionSheetContainer?.[1]) {
          actionSheetContainer[1].props.children.push(previewButton);
        }
      }
    });
  });
});

export const onUnload = () => unpatch();
