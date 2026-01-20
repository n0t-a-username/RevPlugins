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

function isValidMessageId(id) {
  return typeof id === "string" && /^\d{17,20}$/.test(id);
}

export default {
  onLoad() {
    registerCommand({
      name: "reactspam",
      description: "Spam reactions on a message by ID (current channel)",
      options: [
        {
          name: "message_id",
          description: "Target message ID",
          type: 3,
          required: true
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

        const messageId = args.message_id;
        if (!isValidMessageId(messageId)) {
          showToast("Invalid message ID");
          return;
        }

        const channelId = ChannelStore.getChannelId();
        if (!channelId) {
          showToast("No active channel");
          return;
        }

        spamInterval = setInterval(() => {
          const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

          MessageActions.addReaction(
            channelId,
            messageId,
            { name: emoji, id: null }
          );
        }, 2000); // 2 seconds

        showToast("Reaction spam started (message ID)");
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