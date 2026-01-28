import { React, ReactNative as RN } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { storage } from "@vendetta/plugin";
import { Forms } from "@vendetta/ui/components";
import { openModal, closeModal } from "@vendetta/ui/modals";

const { ScrollView, View, Text, TextInput, Button } = RN;
const { FormSection } = Forms;

// Ensure exactly 10 raid slots
if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = Array(10).fill("");
}

export default function BemmoSettings() {
  const [reloadCounter, setReloadCounter] = React.useState(0);

  // Configuration Modal
  const ConfigModal = () => {
    return (
      <ScrollView
        style={{
          backgroundColor: semanticColors.BACKGROUND_MODAL,
          padding: 16,
          maxHeight: "90%",
        }}
      >
        <FormSection title="Raid Messages">
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 1</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[0]}
              onChangeText={(v) => (storage.words[0] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 2</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[1]}
              onChangeText={(v) => (storage.words[1] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 3</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[2]}
              onChangeText={(v) => (storage.words[2] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 4</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[3]}
              onChangeText={(v) => (storage.words[3] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 5</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[4]}
              onChangeText={(v) => (storage.words[4] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 6</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[5]}
              onChangeText={(v) => (storage.words[5] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 7</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[6]}
              onChangeText={(v) => (storage.words[6] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 8</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[7]}
              onChangeText={(v) => (storage.words[7] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 9</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[8]}
              onChangeText={(v) => (storage.words[8] = v)}
            />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message 10</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[9]}
              onChangeText={(v) => (storage.words[9] = v)}
            />
          </View>
        </FormSection>

        <Button text="Close" onPress={() => closeModal()} />
      </ScrollView>
    );
  };

  const inputStyle = {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 2,
    borderColor: "#333",
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        backgroundColor: semanticColors.BACKGROUND_PRIMARY,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 16,
          borderRadius: 16,
          backgroundColor: semanticColors.CARD_BACKGROUND_DEFAULT,
          borderColor: semanticColors.BORDER_MUTED,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: semanticColors.TEXT_DEFAULT,
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
          Bemmo
        </Text>
        <Text style={{ color: "#aaa" }}>
          - Loaded {storage.words.filter((w) => w.trim()).length} custom raid
          strings
        </Text>
        <Text style={{ color: "#aaa" }}>- Loaded commands</Text>

        <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
          <Button
            text="Reload"
            onPress={() => setReloadCounter((c) => c + 1)}
          />
          <Button
            text="Configuration"
            onPress={() => openModal(() => <ConfigModal />)}
          />
        </View>
      </View>

      <Text style={{ color: "#aaa", marginTop: 16 }}>
        Reload count: {reloadCounter}
      </Text>
    </View>
  );
}
