import * as T from "three";
import { CLASSES, hash } from "./core.js";

const geometries = new Map();
export function geometry(type) {
  if (!geometries.has(type))
    geometries.set(
      type,
      type === "sphere"
        ? new T.SphereGeometry(1, 12, 8)
        : type === "ico"
          ? new T.IcosahedronGeometry(1, 1)
          : type === "cylinder"
            ? new T.CylinderGeometry(1, 1, 1, 10)
            : type === "cone"
              ? new T.ConeGeometry(1, 1, 10)
              : type === "torus"
                ? new T.TorusGeometry(1, 0.08, 6, 40)
                : new T.BoxGeometry(1, 1, 1),
    );
  return geometries.get(type);
}
export function material(color, glow = 0) {
  return new T.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true,
    emissive: glow ? color : 0,
    emissiveIntensity: glow,
  });
}
export function part(
  parent,
  type,
  color,
  position,
  scale,
  rotation = [0, 0, 0],
) {
  const mesh = new T.Mesh(
    geometry(type),
    color?.isMaterial ? color : material(color),
  );
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function rod(parent, a, b, r, color) {
  const start = new T.Vector3(...a),
    end = new T.Vector3(...b);
  const m = part(
    parent,
    "cylinder",
    color,
    start.clone().add(end).multiplyScalar(0.5).toArray(),
    [r, start.distanceTo(end), r],
  );
  m.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    end.sub(start).normalize(),
  );
  return m;
}
export const TINTS = [
  "#7cbba3",
  "#9a83d3",
  "#d59465",
  "#6da8c9",
  "#c4b57c",
  "#b66e86",
];
export function character(
  kind = "elf",
  gender = "female",
  tint = 0,
  enemy = false,
) {
  const root = new T.Group(),
    c = CLASSES[kind] || CLASSES.elf;
  const cloth = new T.Color(TINTS[tint] || c.color);
  if (!tint) cloth.set(c.color);
  const skin = material(enemy ? "#7f9972" : "#d7b898"),
    fabric = material(cloth),
    dark = material(cloth.clone().multiplyScalar(0.35)),
    leather = material("#69513a"),
    metal = material(kind === "paladin" ? "#b9b6a1" : "#929b9d"),
    gold = material("#d0ac61"),
    hair = material(
      kind === "elf" ? "#d9d2ad" : kind === "mage" ? "#d5d5df" : "#352b2b",
    ),
    white = material("#ede9d5");
  const body = new T.Group();
  root.add(body);
  const slim = gender === "female" ? 0.86 : 1;
  part(body, "sphere", fabric, [0, 1.66, 0], [0.42 * slim, 0.61, 0.27]);
  part(body, "cylinder", leather, [0, 1.26, 0], [0.37 * slim, 0.12, 0.27]);
  part(body, "box", gold, [0, 1.26, 0.28], [0.14, 0.13, 0.06]);
  // Robes are a lathed, genuinely volumetric mesh.
  if (kind === "mage" || kind === "elf") {
    const points = [
      [0.3, 0],
      [0.55, 0.08],
      [0.52, 0.22],
      [0.42, 0.5],
      [0.34, 0.78],
    ].map(([r, y]) => new T.Vector2(r, y));
    const robe = new T.Mesh(new T.LatheGeometry(points, 14), fabric);
    robe.position.y = 0.45;
    body.add(robe);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      rod(
        body,
        [Math.sin(a) * 0.34, 1.15, Math.cos(a) * 0.34],
        [Math.sin(a) * 0.52, 0.54, Math.cos(a) * 0.52],
        0.018,
        gold,
      );
    }
    const cape = part(
      body,
      "sphere",
      dark,
      [0, 1.38, -0.21],
      [0.48, 0.74, 0.13],
    );
    cape.rotation.x = 0.12;
  }
  if (kind === "samurai" || kind === "paladin") {
    part(body, "sphere", metal, [0, 1.82, 0.04], [0.46 * slim, 0.4, 0.3]);
    for (let row = 0; row < 5; row++)
      for (let col = -2; col <= 2; col++)
        part(
          body,
          "box",
          row % 2 ? dark : fabric,
          [col * 0.145, 1.05 + row * 0.16, 0.28],
          [0.135, 0.14, 0.08],
          [0, 0, col * 0.04],
        );
    for (const s of [-1, 1]) {
      part(body, "sphere", metal, [s * 0.48, 2, 0], [0.3, 0.17, 0.31]);
      if (kind === "samurai")
        for (let i = 0; i < 3; i++)
          part(
            body,
            "box",
            fabric,
            [s * 0.53, 1.92 - i * 0.09, 0.02],
            [0.38, 0.07, 0.45],
          );
    }
    if (kind === "paladin") {
      part(body, "box", gold, [0, 1.83, 0.34], [0.06, 0.4, 0.035]);
      part(body, "box", gold, [0, 1.88, 0.34], [0.26, 0.06, 0.035]);
    }
  }
  const neck = part(body, "cylinder", skin, [0, 2.19, 0], [0.14, 0.2, 0.14]);
  const head = new T.Group();
  head.position.y = 2.48;
  body.add(head);
  part(head, "sphere", skin, [0, 0, 0], [0.285 * slim, 0.34, 0.26]);
  part(head, "sphere", hair, [0, 0.13, -0.05], [0.3 * slim, 0.25, 0.26]);
  for (const s of [-1, 1]) {
    part(head, "sphere", white, [s * 0.1, 0.035, 0.235], [0.067, 0.038, 0.03]);
    part(
      head,
      "sphere",
      material(kind === "elf" ? "#6cb99f" : "#62516d", 0.4),
      [s * 0.1, 0.035, 0.26],
      [0.026, 0.027, 0.012],
    );
    part(
      head,
      "box",
      hair,
      [s * 0.1, 0.1, 0.23],
      [0.14, 0.025, 0.024],
      [0, 0, s * 0.12],
    );
    if (kind === "elf")
      part(
        head,
        "cone",
        skin,
        [s * 0.32, 0.01, -0.025],
        [0.12, 0.33, 0.09],
        [0, 0, -s * 1.15],
      );
    if (gender === "female" || kind === "elf")
      for (let i = 0; i < 4; i++)
        part(
          head,
          "sphere",
          hair,
          [s * (0.23 - i * 0.008), -0.11 - i * 0.11, -0.1],
          [0.09, 0.18, 0.1],
        );
  }
  part(
    head,
    "cone",
    skin,
    [0, -0.04, 0.26],
    [0.055, 0.14, 0.07],
    [Math.PI / 2, 0, 0],
  );
  part(head, "box", material("#9c7068"), [0, -0.16, 0.236], [0.1, 0.018, 0.02]);
  if (kind === "mage") {
    part(head, "cylinder", dark, [0, 0.29, 0], [0.49, 0.04, 0.49]);
    const hat = part(head, "cone", fabric, [0, 0.64, 0], [0.35, 0.75, 0.35]);
    hat.rotation.z = -0.14;
    part(head, "sphere", gold, [-0.075, 0.87, 0.14], [0.07, 0.07, 0.035]);
  } else if (kind === "samurai") {
    part(head, "cylinder", fabric, [0, 0.13, 0], [0.3, 0.08, 0.27]);
    for (let i = 0; i < 2; i++)
      rod(
        head,
        [0, 0.12, -0.25],
        [0.3 + i * 0.13, -0.18 - i * 0.1, -0.45],
        0.025,
        fabric,
      );
    part(head, "sphere", hair, [0, 0.39, -0.1], [0.13, 0.15, 0.13]);
  } else if (kind === "paladin") {
    part(head, "sphere", metal, [0, 0.18, -0.04], [0.32, 0.23, 0.29]);
    part(head, "box", gold, [0, 0.25, 0.22], [0.06, 0.25, 0.06]);
  } else {
    part(
      head,
      "torus",
      gold,
      [0, 0.18, 0.01],
      [0.28, 0.28, 0.28],
      [Math.PI / 2, 0, 0],
    );
    part(
      head,
      "ico",
      material("#82e4b2", 0.6),
      [0, 0.18, 0.28],
      [0.075, 0.1, 0.045],
    );
  }
  const limbs = {};
  for (const s of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(s * 0.45 * slim, 1.97, 0);
    body.add(arm);
    arm.rotation.z = s * 0.12;
    part(arm, "sphere", fabric, [0, -0.23, 0], [0.115, 0.3, 0.13]);
    const elbow = new T.Group();
    elbow.position.y = -0.47;
    arm.add(elbow);
    part(
      elbow,
      "sphere",
      kind === "paladin" ? metal : skin,
      [0, -0.2, 0.015],
      [0.1, 0.24, 0.11],
    );
    part(elbow, "cylinder", leather, [0, -0.34, 0], [0.12, 0.16, 0.12]);
    part(elbow, "sphere", skin, [0, -0.47, 0.02], [0.095, 0.12, 0.08]);
    const leg = new T.Group();
    leg.position.set(s * 0.2, 1.08, 0);
    body.add(leg);
    part(leg, "sphere", dark, [0, -0.25, 0], [0.15, 0.32, 0.16]);
    const knee = new T.Group();
    knee.position.y = -0.47;
    leg.add(knee);
    part(
      knee,
      "cylinder",
      kind === "paladin" ? metal : leather,
      [0, -0.21, 0],
      [0.13, 0.43, 0.14],
    );
    part(knee, "box", leather, [0, -0.43, 0.08], [0.27, 0.15, 0.43]);
    limbs[s === 1 ? "rightArm" : "leftArm"] = arm;
    limbs[s === 1 ? "rightElbow" : "leftElbow"] = elbow;
    limbs[s === 1 ? "rightLeg" : "leftLeg"] = leg;
    limbs[s === 1 ? "rightKnee" : "leftKnee"] = knee;
  }
  const weapon = new T.Group();
  weapon.position.set(0, -0.46, 0.05);
  limbs.rightElbow.add(weapon);
  if (kind === "samurai" || kind === "paladin") {
    part(weapon, "cylinder", leather, [0, 0.09, 0], [0.045, 0.3, 0.045]);
    part(weapon, "box", gold, [0, 0.26, 0], [0.32, 0.055, 0.09]);
    part(
      weapon,
      "box",
      metal,
      [0, 0.87, 0],
      [kind === "samurai" ? 0.065 : 0.15, 1.2, 0.035],
    );
    part(weapon, "cone", metal, [0, 1.53, 0], [0.075, 0.17, 0.025]);
    if (kind === "paladin") {
      const shield = new T.Group();
      shield.position.set(-0.06, -0.2, 0.14);
      limbs.leftElbow.add(shield);
      part(shield, "sphere", metal, [0, 0, 0], [0.42, 0.6, 0.13]);
      part(shield, "sphere", fabric, [0, 0, 0.08], [0.35, 0.51, 0.07]);
      part(shield, "box", gold, [0, 0, 0.16], [0.07, 0.7, 0.035]);
      part(shield, "box", gold, [0, 0.09, 0.16], [0.48, 0.07, 0.035]);
    }
  } else {
    rod(weapon, [0, -0.6, 0], [0, 1.5, 0], 0.045, leather);
    if (kind === "mage") {
      part(
        weapon,
        "ico",
        material(c.color, 0.9),
        [0, 1.62, 0],
        [0.17, 0.27, 0.17],
      );
      part(weapon, "torus", gold, [0, 1.58, 0], [0.24, 0.32, 0.24]);
    } else {
      for (const s of [-1, 1])
        rod(weapon, [0, 1.2, 0], [s * 0.26, 1.62, 0], 0.04, leather);
      part(
        weapon,
        "sphere",
        material(c.color, 0.8),
        [0, 1.63, 0],
        [0.13, 0.13, 0.13],
      );
      for (let i = 0; i < 5; i++)
        part(
          weapon,
          "sphere",
          fabric,
          [Math.sin(i * 2) * 0.2, 1.4 + i * 0.045, 0.04],
          [0.14, 0.035, 0.07],
          [0, 0, i],
        );
    }
  }
  const tool = new T.Group();
  tool.visible = false;
  tool.position.copy(weapon.position);
  limbs.rightElbow.add(tool);
  rod(tool, [0, -0.2, 0], [0, 0.95, 0], 0.045, leather);
  part(tool, "box", metal, [0.15, 0.83, 0], [0.5, 0.25, 0.09]);
  root.userData = {
    body,
    head,
    limbs,
    weapon,
    tool,
    kind,
    gender,
    phase: hash(tint, kind.length) * 6,
    prev: null,
  };
  return root;
}
export function animateCharacter(
  root,
  p,
  time,
  dt,
  motion = true,
  showcase = false,
) {
  const d = root.userData,
    l = d.limbs;
  const moving =
    p.input && (p.input.up || p.input.down || p.input.left || p.input.right);
  const velocity = d.prev
    ? Math.hypot(p.x - d.prev.x, p.y - d.prev.y) / Math.max(dt, 0.001)
    : 0;
  d.prev = { x: p.x, y: p.y };
  const walk = motion && (moving || velocity > 0.15);
  const stride = walk ? Math.sin(time * (p.input?.sprint ? 16 : 11)) * 0.58 : 0;
  l.rightLeg.rotation.x = stride;
  l.leftLeg.rotation.x = -stride;
  l.rightKnee.rotation.x = Math.max(0, -stride) * 0.8;
  l.leftKnee.rotation.x = Math.max(0, stride) * 0.8;
  l.rightArm.rotation.x = -stride * 0.5;
  l.leftArm.rotation.x = stride * 0.5;
  l.rightElbow.rotation.x = -0.17;
  l.leftElbow.rotation.x = -0.2;
  d.body.position.y = motion
    ? Math.sin(time * 2 + d.phase) * 0.025 +
      (walk ? Math.abs(stride) * 0.06 : 0)
    : 0;
  d.head.rotation.y = motion ? Math.sin(time * 0.8 + d.phase) * 0.06 : 0;
  const a = p.anim,
    progress = a ? (time - a.start) / a.duration : 2,
    active = progress >= 0 && progress < 1;
  d.weapon.visible = !active || !["chop", "mine"].includes(a.type);
  d.tool.visible = !d.weapon.visible;
  const toolHead = d.tool.children[1];
  if (toolHead)
    toolHead.scale.set(
      active && a.type === "mine" ? 0.75 : 0.5,
      active && a.type === "mine" ? 0.1 : 0.25,
      0.09,
    );
  if (active) {
    const swing = Math.sin(progress * Math.PI);
    if (["slash", "dash", "holy", "attack", "chop", "mine"].includes(a.type)) {
      l.rightArm.rotation.x = -1.9 + swing * 3;
      l.rightArm.rotation.z = -0.25 - swing * 0.7;
      d.body.rotation.y = -0.45 + swing * 0.9;
      l.rightElbow.rotation.x = -0.6 + swing * 0.5;
    } else {
      l.rightArm.rotation.x = -1.5 * swing;
      l.leftArm.rotation.x = -1.2 * swing;
      l.leftElbow.rotation.x = -0.8 * swing;
      d.body.rotation.y = 0;
    }
  } else {
    l.rightArm.rotation.z = 0.12;
    d.body.rotation.y = 0;
  }
  if (showcase)
    root.rotation.y = motion ? -0.35 + Math.sin(time * 0.2) * 0.25 : 0;
  else {
    const angle = Math.atan2(p.facing?.x || 0, p.facing?.y ?? 1);
    root.rotation.y +=
      Math.atan2(
        Math.sin(angle - root.rotation.y),
        Math.cos(angle - root.rotation.y),
      ) * Math.min(1, dt * 12);
  }
}

