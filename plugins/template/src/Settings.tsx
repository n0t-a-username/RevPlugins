import { React, ReactNative } from "@vendetta/metro/common";
import { General } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import settings from "../settings"; // your plugin settings

const { View, ScrollView, Text } = ReactNative;
const { FormRow, FormSwitch, FormDivider } = General;

export default function SettingsPage() {
  useProxy(settings);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>⚙️ Cool Plugin Settings</Text>

      <FormRow
        label="Enable Awesome Feature"
        subLabel="Makes your client 200% more awesome"
        trailing={
          <FormSwitch
            value={settings.awesomeFeature}
            onValueChange={(v: boolean) => (settings.awesomeFeature = v)}
          />
        }
      />

      <FormDivider />

      <FormRow
        label="Enable Dark Mode"
        trailing={
          <FormSwitch
            value={settings.darkMode}
            onValueChange={(v: boolean) => (settings.darkMode = v)}
          />
        }
      />
    </ScrollView>
  );
}
