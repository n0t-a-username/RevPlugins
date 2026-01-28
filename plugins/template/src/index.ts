import { logger } from "@vendetta";
import Settings from "./Settings";

import { registerCommand } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { React } from "@vendetta/metro/common";

const MessageActions = findByProps("sendMessage", "editMessage");
const ChannelActions = findByProps("deleteChannel");
const { openAlert } = findByProps("openAlert", "dismissAlert");
const { AlertModal, AlertActions, AlertActionButton } = findByProps(
  "AlertModal",
  "AlertActions",
  "AlertActionButton"
);

const commands = [];

const getRandomNumber = () => Math.floor(Math.random() * 100);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getConfiguredWords() {
  if (!Array.isArray(storage.words)) return [];
  return storage.words.filter(w => typeof w === "string" && w.trim().length);
}

function randomWord() {
  const words = getConfiguredWords();
  if (!words.length) return "### (no spam messages configured)";
  return words[Math.floor(Math.random() * words.length)];
}

// ======== /raid command ========
commands.push(
  registerCommand({
    name: "raid",
    displayName: "raid",
    description: "Start a Raid!",
    options: [
      {
        name: "amount",
        displayName: "amount",
        description: "Number of times to send",
        required: true,
        type: 4
      },
      {
        name: "delay",
        displayName: "delay",
        description: "Delay between messages (ms)",
        required: true,
        type: 4
      }
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,

    execute: async (args, ctx) => {
      const amount = Number(args.find(a => a.name === "amount")?.value ?? 0);
      const delay = Number(args.find(a => a.name === "delay")?.value ?? 0);

      if (amount <= 0) return;

      for (let i = 0; i < amount; i++) {
        const msgTemplate = randomWord();
        const rnd = getRandomNumber();
        const content = `${msgTemplate} \`${rnd}\``;

        await sleep(delay);

        MessageActions.sendMessage(
          ctx.channel.id,
          { content },
          void 0,
          { nonce: Date.now().toString() }
        );
      }
    }
  })
);

// ======== /deletechannels command ========
commands.push(
  registerCommand({
    name: "deletechannels",
    displayName: "Delete Channels",
    description: "Delete multiple channels at once (must have permission)",
    options: [
      {
        name: "channels",
        displayName: "Channel IDs (comma-separated)",
        description: "Enter channel IDs to delete, separated by commas",
        type: 3, // STRING input
        required: true
      }
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,

    execute: async (args, ctx) => {
      const channelsArg = args.find(a => a.name === "channels")?.value;
      if (!channelsArg) return;

      const channelIds = channelsArg.split(",").map(id => id.trim()).filter(Boolean);
      if (!channelIds.length) return;

      openAlert("Confirm deletion",
        (
          <AlertModal
            title="Confirm Batch Deletion"
            content={
              <React.Fragment>
                {channelIds.map(id => (
                  <React.Text key={id} style={{ color: "#fff" }}>
                    • <#${id}>{"\n"}
                  </React.Text>
                ))}
                <React.Text style={{ color: "#aaa", marginTop: 6 }}>
                  Are you sure you want to delete these {channelIds.length} channel(s)? This cannot be undone.
                </React.Text>
              </React.Fragment>
            }
            actions={
              <AlertActions>
                <AlertActionButton
                  text="Cancel"
                  variant="secondary"
                />
                <AlertActionButton
                  text="Delete All"
                  variant="destructive"
                  onPress={async () => {
                    let success = 0, failed = 0;
                    for (const id of channelIds) {
                      try {
                        await ChannelActions.deleteChannel(id);
                        success++;
                      } catch (err) {
                        console.error("Failed to delete channel", id, err);
                        failed++;
                      }
                    }

                    MessageActions.sendMessage(
                      ctx.channel.id,
                      {
                        content: `✅ Batch deletion complete! Success: ${success}, Failed: ${failed}`,
                      },
                      void 0,
                      { nonce: Date.now().toString() }
                    );
                  }}
                />
              </AlertActions>
            }
          />
        )
      );
    }
  })
);

// ======== Export ========
export default {
  onLoad: () => {
    logger.log("Raid + DeleteChannels plugin loaded!");
  },

  onUnload: () => {
    for (const unregister of commands) unregister();
    logger.log("Raid + DeleteChannels plugin unloaded.");
  },

  settings: Settings
};
