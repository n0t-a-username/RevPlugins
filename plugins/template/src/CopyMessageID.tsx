import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps, findByName } from "@vendetta/metro";
import { React, clipboard, ReactNative as RN } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

// Safer module lookups
const ViewShot = findByProps("captureRef");
const MediaEditor = findByProps("saveToCameraRoll") || findByProps("save");

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
  const nameFont = author.displayNameStyles?.fontId ? getDisplayFont(author.displayNameStyles.fontId) : "ggsans-Semibold";
  const roleColor = member?.colorString || "#ffffff"; 

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const openScreenshotPreview = () => {
        const viewRef = React.useRef(null);

        const Sandbox = () => {
          const [text, setText] = React.useState(message.content || "");
          return (
            <RN.View style={{ marginTop: 10 }}>
              <TextInput
                value={text}
                placeholder="Edit message..."
                onChange={(v: any) => setText(v?.nativeEvent?.text ?? v ?? "")}
                multiline={true} autoFocus={true}
                style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", padding: 12, borderRadius: 8, marginBottom: 20, fontFamily: "ggsans-Medium" }}
              />
              <RN.View ref={viewRef} collapsable={false} style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: "#313338", borderRadius: 8, flexDirection: "row" }}>
                <RN.View style={{ width: 40, height: 40, marginRight: 10 }}>
                  <RN.Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                </RN.View>
                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <RN.Text style={{ color: roleColor, fontFamily: nameFont, fontSize: 16 }}>{displayName}</RN.Text>
                    <RN.Text style={{ color: "#949ba4", fontSize: 12, marginLeft: 8 }}>1:37 PM</RN.Text>
                  </RN.View>
                  <RN.Text style={{ color: "#dbdee1", fontSize: 16, lineHeight: 20, fontFamily: "ggsans-Medium" }}>{text || " "}</RN.Text>
                </RN.View>
              </RN.View>
            </RN.View>
          );
        };

        const handleSave = async () => {
          if (!ViewShot?.captureRef) return showToast("Capture not supported", getAssetIDByName("Small"));
          
          // Small delay to prevent layout racing/crashing
          setTimeout(async () => {
            try {
              const uri = await ViewShot.captureRef(viewRef.current, { format: "png", quality: 1.0 });
              if (MediaEditor?.save) {
                await MediaEditor.save(uri, "photo");
                showToast("Saved to Gallery", getAssetIDByName("Check"));
              } else {
                showToast("Captured: " + uri.split('/').pop(), getAssetIDByName("Check"));
              }
            } catch (e) {
              showToast("Capture failed", getAssetIDByName("Small"));
            }
          }, 150);
        };

        showConfirmationAlert({
          title: "Screenshot Preview",
          confirmText: "Save",
          cancelText: "Close",
          onConfirm: handleSave,
          // @ts-expect-error
          children: <Sandbox />,
        });
        LazyActionSheet.hideActionSheet();
      };

      const actionSheetContainer = findInReactTree(component, (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup");
      if (actionSheetContainer?.[1]) {
        const group = actionSheetContainer[1];
        const ActionSheetRow = group.props.children[0].type;
        const baseIcon = group.props.children[0].props.icon;
        const createIcon = (n: string) => ({ $$typeof: baseIcon.$$typeof, type: baseIcon.type, props: { source: getAssetIDByName(n) } });

        group.props.children.push(
          <ActionSheetRow key="copy-id" label="Copy Message ID" icon={createIcon("IdIcon")} onPress={() => { clipboard.setString(message.id); LazyActionSheet.hideActionSheet(); }} />,
          <ActionSheetRow key="preview" label="Screenshot Preview" icon={createIcon("PencilIcon")} onPress={openScreenshotPreview} />
        );
      }
    });
  });
});

export const onUnload = () => unpatch();
