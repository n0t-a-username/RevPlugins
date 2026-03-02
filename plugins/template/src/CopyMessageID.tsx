import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { logger } from "@vendetta";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

const unpatch = before("openLazy", LazyActionSheet, (args) => {
  const [component, key, msg] = args;

  logger.log("ActionSheet opened with key:", key);

  const message = msg?.message;
  if (!message) return;

  component.then((instance) => {
    const target = instance.default ?? instance;

    const unpatchInner = before("default", target, (_, res) => {
      React.useEffect(() => () => unpatchInner(), []);

      const actionSheetContainer = findInReactTree(
        res,
        (x) =>
          Array.isArray(x) &&
          x.some?.((c: any) => c?.type?.name === "ActionSheetRowGroup"),
      );

      if (!actionSheetContainer) {
        logger.log("No ActionSheetRowGroup found");
        return;
      }

      const group = actionSheetContainer[1];
      if (!group?.props?.children) {
        logger.log("Group found but no children");
        return;
      }

      logger.log("Injecting Copy Message ID button");

      group.props.children.push(
        <FormRow
          key="copy-message-id"
          label="Copy Message ID"
          leading={
            <FormIcon
              style={{ opacity: 1 }}
              source={getAssetIDByName("ic_copy_24px")}
            />
          }
          onPress={() => {
            clipboard.setString(String(message.id));
            showToast(
              "Copied Message ID",
              getAssetIDByName("toast_copy_link"),
            );
            LazyActionSheet.hideActionSheet();
          }}
        />,
      );
    });
  });
});

export const onUnload = () => unpatch();