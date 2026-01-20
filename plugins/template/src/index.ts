import { findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const ReactionModule = findByProps("openReactionPicker");
const patches: Function[] = [];

if (!ReactionModule || !ReactionModule.openReactionPicker) {
    showToast("Failed to find Reaction Picker module");
} else {
    patches.push(
        after("openReactionPicker", ReactionModule, (_args, pickerInstance) => {
            if (!pickerInstance) return;

            try {
                // Override dismiss for this instance only
                if (pickerInstance.dismiss) {
                    pickerInstance.dismiss = () => {}; // noop
                }
            } catch (e) {
                console.error("Failed to patch ReactionPicker instance", e);
            }
        })
    );

    showToast("Reaction UI patched: stays open on emoji taps");
}

export const onUnload = () => {
    for (const unpatch of patches) unpatch();
    showToast("Reaction UI patch removed");
};