import { storage } from "@vendetta/plugin";
import { React, NavigationNative } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { after } from "@vendetta/patcher";
import { Forms } from "@vendetta/ui/components";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";
import { logger } from "@vendetta";
import Settings from "./Settings"; // Ensure this matches your filename

const { FormSection, FormRow } = Forms;
const TableRowIcon = findByProps("TableRowIcon")?.TableRowIcon;
const bunny = (window as any).bunny;

const tabsNavigationRef = bunny?.metro?.findByPropsLazy("getRootNavigationRef");
const settingConstants = bunny?.metro?.findByPropsLazy("SETTING_RENDERER_CONFIG");
const createListModule = bunny?.metro?.findByPropsLazy("createList");
const SettingsOverviewScreen = bunny?.metro?.findByNameLazy("SettingsOverviewScreen", false);

function Section({ tabs }: any) {
  const navigation = NavigationNative.useNavigation();

  return React.createElement(FormRow, {
    label: tabs.title(),
    leading: React.createElement(FormRow.Icon, { source: tabs.icon }),
    trailing: React.createElement(React.Fragment, {}, [
      tabs.trailing ? tabs.trailing() : null,
      React.createElement(FormRow.Arrow, { key: "arrow" }),
    ]),
    onPress: () => {
      navigation.navigate("VendettaCustomPage", {
        title: tabs.title(),
        render: () => React.createElement(tabs.page),
      });
    },
  });
}

function patchPanelUI(tabs: any, patches: any[]) {
  try {
    const PanelModule = bunny?.metro?.findByPropsLazy(["renderTitle", "sections"], false);
    if (!PanelModule) return;

    patches.push(
      after("default", PanelModule, (_, ret) => {
        const UserSettingsOverview = findInReactTree(
          ret.props.children,
          (n) => n.type?.name === "UserSettingsOverview"
        );

        if (UserSettingsOverview) {
          patches.push(
            after("render", UserSettingsOverview.type.prototype, (_args, res) => {
              const sections = findInReactTree(
                res.props.children,
                (n) => n?.children?.[1]?.type === FormSection
              )?.children;

              if (sections) {
                const index = sections.findIndex((c: any) =>
                  ["BILLING_SETTINGS", "PREMIUM_SETTINGS"].includes(c?.props?.label)
                );

                sections.splice(
                  index !== -1 ? index : 4,
                  0,
                  React.createElement(Section, { key: tabs.key, tabs })
                );
              }
            })
          );
        }
      }, true)
    );
  } catch (error) {
    logger.info("Bemmo: Panel UI patch failed graciously 💔", error);
  }
}

function patchTabsUI(tabs: any, patches: any[]) {
  if (!settingConstants || !tabsNavigationRef) return;

  const row = {
    [tabs.key]: {
      type: "pressable",
      title: tabs.title,
      icon: tabs.icon,
      IconComponent: tabs.icon && (() => React.createElement(TableRowIcon, { source: tabs.icon })),
      usePredicate: tabs.predicate,
      useTrailing: tabs.trailing,
      onPress: () => {
        const navigation = tabsNavigationRef.getRootNavigationRef();
        navigation.navigate("VendettaCustomPage", {
          title: tabs.title(),
          render: () => React.createElement(tabs.page),
        });
      },
      withArrow: true,
    },
  };

  let rendererConfigValue = settingConstants.SETTING_RENDERER_CONFIG;
  Object.defineProperty(settingConstants, "SETTING_RENDERER_CONFIG", {
    enumerable: true,
    configurable: true,
    get: () => ({ ...rendererConfigValue, ...row }),
    set: (v) => (rendererConfigValue = v),
  });

  const firstRender = Symbol("BemmoPin");

  try {
    if (!createListModule) return;
    patches.push(
      after("createList", createListModule, (args, ret) => {
        if (!args[0][firstRender]) {
          args[0][firstRender] = true;
          const section = args[0].sections?.find((x: any) =>
            ["Bunny", "Revenge", "Kettu", "Vencore", "ShiggyCord"].some((mod) => x.label === mod)
          );
          if (section?.settings) section.settings.push(tabs.key);
        }
      })
    );
  } catch {
    if (!SettingsOverviewScreen) return;
    patches.push(
      after("default", SettingsOverviewScreen, (args, ret) => {
        if (!args[0][firstRender]) {
          args[0][firstRender] = true;
          const { sections } = findInReactTree(ret, (i) => i.props?.sections).props;
          const section = sections?.find((x: any) =>
            ["Bunny", "Revenge", "Kettu", "Vencore", "ShiggyCord"].some((mod) => x.label === mod)
          );
          if (section?.settings) section.settings.push(tabs.key);
        }
      })
    );
  }
}

export default function patchSidebar() {
  const patches: any[] = [];
  
  // Bemmo Configuration
  const tabs = {
    key: "BemmoPlugin",
    icon: getAssetIDByName("emoji-negative"),
    title: () => "Bemmo",
    predicate: () => storage.sidebarEnabled !== false,
    page: Settings,
  };

  console.log("[Bemmo] Patching sidebar...");

  patchPanelUI(tabs, patches);
  patchTabsUI(tabs, patches);

  return () => {
    for (const unpatch of patches) unpatch();
  };
}

