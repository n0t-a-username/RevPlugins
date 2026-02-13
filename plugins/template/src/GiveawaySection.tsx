import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

const { Image, View, Text, TouchableOpacity, Dimensions } = RN;

interface Props {
  userId: string;
}

export default function GiveawaySection({ userId }: Props) {
  const handlePress = () => {
    const mention = `<@${userId}>`;

    // Normalize storage into an array of mentions
    const mentions = storage.eventGiveawayPing
      .split("\n")
      .map((m: string) => m.trim())
      .filter((m: string) => m.length > 0);

    if (!mentions.includes(mention)) {
      // Add mention
      mentions.push(mention);
      storage.eventGiveawayPing = mentions.join("\n");

      // Show toast only once
      showToast("Successfully added to list!");
    }
  };

  const screenWidth = Dimensions.get("window").width;
  const buttonWidth = screenWidth * 0.95; // 95% of screen width

  return (
    <View style={{ marginTop: 10, marginBottom: 20, alignItems: "center" }}>
      <TouchableOpacity
        style={{
          width: buttonWidth,
          backgroundColor: "#FF4444",
          paddingVertical: 10,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={handlePress}
      >
        <Image
          source={{ uri: "ic_checkmark_green_16dp" }}
          style={{ width: 16, height: 16, marginRight: 8 }}
        />
        <Text style={{ color: "white", fontWeight: "600" }}>
          Add To Giveaway
        </Text>
      </TouchableOpacity>
    </View>
  );
}
