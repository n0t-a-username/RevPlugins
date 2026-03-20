import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps, findByName } from "@vendetta/metro";
import { React, clipboard, ReactNative as RN } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

// For saving the image
const { captureRef } = findByProps("captureRef") || {};
const CameraRoll = findByProps("saveToCameraRoll") || findByProps("save");

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;
const TextInput = findByProps("render", "displayName")?.default || findByName("TextInput");

const GuildMemberStore = findByProps("getMember", "getNick");
const SelectedGuildStore = findByProps("getGuildId");

const getDisplayFont = (fontId: number) => {
  switch (fontId) {
    case 1: return "ggsans-Semibold"; 
    case 2: return "ZillaSlab-SemiBold";
    case 3: return "CherryBombOne-Normal";
    case 4: return "Chicle-Normal";
    case 5: return "MuseoModerno-Medium";
    case 6: return "NeoCastel-Normal";
    case 7: return "PixelifySans-Normal";
    case 8: return "Sinistre-Normal";
    default: return "ggsans-Semibold";
  }
};

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;

  const guildId = SelectedGuildStore.getGuildId();
  const member = guildId ? GuildMemberStore.getMember(guildId, message.author.id) : null;
  const author = message.author;

  const displayName = member?.nick || author.globalName || author.username;
  const avatarUrl = author.getAvatarURL?.() || `https://cdn.discordapp.com/embed/avatars/0.png`;

  const fontId = author.displayNameStyles?.fontId;
  const nameFont = fontId ? getDisplayFont(fontId) : "ggsans-Semibold";

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

      const actionSheetContainer = findInReactTree(component, (x) => 
        Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup"
      );

      const openScreenshotPreview = () => {
        const viewRef = React.useRef(null);

        const Sandbox = () => {
          const [text, setText] = React.useState(initialContent || "");

          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                value={text}
                placeholder="Edit message..."
                onChange={(v: any) => setText(v?.nativeEvent?.text ?? v ?? "")}
                multiline={true}
                autoFocus={true}
                style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", padding: 12, borderRadius: 8, marginBottom: 20, fontFamily: "ggsans-Medium" }}
              />
              
              {/* This is the part we capture */}
              <RN.View 
                ref={viewRef} 
                collapsable={false}
                style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#313338", borderRadius: 8, flexDirection: "row" }}
              >
                <RN.View style={{ width: 40, height: 40, marginRight: 10 }}>
                  <RN.Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  {decorationData && (
                    <RN.Image 
                      source={{ uri: `https://cdn.discordapp.com/avatar-decoration-presets/${decorationData.asset}.png` }} 
                      style={{ position: "absolute", width: 48, height: 48, top: -4, left: -4 }} 
                    />
                  )}
                </RN.View>
                
                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 0 }}>
                    <RN.View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
                      <RN.Text style={{ color: roleColor, fontFamily: nameFont, fontSize: 16, includeFontPadding: false, flexShrink: 1 }}>{displayName}</RN.Text>
                      {guildTag && (
                        <RN.View style={{ backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 5, borderRadius: 4, marginLeft: 6, flexDirection: "row", alignItems: "center", height: 18 }}>
                          {guildBadgeUrl && <RN.Image source={{ uri: guildBadgeUrl }} style={{ width: 12, height: 12, marginRight: 3 }} />}
                          <RN.Text style={{ color: "#caccce", fontSize: 11, fontFamily: "ggsans-Semibold", includeFontPadding: false }}>{guildTag}</RN.Text>
                        </RN.View>
                      )}
                    </RN.View>
                    <RN.Text style={{ color: "#949ba4", fontSize: 12, marginLeft: 8, fontFamily: "ggsans-Medium", flexShrink: 0, includeFontPadding: false }}>1:37 PM</RN.Text>
                  </RN.View>
                  <RN.Text style={{ color: "#dbdee1", fontSize: 16, lineHeight: 20, fontFamily: "ggsans-Medium", paddingBottom: 4, includeFontPadding: false }}>{text || " "}</RN.Text>
                </RN.View>
              </RN.View>
            </RN.View>
          );
        };

        const handleSave = async () => {
          if (!viewRef.current || !captureRef) {
            showToast("Error: Capture utility not found", getAssetIDByName("Small"));
            return;
          }

          try {
            const uri = await captureRef(viewRef.current, {
              format: "png",
              quality: 1.0,
            });
            
            if (CameraRoll?.save) {
               await CameraRoll.save(uri, { type: 'photo' });
            } else {
               // Fallback if CameraRoll isn't directly available
               showToast("Screenshot captured to " + uri, getAssetIDByName("Check"));
            }
            showToast("Saved to Gallery", getAssetIDByName("Check"));
          } catch (e) {
            showToast("Failed to save image", getAssetIDByName("Small"));
          }
        };

        showConfirmationAlert({
          title: "Screenshot Preview",
          confirmText: "Save Image",
          cancelText: "Close",
          onConfirm: handleSave,
          // @ts-expect-error
          children: <Sandbox />,
        });
        LazyActionSheet.hideActionSheet();
      };

      // ... [Injection logic for IdIcon and PencilIcon remains the same]
      if (actionSheetContainer && actionSheetContainer[1]) {
        const group = actionSheetContainer[1];
        const ActionSheetRow = group.props.children[0].type;
        const baseIcon = group.props.children[0].props.icon;
        const createIcon = (name: string) => ({
          $$typeof: baseIcon.$$typeof, type: baseIcon.type, key: null, ref: null,
          props: { source: getAssetIDByName(name) },
        });

        group.props.children.push(
          <ActionSheetRow
            key="copy-message-id"
            label="Copy Message ID"
            icon={createIcon("IdIcon")}
            onPress={() => {
              clipboard.setString(String(message.id));
              showToast("Copied Message ID", getAssetIDByName("toast_copy_link"));
              LazyActionSheet.hideActionSheet();
            }}
          />,
          <ActionSheetRow
            key="screenshot-preview"
            label="Screenshot Preview"
            icon={createIcon("PencilIcon")}
            onPress={openScreenshotPreview}
          />
        );
      }
    });
  });
});

export const onUnload = () => unpatch();
