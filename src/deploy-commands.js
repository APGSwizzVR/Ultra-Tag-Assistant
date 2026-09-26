import {REST,Routes} from "discord.js";
import {config} from "./config.js";
import {commands} from "./commands.js";
const rest=new REST({version:"10"}).setToken(config.token);
const body=commands.map(c=>c.toJSON());
await rest.put(config.guildId?Routes.applicationGuildCommands(config.clientId,config.guildId):Routes.applicationCommands(config.clientId),{body});
console.log("Registered "+body.length+" Ultra Tag Assistant commands.");
