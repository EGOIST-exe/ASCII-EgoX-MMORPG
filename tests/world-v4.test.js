import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { World, walkable, elevation, terrain, riverX } from "../src/core.js";
import {
  BRIDGES,
  bridgeHeight,
  pathInfo,
  ROADS,
  mountainHeight,
} from "../src/landscape.js";
import { visibleGroundBounds, chunkPlan } from "../src/view-distance.js";
import {
  FILM_SHOTS,
  FILM_DURATION,
  filmShotAt,
} from "../src/cinematography.js";

test("roll costs stamina, moves through collision substeps and cannot be spammed", () => {
  const w = new World(),
    p = w.player;
  w.mobs = [];
  p.input = { down: true };
  const y = p.y;
  assert.equal(w.roll(), true);
  assert.equal(p.stamina, 75);
  assert.equal(w.roll(), false);
  for (let i = 0; i < 40; i++) w.update(0.016);
  assert.ok(p.y > y + 2);
  assert.ok(p.y < y + 5.5);
  assert.equal(w.attack(), false);
  w.update(0.2);
  assert.equal(p.roll, null);
  assert.ok(p.rollCd > 0);
});
test("rolling cannot cross the river and has a limited invulnerability window", () => {
  const w = new World(),
    p = w.player;
  p.x = riverX(90) - 4.7;
  p.y = 90;
  p.facing = { x: 1, y: 0 };
  w.mobs = [];
  w.roll();
  for (let i = 0; i < 50; i++) w.update(0.016);
  assert.ok(p.x < riverX(90) - 3);
  assert.ok(walkable(p.x, p.y));
  const guard = new World(),
    q = guard.player;
  q.x = 77;
  q.y = 60;
  const m = guard.mobs.find((m) => m.type === "guardian");
  m.x = q.x;
  m.y = q.y;
  guard.mobs = [m];
  q.roll = { start: 0, duration: 0.72, dx: 0, dy: 0 };
  guard.time = 0.19;
  guard.update(0.01);
  assert.equal(q.hp, 150);
  assert.ok(guard.effects.some((e) => e.kind === "dodge"));
  m.cd = 0;
  guard.time = 0.65;
  guard.update(0.01);
  assert.ok(q.hp < 150);
});
test("safe inactivity starts a camp, input wakes knight and the fire fades", () => {
  const w = new World(),
    p = w.player;
  w.mobs = [];
  for (let i = 0; i < 260; i++) w.update(0.1);
  assert.equal(p.camping, true);
  assert.equal(w.camp.until, Infinity);
  p.input = { down: true };
  w.update(0.05);
  assert.equal(p.camping, false);
  assert.ok(Number.isFinite(w.camp.until));
  p.input = {};
  for (let i = 0; i < 125; i++) w.update(0.1);
  assert.equal(w.camp, null);
  const restored = World.restore(w.serialize());
  assert.equal(restored.player.camping, false);
  assert.equal(restored.player.roll, null);
});
test("enemies and fishing prevent an unattended camp", () => {
  const w = new World(),
    p = w.player;
  p.x = 77;
  p.y = 63;
  p.idleSince = -30;
  w.update(0.01);
  assert.equal(p.camping, false);
  w.mobs = [];
  p.fishing = { elapsed: 0, wait: 200, bite: false };
  w.update(0.01);
  assert.equal(p.camping, false);
});
test("river crossing has an elevated walkable deck and roads bend through the world", () => {
  const b = BRIDGES[0];
  assert.equal(terrain(b.x, b.z), "bridge");
  assert.ok(walkable(b.x, b.z));
  assert.equal(elevation(b.x, b.z), bridgeHeight(b));
  assert.equal(terrain(riverX(80), 80), "water");
  assert.ok(pathInfo(66, 74).distance < 0.1);
  assert.ok(ROADS.length > 3);
  assert.ok(mountainHeight(5, 300) > 25);
  assert.ok(mountainHeight(384, 384) < 0.01);
  assert.equal(walkable(4, 300), false);
  assert.equal(terrain(-10, 100), "mountain");
});
test("camera-based chunk coverage includes every viewport edge at portrait and ultrawide sizes", () => {
  for (const aspect of [0.46, 1.5, 2.4, 4.5])
    for (const zoom of [0.75, 1.05, 1.55]) {
      const camera = new T.PerspectiveCamera(43, aspect, 0.1, 240),
        focus = { x: 112, z: 90 };
      camera.position.set(112 + 3.5 / zoom, 14 + 13.5 / zoom, 90 + 16.5 / zoom);
      camera.lookAt(112, 15, 89.4);
      const bounds = visibleGroundBounds(camera, focus),
        plan = chunkPlan(bounds, focus),
        keys = new Set(plan.map((c) => c.x + ":" + c.z));
      camera.updateMatrixWorld(true);
      const ray = new T.Raycaster(),
        plane = new T.Plane(new T.Vector3(0, 1, 0), 2),
        hit = new T.Vector3();
      for (const x of [-1, 0, 1])
        for (const y of [-1, 0, 1]) {
          ray.setFromCamera(new T.Vector2(x, y), camera);
          if (
            ray.ray.intersectPlane(plane, hit) &&
            hit.distanceTo(camera.position) < 150
          )
            assert.ok(
              keys.has(Math.floor(hit.x / 12) + ":" + Math.floor(hit.z / 12)),
              aspect + " / " + zoom,
            );
        }
      assert.ok(plan.some((c) => c.lod === 0));
    }
});
test("cinematic film has six distinct dolly shots and timed fades", () => {
  assert.equal(FILM_SHOTS.length, 6);
  assert.equal(FILM_DURATION, 42);
  assert.equal(filmShotAt(0).fade, 1);
  assert.equal(filmShotAt(8).id, "garden");
  assert.equal(filmShotAt(41).id, "oath");
  assert.notDeepEqual(filmShotAt(1).camera, filmShotAt(5).camera);
  assert.equal(filmShotAt(3).fade, 0);
});
test("old saves near a new mountain border recover to ground and respawn clears rolls", () => {
  const w = new World();
  w.player.x = 3;
  w.player.y = 200;
  w.player.checkpoint = { x: 3, y: 200, area: "vale" };
  const restored = World.restore(w.serialize()),
    p = restored.player;
  assert.ok(walkable(p.x, p.y, p.area));
  assert.ok(walkable(p.checkpoint.x, p.checkpoint.y, p.checkpoint.area));
  p.hp = 0;
  p.roll = { start: 0, duration: 0.72, dx: 1, dy: 0 };
  p.camping = true;
  restored.action("respawn");
  assert.equal(p.roll, null);
  assert.equal(p.camping, false);
  assert.equal(p.idleSince, restored.time);
});
