import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, RoleSelectMenuBuilder } from 'discord.js';
import { GAMES, launchGame } from './games.js';
import { LANGUAGES, t } from './i18n.js';
import { guildSettings, updateGuild, daily, balance, debit, credit, leaderboard, transfer } from './data.js';
import { albumMessage } from './media.js';
import { askAI, clearHistory, textParts } from './ai.js';
import { startAkinator } from './akinator.js';
import { rnd } from './game-utils.js';

const userCmd=(name,description)=>new SlashCommandBuilder().setName(name).setDescription(description).setIntegrationTypes(0,1).setContexts(0,1,2);
const adminCmd=(name,description)=>new SlashCommandBuilder().setName(name).setDescription(description).setIntegrationTypes(0).setContexts(0).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
const choices=GAMES.map(([value,name])=>({name,value}));
const langChoices=Object.entries(LANGUAGES).map(([value,name])=>({name,value}));
const enabledChoices=[{name:'Ativado',value:'on'},{name:'Desativado',value:'off'}];
const roleplayKinds=[{name:'Abraçar',value:'hug'},{name:'Beijar',value:'kiss'},{name:'Dar tapa',value:'slap'},{name:'Acenar',value:'wave'},{name:'Dançar',value:'dance'},{name:'High five',value:'highfive'},{name:'Carinho',value:'pat'},{name:'Cumprimentar',value:'greet'}];

export const commands=[
  userCmd('ajuda','Mostra os recursos e comandos do Vt4Fun'),
  userCmd('jogo','Inicia um dos 25 minijogos').addStringOption(o=>o.setName('nome').setDescription('Qual jogo?').setRequired(true).addChoices(...choices)).addUserOption(o=>o.setName('oponente').setDescription('Adversário opcional')).addIntegerOption(o=>o.setName('aposta').setDescription('Funcoins fictícias (jogos de sorte)').setMinValue(1).setMaxValue(1000)),
  userCmd('quiz','Inicia um quiz de conhecimentos gerais'),
  userCmd('daily','Recebe 150 Funcoins uma vez por dia UTC'),
  userCmd('saldo','Mostra seu saldo fictício ou de outra pessoa').addUserOption(o=>o.setName('usuario').setDescription('Pessoa opcional')),
  userCmd('ranking','Mostra o ranking global de Funcoins'),
  userCmd('pagar','Transfere Funcoins fictícias').addUserOption(o=>o.setName('usuario').setDescription('Para quem enviar').setRequired(true)).addIntegerOption(o=>o.setName('valor').setDescription('Quantidade de Funcoins').setRequired(true).setMinValue(1).setMaxValue(10000)),
  userCmd('roleplay','Interações divertidas').addStringOption(o=>o.setName('tipo').setDescription('Interação').setRequired(true).addChoices(...roleplayKinds)).addUserOption(o=>o.setName('alvo').setDescription('Pessoa-alvo').setRequired(true)),
  userCmd('slap','Dá um tapa fictício em alguém').addUserOption(o=>o.setName('alvo').setDescription('Alvo').setRequired(true)),
  userCmd('kiss','Envia um beijo de brincadeira').addUserOption(o=>o.setName('alvo').setDescription('Alvo').setRequired(true)),
  userCmd('ship','Calcula a compatibilidade fictícia entre duas pessoas').addUserOption(o=>o.setName('pessoa1').setDescription('Primeira pessoa').setRequired(true)).addUserOption(o=>o.setName('pessoa2').setDescription('Segunda pessoa')),
  userCmd('gaydar','Radar arco-íris aleatório, somente por diversão').addUserOption(o=>o.setName('alvo').setDescription('Participante opcional')),
  userCmd('album','Mostra um álbum de 5 páginas com 10 figurinhas por página').addIntegerOption(o=>o.setName('pagina').setDescription('Página 1 a 5').setMinValue(1).setMaxValue(5)),
  userCmd('adivinhador','Jogo de adivinhação com perguntas de sim/não'),
  userCmd('ia','Conversa com a Luna via Ollama').addSubcommand(o=>o.setName('perguntar').setDescription('Pergunta ao assistente').addStringOption(p=>p.setName('texto').setDescription('Sua pergunta').setRequired(true).setMaxLength(2000))).addSubcommand(o=>o.setName('limpar').setDescription('Limpa seu histórico temporário')),
  userCmd('gartic','Jogo de desenho: mostre um desenho e os outros tentam adivinhar').addSubcommand(o=>o.setName('iniciar').setDescription('Inicia uma partida (canal de servidor)')).addSubcommand(o=>o.setName('desenhar').setDescription('Anexa o desenho, feito por você').addAttachmentOption(p=>p.setName('imagem').setDescription('PNG/JPG/WebP do desenho').setRequired(true))).addSubcommand(o=>o.setName('palpite').setDescription('Tente adivinhar o que está desenhado').addStringOption(p=>p.setName('texto').setDescription('Sua resposta').setRequired(true))).addSubcommand(o=>o.setName('encerrar').setDescription('Encerra sua partida')),
  adminCmd('painel','Envia o painel administrativo do bot ao canal atual'),
  adminCmd('config','Altera opções do servidor').addSubcommand(o=>o.setName('idioma').setDescription('Muda o idioma').addStringOption(p=>p.setName('valor').setDescription('Idioma').setRequired(true).addChoices(...langChoices))).addSubcommand(o=>o.setName('ia').setDescription('Ativa/desativa IA automática').addStringOption(p=>p.setName('valor').setDescription('Estado').setRequired(true).addChoices(...enabledChoices))).addSubcommand(o=>o.setName('jogos').setDescription('Ativa/desativa jogos').addStringOption(p=>p.setName('valor').setDescription('Estado').setRequired(true).addChoices(...enabledChoices))).addSubcommand(o=>o.setName('roleplay').setDescription('Ativa/desativa roleplay').addStringOption(p=>p.setName('valor').setDescription('Estado').setRequired(true).addChoices(...enabledChoices))).addSubcommand(o=>o.setName('cargo').setDescription('Cargo autorizado a ativar respostas da IA com menção').addRoleOption(p=>p.setName('valor').setDescription('Cargo exclusivo da IA').setRequired(true))).addSubcommand(o=>o.setName('remover_cargo').setDescription('Desativa menção de cargo para IA'))
].map(c=>c.toJSON());