export function house(style = 0) {
  const g = new T.Group(),
    wood = material("#735136"),
    plaster = material(style === 1 ? "#b0a28b" : "#b3ab8b"),
    roof = material(style === 2 ? "#5c7169" : "#865c40"),
    stone = material("#7c8279");
  part(g, "box", stone, [0, 0.2, 0], [5, 0.4, 4.5]);
  part(g, "box", plaster, [0, 1.8, 0], [4.6, 3.2, 4]);
  for (const x of [-2.25, 0, 2.25])
    for (const z of [-2.04, 2.04])
      part(g, "box", wood, [x, 1.8, z], [0.14, 3.3, 0.13]);
  for (const y of [0.55, 2.9])
    for (const z of [-2.06, 2.06])
      part(g, "box", wood, [0, y, z], [4.7, 0.14, 0.13]);
  for (const s of [-1, 1]) {
    const m = part(
      g,
      "box",
      roof,
      [s * 1.25, 4.15, 0],
      [3.25, 0.22, 5.1],
      [0, 0, -s * 0.63],
    );
    for (let i = 0; i < 9; i++)
      part(
        g,
        "box",
        wood,
        [s * 1.25, 4.17, -2.35 + i * 0.58],
        [3.27, 0.05, 0.045],
        [0, 0, -s * 0.63],
      );
  }
  part(g, "box", wood, [0, 3.28, 0], [0.18, 0.15, 5.2]);
  for (const x of [-1.45, 1.45]) {
    part(g, "box", wood, [x, 1.9, 2.04], [0.9, 1.2, 0.13]);
    part(g, "box", material("#edb968", 0.8), [x, 1.9, 2.12], [0.7, 0.96, 0.03]);
    part(g, "box", wood, [x, 1.9, 2.15], [0.06, 1, 0.04]);
    part(g, "box", wood, [x, 1.9, 2.15], [0.74, 0.06, 0.04]);
  }
  part(g, "box", wood, [0, 1.25, 2.1], [0.95, 2.05, 0.13]);
  for (let i = 0; i < 5; i++)
    part(
      g,
      "box",
      material("#8a6443"),
      [-0.36 + i * 0.18, 1.25, 2.18],
      [0.14, 2, 0.04],
    );
  part(
    g,
    "sphere",
    material("#cbb272"),
    [0.3, 1.15, 2.23],
    [0.045, 0.045, 0.045],
  );
  for (let i = 0; i < 3; i++)
    part(
      g,
      "box",
      stone,
      [0, 0.12 - i * 0.06, 2.4 + i * 0.3],
      [1.5, 0.15, 0.6],
    );
  part(g, "box", stone, [-1.4, 4.25, -0.9], [0.6, 2, 0.6]);
  for (let i = 0; i < 4; i++)
    part(
      g,
      "box",
      material("#777e73"),
      [-1.4, 3.8 + i * 0.4, -0.9],
      [0.64, 0.06, 0.64],
    );
  for (let i = 0; i < 5; i++) {
    part(g, "box", wood, [-2.9, 0.4, -1 + i * 0.8], [0.7, 0.8, 0.7]);
    part(
      g,
      "sphere",
      material("#728f41"),
      [-2.9, 0.9, -1 + i * 0.8],
      [0.5, 0.3, 0.5],
    );
  }
  return g;
}
export function ruin(seed = 0) {
  const g = new T.Group(),
    stone = material("#8e9690"),
    moss = material("#526e42"),
    dark = material("#68756c");
  for (const x of [-2, 2]) {
    part(g, "box", dark, [x, 0.18, 0], [1.15, 0.36, 1.15]);
    for (let i = 0; i < 7; i++)
      part(
        g,
        "box",
        i % 2 ? dark : stone,
        [x, 0.55 + i * 0.51, 0],
        [0.8, 0.48, 0.85],
        [0, (i % 2) * 0.025, 0],
      );
    part(g, "box", stone, [x, 4, 0], [1.15, 0.3, 1.05]);
  }
  const curve = new T.EllipseCurve(0, 0, 2, 1.45, 0, Math.PI, false, 0);
  const points = curve.getPoints(14);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1];
    rod(g, [a.x, 4 + a.y, 0], [b.x, 4 + b.y, 0], 0.34, stone);
  }
  for (let i = 0; i < 25; i++) {
    const x = (hash(i, seed) * 2 - 1) * 4,
      z = (hash(i, seed, 83) * 2 - 1) * 3;
    if (Math.abs(z) < 0.6 && Math.abs(x) < 1.3) continue;
    part(
      g,
      "box",
      i % 5 ? stone : moss,
      [x, 0.15 + hash(i, seed, 53) * 0.15, z],
      [0.3 + hash(i, seed) * 0.5, 0.25 + hash(i, seed, 71) * 0.4, 0.35],
      [hash(i, seed) * 0.5, hash(i, seed, 3) * 3, 0.15],
    );
  }
  for (let i = 0; i < 8; i++)
    rod(
      g,
      [-2.5 + Math.sin(i) * 0.3, 0.2 + i * 0.47, 0.5],
      [-2.3 + Math.sin(i + 1) * 0.3, 0.7 + i * 0.47, 0.55],
      0.035,
      moss,
    );
  for (let i = 0; i < 6; i++)
    part(g, "box", dark, [-3.8, 0.3 + i * 0.5, -2], [2, 0.45, 0.75]);
  return g;
}

