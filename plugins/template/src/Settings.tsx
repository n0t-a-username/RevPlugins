import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms } from "@vendetta/ui/components";
import { openModal } from "@vendetta/ui/modals";
import { Reanimated } from "@vendetta/ui/reanimated";

const { ScrollView, View, Text, TextInput, Image, ActivityIndicator } = RN;
const { FormSection } = Forms;

/* ------------------ storage init ------------------ */
if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = ["", "", "", "", "", "", "", "", "", ""];
}

/* ------------------ helpers ------------------ */
const countLoadedStrings = () =>
  storage.words.filter(w => typeof w === "string" && w.trim().length).length;

const LOADED_COMMANDS = [
  "/raid",
  "/fetchprofile",
  "/userid",
];

/* ------------------ styles ------------------ */
const styles = stylesheet.createThemedStyleSheet({
  base: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    backgroundColor: semanticColors.BACKGROUND_PRIMARY,
  },
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: semanticColors.CARD_BACKGROUND_DEFAULT,
    borderWidth: 1,
    borderColor: semanticColors.BORDER_MUTED,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: semanticColors.TEXT_DEFAULT,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: semanticColors.TEXT_DEFAULT,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIcon: {
    width: 16,
    height: 16,
  },
  statusText: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: semanticColors.BUTTON_PRIMARY_BACKGROUND,
  },
  secondaryBtn: {
    backgroundColor: semanticColors.BUTTON_SECONDARY_BACKGROUND,
  },
  primaryText: {
    color: semanticColors.BUTTON_PRIMARY_TEXT,
    fontWeight: "600",
  },
  secondaryText: {
    color: semanticColors.BUTTON_SECONDARY_TEXT,
    fontWeight: "600",
  },
  input: {
    backgroundColor: semanticColors.BACKGROUND_SECONDARY,
    color: semanticColors.TEXT_DEFAULT,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: semanticColors.BORDER_MUTED,
    marginBottom: 10,
  },
});

/* ------------------ config modal ------------------ */
function ConfigModal() {
  useProxy(storage);

  return (
    <ScrollView style={{ padding: 16 }}>
      <FormSection title="Raid Messages">
        {storage.words.map((_, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <Text style={{ color: semanticColors.TEXT_DEFAULT, marginBottom: 4 }}>
              Message {i + 1}
            </Text>
            <TextInput
              style={styles.input}
              value={storage.words[i]}
              onChangeText={v => (storage.words[i] = v)}
              placeholder="Enter raid message"
              placeholderTextColor={semanticColors.TEXT_MUTED}
            />
          </View>
        ))}
      </FormSection>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ------------------ main settings ------------------ */
export default function Settings() {
  useProxy(storage);

  return (
    <View style={styles.base}>
      <Reanimated.View
        entering={Reanimated.FadeInUp.duration(200)}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <Image
            source={getAssetIDByName("RobotIcon")}
            style={styles.headerIcon}
          />
          <Text style={styles.headerText}>Bemmo</Text>
        </View>

        <View style={styles.statusRow}>
          <Image
            source={getAssetIDByName("CircleCheckIcon-primary")}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            Loaded raid custom strings: {countLoadedStrings()}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Image
            source={getAssetIDByName("CircleCheckIcon-primary")}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            Loaded commands: {LOADED_COMMANDS.join(", ")}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <View style={[styles.button, styles.primaryBtn]}>
            <Text style={styles.primaryText}>Reload</Text>
          </View>

          <View
            style={[styles.button, styles.secondaryBtn]}
            onTouchEnd={() =>
              openModal("bemmo-config", () => <ConfigModal />)
            }
          >
            <Text style={styles.secondaryText}>Configuration</Text>
          </View>
        </View>
      </Reanimated.View>
    </View>
  );
}
