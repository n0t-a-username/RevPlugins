import { FluxDispatcher } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const APPLICATION_ID = "1054951789318909972";
const assetManager = findByProps("getAssetIds");
// Use the HTTP module from your index.ts for the Clips API request
const HTTP = findByProps("get", "del", "post", "put", "patch");
const SettingsActions = findByProps("updateAsync", "setInvisibleStatus");

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

/* =========================
   SOCIAL SETTINGS LOGIC
========================= */
async function applyAvoidantSettings() {
  // 1. Update Status via Dispatch (Local UI update)
  FluxDispatcher.dispatch({
    type: "USER_SETTINGS_EDIT_STATUS",
    status: "invisible",
  });

  // 2. Update via Action Creators (Server Sync)
  if (SettingsActions) {
    SettingsActions.updateAsync("status", (s: any) => { s.value = "invisible" }, 0);
    SettingsActions.updateAsync("social", (s: any) => {
      s.default_guilds_restricted = { value: true };
      s.friend_source_flags = { value: { all: false, mutual_friends: false, mutual_guilds: false } };
    }, 0);
  }

  // 3. DISABLE CLIPS VIA API REQUEST
  // Sending a direct PATCH to the settings-proto endpoint
  try {
    await HTTP.patch({
      url: "/users/@me/settings-proto/1",
      body: {
        settings: btoa(JSON.stringify({
          content_and_social: {
            allow_activity_clips: { value: false }
          }
        }))
      }
    });
  } catch (e) {
    console.error("[Bemmo] Clips API request failed:", e);
  }

  // 4. Force Save
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
    if (!assetIds.length) {
      assetIds = await assetManager.fetchAssetIds(...args);
    }
    activity.assets.large_image = assetIds[0] ?? activity.assets.large_image;
  } catch (e) {
    console.error("[RichPresence] Asset resolution failed:", e);
  }
  return activity;
}

async function checkState() {
  // RPC Logic - Using strict boolean check
  const shouldRunRP = !!(storage.hiddenSettings?.enabled && storage.hiddenSettings?.visible);
  
  if (shouldRunRP !== lastState) {
    lastState = shouldRunRP;
    if (shouldRunRP) {
      const activity = await resolveAsset({ ...baseActivity });
      setActivity(activity);
    } else {
      setActivity(null); // This kills the RPC when toggled off
    }
  }

  // Avoidant Mode Logic
  const shouldBeAvoidant = !!storage.avoidantMode;
  if (shouldBeAvoidant !== lastAvoidantState) {
    lastAvoidantState = shouldBeAvoidant;
    if (shouldBeAvoidant) {
      applyAvoidantSettings();
    }
  }
}

export function startRichPresence() {
  if (interval) clearInterval(interval);
  
  // Force a fresh state check
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
  setActivity(null);
  lastState = false;
  lastAvoidantState = false;
}
