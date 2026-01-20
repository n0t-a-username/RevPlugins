import { findByProps, patch } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const ReactionPickerComponent = findByProps("ReactionPicker", "defaultProps")?.ReactionPicker 
                                || findByProps("default", "ReactionPicker")?.default;

if (ReactionPickerComponent) {
  patch(
    "stayOpenReactionUI",
    ReactionPickerComponent.prototype,
    "onEmojiPress",
    (_original: any, args: any, patchOriginal: Function) => {
      const result = patchOriginal(...args);

      // Prevent picker from closing after tapping an emoji
      if (this.dismiss) this.dismiss = () => {};
      return result;
    }
  );
  showToast("Reaction UI patched: stays open on emoji taps");
} else {
  showToast("Failed to find ReactionPicker component");
}

export default {
  onUnload() {
    patch.unpatchAll();
    showToast("Reaction UI patch removed");
  }
};