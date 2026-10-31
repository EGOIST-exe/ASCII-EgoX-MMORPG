import { makePlayer, CLASSES } from './core.js';
export class Party {
  constructor(world, onStatus) { this.world = world; this.onStatus = onStatus; this.mode = 'solo'; this.connections = new Map(); this.peer = null; this.id = ''; this.lastSend = 0; this.seen = new Set(); }
  async createPeer() {
    const { default: Peer } = await import('peerjs');
    const peer = new Peer({ debug: 0 }); this.peer = peer;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { peer.destroy(); reject(new Error('Der Vermittlungsdienst antwortet nicht. Prüfe deine Verbindung.')); }, 14000);
      peer.on('open', id => { clearTimeout(timeout); this.id = id; resolve(peer); });
      peer.on('error', error => { clearTimeout(timeout); this.onStatus(`Verbindung fehlgeschlagen: ${error.type}. Solo bleibt verfügbar.`); reject(error); });
      peer.on('disconnected', () => this.onStatus('Vermittlungsdienst getrennt. Bestehende Verbindungen können weiterlaufen.'));
    });
  }
  async host() {
    if (this.mode !== 'solo') return;
    this.onStatus('Gruppe wird erstellt …');
    try { const peer = await this.createPeer(); this.mode = 'host';
      peer.on('connection', conn => {
        if (this.connections.size >= 3) { conn.on('open', () => { conn.send({ type: 'full' }); setTimeout(() => conn.close(), 500); }); return; }
        this.connections.set(conn.peer, conn);
        conn.on('data', msg => {
          if (!msg || typeof msg !== 'object') return;
          if (msg.type === 'join' && !this.world.players.has(conn.peer)) { const p = makePlayer(CLASSES[msg.kind] ? msg.kind : 'elf', msg.name, msg.gender === 'male' ? 'male' : 'female'); p.id = conn.peer; this.world.players.set(p.id, p); this.world.notify(`${p.name} ist der Gruppe beigetreten.`); this.onStatus(`${this.world.players.size}/4 Abenteurer verbunden.`); }
          const p = this.world.players.get(conn.peer); if (!p) return;
          if (msg.type === 'input') { const inp = msg.input || {}; p.input = Object.fromEntries(['up', 'down', 'left', 'right', 'sprint'].map(k => [k, inp[k] === true])); }
          if (msg.type === 'action' && typeof msg.action === 'string') { const now = performance.now(); if (now - (p.lastAction || 0) < 60) return; p.lastAction = now; this.world.action(p, msg.action, msg.data); }
        });
        conn.on('close', () => { const p = this.world.players.get(conn.peer); if (p) this.world.notify(`${p.name} hat die Gruppe verlassen.`); this.connections.delete(conn.peer); this.world.players.delete(conn.peer); this.onStatus('Ein Gruppenmitglied hat die Verbindung beendet.'); });
        conn.on('error', () => conn.close());
      }); this.onStatus('Gruppe bereit. Kopiere den Einladungslink.');
    } catch { this.mode = 'solo'; if (this.peer) this.peer.destroy(); }
  }
  async join(room, character) {
    this.onStatus('Verbindung zur Gruppe …');
    try { await this.createPeer(); this.mode = 'guest'; const conn = this.peer.connect(room, { reliable: true }); this.connection = conn;
      const timer = setTimeout(() => { if (!conn.open) { this.onStatus('Gruppe nicht erreichbar. Der Host muss das Spiel geöffnet halten.'); this.leave(); } }, 15000);
      conn.on('open', () => { clearTimeout(timer); conn.send({ type: 'join', kind: character.kind, name: character.name, gender: character.gender }); this.world.players.clear(); this.onStatus('Verbunden. Willkommen in der Gruppe.'); });
      conn.on('data', msg => {
        if (msg.type === 'full') { this.onStatus('Die Gruppe ist voll (4/4).'); this.leave(); return; }
        if (msg.type !== 'state') return;
        this.world.time = msg.time; this.world.weather = msg.weather; this.world.players = new Map(msg.players.map(p => [p.id, p])); this.world.mobs = msg.mobs; this.world.objects = msg.objects; this.world.effects = msg.effects;
        for (const e of msg.events) if (!this.seen.has(e.id)) { this.seen.add(e.id); this.world.events.push(e); } this.world.events = this.world.events.slice(-30); if (this.seen.size > 600) this.seen = new Set(msg.events.map(e => e.id));
      });
      conn.on('close', () => { clearTimeout(timer); if (this.mode === 'guest') { this.onStatus('Der Host hat die Welt geschlossen. Dein Solo-Spielstand bleibt erhalten.'); this.leave(); } }); conn.on('error', () => { clearTimeout(timer); this.onStatus('Verbindung fehlgeschlagen.'); this.leave(); });
    } catch { this.leave(); }
  }
  tick(time, input) {
    if (time - this.lastSend < .1) return; this.lastSend = time;
    if (this.mode === 'host') { const msg = { type: 'state', time: this.world.time, weather: this.world.weather, players: [...this.world.players.values()], mobs: this.world.mobs, objects: this.world.objects, effects: this.world.effects, events: this.world.events.slice(-15) }; for (const conn of this.connections.values()) if (conn.open) conn.send(msg); }
    if (this.mode === 'guest' && this.connection?.open) this.connection.send({ type: 'input', input });
  }
  action(action, data) { if (this.mode === 'guest' && this.connection?.open) this.connection.send({ type: 'action', action, data }); else if (this.mode !== 'guest') this.world.action(this.world.players.get('local'), action, data); }
  get playerId() { return this.mode === 'guest' ? this.id : 'local'; }
  get invite() { const url = new URL(location.href); url.search = ''; url.searchParams.set('room', this.id); return url.href; }
  leave() { this.mode = 'solo'; if (this.peer) this.peer.destroy(); this.peer = null; this.id = ''; this.connections.clear(); for (const id of this.world.players.keys()) if (id !== 'local') this.world.players.delete(id); }
}
