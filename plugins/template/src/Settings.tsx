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
const { FormRow, FormDivider } = Forms as any;
const { FormSlider } = General as any; // Vendetta slider component

// Icons
const messageHeaderIcon = getAssetIDByName("ic_information_24px");
const raidHeaderIcon = getAssetIDByName("SlashBoxIcon");
const visualsHeaderIcon = getAssetIDByName("ic_mfa_sms_24px");
const arrowBackIcon = getAssetIDByName("ic_arrow_back_24px");

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

  // Added "visuals" to the page type
  const [selectedPage, setSelectedPage] = React.useState<
    "main" | "raidMessages" | "messageLogs" | "visuals"
  >("main");

  const [containerWidth, setContainerWidth] = React.useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

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

  // Render Visuals Page
  const renderVisualsPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Custom Background" icon={visualsHeaderIcon} padding>
        <Text style={{ color: "#fff", marginBottom: 8 }}>Image URL</Text>
        <TextInput
          style={inputStyle}
          value={storage.theme.backgroundUrl}
          placeholder="https://example.com/image.png"
          placeholderTextColor="#666"
          onChangeText={(v) => (storage.theme.backgroundUrl = v)}
        />
        
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: "#fff" }}>Background Opacity: {Math.round(storage.theme.opacity * 100)}%</Text>
          <FormSlider
            value={storage.theme.opacity}
            onValueChange={(v: number) => (storage.theme.opacity = v)}
          />

          <Text style={{ color: "#fff", marginTop: 15 }}>Blur Strength: {Math.round(storage.theme.blur)}px</Text>
          <FormSlider
            value={storage.theme.blur}
            onValueChange={(v: number) => (storage.theme.blur = v)}
            range={{ min: 0, max: 20 }}
          />

          <Text style={{ color: "#fff", marginTop: 15 }}>Chat Transparency: {Math.round(storage.theme.chatOpacity * 100)}%</Text>
          <FormSlider
            value={storage.theme.chatOpacity}
            onValueChange={(v: number) => (storage.theme.chatOpacity = v)}
          />
        </View>
      </BetterTableRowGroup>

      <View style={{ height: 20 }} />
      <FormRow
        label="Back"
        trailing={<Image source={arrowBackIcon} style={{ width: 24, height: 24 }} />}
        onPress={() => setSelectedPage("main")}
      />
    </>
  );

  // Add the new button to renderMainPage
  const renderMainPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Tools/Misc">
        <FormRow
          label="Edit Raid Messages"
          subLabel="Customize the 10 raid message slots"
          trailing={<FormRow.Arrow />}
          onPress={() => setSelectedPage("raidMessages")}
        />
        <FormRow
          label="Visuals & Theme"
          subLabel="Background image, blur, and opacity"
          trailing={<FormRow.Arrow />}
          onPress={() => setSelectedPage("visuals")}
        />
        <FormRow
          label="Message Logs"
          subLabel="View captured message logs"
          trailing={<FormRow.Arrow />}
          onPress={() => setSelectedPage("messageLogs")}
        />
      </BetterTableRowGroup>
      <View style={{ height: 40 }} />
    </>
  );

  // Update return to include 4 sections
  return (
    <View style={{ flex: 1 }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <ScrollView style={{ flex: 1 }}>
        <Animated.View
          style={{
            flexDirection: "row",
            width: containerWidth * 4 || "400%",
            transform: [{ translateX }],
          }}
        >
          <View style={{ width: containerWidth || "100%" }}>{renderMainPage()}</View>
          <View style={{ width: containerWidth || "100%" }}>{selectedPage === "raidMessages" && renderRaidMessagesPage()}</View>
          <View style={{ width: containerWidth || "100%" }}>{selectedPage === "messageLogs" && renderMessageLogsPage()}</View>
          <View style={{ width: containerWidth || "100%" }}>{selectedPage === "visuals" && renderVisualsPage()}</View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
