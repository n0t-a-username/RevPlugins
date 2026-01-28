import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Button, Forms } from "@vendetta/ui/components";

const { ScrollView, View, Text, TextInput } = RN;
const { FormSection } = Forms;

export default function BemmoSettings() {
  useProxy(storage);

  const [configOpen, setConfigOpen] = React.useState(false);
  const [reloadCounter, setReloadCounter] = React.useState(0);

  // Ensure exactly 10 raid message slots exist
  if (!Array.isArray(storage.words) || storage.words.length !== 10) {
    storage.words = ["", "", "", "", "", "", "", "", "", ""];
  }

  const inputStyle = {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 2,
    borderColor: "#333",
    marginBottom: 12,
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#111" }}>
      {/* Bemmo Card */}
      <View
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 22, marginBottom: 12 }}>
          Bemmo
        </Text>
        <Text style={{ color: "#ccc", marginBottom: 4 }}>
          - Loaded custom raid strings
        </Text>
        <Text style={{ color: "#ccc", marginBottom: 12 }}>
          - Loaded commands
        </Text>

        {/* Buttons */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            title="Reload"
            onPress={() => setReloadCounter(reloadCounter + 1)}
          />
          <Button
            title="Configuration"
            onPress={() => setConfigOpen(!configOpen)}
          />
        </View>
      </View>

      {/* Configuration Section */}
      {configOpen && (
        <View
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <FormSection title="Raid Messages (10)">
            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 1</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[0]}
              onChangeText={(v) => (storage.words[0] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 2</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[1]}
              onChangeText={(v) => (storage.words[1] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 3</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[2]}
              onChangeText={(v) => (storage.words[2] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 4</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[3]}
              onChangeText={(v) => (storage.words[3] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 5</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[4]}
              onChangeText={(v) => (storage.words[4] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 6</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[5]}
              onChangeText={(v) => (storage.words[5] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 7</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[6]}
              onChangeText={(v) => (storage.words[6] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 8</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[7]}
              onChangeText={(v) => (storage.words[7] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 9</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[8]}
              onChangeText={(v) => (storage.words[8] = v)}
            />

            <Text style={{ color: "#fff", marginBottom: 4 }}>Message 10</Text>
            <TextInput
              style={inputStyle}
              value={storage.words[9]}
              onChangeText={(v) => (storage.words[9] = v)}
            />
          </FormSection>
        </View>
      )}
    </ScrollView>
  );
}
