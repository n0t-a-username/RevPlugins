import { patcher } from "@vendetta";
import { findByName } from "@vendetta/metro";
import { ReactNative as RN, React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

const ThemeBackground = ({ children }: { children: any }) => {
  useProxy(storage);
  const theme = storage.theme;

  // DEBUG: If no URL, we still show a red background to prove the patch works
  const uri = theme?.backgroundUrl || "";

  return (
    <RN.View style={{ flex: 1, backgroundColor: "red", borderWeight: 5, borderColor: "yellow" }}>
      {uri ? (
        <RN.Image
          source={{ uri }}
          style={[RN.StyleSheet.absoluteFill, { opacity: theme.opacity ?? 1 }]}
          resizeMode="cover"
        />
      ) : null}
      <RN.View style={{ flex: 1, backgroundColor: `rgba(0,0,0,${1 - (theme.chatOpacity ?? 0.5)})` }}>
        {children}
      </RN.View>
    </RN.View>
  );
};

export function initTheme() {
  // We are going to try to patch three different potential targets
  const targets = [
    findByName("MessagesWrapper", false),
    findByName("Messages", false),
    findByName("Chat", false)
  ].filter(Boolean);

  if (targets.length === 0) return;

  const unpatches = targets.map(target => 
    patcher.after("render", target.prototype, (_, res) => {
      if (!res) return res;
      
      // Force transparency on the incoming Discord component
      if (res.props) {
        res.props.style = [RN.StyleSheet.flatten(res.props.style), { backgroundColor: "transparent" }];
      }

      return <ThemeBackground>{res}</ThemeBackground>;
    })
  );

  return () => unpatches.forEach(u => u());
}
