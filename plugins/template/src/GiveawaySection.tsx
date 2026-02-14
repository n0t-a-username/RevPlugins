import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findByName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const UserProfileCard = findByName("UserProfileCard");

interface Props {
  userId: string;
}

export default function GiveawaySection({ userId }: Props) {
  if (!UserProfileCard) return null;

  return (
    <RN.View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 }}>
      <UserProfileCard title="Event Giveaway">
        <RN.TouchableOpacity
          style={{
            backgroundColor: "#5865F2",
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={() => {
            const mention = `<@${userId}>`;

            if (!storage.eventGiveawayPing.includes(mention)) {
              storage.eventGiveawayPing =
                storage.eventGiveawayPing.trim().length > 0
                  ? storage.eventGiveawayPing + "\n" + mention
                  : mention;
            }
          }}
        >
          <RN.Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
            Add To Giveaway
          </RN.Text>
        </RN.TouchableOpacity>
      </UserProfileCard>
    </RN.View>
  );
}
