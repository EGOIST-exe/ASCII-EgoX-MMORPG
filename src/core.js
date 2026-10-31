export const WORLD_SIZE = 192;
export const SEED = 71839;
export const VILLAGES = [{ x: 48, y: 70, name: 'Dorf Immerhain' }, { x: 141, y: 142, name: 'Dämmerwacht' }, { x: 68, y: 27, name: 'Frostwacht' }];
export const safeAt = (x, y) => VILLAGES.some(v => Math.hypot(x - v.x, y - v.y) < 14);
export const HOUSES = [[41, 63, 0], [54, 61, 1], [53, 80, 2], [136, 136, 0], [147, 138, 1], [62, 23, 0], [74, 24, 1]];
export const CLASSES = {
  mage: { name: 'Magier', title: 'Hüter des Arkanen', glyph: '*', color: '#a8a0e9', weapon: 'Eschenstab', hp: 85, mana: 140, damage: 16, range: 6, speed: 3.5, desc: 'Beherrsche die Elemente. Mächtige Fernzauber treffen deine Feinde, bevor sie dich erreichen.', skills: [
    { name: 'Arkanblitz', icon: '*', cost: 14, cd: 2, power: 1.7, range: 8 },
    { name: 'Frostnova', icon: '❄', cost: 25, cd: 7, power: 1.2, area: 4, slow: true },
    { name: 'Sternenregen', icon: '⁙', cost: 35, cd: 10, power: 2.5, area: 6 },
    { name: 'Seelenquell', icon: '+', cost: 30, cd: 15, heal: 45 },
    { name: 'Kettenblitz', icon: 'ϟ', cost: 30, cd: 8, power: 2, area: 7 },
    { name: 'Zeitriss', icon: '◇', cost: 32, cd: 12, power: 1.5, area: 8, slow: true }] },
  samurai: { name: 'Samurai', title: 'Die lautlose Klinge', glyph: '/', color: '#dcaaa0', weapon: 'Reisekatana', hp: 115, mana: 80, damage: 23, range: 2.4, speed: 4, desc: 'Ein Atemzug. Ein Schnitt. Verbinde schnelle Klingenhiebe mit präzisen, vernichtenden Techniken.', skills: [
    { name: 'Mondhieb', icon: '/', cost: 12, cd: 2, power: 1.8, area: 3 },
    { name: 'Windschritt', icon: '»', cost: 20, cd: 6, dash: 5, power: 1.3, area: 3 },
    { name: 'Klingensturm', icon: '╳', cost: 28, cd: 9, power: 2.4, area: 4 },
    { name: 'Meditation', icon: '+', cost: 20, cd: 15, heal: 40 },
    { name: 'Morgenröte', icon: '⌁', cost: 30, cd: 9, power: 3, area: 3 },
    { name: 'Schattenhieb', icon: '∠', cost: 24, cd: 7, power: 2.6, range: 5 }] },
  elf: { name: 'Elf', title: 'Stimme des Waldes', glyph: '}', color: '#b2cc8b', weapon: 'Weidenbogen', hp: 95, mana: 110, damage: 18, range: 8, speed: 4.2, desc: 'Folge den Pfaden der Alten. Dein Bogen und die Magie des Waldes bilden eine tödliche Verbindung.', skills: [
    { name: 'Dornenpfeil', icon: '➶', cost: 12, cd: 2, power: 1.8, range: 10 },
    { name: 'Wurzelfessel', icon: 'ψ', cost: 22, cd: 6, power: 1.3, area: 4, slow: true },
    { name: 'Pfeilhagel', icon: '⋮', cost: 30, cd: 9, power: 2.2, area: 6 },
    { name: 'Waldsegen', icon: '+', cost: 26, cd: 15, heal: 45 },
    { name: 'Geisterpfeil', icon: '→', cost: 25, cd: 7, power: 3, range: 12 },
    { name: 'Dornenring', icon: '♧', cost: 30, cd: 10, power: 2.2, area: 5 }] },
  paladin: { name: 'Paladin', title: 'Eid des Morgenlichts', glyph: '+', color: '#e2ce93', weapon: 'Eisenschwert', hp: 150, mana: 90, damage: 20, range: 2.6, speed: 3.3, desc: 'Sei das Licht in der Dunkelheit. Schütze deine Gefährten mit heiligen Eiden und schwerem Stahl.', skills: [
    { name: 'Lichthieb', icon: '†', cost: 14, cd: 2, power: 1.9, area: 3 },
    { name: 'Heiliger Eid', icon: '+', cost: 25, cd: 9, heal: 45 },
    { name: 'Sonnenzorn', icon: '☼', cost: 32, cd: 10, power: 2.5, area: 5 },
    { name: 'Bollwerk', icon: '♜', cost: 24, cd: 15, shield: 8 },
    { name: 'Urteil', icon: '‡', cost: 28, cd: 8, power: 3, range: 6 },
    { name: 'Weihe', icon: '⊕', cost: 30, cd: 12, power: 1.8, area: 6, heal: 25 }] }
};
export const MOB_TYPES = [
  { name: 'Slime', glyph: 'o', color: '#9fb95e', hp: 30, damage: 5, xp: 18, coins: 5, speed: 1.3 },
  { name: 'Skelett', glyph: 'S', color: '#d0c9b3', hp: 50, damage: 8, xp: 26, coins: 8, speed: 1.8 },
  { name: 'Zombie', glyph: 'Z', color: '#91a477', hp: 65, damage: 9, xp: 30, coins: 9, speed: 1.2 },
  { name: 'Bandit', glyph: 'b', color: '#cf9871', hp: 70, damage: 11, xp: 35, coins: 12, speed: 2.1 },
  { name: 'Ork', glyph: 'O', color: '#9baa66', hp: 100, damage: 14, xp: 45, coins: 16, speed: 1.6 },
  { name: 'Echsenmensch', glyph: 'L', color: '#75b7a5', hp: 85, damage: 12, xp: 40, coins: 14, speed: 2.2 }
];
export function hash(x, y, seed = SEED) { let n = Math.imul(x ^ seed, 374761393) + Math.imul(y, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
export function riverX(y) { return 111 + Math.sin(y / 15) * 8 + Math.sin(y / 36) * 11; }
export function terrain(x, y) {
  if (x < 1 || y < 1 || x >= WORLD_SIZE - 1 || y >= WORLD_SIZE - 1) return 'wall';
  if (Math.abs(x - riverX(y)) < 3.7 && Math.abs(y - 70) > 2 && Math.abs(y - 142) > 2) return 'water';
  if (VILLAGES.some(v => (Math.abs(x - v.x) < 1.5 && Math.abs(y - v.y) < 9) || (Math.abs(y - v.y) < 1.5 && Math.abs(x - v.x) < 9))) return 'path';
  if (Math.abs(y - 70) < 2 || (Math.abs(x - 48) < 2 && y > 39 && y < 115)) return 'path';
  if (y < 35) return 'snow';
  if (x > 145 && y > 105) return 'marsh';
  if (x < 44 && y > 130) return 'ruins';
  return 'grass';
}
export function zone(x, y) { const town = VILLAGES.find(v => Math.hypot(x - v.x, y - v.y) < 14); return town ? town.name : y < 35 ? 'Frostkamm' : x > 145 && y > 105 ? 'Flüstersümpfe' : x < 44 && y > 130 ? 'Vergessene Ruinen' : x > riverX(y) ? 'Orkische Grenzlande' : 'Die Immergrünen Lande'; }
export function treeAt(x, y) { return ['grass', 'snow'].includes(terrain(x, y)) && !VILLAGES.some(v => Math.hypot(x - v.x, y - v.y) < 12) && hash(x, y) > .966 && Math.abs(y - 70) > 5; }
export function walkable(x, y) { const t = terrain(Math.round(x), Math.round(y)); const house = HOUSES.some(([bx, by]) => Math.abs(x - bx) < 2.4 && y >= by && y < by + 1.8); return t !== 'water' && t !== 'wall' && !house && !treeAt(Math.round(x), Math.round(y)); }
export function makePlayer(kind = 'elf', name = 'Wanderer', gender = 'female') {
  const c = CLASSES[kind] || CLASSES.elf;
  return { id: 'local', name: String(name).trim().slice(0, 20) || 'Wanderer', kind: CLASSES[kind] ? kind : 'elf', gender, x: 48, y: 73, hp: c.hp, mana: c.mana, stamina: 100, level: 1, xp: 0, coins: 35, kills: 0, chests: 0, shrines: 0, potions: 3, ammo: 60, unlocked: [0, 1], cooldowns: [0, 0, 0, 0], attackCd: 0, buff: 0, armor: 0, damageBonus: 0, weapon: c.weapon, inventory: [{ id: 'starter', name: c.weapon, type: 'weapon', bonus: 0, equipped: true, kind }], questClaimed: false, input: {}, facing: { x: 1, y: 0 } };
}
export const maxHp = p => CLASSES[p.kind].hp + (p.level - 1) * 12;
export const maxMana = p => CLASSES[p.kind].mana + (p.level - 1) * 7;
export const xpNeeded = p => 65 + (p.level - 1) * 45;
export const SHOP = [
  { name: 'Heiltrank', type: 'potion', price: 18, desc: 'Stellt 55 Leben wieder her.' },
  { name: '30 Pfeile', type: 'ammo', price: 10, desc: 'Munition für deinen Bogen.' },
  { name: 'Waffe des Waldhüters', type: 'weapon', price: 85, bonus: 9, desc: '+9 Schaden · passend zu deiner Klasse' },
  { name: 'Buch der alten Künste', type: 'book', price: 110, desc: 'Lerne eine zufällige Klassenfähigkeit.' },
  { name: 'Verstärkte Reisekleidung', type: 'armor', price: 65, bonus: 3, desc: 'Reduziert eingehenden Schaden um 3.' },
  { name: 'Waldläufer-Axt', type: 'tool', price: 30, desc: 'Ernte Kräuter in Büschen zu Heiltränken.' }
];
export class World {
  constructor() {
    this.time = 0; this.weather = 'clear'; this.weatherTimer = 75; this.effects = []; this.events = []; this.players = new Map(); this.objects = []; this.mobs = [];
    this.npcs = [{ x: 43, y: 68, name: 'Elara', role: 'Händlerin', glyph: '&' }, { x: 53, y: 66, name: 'Eldric', role: 'Dorfältester', glyph: '&' }, { x: 48, y: 79, name: 'Mira', role: 'Kräuterkundige', glyph: '&' }, { x: 138, y: 142, name: 'Thoran', role: 'Händlerin', glyph: '&' }, { x: 144, y: 145, name: 'Lyra', role: 'Kräuterkundige', glyph: '&' }, { x: 66, y: 27, name: 'Fenra', role: 'Händlerin', glyph: '&' }];
    for (let y = 5; y < WORLD_SIZE - 5; y++) for (let x = 5; x < WORLD_SIZE - 5; x++) {
      const h = hash(x, y, 992); const t = terrain(x, y);
      if (!walkable(x, y) || t === 'path' || safeAt(x, y)) continue;
      if (h > .997) this.objects.push({ id: `c${x}:${y}`, x, y, type: 'chest', opened: false });
      else if (h < .006) this.objects.push({ id: `g${x}:${y}`, x, y, type: 'coin', opened: false });
      else if (h > .994 && h < .9947) this.objects.push({ id: `s${x}:${y}`, x, y, type: 'shrine', opened: false });
      if (h > .986 && h < .989 && Math.hypot(x - 48, y - 70) > 22) {
        const kind = y < 35 ? 1 : x > 145 && y > 105 ? 5 : x > 120 ? 4 : x < 44 && y > 130 ? 2 : Math.floor(hash(x, y, 44) * 4);
        this.mobs.push({ id: `m${x}:${y}`, x, y, homeX: x, homeY: y, kind, hp: MOB_TYPES[kind].hp, cd: 0, dead: 0, slow: 0 });
      }
    }
    this.objects.push({ id: 'welcome-chest', x: 55, y: 76, type: 'chest', opened: false }, { id: 'welcome-shrine', x: 36, y: 80, type: 'shrine', opened: false }, { id: 'welcome-coin', x: 51, y: 75, type: 'coin', opened: false });
    this.mobs.push({ id: 'welcome-slime', x: 61, y: 79, homeX: 61, homeY: 79, kind: 0, hp: 30, cd: 0, dead: 0, slow: 0 });
  }
  notify(text, player, type = 'info') { this.events.push({ text, player: player?.id, type, id: Math.random() }); if (this.events.length > 30) this.events.shift(); }
  move(p, dx, dy) { const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 3)); for (let i = 0; i < steps; i++) { if (walkable(p.x + dx / steps, p.y)) p.x += dx / steps; if (walkable(p.x, p.y + dy / steps)) p.y += dy / steps; } }
  update(dt) {
    this.time += dt; this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) { this.weather = ['clear', 'rain', 'storm', 'snow'][Math.floor(Math.random() * 4)]; this.weatherTimer = 70 + Math.random() * 100; }
    for (const p of this.players.values()) {
      if (p.hp <= 0) continue;
      const input = p.input || {}; let dx = +!!input.right - +!!input.left, dy = +!!input.down - +!!input.up;
      const moving = dx || dy, sprint = input.sprint && p.stamina > 2 && moving;
      if (moving) { const l = Math.hypot(dx, dy); dx /= l; dy /= l; p.facing = { x: dx, y: dy }; this.move(p, dx * CLASSES[p.kind].speed * (sprint ? 1.7 : 1) * dt, dy * CLASSES[p.kind].speed * (sprint ? 1.7 : 1) * dt); }
      p.stamina = Math.max(0, Math.min(100, p.stamina + (sprint ? -25 : 16) * dt));
      p.mana = Math.min(maxMana(p), p.mana + (p.kind === 'mage' ? 5 : 3.5) * dt);
      if (safeAt(p.x, p.y)) p.hp = Math.min(maxHp(p), p.hp + dt * 3);
      p.buff = Math.max(0, p.buff - dt); p.attackCd = Math.max(0, p.attackCd - dt); p.cooldowns = p.cooldowns.map(c => Math.max(0, c - dt));
      for (const o of this.objects) if (!o.opened && o.type === 'coin' && Math.hypot(o.x - p.x, o.y - p.y) < 1.1) { o.opened = true; p.coins += 4; this.effect(o.x, o.y, '+4 Gold', '#dfc480'); }
    }
    for (const m of this.mobs) {
      if (m.dead > 0) { m.dead -= dt; if (m.dead <= 0) { m.dead = 0; m.hp = MOB_TYPES[m.kind].hp; m.x = m.homeX; m.y = m.homeY; } continue; }
      let target, distance = 9;
      for (const p of this.players.values()) { const d = Math.hypot(p.x - m.x, p.y - m.y); if (p.hp > 0 && d < distance && !safeAt(p.x, p.y)) { distance = d; target = p; } }
      m.cd = Math.max(0, m.cd - dt); m.slow = Math.max(0, m.slow - dt);
      const def = MOB_TYPES[m.kind];
      if (target) {
        if (distance > 1.1) { const speed = def.speed * (m.slow > 0 ? .25 : 1) * dt; this.move(m, (target.x - m.x) / distance * speed, (target.y - m.y) / distance * speed); }
        else if (m.cd <= 0) { const damage = Math.max(1, def.damage - target.armor - (target.buff > 0 ? 5 : 0)); target.hp = Math.max(0, target.hp - damage); m.cd = 1.5; this.effect(target.x, target.y - 1, `-${damage}`, '#ee8c7b'); if (!target.hp) this.notify('Du bist gefallen. Kehre am Dorf-Schrein zurück.', target, 'death'); }
      } else if (Math.hypot(m.x - m.homeX, m.y - m.homeY) > 2) { const d = Math.hypot(m.x - m.homeX, m.y - m.homeY); this.move(m, (m.homeX - m.x) / d * dt, (m.homeY - m.y) / d * dt); }
    }
    this.effects = this.effects.filter(e => (e.life -= dt) > 0);
  }
  effect(x, y, text, color, ring = false) { this.effects.push({ x, y, text, color, life: 1, ring }); }
  attack(p, slot = -1) {
    if (!p || p.hp <= 0) return;
    const c = CLASSES[p.kind]; let skill;
    if (slot >= 0) { const idx = p.unlocked[slot]; skill = c.skills[idx]; if (!skill || p.cooldowns[slot] > 0 || p.mana < skill.cost) return; p.mana -= skill.cost; p.cooldowns[slot] = skill.cd; }
    else { if (p.attackCd > 0) return; if (p.kind === 'elf' && p.ammo <= 0) { this.notify('Keine Pfeile. Kaufe Nachschub bei Elara.', p); return; } if (p.kind === 'elf') p.ammo--; p.attackCd = p.kind === 'samurai' ? .45 : .7; }
    if (skill?.heal) { p.hp = Math.min(maxHp(p), p.hp + skill.heal); for (const ally of this.players.values()) if (ally !== p && Math.hypot(ally.x - p.x, ally.y - p.y) < 6) ally.hp = Math.min(maxHp(ally), ally.hp + skill.heal); this.effect(p.x, p.y, `+${skill.heal}`, '#b4d7a0', true); }
    if (skill?.shield) { p.buff = skill.shield; this.effect(p.x, p.y, 'Bollwerk', '#e6d399', true); }
    if (skill?.dash) this.move(p, p.facing.x * skill.dash, p.facing.y * skill.dash);
    if (skill && !skill.power) return;
    const range = skill?.area || skill?.range || c.range;
    const targets = this.mobs.filter(m => m.hp > 0 && !m.dead && Math.hypot(m.x - p.x, m.y - p.y) <= range).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    this.effect(p.x, p.y, skill?.name || (c.range > 3 ? '→' : '╱'), c.color, true);
    for (const m of targets.slice(0, skill?.area ? 15 : 1)) {
      const damage = Math.round((c.damage + p.damageBonus + (p.level - 1) * 2) * (skill?.power || 1) * (p.buff > 0 ? 1.15 : 1));
      m.hp -= damage; if (skill?.slow) m.slow = 4; this.effect(m.x, m.y, `-${damage}`, '#e1d4a6');
      if (m.hp <= 0) { m.hp = 0; m.dead = 65; const def = MOB_TYPES[m.kind]; p.coins += def.coins; p.xp += def.xp; p.kills++; this.notify(`${def.name} besiegt · +${def.xp} EP · +${def.coins} Gold`, p, 'kill'); this.levelUp(p); }
    }
  }
  levelUp(p) { while (p.xp >= xpNeeded(p)) { p.xp -= xpNeeded(p); p.level++; p.hp = maxHp(p); p.mana = maxMana(p); this.notify(`Level ${p.level} erreicht! Leben und Mana erneuert.`, p, 'level'); this.unlock(p); } }
  unlock(p) { const pool = CLASSES[p.kind].skills.map((_, i) => i).filter(i => !p.unlocked.includes(i)); if (!pool.length) { p.damageBonus += 2; this.notify('Alle Künste gemeistert · +2 Schaden', p); return; } const idx = pool[Math.floor(Math.random() * pool.length)]; p.unlocked.push(idx); this.notify(`Neue Fähigkeit: ${CLASSES[p.kind].skills[idx].name}. Im Inventar auf einen der vier Plätze legen.`, p, 'level'); }
  nearest(p) { return [...this.npcs.map(n => ({ ...n, type: 'npc' })), ...this.objects.filter(o => !o.opened && o.type !== 'coin')].filter(o => Math.hypot(o.x - p.x, o.y - p.y) < 3.2).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; }
  interact(p) {
    if (!p || p.hp <= 0) return;
    const o = this.nearest(p); if (!o) { this.notify('Nähere dich einer Kiste, einem Schrein oder einem Dorfbewohner.', p); return; }
    if (o.type === 'npc') { this.notify(o.role === 'Händlerin' ? 'shop' : o.name === 'Eldric' ? 'quest' : 'healer', p, 'panel'); return; }
    const source = this.objects.find(x => x.id === o.id); if (!source || source.opened) return; source.opened = true;
    if (o.type === 'chest') { p.coins += 20; p.potions++; p.chests++; const roll = hash(o.x, o.y, 31); const item = { ...(roll > .8 ? SHOP[3] : roll > .65 ? SHOP[5] : { name: `${CLASSES[p.kind].weapon} der Alten`, type: 'weapon', bonus: 3 + Math.floor(hash(o.x, o.y) * 7) }), id: `loot-${o.id}`, kind: p.kind }; p.inventory.push(item); this.notify(`Kiste geöffnet · 20 Gold · Heiltrank · ${item.name}`, p, 'loot'); }
    else { p.hp = maxHp(p); p.mana = maxMana(p); p.buff = 90; p.shrines++; this.notify('Segen der Alten · Erneuerung & 90 Sekunden Schutz.', p, 'loot'); }
  }
  action(p, action, data) {
    if (!p) return;
    if (action === 'respawn') { if (p.hp > 0) return; p.x = 48; p.y = 73; p.hp = maxHp(p); p.mana = maxMana(p); p.coins = Math.floor(p.coins * .9); this.notify('Am Dorf-Schrein erwacht · 10 % Gold als Opfergabe.', p); return; }
    if (p.hp <= 0) return;
    if (action === 'attack') this.attack(p);
    if (action === 'skill' && Number.isInteger(data) && data >= 0 && data < 4) this.attack(p, data);
    if (action === 'interact') this.interact(p);
    if (action === 'potion') { if (p.potions > 0 && p.hp < maxHp(p)) { p.potions--; p.hp = Math.min(maxHp(p), p.hp + 55); this.effect(p.x, p.y, '+55', '#a8ca82'); } else this.notify(p.potions ? 'Dein Leben ist bereits voll.' : 'Keine Heiltränke im Inventar.', p); }
    if (action === 'buy') { const item = SHOP[data]; if (!item) return; if (!this.npcs.some(n => n.role === 'Händlerin' && Math.hypot(n.x - p.x, n.y - p.y) < 3.2)) { this.notify('Der Händler ist zu weit entfernt.', p); return; } if (p.coins < item.price) { this.notify('Nicht genug Gold.', p); return; } p.coins -= item.price; if (item.type === 'potion') p.potions++; else if (item.type === 'ammo') p.ammo += 30; else p.inventory.push({ ...item, kind: p.kind, id: `buy-${Math.random()}` }); this.notify(`${item.name} gekauft.`, p, 'loot'); }
    if (action === 'equip') { const item = p.inventory.find(i => i.id === data); if (!item) return; if (item.type === 'book') { if (p.unlocked.length >= CLASSES[p.kind].skills.length) { this.notify('Du kennst bereits alle Klassenfähigkeiten.', p); return; } this.unlock(p); p.inventory = p.inventory.filter(i => i !== item); } else if (item.type === 'weapon' || item.type === 'armor') { for (const i of p.inventory) if (i.type === item.type) i.equipped = false; item.equipped = true; if (item.type === 'weapon') { p.damageBonus = item.bonus; p.weapon = item.name; } else p.armor = item.bonus; this.notify(`${item.name} ausgerüstet.`, p); } else if (item.type === 'tool') { if (terrain(Math.round(p.x), Math.round(p.y)) !== 'grass' || hash(Math.floor(p.x / 2), Math.floor(p.y / 2), 55) < .45) { this.notify('Suche dichte Büsche außerhalb des Dorfes.', p); return; } const key = `herb-${Math.floor(p.x / 2)}:${Math.floor(p.y / 2)}`; if (this.objects.some(o => o.id === key)) { this.notify('Dieser Busch wurde bereits geerntet.', p); return; } this.objects.push({ id: key, x: p.x, y: p.y, type: 'herb', opened: true }); p.potions++; this.notify('Heilkräuter gesammelt · +1 Heiltrank', p, 'loot'); } }
    if (action === 'swapSkill' && Array.isArray(data) && data.length === 2) { const [a, b] = data; if ([a, b].every(i => Number.isInteger(i) && i >= 0 && i < p.unlocked.length)) { [p.unlocked[a], p.unlocked[b]] = [p.unlocked[b], p.unlocked[a]]; p.cooldowns = [15, 15, 15, 15]; } }
    if (action === 'quest') { if (!this.npcs.some(n => n.name === 'Eldric' && Math.hypot(n.x - p.x, n.y - p.y) < 3.2)) return; if (!p.questClaimed && p.kills >= 5 && p.chests >= 1 && p.shrines >= 1) { p.questClaimed = true; p.coins += 100; p.xp += 80; this.levelUp(p); this.notify('Immerhains Wächter · +100 Gold · +80 EP', p, 'level'); } else this.notify(p.questClaimed ? 'Immerhain wird deine Hilfe nicht vergessen.' : 'Besiege 5 Feinde, öffne eine Kiste und finde einen Schrein.', p); }
    if (action === 'heal' && this.npcs.some(n => n.role === 'Kräuterkundige' && Math.hypot(n.x - p.x, n.y - p.y) < 3.2)) { p.hp = maxHp(p); p.mana = maxMana(p); this.notify('Möge der Wald dich beschützen.', p); }
  }
}
