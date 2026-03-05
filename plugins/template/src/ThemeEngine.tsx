import { patcher } from "@vendetta";
import { findByName, findByProps } from "@vendetta/metro";
import { ReactNative as RN, React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

const ThemeBackground = ({ children }: { children: any }) => {
  useProxy(storage);
  const theme = storage.theme;

  if (!theme?.backgroundUrl) return children;

  return (
    <RN.View style={{ flex: 1, backgroundColor: "#000" }}>
      <RN.Image
        source={{ uri: theme.backgroundUrl }}
        style={[RN.StyleSheet.absoluteFill, { opacity: theme.opacity ?? 1 }]}
        blurRadius={theme.blur ?? 0}
        resizeMode="cover"
      />
      <RN.View style={{ flex: 1, backgroundColor: `rgba(0,0,0,${1 - (theme.chatOpacity ?? 0.8)})` }}>
        {children}
      </RN.View>
    </RN.View>
  );
};

export function initTheme() {
  // Try multiple common component names for the chat container
  const ChatComponent = 
    findByName("MessagesWrapper", false) || 
    findByName("Messages", false) || 
    findByName("ChatList", false);

  if (!ChatComponent) {
    // If this hits, we need to find the specific obfuscated name for your version
    return; 
  }

  // Force transparency on the component itself
  return patcher.after("render", ChatComponent.prototype, (_, res) => {
    if (!res) return res;

    // Deep-dive into props to kill any solid backgrounds
    const recursiveTransparent = (node: any) => {
      if (node?.props?.style) {
        node.props.style = [RN.StyleSheet.flatten(node.props.style), { backgroundColor: "transparent" }];
      }
      if (node?.props?.children) {
        React.Children.forEach(node.props.children, child => recursiveTransparent(child));
      }
    };

    recursiveTransparent(res);

    return <ThemeBackground>{res}</ThemeBackground>;
  });
}
