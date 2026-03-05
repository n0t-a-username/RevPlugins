import { patcher } from "@vendetta";
import { findByName } from "@vendetta/metro";
import { ReactNative as RN, React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

const ThemeBackground = ({ children }: { children: any }) => {
  useProxy(storage);
  const theme = storage.theme;

  // If no URL is set, just show the chat normally
  if (!theme?.backgroundUrl) return children;

  return (
    <RN.View style={{ flex: 1, backgroundColor: "#000" }}> 
      <RN.Image
        source={{ uri: theme.backgroundUrl }}
        style={[
          RN.StyleSheet.absoluteFill,
          {
            opacity: theme.opacity ?? 1,
            width: "100%",
            height: "100%",
          }
        ]}
        blurRadius={theme.blur ?? 0}
        resizeMode="cover"
      />
      <RN.View 
        style={{ 
          flex: 1, 
          backgroundColor: `rgba(0, 0, 0, ${1 - (theme.chatOpacity ?? 0.8)})` 
        }}
      >
        {children}
      </RN.View>
    </RN.View>
  );
};

export function initTheme() {
  const MessagesWrapper = findByName("MessagesWrapper", false);
  
  if (!MessagesWrapper) {
    console.log("[Bemmo] MessagesWrapper NOT found. Theme will not apply.");
    return;
  }

  return patcher.after("render", MessagesWrapper.prototype, (_, res) => {
    // This is the "Magic" UI fix:
    // We find the background style of the chat and kill it.
    if (res?.props?.style) {
      const flatStyle = RN.StyleSheet.flatten(res.props.style);
      res.props.style = [flatStyle, { backgroundColor: "transparent" }];
    }

    return <ThemeBackground>{res}</ThemeBackground>;
  });
}
