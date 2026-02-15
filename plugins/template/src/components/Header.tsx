import { storage } from "@vendetta/plugin";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";

export default function Header() {
  const [clickCounter, setClickCounter] = React.useState(0);
  const [clickTimeout, setClickTimeout] = React.useState<NodeJS.Timeout | null>(null);

  const bemmoImage = {
    uri: "https://raw.githubusercontent.com/n0t-a-username/RevPlugins/refs/heads/master/plugins/template/src/components/Bemmo.png",
  };

  const styles = stylesheet.createThemedStyleSheet({
    container: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",  // horizontally center entire row
      paddingVertical: 24,
      paddingHorizontal: 16,     // keep padding for wrapping
    },
    avatarContainer: {
      width: 72,
      height: 72,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,           // space between avatar and text
      flexShrink: 0,             // prevent shrinking
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    textContainer: {
      flex: 1,                   // allow text to wrap
      justifyContent: "center",  // vertically center with avatar
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: semanticColors.TEXT_DEFAULT,
      flexWrap: "wrap",
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: "600",
      color: semanticColors.TEXT_MUTED,
      flexWrap: "wrap",
    },
  });

  const handleAvatarPress = () => {
    if (storage.hiddenSettings?.enabled) {
      storage.hiddenSettings.visible = !storage.hiddenSettings.visible;
      const refresh = (globalThis as any).__animalCommandsRefreshSettings;
      if (typeof refresh === "function") refresh();
      return;
    }

    if (clickTimeout) clearTimeout(clickTimeout);

    const newTimeout = setTimeout(() => setClickCounter(0), 1000);
    setClickTimeout(newTimeout);

    const newCounter = clickCounter + 1;
    setClickCounter(newCounter);

    if (newCounter < 10) return;

    storage.hiddenSettings = { ...storage.hiddenSettings, enabled: true, visible: true };
    const refresh = (globalThis as any).__animalCommandsRefreshSettings;
    if (typeof refresh === "function") refresh();
    setClickCounter(0);
  };

  return (
    <RN.View style={styles.container}>
      <RN.Pressable style={styles.avatarContainer} onPress={handleAvatarPress}>
        <RN.Image source={bemmoImage} style={styles.avatar} resizeMode="cover" />
      </RN.Pressable>
      <RN.View style={styles.textContainer}>
        <RN.Text style={styles.title}>Bemmo</RN.Text>
        <RN.Text style={styles.subtitle}>
          The only self-bot for Vendetta fork-based mobile clients!
        </RN.Text>
      </RN.View>
    </RN.View>
  );
}