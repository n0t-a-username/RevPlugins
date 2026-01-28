import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { Forms } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

const { ScrollView, View, Text, TextInput } = RN;
const { FormSection } = Forms;

// Hard initialize exactly 10 slots
if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = ["", "", "", "", "", "", "", "", "", ""];
}

export default function Settings() {
  useProxy(storage);

  const styles = stylesheet.createThemedStyleSheet({
    base: {
      flex: 1,
      backgroundColor: semanticColors.BACKGROUND_MOBILE_PRIMARY,
      padding: 12,
    },
    card: {
      backgroundColor: semanticColors.CARD_BACKGROUND_DEFAULT,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: semanticColors.BORDER_MUTED,
      padding: 12,
      gap: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: semanticColors.TEXT_DEFAULT,
    },
    warning: {
      color: semanticColors.TEXT_WARNING,
      fontSize: 14,
      lineHeight: 18,
    },
    label: {
      color: semanticColors.TEXT_DEFAULT,
      fontSize: 14,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: semanticColors.BACKGROUND_TERTIARY,
      color: semanticColors.TEXT_DEFAULT,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: semanticColors.BORDER_MUTED,
      fontSize: 14,
    },
  });

  return (
    <ScrollView style={styles.base}>
      <View style={styles.card}>
        <Text style={styles.title}>⚠️ Warning</Text>
        <Text style={styles.warning}>
          Messages entered here will be used by /raid.
          You are fully responsible for how this plugin is used.
        </Text>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.title}>Raid Messages</Text>

        <Text style={styles.label}>Message 1</Text>
        <TextInput style={styles.input} value={storage.words[0]} onChangeText={v => storage.words[0] = v} />

        <Text style={styles.label}>Message 2</Text>
        <TextInput style={styles.input} value={storage.words[1]} onChangeText={v => storage.words[1] = v} />

        <Text style={styles.label}>Message 3</Text>
        <TextInput style={styles.input} value={storage.words[2]} onChangeText={v => storage.words[2] = v} />

        <Text style={styles.label}>Message 4</Text>
        <TextInput style={styles.input} value={storage.words[3]} onChangeText={v => storage.words[3] = v} />

        <Text style={styles.label}>Message 5</Text>
        <TextInput style={styles.input} value={storage.words[4]} onChangeText={v => storage.words[4] = v} />

        <Text style={styles.label}>Message 6</Text>
        <TextInput style={styles.input} value={storage.words[5]} onChangeText={v => storage.words[5] = v} />

        <Text style={styles.label}>Message 7</Text>
        <TextInput style={styles.input} value={storage.words[6]} onChangeText={v => storage.words[6] = v} />

        <Text style={styles.label}>Message 8</Text>
        <TextInput style={styles.input} value={storage.words[7]} onChangeText={v => storage.words[7] = v} />

        <Text style={styles.label}>Message 9</Text>
        <TextInput style={styles.input} value={storage.words[8]} onChangeText={v => storage.words[8] = v} />

        <Text style={styles.label}>Message 10</Text>
        <TextInput style={styles.input} value={storage.words[9]} onChangeText={v => storage.words[9] = v} />
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}
