import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  surface,
  knightModel,
  animateKnight,
  treeModel,
  houseModel,
  dragonModel,
  roomModel,
} from "../src/glyph-models.js";
import {
  bridgeModel,
  campfireModel,
  waysideModel,
} from "../src/environment-models.js";
import { BRIDGES } from "../src/landscape.js";
const mats = Object.fromEntries(
  [
    "steel",
    "darkSteel",
    "gold",
    "cloth",
    "dark",
    "brightSteel",
    "leather",
    "leaf",
    "bark",
    "stone",
    "darkStone",
    "moss",
    "wood",
    "plaster",
    "roof",
    "window",
    "glow",
    "dragon",
    "darkDragon",
    "wing",
    "skin",
    "fire",
    "ember",
  ].map((k) => [k, new T.PointsMaterial({ size: 1 })]),
);
test("all visual structures consist of 3D ASCII point surfaces, never polygon meshes", () => {
  for (const root of [
    knightModel(mats),
    treeModel(mats),
    houseModel(mats),
    dragonModel(mats),
    roomModel(mats),
    bridgeModel(mats, BRIDGES[0]),
    campfireModel(mats),
    waysideModel(mats, 3),
  ]) {
    let points = 0,
      meshes = 0;
    root.traverse((o) => {
      if (o.isPoints) points += o.geometry.attributes.position.count;
      if (o.isMesh) meshes++;
    });
    assert.equal(meshes, 0);
    assert.ok(points > 1000);
  }
});
test("surface geometry contains depth and directional normals", () => {
  const geo = surface("ellipsoid", 0.3, 0.4, 0.25, 0.05);
  assert.ok(geo.attributes.position.count > 100);
  assert.equal(geo.attributes.normal.count, geo.attributes.position.count);
  geo.computeBoundingBox();
  assert.ok(geo.boundingBox.max.z > geo.boundingBox.min.z);
});
test("knight swings a wrist-attached sword, parries without a shield and sits", () => {
  const g = knightModel(mats),
    p = {
      hp: 1,
      input: {},
      facing: { x: 0, y: 1 },
      anim: { kind: "slash1", start: 0, duration: 0.6 },
    };
  animateKnight(g, p, 0.1);
  const a = g.userData.limbs.rightArm.rotation.x;
  animateKnight(g, p, 0.45);
  assert.notEqual(g.userData.limbs.rightArm.rotation.x, a);
  p.anim = { kind: "block", start: 0, duration: 1 };
  animateKnight(g, p, 0.2);
  assert.ok(g.userData.limbs.rightArm.rotation.x < -0.8);
  assert.equal(g.userData.shield, undefined);
  assert.equal(g.userData.weapon.parent, g.userData.wrist);
  animateKnight(g, { ...p, anim: {} }, 0.2, true, true);
  assert.ok(g.userData.body.position.y < -0.6);
  assert.ok(g.userData.limbs.rightLeg.rotation.x < -1);
});
