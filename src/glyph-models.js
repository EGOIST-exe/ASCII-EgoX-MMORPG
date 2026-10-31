import { batchRigid } from "./ascii-batch.js";
import * as T from "three";
import { hash } from "./core.js";

const templates = new Map();
export function surface(type, sx, sy, sz, step = 0.105) {
  const key = `${type}:${sx}:${sy}:${sz}:${step}`;
  if (templates.has(key)) return templates.get(key);
  const positions = [],
    normals = [],
    jitter = [];
  const push = (x, y, z, nx, ny, nz) => {
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    jitter.push(hash(positions.length, 17));
  };
  if (type === "ellipsoid") {
    const rows = Math.max(5, Math.ceil((Math.PI * sy) / step));
    for (let row = 0; row <= rows; row++) {
      const theta = (row / rows) * Math.PI,
        ring = Math.max(
          6,
          Math.ceil((Math.sin(theta) * Math.PI * 2 * Math.max(sx, sz)) / step),
        );
      for (let col = 0; col < ring; col++) {
        const a = (col / ring) * Math.PI * 2,
          x = Math.sin(theta) * Math.cos(a) * sx,
          y = Math.cos(theta) * sy,
          z = Math.sin(theta) * Math.sin(a) * sz,
          n = new T.Vector3(x / sx ** 2, y / sy ** 2, z / sz ** 2).normalize();
        push(x, y, z, n.x, n.y, n.z);
      }
    }
  } else if (type === "cylinder") {
    const rows = Math.max(2, Math.ceil(sy / step)),
      cols = Math.max(8, Math.ceil((Math.PI * 2 * Math.max(sx, sz)) / step));
    for (let r = 0; r <= rows; r++)
      for (let k = 0; k < cols; k++) {
        const a = (k / cols) * Math.PI * 2;
        push(
          Math.cos(a) * sx,
          (r / rows - 0.5) * sy,
          Math.sin(a) * sz,
          Math.cos(a),
          0,
          Math.sin(a),
        );
      }
    for (const sign of [-1, 1])
      for (let r = 0; r < 1; r += step / Math.max(sx, sz))
        for (let k = 0; k < cols; k++) {
          const a = (k / cols) * Math.PI * 2;
          push(
            Math.cos(a) * sx * r,
            (sign * sy) / 2,
            Math.sin(a) * sz * r,
            0,
            sign,
            0,
          );
        }
  } else {
    for (let axis = 0; axis < 3; axis++)
      for (const sign of [-1, 1]) {
        const dims = [sx, sy, sz],
          a = (axis + 1) % 3,
          b = (axis + 2) % 3,
          na = Math.max(1, Math.ceil(dims[a] / step)),
          nb = Math.max(1, Math.ceil(dims[b] / step));
        for (let i = 0; i <= na; i++)
          for (let j = 0; j <= nb; j++) {
            const p = [0, 0, 0],
              n = [0, 0, 0];
            p[axis] = (dims[axis] * sign) / 2;
            p[a] = (i / na - 0.5) * dims[a];
            p[b] = (j / nb - 0.5) * dims[b];
            n[axis] = sign;
            push(...p, ...n);
          }
      }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  geo.setAttribute("jitter", new T.Float32BufferAttribute(jitter, 1));
  geo.computeBoundingSphere();
  templates.set(key, geo);
  return geo;
}
export function points(
  parent,
  mat,
  type,
  position,
  dimensions,
  rotation = [0, 0, 0],
  step = 0.105,
) {
  const mesh = new T.Points(surface(type, ...dimensions, step), mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}
export function beam(parent, mat, a, b, r = 0.06) {
  const va = new T.Vector3(...a),
    vb = new T.Vector3(...b),
    p = points(
      parent,
      mat,
      "cylinder",
      va.clone().add(vb).multiplyScalar(0.5).toArray(),
      [r, va.distanceTo(vb), r],
      [0, 0, 0],
      Math.min(0.08, r),
    );
  p.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    vb.sub(va).normalize(),
  );
  return p;
}

export function knightModel(m) {
  const root = new T.Group(),
    body = new T.Group(),
    pivot = new T.Group();
  root.add(pivot);
  pivot.add(body);
  const d = { body, pivot, limbs: {}, head: null, weapon: null };
  root.userData = d;
  points(
    body,
    m.steel,
    "ellipsoid",
    [0, 1.65, 0],
    [0.39, 0.48, 0.25],
    [0, 0, 0],
    0.055,
  );
  points(
    body,
    m.darkSteel,
    "cylinder",
    [0, 1.22, 0],
    [0.33, 0.18, 0.25],
    [0, 0, 0],
    0.055,
  );
  points(
    body,
    m.gold,
    "box",
    [0, 1.23, 0.26],
    [0.16, 0.12, 0.035],
    [0, 0, 0],
    0.04,
  );
  for (let i = 0; i < 5; i++)
    points(
      body,
      i % 2 ? m.steel : m.darkSteel,
      "box",
      [0, 1.31 + i * 0.14, 0.245],
      [0.54, 0.065, 0.06],
      [0, 0, 0],
      0.05,
    );
  points(
    body,
    m.gold,
    "box",
    [0, 1.81, 0.257],
    [0.045, 0.35, 0.025],
    [0, 0, 0],
    0.03,
  );
  points(
    body,
    m.gold,
    "box",
    [0, 1.85, 0.26],
    [0.23, 0.045, 0.025],
    [0, 0, 0],
    0.03,
  );
  points(
    body,
    m.cloth,
    "box",
    [0, 1.25, -0.23],
    [0.66, 1.2, 0.04],
    [0.12, 0, 0],
    0.065,
  );
  points(
    body,
    m.darkSteel,
    "ellipsoid",
    [0, 1.04, 0],
    [0.32, 0.2, 0.24],
    [0, 0, 0],
    0.06,
  );
  const head = new T.Group();
  head.position.set(0, 2.32, 0);
  body.add(head);
  d.head = head;
  points(
    head,
    m.steel,
    "ellipsoid",
    [0, 0.12, 0],
    [0.27, 0.32, 0.25],
    [0, 0, 0],
    0.045,
  );
  points(
    head,
    m.darkSteel,
    "box",
    [0, 0.11, 0.237],
    [0.42, 0.12, 0.035],
    [0, 0, 0],
    0.03,
  );
  points(
    head,
    m.gold,
    "box",
    [0, 0.11, 0.266],
    [0.025, 0.13, 0.015],
    [0, 0, 0],
    0.025,
  );
  for (let i = 0; i < 7; i++)
    points(
      head,
      m.dark,
      "box",
      [-0.165 + i * 0.055, 0.115, 0.265],
      [0.025, 0.04, 0.009],
      [0, 0, 0],
      0.018,
    );
  points(
    head,
    m.steel,
    "ellipsoid",
    [0, -0.08, 0.075],
    [0.24, 0.18, 0.2],
    [0, 0, 0],
    0.04,
  );
  for (let i = 0; i < 5; i++)
    points(
      head,
      m.dark,
      "box",
      [-0.13 + i * 0.065, -0.075, 0.259],
      [0.018, 0.055, 0.015],
      [0, 0, 0],
      0.015,
    );
  points(
    head,
    m.gold,
    "box",
    [0, 0.36, 0],
    [0.065, 0.09, 0.4],
    [0, 0, 0],
    0.035,
  );
  for (let i = 0; i < 6; i++)
    points(
      head,
      m.cloth,
      "ellipsoid",
      [0, 0.43 + i * 0.04, -0.08 - i * 0.065],
      [0.06, 0.11, 0.07],
      [0.4, 0, 0],
      0.04,
    );
  for (const s of [-1, 1]) {
    const side = s === 1 ? "right" : "left",
      arm = new T.Group(),
      elbow = new T.Group(),
      leg = new T.Group(),
      knee = new T.Group();
    arm.position.set(s * 0.45, 1.98, 0);
    body.add(arm);
    elbow.position.y = -0.43;
    arm.add(elbow);
    leg.position.set(s * 0.19, 1.03, 0);
    body.add(leg);
    knee.position.y = -0.46;
    leg.add(knee);
    d.limbs[`${side}Arm`] = arm;
    d.limbs[`${side}Elbow`] = elbow;
    d.limbs[`${side}Leg`] = leg;
    d.limbs[`${side}Knee`] = knee;
    points(
      arm,
      m.steel,
      "ellipsoid",
      [0, 0, 0],
      [0.26, 0.14, 0.26],
      [0, 0, s * 0.14],
      0.05,
    );
    for (let i = 0; i < 3; i++)
      points(
        arm,
        m.gold,
        "box",
        [0, -0.06 - i * 0.045, 0.18],
        [0.3, 0.018, 0.04],
        [0, 0, 0],
        0.045,
      );
    points(
      arm,
      m.darkSteel,
      "cylinder",
      [0, -0.23, 0],
      [0.105, 0.36, 0.12],
      [0, 0, 0],
      0.055,
    );
    points(
      elbow,
      m.steel,
      "ellipsoid",
      [0, 0, 0],
      [0.13, 0.12, 0.14],
      [0, 0, 0],
      0.045,
    );
    points(
      elbow,
      m.steel,
      "cylinder",
      [0, -0.22, 0],
      [0.1, 0.35, 0.105],
      [0, 0, 0],
      0.045,
    );
    points(
      elbow,
      m.darkSteel,
      "ellipsoid",
      [0, -0.44, 0.035],
      [0.1, 0.12, 0.085],
      [0, 0, 0],
      0.04,
    );
    for (let i = 0; i < 3; i++)
      points(
        elbow,
        m.steel,
        "box",
        [-0.055 + i * 0.055, -0.48, 0.09],
        [0.035, 0.09, 0.055],
        [0, 0, 0],
        0.03,
      );
    points(
      leg,
      m.darkSteel,
      "ellipsoid",
      [0, -0.22, 0],
      [0.14, 0.31, 0.16],
      [0, 0, 0],
      0.055,
    );
    points(
      knee,
      m.gold,
      "ellipsoid",
      [0, 0, 0.065],
      [0.16, 0.1, 0.13],
      [0, 0, 0],
      0.045,
    );
    points(
      knee,
      m.steel,
      "cylinder",
      [0, -0.23, 0],
      [0.11, 0.42, 0.13],
      [0, 0, 0],
      0.05,
    );
    points(
      knee,
      m.steel,
      "box",
      [0, -0.43, 0.1],
      [0.25, 0.17, 0.46],
      [0, 0, 0],
      0.045,
    );
  }
  const weapon = new T.Group();
  const wrist = new T.Group();
  wrist.position.set(0, -0.44, 0.025);
  d.limbs.rightElbow.add(wrist);
  d.wrist = wrist;
  // The grip and every finger share a wrist pivot, so the blade cannot detach during a swing.
  const elbow = d.limbs.rightElbow;
  elbow.children.slice(2, 6).forEach((o) => elbow.remove(o));
  points(
    wrist,
    m.darkSteel,
    "ellipsoid",
    [0, 0.02, -0.055],
    [0.11, 0.115, 0.07],
    [0, 0, 0],
    0.028,
  );
  for (let f = 0; f < 4; f++) {
    points(
      wrist,
      m.steel,
      "ellipsoid",
      [0.055, -0.075 + f * 0.05, 0.008],
      [0.065, 0.022, 0.06],
      [0, 0, 0],
      0.018,
    );
  }
  points(
    wrist,
    m.steel,
    "ellipsoid",
    [-0.055, 0.065, 0.025],
    [0.04, 0.055, 0.045],
    [0, 0, -0.5],
    0.018,
  );
  wrist.add(weapon);
  d.weapon = weapon;
  points(
    weapon,
    m.leather,
    "cylinder",
    [0, 0.05, 0],
    [0.035, 0.25, 0.035],
    [0, 0, 0],
    0.03,
  );
  points(
    weapon,
    m.gold,
    "ellipsoid",
    [0, -0.1, 0],
    [0.07, 0.065, 0.07],
    [0, 0, 0],
    0.03,
  );
  points(
    weapon,
    m.gold,
    "box",
    [0, 0.21, 0],
    [0.38, 0.045, 0.07],
    [0, 0, 0],
    0.025,
  );
  points(
    weapon,
    m.brightSteel,
    "box",
    [0, 0.87, 0],
    [0.12, 1.25, 0.03],
    [0, 0, 0],
    0.035,
  );
  points(
    weapon,
    m.steel,
    "box",
    [0, 0.87, 0.017],
    [0.025, 1.25, 0.015],
    [0, 0, 0],
    0.03,
  );
  points(
    weapon,
    m.brightSteel,
    "ellipsoid",
    [0, 1.52, 0],
    [0.06, 0.14, 0.018],
    [0, 0, 0],
    0.025,
  );
  const tool = new T.Group();
  weapon.parent.add(tool);
  tool.position.copy(weapon.position);
  tool.visible = false;
  d.tool = tool;
  points(
    tool,
    m.leather,
    "cylinder",
    [0, 0.3, 0],
    [0.035, 1, 0.035],
    [0, 0, 0],
    0.035,
  );
  points(
    tool,
    m.steel,
    "box",
    [0.15, 0.78, 0],
    [0.45, 0.28, 0.07],
    [0, 0, 0],
    0.04,
  );
  return batchRigid(root);
}
export function animateKnight(root, p, time, motion = true, seated = false) {
  const d = root.userData,
    l = d.limbs,
    a = p.anim || {},
    progress = (time - (a.start || 0)) / (a.duration || 1),
    active = progress >= 0 && progress < 1,
    kind =
      p.hp <= 0
        ? "death"
        : p.fishing
          ? "fish"
          : active
            ? a.kind || "idle"
            : "idle";
  seated = seated || p.camping;
  d.pivot.position.set(0, 0, 0);
  d.pivot.rotation.set(0, 0, 0);
  const moving =
      !p.roll &&
      !seated &&
      motion &&
      p.input &&
      (p.input.up || p.input.down || p.input.left || p.input.right),
    stride = moving ? Math.sin(time * (p.input.sprint ? 15 : 10)) * 0.65 : 0;
  d.body.position.set(
    0,
    moving
      ? Math.abs(stride) * 0.05
      : motion
        ? Math.sin(time * 1.7) * 0.018
        : 0,
    0,
  );
  d.body.rotation.set(0, 0, 0);
  d.head.rotation.y = motion ? Math.sin(time * 0.6) * 0.04 : 0;
  l.rightLeg.rotation.set(stride, 0, 0);
  l.leftLeg.rotation.set(-stride, 0, 0);
  l.rightKnee.rotation.x = Math.max(0, -stride) * 0.8;
  l.leftKnee.rotation.x = Math.max(0, stride) * 0.8;
  l.rightArm.rotation.set(-stride * 0.4, 0, -0.08);
  l.leftArm.rotation.set(stride * 0.4, 0, 0.08);
  l.rightElbow.rotation.x = -0.16;
  l.leftElbow.rotation.x = -0.32;
  d.weapon.visible = true;
  d.tool.visible = false;
  d.weapon.rotation.set(0, 0, 0);
  d.wrist.rotation.set(2.05, 0, -0.15);
  if (seated || kind === "sit" || kind === "fish" || p.mounted) {
    d.body.position.y = p.mounted
      ? -0.4
      : p.restBench
        ? -0.4
        : seated
          ? -0.72
          : -0.6;
    l.rightLeg.rotation.x = -1.2;
    l.leftLeg.rotation.x = -1.2;
    l.rightKnee.rotation.x = seated && !p.restBench && !p.mounted ? 0.35 : 1.25;
    l.leftKnee.rotation.x = seated && !p.restBench && !p.mounted ? 0.35 : 1.25;
    if (p.mounted) {
      l.rightLeg.rotation.z = -0.3;
      l.leftLeg.rotation.z = 0.3;
    }
    l.rightArm.rotation.x = -0.6;
    l.leftArm.rotation.x = -0.5;
    l.rightElbow.rotation.x = -0.8;
    l.leftElbow.rotation.x = -0.7;
    d.wrist.rotation.set(1.8, 0.2, 0.5);
  }
  if (
    kind.startsWith("slash") ||
    ["cleave", "charge", "chop", "mine"].includes(kind)
  ) {
    const t = Math.max(0, Math.min(1, progress));
    // Anticipation (0-.24), fast cut (.24-.64), then a slower recovery.
    const ease = (v) => v * v * (3 - 2 * v),
      cut = ease(Math.max(0, Math.min(1, (t - 0.24) / 0.4))),
      recover = ease(Math.max(0, (t - 0.64) / 0.36));
    const wind = ease(Math.min(1, t / 0.24)),
      reverse = kind === "slash2" ? -1 : 1,
      overhead =
        kind === "slash0" ||
        kind === "cleave" ||
        kind === "chop" ||
        kind === "mine";
    l.rightArm.rotation.set(
      -0.45 - wind * 1.55 + cut * 2.25 - recover * 0.25,
      reverse * (0.5 - wind * 0.95 + cut * 1.2),
      reverse * (-0.25 - wind * 0.7 + cut * 1.45 - recover * 0.5),
    );
    l.rightElbow.rotation.x = -0.3 - wind * 0.85 + cut * 0.9;
    d.wrist.rotation.set(
      overhead ? 0.2 : 0.55,
      0,
      reverse * (-0.3 + cut * 0.6),
    );
    d.body.rotation.y =
      reverse * (-wind * 0.48 + cut * 0.95) * (1 - recover * 0.8);
    d.body.rotation.x = Math.sin(t * Math.PI) * 0.12;
    l.leftArm.rotation.set(-0.35 + cut * 0.65, 0, 0.35 + wind * 0.3);
    l.leftElbow.rotation.x = -0.7;
    if (kind === "chop" || kind === "mine") {
      d.weapon.visible = false;
      d.tool.visible = true;
    }
  }
  if (kind === "block" || p.block > 0) {
    l.rightArm.rotation.set(-1.15, -0.3, -0.4);
    l.rightElbow.rotation.x = -1.1;
    d.wrist.rotation.set(0.35, 0, -0.8);
    l.leftArm.rotation.set(-0.7, 0, 0.4);
    l.leftElbow.rotation.x = -1.2;
  }
  if (kind === "drink") {
    l.rightArm.rotation.x = -1.6;
    l.rightElbow.rotation.x = -1.5;
    d.weapon.visible = false;
  }
  if (kind === "rally" || kind === "respawn") {
    l.rightArm.rotation.x = -1.6;
    l.leftArm.rotation.x = -0.8;
  }
  if (kind === "fish") {
    l.rightArm.rotation.x = -0.95;
    l.rightElbow.rotation.x = -0.4;
    d.weapon.visible = false;
  }
  if (p.roll) {
    const t = Math.max(0, Math.min(1, (time - p.roll.start) / p.roll.duration));
    d.pivot.position.y = 0.95 + Math.sin(t * Math.PI) * 0.3;
    d.pivot.rotation.x = -t * Math.PI * 2;
    d.body.position.y = -1.15;
    l.rightLeg.rotation.x = -1.8;
    l.leftLeg.rotation.x = -1.8;
    l.rightKnee.rotation.x = 1.9;
    l.leftKnee.rotation.x = 1.9;
    l.rightArm.rotation.x = -1.4;
    l.rightElbow.rotation.x = -1.4;
    l.leftArm.rotation.x = -1.7;
    l.leftElbow.rotation.x = -1.6;
    d.wrist.rotation.x = 0.25;
  }
  if (kind === "death") {
    d.body.rotation.z = -Math.PI * 0.48;
    d.body.position.set(-0.8, -0.15, 0);
  }
  if (!seated) root.rotation.y = Math.atan2(p.facing?.x || 0, p.facing?.y ?? 1);
}
export function treeModel(m, variant = 0) {
  const g = new T.Group(),
    leaves = new T.Group();
  g.userData.leaves = leaves;
  g.add(leaves);
  const height = 5.5 + variant * 0.65;
  points(
    g,
    m.bark,
    "cylinder",
    [0, height * 0.37, 0],
    [0.22, height * 0.74, 0.25],
    [0, 0, 0.035],
    0.12,
  );
  for (let i = 0; i < 5; i++) {
    const angle = i * 1.256;
    beam(
      g,
      m.bark,
      [0, height * 0.45, 0],
      [
        Math.sin(angle) * 1.25,
        height * 0.65 + (i % 2) * 0.4,
        Math.cos(angle) * 1.25,
      ],
      0.07,
    );
    points(
      leaves,
      m.leaf,
      "ellipsoid",
      [
        Math.sin(angle) * 0.72,
        height * 0.72 + (i % 3) * 0.35,
        Math.cos(angle) * 0.72,
      ],
      [1.15 + variant * 0.15, 1.18, 1.25],
      [0, i, 0],
      0.16,
    );
  }
  return batchRigid(g);
}
export function houseModel(m) {
  const g = new T.Group();
  points(g, m.stone, "box", [0, 0.15, 0], [4.5, 0.3, 4]);
  points(g, m.plaster, "box", [0, 1.65, 0], [4.1, 3, 3.7], [0, 0, 0], 0.12);
  for (const x of [-2, 0, 2])
    for (const z of [-1.91, 1.91])
      points(g, m.wood, "box", [x, 1.65, z], [0.14, 3.1, 0.11]);
  for (const y of [0.35, 2.95])
    for (const z of [-1.92, 1.92])
      points(g, m.wood, "box", [0, y, z], [4.2, 0.12, 0.11]);
  for (const s of [-1, 1]) {
    points(
      g,
      m.roof,
      "box",
      [s * 1.1, 3.9, 0],
      [2.9, 0.16, 4.4],
      [0, 0, -s * 0.63],
      0.11,
    );
    for (let i = 0; i < 8; i++)
      points(
        g,
        m.wood,
        "box",
        [s * 1.1, 3.94, -1.95 + i * 0.55],
        [2.93, 0.045, 0.04],
        [0, 0, -s * 0.63],
      );
  }
  points(g, m.stone, "box", [-1.3, 4.3, -0.85], [0.5, 1.7, 0.5]);
  for (const x of [-1.35, 1.35]) {
    points(g, m.wood, "box", [x, 1.75, 1.91], [0.83, 1.05, 0.08]);
    points(
      g,
      m.window,
      "box",
      [x, 1.75, 1.96],
      [0.65, 0.85, 0.025],
      [0, 0, 0],
      0.06,
    );
    points(g, m.wood, "box", [x, 1.75, 2], [0.045, 0.9, 0.025]);
    points(g, m.wood, "box", [x, 1.75, 2], [0.7, 0.045, 0.025]);
  }
  points(g, m.wood, "box", [0, 1.1, 1.94], [0.83, 1.9, 0.09]);
  points(
    g,
    m.gold,
    "ellipsoid",
    [0.25, 1.1, 2.01],
    [0.03, 0.03, 0.025],
    [0, 0, 0],
    0.02,
  );
  for (let i = 0; i < 3; i++)
    points(
      g,
      m.stone,
      "box",
      [0, 0.14 - i * 0.035, 2.13 + i * 0.27],
      [1.2, 0.12, 0.5],
    );
  return batchRigid(g);
}
export function ruinModel(m) {
  const g = new T.Group();
  for (const x of [-1.9, 1.9]) {
    for (let i = 0; i < 7; i++)
      points(
        g,
        i % 2 ? m.stone : m.darkStone,
        "box",
        [x, 0.3 + i * 0.46, 0],
        [0.73, 0.43, 0.82],
        [0, (i % 2) * 0.025, 0],
        0.11,
      );
    points(g, m.stone, "box", [x, 0.15, 0], [1.1, 0.3, 1.1]);
    points(g, m.stone, "box", [x, 3.6, 0], [1.05, 0.3, 1.05]);
  }
  for (let i = 0; i < 13; i++) {
    const a = (i / 12) * Math.PI,
      x = Math.cos(a) * 1.9,
      y = 3.65 + Math.sin(a) * 1.3;
    points(
      g,
      m.stone,
      "box",
      [x, y, 0],
      [0.49, 0.6, 0.74],
      [0, 0, a - Math.PI / 2],
      0.11,
    );
  }
  for (let i = 0; i < 18; i++)
    points(
      g,
      i % 3 ? m.darkStone : m.moss,
      "box",
      [(hash(i, 4) - 0.5) * 7, 0.12, (hash(i, 5) - 0.5) * 4],
      [0.3 + hash(i, 3) * 0.5, 0.26, 0.4],
      [0, hash(i, 2) * 3, 0.1],
    );
  return batchRigid(g);
}
export function benchModel(m) {
  const g = new T.Group();
  for (let i = 0; i < 4; i++)
    points(g, m.wood, "box", [0, 0.65, -0.4 + i * 0.24], [2.7, 0.1, 0.2]);
  for (const x of [-1.1, 1.1])
    for (const z of [-0.3, 0.3])
      points(g, m.wood, "box", [x, 0.31, z], [0.09, 0.62, 0.09]);
  for (const x of [-1.1, 1.1])
    points(g, m.wood, "box", [x, 1, -0.5], [0.08, 1.4, 0.08]);
  for (let i = 0; i < 3; i++)
    points(g, m.wood, "box", [0, 1 + i * 0.22, -0.5], [2.7, 0.15, 0.09]);
  return batchRigid(g);
}
export function villagerModel(m, princess = false) {
  const g = new T.Group(),
    head = new T.Group();
  g.userData = { villager: true, head };
  points(
    g,
    princess ? m.plaster : m.moss,
    "ellipsoid",
    [0, 1.05, 0],
    [0.42, 0.9, 0.32],
    [0, 0, 0],
    0.075,
  );
  points(
    g,
    m.skin,
    "ellipsoid",
    [0, 2.12, 0.04],
    [0.23, 0.28, 0.22],
    [0, 0, 0],
    0.045,
  );
  for (const side of [-1, 1]) {
    points(
      g,
      princess ? m.gold : m.leather,
      "ellipsoid",
      [side * 0.22, 2.15, -0.08],
      [0.08, 0.35, 0.14],
      [0, 0, side * 0.1],
      0.05,
    );
    beam(g, m.skin, [side * 0.33, 1.65, 0], [side * 0.42, 1.1, 0.15], 0.075);
    points(
      g,
      m.dark,
      "ellipsoid",
      [side * 0.08, 2.16, 0.243],
      [0.026, 0.035, 0.018],
      [0, 0, 0],
      0.025,
    );
    points(
      g,
      m.leather,
      "box",
      [side * 0.18, 0.13, 0.1],
      [0.23, 0.23, 0.4],
      [0, 0, 0],
      0.055,
    );
  }
  if (princess) {
    for (let i = 0; i < 11; i++) {
      const a = (i * Math.PI * 2) / 11;
      points(
        g,
        m.gold,
        "ellipsoid",
        [
          Math.sin(a) * 0.24,
          2.36 + Math.sin(i * 2) * 0.025,
          Math.cos(a) * 0.22,
        ],
        [0.035, 0.075, 0.035],
        [0, 0, 0],
        0.025,
      );
    }
    points(
      g,
      m.cloth,
      "box",
      [0, 1.75, 0.25],
      [0.08, 0.4, 0.025],
      [0, 0, 0],
      0.035,
    );
  } else
    points(
      g,
      m.leather,
      "cylinder",
      [0, 1.3, 0],
      [0.39, 0.1, 0.31],
      [0, 0, 0],
      0.06,
    );
  return batchRigid(g);
}
export function roomModel(m) {
  const g = new T.Group();
  for (let i = 0; i < 28; i++)
    points(
      g,
      i % 3 ? m.wood : m.bark,
      "box",
      [1.25 + i * 0.5, -0.1, 6.5],
      [0.47, 0.2, 11],
      [0, 0, 0],
      0.16,
    );
  points(g, m.plaster, "box", [8, 1.5, 1], [14, 3, 0.15], [0, 0, 0], 0.14);
  for (const x of [1, 15])
    points(g, m.plaster, "box", [x, 1.5, 6.5], [0.15, 3, 11], [0, 0, 0], 0.14);
  for (const x of [1.15, 8, 14.85])
    points(g, m.bark, "box", [x, 1.5, 1.15], [0.16, 3, 0.16]);
  for (const x of [7, 9])
    points(g, m.stone, "box", [x, 0.7, 1.5], [0.4, 1.4, 1]);
  points(g, m.stone, "box", [8, 1.5, 1.5], [2.5, 0.35, 1.2]);
  for (let i = 0; i < 9; i++)
    points(
      g,
      m.glow,
      "ellipsoid",
      [7.3 + i * 0.18, 0.4 + (i % 3) * 0.1, 1.6],
      [0.08, 0.25, 0.08],
      [0, 0, 0],
      0.05,
    );
  points(g, m.wood, "box", [3, 0.35, 3.5], [1.7, 0.7, 3]);
  points(g, m.plaster, "box", [3, 0.8, 3.5], [1.6, 0.2, 2.8]);
  points(g, m.cloth, "box", [3, 0.94, 4], [1.62, 0.08, 1.7]);
  points(
    g,
    m.plaster,
    "ellipsoid",
    [3, 1, 2.5],
    [0.5, 0.12, 0.3],
    [0, 0, 0],
    0.08,
  );
  points(
    g,
    m.wood,
    "cylinder",
    [12, 0.95, 7],
    [1.1, 0.15, 1.1],
    [0, 0, 0],
    0.12,
  );
  for (const x of [11.4, 12.6])
    for (const z of [6.4, 7.6])
      points(g, m.bark, "box", [x, 0.5, z], [0.1, 1, 0.1]);
  points(
    g,
    m.plaster,
    "cylinder",
    [12, 1.08, 7],
    [0.25, 0.04, 0.25],
    [0, 0, 0],
    0.06,
  );
  points(
    g,
    m.glow,
    "ellipsoid",
    [12.45, 1.4, 7],
    [0.035, 0.11, 0.035],
    [0, 0, 0],
    0.04,
  );
  points(
    g,
    m.gold,
    "cylinder",
    [12.45, 1.2, 7],
    [0.045, 0.35, 0.045],
    [0, 0, 0],
    0.035,
  );
  for (let row = 0; row < 4; row++) {
    points(g, m.bark, "box", [13.5, 0.4 + row * 0.6, 1.4], [2, 0.1, 0.6]);
    for (let book = 0; book < 10; book++)
      points(
        g,
        book % 2 ? m.cloth : m.moss,
        "box",
        [12.7 + book * 0.17, 0.65 + row * 0.6, 1.45],
        [0.12, 0.4, 0.3],
        [0, 0, 0.02 * (book % 3)],
      );
  }
  points(g, m.cloth, "box", [8, 0.02, 7], [3.5, 0.04, 4], [0, 0, 0], 0.13);
  return batchRigid(g);
}
export function dragonModel(m) {
  const g = new T.Group(),
    left = new T.Group(),
    right = new T.Group();
  g.userData = { left, right };
  points(
    g,
    m.dragon,
    "ellipsoid",
    [0, 0.9, 0],
    [0.7, 0.6, 1.5],
    [0, 0, 0],
    0.12,
  );
  points(
    g,
    m.dragon,
    "ellipsoid",
    [0, 1.55, 1.45],
    [0.34, 0.5, 0.6],
    [0.25, 0, 0],
    0.09,
  );
  points(
    g,
    m.dragon,
    "ellipsoid",
    [0, 1.55, 1.95],
    [0.3, 0.22, 0.42],
    [0, 0, 0],
    0.08,
  );
  for (const s of [-1, 1]) {
    points(
      g,
      m.glow,
      "ellipsoid",
      [s * 0.27, 1.76, 1.82],
      [0.045, 0.05, 0.045],
      [0, 0, 0],
      0.03,
    );
    beam(g, m.gold, [s * 0.23, 1.98, 1.3], [s * 0.4, 2.32, 1], 0.045);
    for (const z of [-0.8, 0.75]) {
      beam(g, m.dragon, [s * 0.5, 0.8, z], [s * 0.8, 0.18, z + 0.2], 0.12);
      points(g, m.dragon, "box", [s * 0.8, 0.1, z + 0.35], [0.35, 0.2, 0.55]);
    }
  }
  for (let i = 0; i < 7; i++)
    points(
      g,
      m.dragon,
      "ellipsoid",
      [Math.sin(i * 0.3) * i * 0.05, 0.7 - i * 0.07, -1.3 - i * 0.33],
      [0.3 - i * 0.035, 0.22 - i * 0.022, 0.4],
      [0, 0, 0],
      0.1,
    );
  left.position.set(-0.45, 1.2, -0.2);
  right.position.set(0.45, 1.2, -0.2);
  g.add(left, right);
  for (const [s, wing] of [
    [-1, left],
    [1, right],
  ]) {
    for (let i = 0; i < 5; i++)
      beam(
        wing,
        m.darkDragon,
        [0, 0, 0],
        [s * (2.1 - i * 0.28), 0.55 - i * 0.07, -1 + i * 0.55],
        0.045,
      );
    const pos = [],
      normal = [],
      random = [];
    for (let j = 0; j < 28; j++)
      for (let i = 0; i < 36; i++) {
        const u = i / 35,
          v = j / 27;
        if (v > 1 - u * 0.45) continue;
        pos.push(s * (0.2 + u * 1.9), 0.1 + Math.sin(u * 2) * 0.15, -1 + v * 2);
        normal.push(0, 1, 0);
        random.push(hash(i, j));
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new T.Float32BufferAttribute(normal, 3));
    geo.setAttribute("jitter", new T.Float32BufferAttribute(random, 1));
    wing.add(new T.Points(geo, m.wing));
  }
  return batchRigid(g);
}
