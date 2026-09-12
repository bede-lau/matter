import * as T from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
export type LatticeOptions = {
  kind: string;
  variant: number;
  count: number;
  thickness: number;
  color: string;
  /** A second, visibly allocated phase used only for the teaching preview. */
  secondaryColor?: string;
  /** Secondary-phase share from 0–1. This is not a manufacturing layout. */
  blend?: number;
  wire?: boolean;
};
/** Shared geometry for the studio and interactive field guide. */
export function createLattice(p: LatticeOptions, software = false) {
  const root = new T.Group();
  const blend = Math.max(0, Math.min(1, p.blend ?? 0));
  const showSecondPhase = Boolean(p.secondaryColor && blend > 0);
  const baseColor = new T.Color(p.color);
  const secondaryColor = new T.Color(p.secondaryColor ?? p.color);
  const material = new T.MeshPhysicalMaterial({
    // When a phase allocation is on, per-vertex/per-instance colours carry
    // the visible materials. Keeping the material white prevents it tinting
    // either chosen phase.
    color: showSecondPhase ? "#ffffff" : p.color,
    vertexColors: showSecondPhase,
    metalness: 0.28,
    roughness: 0.28,
    clearcoat: 0.22,
    wireframe: p.wire ?? false,
    side: T.DoubleSide,
  });
  const phaseColor = (v: T.Vector3) => {
    if (!showSecondPhase) return baseColor;
    // A smooth, deterministic micro-zone pattern makes the allocation legible
    // from every orbit angle without pretending to be an optimised print path.
    const wave =
      (Math.sin(v.x * 4.71 + v.y * 2.17) +
        Math.sin(v.y * 5.13 - v.z * 3.31) +
        Math.sin(v.z * 4.07 + v.x * 2.61) +
        3) /
      6;
    return wave < blend ? secondaryColor : baseColor;
  };
  const paintGeometry = (geo: T.BufferGeometry) => {
    if (!showSecondPhase) return;
    const positions = geo.getAttribute("position");
    if (!positions) return;
    const activeCount = Math.min(
      positions.count,
      Number.isFinite(geo.drawRange.count)
        ? geo.drawRange.count
        : positions.count,
    );
    const colors = new Float32Array(activeCount * 3);
    const point = new T.Vector3();
    for (let i = 0; i < activeCount; i++) {
      point.fromBufferAttribute(positions, i);
      const c = phaseColor(point);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new T.BufferAttribute(colors, 3));
  };
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
  // Field-device controls are intentionally bounded so their detail stays
  // readable while still changing a real geometric feature of each model.
  const detail = Math.max(0.58, Math.min(1.42, p.thickness));
  // New field-based families use the complete committed slider range. Their
  // labels intentionally use an illustrative scale rather than universal mm.
  const control = Math.max(0, Math.min(1, (p.thickness - 0.3) / 1.3));
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
    // The canvas fallback favors a bounded, recognizable silhouette over a
    // slow high-poly tessellation. WebGL keeps the denser interactive mesh.
    const res = software
      ? Math.min(24, 14 + n * 3)
      : n <= 3
        ? 64
        : n === 4
          ? 60
          : 56;
    const mc = new MarchingCubes(
      res,
      material,
      false,
      false,
      software ? 16000 : 220000,
    );
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
    paintGeometry(mc.geometry);
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
  } else if (p.kind === "metalens") {
    // A metalens is a flat field of subwavelength posts. The height gradient
    // is exaggerated here so the phase idea remains visible at screen scale.
    // Only posts inside the circular wafer are instantiated, and every post
    // starts on the wafer surface rather than in free space.
    const side = Math.max(4, n * 4);
    const postSites: { x: number; z: number; height: number }[] = [];
    for (let ix = 0; ix < side; ix++)
      for (let iz = 0; iz < side; iz++) {
        const x = (ix / (side - 1) - 0.5) * 3.15;
        const z = (iz / (side - 1) - 0.5) * 3.15;
        // Leave a clean margin inside the mounting ring.
        if (Math.hypot(x, z) > 1.46) continue;
        const radius = Math.hypot(x, z) / 2.23;
        const height =
          p.variant === 0
            ? 0.45
            : 0.28 + 0.56 * (1 - Math.min(1, radius ** 1.7));
        postSites.push({ x, z, height: height * detail });
      }
    const post = new T.InstancedMesh(
      new T.CylinderGeometry(0.055 * Math.sqrt(detail), 0.075 * Math.sqrt(detail), 1, software ? 6 : 10),
      material,
      postSites.length,
    );
    const dummy = new T.Object3D();
    postSites.forEach(({ x, z, height }, index) => {
        // The wafer top is at y = 0.035 (it is 0.07 units thick).
        dummy.position.set(x, 0.035 + height / 2, z);
        dummy.scale.setScalar(1 + (p.variant === 2 ? 0.12 * Math.sin(x * 4) : 0));
        dummy.scale.y = height;
        dummy.updateMatrix();
        post.setMatrixAt(index, dummy.matrix);
        if (showSecondPhase) post.setColorAt(index, phaseColor(dummy.position));
      });
    if (showSecondPhase && post.instanceColor) post.instanceColor.needsUpdate = true;
    post.castShadow = true;
    post.receiveShadow = true;
    root.add(post);
    root.add(
      addMesh(
        new T.CylinderGeometry(1.72, 1.72, 0.07, software ? 24 : 48),
        new T.MeshStandardMaterial({ color: 0x273743, roughness: 0.62, metalness: 0.18 }),
      ),
    );
  } else if (p.kind === "cloak") {
    // A shallow, segmented resonator annulus. This is deliberately planar so
    // it reads as a fabricated microwave shell, not an arbitrary wire cage.
    const substrate = new T.MeshStandardMaterial({
      color: 0x26333c,
      roughness: 0.7,
      metalness: 0.15,
    });
    const trace = new T.MeshPhysicalMaterial({
      color: p.color,
      roughness: 0.24,
      metalness: 0.84,
      clearcoat: 0.12,
    });
    addMesh(new T.CylinderGeometry(1.84, 1.84, 0.1, software ? 24 : 64), substrate).position.y = -0.07;
    const layers = 3;
    const rings = Math.max(4, n + 2);
    for (let layer = 0; layer < layers; layer++)
      for (let i = 0; i < rings; i++) {
        const radius = 0.46 + (i / Math.max(1, rings - 1)) * 1.18;
        const arc = addMesh(
          new T.TorusGeometry(
            radius,
            (0.032 + (p.variant === 1 ? i * 0.005 : 0)) * detail,
            software ? 6 : 10,
            software ? 20 : 38,
            Math.PI * 1.52,
          ),
          trace,
        );
        arc.rotation.x = Math.PI / 2;
        arc.rotation.z = layer * 0.62 + i * 0.34;
        arc.position.y = (layer - 1) * 0.1 + 0.015;
      }
  } else if (p.kind === "membrane-absorber") {
    // Recessed drums: the membrane is seated in a rim and the low-profile
    // platelet is bonded to the centre rather than floating above the panel.
    const backing = new T.MeshStandardMaterial({
      color: 0x26333c,
      roughness: 0.7,
      metalness: 0.12,
    });
    const plateletMat = new T.MeshPhysicalMaterial({
      color: 0xd8dde0,
      roughness: 0.36,
      metalness: 0.45,
    });
    addMesh(new T.BoxGeometry(3.35, 0.09, 3.35), backing).position.y = -0.085;
    const cells = Math.max(2, n);
    for (let x = 0; x < cells; x++)
      for (let z = 0; z < cells; z++) {
        const px = (x - (cells - 1) / 2) * step * 0.82;
        const pz = (z - (cells - 1) / 2) * step * 0.82;
        const diaphragm = addMesh(
        new T.CylinderGeometry(step * 0.27, step * 0.27, 0.028 * detail, software ? 12 : 24),
        );
        diaphragm.position.set(px, 0, pz);
        diaphragm.name = "membrane-diaphragm";
        diaphragm.userData.cell = `${x}:${z}`;
        diaphragm.userData.phase = x * 0.8 + z * 1.15;
        const frame = addMesh(
          new T.TorusGeometry(step * 0.27, r * 0.55, software ? 6 : 10, software ? 18 : 30),
        );
        frame.rotation.x = Math.PI / 2;
        frame.position.set(px, 0.016 + 0.014 * detail, pz);
        if (p.variant !== 0) {
          const platelet = addMesh(
            new T.CylinderGeometry(step * 0.105, step * 0.105, 0.025 * detail, software ? 12 : 20),
            plateletMat,
          );
          platelet.name = "bonded-platelet";
          platelet.userData.cell = `${x}:${z}`;
          platelet.position.set(px + step * 0.055, 0.014 * detail + 0.0125 * detail, pz);
          platelet.rotation.y = (p.variant === 2 ? x - z : 0) * 0.18;
        }
      }
  } else if (p.kind === "thermal-cloak") {
    // Coplanar annuli read as a fabricated composite plate. Alternating
    // conductor and insulating paths are clearer than a stack of tubes.
    const plate = new T.MeshStandardMaterial({
      color: 0x26343e,
      roughness: 0.68,
      metalness: 0.2,
    });
    const copper = new T.MeshPhysicalMaterial({
      color: 0xd89267,
      roughness: 0.29,
      metalness: 0.86,
      clearcoat: 0.16,
      side: T.DoubleSide,
    });
    const insulator = new T.MeshStandardMaterial({
      color: 0x6f8591,
      roughness: 0.78,
      metalness: 0.08,
      side: T.DoubleSide,
    });
    addMesh(new T.CylinderGeometry(1.86, 1.86, 0.1, software ? 24 : 64), plate).position.y = -0.08;
    const rings = 3 + n;
    for (let i = 0; i < rings; i++) {
      const inner = 0.3 + i * (1.42 / rings);
      const outer = inner + 1.27 / rings;
      const ring = addMesh(
        new T.RingGeometry(inner, outer, software ? 18 : 48),
        i % 2 === 0 ? copper : insulator,
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.012 + (i % 2) * 0.012 * detail;
    }
    const protectedCore = addMesh(
      new T.CylinderGeometry(0.27, 0.27, 0.075, software ? 16 : 28),
      new T.MeshStandardMaterial({ color: 0x334853, roughness: 0.78 }),
    );
    protectedCore.name = "thermal-protected-core";
    protectedCore.position.y = 0.055;
  } else if (p.kind === "topological") {
    // A planar photonic-crystal chip with a deliberate L-shaped domain wall.
    const postMat = new T.MeshPhysicalMaterial({
      color: p.color,
      roughness: 0.35,
      metalness: 0.16,
      clearcoat: 0.18,
    });
    const domainMat = new T.MeshStandardMaterial({
      color: 0x718592,
      roughness: 0.62,
      metalness: 0.22,
    });
    const side = Math.max(6, n + 4);
    const pitch = 3.15 / (side - 1);
    for (let ix = 0; ix < side; ix++)
      for (let iz = 0; iz < side; iz++) {
        const x = (ix - (side - 1) / 2) * pitch;
        const z = (iz - (side - 1) / 2) * pitch;
        const route =
          (Math.abs(z + 1.18) < pitch * 0.34 && x < 0.8) ||
          (Math.abs(x - 0.8) < pitch * 0.34 && z > -1.18);
        if (route) continue;
        const post = addMesh(
          new T.CylinderGeometry(0.095 * detail, 0.095 * detail, 0.26 * detail, software ? 8 : 16),
          x < 0.8 || z < -1.18 ? postMat : domainMat,
        );
        post.position.set(x + (p.variant === 1 ? (iz % 2) * 0.055 : 0), 0.13 * detail, z);
      }
  } else if (p.kind === "flux") {
    // Five nested soft-magnetic funnels on each side of a small sensing gap.
    const funnelMat = new T.MeshPhysicalMaterial({
      color: p.color,
      roughness: 0.22,
      metalness: 0.82,
      clearcoat: 0.16,
      side: T.DoubleSide,
    });
    const layers = Math.max(1, n);
    const gap = 0.28;
    for (let side of [-1, 1])
      for (let i = 0; i < layers; i++) {
        const length = 0.62 + i * 0.11;
        const narrow = (0.13 + i * 0.045) * detail;
        const outer = (0.56 + i * 0.11) * detail;
        const funnel = addMesh(
          new T.CylinderGeometry(narrow, outer, length, software ? 16 : 40, 1, true),
          funnelMat,
        );
        funnel.rotation.z = side < 0 ? -Math.PI / 2 : Math.PI / 2;
        funnel.position.x = side * (gap / 2 + length / 2);
        const mouth = addMesh(
          new T.TorusGeometry(outer, 0.024 * detail, software ? 6 : 9, software ? 18 : 32),
          funnelMat,
        );
        mouth.rotation.y = Math.PI / 2;
        mouth.position.x = side * (gap / 2 + length);
      }
  } else if (p.kind === "hyperbolic") {
    // Alternating deposited films. Their thicknesses add to one continuous
    // stack, so no fake air gaps imply a bulk material mixture.
    const metal = new T.MeshPhysicalMaterial({
      color: p.color,
      metalness: 0.86,
      roughness: 0.22,
      clearcoat: 0.14,
    });
    const dielectric = new T.MeshPhysicalMaterial({
      color: p.secondaryColor ?? "#dbe8ee",
      metalness: 0.04,
      roughness: 0.38,
      transmission: software ? 0 : 0.12,
      transparent: true,
      opacity: 0.92,
    });
    const pairs = Math.max(3, n + 2 + (p.variant === 2 ? 2 : 0));
    const totalDepth = 1.52;
    const metalShare = 0.24 + control * 0.48;
    let cursor = -totalDepth / 2;
    for (let i = 0; i < pairs * 2; i++) {
      const isMetal = i % 2 === 0;
      const layerDepth =
        (isMetal ? metalShare : 1 - metalShare) * (totalDepth / pairs);
      const outward = Math.abs(i - (pairs * 2 - 1) / 2) / pairs;
      const span = p.variant === 1 ? 1.48 + outward * 0.48 : 1.68;
      const height = 1.42 + outward * (p.variant === 1 ? 0.3 : 0);
      const layer = addMesh(
        new T.BoxGeometry(layerDepth, height, span),
        isMetal ? metal : dielectric,
      );
      layer.name = isMetal ? "hyperbolic-metal-layer" : "hyperbolic-dielectric-layer";
      // The first deposited film begins exactly at the substrate surface.
      // That keeps the stack continuous without hiding a fake overlap below it.
      layer.position.set(cursor + layerDepth / 2, 0.07 + height / 2, 0);
      cursor += layerDepth;
    }
    const base = addMesh(
      new T.BoxGeometry(1.74, 0.07, 1.94),
      new T.MeshStandardMaterial({ color: 0x263845, roughness: 0.72, metalness: 0.16 }),
    );
    base.name = "hyperbolic-substrate";
    base.position.y = 0.035;
  } else if (p.kind === "chiral") {
    // Every tube starts one radius above the support, so its lower surface is
    // seated on the transparent substrate rather than floating through it.
    const helixMaterial = new T.MeshPhysicalMaterial({
      color: p.color,
      roughness: 0.22,
      metalness: 0.84,
      clearcoat: 0.16,
    });
    const substrate = addMesh(
      new T.BoxGeometry(3.35, 0.08, 3.35),
      new T.MeshPhysicalMaterial({
        color: 0x6d8594,
        roughness: 0.24,
        metalness: 0.1,
        transparent: true,
        opacity: 0.18,
      }),
    );
    substrate.name = "chiral-transparent-substrate";
    substrate.position.y = -0.04;
    const side = Math.max(3, n + 2);
    const spacing = 2.45 / Math.max(1, side - 1);
    const handedness = p.variant === 1 ? -1 : 1;
    const turns = p.variant === 2 ? 2.35 : 1.55;
    const helixHeight = 0.48 + control * 0.82;
    const helixRadius = 0.1 + control * 0.12;
    const tubeRadius = 0.035;
    for (let ix = 0; ix < side; ix++)
      for (let iz = 0; iz < side; iz++) {
        const cx = (ix - (side - 1) / 2) * spacing;
        const cz = (iz - (side - 1) / 2) * spacing;
        const points = Array.from({ length: 38 }, (_, index) => {
          const t = index / 37;
          const a = handedness * t * Math.PI * 2 * turns;
          return new T.Vector3(
            cx + Math.cos(a) * helixRadius,
            tubeRadius + t * helixHeight,
            cz + Math.sin(a) * helixRadius,
          );
        });
        const helix = addMesh(
          new T.TubeGeometry(
            new T.CatmullRomCurve3(points),
            software ? 28 : 48,
            tubeRadius,
            software ? 4 : 7,
            false,
          ),
          helixMaterial,
        );
        helix.name = "chiral-gold-helix";
        helix.userData.handedness = handedness;
      }
  } else if (p.kind === "labyrinth") {
    // The dividers all meet the base and alternate sides, creating a true
    // serpentine air route rather than disconnected decorative walls.
    const wallMaterial = new T.MeshStandardMaterial({
      color: p.color,
      roughness: 0.46,
      metalness: 0.08,
    });
    const base = addMesh(new T.BoxGeometry(3.55, 0.09, 2.35), wallMaterial);
    base.name = "labyrinth-base";
    base.position.y = 0.045;
    const wallHeight = 0.52;
    const wallThickness = 0.08;
    const addWall = (sx: number, sz: number, x: number, z: number, name: string) => {
      const wall = addMesh(new T.BoxGeometry(sx, wallHeight, sz), wallMaterial);
      wall.name = name;
      wall.position.set(x, 0.09 + wallHeight / 2, z);
      return wall;
    };
    addWall(3.55, wallThickness, 0, -1.135, "labyrinth-side-wall");
    addWall(3.55, wallThickness, 0, 1.135, "labyrinth-side-wall");
    addWall(wallThickness, wallHeight, -1.735, 0, "labyrinth-inlet-wall");
    addWall(wallThickness, wallHeight, 1.735, 0, "labyrinth-outlet-wall");
    const folds = p.variant === 0 ? 0 : n + 1 + (p.variant === 2 ? 2 : 0);
    const clearance = 0.2 + control * 0.22;
    for (let i = 0; i < folds; i++) {
      const x = -1.38 + ((i + 1) / (folds + 1)) * 2.76;
      const fromBottom = i % 2 === 0;
      const length = 2.27 - clearance;
      addWall(
        wallThickness,
        length,
        x,
        fromBottom ? -clearance / 2 : clearance / 2,
        "labyrinth-divider",
      );
    }
  } else if (p.kind === "radiative-cooler") {
    // The film is a continuous polymer slab. Each microsphere centre is kept
    // between its two faces, which prevents the floating-particle artifact.
    const backingHeight = 0.07;
    const filmHeight = 0.12 + control * 0.26 + (p.variant === 2 ? 0.08 : 0);
    const backing = addMesh(
      new T.BoxGeometry(3.5, backingHeight, 2.7),
      new T.MeshPhysicalMaterial({ color: 0xc6d1d7, metalness: 0.92, roughness: 0.18 }),
    );
    backing.name = "radiative-silver-backing";
    backing.position.y = backingHeight / 2;
    const film = addMesh(
      new T.BoxGeometry(3.42, filmHeight, 2.62),
      new T.MeshPhysicalMaterial({
        color: p.color,
        roughness: 0.34,
        metalness: 0.03,
        transparent: true,
        opacity: 0.74,
      }),
    );
    film.name = "radiative-polymer-film";
    film.position.y = backingHeight + filmHeight / 2;
    const density = Math.max(3, n + 2 + (p.variant === 1 ? 2 : 0));
    const sphereRadius = Math.min(0.07, filmHeight * 0.32);
    const spheres = new T.InstancedMesh(
      new T.SphereGeometry(sphereRadius, software ? 6 : 10, software ? 5 : 8),
      new T.MeshPhysicalMaterial({
        color: p.secondaryColor ?? "#f8fbfd",
        roughness: 0.2,
        metalness: 0.08,
        clearcoat: 0.14,
      }),
      density * density,
    );
    spheres.name = "radiative-silica-microsphere";
    const dummy = new T.Object3D();
    for (let ix = 0; ix < density; ix++)
      for (let iz = 0; iz < density; iz++) {
        const index = ix * density + iz;
        const x = -1.34 + (ix / Math.max(1, density - 1)) * 2.68;
        const z = -0.98 + (iz / Math.max(1, density - 1)) * 1.96;
        const y =
          backingHeight +
          sphereRadius +
          ((ix * 7 + iz * 11) % 5) / 4 * Math.max(0, filmHeight - sphereRadius * 2);
        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        spheres.setMatrixAt(index, dummy.matrix);
      }
    spheres.instanceMatrix.needsUpdate = true;
    root.add(spheres);
  } else if (p.kind === "seismic") {
    // Pivot each rod at the ground surface. The motion builder can then bend
    // the upright resonator without lifting its lower end off the support.
    const groundHeight = 0.18;
    const ground = addMesh(
      new T.BoxGeometry(3.95, groundHeight, 2.9),
      new T.MeshStandardMaterial({ color: 0x384955, roughness: 0.86, metalness: 0.04 }),
    );
    ground.name = "seismic-ground-plate";
    ground.position.y = groundHeight / 2;
    const rods = Math.max(3, n + 2);
    const spacing = 2.9 / Math.max(1, rods - 1);
    const postMaterial = new T.MeshPhysicalMaterial({ color: p.color, metalness: 0.68, roughness: 0.3 });
    for (let ix = 0; ix < rods; ix++)
      for (let iz = -1; iz <= 1; iz++) {
        const fraction = ix / Math.max(1, rods - 1);
        const gradient =
          p.variant === 1 ? 0.58 + fraction * 0.72 : p.variant === 2 ? 1.3 - fraction * 0.72 : 1;
        const height = (0.45 + control * 0.9) * gradient;
        const pivot = new T.Group();
        pivot.name = "seismic-resonator-pivot";
        const footHeight = 0.045;
        const foot = new T.Mesh(
          new T.CylinderGeometry(0.13, 0.15, footHeight, software ? 8 : 14),
          postMaterial,
        );
        foot.name = "seismic-anchor-foot";
        foot.position.set(-1.45 + ix * spacing, groundHeight + footHeight / 2, iz * 0.62);
        foot.castShadow = true;
        foot.receiveShadow = true;
        root.add(foot);
        pivot.position.set(-1.45 + ix * spacing, groundHeight + footHeight, iz * 0.62);
        pivot.userData.phase = ix * 0.42 + iz * 0.35;
        const post = new T.Mesh(
          new T.CylinderGeometry(0.065, 0.08, height, software ? 7 : 12),
          postMaterial,
        );
        post.name = "seismic-resonator-rod";
        post.position.y = height / 2;
        post.castShadow = true;
        post.receiveShadow = true;
        pivot.add(post);
        root.add(pivot);
      }
  } else if (p.kind === "water-wave") {
    // A transparent water volume sits above a floor. Plate bottoms align with
    // that floor top at every height setting.
    const floorHeight = 0.1;
    const floor = addMesh(
      new T.BoxGeometry(3.9, floorHeight, 3.0),
      new T.MeshStandardMaterial({ color: 0x304452, roughness: 0.78, metalness: 0.14 }),
    );
    floor.name = "water-tank-floor";
    floor.position.y = floorHeight / 2;
    const water = addMesh(
      new T.BoxGeometry(3.82, 0.46, 2.92),
      new T.MeshPhysicalMaterial({
        color: 0x6ad3ed,
        roughness: 0.16,
        metalness: 0.04,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    water.name = "water-volume";
    water.position.y = floorHeight + 0.23;
    const rows = Math.max(3, n + 2);
    const spacing = 2.75 / Math.max(1, rows - 1);
    const plateHeight = 0.2 + control * 0.3 + (p.variant === 2 ? 0.14 : 0);
    const plateMaterial = new T.MeshPhysicalMaterial({ color: p.color, roughness: 0.34, metalness: 0.12 });
    for (let i = 0; i < rows; i++) {
      const plate = addMesh(new T.BoxGeometry(0.09, plateHeight, 1.64), plateMaterial);
      plate.name = "water-wave-plate";
      plate.position.set(-1.35 + i * spacing, floorHeight + plateHeight / 2, 0);
      plate.rotation.y = p.variant === 1 ? (i - (rows - 1) / 2) * 0.11 : 0;
    }
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
      if (showSecondPhase) cylinders.setColorAt(i, phaseColor(dummy.position));
    });
    if (showSecondPhase && cylinders.instanceColor)
      cylinders.instanceColor.needsUpdate = true;
    cylinders.castShadow = true;
    cylinders.receiveShadow = true;
    root.add(cylinders);
  }

  // Rods created as individual meshes (for example, resonator springs) need
  // the same visible phase allocation as the batched lattice struts.
  if (showSecondPhase)
    root.traverse((object) => {
      if (
        object instanceof T.Mesh &&
        !(object instanceof T.InstancedMesh) &&
        object.material === material
      )
        paintGeometry(object.geometry);
    });

  return root;
}
