import { InteractionResponseType } from "discord-interactions";
import { GetDiscordAvatarUrl, BurnImage } from "./utils.js";
import FormData from "form-data";

export const OPTION_TYPES = {
    STRING: 3,
    INTEGER: 4,
    BOOL: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    MENTIONABLE: 9,
    NUMBER: 10,
    ATTACHMENT: 11
};

export function GetOptionValue(options, name) {
    //console.log("Searching for option ", name);

    for (let i = 0; i < options.length; i++) {
        let optData = options[i];
        //console.log("Checked ", optData.name);
        if (optData.name == name) {
            //console.log("Found!")
            return optData.value;
        }
    }

    //console.log("Didn't find ", name);
    return "void";
}

export function ParseMsgResponse(template, userId, options) {
    let res = template.replace(/<(\w+)>/g, (match, key) => {
        if (key == "user") {
            return `<@${userId}>`;
        }
        const targetId = GetOptionValue(options, key);
        if (!targetId) return match; // leave unknown placeholders intact
        return `<@${targetId}>`;
    });

    res = res.replace(/{(\w+)}/g, (match, key) => {
        const target = GetOptionValue(options, key);
        if (!target) return match; // leave unknown placeholders intact
        return target;
    });

    return res;
}

async function igniteTarget(body, userId, targetId) {
    try {
        const avatarHash = body.data.resolved.users[targetId].avatar;

        const avatarRes = await GetDiscordAvatarUrl(targetId, avatarHash);
        const avatarBuffer = Buffer.from(await avatarRes.arrayBuffer());

        const burnGif = BurnImage(avatarBuffer);

        const followUpUrl = `https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${body.token}/messages/@original`;

        const formData = new FormData();

        formData.append('payload_json', JSON.stringify({
            content: `<@${userId}> sets <@${targetId}> on fire!`,
            attachments: [{id: "0", filename: "burn.gif"}]
        }), {
            contentType: "application/json"
        });
        formData.append("files[0]", burnGif, {
            filename: "burn.gif",
            contentType: "image/gif"
        });
        
        await fetch(followUpUrl, { 
            method: 'PATCH',
            body: formData.getBuffer(),
            headers: formData.getHeaders()
        });
    } catch (err) {
        console.log("Failed to ignite target ", err);
        
        let attempts = 0;

        while (attempts < 3) {
            const dRes = await fetch(`https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${body.token}/messages/@original`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    content: "https://cdn.discordapp.com/attachments/736281082361806858/1440782315596021880/attachment.gif"
                })
            });
            if (dRes.status == 429) {
                console.log("Failed to send error message due to timeout");
                attempts++;
                const retry = await dRes.json().retry_after * 1000;
                await new Promise(r => setTimeout(r, retry));
                continue;
            } else if (dRes.status != 200) {
                console.log(dRes.status);
                console.log(await dRes.text());
            }
            break;
        };
    }
}

export const COMMANDS_HASH = {
    hello: {
        description: "Get to meet Planya!",
        type: "response",
        response: "Hello! I'm Planya!, an app that specializes at conjuring fire-related messages! I don't know much, but as I grow, I will learn more commands!"
    },

    avatar: {
        description: "Get user's avatar",
        type: "unique",
        options: [
            {
                name: "target",
                description: "Your target!",
                required: true,
                type: OPTION_TYPES.USER
            }
        ],

        response: async (req, res) => {
            try {
                const { options } = req.body.data;

                const targetId = GetOptionValue(options, "target");
                const targetData = req.body.data.resolved.users[targetId];

                const avatarHash = targetData.avatar;
                const discriminator = targetData.discriminator;

                const avatarUrl = `https://cdn.discordapp.com/avatars/${targetId}/${avatarHash}.png?size=512`;

                const avatarRes = await fetch(avatarUrl);
                const avatarBuffer = Buffer.from(await avatarRes.arrayBuffer());

                res.send({
                    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
                })

                const formData = new FormData();
                const payload = {
                    attachments: [{ id: "0", filename: "avatar.png"} ]
                };
                formData.append("payload_json", JSON.stringify(payload), {
                    contentType: "application/json"
                });
                formData.append("files[0]", avatarBuffer, {
                    filename: "avatar.png",
                    contentType: "image/png"
                });

                const dRes = await fetch(`https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
                    method: "PATCH",
                    body: formData.getBuffer(),
                    headers: formData.getHeaders()
                });
                console.log("Status ", dRes.status);
                console.log("Response ", await dRes.text());
            } catch (err) {
                console.log("Failed to send avatar ", err);
            }
        }
    },

    giftest : {
        description: "An attempt to send an already existing gif",
        type: "unique",

        response: async (req, res) => {
            res.send({type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE});

            const dRes = await fetch(`https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    content: "https://klipy.com/gifs/fire-elmo-whahahah"
                })
            });
            console.log("Status ", dRes.status);
            console.log("Response ", await dRes.text());
        }
    },

    ignite: {
        description: "Set off the sparks of fire!",
        options: [
            {
                name: "target",
                description: "Your target!",
                required: true,
                type: OPTION_TYPES.USER
            }
        ],

        type: "unique",
        response: (req, res) => {
            const { data } = req.body;
            const { options } = data;

            let mentions = [];
            options.forEach(optData => {
                if (optData.type == OPTION_TYPES.USER) {
                    mentions.push(optData.value);
                }
            });
            
            const context = req.body.context;
            // User ID is in user field for (G)DMs, and member for servers
            const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
            const targetId = GetOptionValue(options, "target");

            if (userId == targetId) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `Sparks fly into the air when <@${userId}> flicks the lighter.`,
                        allowed_mentions: options ? {
                            users: mentions
                        } : null
                    }
                })
            } else if (targetId == process.env.APP_ID) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: "..."
                    }
                })
            } else {
                igniteTarget(req.body, userId, targetId);

                return res.send({
                    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
                })
            }

        },
        responses: {
            normal: "<user> has set <target> on fire!",
            self: "Sparks fly into the air when <user> flicks the lighter.",
            bot: "..."
        }
    }
}