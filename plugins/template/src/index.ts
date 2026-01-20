import { findByProps } from "@vendetta/metro";
import { registerCommand } from "@vendetta/commands";
import { showToast } from "@vendetta/ui/toasts";

const MessageActions = findByProps("addReaction");
const MessageStore = findByProps("getMessages");

let spamInterval = null;

const EMOJIS = [
  "🔥","💀","😂","😭","👀","😈","🤡","💥","🗿","😎",
  "🫡","🤯","🥶","🥵","👽","💣","⚡","🧠","👹","🚨"
];

// Normalize channel input
function normalizeChannel(input) {
  if (!input) return null;
  const str = String(input).trim();

  // Accept channel mentions <#123456789012345678>
  const mentionMatch = str.match(/^<#(\d{17,21})>$/);
  if (mentionMatch) return mentionMatch[1];

  // Accept raw channel ID
  if (/^\d{17,21}$/.test(str)) return str;

  return null;
}

// Get last message in channel
function getLastMessage(channelId) {
  const messages = MessageStore?.getMessages?.(channelId);
  if (!messages) return null;

  const arr = Array.from(messages.values());
  if (arr.length === 0) return null;

  arr.sort((a, b) => b.timestamp - a.timestamp);
  return arr[0];
}

export default {
  onLoad() {
    registerCommand({
      name: "reactspam",
      description: "Spam reactions on the last message of a specified channel",
      options: [
        { name: "channel", description: "Channel mention or ID", type: 3, required: true },
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

        const channelId = normalizeChannel(args.channel);
        if (!channelId) {
          showToast("Invalid channel ID or mention");
          return;
        }

        const lastMessage = getLastMessage(channelId);
        if (!lastMessage) {
          showToast("No messages found in this channel");
          return;
        }

        const seconds = args.seconds > 0 ? args.seconds : 2;

        spamInterval = setInterval(() => {
          const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
          MessageActions.addReaction(channelId, lastMessage.id, { name: emoji });
        }, seconds * 1000);

        showToast(`Reaction spam started on last message in <#${channelId}> (${seconds}s interval)`);
      }
    });
  },

  onUnload() {
    if (spamInterval) clearInterval(spamInterval);
  }
};