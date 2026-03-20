import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps, findByName } from "@vendetta/metro";
import { React, clipboard, ReactNative as RN, storage } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const TextInput = findByProps("render", "displayName")?.default || findByName("TextInput");
const GuildMemberStore = findByProps("getMember", "getNick");
const SelectedGuildStore = findByProps("getGuildId");

// Top-level storage safety
if (!storage.favorites) storage.favorites = [];

const getDisplayFont = (fontId: number) => {
  switch (fontId) {
    case 12: return "ZillaSlab-SemiBold";
    case 3:  return "CherryBombOne-Normal";
    case 4:  return "Chicle-Normal";
    case 6:  return "MuseoModerno-Medium";
    case 8:  return "PixelifySans-Normal";
    case 10: return "Sinistre-Normal";
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
  const primaryGuild = author.primaryGuild;
  const guildTag = primaryGuild?.tag;
  const guildBadgeUrl = primaryGuild?.badge 
    ? `https://cdn.discordapp.com/clan-badges/${primaryGuild.identityGuildId}/${primaryGuild.badge}.png` 
    : null;

  const fontId = author?.displayNameStyles?.fontId;
  const nameFont = getDisplayFont(fontId);
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
                <RN.View style={{ width: 40, height: 40, marginRight: 10 }}>
                  <RN.Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  {decorationData && (
                    <RN.Image 
                      source={{ uri: `https://cdn.discordapp.com/avatar-decoration-presets/${decorationData.asset}.png` }} 
                      style={{ position: "absolute", width: 48, height: 48, top: -4, left: -4, zIndex: 1 }} 
                    />
                  )}
                </RN.View>
                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                    <RN.View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
                      <RN.Text numberOfLines={1} ellipsizeMode="tail" style={{ color: roleColor, fontFamily: nameFont, fontSize: 16, flexShrink: 1 }}>{displayName}</RN.Text>
                      {guildTag && (
                        <RN.View style={{ backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 5, borderRadius: 4, marginLeft: 6, height: 18, justifyContent: "center" }}>
                          <RN.Text style={{ color: "#caccce", fontSize: 11, fontFamily: "ggsans-Semibold" }}>{guildTag}</RN.Text>
                        </RN.View>
                      )}
                    </RN.View>
                    <RN.Text style={{ color: "#949ba4", fontSize: 12, marginLeft: 8, flexShrink: 0 }}>1:37 PM</RN.Text>
                  </RN.View>
                  <RN.Text style={{ color: "#dbdee1", fontSize: 16, fontFamily: "ggsans-Medium" }}>{text || " "}</RN.Text>
                </RN.View>
              </RN.View>
            </RN.View>
          );
        };
        showConfirmationAlert({ title: "Edit Locally", confirmText: "Done", onConfirm: () => {}, children: <Sandbox /> });
        LazyActionSheet.hideActionSheet();
      };

      const openFavoritePrompt = () => {
        showConfirmationAlert({
          title: "Favorite Message",
          content: `Save this message from ${displayName}?`,
          confirmText: "Save",
          onConfirm: () => {
            if (!storage.favorites.some(f => f.id === message.id)) {
              storage.favorites.push({
                id: message.id,
                channelId: message.channel_id,
                guildId: guildId,
                content: message.content,
                authorName: displayName,
                authorAvatar: avatarUrl
              });
              showToast("Saved!", getAssetIDByName("Check"));
            } else {
              showToast("Already saved", getAssetIDByName("Small"));
            }
          }
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
          props: { source: getAssetIDByName(name) || getAssetIDByName("StarIcon") || 0 },
        });

        group.props.children.push(
          <ActionSheetRow key="copy-id" label="Copy ID" icon={createIcon("IdIcon")} onPress={() => { clipboard.setString(message.id); LazyActionSheet.hideActionSheet(); }} />,
          <ActionSheetRow key="fav-msg" label="Favorite Message" icon={createIcon("StarIcon")} onPress={openFavoritePrompt} />,
          <ActionSheetRow key="preview" label="Edit Locally" icon={createIcon("PencilIcon")} onPress={openScreenshotPreview} />
        );
      }
    });
  });
});

export const onUnload = () => unpatch();
