import { patcher } from "@vendetta";
import { findByName } from "@vendetta/metro";
import { ReactNative as RN, React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

const ThemeBackground = ({ children }: { children: any }) => {
  useProxy(storage);
  const theme = storage.theme;

  // If no URL, just return the chat normally
  if (!theme?.backgroundUrl) return children;

  return (
    <RN.View style={{ flex: 1, backgroundColor: "transparent" }}>
      <RN.Image
        source={{ uri: theme.backgroundUrl }}
        pointerEvents="none" 
        style={[
          RN.StyleSheet.absoluteFill,
          {
            opacity: theme.opacity ?? 1,
            width: "100%",
            height: "100%",
          }
        ]}
        blurRadius={theme.blur ?? 0}
      />
      {/* This View acts as the "dimmer" for the chat area */}
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
  if (!MessagesWrapper) return;

  // We patch the render of the chat container
  return patcher.after("render", MessagesWrapper.prototype, (_, res) => {
    // If the chat has a default background, we force it to be transparent
    if (res?.props?.style) {
        res.props.style = [res.props.style, { backgroundColor: "transparent" }];
    }
    
    return <ThemeBackground>{res}</ThemeBackground>;
  });
}
