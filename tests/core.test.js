import test from "node:test";
import assert from "node:assert/strict";
import {
  World,
  makePlayer,
  KNIGHT,
  SEALS,
  DUNGEON,
  DAY_LENGTH,
  daylight,
  riverX,
  walkable,
  maxHp,
  objective,
  treeAt,
  rockAt,
} from "../src/core.js";

const kill = (w, m) => {
  const p = w.player;
  p.x = m.x;
  p.y = m.y + 1;
  let safety = 80;
  while (!m.dead && safety--) {
    p.attackCd = 0;
    p.stamina = 100;
    w.attack();
  }
  assert.ok(m.dead);
};
test("only one playable class exists and old progress becomes a male knight", () => {
  const p = makePlayer("A".repeat(30));
  assert.equal(p.name.length, 20);
  assert.equal(p.kind, "knight");
  assert.equal(p.gender, "male");
  const w = World.restore({
    version: 2,
    player: {
      name: "Alter Weg",
      kind: "mage",
      gender: "female",
      level: 3,
      coins: 90,
    },
  });
  assert.equal(w.player.kind, "knight");
  assert.equal(w.player.gender, "male");
  assert.equal(w.player.coins, 90);
  assert.equal(w.player.story.elder, false);
});
test("deterministic terrain, resources and encounters", () => {
  const a = new World(),
    b = new World();
  assert.deepEqual(a.mobs, b.mobs);
  assert.deepEqual(a.objects, b.objects);
  assert.equal(walkable(riverX(90), 90), false);
  assert.ok(KNIGHT.range > 2);
});
test("sword attacks animate, consume cooldown and cannot be spammed", () => {
  const w = new World(),
    p = w.player,
    m = w.mobs.find((m) => m.type === "guardian");
  p.x = m.x;
  p.y = m.y + 1;
  const hp = m.hp;
  w.attack();
  assert.ok(p.anim.kind.startsWith("slash"));
  assert.ok(m.hp < hp);
  const next = m.hp;
  w.attack();
  assert.equal(m.hp, next);
});
test("shield reduces incoming damage; healing and respawn retain story", () => {
  const w = new World(),
    p = w.player;
  p.x = 77;
  p.y = 60;
  const m = w.mobs.find((m) => m.type === "guardian");
  m.x = p.x;
  m.y = p.y;
  w.mobs = [m];
  p.block = 5;
  const hp = p.hp;
  w.update(0.1);
  assert.ok(hp - p.hp <= 4);
  p.hp = 0;
  p.story.elder = true;
  p.coins = 100;
  w.action("respawn");
  assert.equal(p.hp, maxHp(p));
  assert.equal(p.coins, 95);
  assert.equal(p.story.elder, true);
  assert.equal(p.area, "vale");
});
test("rune guardians and rank gates prevent skipping the story", () => {
  const w = new World(),
    p = w.player;
  p.x = SEALS[0].x;
  p.y = SEALS[0].y;
  w.interact();
  assert.equal(p.story.seals.length, 0);
  p.story.elder = true;
  w.interact();
  assert.equal(p.story.seals.length, 0);
  p.x = DUNGEON.x;
  p.y = DUNGEON.y;
  w.interact();
  assert.equal(p.area, "vale");
  w.action("mount");
  assert.equal(p.mounted, false);
  w.action("flute");
  assert.equal(w.cinematic, null);
});
test("complete campaign: three seals, dungeon waves, boss, dragon, fishing, flight and princess", () => {
  const w = new World(),
    p = w.player;
  p.story.begun = true;
  w.resolveDialogue("elder");
  for (const s of SEALS) {
    kill(
      w,
      w.mobs.find((m) => m.id === `guardian-${s.id}`),
    );
    p.x = s.x;
    p.y = s.y;
    w.interact();
  }
  assert.equal(p.story.seals.length, 3);
  assert.ok(p.level >= 4);
  p.x = DUNGEON.x;
  p.y = DUNGEON.y;
  w.interact();
  assert.equal(p.area, "dungeon");
  let waves = 0;
  while (!w.dungeon.bossDefeated && waves++ < 5) {
    for (const m of [...w.activeMobs()].filter((m) => !m.dead)) kill(w, m);
    w.updateDungeon();
  }
  assert.ok(w.dungeon.bossDefeated);
  p.x = 16;
  p.y = 6;
  w.interact();
  assert.equal(w.cinematic.id, "dragon");
  w.finishCinematic();
  assert.ok(p.story.dragon);
  assert.ok(p.mounted);
  assert.equal(p.area, "vale");
  p.mounted = false;
  p.x = riverX(90) - 5;
  p.y = 90;
  for (let attempt = 0; attempt < 3 && !p.story.flute; attempt++) {
    w.fish();
    assert.ok(p.fishing);
    p.fishing.bite = true;
    w.catchFish();
  }
  assert.ok(p.story.flute);
  assert.equal(w.cinematic.id, "flight");
  w.finishCinematic();
  assert.equal(p.area, "isle");
  assert.ok(p.story.arrived);
  p.x = 66;
  p.y = 51;
  w.interact();
  assert.equal(w.cinematic.id, "reunion");
  w.finishCinematic();
  assert.ok(p.story.reunited);
  assert.match(objective(p), /Eid lebt/);
});
test("fishing requires a bite and flute is impossible before dragon", () => {
  const w = new World(),
    p = w.player;
  p.x = riverX(90) - 5;
  p.y = 90;
  w.fish();
  assert.ok(p.fishing);
  w.catchFish();
  assert.equal(p.fish, 0);
  w.update(7.5);
  assert.equal(p.fishing, null);
  p.story.fishSinceDragon = 20;
  w.fish();
  p.fishing.bite = true;
  w.catchFish();
  assert.equal(p.story.flute, false);
  assert.equal(p.fish, 1);
});
test("day and night differ and evening rest restores all resources", () => {
  assert.equal(daylight(DAY_LENGTH / 2).night, false);
  assert.equal(daylight((DAY_LENGTH * 22) / 24).night, true);
  assert.ok(daylight(DAY_LENGTH / 2).light > daylight(0).light * 3);
  const w = new World(),
    p = w.player;
  p.x = 45;
  p.y = 75;
  p.hp = 1;
  p.stamina = 0;
  w.action("rest", "evening");
  assert.equal(w.cinematic.id, "rest");
  w.finishCinematic();
  assert.equal(p.hp, maxHp(p));
  assert.equal(p.stamina, 100);
  assert.equal(daylight(w.clock).night, true);
});
test("gathering depletes deposits and persists material rewards", () => {
  const w = new World(),
    p = w.player;
  p.x = 42;
  p.y = 77;
  assert.ok(treeAt(42, 76));
  for (let i = 0; i < 3; i++) {
    p.attackCd = 0;
    w.gather();
  }
  assert.ok(p.wood >= 2);
  assert.ok(w.depleted["vale:tree:42:76"].until > 0);
  const n = p.wood;
  p.attackCd = 0;
  w.gather();
  assert.equal(p.wood, n);
  const next = World.restore(w.serialize());
  assert.equal(next.player.wood, p.wood);
  assert.deepEqual(next.depleted, w.depleted);
});
test("house transition is isolated from outdoor combat and can be left", () => {
  const w = new World(),
    p = w.player;
  p.x = 41;
  p.y = 66.5;
  w.interact();
  assert.equal(p.area, "house");
  assert.equal(w.activeMobs().length, 0);
  assert.equal(p.mounted, false);
  p.x = 8;
  p.y = 11;
  w.interact();
  assert.equal(p.area, "vale");
  assert.ok(p.y > 65);
});
test("save roundtrip preserves quest, clock, dungeon and cinematic", () => {
  const w = new World();
  w.player.story.elder = true;
  w.clock = 600;
  w.startCinematic("prologue");
  w.cinematic.time = 4;
  const restored = World.restore(JSON.parse(JSON.stringify(w.serialize())));
  assert.equal(restored.player.story.elder, true);
  assert.equal(restored.clock, 600);
  assert.equal(restored.cinematic.time, 4);
  assert.equal(restored.player.kind, "knight");
});
