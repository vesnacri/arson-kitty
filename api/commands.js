import { InteractionResponseType } from "discord-interactions";

const CONTEXT_TYPES = {
    GUILD: 0,
    BOT_DM: 1,
    DM: 2
}

const DEFAULT_CONTEXT = [CONTEXT_TYPES.GUILD, CONTEXT_TYPES.DM]

export const COMMANDS_LIST = [
    // Simple test command
    {
        name: 'test',
        description: 'Basic command',
        type: 1,
        integration_types: [0, 1],
        contexts: DEFAULT_CONTEXT,
    }
];