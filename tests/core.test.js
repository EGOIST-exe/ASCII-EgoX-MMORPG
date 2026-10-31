import test from "node:test";
import assert from "node:assert/strict";
import {
  World,
  WORLD_SIZE,
  CLASSES,
  MOB_TYPES,
  makePlayer,
  maxHp,
  xpNeeded,
  riverX,
  walkable,
  terrain,
  treeAt,
  rockAt,
  HOUSES,
  hash,
} from "../src/core.js";

function setup(kind = "elf") {
  const w = new World();
  const p = makePlayer(kind, "Test", "female");
  w.players.set(p.id, p);
  return { w, p };
}
test("streamed worlds are deterministic and contain all factions across regions", () => {
  const a = new World(),
    b = new World();
  for (const w of [a, b]) {
    w.ensureArea(160, 150);
    w.ensureArea(28, 170);
  }
  assert.deepEqual(a.objects, b.objects);
  assert.deepEqual(a.mobs, b.mobs);
  assert.equal(new Set(a.mobs.map((m) => m.kind)).size, 6);
  assert.equal(WORLD_SIZE, 768);
});
test("class roles differ in speed, survivability and healing", () => {
  for (const id of Object.keys(CLASSES)) {
    const p = makePlayer(id, "A".repeat(50));
    assert.equal(p.name.length, 20);
    assert.equal(p.hp, maxHp(p));
    assert.equal(p.unlocked.length, 2);
    assert.ok(walkable(p.x, p.y));
  }
  assert.ok(CLASSES.samurai.speed > CLASSES.elf.speed);
  assert.ok(CLASSES.mage.hp < CLASSES.elf.hp);
  assert.ok(CLASSES.paladin.hp > CLASSES.samurai.hp);
  assert.ok(CLASSES.paladin.defense > CLASSES.samurai.defense);
  assert.ok(CLASSES.elf.skills[0].heal > CLASSES.mage.skills[3].heal);
});
test("movement respects rivers, buildings, and normalizes diagonal speed", () => {
  const { w, p } = setup();
  const x = riverX(90);
  assert.equal(terrain(Math.round(x), 90), "water");
  assert.equal(walkable(x, 90), false);
  assert.equal(walkable(41, 64), false);
  p.input = { right: true, down: true };
  const before = { x: p.x, y: p.y };
  w.update(0.1);
  assert.ok(
    Math.hypot(p.x - before.x, p.y - before.y) <=
      CLASSES.elf.speed * 0.1 + 0.001,
  );
});
test("skills consume mana, apply cooldown, and cannot be spammed", () => {
  const { w, p } = setup("mage");
  const initial = p.mana;
  w.attack(p, 0);
  assert.equal(p.mana, initial - CLASSES.mage.skills[0].cost);
  const after = p.mana;
  w.attack(p, 0);
  assert.equal(p.mana, after);
  p.cooldowns[0] = 0;
  p.mana = 0;
  w.attack(p, 0);
  assert.equal(p.cooldowns[0], 0);
});
test("enemy elimination awards gold and XP; respawn resets death flag", () => {
  const { w, p } = setup("samurai");
  p.x = 61;
  p.y = 79;
  w.mobs = [w.mobs.find((m) => m.id === "welcome-slime")];
  const m = w.mobs[0];
  m.hp = 1;
  const coins = p.coins;
  w.attack(p);
  assert.equal(m.hp, 0);
  assert.equal(p.kills, 1);
  assert.equal(p.coins, coins + MOB_TYPES[0].coins);
  assert.equal(p.xp, MOB_TYPES[0].xp);
  w.update(66);
  assert.equal(m.dead, 0);
  assert.equal(m.hp, MOB_TYPES[0].hp);
});
test("level-ups grant unique class skills and refill resources", () => {
  const { w, p } = setup();
  p.xp = xpNeeded(p);
  p.hp = 1;
  w.levelUp(p);
  assert.equal(p.level, 2);
  assert.equal(p.hp, maxHp(p));
  assert.equal(p.unlocked.length, 3);
  for (let i = 0; i < 8; i++) w.unlock(p);
  assert.equal(new Set(p.unlocked).size, CLASSES[p.kind].skills.length);
});
test("chests and shrines have one-time shared rewards", () => {
  const { w, p } = setup();
  p.x = 55;
  p.y = 76;
  w.interact(p);
  const gold = p.coins;
  w.interact(p);
  assert.equal(p.coins, gold);
  assert.equal(p.chests, 1);
  p.x = 36;
  p.y = 80;
  w.interact(p);
  assert.equal(p.shrines, 1);
  assert.equal(p.buff, 90);
});
test("shop enforces proximity and funds; purchased weapon must be equipped", () => {
  const { w, p } = setup();
  p.coins = 100;
  w.action(p, "buy", 2);
  assert.equal(p.coins, 100);
  p.x = 43;
  p.y = 68;
  w.action(p, "buy", 2);
  assert.equal(p.coins, 15);
  assert.equal(p.damageBonus, 0);
  w.action(p, "equip", p.inventory.at(-1).id);
  assert.equal(p.damageBonus, 9);
  w.action(p, "buy", 2);
  assert.equal(p.coins, 15);
});
test("quest reward requires completed objectives, proximity, and is one-time", () => {
  const { w, p } = setup();
  p.kills = 5;
  p.chests = 1;
  p.shrines = 1;
  w.action(p, "quest");
  assert.equal(p.questClaimed, false);
  p.x = 53;
  p.y = 66;
  w.action(p, "quest");
  assert.equal(p.questClaimed, true);
  const coins = p.coins;
  w.action(p, "quest");
  assert.equal(p.coins, coins);
});
test("death blocks actions and respawn charges exactly ten percent gold", () => {
  const { w, p } = setup();
  p.hp = 0;
  p.coins = 100;
  w.action(p, "potion");
  assert.equal(p.potions, 3);
  w.action(p, "respawn");
  assert.equal(p.hp, maxHp(p));
  assert.equal(p.coins, 90);
  assert.equal(p.x, 48);
});
test("elf heals nearby living allies but not distant, dead, or indoor allies", () => {
  const { w, p } = setup();
  p.hp = 20;
  for (const [id, x, hp, inside] of [
    ["near", 49, 10, undefined],
    ["far", 80, 10, undefined],
    ["dead", 49, 0, undefined],
    ["indoor", 49, 10, 0],
  ]) {
    const ally = makePlayer("samurai");
    Object.assign(ally, { id, x, y: 73, hp, inside });
    w.players.set(id, ally);
  }
  w.attack(p, 0);
  assert.equal(p.hp, 64);
  assert.equal(w.players.get("near").hp, 54);
  for (const id of ["far", "indoor"]) assert.equal(w.players.get(id).hp, 10);
  assert.equal(w.players.get("dead").hp, 0);
});
test("root fully immobilizes opponents and expires before they resume pursuit", () => {
  const { w, p } = setup();
  p.x = 61;
  p.y = 79;
  const m = w.mobs.find((m) => m.id === "welcome-slime");
  m.x = 64;
  m.y = 79;
  w.mobs = [m];
  w.attack(p, 1);
  assert.equal(m.root, 3.5);
  const x = m.x,
    y = m.y;
  w.update(1);
  assert.equal(m.x, x);
  assert.equal(m.y, y);
  w.update(3);
  assert.ok(Math.hypot(m.x - x, m.y - y) > 0);
});
test("gathering produces materials, prevents duplicate rewards and regrows resources", () => {
  const { w, p } = setup();
  p.x = 40;
  p.y = 78;
  assert.ok(treeAt(40, 77));
  for (let i = 0; i < 4; i++) {
    p.attackCd = 0;
    w.gather(p);
  }
  assert.ok(p.materials.wood >= 2);
  assert.ok(w.depleted["tree:40:77"].until > w.time);
  assert.ok(walkable(40, 77, w.depleted, w.time));
  const n = p.materials.wood;
  p.attackCd = 0;
  w.gather(p);
  assert.equal(p.materials.wood, n);
  w.time += 241;
  assert.equal(walkable(40, 77, w.depleted, w.time), false);
  p.x = 51;
  p.y = 76;
  assert.ok(rockAt(51, 76));
  for (let i = 0; i < 3; i++) {
    p.attackCd = 0;
    w.gather(p);
  }
  assert.ok(p.materials.stone >= 2);
});
test("rare resource rolls award ancient wood at rare deterministic deposits", () => {
  const { w, p } = setup();
  let found;
  for (let y = 40; y < 100 && !found; y++)
    for (let x = 5; x < 100; x++)
      if (treeAt(x, y) && hash(x, y, 915) > 0.975) {
        found = { x, y };
        break;
      }
  assert.ok(found);
  Object.assign(p, found);
  for (let i = 0; i < 4; i++) {
    p.attackCd = 0;
    w.gather(p);
  }
  assert.equal(p.materials.ancientWood, 1);
});
test("houses enter and exit through doors and constrain indoor movement", () => {
  const { w, p } = setup();
  const [x, z] = HOUSES[0];
  p.x = x;
  p.y = z + 2.5;
  assert.equal(w.nearest(p).type, "door");
  w.interact(p);
  assert.equal(p.inside, 0);
  w.move(p, 100, 100);
  assert.ok(p.x <= x + 2.25 && p.y <= z + 2.5);
  p.x = x;
  p.y = z + 2.3;
  w.interact(p);
  assert.equal(p.inside, null);
  assert.equal(p.y, z + 3);
});
test("interior isolation prevents attacking outdoor mobs and cross-room healing", () => {
  const { w, p } = setup("mage");
  p.inside = 0;
  p.x = 61;
  p.y = 79;
  const m = w.mobs.find((m) => m.id === "welcome-slime");
  const hp = m.hp;
  w.attack(p);
  assert.equal(m.hp, hp);
});
