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

// Needed for Gradient Support
const LinearGradient = findByName("LinearGradient");

// Stores for Server-specific data
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

  // Gradient / Color Detection
  const hasGradient = !!member?.colorGradient;
  const roleColor = member?.colorString || "#ffffff"; 
  const gradientColors = member?.colorGradient?.colors?.map(c => c.color) || [roleColor, roleColor];

  const timestamp = message.timestamp;
  const initialContent = message.content;

  component.then((instance) => {
    const unpatchInner = after("default", instance, (_, component) => {
      React.useEffect(() => () => unpatchInner(), []);

      const buttons = findInReactTree(component, (x) => x?.[0]?.type?.name === "ButtonRow");

      const openScreenshotPreview = () => {
        const Sandbox = () => {
          const [text, setText] = React.useState(initialContent);
          const formattedTime = React.useMemo(() => {
            try { return moment(timestamp).format("LT"); } 
            catch { return "12:00 PM"; }
          }, [timestamp]);

          const handleTextChange = (v: any) => {
            if (typeof v === "string") setText(v);
            else if (v?.nativeEvent?.text !== undefined) setText(v.nativeEvent.text);
          };

          const NameElement = (
            <RN.Text 
              numberOfLines={1} 
              ellipsizeMode="tail"
              style={{ 
                color: hasGradient ? "#fff" : roleColor, 
                fontWeight: "700", 
                fontSize: 15, 
                includeFontPadding: false,
                flexShrink: 1 // Crucial for letting the name shrink while time stays put
              }}
            >
              {displayName}
            </RN.Text>
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
                <RN.Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 14 }} />
                
                <RN.View style={{ flex: 1 }}>
                  <RN.View style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
                    
                    {/* GRADIENT LOGIC */}
                    {hasGradient && LinearGradient ? (
                       <LinearGradient 
                         colors={gradientColors} 
                         start={{x: 0, y: 0}} 
                         end={{x: 1, y: 0}}
                         style={{ flexShrink: 1, marginRight: 6 }}
                       >
                         {/* We use a white text as a mask for the gradient if needed, 
                             but Discord often just renders the text over the gradient box */}
                         {NameElement}
                       </LinearGradient>
                    ) : (
                      NameElement
                    )}

                    <RN.Text style={{ 
                      color: "#949ba4", 
                      fontSize: 11, 
                      marginLeft: 6, // Spacing from name/ellipsis
                      flexShrink: 0, // Never hide the time
                      includeFontPadding: false 
                    }}>
                      {formattedTime}
                    </RN.Text>
                  </RN.View>

                  <RN.Text style={{ color: "#dbdee1", fontSize: 15, lineHeight: 18, includeFontPadding: false }}>
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
