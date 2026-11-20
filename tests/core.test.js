import test from 'node:test';
import assert from 'node:assert/strict';
import { ticWinner, connectWinner, cardValue, newDeck, pokerScore, shuffle } from '../src/game-utils.js';

test('Jogo da Velha detecta vitórias e empates',()=>{
  assert.equal(ticWinner(['X','X','X',null,null,null,null,null,null]),'X');
  assert.equal(ticWinner(['O','X',null,'X','O',null,null,null,'O']),'O');
  assert.equal(ticWinner(['X','O',null,null,'X','O','O',null,null]),null);
});
test('Connect 4 detecta sequências horizontal, vertical e diagonal',()=>{
  const a=Array(42).fill(null);for(let i=0;i<4;i++)a[5*7+i]='X';assert.equal(connectWinner(a),'X');
  const b=Array(42).fill(null);for(let i=0;i<4;i++)b[(5-i)*7+3]='O';assert.equal(connectWinner(b),'O');
  const c=Array(42).fill(null);for(let i=0;i<4;i++)c[(2+i)*7+i]='X';assert.equal(connectWinner(c),'X');
});
test('Blackjack trata As como 11 ou 1',()=>{
  assert.equal(cardValue([{rank:'A'},{rank:'9'}]),20);
  assert.equal(cardValue([{rank:'A'},{rank:'9'},{rank:'5'}]),15);
  assert.equal(cardValue([{rank:'A'},{rank:'A'},{rank:'9'}]),21);
});
test('Baralho 52 cartas exclusivas',()=>{const deck=newDeck();assert.equal(deck.length,52);assert.equal(new Set(deck.map(c=>c.suit+c.rank)).size,52);});
test('Poker classifica full house e straight flush',()=>{
 const full=[{rank:'9',suit:'♠'},{rank:'9',suit:'♥'},{rank:'9',suit:'♦'},{rank:'A',suit:'♠'},{rank:'A',suit:'♣'}];
 const straight=['2','3','4','5','6'].map(rank=>({rank,suit:'♥'}));
 assert.equal(pokerScore(full).category,6);assert.equal(pokerScore(straight).category,8);assert.ok(pokerScore(straight).score>pokerScore(full).score);
});
test('Embaralhar não perde elementos',()=>{assert.deepEqual(shuffle([1,2,3,4]).sort(),[1,2,3,4]);});
