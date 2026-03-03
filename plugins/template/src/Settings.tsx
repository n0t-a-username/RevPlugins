import { ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";
import { Forms as UiForms } from "@vendetta/ui/components";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";

const {
  ScrollView,
  View,
  Text,
  TextInput,
  Animated,
  Easing,
  Image,
  TouchableOpacity,
  Clipboard,
  ToastAndroid,
} = ReactNative;

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

  const translateX =
    containerWidth > 0
      ? slideAnim.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, -containerWidth, -containerWidth * 2],
        })
      : 0;

  /* =========================
     LOG PERFORMANCE FIX
  ========================= */

  const logsText = React.useMemo(
    () => storage.messageLogs.join("\n"),
    [storage.messageLogs.length]
  );

  const copyLogs = async () => {
    await Clipboard.setString(logsText);
    ToastAndroid.show("Logs copied.", ToastAndroid.SHORT);
  };

  const clearLogs = () => {
    storage.messageLogs = [];
    ToastAndroid.show("Logs cleared.", ToastAndroid.SHORT);
  };

  /* =========================
     MAIN PAGE
  ========================= */

  const renderMainPage = () => (
    <>
      <Header />

      <BetterTableRowGroup title="Information" icon={messageHeaderIcon} padding>
        <Text style={{ color: "#aaa" }}>
          Command list: /mcs, /msp, /nuke, /raid, /purge, /react, /userid,
          /lockdown, /server-info, /fetchprofile, /dupe-channel, /delete-channel
        </Text>
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Mass Ping List" icon={massPingHeaderIcon} padding>
        <Text style={{ color: "#aaa", marginBottom: 8 }}>
          Press the "Mass Selective Ping" button on user profiles.
        </Text>
        <TextInput
          multiline
          value={storage.eventGiveawayPing}
          onChangeText={(v) => (storage.eventGiveawayPing = v)}
          style={{ ...inputStyle, minHeight: 120 }}
        />
      </BetterTableRowGroup>

      <BetterTableRowGroup title="Tools/Misc">
        {FormRow && (
          <>
            <FormRow
              label="Edit Raid Messages"
              subLabel="Customize the 10 raid message slots"
              trailing={<FormRow.Arrow />}
              onPress={() => setSelectedPage("raidMessages")}
            />

            <FormRow
              label="Message Logs"
              subLabel="View captured message logs"
              trailing={<FormRow.Arrow />}
              onPress={() => setSelectedPage("messageLogs")}
            />
          </>
        )}
      </BetterTableRowGroup>
    </>
  );

  /* =========================
     RAID PAGE (BACK RESTORED)
  ========================= */

  const renderRaidMessagesPage = () => (
    <>
      <Header />

      <BetterTableRowGroup title="Raid Messages" icon={raidHeaderIcon} padding>
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

      <View style={{ height: 20 }} />

      {FormRow && (
        <FormRow
          label="Back"
          subLabel="Return to main menu"
          trailing={
            arrowBackIcon && (
              <Image
                source={arrowBackIcon}
                style={{ width: 24, height: 24 }}
              />
            )
          }
          onPress={() => setSelectedPage("main")}
        />
      )}
    </>
  );

  /* =========================
     MESSAGE LOGS PAGE
  ========================= */

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
          value={logsText}
          style={{ ...inputStyle, minHeight: 260 }}
        />

        <View style={{ flexDirection: "row", marginTop: 12, gap: 10 }}>
          <TouchableOpacity
            onPress={copyLogs}
            style={{
              flex: 1,
              backgroundColor: "#2ecc71",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Copy Log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearLogs}
            style={{
              flex: 1,
              backgroundColor: "#e74c3c",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Clear Log
            </Text>
          </TouchableOpacity>
        </View>
      </BetterTableRowGroup>

      <View style={{ height: 20 }} />

      {FormRow && (
        <FormRow
          label="Back"
          subLabel="Return to main menu"
          trailing={
            arrowBackIcon && (
              <Image
                source={arrowBackIcon}
                style={{ width: 24, height: 24 }}
              />
            )
          }
          onPress={() => setSelectedPage("main")}
        />
      )}
    </>
  );

  /* =========================
     ANIMATED CONTAINER (UNCHANGED STRUCTURE)
  ========================= */

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView ref={scrollRef} style={{ flex: 1 }}>
        <Animated.View
          style={{
            flexDirection: "row",
            width: containerWidth * 3,
            transform: [{ translateX }],
          }}
        >
          <View style={{ width: containerWidth }}>
            {renderMainPage()}
          </View>

          <View style={{ width: containerWidth }}>
            {renderRaidMessagesPage()}
          </View>

          <View style={{ width: containerWidth }}>
            {renderMessageLogsPage()}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
