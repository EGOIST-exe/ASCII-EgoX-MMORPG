export const WORLD_SIZE = 768;
export const SEED = 71839;
export const VILLAGES = [
  { x: 48, y: 70, name: "Immerhain" },
  { x: 141, y: 142, name: "Dämmerwacht" },
  { x: 68, y: 27, name: "Frostwacht" },
  { x: 325, y: 330, name: "Sonnenwacht" },
  { x: 580, y: 560, name: "Moosgrund" },
  { x: 430, y: 95, name: "Nordwind" },
];
export const HOUSES = [
  [41, 63, 0],
  [54, 61, 1],
  [53, 80, 2],
  [136, 136, 0],
  [147, 138, 1],
  [62, 23, 0],
  [74, 24, 1],
  [320, 324, 0],
  [331, 326, 1],
  [575, 554, 0],
  [586, 557, 1],
  [425, 89, 0],
  [436, 91, 1],
];
export const RUINS = [
  [61, 75],
  [34, 89],
  [86, 57],
  [27, 155],
  [166, 114],
  [250, 280],
  [460, 420],
  [650, 640],
];
export const safeAt = (x, y) =>
  VILLAGES.some((v) => Math.hypot(x - v.x, y - v.y) < 10);
export function hash(x, y, seed = SEED) {
  let n = Math.imul(x ^ seed, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function riverX(y) {
  return (
    111 +
    Math.sin(y / 15) * 8 +
    Math.sin(y / 36) * 11 +
    Math.max(0, y - 180) * 0.45
  );
}
export function groundHeight(x, y) {
  return (
    Math.sin(x * 0.14) * Math.cos(y * 0.11) * 0.16 +
    Math.sin(x * 0.035 + y * 0.045) * 0.24
  );
}
export function terrain(x, y) {
  if (x < 1 || y < 1 || x >= WORLD_SIZE - 1 || y >= WORLD_SIZE - 1)
    return "wall";
  if (
    Math.abs(x - riverX(y)) < 3.7 &&
    ![70, 142, 330, 560].some((v) => Math.abs(y - v) < 2)
  )
    return "water";
  if (
    VILLAGES.some(
      (v) =>
        (Math.abs(x - v.x) < 1.25 && Math.abs(y - v.y) < 12) ||
        (Math.abs(y - v.y) < 1.5 && Math.abs(x - v.x) < 12),
    )
  )
    return "path";
  if (
    Math.abs(y - 70) < 1.7 ||
    Math.abs(y - 330) < 1.7 ||
    (Math.abs(x - 48) < 1.2 && y > 39 && y < 150)
  )
    return "path";
  if (y < 35 || (y < 160 && x > 250)) return "snow";
  if ((x > 145 && y > 105 && x < 215) || (x > 470 && y > 430)) return "marsh";
  if ((x < 44 && y > 130) || (x > 250 && x < 340 && y > 400)) return "ruins";
  return "grass";
}
export function zone(x, y) {
  const v = VILLAGES.find((v) => Math.hypot(x - v.x, y - v.y) < 10);
  if (v) return v.name;
  const t = terrain(x, y);
  return t === "snow"
    ? "Frostkamm"
    : t === "marsh"
      ? "Flüstersümpfe"
      : t === "ruins"
        ? "Vergessene Ruinen"
        : x > riverX(y)
          ? "Orkische Grenzlande"
          : "Immergrüner Wald";
}
export function treeAt(x, y) {
  if (x === 40 && y === 77) return true;
  if (
    !["grass", "snow", "marsh"].includes(terrain(x, y)) ||
    HOUSES.some(([a, b]) => Math.hypot(a - x, b - y) < 4) ||
    RUINS.some(([a, b]) => Math.hypot(a - x, b - y) < 4)
  )
    return false;
  return (
    !VILLAGES.some((v) => Math.hypot(x - v.x, y - v.y) < 7) &&
    hash(x, y) > 0.905 &&
    Math.abs(y - 70) > 3
  );
}
export function rockAt(x, y) {
  return (
    (x === 51 && y === 76) ||
    (!["path", "water", "wall"].includes(terrain(x, y)) &&
      !treeAt(x, y) &&
      !safeAt(x, y) &&
      hash(x, y, 184) > 0.982)
  );
}
export function walkable(x, y, depleted = {}, time = 0) {
  const rx = Math.round(x),
    ry = Math.round(y),
    t = terrain(rx, ry);
  const house = HOUSES.some(
    ([bx, by]) => Math.abs(x - bx) < 2.1 && Math.abs(y - by) < 1.8,
  );
  const pillar = RUINS.some(
    ([bx, by]) =>
      (Math.abs(x - (bx - 2)) < 0.65 || Math.abs(x - (bx + 2)) < 0.65) &&
      Math.abs(y - by) < 0.65,
  );
  return (
    t !== "water" &&
    t !== "wall" &&
    !house &&
    !pillar &&
    (!treeAt(rx, ry) || depleted[`tree:${rx}:${ry}`]?.until > time)
  );
}
export function interiorWalkable(x, z) {
  return (
    Math.abs(x) <= 2.6 &&
    Math.abs(z) <= 2.6 &&
    !(x < -1.3 && z < -0.35) &&
    !(Math.hypot(x - 1.65, z - 0.55) < 0.85) &&
    !(
      Math.abs(x - 1.65) < 0.45 &&
      (Math.abs(z + 0.5) < 0.4 || Math.abs(z - 1.65) < 0.4)
    ) &&
    !(z < -2.15 && x > -0.9)
  );
}
export const CLASSES = {
  mage: {
    name: "Magier",
    role: "FERNKAMPF · ARKANE MAGIE",
    title: "Erbe der Sterne",
    color: "#a798f2",
    glyph: "*",
    weapon: "Kristallstab",
    hp: 72,
    mana: 150,
    damage: 20,
    range: 9,
    speed: 3.7,
    defense: 0,
    attackRate: 0.85,
    desc: "Wenig Leben. Enorme Reichweite. Entfessle Feuer, Frost und arkane Stürme aus sicherer Entfernung.",
    skills: [
      {
        name: "Arkanblitz",
        icon: "*",
        cost: 14,
        cd: 2,
        power: 1.9,
        range: 11,
        effect: "arcane",
      },
      {
        name: "Frostnova",
        icon: "❄",
        cost: 26,
        cd: 8,
        power: 1.3,
        area: 5,
        root: 2,
        effect: "frost",
      },
      {
        name: "Meteor",
        icon: "☄",
        cost: 38,
        cd: 12,
        power: 3.5,
        area: 7,
        effect: "fire",
      },
      {
        name: "Seelenquell",
        icon: "+",
        cost: 32,
        cd: 16,
        heal: 32,
        effect: "heal",
      },
      {
        name: "Kettenblitz",
        icon: "ϟ",
        cost: 30,
        cd: 8,
        power: 2.2,
        area: 8,
        effect: "lightning",
      },
      {
        name: "Zeitriss",
        icon: "◇",
        cost: 34,
        cd: 12,
        power: 1.7,
        area: 7,
        root: 3,
        effect: "arcane",
      },
    ],
  },
  samurai: {
    name: "Samurai",
    role: "NAHKAMPF · GESCHWINDIGKEIT",
    title: "Klinge des Windes",
    color: "#e18172",
    glyph: "/",
    weapon: "Mondstahl-Katana",
    hp: 105,
    mana: 85,
    damage: 22,
    range: 2.8,
    speed: 5.2,
    defense: 1,
    attackRate: 0.38,
    desc: "Geschick, Tempo und präzise Schnitte. Schließe Distanzen mit Windschritten und dominiere im Nahkampf.",
    skills: [
      {
        name: "Mondhieb",
        icon: "/",
        cost: 12,
        cd: 1.8,
        power: 1.7,
        area: 3,
        effect: "slash",
      },
      {
        name: "Windschritt",
        icon: "»",
        cost: 20,
        cd: 5,
        dash: 5,
        power: 1.4,
        area: 3,
        effect: "dash",
      },
      {
        name: "Klingensturm",
        icon: "╳",
        cost: 28,
        cd: 9,
        power: 2.3,
        area: 4,
        effect: "slash",
      },
      {
        name: "Meditation",
        icon: "+",
        cost: 22,
        cd: 16,
        heal: 28,
        effect: "heal",
      },
      {
        name: "Morgenröte",
        icon: "⌁",
        cost: 30,
        cd: 9,
        power: 3,
        area: 3,
        effect: "fire",
      },
      {
        name: "Schattenhieb",
        icon: "∠",
        cost: 24,
        cd: 7,
        dash: 3,
        power: 2.5,
        area: 3,
        effect: "dash",
      },
    ],
  },
  elf: {
    name: "Elf",
    role: "HEILUNG · NATURKONTROLLE",
    title: "Hüter des Lebens",
    color: "#80d7aa",
    glyph: "ψ",
    weapon: "Stab der Ranken",
    hp: 98,
    mana: 145,
    damage: 10,
    range: 7,
    speed: 4.1,
    defense: 1,
    attackRate: 0.75,
    desc: "Heile deine Gefährten und halte Feinde mit lebendigen Ranken fest. Die Kraft des Waldes schützt eure Gruppe.",
    skills: [
      {
        name: "Lebensblüte",
        icon: "+",
        cost: 22,
        cd: 5,
        heal: 44,
        allyRange: 9,
        effect: "heal",
      },
      {
        name: "Wurzelfessel",
        icon: "ψ",
        cost: 24,
        cd: 8,
        power: 0.8,
        area: 6,
        root: 3.5,
        effect: "roots",
      },
      {
        name: "Waldsegen",
        icon: "✧",
        cost: 36,
        cd: 12,
        heal: 65,
        allyRange: 11,
        effect: "heal",
      },
      {
        name: "Dornenmal",
        icon: "♧",
        cost: 24,
        cd: 7,
        power: 1.4,
        area: 7,
        weaken: 6,
        effect: "roots",
      },
      {
        name: "Smaragdlicht",
        icon: "*",
        cost: 26,
        cd: 5,
        power: 2,
        range: 10,
        effect: "nature",
      },
      {
        name: "Uralter Hain",
        icon: "♜",
        cost: 40,
        cd: 18,
        heal: 75,
        allyRange: 12,
        shield: 6,
        effect: "heal",
      },
    ],
  },
  paladin: {
    name: "Paladin",
    role: "VERTEIDIGUNG · SCHILD",
    title: "Eid des Morgenlichts",
    color: "#e7c778",
    glyph: "†",
    weapon: "Eidschwert & Schild",
    hp: 185,
    mana: 95,
    damage: 18,
    range: 2.8,
    speed: 2.9,
    defense: 5,
    attackRate: 0.8,
    desc: "Schwerer Schild. Ungebrochener Eid. Viel Leben und starke Verteidigung, dafür ein langsamerer Schritt.",
    skills: [
      {
        name: "Lichthieb",
        icon: "†",
        cost: 14,
        cd: 2.5,
        power: 1.8,
        area: 3,
        effect: "holy",
      },
      {
        name: "Bollwerk",
        icon: "♜",
        cost: 25,
        cd: 12,
        shield: 7,
        effect: "shield",
      },
      {
        name: "Sonnenzorn",
        icon: "☼",
        cost: 32,
        cd: 10,
        power: 2.4,
        area: 5,
        effect: "holy",
      },
      {
        name: "Heiliger Eid",
        icon: "+",
        cost: 30,
        cd: 16,
        heal: 35,
        effect: "heal",
      },
      {
        name: "Schildstoß",
        icon: "‡",
        cost: 22,
        cd: 7,
        power: 1.8,
        area: 3,
        root: 2,
        effect: "shield",
      },
      {
        name: "Weihe",
        icon: "⊕",
        cost: 34,
        cd: 14,
        power: 1.7,
        area: 6,
        heal: 22,
        effect: "holy",
      },
    ],
  },
};
export const MOB_TYPES = [
  {
    name: "Slime",
    color: "#80b94d",
    hp: 30,
    damage: 7,
    xp: 18,
    coins: 5,
    speed: 1.5,
  },
  {
    name: "Skelett",
    color: "#d0c9b3",
    hp: 50,
    damage: 10,
    xp: 26,
    coins: 8,
    speed: 2,
  },
  {
    name: "Zombie",
    color: "#91a477",
    hp: 65,
    damage: 11,
    xp: 30,
    coins: 9,
    speed: 1.4,
  },
  {
    name: "Bandit",
    color: "#cf9871",
    hp: 70,
    damage: 13,
    xp: 35,
    coins: 12,
    speed: 2.5,
  },
  {
    name: "Ork",
    color: "#80a657",
    hp: 100,
    damage: 17,
    xp: 45,
    coins: 16,
    speed: 1.9,
  },
  {
    name: "Echsenmensch",
    color: "#53b79b",
    hp: 85,
    damage: 14,
    xp: 40,
    coins: 14,
    speed: 2.6,
  },
];
export function makePlayer(
  kind = "elf",
  name = "Wanderer",
  gender = "female",
  tint = 0,
) {
  if (!CLASSES[kind]) kind = "elf";
  const c = CLASSES[kind];
  return {
    id: "local",
    name: String(name).trim().slice(0, 20) || "Wanderer",
    kind,
    gender,
    tint,
    x: 48,
    y: 73,
    hp: c.hp,
    mana: c.mana,
    stamina: 100,
    level: 1,
    xp: 0,
    coins: 35,
    kills: 0,
    chests: 0,
    shrines: 0,
    potions: 3,
    ammo: 60,
    unlocked: [0, 1],
    cooldowns: [0, 0, 0, 0],
    attackCd: 0,
    buff: 0,
    armor: 0,
    damageBonus: 0,
    weapon: c.weapon,
    inventory: [
      {
        id: "starter",
        name: c.weapon,
        type: "weapon",
        bonus: 0,
        equipped: true,
        kind,
      },
    ],
    materials: { wood: 0, stone: 0, ancientWood: 0, rareOre: 0 },
    questClaimed: false,
    input: {},
    facing: { x: 0, y: 1 },
    anim: { type: "idle", start: 0, duration: 0 },
  };
}
export const maxHp = (p) => CLASSES[p.kind].hp + (p.level - 1) * 12;
export const maxMana = (p) => CLASSES[p.kind].mana + (p.level - 1) * 7;
export const xpNeeded = (p) => 65 + (p.level - 1) * 45;
export const SHOP = [
  {
    name: "Heiltrank",
    type: "potion",
    price: 18,
    desc: "Stellt 55 Leben wieder her.",
  },
  {
    name: "Mana-Essenz",
    type: "mana",
    price: 12,
    desc: "Stellt sofort 60 Mana wieder her.",
  },
  {
    name: "Waffe des Waldhüters",
    type: "weapon",
    price: 85,
    bonus: 9,
    desc: "+9 Schaden · passend zu deiner Klasse",
  },
  {
    name: "Buch der alten Künste",
    type: "book",
    price: 110,
    desc: "Lerne eine zufällige Klassenfähigkeit.",
  },
  {
    name: "Verstärkte Reisekleidung",
    type: "armor",
    price: 65,
    bonus: 3,
    desc: "Reduziert Schaden zusätzlich um 3.",
  },
  {
    name: "Waldläufer-Werkzeug",
    type: "tool",
    price: 30,
    desc: "Fällen und Abbauen benötigt einen Schlag weniger.",
  },
];
export class World {
  constructor() {
    this.time = 0;
    this.weather = "clear";
    this.weatherTimer = 90;
    this.effects = [];
    this.events = [];
    this.players = new Map();
    this.objects = [];
    this.mobs = [];
    this.depleted = {};
    this.chunks = new Set();
    this.opened = new Set();
    this.loadTimer = 0;
    this.npcs = [
      { x: 43, y: 68, name: "Elara", role: "Händler" },
      { x: 53, y: 66, name: "Eldric", role: "Ältester" },
      { x: 48, y: 79, name: "Mira", role: "Heilerin" },
      { x: 138, y: 142, name: "Thoran", role: "Händler" },
      { x: 144, y: 145, name: "Lyra", role: "Heilerin" },
      { x: 66, y: 27, name: "Fenra", role: "Händler" },
    ];
    for (const v of VILLAGES.slice(3))
      this.npcs.push({
        x: v.x - 3,
        y: v.y,
        name: `Händler von ${v.name}`,
        role: "Händler",
      });
    this.ensureArea(48, 73);
    this.objects.push(
      { id: "welcome-chest", x: 55, y: 76, type: "chest", opened: false },
      { id: "welcome-shrine", x: 36, y: 80, type: "shrine", opened: false },
      { id: "welcome-coin", x: 51, y: 75, type: "coin", opened: false },
    );
    this.mobs.push({
      id: "welcome-slime",
      x: 61,
      y: 79,
      homeX: 61,
      homeY: 79,
      kind: 0,
      hp: 30,
      cd: 0,
      dead: 0,
      root: 0,
      weaken: 0,
    });
  }
  ensureArea(px, py) {
    for (
      let cy = Math.max(0, Math.floor(py / 24) - 2);
      cy <= Math.min(31, Math.floor(py / 24) + 2);
      cy++
    )
      for (
        let cx = Math.max(0, Math.floor(px / 24) - 2);
        cx <= Math.min(31, Math.floor(px / 24) + 2);
        cx++
      ) {
        const key = `${cx}:${cy}`;
        if (this.chunks.has(key)) continue;
        this.chunks.add(key);
        for (let y = cy * 24 + 1; y < (cy + 1) * 24; y++)
          for (let x = cx * 24 + 1; x < (cx + 1) * 24; x++) {
            if (!walkable(x, y) || safeAt(x, y) || terrain(x, y) === "path")
              continue;
            const h = hash(x, y, 992);
            const type =
              h > 0.997
                ? "chest"
                : h < 0.004
                  ? "coin"
                  : h > 0.994 && h < 0.9947
                    ? "shrine"
                    : null;
            if (type) {
              const id = `${type}:${x}:${y}`;
              this.objects.push({
                id,
                x,
                y,
                type,
                opened: this.opened.has(id),
              });
            }
            if (h > 0.986 && h < 0.9885 && Math.hypot(x - 48, y - 70) > 18) {
              const kind =
                terrain(x, y) === "snow"
                  ? 1
                  : terrain(x, y) === "marsh"
                    ? 5
                    : x > riverX(y)
                      ? 4
                      : terrain(x, y) === "ruins"
                        ? 2
                        : Math.floor(hash(x, y, 44) * 4);
              this.mobs.push({
                id: `m${x}:${y}`,
                x,
                y,
                homeX: x,
                homeY: y,
                kind,
                hp: MOB_TYPES[kind].hp,
                cd: 0,
                dead: 0,
                root: 0,
                weaken: 0,
              });
            }
          }
      }
  }
  notify(text, p, type = "info") {
    this.events.push({ text, player: p?.id, type, id: Math.random() });
    if (this.events.length > 40) this.events.shift();
  }
  effect(x, y, text, color, kind = "hit", extra = {}) {
    this.effects.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      kind,
      life: 1.1,
      maxLife: 1.1,
      ...extra,
    });
  }
  animate(p, type, duration = 0.65) {
    p.anim = { type, start: this.time, duration };
  }
  move(p, dx, dy) {
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 4),
    );
    for (let i = 0; i < steps; i++) {
      if (Number.isInteger(p.inside)) {
        const [x, z] = HOUSES[p.inside];
        const nx = Math.max(x - 2.25, Math.min(x + 2.25, p.x + dx / steps)),
          nz = Math.max(z - 2.2, Math.min(z + 2.5, p.y + dy / steps));
        if (interiorWalkable(nx - x, p.y - z)) p.x = nx;
        if (interiorWalkable(p.x - x, nz - z)) p.y = nz;
      } else {
        if (walkable(p.x + dx / steps, p.y, this.depleted, this.time))
          p.x += dx / steps;
        if (walkable(p.x, p.y + dy / steps, this.depleted, this.time))
          p.y += dy / steps;
      }
    }
  }
  update(dt) {
    this.time += dt;
    this.weatherTimer -= dt;
    this.loadTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weather = ["clear", "rain", "storm", "snow"][
        Math.floor(Math.random() * 4)
      ];
      this.weatherTimer = 85 + Math.random() * 100;
    }
    if (this.loadTimer <= 0) {
      for (const p of this.players.values()) this.ensureArea(p.x, p.y);
      const active = [...this.players.values()];
      if (active.length) {
        const near = (x, y) =>
          active.some((p) => Math.abs(x - p.x) < 85 && Math.abs(y - p.y) < 85);
        this.objects = this.objects.filter((o) => near(o.x, o.y));
        this.mobs = this.mobs.filter((m) => near(m.homeX, m.homeY));
        for (const key of this.chunks) {
          const [x, z] = key.split(":").map(Number);
          if (!near(x * 24 + 12, z * 24 + 12)) this.chunks.delete(key);
        }
      }
      this.loadTimer = 1;
    }
    for (const p of this.players.values()) {
      if (p.hp <= 0) continue;
      const input = p.input || {};
      let dx = +!!input.right - +!!input.left,
        dy = +!!input.down - +!!input.up;
      const moving = dx || dy,
        sprint = input.sprint && p.stamina > 2 && moving;
      if (moving) {
        const l = Math.hypot(dx, dy);
        dx /= l;
        dy /= l;
        p.facing = { x: dx, y: dy };
        this.move(
          p,
          dx * CLASSES[p.kind].speed * (sprint ? 1.65 : 1) * dt,
          dy * CLASSES[p.kind].speed * (sprint ? 1.65 : 1) * dt,
        );
      }
      p.stamina = Math.max(
        0,
        Math.min(100, p.stamina + (sprint ? -25 : 17) * dt),
      );
      p.mana = Math.min(
        maxMana(p),
        p.mana + (p.kind === "elf" ? 5 : p.kind === "mage" ? 4.5 : 3) * dt,
      );
      if (safeAt(p.x, p.y) || Number.isInteger(p.inside))
        p.hp = Math.min(maxHp(p), p.hp + dt * 3);
      p.buff = Math.max(0, p.buff - dt);
      p.attackCd = Math.max(0, p.attackCd - dt);
      p.cooldowns = p.cooldowns.map((c) => Math.max(0, c - dt));
      for (const o of this.objects)
        if (
          !Number.isInteger(p.inside) &&
          !o.opened &&
          o.type === "coin" &&
          Math.hypot(o.x - p.x, o.y - p.y) < 1.1
        ) {
          o.opened = true;
          this.opened.add(o.id);
          p.coins += 4;
          this.effect(o.x, o.y, "+4 Gold", "#dfc480", "loot");
        }
    }
    for (const m of this.mobs) {
      if (m.dead > 0) {
        m.dead -= dt;
        if (m.dead <= 0) {
          m.dead = 0;
          m.hp = MOB_TYPES[m.kind].hp;
          m.x = m.homeX;
          m.y = m.homeY;
        }
        continue;
      }
      let target,
        distance = 10;
      for (const p of this.players.values()) {
        const d = Math.hypot(p.x - m.x, p.y - m.y);
        if (
          p.hp > 0 &&
          d < distance &&
          !safeAt(p.x, p.y) &&
          !Number.isInteger(p.inside)
        ) {
          target = p;
          distance = d;
        }
      }
      m.cd = Math.max(0, m.cd - dt);
      m.root = Math.max(0, (m.root || 0) - dt);
      m.weaken = Math.max(0, (m.weaken || 0) - dt);
      if (m.root > 0) continue;
      const def = MOB_TYPES[m.kind];
      if (target) {
        if (distance > 1.3)
          this.move(
            m,
            ((target.x - m.x) / distance) * def.speed * dt,
            ((target.y - m.y) / distance) * def.speed * dt,
          );
        else if (m.cd <= 0) {
          const damage = Math.max(
            1,
            Math.round(def.damage * (m.weaken > 0 ? 0.6 : 1)) -
              CLASSES[target.kind].defense -
              target.armor -
              (target.buff > 0 ? 6 : 0),
          );
          target.hp = Math.max(0, target.hp - damage);
          m.cd = 1.5;
          m.anim = { type: "attack", start: this.time, duration: 0.55 };
          this.effect(target.x, target.y, `-${damage}`, "#e98c7c", "damage");
          if (!target.hp)
            this.notify(
              "Du bist gefallen. Kehre am Schrein zurück.",
              target,
              "death",
            );
        }
      } else if (Math.hypot(m.x - m.homeX, m.y - m.homeY) > 2) {
        const d = Math.hypot(m.x - m.homeX, m.y - m.homeY);
        this.move(m, ((m.homeX - m.x) / d) * dt, ((m.homeY - m.y) / d) * dt);
      }
    }
    this.effects = this.effects.filter((e) => (e.life -= dt) > 0);
  }
  attack(p, slot = -1) {
    if (!p || p.hp <= 0) return false;
    const c = CLASSES[p.kind];
    let skill;
    if (slot >= 0) {
      skill = c.skills[p.unlocked[slot]];
      if (!skill || p.cooldowns[slot] > 0 || p.mana < skill.cost) return false;
      p.mana -= skill.cost;
      p.cooldowns[slot] = skill.cd;
    } else {
      if (p.attackCd > 0) return false;
      p.attackCd = c.attackRate;
    }
    const kind =
      skill?.effect ||
      (p.kind === "samurai"
        ? "slash"
        : p.kind === "paladin"
          ? "holy"
          : p.kind === "mage"
            ? "arcane"
            : "nature");
    this.animate(p, kind, kind === "slash" ? 0.45 : 0.8);
    this.notify(kind, p, "sfx");
    if (skill?.heal)
      for (const ally of this.players.values())
        if (
          ally.hp > 0 &&
          (Number.isInteger(ally.inside) ? ally.inside : null) ===
            (Number.isInteger(p.inside) ? p.inside : null) &&
          (ally === p ||
            Math.hypot(ally.x - p.x, ally.y - p.y) < (skill.allyRange || 5))
        ) {
          ally.hp = Math.min(maxHp(ally), ally.hp + skill.heal);
          this.effect(ally.x, ally.y, `+${skill.heal}`, c.color, "heal");
        }
    if (skill?.shield) {
      p.buff = skill.shield;
      this.effect(p.x, p.y, "Bollwerk", c.color, "shield");
    }
    if (skill?.dash)
      this.move(p, p.facing.x * skill.dash, p.facing.y * skill.dash);
    if (skill && !skill.power) return true;
    const range = skill?.area || skill?.range || c.range;
    const targets = this.mobs
      .filter(
        (m) =>
          !Number.isInteger(p.inside) &&
          m.hp > 0 &&
          !m.dead &&
          Math.hypot(m.x - p.x, m.y - p.y) <= range,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      );
    if (targets[0]) {
      const d = Math.hypot(targets[0].x - p.x, targets[0].y - p.y);
      if (d > 0.01)
        p.facing = { x: (targets[0].x - p.x) / d, y: (targets[0].y - p.y) / d };
    }
    this.effect(p.x, p.y, skill?.name || "", c.color, kind, {
      dx: p.facing.x,
      dy: p.facing.y,
    });
    for (const m of targets.slice(0, skill?.area ? 12 : 1)) {
      const damage = Math.round(
        (c.damage + p.damageBonus + (p.level - 1) * 2) * (skill?.power || 1),
      );
      m.hp -= damage;
      if (skill?.root) {
        m.root = skill.root;
        this.effect(m.x, m.y, "Gebunden", c.color, "roots", {
          life: skill.root,
          maxLife: skill.root,
        });
      }
      if (skill?.weaken) m.weaken = skill.weaken;
      this.effect(m.x, m.y, `-${damage}`, "#e4d6bc", "hit");
      if (c.range > 3 && !skill?.area)
        this.effect(p.x, p.y, "", c.color, "projectile", { tx: m.x, ty: m.y });
      if (m.hp <= 0) {
        m.hp = 0;
        m.dead = 65;
        const def = MOB_TYPES[m.kind];
        p.coins += def.coins;
        p.xp += def.xp;
        p.kills++;
        this.notify(
          `${def.name} besiegt · +${def.xp} EP · +${def.coins} Gold`,
          p,
          "kill",
        );
        this.levelUp(p);
      }
    }
    return true;
  }
  levelUp(p) {
    while (p.xp >= xpNeeded(p)) {
      p.xp -= xpNeeded(p);
      p.level++;
      p.hp = maxHp(p);
      p.mana = maxMana(p);
      this.notify(`Level ${p.level} erreicht!`, p, "level");
      this.unlock(p);
    }
  }
  unlock(p) {
    const pool = CLASSES[p.kind].skills
      .map((_, i) => i)
      .filter((i) => !p.unlocked.includes(i));
    if (!pool.length) {
      p.damageBonus += 2;
      return;
    }
    const idx = pool[Math.floor(Math.random() * pool.length)];
    p.unlocked.push(idx);
    this.notify(
      `Neue Fähigkeit: ${CLASSES[p.kind].skills[idx].name}`,
      p,
      "level",
    );
  }
  resource(p) {
    if (Number.isInteger(p.inside)) return;
    let closest,
      distance = 2.8;
    for (let y = Math.round(p.y) - 3; y <= Math.round(p.y) + 3; y++)
      for (let x = Math.round(p.x) - 3; x <= Math.round(p.x) + 3; x++) {
        const type = treeAt(x, y) ? "tree" : rockAt(x, y) ? "rock" : null;
        if (!type) continue;
        const id = `${type}:${x}:${y}`;
        if (this.depleted[id]?.until > this.time) continue;
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < distance) {
          distance = d;
          closest = { id, x, y, type };
        }
      }
    return closest;
  }
  gather(p) {
    if (!p || p.hp <= 0 || p.attackCd > 0) return;
    const r = this.resource(p);
    if (!r) {
      this.notify("Nähere dich einem Baum oder Felsen.", p);
      return;
    }
    p.attackCd = 0.65;
    this.animate(p, r.type === "tree" ? "chop" : "mine", 0.65);
    this.notify(r.type === "tree" ? "chop" : "mine", p, "sfx");
    const state = this.depleted[r.id] || { hits: 0, until: 0 };
    if (state.until <= this.time && state.until > 0) state.hits = 0;
    state.hits++;
    const needed =
      (r.type === "tree" ? 4 : 3) -
      (p.inventory.some((i) => i.type === "tool") ? 1 : 0);
    this.depleted[r.id] = state;
    this.effect(
      r.x,
      r.y,
      `${state.hits}/${needed}`,
      r.type === "tree" ? "#bca27b" : "#aaaeb5",
      "chips",
    );
    if (state.hits < needed) return;
    state.until = this.time + 240;
    state.hits = 0;
    p.materials ||= { wood: 0, stone: 0, ancientWood: 0, rareOre: 0 };
    const key = r.type === "tree" ? "wood" : "stone",
      amount = 2 + Math.floor(hash(r.x, r.y, 51) * 3);
    p.materials[key] += amount;
    const rare = hash(r.x, r.y, 915) > 0.975;
    if (rare) p.materials[r.type === "tree" ? "ancientWood" : "rareOre"]++;
    this.effect(
      r.x,
      r.y,
      "",
      r.type === "tree" ? "#bca27b" : "#aaaeb5",
      "fall",
      { life: 1.5, maxLife: 1.5, resourceType: r.type },
    );
    this.notify(
      `+${amount} ${r.type === "tree" ? "Holz" : "Stein"}${rare ? ` · ${r.type === "tree" ? "Antikes Holz" : "Seltenes Erz"}!` : ""}`,
      p,
      "loot",
    );
  }
  nearest(p) {
    if (Number.isInteger(p.inside)) {
      const [x, y] = HOUSES[p.inside];
      return Math.hypot(p.x - x, p.y - (y + 2.3)) < 1.7
        ? { type: "door", name: "Nach draußen", x, y: y + 2.3, exit: true }
        : null;
    }
    return [
      ...HOUSES.map(([x, y], index) => ({
        type: "door",
        name: "Haus betreten",
        x,
        y: y + 2.5,
        index,
      })),
      ...this.npcs.map((n) => ({ ...n, type: "npc" })),
      ...this.objects.filter((o) => !o.opened && o.type !== "coin"),
    ]
      .filter((o) => Math.hypot(o.x - p.x, o.y - p.y) < 3.2)
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0];
  }
  interact(p) {
    if (!p || p.hp <= 0) return;
    const o = this.nearest(p);
    if (!o) {
      this.gather(p);
      return;
    }
    if (o.type === "door") {
      if (o.exit) {
        const [x, y] = HOUSES[p.inside];
        p.inside = null;
        p.x = x;
        p.y = y + 3;
      } else {
        p.inside = o.index;
        p.x = HOUSES[o.index][0];
        p.y = HOUSES[o.index][1] + 1.3;
      }
      p.input = {};
      this.notify(
        o.exit
          ? "Zurück in der Welt."
          : "Drinnen · E am Ausgang zum Verlassen.",
        p,
      );
      return;
    }
    if (o.type === "npc") {
      this.notify(
        o.role === "Händler"
          ? "shop"
          : o.name === "Eldric"
            ? "quest"
            : "healer",
        p,
        "panel",
      );
      return;
    }
    const source = this.objects.find((a) => a.id === o.id);
    if (!source || source.opened) return;
    source.opened = true;
    this.opened.add(source.id);
    if (o.type === "chest") {
      p.coins += 20;
      p.potions++;
      p.chests++;
      const roll = hash(o.x, o.y, 31),
        item = {
          ...(roll > 0.8
            ? SHOP[3]
            : roll > 0.65
              ? SHOP[5]
              : {
                  name: `${CLASSES[p.kind].weapon} der Alten`,
                  type: "weapon",
                  bonus: 3 + Math.floor(hash(o.x, o.y) * 7),
                }),
          id: `loot-${o.id}`,
          kind: p.kind,
        };
      p.inventory.push(item);
      this.notify(`Kiste geöffnet · 20 Gold · ${item.name}`, p, "loot");
    } else {
      p.hp = maxHp(p);
      p.mana = maxMana(p);
      p.buff = 90;
      p.shrines++;
      this.notify("Segen der Alten · 90 Sekunden Schutz", p, "loot");
    }
  }
  action(p, action, data) {
    if (!p) return;
    if (action === "respawn") {
      if (p.hp > 0) return;
      p.inside = null;
      p.x = 48;
      p.y = 73;
      p.hp = maxHp(p);
      p.mana = maxMana(p);
      p.coins = Math.floor(p.coins * 0.9);
      return;
    }
    if (p.hp <= 0) return;
    if (action === "attack") return this.attack(p);
    if (action === "skill" && Number.isInteger(data) && data >= 0 && data < 4)
      return this.attack(p, data);
    if (action === "interact") this.interact(p);
    if (action === "gather") this.gather(p);
    if (action === "potion" && p.potions > 0 && p.hp < maxHp(p)) {
      p.potions--;
      p.hp = Math.min(maxHp(p), p.hp + 55);
      this.effect(p.x, p.y, "+55", "#95dcae", "heal");
      this.notify("heal", p, "sfx");
    }
    if (action === "buy") {
      const item = SHOP[data];
      if (
        !item ||
        !this.npcs.some(
          (n) => n.role === "Händler" && Math.hypot(n.x - p.x, n.y - p.y) < 3.2,
        )
      )
        return;
      if (p.coins < item.price) {
        this.notify("Nicht genug Gold.", p);
        return;
      }
      p.coins -= item.price;
      if (item.type === "potion") p.potions++;
      else if (item.type === "mana") p.mana = Math.min(maxMana(p), p.mana + 60);
      else
        p.inventory.push({ ...item, kind: p.kind, id: `buy-${Math.random()}` });
      this.notify(`${item.name} gekauft.`, p, "loot");
    }
    if (action === "equip") {
      const item = p.inventory.find((i) => i.id === data);
      if (!item) return;
      if (item.type === "book") {
        if (p.unlocked.length >= 6) return;
        this.unlock(p);
        p.inventory = p.inventory.filter((i) => i !== item);
      } else if (["weapon", "armor"].includes(item.type)) {
        for (const i of p.inventory)
          if (i.type === item.type) i.equipped = false;
        item.equipped = true;
        if (item.type === "weapon") {
          p.damageBonus = item.bonus;
          p.weapon = item.name;
        } else p.armor = item.bonus;
      }
    }
    if (
      action === "swapSkill" &&
      Array.isArray(data) &&
      data.length === 2 &&
      data.every((i) => Number.isInteger(i) && i >= 0 && i < p.unlocked.length)
    ) {
      const [a, b] = data;
      [p.unlocked[a], p.unlocked[b]] = [p.unlocked[b], p.unlocked[a]];
      p.cooldowns = [15, 15, 15, 15];
    }
    if (
      action === "quest" &&
      this.npcs.some(
        (n) => n.name === "Eldric" && Math.hypot(n.x - p.x, n.y - p.y) < 3.2,
      ) &&
      !p.questClaimed &&
      p.kills >= 5 &&
      p.chests >= 1 &&
      p.shrines >= 1
    ) {
      p.questClaimed = true;
      p.coins += 100;
      p.xp += 80;
      this.levelUp(p);
      this.notify("Immerhains Wächter · +100 Gold · +80 EP", p, "level");
    }
    if (
      action === "heal" &&
      this.npcs.some(
        (n) => n.role === "Heilerin" && Math.hypot(n.x - p.x, n.y - p.y) < 3.2,
      )
    ) {
      p.hp = maxHp(p);
      p.mana = maxMana(p);
      this.effect(p.x, p.y, "Erneuert", "#80d7aa", "heal");
    }
  }
}
