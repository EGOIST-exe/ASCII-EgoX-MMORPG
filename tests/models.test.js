import test from "node:test";
import assert from "node:assert/strict";
import {
  character,
  animateCharacter,
  interior,
  house,
  ruin,
  enemyModel,
} from "../src/models.js";

test("each class has a jointed 3D model and different gender proportions", () => {
  for (const kind of ["mage", "samurai", "elf", "paladin"]) {
    const female = character(kind, "female", 0);
    const male = character(kind, "male", 0);
    let meshes = 0;
    female.traverse((node) => {
      if (node.isMesh) meshes++;
    });
    assert.ok(meshes > 40);
    assert.ok(
      female.userData.body.children[0].scale.x <
        male.userData.body.children[0].scale.x,
    );
    assert.ok(female.userData.limbs.rightElbow);
    assert.ok(female.userData.weapon.children.length > 1);
  }
});
test("attack animation moves joints and gathering equips its animated tool", () => {
  const model = character("samurai", "male", 2);
  const p = {
    x: 0,
    y: 0,
    input: {},
    facing: { x: 0, y: 1 },
    anim: { type: "idle", start: 0, duration: 1 },
  };
  animateCharacter(model, p, 1, 0.016, false);
  const idle = model.userData.limbs.rightArm.rotation.x;
  p.anim = { type: "slash", start: 1, duration: 0.45 };
  animateCharacter(model, p, 1.15, 0.016, true);
  assert.notEqual(model.userData.limbs.rightArm.rotation.x, idle);
  p.anim = { type: "mine", start: 2, duration: 0.65 };
  animateCharacter(model, p, 2.2, 0.016, true);
  assert.equal(model.userData.tool.visible, true);
  assert.equal(model.userData.weapon.visible, false);
});
test("landmarks and interiors have substantial modeled geometry and a hearth light", () => {
  for (const model of [house(), ruin(), interior()]) {
    let meshes = 0;
    model.traverse((node) => {
      if (node.isMesh) meshes++;
    });
    assert.ok(meshes > 35);
  }
  assert.ok(interior().userData.fire.isPointLight);
  for (const kind of [1, 2, 3, 4, 5])
    assert.ok(enemyModel(kind).userData.limbs);
});
