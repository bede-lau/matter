import * as T from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
export type LatticeOptions = {
  kind: string;
  variant: number;
  count: number;
  thickness: number;
  color: string;
  wire?: boolean;
};
/** Shared geometry for the studio and interactive field guide. */
export function createLattice(p: LatticeOptions, software = false) {
  const root = new T.Group();
  const material = new T.MeshPhysicalMaterial({
    color: p.color,
    metalness: 0.28,
    roughness: 0.28,
    clearcoat: 0.22,
    wireframe: p.wire ?? false,
    side: T.DoubleSide,
  });
  const addMesh = (
    geo: T.BufferGeometry,
    mat: T.Material = material,
    parent: T.Group = root,
  ) => {
    const m = new T.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const segments: { a: number[]; b: number[]; r: number }[] = [];
  const rod = (
    a: number[],
    b: number[],
    r: number,
    parent: T.Group = root,
    mat: T.Material = material,
  ) => {
    if (parent === root && mat === material) {
      segments.push({ a, b, r });
      return;
    }
    const va = new T.Vector3(...(a as [number, number, number])),
      vb = new T.Vector3(...(b as [number, number, number]));
    const m = addMesh(
      new T.CylinderGeometry(r, r, va.distanceTo(vb), 8),
      mat,
      parent,
    );
    m.position.copy(va.add(vb).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      new T.Vector3(...(b as [number, number, number]))
        .sub(new T.Vector3(...(a as [number, number, number])))
        .normalize(),
    );
  };
  const n = p.count,
    step = 3.5 / n,
    r = (step * p.thickness) / 20;
  const edgeKeys = new Set<string>();
  const edge = (a: number[], b: number[]) => {
    const key = [
      a.map((x) => x.toFixed(3)).join(","),
      b.map((x) => x.toFixed(3)).join(","),
    ]
      .sort()
      .join("|");
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    const mid = (a[1] + b[1]) / 2;
    const graded =
      (p.variant === 2 && p.kind !== "octet") ||
      (p.variant === 1 && p.kind === "octet");
    const radius =
      r *
      (graded ? 1 + (0.3 * mid) / 2 : 1) *
      (p.variant === 1 && p.kind === "kelvin" ? 1.3 : 1);
    rod(a, b, radius);
  };
  if (p.kind === "gyroid") {
    const res = software ? Math.min(48, 24 + n * 6) : Math.min(90, 38 + n * 9);
    const mc = new MarchingCubes(res, material, false, false, 250000);
    mc.isolation = 0;
    mc.scale.setScalar(1.9);
    mc.castShadow = true;
    mc.receiveShadow = true;
    const freq = n * Math.PI;
    for (let z = 0; z < res; z++)
      for (let y = 0; y < res; y++)
        for (let x = 0; x < res; x++) {
          const xx = ((x / (res - 1)) * 2 - 1) * freq,
            yy = ((y / (res - 1)) * 2 - 1) * freq,
            zz = ((z / (res - 1)) * 2 - 1) * freq;
          const g =
            Math.sin(xx) * Math.cos(yy) +
            Math.sin(yy) * Math.cos(zz) +
            Math.sin(zz) * Math.cos(xx);
          const boundary =
            Math.min(x, y, z, res - 1 - x, res - 1 - y, res - 1 - z) - 1.5;
          const thick =
            0.2 + p.thickness * 0.18 + (p.variant === 2 ? (y / res) * 0.3 : 0);
          mc.field[x + y * res + z * res * res] = Math.min(
            p.variant === 1 ? g + 0.35 : thick - Math.abs(g),
            boundary,
          );
        }
    mc.update();
    mc.geometry.setDrawRange(0, mc.count);
    root.add(mc);
  } else if (p.kind === "kelvin") {
    const verts: number[][] = [];
    for (let a = 0; a < 3; a++)
      for (let s of [-1, 1])
        for (let t of [-1, 1]) {
          const v = [0, 0, 0];
          v[(a + 1) % 3] = s;
          v[(a + 2) % 3] = 2 * t;
          verts.push(v);
          const w = [0, 0, 0];
          w[(a + 1) % 3] = 2 * s;
          w[(a + 2) % 3] = t;
          verts.push(w);
        }
    const scale = step / 4;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < n; k++)
          for (let offset of [0, 0.5]) {
            const c = [
              (i - (n - 1) / 2 + offset) * step,
              (j - (n - 1) / 2 + offset) * step,
              (k - (n - 1) / 2 + offset) * step,
            ];
            for (let a = 0; a < verts.length; a++)
              for (let b = a + 1; b < verts.length; b++)
                if (
                  Math.abs(
                    verts[a].reduce(
                      (s, v, d) => s + (v - verts[b][d]) ** 2,
                      0,
                    ) - 2,
                  ) < 0.001
                ) {
                  const pa = verts[a].map((v, d) => v * scale + c[d]),
                    pb = verts[b].map((v, d) => v * scale + c[d]);
                  if (
                    pa.every((v) => Math.abs(v) <= 1.76) &&
                    pb.every((v) => Math.abs(v) <= 1.76)
                  )
                    edge(pa, pb);
                }
          }
  } else if (p.kind === "honeycomb" || p.kind === "auxetic") {
    for (let z = 0; z < n; z++)
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          let pts: number[][] = [];
          const zz = (z - (n - 1) / 2) * step;
          if (p.kind === "honeycomb") {
            const rad = step * 0.57,
              elong = p.variant === 1 ? 1.4 : 1;
            for (let a = 0; a < 6; a++) {
              const angle = (Math.PI / 3) * a;
              pts.push([
                Math.cos(angle) * rad + (x - (n - 1) / 2) * 1.5 * rad,
                (Math.sin(angle) * rad +
                  (y - (n - 1) / 2) * Math.sqrt(3) * rad +
                  (x % 2) * Math.sqrt(3) * rad * 0.5) *
                  elong,
                zz,
              ]);
            }
          } else {
            const a = step * 0.42,
              h = step * 0.48,
              b = step * (p.variant === 1 ? 0.08 : 0.22);
            const cx = (x - (n - 1) / 2) * 2 * a + (y % 2) * a,
              cy = (y - (n - 1) / 2) * (h + b);
            pts = [
              [-a, -h],
              [0, -b],
              [a, -h],
              [a, h],
              [0, b],
              [-a, h],
            ].map((v) => [v[0] + cx, v[1] + cy, zz]);
          }
          for (let a = 0; a < 6; a++) {
            edge(pts[a], pts[(a + 1) % 6]);
            if (z < n - 1)
              edge(pts[a], [pts[a][0], pts[a][1], pts[a][2] + step]);
          }
        }
  } else if (p.kind === "octet") {
    // FCC nearest-neighbor graph: tetrahedral/octahedral space frame.
    const points = new Map<string, number[]>();
    for (let x = 0; x <= 2 * n; x++)
      for (let y = 0; y <= 2 * n; y++)
        for (let z = 0; z <= 2 * n; z++)
          if ((x + y + z) % 2 === 0) points.set(`${x},${y},${z}`, [x, y, z]);
    const offsets: number[][] = [];
    for (let zero = 0; zero < 3; zero++)
      for (let a of [-1, 1])
        for (let b of [-1, 1]) {
          const v = [0, 0, 0];
          v[(zero + 1) % 3] = a;
          v[(zero + 2) % 3] = b;
          offsets.push(v);
        }
    points.forEach((v) => {
      for (const off of offsets) {
        const q = v.map((a, i) => a + off[i]);
        if (points.has(q.join(",")))
          edge(
            v.map(
              (a, i) =>
                (a - n) * step * 0.5 * (p.variant === 2 && i === 1 ? 1.25 : 1),
            ),
            q.map(
              (a, i) =>
                (a - n) * step * 0.5 * (p.variant === 2 && i === 1 ? 1.25 : 1),
            ),
          );
      }
    });
  } else {
    for (let x = 0; x < n; x++)
      for (let y = 0; y < n; y++)
        for (let z = 0; z < n; z++) {
          const c = [
            (x - (n - 1) / 2) * step,
            (y - (n - 1) / 2) * step,
            (z - (n - 1) / 2) * step,
          ];
          const v: number[][] = [];
          for (let a of [-0.5, 0.5])
            for (let b of [-0.5, 0.5])
              for (let d of [-0.5, 0.5])
                v.push([c[0] + a * step, c[1] + b * step, c[2] + d * step]);
          for (let a = 0; a < 8; a++)
            for (let b = a + 1; b < 8; b++)
              if (
                v[a].filter((q, i) => Math.abs(q - v[b][i]) > 0.001).length ===
                1
              )
                edge(v[a], v[b]);
          for (let mass = 0; mass < (p.variant === 1 ? 2 : 1); mass++) {
            const radius =
              step * (p.variant === 2 ? 0.13 + 0.08 * (y / n) : 0.18);
            const m = addMesh(
              new T.SphereGeometry(radius, 16, 12),
              new T.MeshStandardMaterial({
                color: 0xd5e6ed,
                metalness: 0.8,
                roughness: 0.22,
              }),
            );
            m.position.set(
              c[0] + (p.variant === 1 ? (mass - 0.5) * step * 0.4 : 0),
              c[1],
              c[2],
            );
            m.userData.resonator = true;
            m.userData.restY = c[1];
            m.userData.phase = x + y + mass;
            const coilPoints = [];
            for (let j = 0; j <= 48; j++) {
              const t = j / 48,
                angle = t * Math.PI * 12;
              coilPoints.push(
                new T.Vector3(
                  Math.sin(angle) * step * 0.06,
                  t * step * 0.5,
                  Math.cos(angle) * step * 0.06,
                ),
              );
            }
            const spring = addMesh(
              new T.TubeGeometry(
                new T.CatmullRomCurve3(coilPoints),
                48,
                r * 0.42,
                5,
                false,
              ),
              material,
            );
            spring.position.set(m.position.x, c[1] - step * 0.5, c[2]);
            m.userData.spring = spring;
          }
        }
  }
  if (segments.length) {
    const cylinders = new T.InstancedMesh(
      new T.CylinderGeometry(1, 1, 1, software ? 6 : 12),
      material,
      segments.length,
    );
    const dummy = new T.Object3D(),
      up = new T.Vector3(0, 1, 0);
    segments.forEach((seg, i) => {
      const a = new T.Vector3(...(seg.a as [number, number, number])),
        b = new T.Vector3(...(seg.b as [number, number, number]));
      dummy.position.copy(a).add(b).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
      dummy.scale.set(seg.r, a.distanceTo(b), seg.r);
      dummy.updateMatrix();
      cylinders.setMatrixAt(i, dummy.matrix);
    });
    cylinders.castShadow = true;
    cylinders.receiveShadow = true;
    root.add(cylinders);
  }

  return root;
}
