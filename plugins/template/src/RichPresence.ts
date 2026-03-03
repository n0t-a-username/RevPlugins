import { FluxDispatcher } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

const APPLICATION_ID = "1054951789318909972";

const activity = {
  name: "Streaming",
  application_id: APPLICATION_ID,
  type: 1, // STREAMING
  details: "Bemmo",
  state: "Discord Utility Tool",
  assets: {
    large_image: "https://raw.githubusercontent.com/n0t-a-username/RevPlugins/refs/heads/master/plugins/template/src/components/Bemmo.png", // must be uploaded in dev portal
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

export function startRichPresence() {
  if (storage.hiddenSettings?.enabled) {
    setActivity(activity);
  }
}

export function stopRichPresence() {
  setActivity(null);
}
