import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms } from "@vendetta/ui/components";

const { ScrollView, View, Text, TextInput, Button } = RN;
const { FormSection } = Forms;

// Hard initialize exactly 10 raid message slots
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
};

export default function SettingsScreen() {
  useProxy(storage);

  const reload = () => {
    console.log("Reload plugin logic here");
  };

  const openConfig = () => {
    console.log("Open config logic here");
  };

  return (
    <ScrollView style={{ backgroundColor: "#111", flex: 1, padding: 12 }}>
      {/* Center Bemmo card */}
      <View
        style={{
          backgroundColor: "#222",
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
          Bemmo
        </Text>
        <Text style={{ color: "#aaa", marginBottom: 4 }}>- Loaded custom raid strings</Text>
        <Text style={{ color: "#aaa", marginBottom: 12 }}>- Loaded commands</Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button title="Reload" onPress={reload} />
          <Button title="Configuration" onPress={openConfig} />
        </View>
      </View>

      {/* Configuration section */}
      <FormSection title="Raid Messages">
        <View style={{ marginHorizontal: 16 }}>
          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 1</Text>
          <TextInput style={inputStyle} value={storage.words[0]} onChangeText={v => storage.words[0] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 2</Text>
          <TextInput style={inputStyle} value={storage.words[1]} onChangeText={v => storage.words[1] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 3</Text>
          <TextInput style={inputStyle} value={storage.words[2]} onChangeText={v => storage.words[2] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 4</Text>
          <TextInput style={inputStyle} value={storage.words[3]} onChangeText={v => storage.words[3] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 5</Text>
          <TextInput style={inputStyle} value={storage.words[4]} onChangeText={v => storage.words[4] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 6</Text>
          <TextInput style={inputStyle} value={storage.words[5]} onChangeText={v => storage.words[5] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 7</Text>
          <TextInput style={inputStyle} value={storage.words[6]} onChangeText={v => storage.words[6] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 8</Text>
          <TextInput style={inputStyle} value={storage.words[7]} onChangeText={v => storage.words[7] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6}>Message 9</Text>
          <TextInput style={inputStyle} value={storage.words[8]} onChangeText={v => storage.words[8] = v} />

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6}}>Message 10</Text>
          <TextInput style={inputStyle} value={storage.words[9]} onChangeText={v => storage.words[9] = v} />
        </View>
      </FormSection>

      {/* bottom padding */}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}
