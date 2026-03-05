import { patcher } from "@vendetta";
import { findByName } from "@vendetta/metro";
import { ReactNative as RN, React } from "@vendetta/metro/common"; // Add React here
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

// This component handles the live-updating visuals
const ThemeBackground = ({ children }: { children: any }) => {
  useProxy(storage);
  const theme = storage.theme;

  if (!theme?.backgroundUrl) return children;

  return (
    <RN.View style={{ flex: 1, backgroundColor: "transparent" }}>
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
  if (!MessagesWrapper) return;

  // We patch the render to wrap the chat in our Observer component
  return patcher.after("render", MessagesWrapper.prototype, (_, res) => {
    return <ThemeBackground>{res}</ThemeBackground>;
  });
}
