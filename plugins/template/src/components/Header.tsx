import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { storage } from "@vendetta/plugin";

export default function Header() {
  const [clickCounter, setClickCounter] = React.useState(0);
  const [clickTimeout, setClickTimeout] = React.useState<NodeJS.Timeout | null>(
    null
  );

  const styles = stylesheet.createThemedStyleSheet({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      paddingHorizontal: 16,
      width: "100%",
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
      maxWidth: 500,
    },
    avatarWrapper: {
      width: 72,
      height: 72,
      borderRadius: 20,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: semanticColors.BACKGROUND_SECONDARY,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 18,
    },
    textContainer: {
      justifyContent: "center",
      flexShrink: 1,
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
        getAssetIDByName("SettingsIcon")
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
        <RN.Pressable style={styles.avatarWrapper} onPress={handleAvatarPress}>
          <RN.Image
            source={{ uri: "https://raw.githubusercontent.com/n0t-a-username/RevPlugins/refs/heads/master/plugins/template/src/components/Bemmo.png" }}
            style={styles.avatar}
            resizeMode="cover"
          />
        </RN.Pressable>

        <RN.View style={styles.textContainer}>
          <RN.Text style={styles.title}>Bemmo</RN.Text>
          <RN.Text style={styles.subtitle}>
            The only self-bot for vendetta fork based mobile clients!
          </RN.Text>
        </RN.View>
      </RN.View>
    </RN.View>
  );
}