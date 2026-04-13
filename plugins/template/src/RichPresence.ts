import { FluxDispatcher } from "@vendetta/metro/common";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { after } from "@vendetta/patcher";

const APPLICATION_ID = "1054951789318909972";
const assetManager = findByProps("getAssetIds");
const HTTP = findByProps("get", "del", "post", "put", "patch");
const SettingsActions = findByProps("updateAsync", "setInvisibleStatus");
const TokenStore = findByProps("getToken");
const UserStore = findByStoreName("UserStore");

const IMAGE_URL =
  "https://raw.githubusercontent.com/n0t-a-username/RevPlugins/refs/heads/master/plugins/template/src/components/Bemmo.png";

const baseActivity = {
  name: "Streaming",
  application_id: APPLICATION_ID,
  type: 1, 
  url: "https://twitch.tv/bemmo",
  details: "Bemmo",
  state: "A discord utility tool.",
  assets: {
    large_image: IMAGE_URL,
  },
};

// To store the patch unregister function
let unpatchUser: (() => void) | null = null;

/* =========================
   SOCIAL SETTINGS LOGIC
========================= */
async function applyAvoidantSettings() {
  const token = TokenStore?.getToken();
  if (!token) return;

  // 1. Dispatch local UI update
  FluxDispatcher.dispatch({
    type: "USER_SETTINGS_EDIT_STATUS",
    status: "invisible",
  });

  // 2. Official Action Creators
  if (SettingsActions) {
    SettingsActions.updateAsync("status", (s: any) => { s.value = "invisible" }, 0);
  }

  // 3. API PATCH for Clips & Social (The "Manual" Way)
  try {
    await HTTP.patch({
      url: "/users/@me/settings-proto/1",
      headers: {
        "authorization": token,
        "content-type": "application/json"
      },
      body: {
        settings: btoa(JSON.stringify({
          content_and_social: { allow_activity_clips: { value: false } },
          social: {
            default_guilds_restricted: { value: true },
            friend_source_flags: {
              value: { all: false, mutual_friends: false, mutual_guilds: false }
            }
          }
        }))
      }
    });
  } catch (e) {
    console.error("[Bemmo] API Sync failed:", e);
  }

  FluxDispatcher.dispatch({ type: "USER_SETTINGS_SAVE" });
}

function setActivity(data: any | null) {
  FluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    activity: data,
    pid: 1608,
    socketId: "Bemmo@RichPresence",
  });
}

let interval: NodeJS.Timeout | null = null;
let lastState: boolean | null = null;
let lastAvoidantState: boolean | null = null;

async function resolveAsset(activity: any) {
  if (!activity.assets || !activity.assets.large_image) return activity;
  try {
    const args = [activity.application_id, [activity.assets.large_image]];
    let assetIds = assetManager.getAssetIds(...args);
    if (!assetIds.length) assetIds = await assetManager.fetchAssetIds(...args);
    activity.assets.large_image = assetIds[0] ?? activity.assets.large_image;
  } catch (e) { console.error(e); }
  return activity;
}

async function checkState() {
  const shouldRunRP = !!(storage.hiddenSettings?.enabled && storage.hiddenSettings?.visible);

  if (shouldRunRP !== lastState) {
    lastState = shouldRunRP;
    if (shouldRunRP) {
      const activity = await resolveAsset({ ...baseActivity });
      setActivity(activity);
    } else {
      setActivity(null); 
    }
  }

  const shouldBeAvoidant = !!storage.avoidantMode;
  if (shouldBeAvoidant !== lastAvoidantState) {
    lastAvoidantState = shouldBeAvoidant;
    if (shouldBeAvoidant) {
      applyAvoidantSettings();
      // Apply the local status spoof if not already patched
      if (!unpatchUser) {
        unpatchUser = after("getCurrentUser", UserStore, (_, user) => {
          if (user && storage.avoidantMode) {
            user.status = "invisible";
            user.mobile = false;
            user.desktop = false;
          }
          return user;
        });
      }
    } else if (unpatchUser) {
      // If avoidant mode is turned off, remove the patch
      unpatchUser();
      unpatchUser = null;
    }
  }
}

export function startRichPresence() {
  if (interval) clearInterval(interval);

  lastState = null;
  lastAvoidantState = null;

  checkState();
  interval = setInterval(checkState, 2000);
}

export function stopRichPresence() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  if (unpatchUser) {
    unpatchUser();
    unpatchUser = null;
  }
  setActivity(null);
  lastState = null;
  lastAvoidantState = null;
}
