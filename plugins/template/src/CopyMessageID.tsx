import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps, findByName } from "@vendetta/metro";
import { React, clipboard, ReactNative as RN } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const TextInput = findByProps("render", "displayName")?.default || findByName("TextInput");
const GuildMemberStore = findByProps("getMember", "getNick");
const SelectedGuildStore = findByProps("getGuildId");

const getEmojiURL = (char: string) => {
  const codePoints = Array.from(char).map(c => c.codePointAt(0)?.toString(16)).join("-");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${codePoints}.png`;
};

const getDisplayFont = (fontId: number) => {
  switch (fontId) {
    case 12: return "ZillaSlab-SemiBold";
    case 3:  return "CherryBombOne-Normal";
    case 4:  return "Chicle-Normal";
    case 6:  return "MuseoModerno-Medium";
    case 7:  return "NeoCastel-Normal"; 
    case 8:  return "PixelifySans-Normal";
    case 10: return "Sinistre-Normal";
    default: return "ggsans-Semibold";
  }
};

const DiscordText = ({ text, style, selfName }: { text: string, style: any, selfName: string }) => {
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  const mentionRegex = /(@[^\s]+)/g;

  const parts = text.split(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|@[^\s]+)/g);

  return (
    <RN.View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" }}>
      {parts.map((part, i) => {
        if (!part) return null;

        if (emojiRegex.test(part)) {
          return (
            <RN.Image 
              key={i}
              source={{ uri: getEmojiURL(part) }} 
              style={{ width: 20, height: 20, marginHorizontal: 1, transform: [{ translateY: 4 }] }} 
            />
          );
        }

        if (mentionRegex.test(part)) {
          return (
            <RN.View key={i} style={{ 
                backgroundColor: "#3e4471", 
                borderRadius: 3, 
                paddingHorizontal: 4, 
                height: 19,
                justifyContent: "center",
                marginHorizontal: 1,
                // Moving the ping down 2 pixels to center it with text
                transform: [{ translateY: 2 }]
            }}>
                <RN.Text style={{ color: "#dee0fc", fontFamily: "ggsans-Medium", fontSize: 15, includeFontPadding: false }}>
                    {part}
                </RN.Text>
            </RN.View>
          );
        }

        return (
          <RN.Text key={i} style={style}>
            {part}
          </RN.Text>
        );
      })}
    </RN.View>
  );
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
          const isGlobalPing = text.includes("@everyone") || text.includes("@here") || text.includes(`@${displayName}`);

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

              <RN.View style={{ 
                paddingVertical: 10, 
                paddingHorizontal: 14, 
                backgroundColor: isGlobalPing ? "rgba(250, 166, 26, 0.05)" : "#313338", 
                borderRadius: 8, 
                flexDirection: "row",
                overflow: "hidden"
              }}>
                {isGlobalPing && (
                  <RN.View style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    backgroundColor: "#faa61a",
                    zIndex: 10
                  }} />
                )}

                <RN.View style={{ width: 40, height: 40, marginRight: 12 }}>
                  <RN.Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                </RN.View>

                <RN.View style={{ flex: 1 }}>
                  {/* Pulling name row and content 2px closer */}
                  <RN.View style={{ flexDirection: "row", alignItems: "center", marginBottom: -3 }}>
                    <RN.View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
                      <RN.Text numberOfLines={1} style={{ color: roleColor, fontFamily: nameFont, fontSize: 16, flexShrink: 1 }}>
                        {displayName}
                      </RN.Text>
                      {guildTag && (
                        <RN.View style={{ backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 5, borderRadius: 4, marginLeft: 6, flexDirection: "row", alignItems: "center", height: 18, flexShrink: 0 }}>
                          {guildBadgeUrl && <RN.Image source={{ uri: guildBadgeUrl }} style={{ width: 12, height: 12, marginRight: 3 }} />}
                          <RN.Text style={{ color: "#caccce", fontSize: 11, fontFamily: "ggsans-Semibold" }}>{guildTag}</RN.Text>
                        </RN.View>
                      )}
                    </RN.View>
                    <RN.Text style={{ color: "#949ba4", fontSize: 12, marginLeft: 8, flexShrink: 0 }}>1:37 PM</RN.Text>
                  </RN.View>

                  <DiscordText 
                    text={text || " "} 
                    selfName={displayName}
                    style={{ color: "#dbdee1", fontSize: 16, lineHeight: 22, fontFamily: "ggsans-Medium", includeFontPadding: false }} 
                  />
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
