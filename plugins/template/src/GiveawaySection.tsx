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

    const mentions = storage.eventGiveawayPing
      .split("\n")
      .map((m: string) => m.trim())
      .filter((m: string) => m.length > 0);

    if (!mentions.includes(mention)) {
      mentions.push(mention);
      storage.eventGiveawayPing = mentions.join("\n");
      showToast("Successfully added to list!");
    }
  };

  const buttonSize = 56; // circular button size
  const topSpacing = 10; // distance from top of banner
  const rightSpacing = 10; // distance from right edge

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={{
          position: "absolute",
          top: topSpacing,
          right: rightSpacing,
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2, // makes it circular
          backgroundColor: "#FF4444",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 5, // for Android shadow
        }}
        onPress={handlePress}
      >
        <Image
          source={{ uri: "ic_checkmark_green_16dp" }}
          style={{ width: 24, height: 24 }}
        />
      </TouchableOpacity>
    </View>
  );
}
