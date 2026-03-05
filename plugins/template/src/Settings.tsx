import { ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";
import { Forms as UiForms, General } from "@vendetta/ui/components";
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

const FormSlider = 
  (General as any)?.FormSlider || 
  (Forms as any)?.FormSlider || 
  (General as any)?.Slider || 
  (Forms as any)?.Slider ||
  Object.values(General || {}).find((c: any) => c?.render?.name?.includes("Slider") || c?.name?.includes("Slider")) ||
  Object.values(Forms || {}).find((c: any) => c?.render?.name?.includes("Slider") || c?.name?.includes("Slider"));

/* =========================
   STORAGE INITIALIZATION
========================= */
if (!Array.isArray(storage.words) || storage.words.length !== 10) {
  storage.words = Array(10).fill("");
}
if (typeof storage.eventGiveawayPing !== "string") {
  storage.eventGiveawayPing = "";
}
if (!Array.isArray(storage.messageLogs)) {
  storage.messageLogs = [];
}

// Ensure theme object exists with proper defaults for sliders
storage.theme ??= {
  backgroundUrl: "",
  blur: 0,
  opacity: 1,
  chatOpacity: 0.8
};

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
const visualsHeaderIcon = getAssetIDByName("ic_mfa_sms_24px");
const massPingHeaderIcon = getAssetIDByName("SlashBoxIcon");
const arrowBackIcon = getAssetIDByName("ic_arrow_back_24px");

export default function Settings() {
  useProxy(storage);

  const [selectedPage, setSelectedPage] = React.useState<
    "main" | "raidMessages" | "messageLogs" | "visuals"
  >("main");

  const [containerWidth, setContainerWidth] = React.useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const scrollRef = React.useRef<any>(null);

  React.useEffect(() => {
    const pageMap = { main: 0, raidMessages: 1, messageLogs: 2, visuals: 3 };
    Animated.timing(slideAnim, {
      toValue: pageMap[selectedPage],
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selectedPage]);

  const translateX = containerWidth > 0
      ? slideAnim.interpolate({
          inputRange: [0, 1, 2, 3],
          outputRange: [0, -containerWidth, -containerWidth * 2, -containerWidth * 3],
        })
      : 0;

  const logsText = React.useMemo(() => {
    return storage.messageLogs
      .map((log: any) => (typeof log === "object" ? log.t : log))
      .join("\n");
  }, [storage.messageLogs.length, selectedPage]);

  /* =========================
     PAGE RENDERS
  ========================= */

  const renderMainPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Information" icon={messageHeaderIcon} padding>
        <Text style={{ color: "#aaa" }}>
          Command list: /mcs, /msp, /log, /info, /nuke, /raid, /spam, /purge, /react, /pinger /userid,
          /lockdown, /server-info, /clone-server, /fetchprofile, /dupe-channel, /delete-channel
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
              label="Visuals & Theme"
              subLabel="Background image, blur, and opacity"
              trailing={<FormRow.Arrow />}
              onPress={() => setSelectedPage("visuals")}
            />
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
      <View style={{ height: 40 }} />
    </>
  );

  const renderVisualsPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Visuals" icon={visualsHeaderIcon} padding>
        <Text style={{ color: "#fff", marginBottom: 6 }}>Background URL</Text>
        <TextInput
          style={inputStyle}
          value={storage.theme.backgroundUrl}
          placeholder="https://..."
          onChangeText={(v) => (storage.theme.backgroundUrl = v)}
        />
        <View style={{ marginTop: 20 }}>
          {FormSlider ? (
            <>
              <Text style={{ color: "#fff" }}>Background Opacity: {Math.round(storage.theme.opacity * 100)}%</Text>
              <FormSlider 
                value={storage.theme.opacity} 
                onValueChange={(v: number) => (storage.theme.opacity = v)} 
                minimumValue={0}
                maximumValue={1}
              />
              
              <Text style={{ color: "#fff", marginTop: 15 }}>Blur Strength: {Math.round(storage.theme.blur)}px</Text>
              <FormSlider 
                value={storage.theme.blur} 
                onValueChange={(v: number) => (storage.theme.blur = v)} 
                minimumValue={0}
                maximumValue={20}
                step={1}
              />

              <Text style={{ color: "#fff", marginTop: 15 }}>Chat Transparency: {Math.round(storage.theme.chatOpacity * 100)}%</Text>
              <FormSlider 
                value={storage.theme.chatOpacity} 
                onValueChange={(v: number) => (storage.theme.chatOpacity = v)} 
                minimumValue={0}
                maximumValue={1}
              />
            </>
          ) : (
            <Text style={{ color: "#ff4444" }}>No compatible Slider component found.</Text>
          )}
        </View>
      </BetterTableRowGroup>
      <View style={{ height: 20 }} />
      <FormRow
        label="Back"
        subLabel="Return to main menu"
        trailing={arrowBackIcon && <Image source={arrowBackIcon} style={{ width: 24, height: 24 }} />}
        onPress={() => setSelectedPage("main")}
      />
      <View style={{ height: 25 }} />
    </>
  );

  const renderRaidMessagesPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Raid Messages" icon={raidHeaderIcon} padding>
        {[...Array(10).keys()].map((i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>Message {i + 1}</Text>
            <TextInput style={inputStyle} value={storage.words[i]} onChangeText={(v) => (storage.words[i] = v)} />
          </View>
        ))}
      </BetterTableRowGroup>
      <View style={{ height: 20 }} />
      <FormRow
        label="Back"
        trailing={arrowBackIcon && <Image source={arrowBackIcon} style={{ width: 24, height: 24 }} />}
        onPress={() => setSelectedPage("main")}
      />
      <View style={{ height: 25 }} />
    </>
  );

  const renderMessageLogsPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Message Logs" icon={messageHeaderIcon} padding>
        <TextInput multiline editable={false} value={logsText} style={{ ...inputStyle, minHeight: 260 }} />
        <View style={{ flexDirection: "row", marginTop: 12, gap: 10 }}>
          <TouchableOpacity onPress={() => { Clipboard.setString(logsText); ToastAndroid.show("Copied", 0); }} style={{ flex: 1, backgroundColor: "#2ecc71", padding: 12, borderRadius: 8, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { storage.messageLogs = []; ToastAndroid.show("Cleared", 0); }} style={{ flex: 1, backgroundColor: "#e74c3c", padding: 12, borderRadius: 8, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Clear</Text>
          </TouchableOpacity>
        </View>
      </BetterTableRowGroup>
      <View style={{ height: 20 }} />
      <FormRow
        label="Back"
        trailing={arrowBackIcon && <Image source={arrowBackIcon} style={{ width: 24, height: 24 }} />}
        onPress={() => setSelectedPage("main")}
      />
      <View style={{ height: 25 }} />
    </>
  );

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }}>
        <Animated.View
          style={{
            flexDirection: "row",
            width: containerWidth * 4 || "400%",
            transform: [{ translateX }],
          }}
        >
          <View style={{ width: containerWidth || "100%" }}>{renderMainPage()}</View>
          <View style={{ width: containerWidth || "100%" }}>{selectedPage === "raidMessages" ? renderRaidMessagesPage() : null}</View>
          <View style={{ width: containerWidth || "100%" }}>{selectedPage === "messageLogs" ? renderMessageLogsPage() : null}</View>
          <View style={{ width: containerWidth || "100%" }}>{selectedPage === "visuals" ? renderVisualsPage() : null}</View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