export function interior(style = 0) {
  const g = new T.Group(),
    wood = material("#8f6c4a"),
    dark = material("#604835"),
    stone = material("#8f9385"),
    plaster = material("#b5ab91"),
    brass = material("#c9a46e");
  for (let i = 0; i < 18; i++) {
    part(
      g,
      "box",
      i % 3 ? wood : dark,
      [-2.85 + i * 0.335, -0.07, 0],
      [0.32, 0.14, 6],
    );
    for (const z of [-2.7, 2.7])
      part(
        g,
        "sphere",
        brass,
        [-2.85 + i * 0.335, 0.007, z],
        [0.018, 0.009, 0.018],
      );
  }
  part(g, "box", plaster, [0, 1.65, -3], [6.1, 3.3, 0.17]);
  part(g, "box", plaster, [-3, 1.65, 0], [0.17, 3.3, 6]);
  part(g, "box", plaster, [3, 1.65, 0], [0.17, 3.3, 6]);
  for (const x of [-3, 0, 3])
    part(g, "box", dark, [x, 1.65, -2.85], [0.17, 3.3, 0.17]);
  for (const z of [-3, 0, 3])
    for (const x of [-2.86, 2.86])
      part(g, "box", dark, [x, 1.65, z], [0.18, 3.3, 0.18]);
  for (const y of [0.22, 2.9]) {
    part(g, "box", dark, [0, y, -2.83], [6, 0.15, 0.15]);
    for (const x of [-2.83, 2.83])
      part(g, "box", dark, [x, y, 0], [0.15, 0.15, 6]);
  }
  // The front and roof are cut away for a clear interior view.
  for (const x of [-2.5, 2.5]) part(g, "box", dark, [x, 0.2, 3], [1, 0.4, 0.2]);
  part(
    g,
    "box",
    material(style === 1 ? "#667e96" : "#9b5e54"),
    [0, 0.015, 0.35],
    [2.45, 0.025, 2.7],
  );
  for (const x of [-1.13, 1.13])
    part(g, "box", brass, [x, 0.032, 0.35], [0.06, 0.012, 2.5]);
  for (const z of [-0.9, 1.6])
    part(g, "box", brass, [0, 0.032, z], [2.3, 0.012, 0.06]);
  // Hearth, chimney, glowing embers and a mantle.
  for (const x of [-0.7, 0.7])
    part(g, "box", stone, [x, 0.65, -2.52], [0.35, 1.3, 0.75]);
  part(g, "box", stone, [0, 1.4, -2.52], [1.8, 0.3, 0.8]);
  part(g, "box", stone, [0, 2.3, -2.7], [1.4, 1.5, 0.45]);
  part(g, "box", material("#382d27"), [0, 0.4, -2.84], [1, 0.8, 0.1]);
  for (let i = 0; i < 5; i++) {
    part(
      g,
      "cylinder",
      dark,
      [-0.3 + i * 0.15, 0.17, -2.42],
      [0.06, 0.6, 0.06],
      [0, 0, Math.PI / 2],
    );
    part(
      g,
      "cone",
      material(i % 2 ? "#edb259" : "#e06c3c", 1.2),
      [-0.35 + i * 0.17, 0.4, -2.45],
      [0.13, 0.45 + hash(i, 1) * 0.3, 0.13],
    );
  }
  const fire = new T.PointLight("#ffbb77", 18, 8, 2);
  fire.position.set(0, 0.8, -1.8);
  g.add(fire);
  g.userData.fire = fire;
  // Bed and pillow.
  part(g, "box", dark, [-2.05, 0.35, -1.5], [1.35, 0.45, 2.2]);
  part(g, "box", material("#b8b9a2"), [-2.05, 0.64, -1.5], [1.2, 0.2, 2]);
  part(g, "box", material("#758e8d"), [-2.05, 0.79, -1.15], [1.22, 0.12, 1.3]);
  part(
    g,
    "sphere",
    material("#dcd7b9"),
    [-2.05, 0.83, -2.13],
    [0.47, 0.12, 0.28],
  );
  part(g, "box", dark, [-2.05, 0.85, -2.61], [1.4, 1.1, 0.14]);
  // Table, chairs, crockery, bread and candle.
  part(g, "cylinder", wood, [1.65, 0.9, 0.55], [0.75, 0.12, 0.75]);
  for (const x of [1.2, 2.1])
    for (const z of [0.1, 1])
      part(g, "box", dark, [x, 0.45, z], [0.1, 0.9, 0.1]);
  part(g, "cylinder", material("#c4c2a6"), [1.5, 1, 0.6], [0.2, 0.035, 0.2]);
  part(g, "sphere", material("#c7a16b"), [1.5, 1.06, 0.6], [0.17, 0.08, 0.13]);
  part(
    g,
    "cylinder",
    material("#c8d5c9"),
    [1.9, 1.09, 0.35],
    [0.08, 0.2, 0.08],
  );
  part(
    g,
    "cylinder",
    material("#e3d3a4"),
    [1.65, 1.15, 0.9],
    [0.05, 0.4, 0.05],
  );
  part(
    g,
    "sphere",
    material("#ffc777", 1),
    [1.65, 1.4, 0.9],
    [0.035, 0.07, 0.035],
  );
  for (const z of [-0.5, 1.65]) {
    part(g, "box", dark, [1.65, 0.47, z], [0.6, 0.1, 0.6]);
    part(g, "box", wood, [1.65, 0.85, z + 0.25], [0.6, 0.75, 0.08]);
    for (const x of [1.42, 1.88])
      for (const zz of [z - 0.23, z + 0.23])
        part(g, "box", dark, [x, 0.22, zz], [0.07, 0.45, 0.07]);
  }
  // Bookshelves with individual books and jars.
  for (const x of [1.4, 2.7])
    part(g, "box", dark, [x, 1.5, -2.65], [0.1, 3, 0.5]);
  for (let row = 0; row < 4; row++) {
    part(g, "box", wood, [2.05, 0.3 + row * 0.7, -2.65], [1.4, 0.1, 0.6]);
    for (let i = 0; i < 7; i++)
      part(
        g,
        "box",
        material(["#b17c64", "#859c83", "#6f92a7", "#bba97a"][i % 4]),
        [1.55 + i * 0.16, 0.57 + row * 0.7, -2.58],
        [0.1, 0.4 + hash(i, row) * 0.12, 0.3],
        [0, 0, (i % 3) * 0.04],
      );
  }
  part(g, "box", dark, [-2.87, 2, 1.2], [0.1, 1.5, 1.2]);
  part(g, "box", material("#8eafbd", 0.4), [-2.81, 2, 1.2], [0.03, 1.3, 1]);
  part(g, "box", wood, [-2.78, 2, 1.2], [0.05, 0.06, 1.1]);
  part(g, "box", wood, [-2.78, 2, 1.2], [0.05, 1.3, 0.07]);
  return g;
}

