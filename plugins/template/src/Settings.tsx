import { ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { showToast } from "@vendetta/ui/toasts";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";
import { Forms as UiForms } from "@vendetta/ui/components";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

const { ScrollView, View, Text, TextInput, Animated, Easing, Image } = ReactNative;
const Forms = UiForms || {};
const { FormRow } = Forms as any;

if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = Array(10).fill("");
}

if (typeof storage.eventGiveawayPing !== "string") {
  storage.eventGiveawayPing = "";
}

if (!Array.isArray(storage.messageLogs)) {
  storage.messageLogs = [];
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

const messageHeaderIcon = getAssetIDByName("ic_information_24px");
const raidHeaderIcon = getAssetIDByName("SlashBoxIcon");
const massPingHeaderIcon = getAssetIDByName("SlashBoxIcon");
const arrowBackIcon = getAssetIDByName("ic_arrow_back_24px");

export default function Settings() {
  useProxy(storage);

  const [selectedPage, setSelectedPage] = React.useState<
    "main" | "raidMessages" | "messageLogs"
  >("main");

  const [containerWidth, setContainerWidth] = React.useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const scrollRef = React.useRef<any>(null);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue:
        selectedPage === "main"
          ? 0
          : selectedPage === "raidMessages"
          ? 1
          : 2,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selectedPage]);

  React.useEffect(() => {
    try {
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    } catch {}
  }, [selectedPage]);

  const translateX =
    containerWidth > 0
      ? slideAnim.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, -containerWidth, -containerWidth * 2],
        })
      : 0;

  const renderMessageLogsPage = () => (
    <>
      <Header />

      <BetterTableRowGroup title="Message Logs" icon={messageHeaderIcon} padding>
        <Text style={{ color: "#aaa", marginBottom: 8 }}>
          Captured messages will appear below.
        </Text>

        <TextInput
          multiline
          editable={false}
          value={[...storage.messageLogs].join("\n")}
          style={{ ...inputStyle, minHeight: 260 }}
        />

        <View style={{ flexDirection: "row", marginTop: 12 }}>
          {/* Copy */}
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text
              onPress={() => {
                const content = [...storage.messageLogs].join("\n");

                try {
                  const clipboard = require("@vendetta/metro/common");
                  clipboard.setString?.(content);
                } catch {}

                showToast("Log copied to clipboard.");
              }}
              style={{
                backgroundColor: "#2ecc71",
                color: "#fff",
                textAlign: "center",
                paddingVertical: 12,
                borderRadius: 8,
                fontWeight: "600",
              }}
            >
              Copy Log
            </Text>
          </View>

          {/* Clear */}
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text
              onPress={() => {
                storage.messageLogs = [];
                showToast("Log cleared.");
              }}
              style={{
                backgroundColor: "#e74c3c",
                color: "#fff",
                textAlign: "center",
                paddingVertical: 12,
                borderRadius: 8,
                fontWeight: "600",
              }}
            >
              Clear Log
            </Text>
          </View>
        </View>
      </BetterTableRowGroup>

      <View style={{ height: 20 }} />

      {FormRow && (
        <FormRow
          label="Back"
          trailing={
            arrowBackIcon && (
              <Image
                source={arrowBackIcon}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: semanticColors.TEXT_MUTED,
                }}
              />
            )
          }
          onPress={() => setSelectedPage("main")}
        />
      )}

      <View style={{ height: 60 }} />
    </>
  );

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView ref={scrollRef} style={{ flex: 1 }}>
        <Animated.View
          style={{
            flexDirection: "row",
            width: containerWidth > 0 ? containerWidth * 3 : "300%",
            transform: [{ translateX }],
          }}
        >
          <View style={{ width: containerWidth || "100%" }}>
            <Header />
          </View>

          <View style={{ width: containerWidth || "100%" }}>
            {selectedPage === "raidMessages" && (
              <BetterTableRowGroup
                title="Raid Messages"
                icon={raidHeaderIcon}
                padding
              >
                {[...Array(10).keys()].map((i) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <Text style={{ color: "#fff", marginBottom: 6 }}>
                      Message {i + 1}
                    </Text>
                    <TextInput
                      style={inputStyle}
                      value={storage.words[i]}
                      onChangeText={(v) => (storage.words[i] = v)}
                    />
                  </View>
                ))}
              </BetterTableRowGroup>
            )}

            {selectedPage === "messageLogs" && renderMessageLogsPage()}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}