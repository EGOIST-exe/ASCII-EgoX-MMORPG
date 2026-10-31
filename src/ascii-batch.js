import * as T from "three";
// Keep articulation groups intact and combine only rigid point surfaces.
// Cached geometry is reused by identical trees, houses and armour parts.
const cache = new Map();
export function batchRigid(root) {
  for (const child of [...root.children]) if (child.isGroup) batchRigid(child);
  const groups = new Map();
  for (const child of root.children)
    if (child.isPoints && !child.geometry.getAttribute("plant")) {
      const key = child.material.uuid;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(child);
    }
  for (const children of groups.values()) {
    if (children.length < 2) continue;
    children.forEach((c) => c.updateMatrix());
    const key = children
      .map((c) => c.geometry.uuid + ":" + c.matrix.elements.join(","))
      .join("|");
    let geometry = cache.get(key);
    if (!geometry) {
      const positions = [],
        normals = [],
        jitter = [],
        v = new T.Vector3(),
        n = new T.Vector3(),
        matrix = new T.Matrix3();
      for (const c of children) {
        const geo = c.geometry,
          p = geo.getAttribute("position"),
          normal = geo.getAttribute("normal"),
          r = geo.getAttribute("jitter");
        matrix.getNormalMatrix(c.matrix);
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(c.matrix);
          n.fromBufferAttribute(normal, i).applyMatrix3(matrix).normalize();
          positions.push(v.x, v.y, v.z);
          normals.push(n.x, n.y, n.z);
          jitter.push(r.getX(i));
        }
      }
      geometry = new T.BufferGeometry();
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute("jitter", new T.Float32BufferAttribute(jitter, 1));
      geometry.computeBoundingSphere();
      cache.set(key, geometry);
    }
    const points = new T.Points(geometry, children[0].material);
    children.forEach((c) => root.remove(c));
    root.add(points);
  }
  return root;
}
