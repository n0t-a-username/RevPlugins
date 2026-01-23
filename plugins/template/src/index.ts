import { findByProps } from "@vendetta/metro";
import { registerCommand } from "@vendetta/commands";
import { sendBotMessage } from "@vendetta/api/messages";

const UserStore = findByProps("getUser", "getCurrentUser");

function getAvatarUrl(user: any, size = 1024) {
    if (user.avatar) {
        const isAnimated = user.avatar.startsWith("a_");
        const ext = isAnimated ? "gif" : "png";
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
    }

    const index = Number(BigInt(user.id) >> 22n) % 6;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export default {
    onLoad() {
        registerCommand({
            name: "snatch",
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
                if (!user) {
                    sendBotMessage(ctx.channel.id, {
                        content: "User not found."
                    });
                    return;
                }

                const avatarUrl = getAvatarUrl(user);

                sendBotMessage(ctx.channel.id, {
                    embeds: [
                        {
                            author: {
                                name: `${user.username}`,
                                icon_url: avatarUrl
                            },
                            title: "Snatched Profile",
                            image: {
                                url: avatarUrl
                            },
                            footer: {
                                text: `ID: ${user.id}`
                            }
                        }
                    ]
                });
            }
        });
    },

    onUnload() {}
};