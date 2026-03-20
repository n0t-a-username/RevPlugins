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

const getDisplayFont = (fontId: number) => {
  switch (fontId) {
    case 12: return "ZillaSlab-SemiBold";   // Case 1/2
    case 3:  return "CherryBombOne-Normal";
    case 4:  return "Chicle-Normal";
    case 6:  return "MuseoModerno-Medium";  // Case 5 is 6
    case 8:  return "PixelifySans-Normal";  // Case 7 is 8
    case 10: return "Sinistre-Normal";      // Case 8 is 10
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
  const decorationData = author.avatarDecorationData;

  const fontId = author?.displayNameStyles?.fontId;
  const nameFont = (fontId !== undefined && fontId !== null) ? getDisplayFont(fontId) : "ggsans-Semibold";
  const roleColor = member?.colorString || "#ffffff"; 

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const actionSheetContainer = findInReactTree(component, (x) => 
        Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup"
      );

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          const [text, setText] = React.useState(message.content || "");

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
              
              <RN.View style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#313338", borderRadius: 8, flexDirection: "row" }}>
                {/* Fixed Avatar + Decoration Container */}
                <RN.View style={{ width: 40, height: 40, marginRight: 10 }}>
                  <RN.Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  {decorationData && (
                    <RN.Image 
                      source={{ uri: `https://cdn.discordapp.com/avatar-decoration-presets/${decorationData.asset}.png` }} 
                      style={{ 
                        position: "absolute", 
                        width: 48, 
                        height: 48, 
                        top: -4, 
                        left: -4,
                        // Fix for some decors appearing behind the avatar
                        zIndex: 1 
                      }} 
                    />
                  )}
                </RN.View>
                
                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 0 }}>
                    <RN.Text 
                      numberOfLines={1} 
                      style={{ color: roleColor, fontFamily: nameFont, fontSize: 16, includeFontPadding: false }}
                    >
                      {displayName}
                    </RN.Text>
                    <RN.Text style={{ color: "#949ba4", fontSize: 12, marginLeft: 8, fontFamily: "ggsans-Medium", includeFontPadding: false }}>1:37 PM</RN.Text>
                  </RN.View>
                  <RN.Text style={{ color: "#dbdee1", fontSize: 16, lineHeight: 20, fontFamily: "ggsans-Medium", includeFontPadding: false }}>
                    {text || " "}
                  </RN.Text>
                </RN.View>
              </RN.View>
            </RN.View>
          );
        };

        showConfirmationAlert({
          title: "Edit Message Locally",
          confirmText: "Done",
          onConfirm: () => {},
          // @ts-expect-error
          children: <Sandbox />,
        });
        LazyActionSheet.hideActionSheet();
      };

      if (actionSheetContainer && actionSheetContainer[1]) {
        const group = actionSheetContainer[1];
        const ActionSheetRow = group.props.children[0].type;
        const baseIcon = group.props.children[0].props.icon;

        const createIcon = (name: string) => ({
          $$typeof: baseIcon.$$typeof,
          type: baseIcon.type,
          props: { source: getAssetIDByName(name) },
        });

        group.props.children.push(
          <ActionSheetRow
            key="copy-id"
            label="Copy Message ID"
            icon={createIcon("IdIcon")}
            onPress={() => {
              clipboard.setString(String(message.id));
              showToast("Copied Message ID", getAssetIDByName("toast_copy_link"));
              LazyActionSheet.hideActionSheet();
            }}
          />,
          <ActionSheetRow
            key="preview"
            label="Edit Message Locally"
            icon={createIcon("PencilIcon")}
            onPress={openScreenshotPreview}
          />
        );
      }
    });
  });
});

export const onUnload = () => unpatch();
