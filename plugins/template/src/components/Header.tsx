import { storage } from "@vendetta/plugin";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { findByProps } from "@vendetta/metro";

export default function Header() {
  const [clickCounter, setClickCounter] = React.useState(0);
  const [clickTimeout, setClickTimeout] = React.useState<NodeJS.Timeout | null>(null);

  const bemmoImage = {
    uri: "https://raw.githubusercontent.com/n0t-a-username/RevPlugins/refs/heads/master/plugins/template/src/components/Bemmo.png",
  };

  const styles = stylesheet.createThemedStyleSheet({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 16,
      width: "100%",
      justifyContent: "center",
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 20,
      maxWidth: 500,
    },
    avatarContainer: {
      position: "relative",
      width: 96,
      height: 96,
      justifyContent: "center",
      alignItems: "center",
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48, // circular
    },
    textContainer: {
      flex: 1,
      marginLeft: 4,
      justifyContent: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: semanticColors.TEXT_DEFAULT,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: "600",
      color: semanticColors.TEXT_MUTED,
    },
  });

  const handleAvatarPress = () => {
    if (storage.hiddenSettings?.enabled) {
      storage.hiddenSettings.visible = !storage.hiddenSettings.visible;
      showToast(
        `Hidden settings ${storage.hiddenSettings.visible ? "visible" : "hidden"}`,
        getAssetIDByName("SettingsIcon"),
      );
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

    showToast("Hidden settings unlocked!", getAssetIDByName("CheckmarkIcon"));
    storage.hiddenSettings = { ...storage.hiddenSettings, enabled: true, visible: true };
    const refresh = (globalThis as any).__animalCommandsRefreshSettings;
    if (typeof refresh === "function") refresh();
    setClickCounter(0);
  };

  return (
    <RN.View style={styles.container}>
      <RN.View style={styles.leftSection}>
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
    </RN.View>
  );
}