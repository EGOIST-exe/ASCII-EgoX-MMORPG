import { WORLD_SIZE, hash, terrain, treeAt, riverX, CLASSES, MOB_TYPES, HOUSES, VILLAGES } from './core.js';
export class Renderer {
  constructor(canvas, world) { this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.world = world; this.zoom = 1; this.motion = !matchMedia('(prefers-reduced-motion: reduce)').matches; this.camera = { x: 48, y: 73 }; this.resize(); this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); }
  resize() { const rect = this.canvas.getBoundingClientRect(); this.w = rect.width; this.h = rect.height; const d = Math.min(devicePixelRatio || 1, 2); this.canvas.width = this.w * d; this.canvas.height = this.h * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); }
  point(x, y) { return { x: (x - this.camera.x) * this.tile + this.w * .46, y: (y - this.camera.y) * this.tile + this.h * .52 }; }
  glyph(char, x, y, color, size = 11) { const c = this.ctx; c.fillStyle = color; c.font = `${size}px "Courier New", monospace`; c.fillText(char, x, y); }
  draw(player, dt = .016, ambient = false) {
    const c = this.ctx, t = this.motion ? this.world.time : 0; this.tile = 25 * this.zoom;
    const target = player || { x: 48, y: 76 }; const smooth = 1 - Math.exp(-dt * 8); this.camera.x += (target.x - this.camera.x) * smooth; this.camera.y += (target.y - this.camera.y) * smooth;
    c.fillStyle = '#10160f'; c.fillRect(0, 0, this.w, this.h);
    const a = this.point(0, 0), unit = this.tile;
    const xmin = Math.max(0, Math.floor(this.camera.x - this.w / unit)), xmax = Math.min(WORLD_SIZE, Math.ceil(this.camera.x + this.w / unit));
    const ymin = Math.max(0, Math.floor(this.camera.y - this.h / unit - 7)), ymax = Math.min(WORLD_SIZE, Math.ceil(this.camera.y + this.h / unit + 7));
    c.font = '11px "Courier New", monospace';
    for (let y = ymin; y < ymax; y++) for (let x = xmin; x < xmax; x++) {
      const p = this.point(x, y); if (p.x < -unit || p.x > this.w + unit || p.y < -unit || p.y > this.h + unit) continue;
      const type = terrain(x, y), n = hash(x, y, 3);
      if (type === 'water') {
        c.fillStyle = '#0c2222'; c.fillRect(p.x - unit / 2, p.y - unit / 2, unit + 1, unit + 1);
        for (let j = 0; j < 3; j++) { const wave = Math.sin(x * .8 + y * .6 + t * 1.8 + j); this.glyph(wave > .55 ? '~~' : wave < -.65 ? '──' : ' ·', p.x - 8 + wave * 2, p.y - 6 + j * 8, wave > .7 ? '#5b8380' : '#28504b', 10); }
        const mirror = Math.round(riverX(y) * 2 - x); if (treeAt(mirror - 5, y + 2) || treeAt(mirror + 5, y + 2)) this.glyph('v;v', p.x - 8 + Math.sin(t + y) * 3, p.y, '#527268', 10);
      } else if (type === 'path') {
        c.fillStyle = '#25281b'; c.fillRect(p.x - unit / 2, p.y - unit / 2, unit + 1, unit + 1);
        this.glyph(n > .5 ? '· . ' : ' . :', p.x - 11, p.y, '#655b3a', 10); this.glyph(' .', p.x - 5, p.y + 9, '#46442b', 10);
      } else {
        const snowy = type === 'snow', marsh = type === 'marsh', stone = type === 'ruins';
        for (let j = 0; j < 3; j++) {
          const h = hash(x * 3 + j, y, 8), sway = Math.sin(t * .9 + x * .2 + y * .6) > .6;
          const chars = snowy ? ['·', ':', '*', ' '] : stone ? ['_', '·', '▒', ':'] : [',', "'", '.', '`', ';', 'v', '/', ' '];
          this.glyph(chars[Math.floor(h * chars.length)], p.x - 10 + j * 8, p.y - 4 + hash(j + x, y) * 15, snowy ? '#64756e' : marsh ? ['#3e6254', '#27473c'][j % 2] : ['#34482b', '#496037', '#273e26'][j], 10);
          if (!snowy && h > .75) this.glyph(sway ? '/' : '|', p.x - 9 + j * 8, p.y + 7, marsh ? '#425f43' : '#3f5d31', 11);
        }
        if (!snowy && n > .94) this.glyph(n > .975 ? '✧' : ':', p.x, p.y, n > .975 ? '#b1a578' : '#8a9671', 9);
        if (hash(Math.floor(x / 2), Math.floor(y / 2), 55) > .8 && type === 'grass' && n > .6) this.bush(p.x, p.y, x, y, t);
      }
    }
    // Roads cross the river on two timber bridges.
    for (const yy of [70, 142]) { const p = this.point(riverX(yy), yy); for (let j = -3; j <= 3; j++) this.glyph('╞══════════════════╡', p.x - 72, p.y + j * 8, j === -3 || j === 3 ? '#9a8a60' : '#6e6448', 12); }
    for (const [x, y, style] of HOUSES) { const p = this.point(x, y); if (p.x > -120 && p.x < this.w + 120 && p.y > -100 && p.y < this.h + 100) this.building(x, y, style); }
    const well = this.point(48, 68); this.glyph('╭───╮', well.x - 17, well.y - 8, '#9c9e83', 12); this.glyph('│ ≈ │', well.x - 17, well.y + 4, '#789b9b', 12); this.glyph('╰───╯', well.x - 17, well.y + 16, '#8a927b', 12);
    for (const o of this.world.objects) {
      const p = this.point(o.x, o.y); if (p.x < -50 || p.x > this.w + 50 || p.y < -50 || p.y > this.h + 50 || (o.opened && o.type !== 'chest')) continue;
      if (o.type === 'chest') { this.glow(p.x, p.y, '#e4bb59', o.opened ? 0 : .1); this.glyph(o.opened ? '╲___╱' : '╔═╤═╗', p.x - 16, p.y - 4, o.opened ? '#615c40' : '#d2b36d', 12); this.glyph('╚═══╝', p.x - 16, p.y + 8, o.opened ? '#615c40' : '#a58d52', 12); }
      if (o.type === 'coin') { this.glow(p.x, p.y, '#d8be6c', .08); this.glyph(Math.sin(t * 2 + o.x) > 0 ? '◇' : '│', p.x, p.y, '#e7c775', 13); }
      if (o.type === 'shrine') { this.glow(p.x, p.y - 15, '#a8c7b4', .15); [' /\\ ', '│◇│', '│:│', '╧═╧'].forEach((s, i) => this.glyph(s, p.x - 12, p.y - 31 + i * 12, i === 1 ? '#cbd8a3' : '#849487', 13)); }
    }
    const entities = [...this.world.npcs.map(n => ({ ...n, npc: true })), ...this.world.mobs.filter(m => !m.dead && m.hp > 0).map(m => ({ ...m, mob: true })), ...this.world.players.values()].sort((a, b) => a.y - b.y);
    for (const e of entities) {
      const p = this.point(e.x, e.y); if (p.x < -40 || p.x > this.w + 40 || p.y < -40 || p.y > this.h + 40) continue;
      if (e.mob) { const def = MOB_TYPES[e.kind]; this.glow(p.x, p.y, '#000000', .4, 22); this.glyph(e.kind === 0 ? '(o)' : ` ${def.glyph} `, p.x - 11, p.y - 5, def.color, 15); this.glyph(e.kind === 0 ? '╰─╯' : '/|\\', p.x - 11, p.y + 7, def.color, 13); if (e.hp < def.hp) { c.fillStyle = '#332624'; c.fillRect(p.x - 16, p.y - 25, 32, 3); c.fillStyle = '#b5725e'; c.fillRect(p.x - 16, p.y - 25, 32 * e.hp / def.hp, 3); this.label(def.name, p.x, p.y - 30, '#c9bba1'); } }
      else if (e.npc) { this.glyph('o', p.x - 3, p.y - 15, '#d6c6a2', 14); this.glyph('/&\\', p.x - 10, p.y - 2, '#99b193', 13); this.glyph('/ \\', p.x - 10, p.y + 10, '#8b9d82', 13); this.label(e.name, p.x, p.y - 30, '#c1c6a7'); if (e.name === 'Eldric') this.glyph('!', p.x - 3, p.y - 45, '#e8cf83', 15); }
      else {
        const color = CLASSES[e.kind].color; this.glow(p.x, p.y, color, e.id === player?.id ? .14 : .07, 48);
        c.strokeStyle = e.id === player?.id ? '#c5cf97' : '#83978a'; c.lineWidth = 1; c.beginPath(); c.ellipse(p.x, p.y + 10, 17, 7, 0, 0, Math.PI * 2); c.stroke();
        this.glyph(e.gender === 'female' ? '(o)' : ' o ', p.x - 10, p.y - 20, '#e4d7b1', 14); this.glyph(e.kind === 'elf' ? '/╬}' : e.kind === 'mage' ? '/╬*' : '/╬†', p.x - 10, p.y - 7, color, 14); this.glyph(e.gender === 'female' ? '/Λ\\' : '/ \\', p.x - 10, p.y + 7, color, 14);
        this.label(e.name, p.x, p.y - 34, '#e3e8ca');
        if (terrain(Math.round(e.x + 1), Math.round(e.y)) === 'water') { c.globalAlpha = .3; this.glyph('╬', p.x + unit + Math.sin(t * 2) * 4, p.y + 20, color, 14); c.globalAlpha = 1; }
      }
    }
    // Tree crowns are drawn last; crowns near a player fade to reveal them.
    for (let y = ymin; y < ymax; y++) for (let x = xmin; x < xmax; x++) if (treeAt(x, y)) {
      const p = this.point(x, y); if (p.x < -100 || p.x > this.w + 100 || p.y < -20 || p.y > this.h + 150) continue;
      const fade = [...this.world.players.values()].some(e => Math.abs(e.x - x) < 2.8 && e.y < y + 1 && e.y > y - 4.5); this.tree(p.x, p.y, x, y, t, fade ? .27 : 1);
    }
    for (const e of this.world.effects) { const p = this.point(e.x, e.y); c.globalAlpha = e.life; if (e.ring) { c.strokeStyle = e.color; c.lineWidth = 1; c.beginPath(); c.ellipse(p.x, p.y, (1 - e.life) * 80 + 10, (1 - e.life) * 35 + 5, 0, 0, Math.PI * 2); c.stroke(); } this.label(e.text, p.x, p.y - (1 - e.life) * 45 - 35, e.color, 13); c.globalAlpha = 1; }
    // Fireflies, leaves, and weather are glyphs too.
    if (this.motion) {
      for (let i = 0; i < 22; i++) { const x = (hash(i, 1) * this.w + Math.sin(t * .3 + i) * 28), y = (hash(i, 2) * this.h + t * (i % 3 === 0 ? 7 : -2)) % this.h; c.globalAlpha = .25 + Math.sin(t + i) * .2; this.glyph(i % 3 === 0 ? "'" : '·', x, y, i % 3 === 0 ? '#b6bf78' : '#e8dca2', 14); } c.globalAlpha = 1;
      if (this.world.weather !== 'clear') { const snow = this.world.weather === 'snow', count = this.world.weather === 'storm' ? 230 : 120; for (let i = 0; i < count; i++) { const x = ((hash(i, 8) * this.w - t * (snow ? 15 : 95)) % this.w + this.w) % this.w, y = (hash(i, 9) * this.h + t * (snow ? 28 : 420)) % this.h; this.glyph(snow ? '·' : '/', x, y, snow ? '#91a99b' : '#4a6962', snow ? 15 : 12); } if (this.world.weather === 'storm' && Math.sin(t * .7) > .9997) { c.fillStyle = '#bccbbd22'; c.fillRect(0, 0, this.w, this.h); } }
    }
    const vignette = c.createRadialGradient(this.w / 2, this.h / 2, this.h * .2, this.w / 2, this.h / 2, this.w * .65); vignette.addColorStop(0, '#0000'); vignette.addColorStop(1, '#030903af'); c.fillStyle = vignette; c.fillRect(0, 0, this.w, this.h);
    if (ambient) { c.fillStyle = '#0b100b55'; c.fillRect(0, 0, this.w, this.h); }
  }
  label(text, x, y, color, size = 10) { const c = this.ctx; c.font = `${size}px "Courier New",monospace`; c.textAlign = 'center'; c.fillStyle = '#0b120be0'; const width = c.measureText(text).width; c.fillRect(x - width / 2 - 4, y - size, width + 8, size + 5); c.fillStyle = color; c.fillText(text, x, y); c.textAlign = 'left'; }
  glow(x, y, color, alpha = .1, size = 60) { if (!alpha) return; const c = this.ctx, g = c.createRadialGradient(x, y, 1, x, y, size); g.addColorStop(0, color); g.addColorStop(1, '#0000'); c.globalAlpha = alpha; c.fillStyle = g; c.fillRect(x - size, y - size, size * 2, size * 2); c.globalAlpha = 1; }
  bush(px, py, x, y, t) { for (let j = 0; j < 2; j++) this.glyph(j ? " \\v|/" : ',;v;,.', px - 15 + Math.sin(t + x) * 1.2, py + j * 9, j ? '#4e6636' : '#627d45', 10); }
  tree(px, py, x, y, t, alpha) {
    const c = this.ctx, scale = this.zoom, variant = hash(x, y, 24), height = (75 + variant * 25) * scale, width = (39 + variant * 10) * scale;
    c.globalAlpha = .4; c.fillStyle = '#080c07'; c.beginPath(); c.ellipse(px + 15, py + 6, width, 13 * scale, -.3, 0, Math.PI * 2); c.fill(); c.globalAlpha = alpha;
    this.glyph('│║│', px - 9 * scale, py - 7 * scale, '#6c694c', 12 * scale); this.glyph('/║\\', px - 9 * scale, py + 5 * scale, '#514f37', 12 * scale);
    const sway = this.motion ? Math.sin(t * .8 + x + y) * 2 * scale : 0;
    for (let j = 0; j < 11; j++) for (let i = -7; i <= 7; i++) {
      const nx = i / 7, ny = (j - 5) / 5.5; if (nx * nx + ny * ny > 1 + hash(x + i, y + j, 6) * .17) continue;
      const h = hash(x * 16 + i, y * 11 + j, 3); if (h < .07) continue;
      const char = ['%', '&', '*', ':', 'v', 'o', '♣', '+'][Math.floor(h * 8)];
      const color = y < 35 ? ['#889d8e', '#b3c3b4', '#718778'][Math.floor(h * 3)] : ny < -.3 ? ['#7c9464', '#94a67a', '#647e56'][Math.floor(h * 3)] : nx < -.2 ? ['#597747', '#6d8858', '#567044'][Math.floor(h * 3)] : ['#3e5a37', '#4e6d43', '#6a8553'][Math.floor(h * 3)];
      this.glyph(char, px + nx * width + sway * (1 - j / 14), py - height + j * 5.9 * scale, color, 10 * scale);
    } c.globalAlpha = 1;
  }
  building(x, y, style) {
    const p = this.point(x, y), c = this.ctx, z = this.zoom; const roof = ['      /\\      ', '     /^^\\     ', '    /^^^^\\    ', '   /^^/\\^^\\   ', '  /^^/  \\^^\\  ', ' /^^^^^^^^^^^^\\ ', '/______________\\'];
    c.save(); c.translate(p.x - 68 * z, p.y - 70 * z); c.scale(z, z);
    roof.forEach((s, i) => this.glyph(s, 0, i * 9, i < 3 ? '#a49d6a' : '#77794e', 11));
    [' | : : : : : | ', style === 0 ? ' | [#]   [#] | ' : ' | [#] : [#] | ', ' | : : __: : | ', ' |____|  |___| ', ' /____|__|____\\'].forEach((s, i) => this.glyph(s, 0, 67 + i * 10, i === 1 ? '#c7b176' : '#83836a', 11)); c.restore();
    const l = this.point(x - 2.3, y + 1.1); this.glow(l.x, l.y, '#eac56b', .19, 60); this.glyph('i', l.x, l.y, '#f1d58a', 14);
  }
  minimap(canvas, player, large = false) {
    const c = canvas.getContext('2d'); const size = canvas.width; c.fillStyle = '#121c15'; c.fillRect(0, 0, size, size); const s = size / WORLD_SIZE;
    for (let y = 0; y < WORLD_SIZE; y += 2) for (let x = 0; x < WORLD_SIZE; x += 2) { const t = terrain(x, y); c.fillStyle = t === 'water' ? '#4c7771' : t === 'path' ? '#8f8558' : t === 'snow' ? '#6c8073' : t === 'marsh' ? '#254c3e' : t === 'ruins' ? '#5e6150' : treeAt(x, y) ? '#526b3d' : '#293f27'; c.fillRect(x * s, y * s, 2 * s + .4, 2 * s + .4); }
    for (const o of this.world.objects) if (o.type === 'shrine' && !o.opened) { c.fillStyle = '#accbbd'; c.fillRect(o.x * s, o.y * s, large ? 3 : 1.5, large ? 3 : 1.5); }
    c.fillStyle = '#dcc48a'; for (const v of VILLAGES) c.fillRect((v.x - 3) * s, (v.y - 3) * s, 7 * s, 7 * s);
    for (const p of this.world.players.values()) { c.fillStyle = p.id === player?.id ? '#eef0ba' : '#a0c5dc'; c.beginPath(); c.arc(p.x * s, p.y * s, large ? 5 : 3, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#102016'; c.stroke(); }
    if (large) { c.font = '13px monospace'; c.fillStyle = '#e5e2bf'; c.fillText('FROSTKAMM', size * .25, size * .11); c.fillText('IMMERHAIN', size * .15, size * .33); c.fillText('ORKLANDE', size * .65, size * .4); c.fillText('RUINEN', size * .08, size * .84); c.fillText('FLÜSTERSÜMPFE', size * .65, size * .8); }
  }
  dispose() { this.observer.disconnect(); }
}
