import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vt4fun-test-'));
process.env.DATA_PATH=path.join(dir,'db.json');
const { account, balance, daily, credit, debit, guildSettings, updateGuild, transfer, storeAlbumPage, storedAlbumPage } = await import('../src/data.js');
test('Saldo inicial e pagamento diário único',()=>{
 assert.equal(balance('alice'),250);const now=new Date('2026-11-20T08:00:00Z');
 assert.equal(daily('alice',now).ok,true);assert.equal(daily('alice',now).ok,false);assert.equal(balance('alice'),400);
 assert.equal(daily('alice',new Date('2026-11-21T00:00:00Z')).ok,true);
});
test('Apostas e transferências validam saldo',()=>{
 assert.equal(debit('alice',100),true);assert.equal(transfer('alice','bob',150),true);
 assert.equal(balance('bob'),400);assert.equal(transfer('bob','bob',10),false);
 assert.equal(debit('bob',100000),false);assert.equal(credit('alice',25),325);
});
test('Configurações por servidor e álbum persistem',()=>{
 assert.equal(guildSettings('servidor').language,'pt');assert.equal(guildSettings('servidor').welcomePosted,false);
 updateGuild('servidor',{language:'en',welcomePosted:true,desconhecida:'não'});
 assert.equal(guildSettings('servidor').language,'en');assert.equal(guildSettings('servidor').welcomePosted,true);
 assert.equal(account('alice').wins,0);
 storeAlbumPage(1,[{title:'File:Teste.jpg'}]);assert.equal(storedAlbumPage(1)[0].title,'File:Teste.jpg');
});
