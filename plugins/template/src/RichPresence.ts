import { FluxDispatcher } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";

const APPLICATION_ID = "1054951789318909972";
const assetManager = findByProps("getAssetIds");

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
function applyAvoidantSettings() {
  // 1. Update Status (Using the specific EDIT_STATUS action seen in your logs)
  FluxDispatcher.dispatch({
    type: "USER_SETTINGS_EDIT_STATUS",
    status: "invisible",
  });

  // 2. Social & Friend Requests
  // Using the exact nesting from your screenshot logs
  FluxDispatcher.dispatch({
    type: "USER_SETTINGS_PROTO_UPDATE",
    settings: {
      status: {
        value: "invisible",
      },
      social: {
        default_guilds_restricted: { value: true },
        friend_source_flags: {
          value: {
            all: false,
            mutual_friends: false,
            mutual_guilds: false,
          },
        },
      },
    },
  });

  // 3. Content (Clips)
  FluxDispatcher.dispatch({
    type: "USER_SETTINGS_PROTO_UPDATE",
    settings: {
      content_and_social: {
        allow_activity_clips: { value: false },
      },
    },
  });

  // 4. Commit the changes
  FluxDispatcher.dispatch({
    type: "USER_SETTINGS_SAVE",
  });
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
let lastState = false;
let lastAvoidantState = false;

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
  // Rich Presence Logic
  const shouldRunRP = Boolean(storage.hiddenSettings?.enabled && storage.hiddenSettings?.visible);
  if (shouldRunRP !== lastState) {
    lastState = shouldRunRP;
    if (shouldRunRP) {
      const activity = await resolveAsset({ ...baseActivity });
      setActivity(activity);
    } else {
      setActivity(null);
    }
  }

  // Avoidant Mode Logic
  const shouldBeAvoidant = Boolean(storage.avoidantMode);
  if (shouldBeAvoidant !== lastAvoidantState) {
    lastAvoidantState = shouldBeAvoidant;
    if (shouldBeAvoidant) {
      applyAvoidantSettings();
    }
  }
}

export function startRichPresence() {
  lastState = Boolean(storage.hiddenSettings?.enabled && storage.hiddenSettings?.visible);
  lastAvoidantState = Boolean(storage.avoidantMode);

  checkState();

  if (!interval) {
    interval = setInterval(checkState, 2000);
  }
}

export function stopRichPresence() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  setActivity(null);
}
