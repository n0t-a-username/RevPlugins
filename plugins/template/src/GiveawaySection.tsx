import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { findByName } from "@vendetta/metro";

const { Image, View, Text, TouchableOpacity } = RN;

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

      showToast({
        content: "Successfully added to list!",
        icon: "ic_checkmark_green_16dp", // green checkmark
      });
    }
  };

  return (
    <View style={{}}>
      <TouchableOpacity
        style={{
          backgroundColor: "#FF4444", // red button
          paddingVertical: 10,
          paddingHorizontal: 16,
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
