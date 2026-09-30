import 'dotenv/config';
import express from 'express';
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest } from './utils.js';
import { COMMANDS_HASH } from './commands.js';

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
        const { name } = data;

        if (Object.hasOwn(COMMANDS_HASH, name)) {
            const cmd_data = COMMANDS_HASH[name];

            return res.send({
                type: cmd_data.response_type,
                data: cmd_data.response
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