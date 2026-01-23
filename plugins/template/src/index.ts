import { findByProps, findByStoreName } from "@vendetta/metro";
import { registerCommand } from "@vendetta/commands";

const UserStore = findByStoreName("UserStore");

const { receiveMessage } = findByProps("receiveMessage");
const { createBotMessage } = findByProps("createBotMessage");

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
            name: "snatcher",
            description: "Snatch a user's profile picture",
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

                const message = createBotMessage({
                    channelId: ctx.channelId,
                    content: `Snatched **${user.username}**`
                });

                message.attachments = [
                    {
                        id: "avatar",
                        filename: "avatar.png",
                        size: 0,
                        url: avatarUrl,
                        proxy_url: avatarUrl,
                        content_type: "image/png",
                        width: 1024,
                        height: 1024
                    }
                ];

                receiveMessage(ctx.channelId, message);
            }
        });
    },

    onUnload() {}
};
