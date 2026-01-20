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

function parseMessageTarget(input) {
  if (!input) return null;

  // Message link
  const match = input.match(/channels\/\d+\/(\d+)\/(\d+)/);
  if (match) {
    return {
      channelId: match[1],
      messageId: match[2]
    };
  }

  // Raw message ID (use current channel)
  if (/^\d{17,20}$/.test(input)) {
    return {
      channelId: ChannelStore.getChannelId(),
      messageId: input
    };
  }

  return null;
}

export default {
  onLoad() {
    registerCommand({
      name: "reactspam",
      description: "Spam reactions on a message (via link or ID)",
      options: [
        {
          name: "target",
          description: "Message link or message ID",
          type: 3,
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

        const target = parseMessageTarget(args.target);
        if (!target) {
          showToast("Invalid or missing message link / ID");
          return;
        }

        spamInterval = setInterval(() => {
          const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

          MessageActions.addReaction(
            target.channelId,
            target.messageId,
            { name: emoji, id: null }
          );
        }, 2000); // 2 seconds

        showToast("Reaction spam started (link-based)");
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