export function panelPayload(guildId){
  const g=guildSettings(guildId),lang=g.language;
  const embed=new EmbedBuilder().setColor(0x5865f2).setTitle(t(lang,'title'))
    .setDescription(`${t(lang,'intro')}\n\n**${t(lang,'lang')}:** ${LANGUAGES[lang]||LANGUAGES.pt}\n**${t(lang,'ai')}:** ${g.aiEnabled?t(lang,'enabled'):t(lang,'disabled')}\n**${t(lang,'games')}:** ${g.gamesEnabled?t(lang,'enabled'):t(lang,'disabled')}\n**${t(lang,'role')}:** ${g.roleplayEnabled?t(lang,'enabled'):t(lang,'disabled')}\n**Cargo da IA:** ${g.aiRoleId?`<@&${g.aiRoleId}>`:'Apenas menção direta ao bot'}\n\nOs botões só funcionam para membros com **Gerenciar Servidor**.`)
    .setFooter({text:'Vt4Fun • Configuração independente por servidor'});
  const langs=new StringSelectMenuBuilder().setCustomId('cfg:lang').setPlaceholder('Selecione o idioma / Select language').addOptions(Object.entries(LANGUAGES).map(([value,label])=>({label,value,default:value===lang})));
  const role=new RoleSelectMenuBuilder().setCustomId('cfg:role').setPlaceholder('Definir cargo que chama a IA');
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('cfg:ai').setLabel('IA on/off').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('cfg:games').setLabel('Jogos on/off').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('cfg:roleplay').setLabel('Roleplay on/off').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('cfg:clearrole').setLabel('Remover cargo IA').setStyle(ButtonStyle.Secondary)
  );
  return {embeds:[embed],components:[new ActionRowBuilder().addComponents(langs),new ActionRowBuilder().addComponents(role),row],allowedMentions:{parse:[]}};
}
export async function configComponent(interaction){
  if(!interaction.inGuild()||!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))return interaction.reply({content:'Requer Gerenciar Servidor.',ephemeral:true});
  const act=interaction.customId.split(':')[1],g=guildSettings(interaction.guildId),patch={};
  if(act==='lang')patch.language=interaction.values[0];
  else if(act==='role'){const roleId=interaction.values[0];if(roleId===interaction.guildId)return interaction.reply({content:'@everyone não pode ser selecionado.',ephemeral:true});patch.aiRoleId=roleId;}
  else if(act==='clearrole')patch.aiRoleId=null;
  else if(act==='ai')patch.aiEnabled=!g.aiEnabled;
  else if(act==='games')patch.gamesEnabled=!g.gamesEnabled;
  else if(act==='roleplay')patch.roleplayEnabled=!g.roleplayEnabled;
  else return interaction.reply({content:'Ação desconhecida.',ephemeral:true});
  updateGuild(interaction.guildId,patch);
  await interaction.update(panelPayload(interaction.guildId));
}
export async function postWelcomePanel(guild){
  if(guildSettings(guild.id).welcomePosted)return;
  const community=guild.features.includes('COMMUNITY');
  const channels=guild.channels.cache.filter(c=>c.type===ChannelType.GuildText&&c.permissionsFor(guild.members.me)?.has([PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.EmbedLinks]));
  const arr=[...channels.values()];
  const restrict=/moderator.only|mod.only|staff|admin|moderador|equipe/i;
  let target;
  if(community)target=arr.find(c=>restrict.test(c.name)); // nunca joga configuração administrativa num canal público por acidente
  else target=arr.find(c=>/^(chat|geral|general|conversa)$/i.test(c.name))||arr.find(c=>!restrict.test(c.name)&&!/logs?|regras|rules|anuncio|welcome/i.test(c.name));
  if(!target){console.info(`[setup] ${guild.id}: canal apropriado não encontrado. Administrador pode usar /painel.`);return;}
  try{await target.send(panelPayload(guild.id));updateGuild(guild.id,{welcomePosted:true});}catch(e){console.error('[painel entrada]',e.message);}
}
const roleActions={hug:'deu um abraço em',kiss:'mandou um beijo para',slap:'deu um tapa de brincadeira em',wave:'acenou para',dance:'dançou com',highfive:'fez um high five com',pat:'fez carinho em',greet:'cumprimentou'};
const drawings=['gato','bicicleta','sol','foguete','piano','arvore','cachorro','montanha','bolo','navio','telefone','elefante','aviao','chave','pirata','computador','passaro'];
const gartic=new Map();
function norm(t){return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function stablePercent(a,b,salt=''){const text=[a,b].sort().join(':')+salt;let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0)%101;}
const ephemeral=(content)=>({content,ephemeral:true,allowedMentions:{parse:[]}});

