import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";

const { ScrollView, View, Text, TextInput, Animated, Easing, Pressable } = RN;

// Hard initialize exactly 10 raid slots
if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = Array(10).fill("");
}

// Initialize giveaway storage
if (typeof storage.eventGiveawayPing !== "string") {
  storage.eventGiveawayPing = "";
}

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

  const [activePage, setActivePage] = React.useState<"raid" | "giveaway">("raid");
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const containerWidthRef = React.useRef(0);

  // Slide animation when page changes
  React.useEffect(() => {
    const toValue = activePage === "raid" ? 0 : 1;
    Animated.timing(slideAnim, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activePage, slideAnim]);

  const translateX = containerWidthRef.current
    ? slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -containerWidthRef.current],
      })
    : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#111" }}
      onLayout={(e) => (containerWidthRef.current = e.nativeEvent.layout.width)}
    >
      {/* Header */}
      <Header />

      {/* Page Selector */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 12, gap: 12 }}>
        <Pressable
          onPress={() => setActivePage("raid")}
          style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12, backgroundColor: activePage === "raid" ? "#444" : "#222" }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Raid Messages</Text>
        </Pressable>
        <Pressable
          onPress={() => setActivePage("giveaway")}
          style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12, backgroundColor: activePage === "giveaway" ? "#444" : "#222" }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Mass Ping</Text>
        </Pressable>
      </View>

      {/* Sliding container */}
      <Animated.View
        style={{
          flexDirection: "row",
          width: containerWidthRef.current ? containerWidthRef.current * 2 : "200%",
          transform: [{ translateX }],
        }}
      >
        {/* Page 1: Raid Messages */}
        <View style={{ width: containerWidthRef.current || "100%" }}>
          <BetterTableRowGroup title="âš ï¸ Warning" padding>
            <Text style={{ color: "#aaa" }}>
              You are fully responsible for how this plugin is used, do not blame anyone but yourself.
            </Text>
          </BetterTableRowGroup>

          <BetterTableRowGroup title="Raid Messages" padding>
            {storage.words.map((word, i) => (
              <View key={i} style={{ marginBottom: i < 9 ? 14 : 0 }}>
                <Text style={{ color: "#fff", marginBottom: 6 }}>Message {i + 1}</Text>
                <TextInput
                  style={inputStyle}
                  value={word}
                  onChangeText={(v) => (storage.words[i] = v)}
                />
              </View>
            ))}
          </BetterTableRowGroup>
        </View>

        {/* Page 2: Mass Ping */}
        <View style={{ width: containerWidthRef.current || "100%" }}>
          <BetterTableRowGroup title="Mass Ping List" padding>
            <Text style={{ color: "#aaa", marginBottom: 8 }}>
              Press the "Mass Ping" button on user profiles to collect mentions.
            </Text>
            <TextInput
              multiline
              style={{ ...inputStyle, minHeight: 120 }}
              value={storage.eventGiveawayPing}
              onChangeText={(v) => (storage.eventGiveawayPing = v)}
            />
          </BetterTableRowGroup>
        </View>
      </Animated.View>

      {/* Bottom padding */}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}      style={{ flex: 1, backgroundColor: "#111" }}
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
