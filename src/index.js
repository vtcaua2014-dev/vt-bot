import 'dotenv/config';
import { Client, GatewayIntentBits, Events, Partials } from 'discord.js';
import { executeCommand, configComponent, postWelcomePanel } from './commands.js';
import { gameComponent, gameModal, rememberGameMessage } from './games.js';
import { albumComponent } from './media.js';
import { akinComponent } from './akinator.js';
import { canAutoReply, askAI, textParts } from './ai.js';
import { guildSettings } from './data.js';

if(!process.env.DISCORD_TOKEN||process.env.DISCORD_TOKEN==='COLE_SEU_TOKEN_AQUI')throw new Error('Configure DISCORD_TOKEN em .env/variáveis de ambiente.');
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.DirectMessages],partials:[Partials.Channel],allowedMentions:{parse:[]}});
client.once(Events.ClientReady,c=>console.log(`Vt4Fun conectado como ${c.user.tag}. Guilds: ${c.guilds.cache.size}`));
client.on(Events.GuildCreate, async guild=>{try{await guild.members.fetchMe();await postWelcomePanel(guild);}catch(e){console.error('[guildCreate]',e);}});
client.on(Events.InteractionCreate,async interaction=>{
  try{
    if(interaction.isChatInputCommand())await executeCommand(interaction);
    else if(interaction.isModalSubmit()&&interaction.customId.startsWith('g:'))await gameModal(interaction);
    else if(interaction.isButton()||interaction.isStringSelectMenu()||interaction.isRoleSelectMenu()){
      if(interaction.customId.startsWith('cfg:'))await configComponent(interaction);
      else if(interaction.customId.startsWith('g:')){await rememberGameMessage(interaction);await gameComponent(interaction);}
      else if(interaction.customId.startsWith('album:'))await albumComponent(interaction);
      else if(interaction.customId.startsWith('akin:'))await akinComponent(interaction);
    }
  }catch(err){console.error('[interaction]',interaction.customId||interaction.commandName,err);
    const response={content:'Ocorreu um erro ao executar esse comando. Tente novamente.',ephemeral:true};
    try{if(interaction.deferred)await interaction.editReply({content:response.content});else if(interaction.replied)await interaction.followUp(response);else await interaction.reply(response);}catch{}
  }
});
client.on(Events.MessageCreate,async message=>{
  try{
    if(!canAutoReply(message,client))return;
    const gs=guildSettings(message.guild.id);
    const text=message.content.replace(new RegExp(`<@!?${client.user.id}>`,'g'),'').replace(gs.aiRoleId?new RegExp(`<@&${gs.aiRoleId}>`,'g'):/\b\B/g,'').trim();
    if(!text)return;
    await message.channel.sendTyping();
    const answer=await askAI(message.author.id,message.channel.id,text,gs.language);
    const parts=textParts(answer);
    for(let i=0;i<parts.length;i++)await message.reply({content:parts[i],allowedMentions:{parse:[],repliedUser:i===0}});
  }catch(e){console.warn('[mention IA]',e.message);try{await message.reply({content:`Luna indisponível: ${e.message}`.slice(0,1900),allowedMentions:{parse:[]}});}catch{}}
});
client.on(Events.Error,e=>console.error('[discord]',e));
await client.login(process.env.DISCORD_TOKEN);
