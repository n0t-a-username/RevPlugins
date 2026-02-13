import { ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms } from "@vendetta/ui/components";

const { ScrollView, View, Text, TextInput } = ReactNative;
const { FormSection } = Forms;

// Hard initialize exactly 10 raid slots
if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = [
    "", "", "", "", "",
    "", "", "", "", ""
  ];
}

// Initialize giveaway storage
if (typeof storage.eventGiveawayPing !== "string") {
  storage.eventGiveawayPing = "";
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

export default function Settings() {
  useProxy(storage);

  return (
    <ScrollView style={{ backgroundColor: "#111" }}>
      
      <FormSection title="⚠️ Warning">
        <Text style={{ color: "#aaa", margin: 16 }}>
          Messages entered here will be used by /raid.
          You are fully responsible for how this plugin is used.
        </Text>
      </FormSection>

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

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 9</Text>  
          <TextInput style={inputStyle} value={storage.words[8]} onChangeText={v => storage.words[8] = v} />  

          <Text style={{ color: "#fff", marginTop: 14, marginBottom: 6 }}>Message 10</Text>  
          <TextInput style={inputStyle} value={storage.words[9]} onChangeText={v => storage.words[9] = v} />  

        </View>  
      </FormSection>

      {/* EVENT GIVEAWAY SECTION */}

      <FormSection title="Event Giveaway Ping">
        <View style={{ marginHorizontal: 16 }}>
          <Text style={{ color: "#aaa", marginBottom: 8 }}>
            Press the giveaway button on user profiles to collect mentions.
          </Text>

          <TextInput
            multiline
            value={storage.eventGiveawayPing}
            onChangeText={v => storage.eventGiveawayPing = v}
            style={{ ...inputStyle, minHeight: 120 }}
          />
        </View>
      </FormSection>

      {/* bottom scroll padding */}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}