export async function executeCommand(interaction){
  const cmd=interaction.commandName,uid=interaction.user.id,gs=interaction.guildId?guildSettings(interaction.guildId):null;
  if(cmd==='ajuda')return interaction.reply(ephemeral(`**Vt4Fun — Central de diversão**\n/jogo — 25 minijogos por botões\n/quiz — trivia\n/gartic — desenhe e adivinhe\n/adivinhador — perguntas e palpites\n/daily, /saldo, /ranking, /pagar — Funcoins\n/roleplay, /slap, /kiss, /ship, /gaydar — interações\n/album — 5 páginas, 50 figurinhas de mídia existente\n/ia perguntar — Luna 1.5X (Ollama)\n/painel e /config — administração\n\nFuncoins são fictícias: sem depósito, saque ou prêmio de valor real.`));
  if(cmd==='jogo'||cmd==='quiz'){
    if(gs&&!gs.gamesEnabled)return interaction.reply(ephemeral('Jogos desativados neste servidor.'));
    const type=cmd==='quiz'?'trivia':interaction.options.getString('nome');
    const opp=cmd==='jogo'?interaction.options.getUser('oponente'):null;
    if(opp?.bot)return interaction.reply(ephemeral('Escolha uma pessoa ou jogue contra o bot padrão.'));
    return launchGame(interaction,type,opp?.id,cmd==='jogo'?(interaction.options.getInteger('aposta')||0):0);
  }
  if(cmd==='daily'){const x=daily(uid);return interaction.reply(ephemeral(x.ok?`Você recebeu **${x.amount} Funcoins**! Saldo: **${x.coins}**.`:`Você já resgatou hoje (UTC). Saldo: **${x.coins}**.`));}
  if(cmd==='saldo'){const user=interaction.options.getUser('usuario')||interaction.user;return interaction.reply(ephemeral(`Saldo de ${user.username}: **${balance(user.id)} Funcoins**.`));}
  if(cmd==='ranking'){const rows=leaderboard();return interaction.reply(ephemeral(`**Ranking global — Funcoins**\n${rows.map(([id,v],i)=>`${i+1}. <@${id}> — ${v.coins} moedas • ${v.wins} vitórias`).join('\n')||'Nenhum jogador ainda.'}`));}
  if(cmd==='pagar'){
    const to=interaction.options.getUser('usuario'),n=interaction.options.getInteger('valor');
    if(to.bot||to.id===uid)return interaction.reply(ephemeral('Escolha outra pessoa não-bot.'));
    if(!transfer(uid,to.id,n))return interaction.reply(ephemeral('Funcoins insuficientes ou transferência inválida.'));
    return interaction.reply(ephemeral(`Você transferiu ${n} Funcoins para ${to.username}.`));
  }
  if(['roleplay','kiss','slap'].includes(cmd)){
    if(gs&&!gs.roleplayEnabled)return interaction.reply(ephemeral('Interações desativadas neste servidor.'));
    const action=cmd==='roleplay'?interaction.options.getString('tipo'):cmd,who=interaction.options.getUser('alvo');
    return interaction.reply({content:`**${interaction.user.username}** ${roleActions[action]} **${who.username}**! ${action==='kiss'?'💖':action==='slap'?'💥':'✨'}`,allowedMentions:{parse:[]}});
  }
  if(cmd==='ship'){
    const a=interaction.options.getUser('pessoa1'),b=interaction.options.getUser('pessoa2')||interaction.user;
    const v=stablePercent(a.id,b.id,'vt4fun-ship');return interaction.reply({content:`**Ship fictício:** ${a.username} + ${b.username} = **${v}%** de compatibilidade!\n*(Valor de brincadeira, sem significado real.)*`,allowedMentions:{parse:[]}});
  }
  if(cmd==='gaydar'){
    const a=interaction.options.getUser('alvo')||interaction.user,v=rnd(101);
    return interaction.reply({content:`**Radar arco-íris de ${a.username}: ${v}%**\nMedidor completamente aleatório de energia festiva. **Não mede nem infere orientação sexual.**`,allowedMentions:{parse:[]}});
  }
  if(cmd==='album'){
    const page=interaction.options.getInteger('pagina')||1;
    await interaction.deferReply();const data=await albumMessage(page,uid);return interaction.editReply(data);
  }
  if(cmd==='adivinhador')return startAkinator(interaction);
  if(cmd==='ia'){
    const sub=interaction.options.getSubcommand();if(sub==='limpar'){clearHistory(uid);return interaction.reply(ephemeral('Histórico temporário apagado.'));}
    if(gs&&!gs.aiEnabled)return interaction.reply(ephemeral('IA desativada neste servidor.'));
    await interaction.deferReply();try {const txt=await askAI(uid,interaction.channelId||'dm',interaction.options.getString('texto'),gs?.language||'pt');return interaction.editReply({content:textParts(txt)[0],allowedMentions:{parse:[]}});}catch(e){return interaction.editReply({content:`Luna indisponível: ${e.message}`.slice(0,1900)});}
  }
  if(cmd==='painel'){
    if(!interaction.inGuild())return interaction.reply(ephemeral('Disponível apenas em servidores.'));
    await interaction.reply(ephemeral('Painel enviado neste canal.'));
    return interaction.channel.send(panelPayload(interaction.guildId));
  }
  if(cmd==='config'){
    if(!interaction.inGuild()||!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))return interaction.reply(ephemeral('Permissão Gerenciar Servidor necessária.'));
    const sub=interaction.options.getSubcommand();let patch={};
    if(sub==='idioma')patch={language:interaction.options.getString('valor')};
    if(['ia','jogos','roleplay'].includes(sub))patch={ [sub==='ia'?'aiEnabled':sub==='jogos'?'gamesEnabled':'roleplayEnabled']:interaction.options.getString('valor')==='on' };
    if(sub==='cargo'){
      const role=interaction.options.getRole('valor');if(role.id===interaction.guildId)return interaction.reply(ephemeral('Não use @everyone.'));
      patch={aiRoleId:role.id};
    }
    if(sub==='remover_cargo')patch={aiRoleId:null};
    updateGuild(interaction.guildId,patch);return interaction.reply(ephemeral('Configuração salva. Use /painel para visualizar.'));
  }
  if(cmd==='gartic'){
    if(!interaction.inGuild())return interaction.reply(ephemeral('Gartic funciona apenas em canais de servidores.'));
    if(gs&&!gs.gamesEnabled)return interaction.reply(ephemeral('Jogos desativados.'));
    const sub=interaction.options.getSubcommand(),key=interaction.channelId,active=gartic.get(key);
    if(sub==='iniciar'){
      if(active)return interaction.reply(ephemeral('Já existe uma rodada neste canal.'));
      const answer=drawings[rnd(drawings.length)];gartic.set(key,{owner:uid,answer,start:Date.now(),image:null});
      await interaction.reply(ephemeral(`Você é o desenhista! Desenhe: **${answer}**. Use /gartic desenhar para enviar uma imagem, sem escrever a resposta publicamente.`));
      return interaction.channel.send({content:`**Gartic Vt4Fun** começou! Desenhista: <@${uid}>. Aguardando imagem...\nOs outros podem usar /gartic palpite.`,allowedMentions:{parse:[]}});
    }
    if(!active)return interaction.reply(ephemeral('Não há Gartic ativo. Use /gartic iniciar.'));
    if(sub==='desenhar'){
      if(uid!==active.owner)return interaction.reply(ephemeral('Apenas o desenhista pode enviar.'));
      const f=interaction.options.getAttachment('imagem');
      if(!['image/png','image/jpeg','image/webp','image/gif'].includes(f.contentType))return interaction.reply(ephemeral('Envie PNG, JPG, WebP ou GIF.'));
      if(f.size>8*1024*1024)return interaction.reply(ephemeral('Imagem muito grande (máx. 8 MB).'));
      active.image=f.url;await interaction.reply(ephemeral('Desenho publicado!'));
      return interaction.channel.send({embeds:[new EmbedBuilder().setTitle('Gartic — descubra o desenho').setImage(f.url).setColor(0x5865f2)]});
    }
    if(sub==='palpite'){
      if(uid===active.owner)return interaction.reply(ephemeral('O desenhista não pode adivinhar.'));
      if(!active.image)return interaction.reply(ephemeral('O desenhista ainda não enviou a imagem.'));
      const guess=interaction.options.getString('texto');
      if(norm(guess)===norm(active.answer)){gartic.delete(key);credit(uid,80);record(uid,true);return interaction.reply({content:`**${interaction.user.username} acertou!** Resposta: ${active.answer}. +80 Funcoins!`,allowedMentions:{parse:[]}});}
      return interaction.reply(ephemeral('Ainda não! Tente novamente.'));
    }
    if(sub==='encerrar'){
      if(uid!==active.owner&&!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))return interaction.reply(ephemeral('Somente desenhista ou moderador.'));
      gartic.delete(key);return interaction.reply({content:`Rodada encerrada. A resposta era **${active.answer}**.`,allowedMentions:{parse:[]}});
    }
  }
}
