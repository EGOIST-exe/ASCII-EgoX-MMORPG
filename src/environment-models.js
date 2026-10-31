import { batchRigid } from "./ascii-batch.js";
import * as T from "three";
import {
  points,
  beam,
  houseModel,
  ruinModel,
  treeModel,
  knightModel,
  villagerModel,
} from "./glyph-models.js";
import { hash } from "./core.js";

export function bridgeModel(m, b) {
  const g = new T.Group(),
    length = b.length,
    width = b.width;
  // Individual oak boards, pegs, stringers, braces and stone abutments.
  for (let x = -length / 2; x < length / 2; x += 0.34) {
    points(
      g,
      m.wood,
      "box",
      [x, 0, 0],
      [0.3, 0.16, width],
      [0, 0, Math.sin(x * 4) * 0.012],
      0.09,
    );
    for (const z of [-width * 0.37, width * 0.37])
      points(
        g,
        m.darkSteel,
        "ellipsoid",
        [x, 0.09, z],
        [0.025, 0.015, 0.025],
        [0, 0, 0],
        0.025,
      );
  }
  for (const z of [-width / 2, width / 2]) {
    beam(g, m.wood, [-length / 2, -0.25, z], [length / 2, -0.25, z], 0.14);
    for (let x = -length / 2; x <= length / 2 + 0.1; x += length / 6) {
      points(
        g,
        m.wood,
        "box",
        [x, 0.52, z],
        [0.18, 1.25, 0.18],
        [0, 0, 0],
        0.065,
      );
      points(
        g,
        m.gold,
        "box",
        [x, 1.18, z],
        [0.24, 0.065, 0.24],
        [0, 0, 0],
        0.045,
      );
      if (x < length / 2 - 0.1) {
        const end = x + length / 6;
        beam(g, m.wood, [x, 0.9, z], [end, 0.9, z], 0.065);
        beam(g, m.wood, [x, 0.22, z], [end, 0.85, z], 0.045);
      }
    }
    for (const x of [-length * 0.46, length * 0.46]) {
      points(
        g,
        m.stone,
        "box",
        [x, -0.68, z * 0.66],
        [1, 1.35, 0.65],
        [0, 0, 0],
        0.14,
      );
      beam(g, m.wood, [x, -0.7, z * 0.66], [x * 0.6, -0.2, z], 0.1);
    }
  }
  for (const x of [-length * 0.48, length * 0.48])
    for (const z of [-width * 0.5, width * 0.5]) {
      points(
        g,
        m.darkSteel,
        "box",
        [x, 1.4, z],
        [0.22, 0.28, 0.22],
        [0, 0, 0],
        0.045,
      );
      points(
        g,
        m.window,
        "ellipsoid",
        [x, 1.4, z],
        [0.09, 0.1, 0.09],
        [0, 0, 0],
        0.03,
      );
    }
  return batchRigid(g);
}
export function campfireModel(m) {
  const g = new T.Group();
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    points(
      g,
      m.stone,
      "ellipsoid",
      [Math.sin(a) * 0.5, 0.09, Math.cos(a) * 0.5],
      [0.15, 0.12, 0.12],
      [0, a, 0],
      0.07,
    );
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    beam(
      g,
      m.bark,
      [-Math.cos(a) * 0.36, 0.12, -Math.sin(a) * 0.36],
      [Math.cos(a) * 0.36, 0.18, Math.sin(a) * 0.36],
      0.085,
    );
  }
  const flame = new T.Group();
  g.add(flame);
  g.userData.flame = flame;
  for (let i = 0; i < 4; i++)
    points(
      flame,
      i % 2 ? m.fire : m.ember,
      "ellipsoid",
      [Math.sin(i * 2) * 0.13, 0.27 + i * 0.13, Math.cos(i * 2) * 0.1],
      [0.19 - i * 0.025, 0.27, 0.15 - i * 0.02],
      [0, 0, i * 0.2],
      0.05,
    );
  return batchRigid(g);
}
export function waysideModel(m, variant = 0) {
  const g = new T.Group();
  if (variant === 0) {
    for (const x of [-1.2, 0, 1.2])
      points(g, m.wood, "box", [x, 0.5, 0], [0.12, 1.1, 0.14], [0, 0, 0], 0.08);
    for (const y of [0.4, 0.85])
      beam(g, m.wood, [-1.3, y, 0], [1.3, y, 0], 0.055);
    for (const x of [-1.35, 1.35])
      points(
        g,
        m.moss,
        "ellipsoid",
        [x, 0.14, 0],
        [0.28, 0.2, 0.26],
        [0, 0, 0],
        0.12,
      );
  } else if (variant === 1) {
    points(g, m.wood, "box", [0, 0.9, 0], [0.12, 1.8, 0.12]);
    for (const y of [1.3, 1.65])
      points(
        g,
        m.wood,
        "box",
        [0.16, y, 0],
        [0.9, 0.22, 0.1],
        [0, 0, y > 1.4 ? 0.05 : -0.07],
        0.06,
      );
    points(
      g,
      m.gold,
      "box",
      [0.25, 1.65, 0.065],
      [0.3, 0.04, 0.015],
      [0, 0, 0],
      0.03,
    );
  } else if (variant === 3) {
    points(g, m.wood, "box", [0, 0.65, 0], [1.3, 0.14, 1.7], [0, 0, 0], 0.1);
    for (const x of [-0.64, 0.64]) {
      points(g, m.wood, "box", [x, 0.94, 0], [0.1, 0.6, 1.7], [0, 0, 0], 0.08);
      for (const z of [-0.65, 0.65]) {
        points(
          g,
          m.wood,
          "cylinder",
          [x * 1.2, 0.39, z],
          [0.36, 0.09, 0.36],
          [0, 0, Math.PI / 2],
          0.075,
        );
        beam(g, m.darkSteel, [x * 0.8, 0.39, z], [x * 1.35, 0.39, z], 0.04);
      }
    }
    for (const x of [-0.45, 0.45])
      beam(g, m.wood, [x, 0.65, 0.7], [x, 0.4, 2.1], 0.05);
    for (let i = 0; i < 3; i++)
      points(
        g,
        m.bark,
        "cylinder",
        [-0.35 + i * 0.35, 0.95, 0],
        [0.14, 1.35, 0.14],
        [Math.PI / 2, 0, 0],
        0.08,
      );
  } else {
    for (const x of [-0.33, 0.33]) {
      points(
        g,
        m.wood,
        "cylinder",
        [x, 0.35, 0],
        [0.24, 0.7, 0.24],
        [0, 0, 0],
        0.09,
      );
      for (const y of [0.12, 0.55])
        points(
          g,
          m.darkSteel,
          "cylinder",
          [x, y, 0],
          [0.25, 0.05, 0.25],
          [0, 0, 0],
          0.06,
        );
    }
    points(
      g,
      m.wood,
      "box",
      [0.1, 0.75, 0.1],
      [0.55, 0.4, 0.5],
      [0, 0.2, 0],
      0.09,
    );
  }
  return batchRigid(g);
}

