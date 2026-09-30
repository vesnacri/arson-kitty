import { InteractionResponseType } from "discord-interactions";

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
    console.log("Searching for option ", name);
    for (let i = 0; i < options.length; i++) {
        let optData = options[i];
        console.log("Checked ", optData.name);
        if (optData.name == name) {
            console.log("Found!")
            return optData.value;
        }
    }

    console.log("Didn't find ", name);
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

export const COMMANDS_HASH = {
    hello: {
        description: "Get to meet the arson kitty!",
        type: "response",
        response: "Hello! I'm Arson Kitty, an app that specializes at conjuring fire-related messages! I don't know much, but as I grow, I will learn more commands!"
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

        type: "targetResponse",
        responses: {
            normal: "<user> has set <target> on fire!",
            self: "Sparks fly into the air when <user> flicks the lighter.",
            bot: "..."
        }
    }
}