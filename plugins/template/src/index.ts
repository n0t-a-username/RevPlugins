import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";

const MessageActions = findByProps("addReaction");

let unpatch: (() => void) | null = null;
let isInjecting = false;

// Default emoji set (can be changed)
const DEFAULT_EMOJIS = ["🔥", "💀", "😂", "👀"];

export default {
    onLoad() {
        // Persisted emoji list
        storage.emojis ??= DEFAULT_EMOJIS;
        storage.delayMs ??= 120;

        unpatch = before(
            "addReaction",
            MessageActions,
            async ([channelId, messageId, emoji, location]) => {
                // Prevent infinite loops
                if (isInjecting) return;

                // Only intercept double-tap reactions
                if (location !== "DOUBLE_TAP") return;

                isInjecting = true;

                try {
                    // Cancel default single emoji by returning null
                    setTimeout(async () => {
                        for (const e of storage.emojis) {
                            try {
                                await MessageActions.addReaction(
                                    channelId,
                                    messageId,
                                    e,
                                    "DOUBLE_TAP"
                                );
                            } catch {}
                            await new Promise(r => setTimeout(r, storage.delayMs));
                        }
                        isInjecting = false;
                    }, 0);

                    return false; // block original
                } catch {
                    isInjecting = false;
                }
            }
        );
    },

    onUnload() {
        unpatch?.();
    },
};