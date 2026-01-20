import { findByProps } from "@vendetta/metro";
import { registerCommand } from "@vendetta/commands";
import { showToast } from "@vendetta/ui/toasts";

const MessageActions = findByProps("addReaction");
const ChannelStore = findByProps("getChannelId");
const MessageStore = findByProps("getMessages");

let spamInterval = null;

const EMOJIS = [
  "🔥", "💀", "😂", "😭", "👀",
  "😈", "🤡", "💥", "🗿", "😎",
  "🫡", "🤯", "🥶", "🥵", "👽",
  "💣", "⚡", "🧠", "👹", "🚨"
];

function getLastMessage(channelId) {
  const messages = MessageStore.getMessages(channelId);
  return messages?._array?.slice(-1)[0];
}

export default {
  onLoad() {
    registerCommand({
      name: "reactspam",
      description: "Spam reactions on the last message",
      options: [
        {
          name: "stop",
          description: "Stop reaction spam",
          type: 5,
          required: false
        }
      ],
      execute(args) {
        const channelId = ChannelStore.getChannelId();

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

        const message = getLastMessage(channelId);
        if (!message) {
          showToast("No message found");
          return;
        }

        spamInterval = setInterval(() => {
          const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

          MessageActions.addReaction(
            channelId,
            message.id,
            {
              name: emoji,
              id: null
            }
          );
        }, 300); // adjust speed here

        showToast("Reaction spam started");
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