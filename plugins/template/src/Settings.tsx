import { ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";
import { Forms as UiForms } from "@vendetta/ui/components";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

const { ScrollView, View, Text, TextInput, Animated, Easing, Image } = ReactNative;
const Forms = UiForms || {};
const { FormRow, FormSwitch } = Forms as any;

// Storage Defaults
storage.eventGiveawayPing ??= "";
storage.loggingEnabled ??= true;

const inputStyle = {
  backgroundColor: "#1e1e1e",
  color: "#fff",
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 14,
  borderWidth: 1,
  borderColor: "#333",
};

const infoIcon = getAssetIDByName("ic_information_24px");
const logsIcon = getAssetIDByName("ic_message_history_24px");
const pingIcon = getAssetIDByName("ic_mention_24px");
const arrowForward = getAssetIDByName("ic_arrow_forward_24px");
const arrowBack = getAssetIDByName("ic_arrow_back_24px");

export default function Settings() {
  useProxy(storage);

  const [selectedPage, setSelectedPage] = React.useState<"main" | "logs">("main");
  const [containerWidth, setContainerWidth] = React.useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const scrollRef = React.useRef<any>(null);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: selectedPage === "logs" ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [selectedPage]);

  const translateX = containerWidth > 0 
    ? slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -containerWidth] }) 
    : 0;

  const renderMainPage = () => (
    <>
      <Header />

      <BetterTableRowGroup title="Active Features" icon={infoIcon} padding>
        <Text style={{ color: "#aaa", fontSize: 13 }}>
          Loaded: /snipe, /editsnipe, /translate, /tictactoe, /userinfo, /serverinfo, /avatar, /calc, and 40+ more.
        </Text>
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Message Logger" icon={logsIcon}>
        <FormSwitch
          label="Enable Sniper"
          subLabel="Caches deleted and edited messages locally."
          value={storage.loggingEnabled}
          onValueChange={(v: boolean) => (storage.loggingEnabled = v)}
        />
        <FormRow
          label="Manage Sniper Cache"
          subLabel="Clear or view raw message logs"
          trailing={<Image source={arrowForward} style={{ width: 22, height: 22, tintColor: semanticColors.TEXT_MUTED }} />}
          onPress={() => setSelectedPage("logs")}
        />
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Mass Ping List" icon={pingIcon} padding>
        <Text style={{ color: "#aaa", marginBottom: 8, fontSize: 12 }}>
          Mentions collected from user profiles appear here.
        </Text>
        <TextInput
          multiline
          placeholder="No pings collected..."
          placeholderTextColor="#555"
          value={storage.eventGiveawayPing}
          onChangeText={(v) => (storage.eventGiveawayPing = v)}
          style={{ ...inputStyle, minHeight: 100, textAlignVertical: "top" }}
        />
      </BetterTableRowGroup>
    </>
  );

  const renderLogsPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Sniper Management" icon={logsIcon} padding>
        <Text style={{ color: "#fff", marginBottom: 10 }}>Logs History</Text>
        <View style={{ backgroundColor: "#111", padding: 10, borderRadius: 8 }}>
          <Text style={{ color: "#00ff00", fontFamily: "monospace", fontSize: 12 }}>
            {`Deleted: ${Object.keys(storage.deletedMessages || {}).length} channels cached\nEdited: ${Object.keys(storage.editedMessages || {}).length} channels cached`}
          </Text>
        </View>
        
        <View style={{ height: 20 }} />
        
        <Text 
          style={{ color: "#ff4444", textAlign: "center", padding: 10 }}
          onPress={() => {
            storage.deletedMessages = {};
            storage.editedMessages = {};
            // @ts-ignore
            vendetta.ui.showToast("Cache Cleared");
          }}
        >
          Clear All Cached Messages
        </Text>
      </BetterTableRowGroup>

      <FormRow
        label="Go Back"
        leading={<Image source={arrowBack} style={{ width: 22, height: 22, tintColor: semanticColors.TEXT_MUTED }} />}
        onPress={() => setSelectedPage("main")}
      />
    </>
  );

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }}>
        <Animated.View style={{
          flexDirection: "row",
          width: containerWidth * 2,
          transform: [{ translateX }]
        }}>
          <View style={{ width: containerWidth || "100%" }}>{renderMainPage()}</View>
          <View style={{ width: containerWidth || "100%" }}>{renderLogsPage()}</View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
