import * as T from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  materials,
  mesh,
  ellipsoid,
  tube,
  box,
  anchor,
  warpLattice,
  surface,
  type Callout,
} from "./primitives";
import type { Application } from "./Applications";

// One scene unit represents 0.1 m. Motion is displayed at 0.28 physical seconds per second.
export const DROP_GRAVITY = 98.1,
  DROP_HEIGHT = 1.25,
  DROP_RESTITUTION = 0.28;
/** Ballistic free flight, dissipative collisions, then rest. No sinusoidal floating or penetration. */
export function sampleDrop(seconds: number) {
  if (seconds < 0)
    return {
      height: DROP_HEIGHT,
      velocity: 0,
      phase: "Ready to release",
      contact: 0,
    };
  const first = Math.sqrt((2 * DROP_HEIGHT) / DROP_GRAVITY);
  if (seconds < first)
    return {
      height: DROP_HEIGHT - 0.5 * DROP_GRAVITY * seconds * seconds,
      velocity: -DROP_GRAVITY * seconds,
      phase: "Free fall · gravity accelerates the ball",
      contact: 0,
    };
  let remaining = seconds - first,
    speed = Math.sqrt(2 * DROP_GRAVITY * DROP_HEIGHT) * DROP_RESTITUTION;
  for (let bounce = 0; bounce < 3; bounce++) {
    const duration = (2 * speed) / DROP_GRAVITY;
    if (remaining < duration)
      return {
        height: Math.max(
          0,
          speed * remaining - 0.5 * DROP_GRAVITY * remaining * remaining,
        ),
        velocity: speed - DROP_GRAVITY * remaining,
        phase: "Rebound · less energy after contact",
        contact: Math.max(0, 1 - remaining / 0.016) * (bounce === 0 ? 1 : 0.2),
      };
    remaining -= duration;
    speed *= DROP_RESTITUTION;
  }
  return {
    height: 0,
    velocity: 0,
    phase: "At rest · impact energy dissipated",
    contact: 0,
  };
}
function helmetPoint(x: number, z: number, inset = 0) {
  const dome = Math.sqrt(Math.max(0, 1 - x * x - z * z));
  return new T.Vector3(
    -0.12 + x * (1.08 - inset),
    0.36 + (0.72 - inset) * dome - 0.1 * Math.max(0, -x),
    z * (0.75 - inset),
  );
}
function helmetShell(parent: T.Group, material: T.Material, inner: T.Material) {
  // The shell has continuous bridges and genuine rounded ventilation openings.
  const shape = new T.Shape();
  shape.absellipse(0, 0, 1, 1, 0, Math.PI * 2, false, 0);
  const vents = [
    [-0.44, -0.34, 0.29, 0.1],
    [0.28, -0.34, 0.27, 0.1],
    [-0.4, 0.34, 0.29, 0.1],
    [0.31, 0.34, 0.27, 0.1],
    [-0.1, -0.69, 0.31, 0.085],
    [-0.1, 0.69, 0.39, 0.12],
  ];
  for (const [x, z, rx, rz] of vents) {
    const hole = new T.Path();
    hole.absellipse(x, z, rx, rz, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
  }
  const flat = new T.ShapeGeometry(shape, 32);
  const subdivided = new TessellateModifier(0.11, 5).modify(flat);
  flat.dispose();
  for (const [inset, mat, name] of [
    [0, material, "vented-polycarbonate-shell"],
    [0.055, inner, "shell-inner-surface"],
  ] as const) {
    const geo = subdivided.clone(),
      pos = geo.attributes.position,
      normals: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getY(i),
        dome = Math.sqrt(Math.max(0, 1 - x * x - z * z));
      const v = helmetPoint(x, z, inset);
      pos.setXYZ(i, v.x, v.y, v.z);
      const normal = new T.Vector3(
        x / (1.08 - inset),
        dome / (0.72 - inset),
        z / (0.75 - inset),
      )
        .normalize()
        .multiplyScalar(inset === 0 ? 1 : -1);
      normals.push(normal.x, normal.y, normal.z);
    }
    geo.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
    if (inset === 0) {
      const indices: number[] = [];
      for (let i = 0; i < pos.count; i += 3) indices.push(i, i + 2, i + 1);
      geo.setIndex(indices);
    }
    const smooth = mergeVertices(geo, 1e-5);
    geo.dispose();
    const finish = mat.clone();
    finish.side = T.FrontSide;
    mesh(smooth, finish, parent, name);
  }
  subdivided.dispose();
  // Close thickness along the lower edge and all vent rims.
  for (const contour of [
    shape.getPoints(48),
    ...shape.holes.map((h) => h.getPoints(32)),
  ]) {
    const verts: number[] = [],
      indices: number[] = [];
    for (const pt of contour) {
      verts.push(
        ...helmetPoint(pt.x, pt.y).toArray(),
        ...helmetPoint(pt.x, pt.y, 0.055).toArray(),
      );
    }
    for (let i = 0; i < contour.length - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    mesh(geo, inner, parent, "rounded-vent-wall");
  }
}
export function buildHelmet(lattice: T.Group, color: string): Application {
  const group = new T.Group();
  group.name = "application-kelvin";
  const p = materials();
  p.accent.color.set(color);
  p.ivory.side = p.dark.side = T.DoubleSide;
  const resin = new T.MeshStandardMaterial({
    color: "#899da5",
    roughness: 0.8,
  });
  const detail = new T.MeshStandardMaterial({
    color: "#556d78",
    roughness: 0.85,
  });
  const head = new T.Group();
  group.add(head);
  const sections = [
    [-0.84, 0.24, 0.25, 0.2],
    [-0.72, 0.37, 0.33, 0.1],
    [-0.42, 0.5, 0.43, 0.01],
    [-0.05, 0.62, 0.53, -0.1],
    [0.32, 0.58, 0.52, -0.16],
    [0.58, 0.37, 0.35, -0.17],
    [0.69, 0.015, 0.015, -0.17],
  ];
  const face = surface(
    head,
    resin,
    64,
    48,
    (u, v) => {
      const y = -0.84 + 1.53 * v,
        a = u * Math.PI * 2;
      let i = 1;
      while (i < sections.length - 1 && y > sections[i][0]) i++;
      const lo = sections[i - 1],
        hi = sections[i],
        f = (y - lo[0]) / (hi[0] - lo[0]);
      const rx = T.MathUtils.lerp(lo[1], hi[1], f),
        rz = T.MathUtils.lerp(lo[2], hi[2], f),
        cx = T.MathUtils.lerp(lo[3], hi[3], f);
      const front =
        Math.cos(a) > 0 ? Math.exp(-Math.pow(Math.sin(a) / 0.16, 2)) : 0;
      const nose =
        front *
        (0.18 * Math.exp(-Math.pow((y + 0.36) / 0.12, 2)) +
          0.05 * Math.exp(-Math.pow((y + 0.14) / 0.22, 2)));
      return [cx + Math.cos(a) * rx + nose, y, Math.sin(a) * rz];
    },
    "continuous-anatomical-headform",
  );
  const faceIndex = face.geometry.index!;
  for (let i = 0; i < faceIndex.count; i += 3) {
    const b = faceIndex.getX(i + 1);
    faceIndex.setX(i + 1, faceIndex.getX(i + 2));
    faceIndex.setX(i + 2, b);
  }
  face.geometry.computeVertexNormals();
  ellipsoid(
    head,
    resin,
    [-0.23, -1.05, 0],
    [0.3, 0.39, 0.29],
    "anatomical-neck",
  );
  // A recognisable face points in +X; straps run behind the ears and beneath the jaw.

  for (const side of [-1, 1]) {
    ellipsoid(
      head,
      resin,
      [-0.11, -0.33, side * 0.53],
      [0.11, 0.2, 0.065],
      "ear-pinna",
    );
    ellipsoid(
      head,
      detail,
      [-0.075, -0.34, side * 0.586],
      [0.06, 0.1, 0.012],
      "ear-concha",
    );
    ellipsoid(
      head,
      detail,
      [0.497, -0.2, side * 0.257],
      [0.045, 0.035, 0.07],
      "eye-socket",
    );
    tube(
      head,
      resin,
      [
        [0.47, -0.12, side * 0.19],
        [0.48, -0.105, side * 0.27],
        [0.41, -0.13, side * 0.35],
      ],
      0.032,
      false,
      "brow-ridge",
    );
  }
  tube(
    head,
    detail,
    [
      [0.559, -0.56, -0.15],
      [0.592, -0.575, 0],
      [0.559, -0.56, 0.15],
    ],
    0.012,
    false,
    "mouth-line",
  );
  ellipsoid(
    group,
    p.dark,
    [-0.2, -1.5, 0],
    [0.67, 0.17, 0.56],
    "headform-mount",
  );
  box(group, p.metal, [0.75, 0.12, 0.68], [-0.2, -1.71, 0], "test-stand");
  const shell = new T.Group();
  group.add(shell);
  helmetShell(shell, p.ivory, p.dark);
  // A fitted cellular liner sits between the cranium and shell, exposed through the near-side cutaway vent.
  const core = warpLattice(lattice, (v) => {
    const az = 0.25 + ((v.x + 1.75) / 3.5) * 2.55;
    const polar = 0.23 + ((v.y + 1.75) / 3.5) * 1.12;
    const layer = (v.z + 1.75) / 3.5;
    return new T.Vector3(
      -0.12 + (1.0 - layer * 0.055) * Math.sin(polar) * Math.cos(az),
      0.34 + (0.66 - layer * 0.075) * Math.cos(polar),
      (0.68 - layer * 0.045) * Math.sin(polar) * Math.sin(az),
    );
  });
  group.add(core);
  const fitRing = tube(
    group,
    p.rubber,
    Array.from({ length: 48 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return [
        -0.12 + Math.cos(a) * 0.9,
        0.29 - Math.max(0, -Math.cos(a)) * 0.08,
        Math.sin(a) * 0.62,
      ];
    }),
    0.034,
    true,
    "fit-retention-ring",
  );
  for (const side of [-1, 1]) {
    const junction = [0.0, -0.56, side * 0.52];
    tube(
      group,
      p.dark,
      [[-0.78, 0.33, side * 0.4], [-0.38, -0.12, side * 0.55], junction],
      0.021,
      false,
      "rear-Y-strap",
    );
    tube(
      group,
      p.dark,
      [[0.62, 0.35, side * 0.4], [0.37, -0.12, side * 0.49], junction],
      0.021,
      false,
      "front-Y-strap",
    );
    tube(
      group,
      p.dark,
      [junction, [0.18, -0.83, side * 0.28], [0.32, -0.85, 0]],
      0.023,
      false,
      "under-chin-strap",
    );
    box(
      group,
      p.metal,
      [0.085, 0.085, 0.06],
      [0.0, -0.55, side * 0.53],
      "strap-divider",
    );
  }
  box(group, p.dark, [0.12, 0.07, 0.17], [0.32, -0.85, 0], "chin-buckle");
  const dial = mesh(
    new T.CylinderGeometry(0.095, 0.095, 0.06, 24),
    p.accent,
    group,
    "rear-fit-dial",
  );
  dial.rotation.z = Math.PI / 2;
  dial.position.set(-1.05, 0.12, 0);
  // Local shell crown at x=-.12,z=0 is y=1.08. Radius offsets the collision centre.
  const ballRadius = 0.16,
    contactY = 1.08 + ballRadius;
  const ball = ellipsoid(
    group,
    p.metal,
    [-0.12, contactY + DROP_HEIGHT, 0],
    [ballRadius, ballRadius, ballRadius],
    "impact-ball",
  );
  const callouts: Callout[] = [];
  const label = (
    label: string,
    parent: T.Object3D,
    pos: number[],
    side: "left" | "right",
    slot: number,
  ) => callouts.push({ label, anchor: anchor(parent, pos, label), side, slot });
  label("Vented shell: spreads contact over the liner", shell, [-0.25, 0.91, -0.19], "left", 0);
  label("Kelvin-cell liner: energy-management concept", core, [0.0, 0.7, 0.52], "right", 1);
  label("Headform: rigid fit and test model", head, [0.49, -0.43, 0.26], "left", 2);
  label("Retention straps: keep the helmet positioned", group, [0.3, -0.83, 0.12], "right", 2);
  return {
    group,
    callouts,
    camera: [6.2, 3.1, 8.1],
    target: [0, 0.1, 0],
    update: (t, e) => {
      shell.position.y = e * 0.85;
      core.position.y = e * 0.37;
      fitRing.position.y = e * 0.12;
      if (e > 0.025) {
        ball.visible = false;
        return "Exploded anatomy · assemble to run the drop";
      }
      const cycle = t % 4.6;
      const reset = cycle > 3.25;
      ball.visible = !reset;
      const sample = sampleDrop((cycle - 0.38) * 0.28);
      ball.position.y = contactY + sample.height;
      return reset
        ? "Resetting the drop · next release follows"
        : `Slow motion · ${sample.phase}`;
    },
  };
}
