import "dotenv/config";

import { verifyKey } from "discord-interactions";

export async function VerifyDiscordRequest(req) {
    const signature = req.get('X-Signature-Ed25519');
    const timestamp = req.get('X-Signature-Timestamp');
    //console.log(signature, timestamp, clientKey);

    const isValidRequest = await verifyKey(req.rawBody, signature, timestamp, process.env.PUBLIC_KEY);
    return isValidRequest;
};


export async function DiscordRequest(endpoint, options) {
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

export async function InstallGlobalCommands(commands) {
    const endpoint = `applications/${process.env.APP_ID}/commands`;

    try {
        // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        await DiscordRequest(endpoint, { method: 'PUT', body: commands });
        console.log("Updated commands");
    } catch (err) {
        console.error(err);
    }
}