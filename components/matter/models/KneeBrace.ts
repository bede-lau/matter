import * as T from "three";
import {
  materials,
  mesh,
  ellipsoid,
  tube,
  rod,
  box,
  surface,
  anchor,
  warpLattice,
  type Callout,
} from "./primitives";
import { buildShoe } from "./Shoe";
import type { Application } from "./Applications";

function knitTexture() {
  const size = 64,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4,
        v = 140 + ((x + (y % 4)) % 6 < 2 ? 48 : 0) + (y % 4 === 0 ? 18 : 0);
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  const tex = new T.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.repeat.set(8, 5);
  tex.needsUpdate = true;
  return tex;
}
export function buildKneeBrace(
  lattice: T.Group,
  color: string,
  variant: number,
): Application {
  const group = new T.Group();
  group.name = "application-auxetic";
  const p = materials();
  p.accent.color.set(color);
  p.textile.color.set("#8499a3");
  p.textile.side = T.DoubleSide;
  p.textile.map = knitTexture();
  p.textile.roughness = 0.94;
  const leg = new T.Group();
  group.add(leg);
  leg.position.y = 0.16;
  // Smooth, tapered anatomy, cropped above the thigh. The knee is the origin of lower-leg articulation.
  const thigh = mesh(
    new T.CylinderGeometry(0.415, 0.335, 1.64, 40),
    p.skin,
    leg,
    "cropped-upper-leg",
  );
  thigh.position.set(-0.06, 0.84, 0);
  ellipsoid(leg, p.skin, [0.04, 0, 0], [0.35, 0.35, 0.33], "patella-anatomy");
  const calf = new T.Group();
  leg.add(calf);
  calf.name = "articulated-calf";
  surface(
    calf,
    p.skin,
    38,
    25,
    (u, v) => {
      const a = u * Math.PI * 2,
        y = -v * 1.78,
        r = 0.105 + 0.215 * (1 - v) + 0.105 * Math.sin(Math.PI * v);
      return [-0.09 - 0.035 * v + Math.cos(a) * r, y, Math.sin(a) * r * 0.94];
    },
    "tapered-lower-leg",
  );
  // The ankle enters the collar at its actual local centre (-1.4, 1.61), behind the tongue.
  const foot = buildShoe(null, color, variant, true);
  calf.add(foot.group);
  foot.group.scale.setScalar(0.29);
  const ankle = new T.Vector3(-0.12, -1.74, 0);
  foot.group.position
    .copy(ankle)
    .sub(new T.Vector3(-1.4, 1.61, 0).multiplyScalar(0.29));
  ellipsoid(
    calf,
    p.skin,
    [-0.12, -1.65, 0],
    [0.12, 0.24, 0.105],
    "ankle-inside-collar",
  );
  anchor(calf, ankle.toArray(), "ankle-centre");
  anchor(foot.group, [-1.4, 1.61, 0], "shoe-collar-centre");
  const sleeve = new T.Group();
  leg.add(sleeve);
  const sleeveLower = new T.Group();
  calf.add(sleeveLower);
  function section(parent: T.Group, from: number, to: number) {
    return surface(
      parent,
      p.textile,
      48,
      22,
      (u, v) => {
        const y = from + (to - from) * v,
          a = u * Math.PI * 2;
        const r =
          y >= 0
            ? 0.375 + 0.08 * Math.min(1, y)
            : 0.37 - 0.055 * Math.min(1, -y);
        return [-0.04 + Math.cos(a) * r, y, Math.sin(a) * r * 0.96];
      },
      "compression-knit-sleeve",
    );
  }
  section(sleeve, 0, 1.28);
  section(sleeveLower, -1.08, 0);
  // Broad cuffs and reinforced side panels read as a fitted textile brace, not a floating cage.
  for (const [parent, y, r] of [
    [sleeve, 1.22, 0.454],
    [sleeveLower, -1.01, 0.322],
  ] as const) {
    const cuff = mesh(
      new T.CylinderGeometry(r, r, 0.12, 48, 1, true),
      p.dark,
      parent,
      "elastic-grip-cuff",
    );
    cuff.position.set(-0.04, y, 0);
    for (const dy of [-0.065, 0.065])
      tube(
        parent,
        p.ivory,
        Array.from({ length: 40 }, (_, i) => {
          const a = (i / 40) * Math.PI * 2;
          return [
            -0.04 + Math.cos(a) * (r + 0.005),
            y + dy,
            Math.sin(a) * (r + 0.005),
          ];
        }),
        0.009,
        true,
        "cuff-stitching",
      );
  }
  const pad = new T.Group();
  leg.add(pad);
  const core = warpLattice(lattice, (v) => {
    const y = (v.y / 1.75) * 0.48,
      az = (v.x / 1.75) * 0.89,
      r = 0.425 + ((v.z + 1.75) / 3.5) * 0.095;
    return new T.Vector3(-0.04 + Math.cos(az) * r, y, Math.sin(az) * r);
  });
  pad.add(core);
  // The cellular pad sits inside a contoured patella ring. Its centre is intentionally open.
  const cap = new T.Group();
  pad.add(cap);
  for (const [ry, rz, rad, mat] of [
    [0.55, 0.37, 0.075, p.dark],
    [0.48, 0.31, 0.045, p.ivory],
  ] as const)
    tube(
      cap,
      mat,
      Array.from({ length: 44 }, (_, i) => {
        const a = (i / 44) * Math.PI * 2;
        return [
          0.43 - 0.09 * Math.abs(Math.sin(a)),
          Math.cos(a) * ry,
          Math.sin(a) * rz,
        ];
      }),
      rad,
      true,
      "patella-support-ring",
    );
  const centre = ellipsoid(
    cap,
    p.textile,
    [0.395, 0, 0],
    [0.055, 0.33, 0.215],
    "breathable-patella-window",
  );
  // Lateral stays are articulated at the actual knee axis.
  for (const side of [-1, 1]) {
    const hinge = mesh(
      new T.CylinderGeometry(0.12, 0.12, 0.075, 24),
      p.dark,
      leg,
      "lateral-knee-hinge",
    );
    hinge.rotation.x = Math.PI / 2;
    hinge.position.set(-0.04, 0, side * 0.4);
    const badge = mesh(
      new T.CylinderGeometry(0.055, 0.055, 0.08, 24),
      p.accent,
      leg,
      "hinge-cap",
    );
    badge.rotation.x = Math.PI / 2;
    badge.position.copy(hinge.position);
    tube(
      sleeve,
      p.dark,
      [
        [-0.04, 0.05, side * 0.405],
        [-0.08, 0.54, side * 0.43],
        [-0.03, 1.08, side * 0.44],
      ],
      0.032,
      false,
      "upper-flexible-stay",
    );
    tube(
      sleeveLower,
      p.dark,
      [
        [-0.04, -0.05, side * 0.4],
        [-0.08, -0.5, side * 0.36],
        [-0.08, -0.94, side * 0.325],
      ],
      0.03,
      false,
      "lower-flexible-stay",
    );
    // Curving seam panels and a small tension cable on the visible side.
    for (const y of [0.72, 0.91, -0.68, -0.87]) {
      const parent = y < 0 ? sleeveLower : sleeve;
      tube(
        parent,
        p.ivory,
        [
          [0.18, y - 0.05, side * 0.35],
          [0.25, y, side * 0.31],
          [0.27, y + 0.06, side * 0.3],
        ],
        0.009,
        false,
        "reinforced-textile-seam",
      );
    }
  }
  const dial = mesh(
    new T.CylinderGeometry(0.105, 0.105, 0.055, 32),
    p.ivory,
    sleeve,
    "cable-tension-dial",
  );
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0.18, 0.91, 0.405);
  const dialInset = mesh(
    new T.CylinderGeometry(0.065, 0.065, 0.06, 24),
    p.dark,
    sleeve,
    "dial-centre",
  );
  dialInset.rotation.x = Math.PI / 2;
  dialInset.position.copy(dial.position);
  for (let i = 0; i < 6; i++) {
    const y = 0.78 - i * 0.14;
    tube(
      sleeve,
      p.dark,
      [
        [0.17, y, 0.414],
        [0.32, y - 0.09, 0.3],
        [0.17, y - 0.14, 0.414],
      ],
      0.008,
      false,
      "cross-laced-tension-cable",
    );
    ellipsoid(
      sleeve,
      p.ivory,
      [0.18, y, 0.413],
      [0.025, 0.027, 0.017],
      "cable-guide",
    );
  }
  const callouts: Callout[] = [];
  const label = (
    label: string,
    parent: T.Object3D,
    pos: number[],
    side: "left" | "right",
    slot: number,
  ) => callouts.push({ label, anchor: anchor(parent, pos, label), side, slot });
  label("Re-entrant insert — inward-folded cushion cells", core, [0.49, 0.13, 0.25], "right", 1);
  label("Patella ring — positions padding around the kneecap", cap, [0.43, 0.4, 0.18], "left", 1);
  label("Dial & side stays — adjust fit and guide bending", sleeve, [0.18, 0.91, 0.42], "right", 0);
  label("Compression sleeve — holds the brace on the leg", sleeve, [0.25, 1.09, 0.3], "left", 0);
  return {
    group,
    callouts,
    camera: [6.3, 2.65, 7.8],
    target: [0.05, 0.05, 0],
    update: (t, e) => {
      calf.rotation.z = -0.1 - (1 - Math.cos(t * 1.25)) * 0.09;
      pad.rotation.z = calf.rotation.z * 0.35;
      core.position.x = e * 0.48;
      cap.position.x = e * 0.92;
      return e > 0.03
        ? "Exploded brace · sleeve, cushioning & patella ring"
        : "Knee flexion · fitted sleeve and articulated side supports";
    },
  };
}
