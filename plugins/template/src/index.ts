import { findByProps, patch } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

// Patch the ReactionPicker to prevent it from closing
const ReactionPickerModule = findByProps("openReactionPicker");

if (ReactionPickerModule && ReactionPickerModule.openReactionPicker) {
  patch(
    "stayOpenReactionPicker",
    ReactionPickerModule,
    "openReactionPicker",
    (_original: any, args: any, patchOriginal: Function) => {
      const picker = patchOriginal(...args);

      // Override the dismiss function so it doesn't close on tap
      if (picker?.dismiss) {
        picker.dismiss = () => {}; // noop
      }

      return picker;
    }
  );
  showToast("Reaction UI patched: stays open on each tap");
} else {
  showToast("Failed to patch Reaction UI");
}

export default {
  onLoad() {
    // already patched above
  },

  onUnload() {
    patch.unpatchAll();
    showToast("Reaction UI patch removed");
  }
};