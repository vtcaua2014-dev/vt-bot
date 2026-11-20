import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';
if(!process.env.DISCORD_TOKEN||!process.env.DISCORD_CLIENT_ID){console.error('Configure DISCORD_TOKEN e DISCORD_CLIENT_ID.');process.exit(1);}
const rest=new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
try{
  const route=process.env.DISCORD_GUILD_ID?Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID,process.env.DISCORD_GUILD_ID):Routes.applicationCommands(process.env.DISCORD_CLIENT_ID);
  await rest.put(route,{body:commands});
  console.log(`${commands.length} comandos cadastrados ${process.env.DISCORD_GUILD_ID?'no servidor de teste':'globalmente'}.`);
}catch(err){console.error(err);process.exitCode=1;}
