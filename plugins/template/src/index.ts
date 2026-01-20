import { React } from "@vendetta/metro";
import { registerCommand, unregisterCommand } from "@vendetta/commands";
import { showConfirmationModal } from "@vendetta/ui/alerts";
import { View, Text, ScrollView, Pressable } from "react-native";

let commandId: string | null = null;

function CustomUIModal() {
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text
        style={{
          fontSize: 23,
          fontWeight: "700",
          marginBottom: 12,
          color: "white"
        }}
      >
        Custom Vendetta UI
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 16, color: "#ccc" }}>
        This UI was opened from a slash command.
      </Text>

      <Pressable
        style={{
          backgroundColor: "#5865F2",
          padding: 12,
          borderRadius: 8,
          alignItems: "center"
        }}
        onPress={() => {
          console.log("Button pressed");
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          Press Me
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export default {
  onLoad() {
    commandId = registerCommand({
      name: "customui",
      description: "Open a custom UI modal",
      options: [],
      execute() {
        showConfirmationModal({
          title: "Custom UI",
          content: <CustomUIModal />,
          confirmText: "Close",
          cancelText: null
        });
      }
    });
  },

  onUnload() {
    if (commandId) unregisterCommand(commandId);
  }
};