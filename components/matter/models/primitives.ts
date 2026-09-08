import * as T from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
export const materials = () => ({
  ivory: new T.MeshPhysicalMaterial({
    color: "#e1e5dc",
    roughness: 0.58,
    metalness: 0.05,
    clearcoat: 0.15,
  }),
  dark: new T.MeshStandardMaterial({
    color: "#172833",
    roughness: 0.65,
    metalness: 0.08,
  }),
  rubber: new T.MeshStandardMaterial({ color: "#1b242c", roughness: 0.94 }),
  metal: new T.MeshStandardMaterial({
    color: "#9baab5",
    roughness: 0.28,
    metalness: 0.75,
  }),
  textile: new T.MeshStandardMaterial({ color: "#687d87", roughness: 0.96 }),
  accent: new T.MeshPhysicalMaterial({
    color: "#c2ef72",
    roughness: 0.42,
    metalness: 0.05,
    clearcoat: 0.2,
  }),
  skin: new T.MeshStandardMaterial({ color: "#ba896a", roughness: 0.86 }),
});
export type Palette = ReturnType<typeof materials>;
export function mesh(
  g: T.BufferGeometry,
  m: T.Material,
  parent: T.Object3D,
  name = "",
) {
  const o = new T.Mesh(g, m);
  o.name = name;
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
export function ellipsoid(
  parent: T.Object3D,
  m: T.Material,
  pos: number[],
  scale: number[],
  name = "",
) {
  const o = mesh(new T.SphereGeometry(1, 24, 16), m, parent, name);
  o.position.set(...(pos as [number, number, number]));
  o.scale.set(...(scale as [number, number, number]));
  return o;
}
export function box(
  parent: T.Object3D,
  m: T.Material,
  size: number[],
  pos: number[],
  name = "",
) {
  const o = mesh(
    new T.BoxGeometry(...(size as [number, number, number])),
    m,
    parent,
    name,
  );
  o.position.set(...(pos as [number, number, number]));
  return o;
}
export function tube(
  parent: T.Object3D,
  m: T.Material,
  pts: number[][],
  r = 0.025,
  closed = false,
  name = "",
) {
  const curve = new T.CatmullRomCurve3(
    pts.map((p) => new T.Vector3(...(p as [number, number, number]))),
    closed,
  );
  return mesh(
    new T.TubeGeometry(curve, Math.max(16, pts.length * 4), r, 6, closed),
    m,
    parent,
    name,
  );
}
export function rod(
  parent: T.Object3D,
  m: T.Material,
  a: number[],
  b: number[],
  r = 0.04,
  name = "",
) {
  const va = new T.Vector3(...(a as [number, number, number])),
    vb = new T.Vector3(...(b as [number, number, number]));
  const o = mesh(
    new T.CylinderGeometry(r, r, va.distanceTo(vb), 12),
    m,
    parent,
    name,
  );
  o.position.copy(va).add(vb).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    vb.sub(va).normalize(),
  );
  return o;
}
export function surface(
  parent: T.Object3D,
  m: T.Material,
  nu: number,
  nv: number,
  fn: (u: number, v: number) => number[],
  name = "",
) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= nu; i++)
    for (let j = 0; j <= nv; j++) {
      positions.push(...fn(i / nu, j / nv));
      uvs.push(i / nu, j / nv);
    }
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j,
        b = a + nv + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return mesh(g, m, parent, name);
}
export function solidOutline(
  parent: T.Object3D,
  m: T.Material,
  shape: T.Shape,
  depth: number,
  y: number,
  name = "",
) {
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    bevelSegments: 3,
    curveSegments: 32,
    steps: 1,
  });
  g.rotateX(-Math.PI / 2);
  const o = mesh(g, m, parent, name);
  o.position.y = y;
  return o;
}
export function anchor(parent: T.Object3D, pos: number[], name: string) {
  const a = new T.Object3D();
  a.name = name;
  a.position.set(...(pos as [number, number, number]));
  parent.add(a);
  return a;
}
export type Callout = {
  label: string;
  anchor: T.Object3D;
  side: "left" | "right";
  slot: number;
};
export function fitLattice(
  root: T.Group,
  size: number[],
  pos: number[],
  parent: T.Object3D,
) {
  const bounds = new T.Box3().setFromObject(root),
    s = bounds.getSize(new T.Vector3()),
    c = bounds.getCenter(new T.Vector3());
  root.position.sub(c);
  const holder = new T.Group();
  holder.add(root);
  holder.scale.set(size[0] / s.x, size[1] / s.y, size[2] / s.z);
  holder.position.set(...(pos as [number, number, number]));
  parent.add(holder);
  return holder;
}
/** Bake and curve the displayed cellular patch into a product's interior envelope. */
export function warpLattice(root: T.Group, fn: (v: T.Vector3) => T.Vector3) {
  root.updateMatrixWorld(true);
  const positions: number[] = [];
  const originals = new Set<T.BufferGeometry>();
  let material: T.Material | T.Material[] | undefined;
  const instance = new T.Matrix4();
  root.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    originals.add(o.geometry);
    material = o.material;
    const count = o instanceof T.InstancedMesh ? o.count : 1;
    for (let n = 0; n < count; n++) {
      const mat = o.matrixWorld.clone();
      if (o instanceof T.InstancedMesh) {
        o.getMatrixAt(n, instance);
        mat.multiply(instance);
      }
      const geo = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
      geo.applyMatrix4(mat);
      const pos = geo.attributes.position;
      const limit = Math.min(pos.count, geo.drawRange.count);
      for (let i = 0; i < limit; i++) {
        const v = fn(new T.Vector3().fromBufferAttribute(pos, i));
        positions.push(v.x, v.y, v.z);
      }
      geo.dispose();
    }
  });
  originals.forEach((g) => g.dispose());
  root.clear();
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  const smooth = mergeVertices(geo, 0.00001);
  geo.dispose();
  smooth.computeVertexNormals();
  mesh(
    smooth,
    Array.isArray(material) ? material[0] : material!,
    root,
    "curved-cellular-liner",
  );
  return root;
}
