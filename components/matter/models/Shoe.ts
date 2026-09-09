import * as T from "three";
import {
  materials,
  warpLattice,
  mesh,
  ellipsoid,
  tube,
  surface,
  solidOutline,
  anchor,
  box,
  Callout,
} from "./primitives";
const stations = [
  [-2.4, 0.08],
  [-2.15, 0.56],
  [-1.7, 0.69],
  [-1, 0.66],
  [-0.3, 0.67],
  [0.45, 0.81],
  [1.15, 0.89],
  [1.75, 0.8],
  [2.15, 0.58],
  [2.4, 0.04],
];
export function widthAt(x: number) {
  for (let i = 1; i < stations.length; i++)
    if (x <= stations[i][0]) {
      const a = stations[i - 1],
        b = stations[i];
      return T.MathUtils.lerp(
        a[1],
        b[1],
        T.MathUtils.clamp((x - a[0]) / (b[0] - a[0]), 0, 1),
      );
    }
  return 0.04;
}
export function rocker(x: number) {
  return (
    Math.pow(Math.max(0, (x - 1) / 1.4), 2) * 0.24 +
    Math.pow(Math.max(0, (-x - 1.9) / 0.5), 2) * 0.09
  );
}
export function outline(scale = 1) {
  const shape = new T.Shape();
  shape.moveTo(-2.4 * scale, 0);
  shape.bezierCurveTo(
    -2.4 * scale,
    -0.7 * scale,
    -1.6 * scale,
    -0.8 * scale,
    -0.45 * scale,
    -0.67 * scale,
  );
  shape.bezierCurveTo(
    0.3 * scale,
    -0.69 * scale,
    0.8 * scale,
    -1 * scale,
    1.6 * scale,
    -0.82 * scale,
  );
  shape.bezierCurveTo(
    2.75 * scale,
    -0.57 * scale,
    2.55 * scale,
    0.5 * scale,
    1.7 * scale,
    0.78 * scale,
  );
  shape.bezierCurveTo(
    0.8 * scale,
    0.98 * scale,
    0.1 * scale,
    0.65 * scale,
    -0.65 * scale,
    0.68 * scale,
  );
  shape.bezierCurveTo(
    -1.6 * scale,
    0.82 * scale,
    -2.4 * scale,
    0.67 * scale,
    -2.4 * scale,
    0,
  );
  return shape;
}
export function buildShoe(
  lattice: T.Group | null,
  accent: string,
  variant = 0,
  detail = true,
) {
  const group = new T.Group();
  group.name = "athletic-shoe";
  const p = materials();
  p.accent.color.set(accent);
  p.ivory.side = T.DoubleSide;
  p.textile.side = T.DoubleSide;
  const outsole = new T.Group(),
    midsole = new T.Group(),
    board = new T.Group(),
    insole = new T.Group(),
    upper = new T.Group();
  group.add(outsole, midsole, board, insole, upper);
  const sole = solidOutline(
    outsole,
    p.rubber,
    outline(),
    0.13,
    0,
    "rubber-outsole",
  );
  const pos = sole.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++)
    pos.setY(i, pos.getY(i) + rocker(pos.getX(i)));
  sole.geometry.computeVertexNormals();
  if (detail)
    for (let x = -2; x < 2.2; x += 0.28)
      for (let z of [-0.43, 0, 0.43])
        if (Math.abs(z) < widthAt(x) - 0.08) {
          const lug = box(
            outsole,
            p.rubber,
            [0.19, 0.07, 0.22],
            [x, -0.055 + rocker(x), z],
            "traction-lug",
          );
          lug.rotation.y = x > 0 ? 0.2 : -0.2;
        }
  const supportPoints = Array.from({ length: pos.count }, (_, i) => ({
    x: pos.getX(i),
    y: pos.getY(i),
  })).sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
  ) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const lower: typeof supportPoints = [],
    higher: typeof supportPoints = [];
  for (const point of supportPoints) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    )
      lower.pop();
    lower.push(point);
  }
  for (const point of supportPoints.slice().reverse()) {
    while (
      higher.length >= 2 &&
      cross(higher[higher.length - 2], higher[higher.length - 1], point) <= 0
    )
      higher.pop();
    higher.push(point);
  }
  const supportHull = lower.slice(0, -1).concat(higher.slice(0, -1));
  const supportHeight = (angle: number, scale = 0.12) =>
    -Math.min(
      ...supportHull.map(
        (v) => (v.x * Math.sin(angle) + v.y * Math.cos(angle)) * scale,
      ),
    );
  // The curved gyroid geometry is fitted to the shoe outline, preserving an open network.
  if (lattice) {
    warpLattice(lattice, (v) => {
      const x = (v.x / 1.9) * 2.3;
      return new T.Vector3(
        x,
        0.36 + (v.y / 1.9) * 0.19 + rocker(x),
        (v.z / 1.9) * widthAt(x) * 0.95,
      );
    });
    midsole.add(lattice);
  } else {
    const cushion = solidOutline(
      midsole,
      p.accent,
      outline(0.98),
      0.35,
      0.14,
      "cushioning-midsole",
    );
    const a = cushion.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) a.setY(i, a.getY(i) + rocker(a.getX(i)));
    cushion.geometry.computeVertexNormals();
  }
  // Rim rails make the perforated sole read as a designed footwear component.
  for (let side of [-1, 1])
    tube(
      midsole,
      p.accent,
      stations
        .slice(1, -1)
        .map(([x, w]) => [x, 0.56 + rocker(x), side * w * 0.97]),
      0.055,
      false,
      "midsole-rim",
    );
  const strobel = solidOutline(
      board,
      p.textile,
      outline(0.965),
      0.045,
      0.58,
      "strobel-board",
    ),
    sockliner = solidOutline(
      insole,
      p.accent,
      outline(0.9),
      0.06,
      0.67,
      "removable-sockliner",
    );
  for (const layer of [strobel, sockliner]) {
    const a = layer.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) a.setY(i, a.getY(i) + rocker(a.getX(i)));
    layer.geometry.computeVertexNormals();
  }
  // Forefoot and vamp are an elliptic, tapered shell; the rear quarter has an open collar.
  surface(
    upper,
    p.ivory,
    38,
    24,
    (u, v) => {
      const x = -0.85 + u * 3.23,
        theta = v * Math.PI;
      const h = 0.94 * (1 - u) * 0.72 + 0.17;
      return [
        x,
        0.67 + rocker(x) + Math.sin(theta) * h,
        Math.cos(theta) * widthAt(x) * 0.98,
      ];
    },
    "engineered-mesh-vamp",
  );
  surface(
    upper,
    p.textile,
    22,
    20,
    (u, v) => {
      const t = Math.PI * 0.3 + u * Math.PI * 1.4;
      const y = 0.65 + v * 0.93;
      return [-1.34 + Math.cos(t) * 0.95, y, Math.sin(t) * (0.59 - v * 0.07)];
    },
    "heel-quarter",
  );
  const collarPts = [];
  for (let i = 0; i < 32; i++) {
    const t = (i / 32) * Math.PI * 2;
    collarPts.push([
      -1.4 + Math.cos(t) * 0.65,
      1.61 + Math.cos(t) * 0.06,
      Math.sin(t) * 0.48,
    ]);
  }
  tube(upper, p.dark, collarPts, 0.085, true, "padded-collar");
  const heelPts = [];
  for (let i = 0; i <= 16; i++) {
    const t = Math.PI * 0.4 + (i / 16) * Math.PI * 1.2;
    heelPts.push([-1.4 + Math.cos(t) * 0.91, 0.95, Math.sin(t) * 0.62]);
  }
  tube(upper, p.dark, heelPts, 0.09, false, "heel-counter");
  // Tongue, eyestays, separate eyelets and crossed laces.
  surface(
    upper,
    p.textile,
    16,
    10,
    (u, v) => [
      -0.94 + u * 1.59,
      1.69 - u * 0.57 + Math.sin(v * Math.PI) * 0.07,
      (v - 0.5) * 0.55,
    ],
    "padded-tongue",
  );
  for (let side of [-1, 1]) {
    tube(
      upper,
      p.dark,
      Array.from({ length: 14 }, (_, i) => {
        const u = i / 13;
        return [-1.05 + u * 1.7, 1.61 - u * 0.56, side * (0.36 + u * 0.05)];
      }),
      0.067,
      false,
      "eyestay",
    );
    for (let i = 0; i < 6; i++) {
      const x = -0.93 + i * 0.27,
        y = 1.62 - i * 0.09;
      const ring = mesh(
        new T.TorusGeometry(0.043, 0.012, 6, 14),
        p.metal,
        upper,
        "lace-eyelet",
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, y, side * 0.39);
    }
  }
  for (let i = 0; i < 5; i++) {
    const x = -0.93 + i * 0.27,
      y = 1.66 - i * 0.09;
    tube(
      upper,
      p.ivory,
      [
        [x, y, -0.39],
        [x + 0.13, y + 0.055, 0],
        [x + 0.27, y - 0.085, 0.39],
      ],
      0.023,
      false,
      "crossed-lace",
    );
    tube(
      upper,
      p.ivory,
      [
        [x, y, 0.39],
        [x + 0.13, y + 0.075, 0],
        [x + 0.27, y - 0.085, -0.39],
      ],
      0.023,
      false,
      "crossed-lace",
    );
  }
  tube(
    upper,
    p.ivory,
    [
      [-0.86, 1.74, 0],
      [-1.12, 1.81, -0.18],
      [-0.94, 1.83, -0.32],
      [-0.77, 1.78, 0],
      [-1.02, 1.86, 0.27],
      [-1.19, 1.77, 0.18],
      [-0.86, 1.74, 0],
    ],
    0.021,
    false,
    "lace-bow",
  );
  // Toe bumper, sculpted side overlays, seams and visible perforations.
  for (let side of [-1, 1]) {
    tube(
      upper,
      p.dark,
      [
        [-1.88, 1.25, side * 0.58],
        [-1.18, 0.84, side * 0.7],
        [-0.38, 0.8, side * 0.66],
        [0.1, 1.08, side * 0.56],
      ],
      0.047,
      false,
      "quarter-overlay",
    );
    tube(
      upper,
      p.ivory,
      stations
        .slice(1, -1)
        .map(([x, w]) => [x, 0.69 + rocker(x), side * w * 0.97]),
      0.018,
      false,
      "stitched-welt",
    );
    tube(
      upper,
      p.accent,
      [
        [-1.65, 1.37, side * 0.57],
        [-1.46, 1.06, side * 0.65],
        [-0.94, 0.88, side * 0.69],
      ],
      0.035,
      false,
      "reflective-heel-detail",
    );
  }
  tube(
    upper,
    p.dark,
    [
      [1.65, 0.76, -0.79],
      [2.04, 0.85, -0.62],
      [2.28, 0.95, -0.28],
      [2.35, 1, 0],
      [2.28, 0.95, 0.28],
      [2.04, 0.85, 0.62],
      [1.65, 0.76, 0.79],
    ],
    0.045,
    false,
    "toe-protection",
  );
  if (detail)
    for (let i = 0; i < 14; i++)
      for (let side of [-1, 1]) {
        const x = 0.5 + i * 0.105;
        ellipsoid(
          upper,
          p.dark,
          [x, 0.77 + (1 - (x - 0.5) / 1.5) * 0.19, side * widthAt(x) * 0.9],
          [0.02, 0.014, 0.018],
          "mesh-perforation",
        );
      }
  const tongueBadge = box(
    upper,
    p.accent,
    [0.18, 0.025, 0.27],
    [-0.6, 1.58, 0],
    "tongue-badge",
  );
  tongueBadge.rotation.z = -0.3;
  const callouts: Callout[] = [
    {
      label: "Upper, tongue & laces — hold the foot",
      anchor: anchor(upper, [0.1, 1.46, 0.24], "upper-anchor"),
      side: "left",
      slot: 0,
    },
    {
      label: "Heel counter & collar — locate the heel",
      anchor: anchor(upper, [-1.9, 1.5, 0.4], "collar-anchor"),
      side: "right",
      slot: 0,
    },
    {
      label: "Sockliner — directly below the foot",
      anchor: anchor(insole, [0.8, 0.73, 0.62], "sockliner-anchor"),
      side: "right",
      slot: 1,
    },
    {
      label: "Strobel layer — joins upper to sole",
      anchor: anchor(board, [1.2, 0.63, 0.65], "board-anchor"),
      side: "left",
      slot: 1,
    },
    {
      label:
        variant === 2
          ? "Graded gyroid midsole — cellular cushion concept"
          : "Gyroid midsole — cellular cushion concept",
      anchor: anchor(midsole, [1.2, 0.36, 0.7], "midsole-anchor"),
      side: "right",
      slot: 2,
    },
    {
      label: "Rubber outsole & tread — contact the ground",
      anchor: anchor(outsole, [1.5, 0.08, 0.7], "outsole-anchor"),
      side: "left",
      slot: 2,
    },
  ];
  return {
    group,
    callouts,
    supportHeight,
    update: (e: number, load: number) => {
      const compression = 1 - load * 0.1;
      midsole.scale.y = compression;
      midsole.position.y = e * 0.47;
      board.position.y = e * 0.94 - load * 0.045;
      insole.position.y = e * 1.37 - load * 0.045;
      upper.position.y = e * 1.92 - load * 0.045;
    },
  };
}
