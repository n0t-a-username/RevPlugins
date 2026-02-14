import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

const { View, Text, TouchableOpacity, Dimensions, Image } = RN;

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

  const screenWidth = Dimensions.get("window").width;
  const buttonWidth = screenWidth * 0.9; // ~90% width

  return (
    <View style={{ flex: 1 }}>
      {/* Your content above here */}
      
      <View
        style={{
          position: "absolute",
          bottom: 0, // sit at the very bottom
          width: "100%",
          alignItems: "center",
          paddingHorizontal: 10,
        }}
      >
        <TouchableOpacity
          style={{
            width: buttonWidth,
            backgroundColor: "#FF4444",
            paddingVertical: 12,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
          onPress={handlePress}
        >
          <Image
            source={{ uri: "ic_checkmark_green_16dp" }}
            style={{ width: 16, height: 16, marginRight: 8 }}
          />
          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
            Add To Giveaway
          </Text>
        </TouchableOpacity>

        {/* Invisible bottom padding */}
        <View style={{ height: 20 }} />
      </View>
    </View>
  );
}
