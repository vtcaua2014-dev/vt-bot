import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { randomBytes } from 'node:crypto';
const profiles=[
 ['Gato',['animal','felino','domestico']],['Cachorro',['animal','domestico']],['Golfinho',['animal','aquatico']],['Pinguim',['animal','ave','aquatico']],
 ['Leão',['animal','felino']],['Tubarão',['animal','aquatico']],['Águia',['animal','ave','voa']],['Borboleta',['animal','voa']],
 ['Albert Einstein',['real','ciencia','historico']],['Marie Curie',['real','ciencia','historico']],['Charles Darwin',['real','ciencia','historico']],
 ['Cleópatra',['real','historico','governante']],['Leonardo da Vinci',['real','arte','historico']],['William Shakespeare',['real','arte','historico']],
 ['Astronauta',['profissao','ciencia']],['Médico',['profissao','ciencia']],['Professor',['profissao']],['Bombeiro',['profissao']],
 ['Dragão',['fantasia','voa']],['Unicórnio',['fantasia','animal']],['Robô',['fantasia','tecnologia']],['Sereia',['fantasia','aquatico']],
 ['Pirata',['fantasia','aventureiro']],['Fada',['fantasia','voa']],['Bruxa',['fantasia','magia']],['Mago',['fantasia','magia']]
];
const questions=[['É um ser vivo animal?','animal'],['É uma pessoa real?','real'],['É um personagem fantástico?','fantasia'],['É conhecido pela ciência?','ciencia'],['É um ser aquático?','aquatico'],['Pode voar?','voa'],['É associado à arte?','arte'],['É uma profissão?','profissao'],['É uma figura histórica?','historico'],['É um animal doméstico?','domestico'],['É um felino?','felino'],['É uma ave?','ave'],['Tem relação com tecnologia?','tecnologia'],['Tem poderes mágicos?','magia'],['É um governante?','governante'],['Está associado a aventuras?','aventureiro']];
const sessions=new Map();
function chooseQuestion(s){
  const unasked=questions.filter(x=>!s.asked.includes(x[1]));
  if(!unasked.length)return null;
  // Especificamente a divisão dos candidatos para não fazer perguntas irrelevantes.
  return unasked.sort((a,b)=>Math.abs(s.candidates.filter(c=>c[1].includes(a[1])).length-s.candidates.length/2)-Math.abs(s.candidates.filter(c=>c[1].includes(b[1])).length-s.candidates.length/2))[0];
}
function render(s){
  const q=chooseQuestion(s);
  if(!q || s.asked.length>=12 || s.candidates.length===1){
    const guess=s.candidates[0]?.[0]||'Não consegui identificar';
    s.finished=true;return {content:`**Vt4Fun • Adivinhador**\nMeu palpite é: **${guess}**!\nReinicie com /adivinhador.`,components:[]};
  }
  s.current=q;
  return {content:`**Vt4Fun • Adivinhador**\nPense em um animal, personalidade, profissão ou personagem de fantasia.\nPergunta ${s.asked.length+1}/12: **${q[0]}**\nCandidatos possíveis: ${s.candidates.length}`,components:[new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`akin:${s.id}:yes`).setLabel('Sim').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`akin:${s.id}:no`).setLabel('Não').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`akin:${s.id}:maybe`).setLabel('Não sei').setStyle(ButtonStyle.Secondary)
  )]};
}
export async function startAkinator(interaction){
  const id=randomBytes(4).toString('hex'),s={id,owner:interaction.user.id,candidates:profiles,asked:[],finished:false,updated:Date.now()};sessions.set(id,s);await interaction.reply(render(s));
}
export async function akinComponent(interaction){
  const [,id,answer]=interaction.customId.split(':');const s=sessions.get(id);
  if(!s||s.finished||Date.now()-s.updated>30*60_000)return interaction.reply({content:'Esta sessão terminou.',ephemeral:true});
  if(s.owner!==interaction.user.id)return interaction.reply({content:'Somente quem iniciou pode responder.',ephemeral:true});
  const trait=s.current[1];s.asked.push(trait);
  if(answer==='yes'||answer==='no'){
    const filtered=s.candidates.filter(c=>c[1].includes(trait)===(answer==='yes'));
    if(filtered.length)s.candidates=filtered;
  }
  s.updated=Date.now();await interaction.update(render(s));
}
