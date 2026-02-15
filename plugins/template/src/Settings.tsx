import { React, ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";

const { ScrollView, View, Text, TextInput, Animated, Easing } = ReactNative;

// Initialize storage
if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = Array(10).fill("");
}
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
      ? slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -containerWidth] })
      : 0;

  const renderPage1 = () => (
    <>
      <Header />

      <BetterTableRowGroup title="Raid Messages" padding>
        <View style={{ gap: 14 }}>
          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 1</Text>
          <TextInput style={inputStyle} value={storage.words[0]} onChangeText={(v) => (storage.words[0] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 2</Text>
          <TextInput style={inputStyle} value={storage.words[1]} onChangeText={(v) => (storage.words[1] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 3</Text>
          <TextInput style={inputStyle} value={storage.words[2]} onChangeText={(v) => (storage.words[2] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 4</Text>
          <TextInput style={inputStyle} value={storage.words[3]} onChangeText={(v) => (storage.words[3] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 5</Text>
          <TextInput style={inputStyle} value={storage.words[4]} onChangeText={(v) => (storage.words[4] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 6</Text>
          <TextInput style={inputStyle} value={storage.words[5]} onChangeText={(v) => (storage.words[5] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 7</Text>
          <TextInput style={inputStyle} value={storage.words[6]} onChangeText={(v) => (storage.words[6] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 8</Text>
          <TextInput style={inputStyle} value={storage.words[7]} onChangeText={(v) => (storage.words[7] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 9</Text>
          <TextInput style={inputStyle} value={storage.words[8]} onChangeText={(v) => (storage.words[8] = v)} />

          <Text style={{ color: "#fff", marginBottom: 6 }}>Message 10</Text>
          <TextInput style={inputStyle} value={storage.words[9]} onChangeText={(v) => (storage.words[9] = v)} />
        </View>
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Navigation">
        <Text style={{ color: semanticColors.INTERACTIVE_NORMAL }} onPress={() => setActivePage(1)}>
          Next: Info & Mass Ping
        </Text>
      </BetterTableRowGroup>
    </>
  );

  const renderPage2 = () => (
    <>
      <Header />

      <BetterTableRowGroup title="⚠️ Warning" padding>
        <Text style={{ color: "#aaa" }}>
          You are fully responsible for how this plugin is used, do not blame anyone but yourself.
        </Text>
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Mass Ping List" padding>
        <Text style={{ color: "#aaa", marginBottom: 8 }}>
          Press the "Mass Ping" button on user profiles to collect mentions.
        </Text>
        <TextInput
          multiline
          value={storage.eventGiveawayPing}
          onChangeText={(v) => (storage.eventGiveawayPing = v)}
          style={{ ...inputStyle, minHeight: 120 }}
        />
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Navigation">
        <Text style={{ color: semanticColors.INTERACTIVE_NORMAL }} onPress={() => setActivePage(0)}>
          Back to Raid Messages
        </Text>
      </BetterTableRowGroup>
    </>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#111" }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView ref={scrollRef} style={{ flex: 1 }} scrollEnabled>
        <Animated.View
          style={{
            flexDirection: "row",
            width: containerWidth > 0 ? containerWidth * 2 : "200%",
            transform: [{ translateX }],
          }}
        >
          <View style={{ width: containerWidth || "100%" }} pointerEvents={activePage === 0 ? "auto" : "none"}>
            {renderPage1()}
          </View>
          <View style={{ width: containerWidth || "100%" }} pointerEvents={activePage === 1 ? "auto" : "none"}>
            {renderPage2()}
          </View>
        </Animated.View>
      </ScrollView>
      <View style={{ height: 80 }} />
    </View>
  );
}
