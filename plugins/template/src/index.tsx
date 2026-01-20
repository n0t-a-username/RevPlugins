import { React } from "@vendetta/metro";
import { ScrollView, Text, Pressable } from "react-native";

export default function CustomUIModal() {
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12, color: "white" }}>
        Custom Vendetta UI
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 16, color: "#ccc" }}>
        This UI was opened from a slash command.
      </Text>

      <Pressable
        style={{ backgroundColor: "#5865F2", padding: 12, borderRadius: 8, alignItems: "center" }}
        onPress={() => console.log("Button pressed")}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Press Me</Text>
      </Pressable>
    </ScrollView>
  );
}