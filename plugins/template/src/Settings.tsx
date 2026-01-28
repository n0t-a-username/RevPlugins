import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Button, Text } from "@vendetta/ui/components";

const { View, ScrollView, TextInput, Modal, TouchableOpacity } = RN;

export default function BemmoSettings() {
  useProxy(storage);

  const [configOpen, setConfigOpen] = React.useState(false);

  // Ensure storage.words always has 10 entries
  if (!Array.isArray(storage.words) || storage.words.length !== 10) {
    storage.words = Array(10).fill("");
  }

  const [msg0, setMsg0] = React.useState(storage.words[0]);
  const [msg1, setMsg1] = React.useState(storage.words[1]);
  const [msg2, setMsg2] = React.useState(storage.words[2]);
  const [msg3, setMsg3] = React.useState(storage.words[3]);
  const [msg4, setMsg4] = React.useState(storage.words[4]);
  const [msg5, setMsg5] = React.useState(storage.words[5]);
  const [msg6, setMsg6] = React.useState(storage.words[6]);
  const [msg7, setMsg7] = React.useState(storage.words[7]);
  const [msg8, setMsg8] = React.useState(storage.words[8]);
  const [msg9, setMsg9] = React.useState(storage.words[9]);

  const inputStyle = {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 12,
    fontFamily: "Whitney",
  };

  const cardStyle = {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: 16,
  };

  const buttonStyle = {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  };

  const reloadButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#7289da",
  };

  const configButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#2f3136",
    borderWidth: 1,
    borderColor: "#444",
  };

  // Save all messages to storage
  const saveMessages = () => {
    storage.words = [
      msg0, msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8, msg9
    ];
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" }}>
      {/* Bemmo Card */}
      <View style={cardStyle}>
        <Text style={{ color: "#fff", fontSize: 22, marginBottom: 12, fontFamily: "Whitney" }}>
          Bemmo
        </Text>
        <Text style={{ color: "#ccc", marginBottom: 4, fontFamily: "Whitney" }}>
          - Loaded custom raid strings
        </Text>
        <Text style={{ color: "#ccc", marginBottom: 12, fontFamily: "Whitney" }}>
          - Loaded commands
        </Text>
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: "row", width: "90%", maxWidth: 400 }}>
        <TouchableOpacity style={reloadButtonStyle} onPress={() => console.log("Reload pressed")}>
          <Text style={{ color: "#fff", fontFamily: "Whitney", fontWeight: "600" }}>Reload</Text>
        </TouchableOpacity>

        <TouchableOpacity style={configButtonStyle} onPress={() => setConfigOpen(true)}>
          <Text style={{ color: "#fff", fontFamily: "Whitney", fontWeight: "600" }}>Configuration</Text>
        </TouchableOpacity>
      </View>

      {/* Configuration Popup */}
      <Modal visible={configOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#000000aa", justifyContent: "center", alignItems: "center" }}>
          <View style={{ ...cardStyle, maxHeight: "80%" }}>
            <ScrollView>
              <Text style={{ color: "#fff", fontSize: 20, marginBottom: 12, fontFamily: "Whitney" }}>
                Raid Messages
              </Text>

              {[0,1,2,3,4,5,6,7,8,9].map(i => (
                <View key={i}>
                  <Text style={{ color: "#fff", marginBottom: 4, fontFamily: "Whitney" }}>
                    Message {i + 1}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    value={[
                      msg0,msg1,msg2,msg3,msg4,msg5,msg6,msg7,msg8,msg9
                    ][i]}
                    onChangeText={(v) => {
                      const setters = [setMsg0,setMsg1,setMsg2,setMsg3,setMsg4,setMsg5,setMsg6,setMsg7,setMsg8,setMsg9];
                      setters[i](v);
                      saveMessages();
                    }}
                    placeholder="Enter raid message"
                    placeholderTextColor="#888"
                  />
                </View>
              ))}

              <TouchableOpacity
                style={{
                  marginTop: 12,
                  backgroundColor: "#7289da",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={() => setConfigOpen(false)}
              >
                <Text style={{ color: "#fff", fontFamily: "Whitney", fontWeight: "600" }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}