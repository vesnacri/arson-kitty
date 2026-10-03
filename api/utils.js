import "dotenv/config";
import sharp from "sharp";
import fs from "fs";
import path from "path";

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

export async function GetDiscordAvatarUrl(userId, avatarHash) {
    const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=512`
    : `https://cdn.discordapp.com/embed/avatars/${(BigInt(userId) >> 22n) % 6n}.png`;

    const avatarRes = await fetch(avatarUrl);

    if (!avatarRes.ok) {
        throw new Error("Failed to fetch avatar "+ await avatarRes.text())
    }

    return avatarRes;
}

export async function BurnImage(imgBuffer) {
    try {
        const gifBuffer = fs.readFileSync(path.join(process.cwd(), 'assets', 'firegif.gif'));    

        const gifMetadata = await sharp(gifBuffer, { animated: true }).metadata();
        const imgMetadata = await sharp(imgBuffer).metadata();

        const gifWidth = gifMetadata.width;
        const gifHeight = gifMetadata.pageHeight || gifMetadata.height; 
        const framesCount = gifMetadata.pages;

        const resizedGif = await sharp(gifBuffer)
        .resize(imgMetadata.width, imgMetadata.height, {fit: "fill"})
        .toBuffer();

        const extendedBackgroundBuffer = await sharp(imgBuffer)
        //.resize(gifWidth, gifHeight, { fit: 'cover' })
        .extend({
            bottom: imgMetadata.height * (framesCount - 1),
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            extendWith: 'repeat'
        })
        .toBuffer();

        // 3. Накладываем GIF поверх созданной ленты фонов
        const resultGif =  await sharp(extendedBackgroundBuffer)
        .composite([
            {
            input: resizedGif,
            animated: true, // Указываем, что оверлей анимированный
            top: 0,
            left: 0,
            blend: 'over'  // Режим наложения (сохраняет прозрачность GIF)
            }
        ])
        // Включаем повторное сжатие палитры, чтобы избежать артефактов цветов
        .gif({ reoptimise: true }) 
        .toBuffer();

        return Buffer.isBuffer(resultGif) ? resultGif : Buffer.from(resultGif);
  } catch (error) {
    console.log("Failed to burn image");
    throw error;
  }
}