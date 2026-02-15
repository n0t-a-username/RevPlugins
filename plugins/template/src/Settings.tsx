import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";

const { ScrollView, View, Text, TextInput, Animated, Easing } = RN;

// Initialize storage
if (!Array.isArray(storage.words) || storage.words.length !== 10) storage.words = Array(10).fill("");
if (typeof storage.eventGiveawayPing !== "string") storage.eventGiveawayPing = "";

const inputStyle = {
  backgroundColor: "#222",
  color: "#fff",
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 14,
  borderWidth: 2,
  borderColor: "#333",
};

export default function Settings() {
  useProxy(storage);

  const [selectedPage, setSelectedPage] = React.useState<"raid" | "giveaway">("raid");
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const containerWidthRef = React.useRef(0);

  // Animate page sliding
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: selectedPage === "raid" ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selectedPage]);

  const translateX = containerWidthRef.current
    ? slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -containerWidthRef.current],
      })
    : 0;

  const renderRaidPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Raid Messages" padding>
        <View>
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={i} style={{ marginBottom: 14 }}>
              <Text style={{ color: "#fff", marginBottom: 6 }}>Message {i + 1}</Text>
              <TextInput
                style={inputStyle}
                value={storage.words[i]}
                onChangeText={(v) => (storage.words[i] = v)}
              />
            </View>
          ))}
        </View>
      </BetterTableRowGroup>
      <BetterTableRowGroup title="Navigation">
        <Text
          style={{ color: "#00f", padding: 8 }}
          onPress={() => setSelectedPage("giveaway")}
        >
          Go to Mass Ping
        </Text>
      </BetterTableRowGroup>
    </>
  );

  const renderGiveawayPage = () => (
    <>
      <BetterTableRowGroup title="Mass Ping List" padding>
        <View>
          <Text style={{ color: "#aaa", marginBottom: 8 }}>
            Press the "Mass Ping" button on user profiles to collect mentions.
          </Text>
          <TextInput
            multiline
            style={{ ...inputStyle, minHeight: 120 }}
            value={storage.eventGiveawayPing}
            onChangeText={(v) => (storage.eventGiveawayPing = v)}
          />
        </View>
      </BetterTableRowGroup>
      <BetterTableRowGroup title="Navigation">
        <Text
          style={{ color: "#00f", padding: 8 }}
          onPress={() => setSelectedPage("raid")}
        >
          Back to Raid Messages
        </Text>
      </BetterTableRowGroup>
    </>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#111" }}
      onLayout={(e) => (containerWidthRef.current = e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          flexDirection: "row",
          width: containerWidthRef.current * 2,
          transform: [{ translateX }],
        }}
      >
        <View style={{ width: containerWidthRef.current }}>{renderRaidPage()}</View>
        <View style={{ width: containerWidthRef.current }}>{renderGiveawayPage()}</View>
      </Animated.View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}
