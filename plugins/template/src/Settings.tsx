import { ReactNative, React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";
import { Forms as UiForms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findByProps } from "@vendetta/metro";

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

const NavigationRouter = findByProps("transitionToGuildSync", "transitionTo");
const Forms = UiForms || {};
const { FormRow, FormSwitchRow } = Forms as any;

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
if (typeof storage.nitroSpoof !== "boolean") {
  storage.nitroSpoof = false;
}
if (!Array.isArray(storage.favorites)) {
  storage.favorites = [];
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
const favoriteIcon = getAssetIDByName("HeartIcon");

export default function Settings() {
  useProxy(storage);

  const [selectedPage, setSelectedPage] = React.useState<
    "main" | "raidMessages" | "messageLogs" | "favorites"
  >("main");

  const [containerWidth, setContainerWidth] = React.useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pageMap = { main: 0, raidMessages: 1, messageLogs: 2, favorites: 3 };
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

  const navigateToMessage = (msg: any) => {
    if (NavigationRouter) {
      NavigationRouter.transitionToGuildSync(msg.guildId, msg.channelId, msg.id);
    }
  };

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
          Command list: /mcs, /msp, /log, /info, /nuke, /raid, /spam, /purge, /react, /steal, /pinger /userid,
          /lockdown, /gc-prison, /imprison, /server-info, /clone-server, /fetchprofile, /dupe-channel, /delete-channel
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
            <FormSwitchRow
              label="Nitro Spoof"
              subLabel="Unlock gradient themes and app icons"
              value={storage.nitroSpoof}
              onValueChange={(v: boolean) => (storage.nitroSpoof = v)}
            />
            <FormRow
              label="Favorite Messages"
              subLabel={`${storage.favorites.length} saved messages`}
              trailing={<FormRow.Arrow />}
              onPress={() => setSelectedPage("favorites")}
            />
            <FormRow
              label="Edit Raid Messages"
              subLabel="Customize 10 raid message slots"
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

  const renderFavoritesPage = () => (
    <>
      <Header />
      <BetterTableRowGroup title="Favorite Messages" icon={favoriteIcon} padding>
        {storage.favorites.length === 0 ? (
          <Text style={{ color: "#aaa", textAlign: "center", padding: 20 }}>No favorites yet.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {storage.favorites.map((msg: any, index: number) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => navigateToMessage(msg)}
                onLongPress={() => {
                   storage.favorites.splice(index, 1);
                   ToastAndroid.show("Removed from Favorites", 0);
                }}
                style={{ 
                  backgroundColor: "#2b2d31", 
                  borderRadius: 20, 
                  padding: 8, 
                  flexDirection: "row", 
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#3f4147"
                }}
              >
                <Image source={{ uri: msg.authorAvatar }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }} numberOfLines={1}>
                    {msg.authorName}
                  </Text>
                  <Text style={{ color: "#dbdee1", fontSize: 11 }} numberOfLines={1}>
                    {msg.content}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
      <ScrollView style={{ flex: 1 }}>
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
          <View style={{ width: containerWidth || "100%" }}>{selectedPage === "favorites" ? renderFavoritesPage() : null}</View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
