import { findByProps } from "@vendetta/metro";
import { registerCommand } from "@vendetta/commands";
import { showToast } from "@vendetta/ui/toasts";

const MessageActions = findByProps("addReaction");
const ChannelStore = findByProps("getChannelId");

let spamInterval = null;

const EMOJIS = [
  "🔥", "💀", "😂", "😭", "👀",
  "😈", "🤡", "💥", "🗿", "😎",
  "🫡", "🤯", "🥶", "🥵", "👽",
  "💣", "⚡", "🧠", "👹", "🚨"
];

function normalizeMessageId(input) {
  if (input == null) return null;

  // Vendetta always gives strings for type:3 — just sanitize
  const str = String(input).trim();

  // Accept any snowflake-length numeric ID
  if (!/^\d{16,21}$/.test(str)) return null;

  return str;
}

export default {
  onLoad() {
    registerCommand({
      name: "reactspam",
      description: "Spam reactions on a message by ID",
      options: [
        {
          name: "message_id",
          description: "Target message ID",
          type: 1, // REQUIRED — do not remove
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
          showToast("Invalid message ID");
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

          MessageActions.addReaction(
            channelId,
            messageId,
            { name: emoji, id: null }
          );
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