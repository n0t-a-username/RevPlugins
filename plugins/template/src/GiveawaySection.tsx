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

    if (!storage.eventGiveawayPing.includes(mention)) {
      storage.eventGiveawayPing =
        storage.eventGiveawayPing.trim().length > 0
          ? storage.eventGiveawayPing + "\n" + mention
          : mention;

      // Fixed: showToast expects a string message, not an object
      showToast(`Successfully added to list!`);
    }
  };

  const screenWidth = Dimensions.get("window").width;
  const buttonWidth = screenWidth * 0.95;

  return (
    <View style={{ marginTop: -20, alignItems: "center" }}> {/* negative margin */}
      <TouchableOpacity
        style={{
          width: buttonWidth,
          backgroundColor: "#FF4444",
          paddingVertical: 30,
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
