import { InteractionResponseType } from "discord-interactions";

const OPTION_TYPES = {
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

export const COMMANDS_HASH = {
    hello: {
        description: "Get to meet the arson kitty!",
        response_type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        response: {
            content: "Hello! I'm Arson Kitty, an app that specializes at conjuring fire-related messages!"
        }
    }
}