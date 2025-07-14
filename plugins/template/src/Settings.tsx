import { React, ReactNative } from "@vendetta/metro/common";
import { General } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";

const { ScrollView, View, Text, TouchableOpacity } = ReactNative;
const { FormRow, FormDivider } = General;

export default function SettingsPage() {
  const featureStatus = {
    "Custom iconpack": true,
    "Custom icon colors": true,
    "Custom icon overlays": false,
    "Custom message mention line color": false,
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      {/* Status Card */}
      <View style={{
        backgroundColor: "#1e1f22",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#ffffff",
          marginBottom: 8,
        }}>
          ✅ Themes+ is <Text style={{ fontWeight: "900" }}>active</Text>
        </Text>

        {/* Feature list */}
        {Object.entries(featureStatus).map(([name, status], index) => (
          <Text
            key={index}
            style={{
              color: status ? "#00ff88" : "#ff7777",
              marginBottom: 4,
            }}
          >
            {status ? "✅" : "❌"} {name}
          </Text>
        ))}
      </View>

      {/* Buttons Row */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
      }}>
        <TouchableOpacity
          onPress={() => showToast("Reloaded!", getAssetIDByName("Check"))}
          style={{
            backgroundColor: "#5865F2",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 50,
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>🔄 Reload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => showToast("Opening Configuration...", getAssetIDByName("Gear"))}
          style={{
            backgroundColor: "#2b2d31",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 50,
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ccc", fontWeight: "bold" }}>⚙️ Configuration</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
