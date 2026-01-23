import { findByProps, findByStoreName } from "@vendetta/metro";
import { registerCommand } from "@vendetta/commands";

const UserStore = findByStoreName("UserStore");
const MessageActions = findByProps("sendMessage");

function getAvatarUrl(user: any, size = 1024) {
    if (user.avatar) {
        const animated = user.avatar.startsWith("a_");
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${animated ? "gif" : "png"}?size=${size}`;
    }

    const index = Number(BigInt(user.id) >> 22n) % 6;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export default {
    onLoad() {
        registerCommand({
            name: "snatch",
            description: "Get a user's avatar via CDN",
            options: [
                {
                    name: "user",
                    description: "User to snatch",
                    type: 6, // USER
                    required: true
                }
            ],
            execute: async (args, ctx) => {
                const userId = args.user?.value;
                if (!userId) return;

                const user = UserStore.getUser(userId);
                if (!user) return;

                const avatarUrl = getAvatarUrl(user);

                MessageActions.sendMessage(ctx.channelId, {
                    content: `${user.username}'s avatar:\n${avatarUrl}`
                });
            }
        });
    },

    onUnload() {}
};