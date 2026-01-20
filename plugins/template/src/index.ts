import { findByProps } from "@vendetta/metro";
import { instead, after } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const ReactionPicker = findByProps("ReactionPicker", "defaultProps")?.ReactionPicker
    || findByProps("default", "ReactionPicker")?.default;

const patches: Function[] = [];

if (!ReactionPicker || !ReactionPicker.prototype) {
    showToast("Failed to find ReactionPicker");
} else {
    // Patch onEmojiPress to prevent closing
    patches.push(
        instead("onEmojiPress", ReactionPicker.prototype, function(original, args) {
            const result = original.apply(this, args);

            // Override dismiss only for emoji taps
            if (this.dismiss) {
                this.dismiss = () => {}; // noop
            }

            return result;
        })
    );

    showToast("Reaction UI patched: stays open on emoji taps");
}

export const onUnload = () => {
    for (const unpatch of patches) unpatch();
    showToast("Reaction UI patch removed");
};