import { findByProps } from "@vendetta/metro";
import { registerCommand } from "@vendetta/commands";
import { showToast } from "@vendetta/ui/toasts";

const MessageActions = findByProps("addReaction");
const SelectedChannelStore = findByProps("getChannelId", "getLastSelectedChannelId");
const SelectedGuildStore = findByProps("getGuildId");

let spamInterval = null;

const EMOJIS = ["🔥","💀","😂","😭","👀","😈","🤡","💥","🗿","😎","🫡","🤯","🥶","🥵","👽","💣","⚡","🧠","👹","🚨"];

function normalizeMessageId(input) {
  if (!input) return null;
  const str = String(input).trim();
  const urlMatch = str.match(/\/(\d{17,21})$/);
  if (urlMatch) return urlMatch[1];
  if (/^\d{17,21}$/.test(str)) return str;
  return null;
}

// RELIABLE channel getter
function getActiveChannelId() {
  return (
    SelectedChannelStore?.getChannelId?.() ||
    SelectedChannelStore?.getLastSelectedChannelId?.(
      SelectedGuildStore?.getGuildId?.()
    ) ||
    null
  );
}

export default {
  onLoad() {
    registerCommand({
      name: "reactspam",
      description: "Spam reactions on a message by ID or link",
      options: [
        { name: "message", description: "Message ID or link", type: 3, required: true },
        { name: "seconds", description: "Delay between reactions", type: 4, required: false },
        { name: "stop", description: "Stop reaction spam", type: 5, required: false }
      ],
      execute(args) {
        if (args.stop) {
          if (spamInterval) {
            clearInterval(spamInterval);
            spamInterval = null;
            showToast("Reaction spam stopped");
          }
          return;
        }

        if (spamInterval) {
          showToast("Reaction spam already running");
          return;
        }

        const messageId = normalizeMessageId(args.message);
        if (!messageId) {
          showToast("Invalid message ID or link");
          return;
        }

        const channelId = getActiveChannelId();
        if (!channelId) {
          showToast("No active channel selected");
          return;
        }

        const seconds = args.seconds > 0 ? args.seconds : 2;

        spamInterval = setInterval(() => {
          const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
          MessageActions.addReaction(channelId, messageId, { name: emoji });
        }, seconds * 1000);

        showToast(`Reaction spam started (${seconds}s interval)`);
      }
    });
  },

  onUnload() {
    if (spamInterval) clearInterval(spamInterval);
  }
};