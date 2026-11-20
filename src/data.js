import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATA_PATH || './data/db.json';
let db = { users: {}, guilds: {}, albumPages: {} };
try {
  if (fs.existsSync(dbPath)) {
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db = { users: parsed.users || {}, guilds: parsed.guilds || {}, albumPages: parsed.albumPages || {} };
  }
} catch (err) { throw new Error(`Falha ao carregar DB em ${dbPath}: ${err.message}`); }

function save() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const temp = `${dbPath}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(temp, dbPath);
}
export function account(id) {
  const key = String(id);
  if (!db.users[key]) { db.users[key] = { coins: 250, wins: 0, played: 0, lastDaily: '', stickers: [] }; save(); }
  return db.users[key];
}
export function balance(id) { return account(id).coins; }
export function debit(id, amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Quantia inválida');
  const a = account(id);
  if (a.coins < amount) return false;
  a.coins -= amount; save(); return true;
}
export function credit(id, amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100000) throw new Error('Quantia inválida');
  const a = account(id); a.coins += amount; save(); return a.coins;
}
export function record(id, won = false) { const a = account(id); a.played++; if (won) a.wins++; save(); }
export function daily(id, now = new Date()) {
  // O calendário diário é definido pela data UTC para impedir resgates repetidos.
  const today = now.toISOString().slice(0, 10);
  const a = account(id);
  if (a.lastDaily === today) return { ok: false, amount: 0, coins: a.coins };
  const amount = 150;
  a.lastDaily = today; a.coins += amount; save();
  return { ok: true, amount, coins: a.coins };
}
export function guildSettings(id) {
  const key = String(id);
  if (!db.guilds[key]) { db.guilds[key] = { language: 'pt', aiEnabled: true, aiRoleId: null, gamesEnabled: true, roleplayEnabled: true, welcomePosted: false }; save(); }
  return db.guilds[key];
}
export function updateGuild(id, patch) {
  const g = guildSettings(id);
  const allowed = ['language','aiEnabled','aiRoleId','gamesEnabled','roleplayEnabled','welcomePosted'];
  for (const key of allowed) if (Object.hasOwn(patch, key)) g[key] = patch[key];
  save(); return g;
}
export function leaderboard() { return Object.entries(db.users).sort((a,b)=>b[1].coins-a[1].coins).slice(0,10); }
export function addSticker(id, stickerId) {
  const a = account(id);
  if (!a.stickers.includes(stickerId)) { a.stickers.push(stickerId); save(); }
  return a.stickers.length;
}
export function stickerCount(id) { return account(id).stickers.length; }

export function storedAlbumPage(page) { return db.albumPages[String(page)] || null; }
export function storeAlbumPage(page,items) { db.albumPages[String(page)] = items; save(); }
export function transfer(from,to,amount) {
  if(!Number.isSafeInteger(amount)||amount<1||amount>10000||String(from)===String(to))return false;
  const a=account(from),b=account(to);if(a.coins<amount)return false;
  a.coins-=amount;b.coins+=amount;save();return true;
}
