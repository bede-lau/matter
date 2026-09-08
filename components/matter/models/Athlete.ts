import * as T from "three";
import { materials, mesh, ellipsoid, tube, box } from "./primitives";
import { buildShoe } from "./Shoe";
function limb(parent: T.Object3D, mat: T.Material, radii: number[]) {
  const pts = radii.map((r, i) => new T.Vector2(r, i / (radii.length - 1)));
  return mesh(new T.LatheGeometry(pts, 16), mat, parent);
}
function between(o: T.Mesh, a: T.Vector3, b: T.Vector3) {
  o.position.copy(a);
  o.scale.y = a.distanceTo(b);
  o.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    b.clone().sub(a).normalize(),
  );
}
/** A two-link leg solver keeps the sole on the floor during stance. */
export function kneeFor(
  hip: T.Vector3,
  ankle: T.Vector3,
  l1 = 0.76,
  l2 = 0.74,
) {
  const delta = ankle.clone().sub(hip),
    distance = Math.min(delta.length(), l1 + l2 - 0.001);
  const dir = delta.normalize();
  const along = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  return hip
    .clone()
    .addScaledVector(dir, along)
    .addScaledVector(new T.Vector3(-dir.y, dir.x, 0), bend);
}
export function buildAthlete(accent: string) {
  const group = new T.Group();
  group.name = "runner";
  const p = materials();
  p.accent.color.set(accent);
  p.dark.color.set("#233742");
  const jersey = new T.MeshStandardMaterial({
    color: "#cad5dc",
    roughness: 0.96,
  });
  const body = new T.Group();
  group.add(body);
  ellipsoid(body, p.dark, [0, 1.5, 0], [0.22, 0.23, 0.29], "shorts-pelvis");
  // Contoured torso: waist, abdomen, chest and shoulders rather than a cylinder.
  const profile = [
    [1.57, 0.16, 0.23],
    [1.72, 0.17, 0.22],
    [1.93, 0.21, 0.28],
    [2.12, 0.19, 0.35],
    [2.22, 0.14, 0.28],
  ];
  const verts: number[] = [],
    ix: number[] = [];
  for (let y = 0; y < profile.length; y++)
    for (let j = 0; j <= 24; j++) {
      const a = (j / 24) * Math.PI * 2,
        [height, depth, width] = profile[y];
      verts.push(
        (height - 1.5) * 0.15 + Math.cos(a) * depth,
        height,
        Math.sin(a) * width,
      );
    }
  for (let i = 0; i < profile.length - 1; i++)
    for (let j = 0; j < 24; j++) {
      const a = i * 25 + j;
      ix.push(a, a + 25, a + 1, a + 25, a + 26, a + 1);
    }
  const torso = new T.BufferGeometry();
  torso.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
  torso.setIndex(ix);
  torso.computeVertexNormals();
  mesh(torso, jersey, body, "running-jersey");
  ellipsoid(body, p.skin, [0.1, 2.3, 0], [0.1, 0.17, 0.1], "neck");
  const head = new T.Group();
  body.add(head);
  head.position.set(0.15, 2.58, 0);
  head.rotation.z = -0.08;
  ellipsoid(head, p.skin, [0, 0, 0], [0.205, 0.25, 0.185], "head");
  ellipsoid(head, p.skin, [0.07, -0.12, 0], [0.14, 0.12, 0.14], "jaw");
  ellipsoid(head, p.skin, [0.2, -0.015, 0], [0.065, 0.055, 0.052], "nose");
  for (let side of [-1, 1]) {
    ellipsoid(
      head,
      p.skin,
      [-0.025, -0.02, side * 0.184],
      [0.045, 0.075, 0.026],
      "ear",
    );
    ellipsoid(
      head,
      p.rubber,
      [0.174, 0.055, side * 0.079],
      [0.017, 0.014, 0.016],
      "eye",
    );
    tube(
      head,
      p.dark,
      [
        [0.15, 0.091, side * 0.057],
        [0.18, 0.089, side * 0.085],
        [0.159, 0.077, side * 0.11],
      ],
      0.011,
      false,
      "brow",
    );
  }
  tube(
    head,
    p.rubber,
    [
      [0.188, -0.12, -0.055],
      [0.198, -0.125, 0],
      [0.188, -0.12, 0.055],
    ],
    0.008,
    false,
    "mouth",
  );
  const hair = mesh(
    new T.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.53),
    p.rubber,
    head,
    "hair",
  );
  hair.scale.set(0.214, 0.26, 0.195);
  hair.position.set(-0.015, 0.035, 0);
  const legs: {
    side: number;
    thigh: T.Mesh;
    shorts: T.Mesh;
    shin: T.Mesh;
    knee: T.Mesh;
    sock: T.Mesh;
    shoe: ReturnType<typeof buildShoe>;
    shoulder: T.Mesh;
    upperArm: T.Mesh;
    forearm: T.Mesh;
    elbow: T.Mesh;
    hand: T.Mesh;
  }[] = [];
  for (let side of [-1, 1]) {
    const thigh = limb(group, p.skin, [0.13, 0.145, 0.125, 0.095, 0.083]),
      shorts = limb(group, p.dark, [0.16, 0.175, 0.155, 0.14]),
      shin = limb(group, p.skin, [0.08, 0.105, 0.08, 0.048, 0.05]);
    const knee = ellipsoid(
      group,
      p.skin,
      [0, 0, 0],
      [0.086, 0.09, 0.082],
      "knee",
    );
    const sock = limb(group, jersey, [0.052, 0.055, 0.052]);
    const shoe = buildShoe(null, accent, 0, false);
    group.add(shoe.group);
    shoe.group.scale.set(0.12, 0.12, 0.12);
    const shoulder = ellipsoid(
      body,
      jersey,
      [0.09, 2.15, side * 0.3],
      [0.145, 0.16, 0.145],
      "shoulder",
    );
    const upperArm = limb(group, p.skin, [0.08, 0.077, 0.058]),
      forearm = limb(group, p.skin, [0.061, 0.072, 0.043]);
    const elbow = ellipsoid(
      group,
      p.skin,
      [0, 0, 0],
      [0.065, 0.067, 0.061],
      "elbow",
    );
    const hand = ellipsoid(
      group,
      p.skin,
      [0, 0, 0],
      [0.1, 0.057, 0.047],
      "relaxed-hand",
    );
    legs.push({
      side,
      thigh,
      shorts,
      shin,
      knee,
      sock,
      shoe,
      shoulder,
      upperArm,
      forearm,
      elbow,
      hand,
    });
  }
  const update = (time: number) => {
    const cycle = time * 1.28;
    const flight =
      0.015 + (0.065 * (1 + Math.cos((cycle - 0.43) * Math.PI * 4))) / 2;
    body.position.y = flight;
    for (let i = 0; i < legs.length; i++) {
      const l = legs[i],
        phase = (cycle + i * 0.5) % 1;
      let x: number, y: number, angle: number;
      // Stance consumes 36% of each leg cycle; the gap creates a flight interval.
      if (phase < 0.36) {
        const u = phase / 0.36;
        x = 0.5 - u;
        angle = u > 0.7 ? (-(u - 0.7) / 0.3) * 0.3 : 0;
        y = l.shoe.supportHeight(angle);
      } else {
        const u = (phase - 0.36) / 0.64;
        const m = -0.64 / 0.36;
        x =
          -0.5 +
          (3 * u * u - 2 * u * u * u) +
          m * (2 * u * u * u - 3 * u * u + u);
        angle = -0.3 * (1 - u) - 0.55 * Math.sin(Math.PI * u);
        y =
          l.shoe.supportHeight(angle) +
          Math.pow(Math.sin(Math.PI * u), 1.7) * 0.73;
      }
      l.shoe.group.position.set(x + 0.05, y, l.side * 0.17);
      l.shoe.group.rotation.z = angle;
      const collar = new T.Vector3(-0.16, 0.19, 0).applyAxisAngle(
        new T.Vector3(0, 0, 1),
        angle,
      );
      const hip = new T.Vector3(0, 1.5 + flight, l.side * 0.17),
        ankle = l.shoe.group.position.clone().add(collar),
        knee = kneeFor(hip, ankle);
      between(l.thigh, hip, knee);
      between(l.shorts, hip, hip.clone().lerp(knee, 0.49));
      between(l.shin, knee, ankle);
      l.knee.position.copy(knee);
      between(l.sock, ankle.clone(), ankle.clone().lerp(knee, 0.2));
      const armPhase = cycle * Math.PI * 2 + i * Math.PI;
      const shoulder = new T.Vector3(0.08, 2.15 + flight, l.side * 0.32);
      const upperAngle = -0.2 - x * 1.1,
        lowerAngle = 0.12 - x * 0.3;
      const elbow = shoulder
        .clone()
        .add(
          new T.Vector3(
            Math.sin(upperAngle),
            -Math.cos(upperAngle),
            l.side * 0.06,
          )
            .normalize()
            .multiplyScalar(0.44),
        );
      const wrist = elbow
        .clone()
        .add(
          new T.Vector3(
            Math.cos(lowerAngle),
            Math.sin(lowerAngle),
            0,
          ).multiplyScalar(0.32),
        );
      between(l.upperArm, shoulder, elbow);
      between(l.forearm, elbow, wrist);
      l.upperArm.name = "upper-arm";
      l.forearm.name = "forearm";
      l.elbow.position.copy(elbow);
      l.hand.position.copy(wrist).add(new T.Vector3(0.05, 0, 0));
      l.hand.rotation.z = Math.sin(armPhase) * 0.25;
    }
    return {
      phase:
        cycle % 1 < 0.36
          ? "Contact + loading"
          : cycle % 1 < 0.5
            ? "Flight"
            : cycle % 1 < 0.86
              ? "Opposite-foot contact"
              : "Flight",
      load:
        Math.max(0, Math.sin(((cycle % 1) / 0.36) * Math.PI)) *
        (cycle % 1 < 0.36 ? 1 : 0),
    };
  };
  update(0.12);
  return { group, update };
}
