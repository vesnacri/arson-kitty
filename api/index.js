import 'dotenv/config';
import express from 'express';
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest } from './utils.js';
import { COMMANDS_HASH, GetOptionValue, ParseMsgResponse, OPTION_TYPES } from './commands.js';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.post("/interactions", async function(req, res) {
    const isValidRequest = await VerifyDiscordRequest(req);
    if (!isValidRequest) {
        return res.status(401).end('Bad request signature');
    }

    // Interaction id, type and data
    const { id, type, data } = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
        console.log("Pong!");
        return res.send({ type: InteractionResponseType.PONG });
    }

    /**
     * Handle slash command requests
     * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name, options } = data;
        // Interaction context
        const context = req.body.context;
        // User ID is in user field for (G)DMs, and member for servers
        const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

        console.log("Attempted command ", name);

        if (Object.hasOwn(COMMANDS_HASH, name)) {
            const cmd_data = COMMANDS_HASH[name];
            let mentions = [];

            if (options) {
                options.forEach(optData => {
                    if (optData.type == OPTION_TYPES.USER) {
                        mentions.push(optData.value);
                    }
                });
            }

            if (cmd_data.type == "response") {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: ParseMsgResponse(cmd_data.response, userId, options),
                        allowed_mentions: {
                            users: mentions
                        }
                    }
                })
            } else if (cmd_data.type == "targetResponse") {
                const targetId = GetOptionValue(options, "target");
                if (userId == targetId) {
                    return res.send({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                            content: ParseMsgResponse(cmd_data.responses.self, userId, options),
                            allowed_mentions: options ? {
                                users: mentions
                            } : null
                        }
                    })
                } else if (targetId == process.env.APP_ID) {
                    return res.send({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                            content: ParseMsgResponse(cmd_data.responses.bot, userId, options),
                            allowed_mentions: options ? {
                                users: mentions
                            } : null
                        }
                    })
                } else {
                    return res.send({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                            content: ParseMsgResponse(cmd_data.responses.normal, userId, options)
                        }
                    })
                }
            }

            console.log("Command not found");

            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: "Aughhhh... i forgor..."
                }
            });
        }

        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: 'unknown command' });
    }

    console.error('unknown interaction type', type);
    return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
    console.log("Listening to port", PORT);
});