import * as T from "three";
export const CHUNK_SIZE = 12;
export function visibleGroundBounds(
  camera,
  focus,
  { margin = 10, floor = -2, maxDistance = 155 } = {},
) {
  camera.updateMatrixWorld(true);
  const ray = new T.Raycaster(),
    plane = new T.Plane(new T.Vector3(0, 1, 0), -floor),
    p = new T.Vector3();
  let minX = focus.x - 12,
    maxX = focus.x + 12,
    minZ = focus.z - 12,
    maxZ = focus.z + 12;
  for (const x of [-1, -0.5, 0, 0.5, 1])
    for (const y of [-1, -0.4, 0.4, 1]) {
      ray.setFromCamera(new T.Vector2(x, y), camera);
      const hit = ray.ray.intersectPlane(plane, p);
      if (!hit || p.distanceTo(camera.position) > maxDistance)
        ray.ray.at(maxDistance, p);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }
  return {
    minX: minX - margin,
    maxX: maxX + margin,
    minZ: minZ - margin,
    maxZ: maxZ + margin,
  };
}
export function chunkPlan(bounds, focus, area = "vale") {
  const plan = [];
  for (
    let z = Math.floor(bounds.minZ / CHUNK_SIZE);
    z <= Math.floor(bounds.maxZ / CHUNK_SIZE);
    z++
  )
    for (
      let x = Math.floor(bounds.minX / CHUNK_SIZE);
      x <= Math.floor(bounds.maxX / CHUNK_SIZE);
      x++
    ) {
      if (x < -5 || z < -5 || x > 69 || z > 69) continue;
      const distance = Math.hypot(x * 12 + 6 - focus.x, z * 12 + 6 - focus.z),
        lod = distance < 27 ? 0 : distance < 52 ? 1 : 2;
      plan.push({ x, z, lod, key: `${area}:${x}:${z}` });
    }
  return plan.sort(
    (a, b) =>
      Math.hypot(a.x * 12 + 6 - focus.x, a.z * 12 + 6 - focus.z) -
      Math.hypot(b.x * 12 + 6 - focus.x, b.z * 12 + 6 - focus.z),
  );
}
