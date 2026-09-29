import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
  verifyKey
} from 'discord-interactions';

const APP_ID = process.env.APP_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

const commands = [
    // Simple test command
    {
        name: 'test',
        description: 'Basic command',
        type: 1,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
    }
];

function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf) {
    const signature = req.get('X-Signature-Ed25519');
    const timestamp = req.get('X-Signature-Timestamp');
    console.log(signature, timestamp, clientKey);

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send('Bad request signature');
      throw new Error('Bad request signature');
    }
  };
}


async function DiscordRequest(endpoint, options) {
    // append endpoint to root API URL
    const url = 'https://discord.com/api/v10/' + endpoint;
    // Stringify payloads
    if (options.body) options.body = JSON.stringify(options.body);
    // Use fetch to make requests
    const res = await fetch(url, {
        headers: {
        Authorization: `Bot ${process.env.BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=UTF-8',
        //'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
        },
        ...options
    });
    // throw API errors
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    // return original response
    return res;
}

async function InstallGlobalCommands() {
    const endpoint = `applications/${APP_ID}/commands`;

    try {
        // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        await DiscordRequest(endpoint, { method: 'PUT', body: commands });
    } catch (err) {
        console.error(err);
    }
}

InstallGlobalCommands();

const app = express();

app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

app.post("/interactions", async function(req, res) {
    const {id, type, data} = req.body;
    console.log("Someone tried to interact!");
    if (type == InteractionType.PING) {
        return res.send({type: InteractionResponseType.PONG});
    }
    console.log(data);
    if (type == InteractionType.APPLICATION_COMMAND) {
        const {name} = data;
  
        if (name === "test") {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: "Hello world!"
                },
            });
        }
    }

    //console.error('unknown interaction type', type);
    //return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
    console.log("Listening to port", PORT);
});