// Shared by collision, simulation, cartography and the ASCII renderer.
export const MAP_SIZE = 768;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function riverCenter(z) {
  return 94 + Math.sin(z / 22) * 7 + Math.sin(z / 49) * 9;
}
export const BRIDGES = [
  { x: riverCenter(70), z: 70, length: 9.4, width: 3.1, id: "silbersteg" },
];
export function bridgeAt(x, z) {
  return BRIDGES.find(
    (b) =>
      Math.abs(x - b.x) < b.length * 0.5 && Math.abs(z - b.z) < b.width * 0.5,
  );
}
export function meadowProfile(x, z) {
  const field =
    (Math.sin(x * 0.13 + Math.cos(z * 0.06)) +
      Math.cos(z * 0.11 - x * 0.025) +
      2) *
    0.25;
  const flower = clamp(
    (Math.sin(x * 0.22 + 0.8) + Math.cos(z * 0.18) - 0.05) * 0.65,
    0,
    1,
  );
  return {
    field,
    flower,
    tall: clamp((field - 0.28) * 1.7, 0, 1),
    species:
      Math.floor((Math.sin(x * 0.045) + Math.cos(z * 0.06) + 2) * 1.23) % 5,
  };
}
export function borderDistance(x, z) {
  return Math.min(x, z, MAP_SIZE - 1 - x, MAP_SIZE - 1 - z);
}
export function mountainHeight(x, z) {
  const edge = borderDistance(x, z),
    belt = clamp((43 - edge) / 43, 0, 1.65),
    ridges =
      0.65 +
      Math.abs(Math.sin(x * 0.075 + Math.cos(z * 0.043))) * 0.45 +
      Math.abs(Math.sin(z * 0.09 + x * 0.037)) * 0.3;
  return belt * belt * (25 + ridges * 24);
}
export function landHeight(x, z) {
  const rolling =
    Math.sin(x * 0.042) * Math.cos(z * 0.036) + Math.sin((x + z) * 0.023) * 0.6;
  const hill = Math.max(0, 1 - Math.hypot(x - 66, z - 91) / 16) * 1.5;
  return (
    1.2 + Math.floor((rolling * 0.6 + hill) * 3) / 3 + mountainHeight(x, z)
  );
}
export function bridgeHeight(b) {
  return (
    Math.max(
      landHeight(b.x - b.length * 0.5, b.z),
      landHeight(b.x + b.length * 0.5, b.z),
    ) + 0.12
  );
}

const routes = [
  {
    id: "royal-road",
    width: 1.45,
    points: [
      [3, 78],
      [24, 73],
      [40, 69],
      [48, 70],
      [66, 74],
      [83, 68],
      [riverCenter(70) - 6, 70],
      [riverCenter(70) + 6, 70],
      [112, 70],
      [138, 77],
      [168, 71],
    ],
  },
  {
    id: "linden-path",
    width: 1,
    points: [
      [48, 59],
      [49, 65],
      [48, 70],
      [47, 76],
      [51, 83],
      [57, 91],
    ],
  },
  {
    id: "dawn-trail",
    width: 0.8,
    points: [
      [65, 73],
      [71, 68],
      [73, 62],
      [77, 60],
      [84, 58],
    ],
  },
  {
    id: "river-trail",
    width: 0.85,
    points: [
      [112, 73],
      [111, 80],
      [106, 85],
      [108, 91],
      [117, 100],
      [125, 114],
    ],
  },
  {
    id: "south-trail",
    width: 0.85,
    points: [
      [51, 83],
      [62, 90],
      [69, 99],
      [74, 108],
      [71, 118],
      [75, 128],
      [86, 137],
    ],
  },
];
function catmull(a, b, c, d, t) {
  const t2 = t * t,
    t3 = t2 * t;
  return (
    0.5 *
    (2 * b +
      (-a + c) * t +
      (2 * a - 5 * b + 4 * c - d) * t2 +
      (-a + 3 * b - 3 * c + d) * t3)
  );
}
const segments = [],
  index = new Map();
for (const route of routes) {
  let previous = route.points[0];
  for (let i = 0; i < route.points.length - 1; i++) {
    const a = route.points[Math.max(0, i - 1)],
      b = route.points[i],
      c = route.points[i + 1],
      d = route.points[Math.min(route.points.length - 1, i + 2)];
    const count = Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) * 2);
    for (let n = 1; n <= count; n++) {
      const t = n / count,
        current = [
          catmull(a[0], b[0], c[0], d[0], t),
          catmull(a[1], b[1], c[1], d[1], t),
        ];
      const s = {
        ax: previous[0],
        az: previous[1],
        bx: current[0],
        bz: current[1],
        width: route.width,
        id: route.id,
      };
      segments.push(s);
      const margin = route.width + 2;
      for (
        let z = Math.floor((Math.min(s.az, s.bz) - margin) / 8);
        z <= Math.floor((Math.max(s.az, s.bz) + margin) / 8);
        z++
      )
        for (
          let x = Math.floor((Math.min(s.ax, s.bx) - margin) / 8);
          x <= Math.floor((Math.max(s.ax, s.bx) + margin) / 8);
          x++
        ) {
          const k = `${x}:${z}`;
          if (!index.has(k)) index.set(k, []);
          index.get(k).push(s);
        }
      previous = current;
    }
  }
}
export function pathInfo(x, z) {
  const list = index.get(`${Math.floor(x / 8)}:${Math.floor(z / 8)}`) || [];
  let result = { distance: Infinity, width: 0, tx: 1, tz: 0, id: null };
  for (const s of list) {
    const dx = s.bx - s.ax,
      dz = s.bz - s.az,
      length2 = dx * dx + dz * dz,
      t = clamp(
        ((x - s.ax) * dx + (z - s.az) * dz) / Math.max(0.0001, length2),
        0,
        1,
      ),
      distance = Math.hypot(x - s.ax - dx * t, z - s.az - dz * t);
    if (distance < result.distance) {
      const l = Math.sqrt(length2);
      result = { distance, width: s.width, tx: dx / l, tz: dz / l, id: s.id };
    }
  }
  return result;
}
export function onPath(x, z) {
  const r = pathInfo(x, z),
    edge = Math.sin(x * 3.1 + z * 1.3) * 0.1 + Math.cos(z * 2.6) * 0.07;
  return r.distance < r.width + edge;
}
export const ROADS = routes;
