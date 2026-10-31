export const WORLD_SIZE = 768;
export const DAY_LENGTH = 720;
export const SPAWN = { x: 48, y: 73, area: "vale" };
export const VILLAGES = [
  { x: 48, y: 70, name: "Lindenruh" },
  { x: 112, y: 70, name: "Weidensteg" },
  { x: 75, y: 128, name: "Morgenau" },
];
export const HOUSES = [
  [41, 64],
  [54, 62],
  [54, 80],
  [108, 64],
  [117, 76],
  [70, 123],
  [80, 130],
];
export const BENCHES = [
  { x: 45, y: 75, id: "bench-linden" },
  { x: 110, y: 73, id: "bench-river" },
  { x: 73, y: 126, id: "bench-meadow" },
];
export const SEALS = [
  { id: "dawn", x: 77, y: 60, name: "Siegel der Morgenröte" },
  { id: "river", x: 108, y: 91, name: "Siegel des Stroms" },
  { id: "ember", x: 74, y: 108, name: "Siegel der Glut" },
];
export const DUNGEON = { x: 125, y: 114 };
export const KNIGHT = {
  name: "Ritter",
  gender: "male",
  hp: 150,
  stamina: 100,
  damage: 23,
  defense: 3,
  speed: 4.1,
  range: 2.8,
};
export const SKILLS = [
  { name: "Schwerthieb", key: "1", cost: 20, cd: 4, level: 1 },
  { name: "Schildwacht", key: "2", cost: 15, cd: 10, level: 1 },
  { name: "Sturmtritt", key: "3", cost: 24, cd: 7, level: 3 },
  { name: "Letzter Eid", key: "4", cost: 30, cd: 24, level: 5 },
];
export const CINE = {
  prologue: {
    duration: 17,
    title: "Als die Sterne fielen",
    lines: [
      "Einst trugen die Türme von Aurelion das erste Licht.",
      "Dann kam die Nacht aus dem Norden. Und mit ihr das Feuer.",
      "Dein Königreich fiel. Von Prinzessin Elara blieb nur ein silbernes Band.",
      "Doch unter einer alten Linde glimmt noch ein Eid: Du wirst sie finden.",
    ],
  },
  rest: {
    duration: 6,
    title: "Ein Atemzug zwischen den Wegen",
    lines: [
      "Der Wind erzählt von Orten, die noch auf dich warten.",
      "Für einen Moment musst du kein Held sein.",
    ],
  },
  dragon: {
    duration: 12,
    title: "Ein Herz unter Asche",
    lines: [
      "Hinter dem letzten Tor liegt kein Schatz.",
      "Ein junger Drache hebt den Kopf. Seine Ketten sind zerbrochen.",
      "Er erkennt das Zeichen Aurelions auf deinem Schild.",
      "Nicht jedes Wesen der alten Welt hat deinen Eid vergessen.",
    ],
  },
  flight: {
    duration: 15,
    title: "Jenseits des Nebels",
    lines: [
      "Zwischen Schilf und Silberfischen lag eine Flöte aus Mondglas.",
      "Ihr Lied durchbricht den Nebel. Dein Drache breitet die Schwingen aus.",
      "Unter euch werden die Flüsse zu silbernen Fäden.",
      "Dort, wo das Morgenlicht das Meer berührt, wartet eine letzte Insel.",
    ],
  },
  reunion: {
    duration: 16,
    title: "Ein Königreich ist mehr als seine Mauern",
    lines: [
      "Im Garten jenseits des Nebels wartet sie.",
      "„Ich wusste, dass du das Lied finden würdest.“",
      "Du hast Aurelion nicht zurückgebracht. Aber seine Hoffnung.",
      "Und zwischen Wiesen und Sternen beginnt eine neue Geschichte.",
    ],
  },
};
export function hash(x, y, seed = 71839) {
  let n = Math.imul(x ^ seed, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function riverX(y) {
  return 94 + Math.sin(y / 22) * 7 + Math.sin(y / 49) * 9;
}
export function safeAt(x, y, area = "vale") {
  return (
    area !== "dungeon" &&
    (area === "isle" ||
      area === "house" ||
      VILLAGES.some((v) => Math.hypot(v.x - x, v.y - y) < 10))
  );
}
export function elevation(x, y, area = "vale") {
  if (area === "dungeon" || area === "house") return 0;
  const rolling =
    Math.sin(x * 0.042) * Math.cos(y * 0.036) + Math.sin((x + y) * 0.023) * 0.6;
  const hill = Math.max(0, 1 - Math.hypot(x - 66, y - 91) / 16) * 1.5;
  return 1.2 + Math.floor((rolling * 0.6 + hill) * 3) / 3;
}
export function terrain(x, y, area = "vale") {
  if (area === "house")
    return x < 1 || x > 15 || y < 1 || y > 12 ? "wall" : "room";
  if (area === "dungeon")
    return x < 2 || x > 30 || y < 2 || y > 27 ? "wall" : "stone";
  if (x < 1 || y < 1 || x > WORLD_SIZE - 2 || y > WORLD_SIZE - 2) return "wall";
  if (area === "isle") {
    const distance = Math.hypot((x - 54) * 0.8, y - 64);
    if (distance > 36) return "water";
    return Math.abs(y - 64) < 1.4 ? "path" : distance > 31 ? "sand" : "meadow";
  }
  if (Math.abs(x - riverX(y)) < 3.2 && Math.abs(y - 70) > 1.8) return "water";
  if (
    Math.abs(y - 70) < 1.5 ||
    (Math.abs(x - 48) < 1 && y > 60 && y < 86) ||
    VILLAGES.some((v) => Math.abs(x - v.x) < 1.2 && Math.abs(y - v.y) < 10)
  )
    return "path";
  if (Math.hypot(x - DUNGEON.x, y - DUNGEON.y) < 5) return "stone";
  const woods =
    Math.sin(x * 0.09) + Math.cos(y * 0.075) + Math.sin((x + y) * 0.04);
  return woods > 1.2 ? "woodland" : "meadow";
}
export function treeAt(x, y, area = "vale") {
  if (
    area === "dungeon" ||
    area === "house" ||
    terrain(x, y, area) === "water" ||
    terrain(x, y, area) === "path"
  )
    return false;
  if (
    HOUSES.some(([a, b]) => Math.hypot(a - x, b - y) < 4) ||
    SEALS.some((s) => Math.hypot(s.x - x, s.y - y) < 4) ||
    Math.hypot(x - DUNGEON.x, y - DUNGEON.y) < 6
  )
    return false;
  if (x === 42 && y === 76) return true;
  return (
    hash(x, y) > (terrain(x, y, area) === "woodland" ? 0.953 : 0.992) &&
    !VILLAGES.some((v) => Math.hypot(v.x - x, v.y - y) < 7)
  );
}
export function rockAt(x, y, area = "vale") {
  return (
    area !== "dungeon" &&
    !["water", "path"].includes(terrain(x, y, area)) &&
    !treeAt(x, y, area) &&
    hash(x, y, 184) > 0.989
  );
}
export function walkable(x, y, area = "vale", depleted = {}, time = 0) {
  const xx = Math.round(x),
    yy = Math.round(y),
    t = terrain(xx, yy, area);
  if (t === "water" || t === "wall") return false;
  if (
    area === "house" &&
    ((x < 4.2 && y < 5.2) ||
      Math.hypot(x - 12, y - 7) < 1.2 ||
      (y < 2.2 && x > 6.5 && x < 9.5))
  )
    return false;
  if (
    area === "vale" &&
    HOUSES.some(([a, b]) => Math.abs(x - a) < 1.8 && Math.abs(y - b) < 1.5)
  )
    return false;
  return (
    !treeAt(xx, yy, area) || depleted[`${area}:tree:${xx}:${yy}`]?.until > time
  );
}
export function daylight(clock) {
  const hour =
    ((((clock % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH) / DAY_LENGTH) * 24;
  return {
    hour,
    light: Math.max(
      0.12,
      Math.min(1, 0.16 + Math.sin(((hour - 6) / 24) * Math.PI * 2) * 0.98),
    ),
    night: hour < 5.7 || hour > 19.3,
  };
}
export function zone(p) {
  if (p.area === "house") return "Ein Haus in Lindenruh";
  if (p.area === "dungeon") return "Die Aschengewölbe";
  if (p.area === "isle") return "Insel Morgenstern";
  const v = VILLAGES.find((v) => Math.hypot(p.x - v.x, p.y - v.y) < 10);
  return (
    v?.name ||
    (Math.abs(p.x - riverX(p.y)) < 9
      ? "Am Silberfluss"
      : elevation(p.x, p.y) > 1
        ? "Sonnenhöhen"
        : terrain(p.x, p.y) === "woodland"
          ? "Der lichte Hain"
          : "Die weiten Wiesen")
  );
}
export function maxHp(p) {
  return KNIGHT.hp + (p.level - 1) * 14;
}
export function xpNeeded(p) {
  return 70 + (p.level - 1) * 35;
}
export function makePlayer(name = "Wanderer") {
  return {
    id: "knight",
    name: String(name).trim().slice(0, 20) || "Wanderer",
    kind: "knight",
    gender: "male",
    ...SPAWN,
    hp: 150,
    stamina: 100,
    level: 1,
    xp: 0,
    coins: 30,
    potions: 3,
    fish: 0,
    wood: 0,
    stone: 0,
    ancientWood: 0,
    rareOre: 0,
    damageBonus: 0,
    armor: 0,
    cooldowns: [0, 0, 0, 0],
    attackCd: 0,
    block: 0,
    combo: 0,
    kills: 0,
    facing: { x: 0, y: 1 },
    anim: { kind: "idle", start: 0, duration: 0 },
    input: {},
    mounted: false,
    fishing: null,
    checkpoint: { ...SPAWN },
    story: {
      begun: false,
      elder: false,
      seals: [],
      dragon: false,
      flute: false,
      arrived: false,
      reunited: false,
      fishSinceDragon: 0,
    },
  };
}
export function objective(p) {
  if (p.story.reunited)
    return "Dein Eid lebt weiter. Erkunde, angle und ruhe dich aus.";
  if (p.area === "isle") return "Finde Elara im Garten (66 : 51).";
  if (p.story.flute) return "Rufe deinen Drachen mit F.";
  if (p.story.dragon)
    return "Angle im Silberfluss nach der Mondglasflöte. [E am Ufer]";
  if (p.story.seals.length === 3)
    return "Betritt die Aschengewölbe (125 : 114). [Level 4]";
  if (p.story.elder)
    return `Finde die drei Siegel Aurelions. ${p.story.seals.length}/3 [J]`;
  return "Sprich mit Merin am Brunnen. (51 : 66)";
}
const enemy = (id, x, y, type = "bandit") => ({
  id,
  x,
  y,
  homeX: x,
  homeY: y,
  type,
  hp:
    type === "guardian"
      ? 110
      : type === "boss"
        ? 480
        : type === "skeleton"
          ? 55
          : 65,
  maxHp:
    type === "guardian"
      ? 110
      : type === "boss"
        ? 480
        : type === "skeleton"
          ? 55
          : 65,
  damage: type === "boss" ? 19 : type === "guardian" ? 13 : 10,
  cd: 0,
  dead: false,
  anim: 0,
});

export class World {
  constructor(player = makePlayer()) {
    this.player = player;
    this.time = 0;
    this.clock = (DAY_LENGTH * 8.4) / 24;
    this.weather = "clear";
    this.weatherTimer = 110;
    this.depleted = {};
    this.opened = new Set();
    this.chunks = new Set();
    this.effects = [];
    this.events = [];
    this.mobs = [];
    this.objects = [];
    this.cinematic = null;
    this.dungeon = { active: false, wave: 0, bossDefeated: false };
    this.loadTimer = 0;
    this.npcs = [
      { x: 51, y: 66, name: "Merin", type: "elder" },
      { x: 43, y: 69, name: "Nela", type: "merchant" },
      { x: 48, y: 79, name: "Lio", type: "healer" },
    ];
    for (const s of SEALS)
      this.mobs.push(enemy(`guardian-${s.id}`, s.x + 1, s.y, "guardian"));
    this.ensureArea(48, 73);
  }
  event(type, data = {}) {
    this.events.push({ id: Math.random(), type, ...data });
    if (this.events.length > 50) this.events.shift();
  }
  notify(text) {
    this.event("message", { text });
  }
  animate(kind, duration = 0.65) {
    this.player.anim = {
      kind,
      start: this.time,
      duration,
      facing: { ...this.player.facing },
    };
  }
  effect(x, y, kind, text = "", extra = {}) {
    this.effects.push({
      id: Math.random(),
      x,
      y,
      kind,
      text,
      life: 1,
      maxLife: 1,
      area: this.player.area,
      ...extra,
    });
  }
  startCinematic(id, extra = {}) {
    if (!CINE[id]) return;
    this.player.fishing = null;
    this.player.input = {};
    this.cinematic = { id, time: 0, duration: CINE[id].duration, ...extra };
    if (id === "rest" && extra.untilEvening) {
      const tonight =
        Math.floor(this.clock / DAY_LENGTH) * DAY_LENGTH +
        (DAY_LENGTH * 20) / 24;
      this.cinematic.startClock = this.clock;
      this.cinematic.targetClock =
        tonight > this.clock ? tonight : tonight + DAY_LENGTH;
    }
    this.event("cinematic", { name: id });
  }
  finishCinematic() {
    const c = this.cinematic;
    if (!c) return;
    const p = this.player;
    if (c.id === "prologue") p.story.begun = true;
    if (c.id === "rest") {
      delete p.restBench;
      p.hp = maxHp(p);
      p.stamina = 100;
      if (c.untilEvening) {
        this.clock =
          c.targetClock ??
          Math.floor(this.clock / DAY_LENGTH) * DAY_LENGTH +
            (DAY_LENGTH * 20) / 24;
      }
      this.notify("Ausgeruht. Das Leben ist wieder voll.");
    }
    if (c.id === "dragon") {
      p.story.dragon = true;
      p.area = "vale";
      p.x = DUNGEON.x;
      p.y = DUNGEON.y + 5;
      p.mounted = true;
      this.notify("Ascheflügel vertraut dir. V: Auf- und absteigen.");
    }
    if (c.id === "flight") {
      p.area = c.destination || "isle";
      p.x = 48;
      p.y = 73;
      p.mounted = false;
      p.story.arrived = p.area === "isle" || p.story.arrived;
      p.checkpoint = { x: 48, y: 73, area: p.area };
    }
    if (c.id === "reunion") p.story.reunited = true;
    this.cinematic = null;
    this.event("save");
  }
  ensureArea(px, py) {
    for (
      let cy = Math.max(0, Math.floor(py / 24) - 1);
      cy <= Math.min(31, Math.floor(py / 24) + 1);
      cy++
    )
      for (
        let cx = Math.max(0, Math.floor(px / 24) - 1);
        cx <= Math.min(31, Math.floor(px / 24) + 1);
        cx++
      ) {
        const key = `${cx}:${cy}`;
        if (this.chunks.has(key)) continue;
        this.chunks.add(key);
        for (let y = cy * 24 + 2; y < (cy + 1) * 24; y += 2)
          for (let x = cx * 24 + 2; x < (cx + 1) * 24; x += 2) {
            if (
              !walkable(x, y) ||
              safeAt(x, y) ||
              Math.hypot(x - 48, y - 73) < 16
            )
              continue;
            const h = hash(x, y, 992);
            if (h > 0.985) {
              const id = `chest:${x}:${y}`;
              this.objects.push({
                id,
                x,
                y,
                type: "chest",
                opened: this.opened.has(id),
              });
            }
            if (
              h > 0.974 &&
              h < 0.983 &&
              SEALS.every((s) => Math.hypot(x - s.x, y - s.y) > 7)
            )
              this.mobs.push(
                enemy(
                  `mob:${x}:${y}`,
                  x,
                  y,
                  hash(x, y, 5) > 0.5 ? "skeleton" : "bandit",
                ),
              );
          }
      }
  }
  move(entity, dx, dy) {
    const p = this.player,
      area = entity.area || p.area;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 4),
    );
    for (let i = 0; i < steps; i++) {
      const nx = entity.x + dx / steps,
        ny = entity.y + dy / steps;
      if (walkable(nx, entity.y, area, this.depleted, this.time)) entity.x = nx;
      if (walkable(entity.x, ny, area, this.depleted, this.time)) entity.y = ny;
    }
  }
  update(dt) {
    this.time += dt;
    if (this.cinematic) {
      this.cinematic.time += dt;
      if (this.cinematic.targetClock !== undefined) {
        const c = this.cinematic,
          t = Math.min(1, c.time / c.duration);
        this.clock =
          c.startClock + (c.targetClock - c.startClock) * (t * t * (3 - 2 * t));
      }
      if (this.cinematic.time >= this.cinematic.duration)
        this.finishCinematic();
      return;
    }
    const p = this.player;
    this.clock += dt;
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weather =
        Math.random() < 0.72 ? "clear" : Math.random() < 0.8 ? "rain" : "storm";
      this.weatherTimer = 100 + Math.random() * 150;
    }
    if (p.hp <= 0) {
      this.effects = this.effects.filter((e) => (e.life -= dt) > 0);
      return;
    }
    this.loadTimer -= dt;
    if (p.area === "vale" && this.loadTimer <= 0) {
      this.ensureArea(p.x, p.y);
      this.loadTimer = 1;
    }
    const inp = p.input || {};
    let dx = +!!inp.right - +!!inp.left,
      dy = +!!inp.down - +!!inp.up;
    const moving = dx || dy;
    if (moving) {
      if (p.fishing) {
        p.fishing = null;
        this.notify("Du holst die Angel ein.");
      }
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      p.facing = { x: dx, y: dy };
      const sprint = inp.sprint && p.stamina > 3;
      this.move(
        p,
        dx * (p.mounted ? 9 : KNIGHT.speed) * (sprint ? 1.55 : 1) * dt,
        dy * (p.mounted ? 9 : KNIGHT.speed) * (sprint ? 1.55 : 1) * dt,
      );
      p.stamina = Math.max(0, p.stamina - (sprint && !p.mounted ? 23 * dt : 0));
    }
    p.stamina = Math.min(100, p.stamina + dt * (moving && inp.sprint ? 0 : 17));
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.block = Math.max(0, p.block - dt);
    p.cooldowns = p.cooldowns.map((c) => Math.max(0, c - dt));
    if (safeAt(p.x, p.y, p.area)) {
      p.hp = Math.min(maxHp(p), p.hp + dt * 2);
    }
    if (p.fishing) {
      p.fishing.elapsed += dt;
      if (!p.fishing.bite && p.fishing.elapsed >= p.fishing.wait) {
        p.fishing.bite = true;
        this.notify("Ein Biss! Jetzt E drücken.");
        this.event("sound", { name: "bite" });
      }
      if (p.fishing.elapsed > p.fishing.wait + 2.2) {
        p.fishing = null;
        this.notify("Der Fisch entwischt. Versuch es noch einmal.");
      }
    }
    if (!p.fishing && p.area === "dungeon") this.updateDungeon();
    const mobs = this.activeMobs();
    for (const m of mobs) {
      if (m.dead) continue;
      m.cd = Math.max(0, m.cd - dt);
      const distance = Math.hypot(m.x - p.x, m.y - p.y);
      if (distance < 10 && !safeAt(p.x, p.y, p.area)) {
        if (distance > 1.4)
          this.move(
            m,
            ((p.x - m.x) / distance) * (m.type === "boss" ? 1.6 : 2) * dt,
            ((p.y - m.y) / distance) * (m.type === "boss" ? 1.6 : 2) * dt,
          );
        else if (m.cd <= 0) {
          const raw =
              m.damage + (m.type === "boss" && m.hp < m.maxHp * 0.4 ? 5 : 0),
            damage = Math.max(
              1,
              Math.round(
                (raw - KNIGHT.defense - p.armor) * (p.block > 0 ? 0.25 : 1),
              ),
            );
          p.hp = Math.max(0, p.hp - damage);
          m.cd = m.type === "boss" ? 1.3 : 1.7;
          m.anim = this.time;
          this.effect(p.x, p.y, p.block > 0 ? "block" : "damage", `-${damage}`);
          this.event("sound", { name: p.block > 0 ? "shield" : "hurt" });
          if (p.hp === 0) {
            p.fishing = null;
            p.mounted = false;
            this.animate("death", 2);
            this.notify("Der Eid bleibt. Kehre am letzten Rastplatz zurück.");
          }
        }
      }
    }
    this.effects = this.effects.filter((e) => (e.life -= dt) > 0);
  }
  activeMobs() {
    return this.mobs.filter((m) =>
      this.player.area === "dungeon"
        ? m.dungeon
        : this.player.area === "vale"
          ? !m.dungeon
          : false,
    );
  }
  gainXp(amount) {
    const p = this.player;
    p.xp += amount;
    while (p.xp >= xpNeeded(p)) {
      p.xp -= xpNeeded(p);
      p.level++;
      p.hp = maxHp(p);
      this.notify(`Rang ${p.level}. Dein Eid wird stärker.`);
      this.event("sound", { name: "level" });
    }
  }
  attack(slot = -1) {
    const p = this.player;
    if (p.hp <= 0 || this.cinematic || p.fishing) return false;
    if (p.attackCd > 0 && slot < 0) return false;
    const skill = SKILLS[slot];
    if (
      slot >= 0 &&
      (!skill ||
        p.level < skill.level ||
        p.cooldowns[slot] > 0 ||
        p.stamina < skill.cost)
    )
      return false;
    if (slot >= 0) {
      p.stamina -= skill.cost;
      p.cooldowns[slot] = skill.cd;
    }
    if (slot === 1) {
      p.block = 6;
      this.animate("block", 0.8);
      this.effect(p.x, p.y, "block");
      this.event("sound", { name: "shield" });
      return true;
    }
    if (slot === 3) {
      p.hp = Math.min(maxHp(p), p.hp + 55);
      p.block = 4;
      this.animate("rally", 1.1);
      this.effect(p.x, p.y, "heal", "+55");
      this.event("sound", { name: "heal" });
      return true;
    }
    if (slot === 2) this.move(p, p.facing.x * 3.5, p.facing.y * 3.5);
    const range = slot === 0 ? 4 : slot === 2 ? 3.5 : KNIGHT.range;
    const targets = this.activeMobs()
      .filter((m) => !m.dead && Math.hypot(m.x - p.x, m.y - p.y) <= range)
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      );
    if (targets[0]) {
      const d = Math.hypot(targets[0].x - p.x, targets[0].y - p.y);
      if (d > 0.01)
        p.facing = { x: (targets[0].x - p.x) / d, y: (targets[0].y - p.y) / d };
    }
    p.combo = (p.combo + 1) % 3;
    p.attackCd = slot === 2 ? 0.6 : 0.55;
    this.animate(
      slot === 0 ? "cleave" : slot === 2 ? "charge" : `slash${p.combo}`,
      0.55,
    );
    this.event("sound", { name: "slash" });
    this.effect(p.x, p.y, "slash", "", {
      angle: Math.atan2(p.facing.y, p.facing.x),
    });
    for (const m of targets.slice(0, slot >= 0 ? 8 : 2)) {
      const damage = Math.round(
        (KNIGHT.damage + p.damageBonus + (p.level - 1) * 3) *
          (slot === 0 ? 1.8 : slot === 2 ? 1.4 : p.combo === 0 ? 1.3 : 1),
      );
      m.hp -= damage;
      this.effect(m.x, m.y, "hit", `-${damage}`);
      if (m.hp <= 0) {
        m.hp = 0;
        m.dead = true;
        p.kills++;
        p.coins += m.type === "boss" ? 120 : m.type === "guardian" ? 25 : 8;
        this.gainXp(m.type === "boss" ? 220 : m.type === "guardian" ? 100 : 30);
        this.event("sound", { name: "loot" });
        if (m.type === "boss") {
          this.dungeon.bossDefeated = true;
          this.notify("Die Ketten brechen. Gehe zum Drachen am Nordtor.");
        }
      }
    }
    return true;
  }
  nearest() {
    const p = this.player;
    if (p.area === "house") {
      if (Math.hypot(p.x - 8, p.y - 11) < 2.5)
        return { type: "leaveHouse", name: "Nach draußen", x: 8, y: 11 };
      if (Math.hypot(p.x - 3, p.y - 5) < 2.6)
        return { type: "bench", name: "Am Bett ausruhen", x: 3, y: 5 };
      return null;
    }
    if (p.area === "isle")
      return Math.hypot(p.x - 66, p.y - 51) < 3
        ? { type: "princess", name: "Elara", x: 66, y: 51 }
        : null;
    if (p.area === "dungeon") {
      if (Math.hypot(p.x - 16, p.y - 25) < 2.5)
        return { type: "exit", name: "Zurück ins Freie", x: 16, y: 25 };
      if (this.dungeon.bossDefeated && Math.hypot(p.x - 16, p.y - 6) < 3)
        return { type: "dragon", name: "Den Drachen befreien", x: 16, y: 6 };
      return null;
    }
    const nodes = [
      ...HOUSES.map(([x, y], id) => ({
        type: "house",
        name: "Haus betreten",
        x,
        y: y + 2.5,
        id,
      })),
      ...this.npcs,
      ...BENCHES.map((b) => ({
        ...b,
        type: "bench",
        name: "Auf der Bank rasten",
      })),
      ...SEALS.filter((s) => !p.story.seals.includes(s.id)).map((s) => ({
        ...s,
        type: "seal",
      })),
      ...this.objects.filter((o) => !o.opened),
      { ...DUNGEON, type: "dungeon", name: "Aschengewölbe betreten" },
    ];
    return nodes
      .filter((o) => Math.hypot(o.x - p.x, o.y - p.y) < 3)
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0];
  }
  atRiver() {
    const p = this.player;
    return (
      p.area === "vale" &&
      Math.abs(p.x - riverX(p.y)) >= 3 &&
      Math.abs(p.x - riverX(p.y)) < 6
    );
  }
  interact() {
    const p = this.player;
    if (this.cinematic || p.hp <= 0) return;
    if (p.fishing) {
      if (p.fishing.bite) this.catchFish();
      else this.notify("Die Pose tanzt. Warte auf einen Biss …");
      return;
    }
    const n = this.nearest();
    if (!n) {
      if (this.atRiver()) this.fish();
      else this.notify("Folge den Wegen. J öffnet dein Reisetagebuch.");
      return;
    }
    if (n.type === "house") {
      p.returnTo = { x: n.x, y: n.y + 1, area: "vale" };
      p.area = "house";
      p.x = 8;
      p.y = 9;
      p.mounted = false;
      return;
    }
    if (n.type === "leaveHouse") {
      Object.assign(p, p.returnTo || SPAWN);
      return;
    }
    if (n.type === "elder") {
      this.event("dialogue", {
        speaker: "Merin",
        lines: p.story.elder
          ? [
              "Die drei Siegel liegen am alten Tor, am Strom und auf der Glutwiese.",
              "Die Gewölbe öffnen sich nur einem Ritter von Rang 4. Ein alter Drache wartet dort.",
            ]
          : [
              "Dein Schild … du kommst aus Aurelion. Wir sahen den Rauch noch tagelang.",
              "Elara lebte, als die königliche Wache den Silberfluss überquerte. Jenseits des Nebels verlor sich ihre Spur.",
              "Finde die drei Siegel. Befreie das Herz unter der Asche. Vielleicht kennt es noch den Weg zu ihr.",
            ],
        resolve: "elder",
      });
      return;
    }
    if (n.type === "merchant") {
      this.event("panel", { panel: "shop" });
      return;
    }
    if (n.type === "healer") {
      p.hp = maxHp(p);
      p.potions = Math.max(p.potions, 2);
      this.animate("rally", 1);
      this.notify("Lio versorgt deine Wunden und füllt zwei Tränke auf.");
      return;
    }
    if (n.type === "bench") {
      this.event("panel", { panel: "rest", bench: n });
      return;
    }
    if (n.type === "seal") {
      if (!p.story.elder) {
        this.notify(
          "Die Schrift ist dir fremd. Merin kennt die alten Zeichen.",
        );
        return;
      }
      const guard = this.mobs.find((m) => m.id === `guardian-${n.id}`);
      if (guard && !guard.dead) {
        this.notify("Ein Aschenwächter bewacht dieses Siegel.");
        return;
      }
      p.story.seals.push(n.id);
      p.coins += 20;
      this.gainXp(60);
      this.event("dialogue", {
        speaker: n.name,
        lines: [
          `Das ${n.name.toLowerCase()} liegt warm in deiner Hand.`,
          p.story.seals.length === 3
            ? "Drei Lichter. Ein Schlüssel. Die Aschengewölbe rufen."
            : "Für einen Herzschlag riechst du den Garten eures verlorenen Königreichs.",
        ],
      });
      return;
    }
    if (n.type === "chest") {
      n.opened = true;
      this.opened.add(n.id);
      p.coins += 18;
      p.potions++;
      this.notify("Eine alte Kiste: 18 Gold und ein Heiltrank.");
      this.event("sound", { name: "loot" });
      return;
    }
    if (n.type === "dungeon") {
      if (p.story.dragon) {
        this.notify("Die Gewölbe sind still. Ascheflügel ist bereits bei dir.");
        return;
      }
      if (p.story.seals.length < 3 || p.level < 4) {
        this.notify("Das Tor verlangt drei Siegel und Rang 4.");
        return;
      }
      p.area = "dungeon";
      p.x = 16;
      p.y = 23;
      p.mounted = false;
      this.dungeon = { active: true, wave: 0, bossDefeated: false };
      this.mobs = this.mobs.filter((m) => !m.dungeon);
      this.updateDungeon();
      this.notify("Aschengewölbe: bezwinge die Wachen und ihren Hüter.");
      return;
    }
    if (n.type === "exit") {
      p.area = "vale";
      p.x = DUNGEON.x;
      p.y = DUNGEON.y + 4;
      return;
    }
    if (n.type === "dragon") {
      this.startCinematic("dragon");
      return;
    }
    if (n.type === "princess") {
      if (!p.story.reunited) this.startCinematic("reunion");
      else
        this.event("dialogue", {
          speaker: "Elara",
          lines: [
            "Bleib noch eine Weile. Hörst du die Bienen zwischen den Blumen?",
            "Manchmal ist ein ganz gewöhnlicher Morgen das größte Abenteuer.",
          ],
        });
    }
  }
  resolveDialogue(id) {
    if (id === "elder") {
      this.player.story.elder = true;
      this.event("save");
    }
  }
  updateDungeon() {
    if (!this.dungeon.active || this.dungeon.bossDefeated) return;
    const living = this.mobs.some((m) => m.dungeon && !m.dead);
    if (living) return;
    if (this.dungeon.wave < 2) {
      this.dungeon.wave++;
      for (let i = 0; i < 3; i++)
        this.mobs.push({
          ...enemy(
            `dungeon-${this.dungeon.wave}-${i}`,
            9 + i * 7,
            8 + this.dungeon.wave * 3,
            "skeleton",
          ),
          dungeon: true,
        });
      this.notify(`Wache ${this.dungeon.wave}/2 erwacht.`);
    } else if (this.dungeon.wave === 2) {
      this.dungeon.wave = 3;
      this.mobs.push({ ...enemy("ash-warden", 16, 8, "boss"), dungeon: true });
      this.notify("Der Aschenhüter erhebt sein Schwert.");
    }
  }
  fish() {
    const p = this.player;
    if (p.mounted) {
      this.notify("Steige mit V ab, um die Angel auszuwerfen.");
      return;
    }
    if (!this.atRiver() || p.hp <= 0) return;
    p.fishing = { elapsed: 0, wait: 3.5 + Math.random() * 1.5, bite: false };
    this.animate("fish", 60);
    this.notify("Du wirfst aus. E drücken, wenn die Pose beißt.");
    this.event("sound", { name: "cast" });
  }
  catchFish() {
    const p = this.player;
    if (!p.fishing?.bite) return;
    p.fishing = null;
    this.animate("reel", 1.1);
    p.fish++;
    p.coins += 4;
    this.gainXp(12);
    this.event("sound", { name: "loot" });
    if (p.story.dragon && !p.story.flute) {
      p.story.fishSinceDragon++;
      if (p.story.fishSinceDragon >= 3 || Math.random() < 0.25) {
        p.story.flute = true;
        this.notify("Eine Mondglasflöte! Ascheflügel antwortet auf ihr Lied.");
        this.startCinematic("flight", { destination: "isle" });
        return;
      }
    }
    this.notify("Ein Silberfisch! Im Gepäck essen, um Leben zu heilen.");
  }
  gather() {
    const p = this.player;
    if (
      p.hp <= 0 ||
      this.cinematic ||
      p.attackCd > 0 ||
      p.area === "dungeon" ||
      p.area === "house" ||
      p.mounted
    )
      return;
    let near;
    for (let y = Math.round(p.y) - 2; y <= Math.round(p.y) + 2; y++)
      for (let x = Math.round(p.x) - 2; x <= Math.round(p.x) + 2; x++) {
        const type = treeAt(x, y, p.area)
          ? "tree"
          : rockAt(x, y, p.area)
            ? "rock"
            : null;
        if (type && Math.hypot(x - p.x, y - p.y) < 2.8) {
          const id = `${p.area}:${type}:${x}:${y}`;
          if (
            !(this.depleted[id]?.until > this.time) &&
            (!near ||
              Math.hypot(x - p.x, y - p.y) <
                Math.hypot(near.x - p.x, near.y - p.y))
          )
            near = { x, y, type, id };
        }
      }
    if (!near) {
      this.notify("Gehe näher an einen Baum oder Felsen.");
      return;
    }
    p.attackCd = 0.7;
    this.animate(near.type === "tree" ? "chop" : "mine", 0.7);
    this.event("sound", { name: near.type === "tree" ? "chop" : "mine" });
    const state = this.depleted[near.id] || { hits: 0, until: 0 };
    if (state.until && state.until <= this.time) state.hits = 0;
    state.hits++;
    this.depleted[near.id] = state;
    this.effect(near.x, near.y, "chips");
    if (state.hits >= 3) {
      state.until = this.time + 240;
      state.hits = 0;
      const amount = 2 + Math.floor(hash(near.x, near.y, 88) * 3);
      p[near.type === "tree" ? "wood" : "stone"] += amount;
      const rare = hash(near.x, near.y, 915) > 0.975;
      if (rare) p[near.type === "tree" ? "ancientWood" : "rareOre"]++;
      this.effect(near.x, near.y, "fall", "", {
        resource: near.type,
        life: 1.5,
        maxLife: 1.5,
      });
      this.notify(
        `+${amount} ${near.type === "tree" ? "Holz" : "Stein"}${rare ? " und ein seltener Fund." : ""}`,
      );
    }
  }
  action(type, data) {
    const p = this.player;
    if (type === "skip-cinematic") {
      this.finishCinematic();
      return;
    }
    if (type === "respawn") {
      if (p.hp > 0) return;
      Object.assign(p, p.checkpoint);
      p.hp = maxHp(p);
      p.stamina = 100;
      p.coins = Math.floor(p.coins * 0.95);
      p.fishing = null;
      p.block = 0;
      this.animate("respawn", 1.6);
      this.effect(p.x, p.y, "heal");
      this.notify("Ein neuer Atemzug. Dein Eid ist noch nicht erfüllt.");
      return;
    }
    if (p.hp <= 0 || this.cinematic) return;
    if (type === "attack") this.attack();
    if (type === "skill") this.attack(data);
    if (type === "interact") this.interact();
    if (type === "gather") this.gather();
    if (type === "rest") {
      const b = this.nearest();
      if (b?.type === "bench") {
        p.restBench = { x: b.x, y: b.y };
        p.checkpoint = { x: p.x, y: p.y, area: p.area };
      }
      p.fishing = null;
      p.mounted = false;
      this.animate("sit", 6);
      this.startCinematic("rest", { untilEvening: data === "evening" });
    }
    if (type === "mount") {
      if (!p.story.dragon || !["vale", "isle"].includes(p.area)) return;
      p.mounted = !p.mounted;
      this.animate(p.mounted ? "mount" : "idle", 1.2);
      this.event("sound", { name: "dragon" });
    }
    if (type === "flute") {
      if (p.story.dragon && p.story.flute && ["vale", "isle"].includes(p.area))
        this.startCinematic("flight", {
          destination: p.area === "isle" ? "vale" : "isle",
        });
      else this.notify("Die Mondglasflöte ist noch nicht in deinem Gepäck.");
    }
    if (type === "potion" && p.potions > 0 && p.hp < maxHp(p)) {
      p.potions--;
      p.hp = Math.min(maxHp(p), p.hp + 60);
      this.animate("drink", 0.9);
      this.effect(p.x, p.y, "heal", "+60");
      this.event("sound", { name: "heal" });
    }
    if (type === "eat" && p.fish > 0 && p.hp < maxHp(p)) {
      p.fish--;
      p.hp = Math.min(maxHp(p), p.hp + 35);
      this.animate("drink", 0.9);
    }
    if (type === "buy") {
      if (
        !this.npcs.some(
          (n) =>
            n.type === "merchant" &&
            p.area === "vale" &&
            Math.hypot(p.x - n.x, p.y - n.y) < 4,
        )
      )
        return;
      const costs = [16, 80, 65];
      if (!Number.isInteger(data) || !costs[data] || p.coins < costs[data]) {
        this.notify("Dafür fehlt dir noch Gold.");
        return;
      }
      p.coins -= costs[data];
      if (data === 0) p.potions++;
      if (data === 1) p.damageBonus += 5;
      if (data === 2) p.armor += 2;
      this.notify("Nela legt dir die Ware in die Hand.");
    }
  }
  serialize() {
    return {
      version: 3,
      player: this.player,
      time: this.time,
      clock: this.clock,
      depleted: this.depleted,
      opened: [...this.opened],
      dead: this.mobs.filter((m) => m.dead && !m.dungeon).map((m) => m.id),
      dungeon: this.dungeon,
      dungeonMobs: this.mobs.filter((m) => m.dungeon),
      cinematic: this.cinematic,
    };
  }
  static restore(data) {
    const defaults = makePlayer(data?.player?.name);
    const raw = data?.player || {};
    const p = {
      ...defaults,
      ...raw,
      kind: "knight",
      gender: "male",
      input: {},
      fishing: null,
      cooldowns: [0, 0, 0, 0],
      story: { ...defaults.story, ...raw.story },
      checkpoint: { ...SPAWN, ...raw.checkpoint },
    };
    if (data?.version !== 3) {
      Object.assign(p, {
        ...SPAWN,
        kind: "knight",
        gender: "male",
        mounted: false,
        hp: maxHp(p),
      });
      p.story = { ...defaults.story };
    }
    p.x = Number.isFinite(p.x) ? p.x : 48;
    p.y = Number.isFinite(p.y) ? p.y : 73;
    p.level = Math.max(1, Number(p.level) || 1);
    p.hp = Math.max(0, Math.min(maxHp(p), Number(p.hp) || 0));
    if (!["vale", "dungeon", "isle", "house"].includes(p.area)) p.area = "vale";
    const w = new World(p);
    if (data?.version === 3) {
      w.time = data.time || 0;
      w.clock = data.clock ?? w.clock;
      w.depleted = data.depleted || {};
      w.opened = new Set(data.opened || []);
      w.ensureArea(p.x, p.y);
      for (const m of w.mobs) if (data.dead?.includes(m.id)) m.dead = true;
      w.objects.forEach((o) => (o.opened = w.opened.has(o.id)));
      w.dungeon = data.dungeon || w.dungeon;
      w.mobs.push(...(data.dungeonMobs || []));
      w.cinematic = data.cinematic || null;
    }
    return w;
  }
}
