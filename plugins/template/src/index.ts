import { React } from "@vendetta/metro";
import { registerCommand, unregisterCommand } from "@vendetta/commands";
import { showConfirmationModal } from "@vendetta/ui/alerts";
import CustomUIModal from "./CustomUIModal";

let commandId: string | null = null;

export default {
  onLoad() {
    commandId = registerCommand({
      name: "customui",
      description: "Open a custom UI modal",
      options: [],
      execute() {
        showConfirmationModal({
          title: "Custom UI",
          content: <CustomUIModal />,
          confirmText: "Close",
          cancelText: null
        });
      }
    });
  },

  onUnload() {
    if (commandId) unregisterCommand(commandId);
  }
};