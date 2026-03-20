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
    case 1: return "ggsans-Semibold"; 
    case 2: return "Cursive";     
    case 3: return "Comic Sans MS"; 
    case 4: return "monospace";   
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
              
              <RN.View style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#313338", borderRadius: 8, flexDirection: "row" }}>
                <RN.View style={{ width: 40, height: 40, marginRight: 12 }}>
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

        showConfirmationAlert({
          title: "Screenshot Preview",
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
          key: null,
          ref: null,
          props: { source: getAssetIDByName(name) },
        });

        const copyButton = (
          <ActionSheetRow
            key="copy-message-id"
            label="Copy Message ID"
            icon={createIcon("IdIcon")}
            onPress={() => {
              clipboard.setString(String(message.id));
              showToast("Copied Message ID", getAssetIDByName("toast_copy_link"));
              LazyActionSheet.hideActionSheet();
            }}
          />
        );

        const previewButton = (
          <ActionSheetRow
            key="screenshot-preview"
            label="Screenshot Preview"
            icon={createIcon("PencilIcon")}
            onPress={openScreenshotPreview}
          />
        );

        group.props.children.push(copyButton, previewButton);
      } else {
        // Fallback for ButtonRow injection if container is missing
        const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");
        if (buttons) {
          buttons.push(
            <FormRow key="copy-message-id" label="Copy Message ID" leading={<FormIcon source={getAssetIDByName("IdIcon")} />} onPress={() => { clipboard.setString(String(message.id)); LazyActionSheet.hideActionSheet(); }} />,
            <FormRow key="screenshot-preview" label="Screenshot Preview" leading={<FormIcon source={getAssetIDByName("PencilIcon")} />} onPress={openScreenshotPreview} />
          );
        }
      }
    });
  });
});

export const onUnload = () => unpatch();