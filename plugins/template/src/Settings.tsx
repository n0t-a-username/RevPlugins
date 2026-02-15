import { React, ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

const { ScrollView, View, Text, TextInput, Animated, Easing } = ReactNative;

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

  const [activePage, setActivePage] = React.useState<0 | 1>(0);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  // Slide animation when page changes
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activePage,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activePage]);

  const translateX =
    containerWidth > 0
      ? slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -containerWidth],
        })
      : 0;

  // PAGE CONTENTS
  const pageRaidMessages = (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
        Raid Messages
      </Text>

      {storage.words.map((word, i) => (
        <View key={i} style={{ marginBottom: 14 }}>
          <Text style={{ color: "#fff", marginBottom: 6 }}>Message {i + 1}</Text>
          <TextInput
            style={inputStyle}
            value={word}
            onChangeText={(v) => (storage.words[i] = v)}
          />
        </View>
      ))}
    </ScrollView>
  );

  const pageInfo = (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: "#aaa", marginBottom: 16 }}>
        ⚠️ You are fully responsible for how this plugin is used.
      </Text>

      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
        Mass Ping List
      </Text>
      <Text style={{ color: "#aaa", marginBottom: 8 }}>
        Press the "Mass Ping" button on user profiles to collect mentions.
      </Text>
      <TextInput
        multiline
        value={storage.eventGiveawayPing}
        onChangeText={(v) => (storage.eventGiveawayPing = v)}
        style={{ ...inputStyle, minHeight: 120 }}
      />
    </ScrollView>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#111" }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* PAGE NAV BUTTONS */}
      <View style={{ flexDirection: "row" }}>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            padding: 12,
            color: activePage === 0 ? "#fff" : "#888",
            fontWeight: activePage === 0 ? "700" : "400",
          }}
          onPress={() => setActivePage(0)}
        >
          Raid Messages
        </Text>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            padding: 12,
            color: activePage === 1 ? "#fff" : "#888",
            fontWeight: activePage === 1 ? "700" : "400",
          }}
          onPress={() => setActivePage(1)}
        >
          Info
        </Text>
      </View>

      {/* PAGES */}
      <Animated.View
        style={{
          flexDirection: "row",
          width: containerWidth * 2,
          transform: [{ translateX }],
        }}
      >
        <View style={{ width: containerWidth }}>{pageRaidMessages}</View>
        <View style={{ width: containerWidth }}>{pageInfo}</View>
      </Animated.View>
    </View>
  );
}
