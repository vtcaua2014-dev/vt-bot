import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { addSticker, stickerCount, storedAlbumPage, storeAlbumPage } from './data.js';

// Imagens/animacões pesquisadas em um repositório de trabalhos existentes, não geradas por IA.
// Os metadados e termos de licenciamento devem ser preservados por quem redistribuir as imagens.
const themes = [
 { name:'Esportes', search:['photograph olympic athletics sport','football stadium sport','tennis players match'], gif:'sports animation gif' },
 { name:'Cinema e filmes', search:['film camera movie set photograph','vintage cinema movie theater photograph','silent film Charlie Chaplin'], gif:'cinema film gif' },
 { name:'Personagens e desenhos', search:['public domain cartoon character drawing','historical cartoon drawing animation','comic strip public domain character'], gif:'public domain animated cartoon gif' },
 { name:'Educativas e culturais', search:['museum historic art painting public domain','scientific educational illustration','historic monument cultural heritage'], gif:'astronomy science animated gif' },
 { name:'Animais', search:['wildlife animal photography','bird animal nature closeup','marine animal photography'], gif:'animal animated gif' }
];
const cached = new Map();
function stripHTML(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,140);}
function accepted(m){
  const title=m.title||''; const license=String(m.license||'');
  if(/\b(ai.generated|midjourney|stable diffusion|dall.e|comfyui|generative ai)\b/i.test(title+' '+m.description))return false;
  if(!/^(CC0|CC BY|CC-BY|PD-|Public domain|PDM|CC-BY|CC-SA|CC BY-SA)/i.test(license))return false;
  if(!/^image\/(png|jpeg|gif|webp)$/i.test(m.mime||''))return false;
  if((m.width||0)<250 || (m.height||0)<150)return false;
  return true;
}
async function searchCommons(query,limit=50){
  const p=new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:String(limit),prop:'imageinfo',iiprop:'url|extmetadata|mime|size',iiurlwidth:'480'});
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
  try {
    const res=await fetch(`https://commons.wikimedia.org/w/api.php?${p}`,{signal:ctrl.signal,headers:{'User-Agent':'Vt4FunBot/0.1 (Discord album with attribution; educational use)'}});
    if(!res.ok)throw new Error(`Commons HTTP ${res.status}`);
    const json=await res.json();return (json.query?.pages||[]).flatMap(p=>{
      const inf=p.imageinfo?.[0],m=inf?.extmetadata||{};
      if(!inf)return [];
      const obj={title:p.title,license:stripHTML(m.LicenseShortName?.value),author:stripHTML(m.Artist?.value)||'Autor não informado',description:stripHTML(m.ImageDescription?.value),url:inf.url,thumb:inf.thumburl||inf.url,mime:inf.mime,width:inf.width,height:inf.height,source:inf.descriptionurl||`https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g,'_'))}`};
      return accepted(obj)?[obj]:[];
    });
  }finally{clearTimeout(timer);}
}
export async function album(page){
  const key=Number(page);
  if(!Number.isInteger(key)||key<1||key>5)throw new Error('Página inválida.');
  const persisted=storedAlbumPage(key); if(persisted?.length===10)return persisted;
  if(cached.has(key))return cached.get(key).items;
  const theme=themes[key-1],items=[],seen=new Set();
  const used=new Set([1,2,3,4,5].filter(n=>n!==key).flatMap(n=>(storedAlbumPage(n)||[]).map(x=>x.title)));
  for(const query of [theme.gif,...theme.search]){
    try {const arr=await searchCommons(query);const gifs=arr.filter(x=>x.mime==='image/gif');const still=arr.filter(x=>x.mime!=='image/gif');
      const wanted=query===theme.gif?[...gifs,...still]:[...still,...gifs];
      for(const it of wanted)if(!seen.has(it.title)&&!used.has(it.title)){items.push(it);seen.add(it.title);if(items.length===10)break;}
    }catch(err){console.warn('[commons]',query,err.message);}
    if(items.length===10)break;
  }
  if(items.length<10)throw new Error(`O Wikimedia Commons retornou ${items.length}/10 mídias licenciadas para esta página; tente novamente depois.`);
  cached.set(key,{time:Date.now(),items}); storeAlbumPage(key,items); return items;
}
export async function albumMessage(page,userId){
  const items=await album(page),theme=themes[page-1];
  const embeds=items.map((item,i)=>new EmbedBuilder()
    .setTitle(`${(page-1)*10+i+1}. ${item.title.replace(/^File:/,'').slice(0,160)}`)
    .setURL(item.source)
    .setDescription(`**${theme.name}** • ${item.mime==='image/gif'?'GIF':'Imagem'} • ${item.license}\nAutor: ${item.author}`.slice(0,400))
    .setImage(item.mime==='image/gif'?item.url:item.thumb)
    .setColor(0x5865F2));
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`album:${userId}:${page-1}`).setLabel('Anterior').setStyle(ButtonStyle.Secondary).setDisabled(page===1),
    new ButtonBuilder().setCustomId(`album:${userId}:${page+1}`).setLabel('Próxima').setStyle(ButtonStyle.Primary).setDisabled(page===5),
    new ButtonBuilder().setCustomId(`album:${userId}:save:${page}`).setLabel('Colecionar página').setStyle(ButtonStyle.Success)
  );
  return {content:`**Vt4Fun • Álbum de figurinhas • Página ${page}/5**\n${theme.name} • 10 figurinhas de obras existentes. Clique no título de cada imagem para ver a fonte, autor e licença. Colecionadas: ${stickerCount(userId)}/50.`,embeds,components:[row],allowedMentions:{parse:[]}};
}
export async function albumComponent(interaction){
  const [,owner,pageOrAction,index]=interaction.customId.split(':');
  if(owner!==interaction.user.id)return interaction.reply({content:'Este álbum pertence a outra pessoa. Use /album.',ephemeral:true});
  if(pageOrAction==='save'){
    const page=Number(index),items=await album(page);
    for(let i=0;i<items.length;i++)addSticker(owner,`${page}-${i}`);
    return interaction.reply({content:`Você colecionou as 10 figurinhas da página ${page}! Total: ${stickerCount(owner)}/50.`,ephemeral:true});
  }
  const page=Number(pageOrAction);
  await interaction.deferUpdate();
  const data=await albumMessage(page,owner);
  await interaction.editReply(data);
}
