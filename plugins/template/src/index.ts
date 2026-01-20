import { findByProps, patch } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

let patched = false;

// 1. Find the ReactionPicker component
const ReactionPickerModule =
    findByProps("ReactionPicker", "defaultProps")?.ReactionPicker ||
    findByProps("default", "ReactionPicker")?.default;

if (!ReactionPickerModule || !ReactionPickerModule.prototype) {
    showToast("Failed to find ReactionPicker component");
} else {
    // 2. Patch the component's render to override dismiss on mount
    patch(
        "stayOpenReactionUI",
        ReactionPickerModule.prototype,
        "componentDidMount",
        (_original: any, args: any, patchOriginal: Function) => {
            patchOriginal(...args);

            try {
                // Override dismiss function in this instance
                if (this.dismiss) {
                    const originalDismiss = this.dismiss;
                    this.dismiss = () => {
                        // Only dismiss when tapping outside
                        if (this._tappedOutside) originalDismiss.call(this);
                        // Otherwise do nothing
                    };
                }
            } catch (e) {
                console.error("Failed to patch ReactionPicker dismiss", e);
            }

            return null;
        }
    );

    patched = true;
    showToast("Reaction UI patched: stays open on emoji taps");
}

export default {
    onLoad() {
        if (!patched) showToast("Reaction UI patch not applied");
    },
    onUnload() {
        if (patched) {
            patch.unpatchAll();
            showToast("Reaction UI patch removed");
        }
    }
};