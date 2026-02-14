import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findByName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

const { View, Text, TouchableOpacity } = RN;
const UserProfileCard = findByName("UserProfileCard");

interface Props {
  userId: string;
}

export default function GiveawaySection({ userId }: Props) {
  if (!UserProfileCard) return null;

  const handlePress = () => {
    const mention = `<@${userId}>`;

    if (!storage.eventGiveawayPing.includes(mention)) {
      storage.eventGiveawayPing =
        storage.eventGiveawayPing.trim().length > 0
          ? storage.eventGiveawayPing + "\n" + mention
          : mention;

      // Show toast once
      showToast("Successfully added to list!");
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, marginTop: -8 }}> {/* negative margin */}
      <UserProfileCard title="Event Giveaway">
        <TouchableOpacity
          style={{
            backgroundColor: "#FF4444",
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={handlePress}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Add To Giveaway
          </Text>
        </TouchableOpacity>

        {/* Invisible text for bottom padding */}
        <Text style={{ fontSize: 32, color: "transparent" }}> </Text>
      </UserProfileCard>
    </View>
  );
}
