import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { after } from "@vendetta/patcher";
import { registerCommand } from "@vendetta/commands";

const ThemeStore = findByStoreName("ThemeStore");
const ColorUtils = findByProps("isValidHex", "hexToAlpha");
// This module handles the actual color mapping in the mobile app
const SemanticColorStore = findByProps("getColors");

/**
 * We create a patch that intercepts the color lookup.
 * If the app asks for a color while our "Midnight" editor is on, 
 * we return the user-defined hex instead.
 */
export function patchTheme() {
  return after("getColors", SemanticColorStore, (args, colors) => {
    if (!storage.themeEditorEnabled) return colors;

    const theme = ThemeStore.getTheme();
    
    // Check if we are currently in a "Dark" or "Midnight" base theme
    if (theme === "dark" || theme === "midnight") {
      // Background Overlay
      if (colors.BACKGROUND_TERTIARY) {
        colors.BACKGROUND_TERTIARY = storage.customBg || "#000000";
      }
      
      // The "Blurple" Accent (used for buttons, mentions, etc.)
      if (colors.BRAND_EXPERIMENT) {
        colors.BRAND_EXPERIMENT = storage.customAccent || "#5865F2";
      }
      
      // Primary backgrounds
      if (colors.BACKGROUND_PRIMARY) {
        colors.BACKGROUND_PRIMARY = storage.customPrimary || "#111214";
      }
    }
    
    return colors;
  });
}

// ---- /theme-set COMMAND ----
export const themeCommand = registerCommand({
  name: "theme-set",
  displayName: "theme-set",
  description: "Edit Midnight Blurple colors",
  options: [
    {
      name: "accent",
      displayName: "accent_hex",
      description: "Hex code for Blurple parts (e.g. #ff0000)",
      type: 3,
      required: false,
    },
    {
      name: "background",
      displayName: "bg_hex",
      description: "Hex code for main background",
      type: 3,
      required: false,
    }
  ],
  applicationId: "-1",
  inputType: 1,
  type: 1,
  execute: (args, ctx) => {
    const accent = args.find(a => a.name === "accent")?.value;
    const bg = args.find(a => a.name === "background")?.value;

    if (accent) storage.customAccent = accent;
    if (bg) storage.customBg = bg;
    
    storage.themeEditorEnabled = true;

    // We force a UI re-render by toggling a small state or 
    // simply informing the user a restart/theme-swap is needed.
    return { content: "🎨 Theme updated! You may need to toggle your theme in settings to see changes." };
  },
});
