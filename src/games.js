import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { randomBytes } from 'node:crypto';
import { rnd, shuffle, ticWinner, connectWinner, cardValue, newDeck, pokerScore, pokerNames } from './game-utils.js';
import { debit, credit, record, balance } from './data.js';

export const GAMES = [
 ['velha','Jogo da Velha'],['forca','Forca'],['wordle','Wordle'],['trivia','Trivia'],['bandeiras','Quiz de Bandeiras'],['matematica','Matemática Rápida'],['memoria','Memória'],
 ['rpg','RPG de Masmorras'],['zumbis','Sobrevivência Zumbi'],['boss','Dungeon Boss'],['criaturas','Captura de Criaturas'],['pesca','Simulador de Pesca'],
 ['corrida','Corrida de Botões'],['reflexos','Duelo de Reflexos'],['arena','Arena PvP'],['battle','Battle Royale'],['penaltis','Futebol de Pênaltis'],
 ['blackjack','Blackjack'],['poker','Poker (5 cartas)'],['roleta','Roleta Virtual'],['slots','Caça-Níqueis'],['moeda','Cara ou Coroa'],['ppt','Pedra, Papel e Tesoura'],['minas','Campo Minado'],['connect4','Connect 4']
];
export const BET_GAMES = new Set(['blackjack','poker','roleta','slots','moeda']);
const games=new Map(); const startTimes=new Map();
const words=['LIVRO','PRAIA','NUVEM','CARRO','NOITE','PORTA','CAMPO','BRAVO','TERRA','FORMA','FESTA','SONHO','PEIXE','CORPO','FOLHA'];
const trivia=[
 ['Qual planeta é conhecido como Planeta Vermelho?',['Marte','Vênus','Saturno','Mercúrio'],0],
 ['Quanto é 9 × 7?',['56','63','72','81'],1],
 ['Qual oceano é o maior?',['Atlântico','Índico','Pacífico','Ártico'],2],
 ['Quem pintou a Mona Lisa?',['Picasso','Van Gogh','Da Vinci','Michelangelo'],2],
 ['Qual gás as plantas absorvem na fotossíntese?',['Oxigênio','CO₂','Hélio','Nitrogênio'],1],
 ['Qual é a capital do Japão?',['Osaka','Kyoto','Tóquio','Nara'],2],
 ['Qual é o símbolo químico da água?',['CO₂','H₂O','O₂','NaCl'],1],
 ['Qual animal é um mamífero?',['Tubarão','Golfinho','Pinguim','Sapo'],1],
 ['Quantos lados tem um hexágono?',['4','5','6','8'],2],
 ['Qual é o maior órgão do corpo humano?',['Coração','Pele','Fígado','Pulmão'],1]
];
const flags=[['🇧🇷','Brasil'],['🇯🇵','Japão'],['🇫🇷','França'],['🇩🇪','Alemanha'],['🇨🇦','Canadá'],['🇦🇷','Argentina'],['🇿🇦','África do Sul'],['🇰🇷','Coreia do Sul'],['🇮🇹','Itália'],['🇦🇺','Austrália']];
const creatures=['Lumarim','Petrova','Florabo','Cindel','Marutá','Ventisco'];
const casinoNames=['🍒','🍋','⭐','🔔','💎','🍀'];
const btn=(id,act,label,style=ButtonStyle.Secondary)=> new ButtonBuilder().setCustomId(`g:${id}:${act}`).setLabel(String(label).slice(0,80)).setStyle(style);
const actionRows=(id,items)=>{const rows=[];for(let i=0;i<items.length;i+=5) rows.push(new ActionRowBuilder().addComponents(items.slice(i,i+5).map(v=>btn(id,v[0],v[1],v[2]||ButtonStyle.Secondary))));return rows.slice(0,5);};
const ui=(s,description,items=[])=>({content:`**${GAMES.find(x=>x[0]===s.type)?.[1]}** • <@${s.owner}>${s.opponent?` vs <@${s.opponent}>`:''}\n${description}${s.note?`\n\n${s.note}`:''}${s.wager?`\nAposta fictícia: ${s.wager} Funcoins`:''}${s.done?'\n**Partida encerrada.**':''}`.slice(0,1900),components:s.done?[]:actionRows(s.id,items),allowedMentions:{parse:[]}});
const mark=(s,winningId=null,msg='')=>{
  if(s.done)return;
  s.done=true;s.note=msg;
  record(s.owner,winningId===s.owner);
  if(s.opponent)record(s.opponent,winningId===s.opponent);
  if(s.wager){ if(winningId)credit(winningId,s.wager*(s.multiplier||2)); else if(msg.includes('Empate'))credit(s.owner,s.wager); }
  else if(winningId && !String(winningId).startsWith('npc:')) credit(winningId, 30 + rnd(21));
};
const randomItem=a=>a[rnd(a.length)];
const boardGrid=(cells,w)=>cells.map((x,i)=>x+((i+1)%w?'':'\n')).join('');
const selectLetters=s=>{
  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(x=>!s.guessed.includes(x));
  const rows=[];
  for(let i=0;i<letters.length;i+=13){const options=letters.slice(i,i+13).map(x=>new StringSelectMenuOptionBuilder().setLabel(x).setValue(x));rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`g:${s.id}:letter`).setPlaceholder('Escolha uma letra').addOptions(options)));}
  return rows;
};
function setup(type,owner,opponent,wager){
  const s={id:randomBytes(5).toString('hex'),type,owner,opponent:opponent||null,created:Date.now(),updated:Date.now(),done:false,note:'',wager:wager||0};
  if(type==='velha')s.board=Array(9).fill(null),s.turn=owner;
  if(type==='connect4')s.board=Array(42).fill(null),s.turn=owner;
  if(type==='forca')s.answer=randomItem(words),s.guessed=[],s.mistakes=0;
  if(type==='wordle')s.answer=randomItem(words),s.guesses=[];
  if(['trivia','bandeiras','matematica'].includes(type))s.round=0,s.score=0,s.questions=shuffle(type==='trivia'?trivia:flags).slice(0,5);
  if(type==='matematica')setMath(s);
  if(type==='memoria')s.cards=shuffle('AABBCCDDEEFFGGHH'.split('')),s.matched=[],s.first=null,s.mismatch=[];
  if(type==='rpg')s.hp=100,s.floor=0,s.monster=0,s.potions=3;
  if(type==='zumbis')s.hp=100,s.wave=1,s.ammo=6,s.enemy=25,s.meds=2;
  if(type==='boss')s.hp=100,s.enemy=160,s.potions=2,s.shield=false;
  if(type==='criaturas')s.caught=[],s.current=randomItem(creatures),s.hp=80;
  if(type==='pesca')s.fishes=0,s.points=0;
  if(type==='corrida')s.clicks={ [owner]:0, ...(opponent?{[opponent]:0}:{'npc:bot':0}) };
  if(type==='reflexos')s.phase='waiting',s.readyAt=0;
  if(type==='arena')s.hp={[owner]:100,[opponent||'npc:bot']:100},s.turn=owner,s.shield={},s.potions={[owner]:2,[opponent||'npc:bot']:2};
  if(type==='battle')s.players=[owner],s.phase='lobby';
  if(type==='penaltis')s.round=0,s.goals=0;
  if(type==='blackjack'){s.deck=newDeck();s.hand=[s.deck.pop(),s.deck.pop()];s.dealer=[s.deck.pop(),s.deck.pop()];}
  if(type==='poker'){s.deck=newDeck();s.hand=Array.from({length:5},()=>s.deck.pop());s.dealer=Array.from({length:5},()=>s.deck.pop());s.redrawn=false;}
  if(type==='slots')s.symbols=null;
  if(type==='moeda')s.flip=null;
  if(type==='ppt')s.picks={};
  if(type==='minas')s.board=Array(16).fill(false),s.mines=[],s.firstClick=true;
  return s;
}
function setMath(s){s.a=2+rnd(20);s.b=2+rnd(20);s.op=randomItem(['+','-','×']);s.answerMath=s.op==='+'?s.a+s.b:s.op==='-'?s.a-s.b:s.a*s.b;s.deadline=Date.now()+25000;}
const rankCards=cards=>cards.map(c=>`${c.rank}${c.suit}`).join('  ');
function render(s){
  const i=s.id, t=s.type;
  if(t==='velha'){
    const icons=s.board.map(v=>v==='X'?'❌':v==='O'?'⭕':'·');
    const r=ui(s,`Vez: <@${s.turn}>\n${boardGrid(icons,3)}`,s.board.map((v,k)=>[`p${k}`,v||'·',ButtonStyle.Primary]));
    if(!s.done)r.components=Array.from({length:3},(_,j)=>new ActionRowBuilder().addComponents(...s.board.slice(j*3,j*3+3).map((v,k)=>btn(i,`p${j*3+k}`,v||'·',v?ButtonStyle.Secondary:ButtonStyle.Primary).setDisabled(!!v))));return r;
  }
  if(t==='connect4')return ui(s,`Vez: <@${s.turn}>\n${boardGrid(s.board.map(v=>v==='X'?'🔴':v==='O'?'🟡':'⚫'),7)}\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣`,Array.from({length:7},(_,k)=>[`c${k}`,String(k+1),ButtonStyle.Primary]));
  if(t==='forca'){
    const r=ui(s,`${s.answer.split('').map(c=>s.guessed.includes(c)?c:'_').join(' ')}\nErros: ${s.mistakes}/6\nLetras: ${s.guessed.join(', ')||'nenhuma'}`);
    if(!s.done)r.components=selectLetters(s);return r;
  }
  if(t==='wordle')return ui(s,`Adivinhe uma palavra de 5 letras (6 chances).\n${s.guesses.map(g=>g.guess+' — '+g.hint).join('\n')||'Ainda não há palpites.'}\nTentativas: ${s.guesses.length}/6`,[['open','Enviar palavra',ButtonStyle.Primary]]);
  if(t==='trivia'){
    if(s.done)return ui(s,`Pontuação: ${s.score}/5`);
    const q=s.questions[s.round];return ui(s,`Questão ${s.round+1}/5 • ${q[0]}\n${q[1].map((x,k)=>`${'ABCD'[k]}) ${x}`).join('\n')}\nAcertos: ${s.score}`,q[1].map((x,k)=>[`a${k}`,'ABCD'[k],ButtonStyle.Primary]));
  }
  if(t==='bandeiras'){
    if(s.done)return ui(s,`Acertos: ${s.score}/5`);
    const q=s.questions[s.round],options=shuffle([q[1],...shuffle(flags.filter(x=>x[1]!==q[1])).slice(0,3).map(x=>x[1])]);s.options ||= options;
    return ui(s,`Bandeira ${s.round+1}/5: ${q[0]}\nAcertos: ${s.score}`,s.options.map((x,k)=>[`a${k}`,x,ButtonStyle.Primary]));
  }
  if(t==='matematica')return ui(s,s.done?`Acertos: ${s.score}/5`:`Questão ${s.round+1}/5: **${s.a} ${s.op} ${s.b} = ?**\n25 segundos por conta • Acertos ${s.score}`,[['open','Responder',ButtonStyle.Primary]]);
  if(t==='memoria'){
    const cells=s.cards.map((v,k)=>s.matched.includes(k)||s.first===k||s.mismatch.includes(k)?v:'?');
    const r=ui(s,`Encontre os 8 pares. ${s.matched.length/2}/8 pares.\n${s.mismatch.length?'Não combinou! Escolha outra carta.':''}`);
    if(!s.done)r.components=Array.from({length:4},(_,j)=>new ActionRowBuilder().addComponents(...cells.slice(j*4,j*4+4).map((v,k)=>btn(i,`p${j*4+k}`,v,v==='?'?ButtonStyle.Primary:ButtonStyle.Success).setDisabled(s.matched.includes(j*4+k)))));return r;
  }
  if(t==='rpg')return ui(s,`Andar ${s.floor}/8 • ❤️ ${s.hp} • Inimigo: ${s.monster} HP • Poções: ${s.potions}`,s.monster>0?[['attack','Atacar',''],['heal','Poção',''],['flee','Fugir','']]:[['explore','Explorar',ButtonStyle.Primary],['heal','Poção',''],['flee','Sair','']]);
  if(t==='zumbis')return ui(s,`Onda ${s.wave}/5 • ❤️ ${s.hp} • Zumbi ${s.enemy} HP • Munição ${s.ammo}/6 • Kits ${s.meds}`,[['attack','Atirar',ButtonStyle.Danger],['reload','Recarregar',''],['heal','Kit médico',''],['flee','Desistir','']]);
  if(t==='boss')return ui(s,`❤️ Você: ${s.hp} • 👹 Boss: ${s.enemy} • Poções: ${s.potions}`,[['attack','Atacar',ButtonStyle.Danger],['defend','Defender',''],['heal','Curar','']]);
  if(t==='criaturas')return ui(s,`Criatura na área: **${s.current}** • ❤️ ${s.hp}\nCapturadas: ${s.caught.join(', ')||'nenhuma'} (${s.caught.length}/3)`,[['capture','Capturar',ButtonStyle.Success],['battle','Batalhar',ButtonStyle.Danger],['search','Procurar',''],['heal','Descansar','']]);
  if(t==='pesca')return ui(s,`Peixes ${s.fishes}/8 • Pontos de pesca: ${s.points}`,[['fish','Lançar linha',ButtonStyle.Primary],['stop','Encerrar','']]);
  if(t==='corrida')return ui(s,`Primeiro a 12 cliques vence!\n${Object.entries(s.clicks).map(([id,n])=>`${id.startsWith('npc:')?'Bot':`<@${id}>`}: ${'▰'.repeat(n)}${'▱'.repeat(12-n)} ${n}/12`).join('\n')}`,[['click','CORRER!',ButtonStyle.Success]]);
  if(t==='reflexos')return ui(s,`${s.phase==='waiting'?'Comece e espere o sinal. Apertar cedo faz perder.':s.phase==='ready'?'🟢 AGORA!':'🔴 ESPERE O VERDE!'}`,s.phase==='waiting'?[['start','Preparar',ButtonStyle.Primary]]:[['tap',s.phase==='ready'?'CLIQUE!':'Aguarde...',ButtonStyle.Danger]]);
  if(t==='arena')return ui(s,`${Object.entries(s.hp).map(([id,h])=>`${id==='npc:bot'?'Bot':`<@${id}>`}: ❤️ ${h}`).join('\n')}\nTurno: ${s.turn==='npc:bot'?'Bot':`<@${s.turn}>`}`,[['attack','Atacar',ButtonStyle.Danger],['defend','Defender',ButtonStyle.Primary],['heal','Curar',ButtonStyle.Success]]);
  if(t==='battle')return ui(s,s.phase==='lobby'?`Lobby: ${s.players.map(p=>`<@${p}>`).join(', ')}\nEntre antes de começar (máx. 8).`:`Restam ${s.players.length} competidores:\n${s.players.map(x=>x.startsWith('npc:')?'NPC':`<@${x}>`).join(' • ')}`,(s.phase==='lobby'?[['join','Participar',ButtonStyle.Success],['start','Começar',ButtonStyle.Primary]]:[['next','Próxima rodada',ButtonStyle.Danger]]));
  if(t==='penaltis')return ui(s,`Cobrança ${s.round+1}/5 • Gols ${s.goals}`,[['left','Esquerda',ButtonStyle.Primary],['center','Centro',ButtonStyle.Primary],['right','Direita',ButtonStyle.Primary]]);
  if(t==='blackjack')return ui(s,`Suas cartas: ${rankCards(s.hand)} = **${cardValue(s.hand)}**\nMesa: ${rankCards(s.done?s.dealer:s.dealer.slice(0,1))}${s.done?` = ${cardValue(s.dealer)}`:' + 🂠'}`, [['hit','Comprar',ButtonStyle.Primary],['stand','Parar',ButtonStyle.Success]]);
  if(t==='poker')return ui(s,`Sua mão: ${rankCards(s.hand)}\n${pokerNames[pokerScore(s.hand).category]}${s.done?`\nMesa: ${rankCards(s.dealer)} — ${pokerNames[pokerScore(s.dealer).category]}`:''}`,[['redraw','Trocar até 3',ButtonStyle.Primary],['stand','Comparar',ButtonStyle.Success]]);
  if(t==='roleta')return ui(s,'Escolha a cor da roleta europeia (0–36). Verde = 0.',[['red','Vermelho x2',ButtonStyle.Danger],['black','Preto x2',''],['green','Verde x14',ButtonStyle.Success]]);
  if(t==='slots')return ui(s,`Gire a máquina de símbolos. ${s.symbols?s.symbols.join(' '):'❔ ❔ ❔'}`,[['spin','Girar',ButtonStyle.Primary]]);
  if(t==='moeda')return ui(s,`Escolha cara ou coroa.`,[['cara','Cara',ButtonStyle.Primary],['coroa','Coroa',ButtonStyle.Primary]]);
  if(t==='ppt')return ui(s,'Escolha em segredo. Pedra, papel ou tesoura?',[['pedra','Pedra',''],['papel','Papel',''],['tesoura','Tesoura','']]);
  if(t==='minas'){
    const r=ui(s,`Campo 4×4 • ${s.board.filter(Boolean).length}/13 casas seguras reveladas. Evite as 3 minas.`);
    if(!s.done)r.components=Array.from({length:4},(_,j)=>new ActionRowBuilder().addComponents(...s.board.slice(j*4,j*4+4).map((revealed,k)=>{const idx=j*4+k,adj=s.mines.filter(m=>Math.abs(Math.floor(m/4)-Math.floor(idx/4))<=1&&Math.abs(m%4-idx%4)<=1).length;return btn(i,`p${idx}`,revealed?String(adj):'■',revealed?ButtonStyle.Success:ButtonStyle.Secondary).setDisabled(revealed);})));return r;
  }
  return ui(s,'Jogo disponível.');
}
export async function launchGame(interaction,type,opponentId=null,wager=0){
  if(!GAMES.some(x=>x[0]===type))return interaction.reply({content:'Jogo desconhecido.',ephemeral:true});
  if(opponentId===interaction.user.id)return interaction.reply({content:'Escolha outro jogador.',ephemeral:true});
  if(opponentId && ['trivia','bandeiras','matematica','forca','wordle','rpg','zumbis','boss','criaturas','pesca','reflexos','penaltis','blackjack','poker','roleta','slots','moeda','minas','memoria'].includes(type))opponentId=null;
  if(!BET_GAMES.has(type))wager=0;
  else if(!wager)wager=20;
  if(wager<0 || !Number.isSafeInteger(wager) || wager>1000)return interaction.reply({content:'Aposta inválida.',ephemeral:true});
  const cooldown=startTimes.get(interaction.user.id)||0;
  if(Date.now()-cooldown<1500)return interaction.reply({content:'Aguarde um instante.',ephemeral:true});
  if(wager && !debit(interaction.user.id,wager))return interaction.reply({content:`Funcoins insuficientes. Seu saldo: ${balance(interaction.user.id)}`,ephemeral:true});
  startTimes.set(interaction.user.id,Date.now());
  const s=setup(type,interaction.user.id,opponentId,wager);
  if(games.size>=500){for(const [id,v] of games){if(Date.now()-v.updated>40*60_000 || v.done)games.delete(id);if(games.size<400)break;}}
  games.set(s.id,s);
  try {await interaction.reply(render(s));} catch(err){games.delete(s.id);if(wager)credit(s.owner,wager);throw err;}
}
async function update(s,interaction){s.updated=Date.now();await interaction.update(render(s));}
async function openModal(s,interaction){
  const modal=new ModalBuilder().setCustomId(`g:${s.id}:guess`).setTitle(s.type==='wordle'?'Wordle':'Matemática Rápida');
  const input=new TextInputBuilder().setCustomId('answer').setLabel(s.type==='wordle'?'Palavra de 5 letras':'Resultado da conta').setRequired(true).setMinLength(1).setMaxLength(20).setStyle(TextInputStyle.Short);
  modal.addComponents(new ActionRowBuilder().addComponents(input));await interaction.showModal(modal);
}
function compute(s,action,actor,value){
  const t=s.type;s.note='';
  if(t==='velha'){
    if(actor!==s.turn)return 'Aguarde sua vez.';
    const k=Number(action.slice(1));if(!action.startsWith('p')||!Number.isInteger(k)||k<0||k>8||s.board[k])return 'Casa indisponível.';
    s.board[k]=actor===s.owner?'X':'O';let winner=ticWinner(s.board);
    if(!winner && !s.board.includes(null)){mark(s,null,'Empate.');return;}
    if(winner){mark(s,winner==='X'?s.owner:s.opponent||'npc:bot','Vitória no tabuleiro!');return;}
    s.turn=s.opponent?(actor===s.owner?s.opponent:s.owner):s.owner;
    if(!s.opponent){const empty=s.board.flatMap((x,i)=>x===null?[i]:[]),bot=empty.includes(4)?4:randomItem(empty);s.board[bot]='O';winner=ticWinner(s.board);if(winner)mark(s,'npc:bot','O bot venceu.');else if(!s.board.includes(null))mark(s,null,'Empate.');}
    return;
  }
  if(t==='connect4'){
    if(actor!==s.turn)return 'Aguarde sua vez.';
    const col=Number(action.slice(1));if(!action.startsWith('c')||col<0||col>6)return 'Coluna inválida.';
    const drop=(c,token)=>{for(let r=5;r>=0;r--)if(!s.board[r*7+c]){s.board[r*7+c]=token;return true;}return false;};
    if(!drop(col,actor===s.owner?'X':'O'))return 'Coluna cheia.';
    let win=connectWinner(s.board);if(win){mark(s,win==='X'?s.owner:s.opponent||'npc:bot','Quatro peças conectadas!');return;}
    if(s.board.every(Boolean)){mark(s,null,'Empate.');return;}
    s.turn=s.opponent?(actor===s.owner?s.opponent:s.owner):s.owner;
    if(!s.opponent){const valid=Array.from({length:7},(_,i)=>i).filter(c=>!s.board[c]);drop(randomItem(valid),'O');win=connectWinner(s.board);if(win)mark(s,'npc:bot','O bot conectou quatro!');else if(s.board.every(Boolean))mark(s,null,'Empate.');}
    return;
  }
  if(t==='forca'){
    if(action!=='letter'||!value||s.guessed.includes(value))return 'Escolha uma letra disponível.';
    s.guessed.push(value);if(!s.answer.includes(value))s.mistakes++;
    if(s.answer.split('').every(x=>s.guessed.includes(x)))mark(s,s.owner,`Você encontrou ${s.answer}!`);
    else if(s.mistakes>=6)mark(s,null,`A palavra era ${s.answer}.`);return;
  }
  if(t==='wordle'){
    if(action!=='guess')return 'Use Enviar palavra.';
    const guess=String(value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    if(!/^[A-Z]{5}$/.test(guess))return 'A palavra deve conter 5 letras.';
    const answer=s.answer.split(''),hint=Array(5).fill('⬛'),used=Array(5).fill(false);
    for(let i=0;i<5;i++)if(guess[i]===answer[i])hint[i]='🟩',used[i]=true;
    for(let i=0;i<5;i++)if(hint[i]==='⬛'){const k=answer.findIndex((c,j)=>!used[j]&&c===guess[i]);if(k!==-1){hint[i]='🟨';used[k]=true;}}
    s.guesses.push({guess,hint:hint.join('')});if(guess===s.answer)mark(s,s.owner,'Você acertou!');else if(s.guesses.length>=6)mark(s,null,`A palavra era ${s.answer}.`);return;
  }
  if(t==='trivia'||t==='bandeiras'){
    const k=Number(action.slice(1));if(!action.startsWith('a')||k<0||k>3)return 'Opção inválida.';
    const q=s.questions[s.round];const correct=t==='trivia'?k===q[2]:s.options[k]===q[1];if(correct)s.score++;
    s.note=correct?'Resposta correta!':'Resposta incorreta.';s.round++;s.options=null;
    if(s.round>=5)mark(s,s.score>=3?s.owner:null,`Você acertou ${s.score}/5.`);return;
  }
  if(t==='matematica'){
    if(action!=='guess')return 'Use Responder.';
    const correct=Date.now()<=s.deadline&&Number(value)===s.answerMath;if(correct)s.score++;
    s.note=correct?'Correto!':'Incorreto ou tempo esgotado.';s.round++;
    if(s.round>=5)mark(s,s.score>=3?s.owner:null,`Acertos: ${s.score}/5`);else setMath(s);return;
  }
  if(t==='memoria'){
    const k=Number(action.slice(1));if(!action.startsWith('p')||k<0||k>=16||s.matched.includes(k))return 'Carta inválida.';
    s.mismatch=[];if(s.first===null){s.first=k;return;}
    if(s.first===k)return 'Escolha outra carta.';
    if(s.cards[s.first]===s.cards[k]){s.matched.push(s.first,k);s.note='Par encontrado!';}else{s.mismatch=[s.first,k];s.note='Tente memorizar as duas cartas.';}
    s.first=null;if(s.matched.length===16)mark(s,s.owner,'Todas as cartas combinadas!');return;
  }
  if(t==='rpg'){
    if(action==='flee'){mark(s,null,'A aventura terminou.');return;}
    if(action==='heal'){if(!s.potions)return 'Sem poções!';s.potions--;s.hp=Math.min(100,s.hp+32);}
    else if(s.monster>0&&action==='attack'){s.monster-=14+rnd(20);if(s.monster<=0){s.monster=0;s.note='Monstro derrotado!';}}
    else if(s.monster===0&&action==='explore'){s.floor++;if(s.floor>=8){mark(s,s.owner,'Você encontrou a saída da masmorra!');return;}s.monster=20+s.floor*8+rnd(12);s.note=`Sala ${s.floor}: um monstro apareceu!`;}
    else return 'Ação indisponível.';
    if(s.monster>0){s.hp-=5+rnd(14);if(s.hp<=0)mark(s,null,'Você foi derrotado na masmorra.');}return;
  }
  if(t==='zumbis'){
    if(action==='flee'){mark(s,null,'Você deixou a zona de sobrevivência.');return;}
    if(action==='heal'){if(!s.meds)return 'Sem kits!';s.meds--;s.hp=Math.min(100,s.hp+35);}
    else if(action==='reload')s.ammo=6;
    else if(action==='attack'){if(!s.ammo)return 'Recarregue sua arma.';s.ammo--;s.enemy-=16+rnd(20);}
    else return 'Ação inválida.';
    if(s.enemy<=0){if(s.wave>=5){mark(s,s.owner,'Você resistiu a todas as ondas!');return;}s.wave++;s.enemy=25+s.wave*8;s.note='Onda concluída!';}
    else {s.hp-=4+rnd(13);if(s.hp<=0)mark(s,null,'Os zumbis venceram.');}return;
  }
  if(t==='boss'){
    if(action==='attack')s.enemy-=17+rnd(22);
    else if(action==='defend')s.shield=true;
    else if(action==='heal'){if(!s.potions)return 'Sem poções!';s.potions--;s.hp=Math.min(100,s.hp+33);}else return 'Ação inválida.';
    if(s.enemy<=0){mark(s,s.owner,'Chefe da masmorra derrotado!');return;}
    s.hp-=s.shield?2+rnd(5):9+rnd(15);s.shield=false;if(s.hp<=0)mark(s,null,'O chefe venceu.');return;
  }
  if(t==='criaturas'){
    if(action==='capture'){if(rnd(100)<53){if(!s.caught.includes(s.current))s.caught.push(s.current);s.note=`Você capturou ${s.current}!`;s.current=randomItem(creatures);}else{s.note='A criatura escapou!';s.hp-=5;}}
    else if(action==='battle'){s.hp-=5+rnd(13);s.note='Você treinou seu grupo e ganhou experiência!';}
    else if(action==='search')s.current=randomItem(creatures);
    else if(action==='heal')s.hp=Math.min(80,s.hp+25);
    else return 'Ação inválida.';
    if(s.caught.length>=3)mark(s,s.owner,'Você capturou três criaturas diferentes!');else if(s.hp<=0)mark(s,null,'Sua equipe precisa descansar.');return;
  }
  if(t==='pesca'){
    if(action==='stop'){mark(s,null,'Pescaria encerrada.');return;}
    if(action!=='fish')return 'Ação inválida.';
    const n=rnd(100);if(n<80){s.fishes++;s.points+=n<10?100:n<35?35:10;s.note=n<10?'Peixe lendário!':n<35?'Peixe raro!':'Peixe comum!';}else s.note='O peixe escapou!';
    if(s.fishes>=8)mark(s,s.owner,`Pescaria concluída com ${s.points} pontos!`);return;
  }
  if(t==='corrida'){
    if(action!=='click')return 'Ação inválida.';
    if(!Object.hasOwn(s.clicks,actor))return 'Você não participa desta corrida.';
    s.clicks[actor]=Math.min(12,s.clicks[actor]+1);
    if(!s.opponent)s.clicks['npc:bot']=Math.min(12,s.clicks['npc:bot']+rnd(2));
    if(s.clicks[actor]>=12)mark(s,actor,'Você ganhou a corrida!');else if(s.clicks['npc:bot']>=12)mark(s,'npc:bot','O bot venceu a corrida.');return;
  }
  if(t==='reflexos'){
    if(action==='start'&&s.phase==='waiting'){s.phase='red';s.readyAt=Date.now()+1500+rnd(3000);s.note='Prepare-se: não aperte antes do sinal!';return;}
    if(action!=='tap')return 'Ação inválida.';
    if(Date.now()<s.readyAt){mark(s,null,'Você clicou cedo demais!');return;}
    mark(s,s.owner,`Reflexo: ${Date.now()-s.readyAt}ms`);return;
  }
  if(t==='arena'){
    if(actor!==s.turn)return 'Aguarde seu turno.';
    const enemy=actor===s.owner?(s.opponent||'npc:bot'):s.owner;
    if(action==='attack'){const damage=s.shield[enemy]?Math.ceil((14+rnd(20))/2):14+rnd(20);s.hp[enemy]-=damage;s.shield[enemy]=false;s.note=`Dano: ${damage}`;}
    else if(action==='defend')s.shield[actor]=true;
    else if(action==='heal'){if(!s.potions[actor])return 'Sem cura!';s.potions[actor]--;s.hp[actor]=Math.min(100,s.hp[actor]+25);}else return 'Ação inválida.';
    if(s.hp[enemy]<=0){mark(s,actor,'Vitória na Arena PvP!');return;}
    s.turn=enemy;
    if(!s.opponent){const damage=s.shield[s.owner]?8:17+rnd(16);s.hp[s.owner]-=damage;s.shield[s.owner]=false;s.turn=s.owner;if(s.hp[s.owner]<=0)mark(s,'npc:bot','O bot venceu a arena.');}return;
  }
  if(t==='battle'){
    if(s.phase==='lobby'){
      if(action==='join'){if(s.players.includes(actor))return 'Você já está participando.';if(s.players.length>=8)return 'Lobby cheio.';s.players.push(actor);return;}
      if(action==='start'){if(actor!==s.owner)return 'Apenas o criador pode começar.';s.phase='running';if(s.players.length<2)s.players.push('npc:1','npc:2','npc:3');return;}
    }
    if(s.phase==='running'&&action==='next'){if(actor!==s.owner && !s.players.includes(actor))return 'Você não participa.';const out=rnd(s.players.length);const loser=s.players.splice(out,1)[0];s.note=`${loser.startsWith('npc:')?'NPC':`<@${loser}>`} foi eliminado!`;if(s.players.length===1)mark(s,s.players[0],'Último sobrevivente!');return;}
    return 'Ação indisponível.';
  }
  if(t==='penaltis'){
    if(!['left','center','right'].includes(action))return 'Escolha um canto.';
    const keeper=randomItem(['left','center','right']);const goal=action!==keeper;if(goal)s.goals++;
    s.round++;s.note=goal?'GOOOL!':'Defesa do goleiro!';if(s.round>=5)mark(s,s.goals>=3?s.owner:null,`Resultado: ${s.goals}/5 gols.`);return;
  }
  if(t==='blackjack'){
    if(action==='hit'){s.hand.push(s.deck.pop());if(cardValue(s.hand)>21){mark(s,null,'Estourou 21!');return;}}
    else if(action==='stand'){
      while(cardValue(s.dealer)<17)s.dealer.push(s.deck.pop());
      const a=cardValue(s.hand),b=cardValue(s.dealer);
      if(b>21||a>b)mark(s,s.owner,'Você venceu a mesa!');else if(a===b)mark(s,null,'Empate na mesa.');else mark(s,null,'A mesa venceu.');
    }else return 'Ação inválida.';return;
  }
  if(t==='poker'){
    if(action==='redraw'){if(s.redrawn)return 'Você já trocou cartas.';s.redrawn=true;s.hand=s.hand.map((c,k)=>k<3?s.deck.pop():c);s.note='Você trocou as 3 primeiras cartas.';}
    else if(action==='stand'){const a=pokerScore(s.hand).score,b=pokerScore(s.dealer).score;if(a>b)mark(s,s.owner,'Você venceu a rodada!');else if(a===b)mark(s,null,'Empate na mesa.');else mark(s,null,'A mesa venceu.');}
    else return 'Ação inválida.';return;
  }
  if(t==='roleta'){
    if(!['red','black','green'].includes(action))return 'Seleção inválida.';
    const n=rnd(37),color=n===0?'green':([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n)?'red':'black');
    s.multiplier=action==='green'?14:2;mark(s,action===color?s.owner:null,`Roleta: ${n} (${color}). ${action===color?'Você ganhou!':'Você perdeu.'}`);return;
  }
  if(t==='slots'){
    if(action!=='spin')return 'Ação inválida.';
    s.symbols=Array.from({length:3},()=>randomItem(casinoNames));const distinct=new Set(s.symbols).size;
    s.multiplier=distinct===1?5:distinct===2?2:0;mark(s,s.multiplier?s.owner:null,s.multiplier?`Prêmio x${s.multiplier}!`:'Sem combinação.');return;
  }
  if(t==='moeda'){
    if(!['cara','coroa'].includes(action))return 'Seleção inválida.';
    s.flip=randomItem(['cara','coroa']);mark(s,action===s.flip?s.owner:null,`Deu ${s.flip}.`);return;
  }
  if(t==='ppt'){
    if(!['pedra','papel','tesoura'].includes(action))return 'Escolha uma opção.';
    s.picks[actor]=action;const other=s.opponent||'npc:bot';if(!s.opponent)s.picks[other]=randomItem(['pedra','papel','tesoura']);
    if(!s.picks[s.owner]||!s.picks[other]){s.note='Escolha registrada. Aguardando adversário.';return;}
    const a=s.picks[s.owner],b=s.picks[other];if(a===b)mark(s,null,`Empate! Ambos escolheram ${a}.`);
    else mark(s,((a==='pedra'&&b==='tesoura')||(a==='papel'&&b==='pedra')||(a==='tesoura'&&b==='papel'))?s.owner:other,`Escolhas: ${a} vs ${b}.`);return;
  }
  if(t==='minas'){
    const k=Number(action.slice(1));if(!action.startsWith('p')||k<0||k>=16||s.board[k])return 'Casa inválida.';
    if(s.firstClick){s.firstClick=false;const eligible=shuffle(Array.from({length:16},(_,i)=>i).filter(i=>i!==k));s.mines=eligible.slice(0,3);}
    if(s.mines.includes(k)){mark(s,null,'BOOM! Você encontrou uma mina.');return;}
    s.board[k]=true;if(s.board.filter(Boolean).length===13)mark(s,s.owner,'Campo totalmente limpo!');return;
  }
  return 'Comando desconhecido.';
}
export async function gameComponent(interaction){
  const [,id,action]=interaction.customId.split(':');const s=games.get(id);
  if(!s||Date.now()-s.updated>40*60_000)return interaction.reply({content:'Esta partida expirou. Use /jogo novamente.',ephemeral:true});
  if(s.done)return interaction.reply({content:'A partida já terminou.',ephemeral:true});
  const actor=interaction.user.id;
  if(s.type!=='battle'&&!([s.owner,s.opponent].includes(actor)))return interaction.reply({content:'Você não participa desta partida.',ephemeral:true});
  if(s.type==='battle' && s.phase==='running' && !s.players.includes(actor) && actor!==s.owner)return interaction.reply({content:'Você não participa desta partida.',ephemeral:true});
  if(['wordle','matematica'].includes(s.type)&&action==='open')return openModal(s,interaction);
  if(s.type==='reflexos'&&s.phase==='red'&&Date.now()>=s.readyAt)s.phase='ready';
  const msg=compute(s,action,actor,interaction.isStringSelectMenu()?interaction.values[0]:null);
  if(msg)return interaction.reply({content:msg,ephemeral:true});
  await update(s,interaction);
  if(s.type==='reflexos'&&s.phase==='red'&&!s.done){const expected=s.readyAt;setTimeout(async()=>{if(!s.done&&s.readyAt===expected){s.phase='ready';try{await interaction.message.edit(render(s));}catch{}}},Math.max(100,expected-Date.now()));}
}
export async function gameModal(interaction){
  const [,id,action]=interaction.customId.split(':');const s=games.get(id);
  if(!s||s.done||Date.now()-s.updated>40*60_000)return interaction.reply({content:'Partida expirada.',ephemeral:true});
  if(s.owner!==interaction.user.id)return interaction.reply({content:'A partida é de outro jogador.',ephemeral:true});
  const value=interaction.fields.getTextInputValue('answer');
  const err=compute(s,action,s.owner,value);if(err)return interaction.reply({content:err,ephemeral:true});
  // Interações de modal não editam diretamente a mensagem que abriu o modal.
  const channel=interaction.channel;
  try {const msg=await channel?.messages.fetch(interaction.message?.id||s.messageId||'');if(msg)await msg.edit(render(s));}catch{}
  s.updated=Date.now();await interaction.reply({content:`Resposta recebida. ${s.note||'Confira o jogo acima.'}`,ephemeral:true});
}
export async function rememberGameMessage(interaction){
  const [,id]=interaction.customId.split(':'); const s=games.get(id);if(s&&interaction.message)s.messageId=interaction.message.id;
}