// Each film sequence gets its own set and camera, rather than a single title diorama.
export function filmSet(m, id, scatter) {
  const g = new T.Group(),
    actors = [],
    fires = [];
  const meadow = id === "garden" || id === "oath",
    ruined = id === "siege" || id === "last-stand" || id === "ashes";
  const ground = [],
    grass = [],
    flowers = [];
  for (let z = -20; z < 16; z += 0.28)
    for (let x = -25; x < 25; x += 0.28) {
      const n = hash(Math.round(x * 100), Math.round(z * 100), 8);
      ground.push({
        x,
        y: 0,
        z,
        tint: meadow ? [0.4, 0.56, 0.35] : [0.6, 0.61, 0.56],
        r: n,
      });
      if (meadow) {
        const height = 0.22 + n * 0.55;
        for (let k = 1; k <= 4; k++)
          grass.push({
            x: x + n * 0.08,
            y: (height * k) / 4,
            z,
            plant: k / 4,
            r: n,
            tint: [0.7 + n * 0.4, 1, 0.65],
          });
        if (n > 0.86)
          for (let p = 0; p < 5; p++)
            flowers.push({
              x: x + Math.sin(p * 1.256) * 0.07,
              y: height + 0.06,
              z: z + Math.cos(p * 1.256) * 0.07,
              r: n,
              tint: n > 0.94 ? [1.7, 1.2, 0.45] : [1.4, 0.85, 1.6],
            });
      }
    }
  scatter(g, ground, m.stone);
  scatter(g, grass, m.grass);
  scatter(g, flowers, m.flower);
  if (["kingdom", "siege", "last-stand"].includes(id)) {
    for (const x of [-8, -3, 3, 8]) {
      const tower = new T.Group(),
        height = ruined && x === -8 ? 4.5 : 7;
      points(
        tower,
        m.stone,
        "cylinder",
        [0, height / 2, 0],
        [0.95, height, 0.95],
        [0, 0, 0],
        0.1,
      );
      for (let j = 0; j < 10; j++) {
        const a = (j * Math.PI) / 5;
        points(
          tower,
          m.stone,
          "box",
          [Math.sin(a) * 0.85, height + 0.3, Math.cos(a) * 0.85],
          [0.42, 0.6, 0.4],
          [0, a, 0],
          0.09,
        );
      }
      for (const y of [2.5, 4.8])
        points(
          tower,
          m.dark,
          "box",
          [0, y, 0.96],
          [0.2, 0.7, 0.03],
          [0, 0, 0],
          0.05,
        );
      points(tower, m.gold, "box", [0.3, 4, 1], [0.03, 1.6, 0.04]);
      points(
        tower,
        m.cloth,
        "box",
        [0, 4, 1],
        [0.55, 1.6, 0.035],
        [0, 0, 0],
        0.06,
      );
      tower.position.set(x, 0, -7);
      g.add(batchRigid(tower));
    }
    const gate = ruinModel(m);
    gate.position.set(0, 0, -6.7);
    g.add(gate);
    if (id === "kingdom")
      for (let x = -1; x <= 1; x += 0.25)
        points(
          g,
          m.darkSteel,
          "box",
          [x, 1.5, -7],
          [0.035, 3, 0.04],
          [0, 0, 0],
          0.04,
        );
    for (const x of [-12, -6, 6, 12]) {
      const house = houseModel(m);
      house.position.set(x, 0, -12);
      house.scale.setScalar(0.7);
      g.add(house);
    }
    for (const x of [-6, 6]) {
      points(g, m.stone, "box", [x, 2, -7], [5.5, 4, 1], [0, 0, 0], 0.13);
      for (let k = 0; k < 9; k++)
        points(
          g,
          m.stone,
          "box",
          [x - 2.6 + k * 0.65, 4.3, -7],
          [0.4, 0.6, 1],
          [0, 0, 0],
          0.12,
        );
    }
  }
  if (meadow) {
    const tree = treeModel(m, 2);
    tree.position.set(id === "oath" ? -1.8 : -3, 0, -2);
    g.add(tree);
  }
  if (id === "garden") {
    const princess = villagerModel(m, true);
    princess.position.set(1.2, 0, 0);
    princess.rotation.y = -0.7;
    g.add(princess);
    actors.push({ root: princess, role: "princess" });
  }
  if (ruined) {
    for (let i = 0; i < 24; i++) {
      const x = (hash(i, 41) - 0.5) * 23,
        z = -9 + hash(i, 42) * 16;
      points(
        g,
        m.darkStone,
        "box",
        [x, 0.1, z],
        [0.2 + hash(i, 43) * 0.5, 0.2, 0.35],
        [0, hash(i, 44) * 6, 0.15],
        0.1,
      );
    }
    for (let i = 0; i < (id === "siege" ? 7 : 3); i++) {
      const f = campfireModel(m);
      f.position.set((i - 3) * 2.4, 0, -4 - hash(i, 3) * 5);
      f.scale.setScalar(id === "siege" ? 1.7 : 0.7);
      g.add(f);
      fires.push(f);
    }
    const sparks = [];
    for (let i = 0; i < 550; i++)
      sparks.push({
        x: (hash(i, 3) - 0.5) * 23,
        y: hash(i, 4) * 10,
        z: -11 + hash(i, 5) * 18,
        r: hash(i, 8),
        plant: 1,
      });
    scatter(g, sparks, m.spark);
  }
  if (id === "last-stand")
    for (let i = 0; i < 3; i++) {
      const enemy = knightModel({ ...m, steel: m.darkSteel, cloth: m.dark });
      enemy.position.set(-2 + i * 2, 0, 3.8);
      g.add(enemy);
      actors.push({ root: enemy, role: "enemy", offset: i * 0.6 });
    }
  const distant = [];
  for (let z = -90; z < -22; z += 0.8)
    for (let x = -85; x < 85; x += 0.8) {
      const ridge = 7 + Math.sin(x * 0.06) * 3 + Math.cos(z * 0.09) * 2;
      distant.push({
        x,
        y: ridge + (z + 22) * -0.07,
        z,
        r: hash(Math.round(x * 10), Math.round(z * 10)),
        tint: ruined ? [0.4, 0.5, 0.55] : [0.7, 0.85, 0.74],
      });
    }
  scatter(g, distant, m.stone);
  const knight = knightModel(m);
  knight.position.set(0, 0, 0.2);
  g.add(knight);
  actors.push({ root: knight, role: "knight" });
  return { root: g, actors, fires };
}
