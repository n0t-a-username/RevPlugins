import { findByProps } from "@vendetta/metro";
import { registerCommand } from "@vendetta/commands";
import { showToast } from "@vendetta/ui/toasts";

const MessageActions = findByProps("addReaction");
const ChannelStore = findByProps("getChannelId");

let spamInterval = null;

const EMOJIS = [
  "🔥","💀","😂","😭","👀",
  "😈","🤡","💥","🗿","😎",
  "🫡","🤯","🥶","🥵","👽",
  "💣","⚡","🧠","👹","🚨"
];

// FIXED — robust snowflake normalization
function normalizeMessageId(input) {
  if (!input) return null;

  const str = String(input).trim();

  // Accept Discord message links
  const urlMatch = str.match(/\/(\d{17,21})$/);
  if (urlMatch) return urlMatch[1];

  // Accept raw snowflake IDs
  if (/^\d{17,21}$/.test(str)) return str;

  return null;
}

export default {
  onLoad() {
    registerCommand({
      name: "reactspam",
      description: "Spam reactions on a message by ID",
      options: [
        {
          name: "message_id",
          description: "Target message ID or message link",
          type: 3,
          required: true
        },
        {
          name: "seconds",
          description: "Delay between reactions (seconds)",
          type: 4,
          required: false
        },
        {
          name: "stop",
          description: "Stop reaction spam",
          type: 5,
          required: false
        }
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

        const messageId = normalizeMessageId(args.message_id);
        if (!messageId) {
          showToast("Invalid message ID or link");
          return;
        }

        const channelId = ChannelStore.getChannelId();
        if (!channelId) {
          showToast("No active channel");
          return;
        }

        const seconds =
          typeof args.seconds === "number" && args.seconds > 0
            ? args.seconds
            : 2;

        spamInterval = setInterval(() => {
          const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
          MessageActions.addReaction(channelId, messageId, {
            name: emoji,
            id: null
          });
        }, seconds * 1000);

        showToast(`Reaction spam started (${seconds}s interval)`);
      }
    });
  },

  onUnload() {
    if (spamInterval) {
      clearInterval(spamInterval);
      spamInterval = null;
    }
  }
};