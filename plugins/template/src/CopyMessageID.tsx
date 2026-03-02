import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByName, findByProps } from "@vendetta/metro";
import { clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { React } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message;
    if (key !== "MessageLongPressActionSheet" || !message) return;

    component.then((instance) => {
        const unpatchInstance = instance.default
            ? instance.default
            : instance;

        const patch = before("default", unpatchInstance, (_, res) => {
            React.useEffect(() => () => patch(), []);

            const actionSheetContainer = findInReactTree(
                res,
                (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
            );

            const buttons = findInReactTree(
                res,
                (x) => x?.[0]?.type?.name === "ButtonRow",
            );

            const copyAction = () => {
                clipboard.setString(String(message.id));
                showToast(
                    "Copied Message ID",
                    getAssetIDByName("toast_copy_link"),
                );
                LazyActionSheet.hideActionSheet();
            };

            const copyRow = (
                <FormRow
                    label="Copy Message ID"
                    leading={
                        <FormIcon
                            style={{ opacity: 1 }}
                            source={getAssetIDByName("ic_copy_24px")}
                        />
                    }
                    onPress={copyAction}
                />
            );

            if (buttons) {
                buttons.push(copyRow);
            } else if (actionSheetContainer && actionSheetContainer[1]) {
                actionSheetContainer[1].props.children.push(copyRow);
            } else {
                console.log("[CopyMessageID] Could not find ActionSheet");
            }
        });
    });
});

export const onUnload = () => unpatch();
