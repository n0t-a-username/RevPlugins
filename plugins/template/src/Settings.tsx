import { ReactNative, React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import Header from "./components/Header";
import BetterTableRowGroup from "./components/BetterTableRowGroup";
import { Forms as UiForms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findByProps } from "@vendetta/metro";

const { ScrollView, View, Text, TextInput, Animated, Easing, Image, TouchableOpacity, Clipboard, ToastAndroid } = ReactNative;
const NavigationRouter = findByProps("transitionToGuildSync");
const Forms = UiForms || {};
const { FormRow, FormSwitchRow } = Forms as any;

// Global Init
if (!storage.words) storage.words = Array(10).fill("");
if (!storage.messageLogs) storage.messageLogs = [];
if (!storage.favorites) storage.favorites = [];

const inputStyle = { backgroundColor: "#222", color: "#fff", borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: "#333" };

export default function Settings() {
  useProxy(storage);
  const [page, setPage] = React.useState<"main" | "raid" | "logs" | "favs">("main");
  const [width, setWidth] = React.useState(0);
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const idx = { main: 0, raid: 1, logs: 2, favs: 3 }[page];
    Animated.timing(anim, { toValue: idx, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [page]);

  const transX = width > 0 ? anim.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, -width, -width * 2, -width * 3] }) : 0;

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView style={{ flex: 1 }}>
        <Animated.View style={{ flexDirection: "row", width: width * 4 || "400%", transform: [{ translateX: transX }] }}>
          
          {/* MAIN PAGE */}
          <View style={{ width: width || "100%" }}>
            <Header />
            <BetterTableRowGroup title="Tools">
              <FormRow label="Favorite Messages" subLabel={`${storage.favorites.length} saved`} onPress={() => setPage("favs")} />
              <FormRow label="Raid Messages" onPress={() => setPage("raid")} />
              <FormRow label="Logs" onPress={() => setPage("logs")} />
            </BetterTableRowGroup>
          </View>

          {/* RAID PAGE */}
          <View style={{ width: width || "100%" }}>
            <Header />
            <BetterTableRowGroup title="Raid List" padding>
              {storage.words.map((w, i) => (
                <TextInput key={i} style={[inputStyle, { marginBottom: 10 }]} value={w} onChangeText={(v) => (storage.words[i] = v)} />
              ))}
            </BetterTableRowGroup>
            <FormRow label="Back" onPress={() => setPage("main")} />
          </View>

          {/* LOGS PAGE */}
          <View style={{ width: width || "100%" }}>
            <Header />
            <BetterTableRowGroup title="Logs" padding>
               <TextInput multiline editable={false} value={storage.messageLogs.map(l => l.t || l).join("\n")} style={[inputStyle, { minHeight: 200 }]} />
            </BetterTableRowGroup>
            <FormRow label="Back" onPress={() => setPage("main")} />
          </View>

          {/* FAVORITES PAGE */}
          <View style={{ width: width || "100%" }}>
            <Header />
            <BetterTableRowGroup title="Favorites" padding>
              {storage.favorites.map((f, i) => (
                <TouchableOpacity key={i} 
                  onPress={() => NavigationRouter?.transitionToGuildSync(f.guildId, f.channelId, f.id)}
                  onLongPress={() => { storage.favorites.splice(i, 1); ToastAndroid.show("Deleted", 0); }}
                  style={{ backgroundColor: "#2b2d31", borderRadius: 15, padding: 10, marginBottom: 10, flexDirection: "row", alignItems: "center" }}
                >
                  <Image source={{ uri: f.authorAvatar }} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>{f.authorName}</Text>
                    <Text style={{ color: "#aaa" }} numberOfLines={1}>{f.content}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </BetterTableRowGroup>
            <FormRow label="Back" onPress={() => setPage("main")} />
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}
