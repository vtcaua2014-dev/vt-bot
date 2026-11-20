import { randomInt } from 'node:crypto';
export const rnd = n => randomInt(n);
export function shuffle(a) { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=rnd(i+1);[b[i],b[j]]=[b[j],b[i]];}return b; }
export function ticWinner(b) {
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const [a,c,d] of lines) if(b[a] && b[a]===b[c] && b[c]===b[d]) return b[a];
  return null;
}
export function connectWinner(b) {
  for(let r=0;r<6;r++) for(let c=0;c<7;c++) {
    const v=b[r*7+c]; if(!v) continue;
    for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
      if([1,2,3].every(k=> {const rr=r+dr*k,cc=c+dc*k; return rr>=0&&rr<6&&cc>=0&&cc<7&&b[rr*7+cc]===v;})) return v;
    }
  }
  return null;
}
export function cardValue(cards) {
  let total=cards.reduce((a,c)=>a+((c.rank==='A')?11:('JQK'.includes(c.rank)?10:Number(c.rank))),0);
  let aces=cards.filter(x=>x.rank==='A').length;
  while(total>21 && aces-->0) total-=10;
  return total;
}
export function newDeck() { return shuffle(['♠','♥','♦','♣'].flatMap(suit=>['A','2','3','4','5','6','7','8','9','10','J','Q','K'].map(rank=>({suit,rank})))); }
export function pokerScore(cards) {
  const nums=cards.map(c=> c.rank==='A'?14:c.rank==='K'?13:c.rank==='Q'?12:c.rank==='J'?11:Number(c.rank)).sort((a,b)=>b-a);
  const groups=[...new Set(nums)].map(n=>[nums.filter(v=>v===n).length,n]).sort((a,b)=>b[0]-a[0] || b[1]-a[1]);
  const flush=cards.every(c=>c.suit===cards[0].suit);
  const distinct=[...new Set(nums)];
  const straight=distinct.length===5 && (nums[0]-nums[4]===4 || JSON.stringify(nums)==='[14,5,4,3,2]');
  const hi=(nums[0]===14 && nums[1]===5 && straight)?5:nums[0];
  let category=0;
  if(straight && flush)category=8;
  else if(groups[0][0]===4)category=7;
  else if(groups[0][0]===3&&groups[1][0]===2)category=6;
  else if(flush)category=5;
  else if(straight)category=4;
  else if(groups[0][0]===3)category=3;
  else if(groups[0][0]===2&&groups[1][0]===2)category=2;
  else if(groups[0][0]===2)category=1;
  // Score numérico único; 15 > qualquer rank de carta.
  const tie=category===4||category===8?[hi]:groups.map(g=>g[1]);
  let score=category;
  for(let i=0;i<5;i++)score=score*15+(tie[i]||0);
  return { category, score };
}
export const pokerNames=['Carta alta','Par','Dois pares','Trinca','Sequência','Flush','Full house','Quadra','Straight flush'];
