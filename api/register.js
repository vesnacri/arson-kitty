import { InstallGlobalCommands } from "./utils.js";
import { COMMANDS_HASH } from "./commands.js"

const CONTEXT_TYPES = {
    GUILD: 0,
    BOT_DM: 1,
    DM: 2
};
const DEFAULT_CONTEXT = [CONTEXT_TYPES.GUILD, CONTEXT_TYPES.DM];

var commands_list = [];

for (const cmd_name in COMMANDS_HASH) {
    const cmd_data = COMMANDS_HASH[cmd_name]

    commands_list.push({
        name: cmd_name,
        description: cmd_data.description,
        type: 1,
        integration_types: [1],
        contexts: DEFAULT_CONTEXT,
        options: cmd_data.options ?? null
    })
};

InstallGlobalCommands(commands_list);