export function enemyModel(kind) {
  const root = character(
      kind === 4 ? "paladin" : kind === 3 || kind === 5 ? "samurai" : "elf",
      "male",
      kind,
      true,
    ),
    d = root.userData;
  if (kind === 1) {
    root.traverse((m) => {
      if (m.isMesh) m.visible = false;
    });
    const bone = material("#c6c2a9"),
      socket = material("#182322");
    rod(d.body, [0, 1.2, 0], [0, 2.12, 0], 0.065, bone);
    part(d.body, "sphere", bone, [0, 1.14, 0], [0.29, 0.16, 0.2]);
    for (let i = 0; i < 5; i++) {
      const ribs = part(
        d.body,
        "torus",
        bone,
        [0, 1.52 + i * 0.1, 0.04],
        [0.32 - i * 0.025, 0.19, 0.18],
        [Math.PI / 2, 0, 0],
      );
    }
    part(d.head, "sphere", bone, [0, 0, 0], [0.26, 0.31, 0.24]);
    for (const s of [-1, 1])
      part(
        d.head,
        "sphere",
        socket,
        [s * 0.1, 0.04, 0.216],
        [0.075, 0.09, 0.04],
      );
    part(d.head, "cone", socket, [0, -0.07, 0.24], [0.05, 0.08, 0.02]);
    for (let i = 0; i < 6; i++)
      part(
        d.head,
        "box",
        bone,
        [-0.11 + i * 0.044, -0.22, 0.19],
        [0.033, 0.07, 0.1],
      );
    for (const s of ["right", "left"]) {
      rod(d.limbs[`${s}Arm`], [0, 0, 0], [0, -0.46, 0], 0.065, bone);
      rod(d.limbs[`${s}Elbow`], [0, 0, 0], [0, -0.45, 0], 0.055, bone);
      rod(d.limbs[`${s}Leg`], [0, 0, 0], [0, -0.47, 0], 0.075, bone);
      rod(d.limbs[`${s}Knee`], [0, 0, 0], [0, -0.43, 0], 0.06, bone);
      part(d.limbs[`${s}Knee`], "box", bone, [0, -0.44, 0.08], [0.2, 0.1, 0.3]);
    }
    part(d.weapon, "box", material("#7c898a"), [0, 0.5, 0], [0.12, 1.1, 0.04]);
  } else if (kind === 4) {
    for (const s of [-1, 1])
      part(
        d.head,
        "cone",
        material("#e1d7ae"),
        [s * 0.17, -0.15, 0.26],
        [0.05, 0.23, 0.04],
        [0, 0, s * 0.1],
      );
    part(
      d.head,
      "sphere",
      material("#6f914f"),
      [0, -0.06, 0.2],
      [0.22, 0.16, 0.12],
    );
    for (const s of [-1, 1])
      part(
        d.head,
        "cone",
        material("#6f914f"),
        [s * 0.34, 0.06, -0.02],
        [0.12, 0.35, 0.1],
        [0, 0, -s * 1.2],
      );
    root.scale.setScalar(1.16);
  } else if (kind === 5) {
    part(
      d.head,
      "sphere",
      material("#6ba38e"),
      [0, -0.02, 0.27],
      [0.2, 0.16, 0.34],
    );
    for (let i = 0; i < 6; i++)
      part(
        d.head,
        "cone",
        material("#cad0a1"),
        [0, 0.2 - i * 0.08, -0.18],
        [0.06, 0.15, 0.06],
        [-0.2, 0, 0],
      );
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0, 1, -0.15),
      new T.Vector3(0.2, 0.6, -0.8),
      new T.Vector3(0.6, 0.35, -1.5),
      new T.Vector3(0.85, 0.25, -1.9),
    ]);
    d.body.add(
      new T.Mesh(
        new T.TubeGeometry(curve, 12, 0.12, 6, false),
        material("#589780"),
      ),
    );
  } else if (kind === 2) {
    part(
      d.head,
      "box",
      material("#817955"),
      [-0.11, -0.07, 0.25],
      [0.16, 0.04, 0.03],
    );
    for (const a of [d.limbs.leftArm, d.limbs.rightArm]) a.rotation.x = -0.7;
  } else if (kind === 3) {
    part(
      d.head,
      "sphere",
      material("#554b3d"),
      [0, -0.15, 0.15],
      [0.28, 0.13, 0.18],
    );
  }
  return root;
}
