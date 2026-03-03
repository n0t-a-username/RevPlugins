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
  type: 1, // STREAMING
  url: "https://twitch.tv/bemmo", // 🔥 Purple streaming badge
  details: "Bemmo",
  state: "A discord utility tool.",
  assets: {
    large_image: IMAGE_URL,
  },
};

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

async function resolveAsset(activity: any) {
  if (!activity.assets || !activity.assets.large_image) return activity;

  try {
    const args = [activity.application_id, [activity.assets.large_image]];
    let assetIds = assetManager.getAssetIds(...args);

    if (!assetIds.length) {
      assetIds = await assetManager.fetchAssetIds(...args);
    }

    activity.assets.large_image =
      assetIds[0] ?? activity.assets.large_image;
  } catch (e) {
    console.error("[RichPresence] Asset resolution failed:", e);
  }

  return activity;
}

async function checkState() {
  const shouldRun = Boolean(
    storage.hiddenSettings?.enabled &&
    storage.hiddenSettings?.visible
  );

  if (shouldRun !== lastState) {
    lastState = shouldRun;

    if (shouldRun) {
      const activity = await resolveAsset({ ...baseActivity });
      setActivity(activity);
    } else {
      setActivity(null);
    }
  }
}

export function startRichPresence() {
  const shouldRun = Boolean(
    storage.hiddenSettings?.enabled &&
    storage.hiddenSettings?.visible
  );

  lastState = shouldRun;

  if (shouldRun) {
    resolveAsset({ ...baseActivity }).then((act) =>
      setActivity(act)
    );
  }

  interval = setInterval(checkState, 1000);
}

export function stopRichPresence() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  setActivity(null);
}
