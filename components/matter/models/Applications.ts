import * as T from "three";
import {
  materials,
  mesh,
  ellipsoid,
  tube,
  rod,
  box,
  surface,
  solidOutline,
  anchor,
  fitLattice,
  warpLattice,
  Callout,
} from "./primitives";
import { buildShoe } from "./Shoe";
import { buildAthlete } from "./Athlete";
import { buildHelmet } from "./Helmet";
import { buildKneeBrace } from "./KneeBrace";
export type Application = {
  group: T.Group;
  callouts: Callout[];
  camera: number[];
  target: number[];
  update: (t: number, e: number) => string;
};
export function createApplication(
  kind: string,
  variant: number,
  lattice: T.Group,
  color: string,
  count = 3,
  thickness = 0.8,
): Application {
  const group = new T.Group();
  group.name = `application-${kind}`;
  const p = materials();
  p.accent.color.set(color);
  p.ivory.side = T.DoubleSide;
  p.textile.side = T.DoubleSide;
  const callouts: Callout[] = [];
  let camera = [8, 4.5, 10],
    target = [0, 0, 0];
  let update = (t: number, e: number) => "Illustrative motion";
  const label = (
    name: string,
    parent: T.Object3D,
    pos: number[],
    side: "left" | "right",
    slot: number,
  ) =>
    callouts.push({
      label: name,
      anchor: anchor(parent, pos, name),
      side,
      slot,
    });
  if (kind === "gyroid") {
    const shoe = buildShoe(lattice, color, variant, true);
    shoe.group.position.set(-1, -1.5, 0.5);
    shoe.group.rotation.y = -0.12;
    shoe.group.scale.setScalar(0.9);
    group.add(shoe.group);
    callouts.push(...shoe.callouts);
    const runner = buildAthlete(color);
    runner.group.position.set(2.55, -2.405, -0.55);
    runner.group.scale.setScalar(1.23);
    group.add(runner.group);
    const lane = box(
      group,
      p.dark,
      [2.5, 0.05, 1.25],
      [2.6, -2.43, -0.55],
      "running-lane",
    );
    const marks: T.Mesh[] = [];
    for (let i = 0; i < 5; i++)
      marks.push(
        box(
          group,
          p.ivory,
          [0.24, 0.008, 0.035],
          [1.5 + i * 0.5, -2.397, 0.06],
          "track-mark",
        ),
      );
    camera = [8.7, 4.3, 11.7];
    target = [0.4, -0.25, 0];
    update = (t, e) => {
      const gait = runner.update(t);
      shoe.update(e, gait.load);
      marks.forEach(
        (m, i) =>
          (m.position.x =
            1.45 +
            ((((i * 0.5 - t * (1.28 / 0.36) * 1.23) % 2.5) + 2.5) % 2.5)),
      );
      return e > 0.15
        ? "Exploded shoe anatomy · " + gait.phase
        : gait.phase + " · gyroid loading";
    };
  } else if (kind === "octet") {
    const plane = new T.Group();
    group.add(plane);
    plane.rotation.y = -0.25;
    plane.position.y = -0.15;
    ellipsoid(
      plane,
      p.ivory,
      [0, 0, 0],
      [3.15, 0.43, 0.46],
      "aircraft-fuselage",
    );
    ellipsoid(plane, p.dark, [1.9, 0.23, 0], [0.63, 0.24, 0.36], "cockpit");
    for (let side of [-1, 1])
      for (let i = 0; i < 7; i++)
        ellipsoid(
          plane,
          p.dark,
          [1.15 - i * 0.42, 0.19, side * 0.417],
          [0.095, 0.075, 0.025],
          "cabin-window",
        );
    const wingPart = (z0: number, z1: number, top: boolean) =>
      surface(
        plane,
        p.ivory,
        22,
        12,
        (u, v) => {
          const z = z0 + u * (z1 - z0),
            span = Math.abs(z),
            chord = 2.2 - span * 0.25;
          return [
            0.7 + span * 0.13 - v * chord,
            (top ? 1 : -1) * Math.sin(Math.PI * v) * 0.14 + span * 0.035,
            z,
          ];
        },
        "tapered-airfoil",
      );
    wingPart(-4.1, 0.8, true);
    wingPart(2.55, 4.1, true);
    wingPart(-4.1, 4.1, false);
    const core = fitLattice(
      lattice,
      [1.45, 0.24, 1.65],
      [-0.12, 0.075, 1.68],
      plane,
    );
    // A displaced inspection skin has an airfoil outline, not a rectangular platen.
    const access = surface(
      plane,
      p.textile,
      12,
      12,
      (u, v) => {
        const z = 0.8 + u * 1.75;
        return [
          0.7 + z * 0.13 - v * (2.2 - z * 0.25),
          0.14 * Math.sin(v * Math.PI) + z * 0.035,
          z,
        ];
      },
      "wing-access-skin",
    );
    for (let side of [-1, 1]) {
      surface(
        plane,
        p.ivory,
        6,
        6,
        (u, v) => [
          -1.85 - u * 0.78 - v * (0.92 - u * 0.47),
          0.15 + u * 0.1 + Math.sin(v * Math.PI) * 0.045,
          side * (0.25 + u * 1.35),
        ],
        "horizontal-tail",
      );
      surface(
        plane,
        p.accent,
        6,
        6,
        (u, v) => [
          -1.84 - u * 0.82 - v * (1.02 - u * 0.65),
          0.23 + u * 1.2,
          side * (0.07 - u * 0.045) * Math.sin(v * Math.PI),
        ],
        "tail-fin",
      );
      const nacelle = mesh(
        new T.CylinderGeometry(0.3, 0.34, 1.15, 28),
        p.metal,
        plane,
        "engine-nacelle",
      );
      nacelle.rotation.z = Math.PI / 2;
      nacelle.position.set(0.45, -0.48, side * 1.42);
      const inlet = mesh(
        new T.TorusGeometry(0.27, 0.045, 8, 28),
        p.dark,
        plane,
        "engine-inlet",
      );
      inlet.rotation.y = Math.PI / 2;
      inlet.position.set(1.03, -0.48, side * 1.42);
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4;
        rod(
          plane,
          p.dark,
          [1.045, -0.48, side * 1.42],
          [1.045, -0.48 + Math.sin(a) * 0.22, side * 1.42 + Math.cos(a) * 0.22],
          0.019,
        );
      }
      tube(
        plane,
        p.accent,
        [
          [-2.5, -0.12, side * 0.22],
          [-1.3, -0.12, side * 0.42],
          [1.8, -0.12, side * 0.33],
        ],
        0.022,
        false,
        "fuselage-stripe",
      );
    }
    label("Wing skin — keeps the airfoil shape", access, [0.2, 0.5, 1.6], "left", 0);
    label("Octet core — separates & supports the skins", core, [0, 0, 0], "right", 1);
    label("Engine mount area — transfers concentrated loads", plane, [0.45, -0.45, 1.42], "left", 2);
    label("Airframe — shown for context", plane, [-1.1, 0.36, 0], "right", 0);
    camera = [8.2, 5.2, 11.5];
    target = [0, 0, 0];
    update = (t, e) => {
      plane.rotation.z = Math.sin(t * 0.75) * 0.055;
      plane.rotation.x = Math.sin(t * 0.55) * 0.025;
      access.position.y = e * 0.9;
      return "Aircraft wing · internal load path";
    };
  } else if (kind === "auxetic") {
    return buildKneeBrace(lattice, color, variant);
  } else if (kind === "kelvin") {
    return buildHelmet(lattice, color);
  } else if (kind === "honeycomb") {
    const board = new T.Group();
    group.add(board);
    board.position.y = -0.6;
    board.rotation.y = -0.22;
    const shape = new T.Shape();
    shape.moveTo(-3.25, 0);
    shape.bezierCurveTo(-3.25, -0.78, -2.7, -0.8, 0, -0.76);
    shape.bezierCurveTo(2.7, -0.8, 3.25, -0.78, 3.25, 0);
    shape.bezierCurveTo(3.25, 0.78, 2.7, 0.8, 0, 0.76);
    shape.bezierCurveTo(-2.7, 0.8, -3.25, 0.78, -3.25, 0);
    const lower = solidOutline(
      board,
      p.textile,
      shape,
      0.095,
      0.0,
      "bottom-deck-skin",
    );
    lattice.traverse((o) => {
      if (o instanceof T.Mesh) {
        p.accent.wireframe = (o.material as T.MeshStandardMaterial).wireframe;
        o.geometry.dispose();
      }
    });
    lattice.removeFromParent();
    const core = new T.Group();
    board.add(core);
    core.position.y = 0.24;
    const cols = count * 4,
      rad = 5.5 / (cols * 1.5 + 0.5),
      pitch = Math.sqrt(3) * rad * (variant === 1 ? 1.2 : 1),
      rows = Math.max(2, Math.round(1.25 / pitch));
    const walls: { a: T.Vector3; b: T.Vector3 }[] = [];
    const keys = new Set<string>();
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const cx = (i - (cols - 1) / 2) * rad * 1.5,
          cz =
            (j - (rows - 1) / 2) * pitch + (i % 2) * pitch * 0.5 - pitch * 0.25;
        const points = Array.from(
          { length: 6 },
          (_, k) =>
            new T.Vector3(
              cx + Math.cos((k * Math.PI) / 3) * rad,
              0,
              cz +
                Math.sin((k * Math.PI) / 3) * rad * (variant === 1 ? 1.2 : 1),
            ),
        );
        for (let k = 0; k < 6; k++) {
          const a = points[k],
            b = points[(k + 1) % 6];
          const key = [
            a
              .toArray()
              .map((x) => x.toFixed(4))
              .join(","),
            b
              .toArray()
              .map((x) => x.toFixed(4))
              .join(","),
          ]
            .sort()
            .join("|");
          if (!keys.has(key)) {
            keys.add(key);
            walls.push({ a, b });
          }
        }
      }
    const cells = new T.InstancedMesh(
      new T.BoxGeometry(1, 0.25, 1),
      p.accent,
      walls.length,
    );
    const tmp = new T.Object3D();
    walls.forEach(({ a, b }, i) => {
      tmp.position.copy(a).add(b).multiplyScalar(0.5);
      tmp.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      tmp.scale.set(
        a.distanceTo(b),
        1,
        0.013 *
          (thickness / 0.8) *
          (variant === 2 ? 1 + (0.3 * tmp.position.x) / 3 : 1),
      );
      tmp.updateMatrix();
      cells.setMatrixAt(i, tmp.matrix);
    });
    cells.castShadow = true;
    cells.receiveShadow = true;
    core.add(cells);
    const grip = new T.Group();
    board.add(grip);
    const top = solidOutline(
      grip,
      p.dark,
      shape,
      0.075,
      0.405,
      "grip-tape-deck",
    );
    const atr = top.geometry.attributes.position;
    for (let i = 0; i < atr.count; i++)
      atr.setY(
        i,
        atr.getY(i) + Math.max(0, Math.abs(atr.getX(i)) - 2.35) ** 2 * 0.35,
      );
    top.geometry.computeVertexNormals();
    const wheels: T.Group[] = [];
    for (let x of [-2.1, 2.1]) {
      box(board, p.metal, [0.47, 0.1, 0.5], [x, -0.1, 0], "truck-base");
      rod(
        board,
        p.metal,
        [x, -0.14, 0],
        [x + 0.12, -0.38, 0],
        0.12,
        "truck-hanger",
      );
      rod(board, p.metal, [x, -0.38, -0.83], [x, -0.38, 0.83], 0.065, "axle");
      for (let side of [-1, 1]) {
        const wheel = new T.Group();
        board.add(wheel);
        wheel.position.set(x, -0.4, side * 0.86);
        const rubber = mesh(
          new T.CylinderGeometry(0.29, 0.29, 0.25, 24),
          p.ivory,
          wheel,
          "urethane-wheel",
        );
        rubber.rotation.x = Math.PI / 2;
        const hub = mesh(
          new T.CylinderGeometry(0.11, 0.11, 0.27, 20),
          p.metal,
          wheel,
          "wheel-bearing",
        );
        hub.rotation.x = Math.PI / 2;
        wheels.push(wheel);
        for (let z of [-0.24, 0.24])
          ellipsoid(
            grip,
            p.metal,
            [x, 0.5, z],
            [0.04, 0.012, 0.04],
            "truck-bolt",
          );
      }
    }
    tube(
      grip,
      p.accent,
      [
        [-2.7, 0.57, -0.12],
        [-1.5, 0.49, -0.12],
        [1.6, 0.49, -0.12],
        [2.7, 0.57, -0.12],
      ],
      0.02,
      false,
      "deck-stripe",
    );
    label("Grip tape & upper skin — rider contact", grip, [0.8, 0.48, 0.6], "left", 0);
    label("Honeycomb core — keeps the skins apart", core, [0, 0, 0], "right", 1);
    label("Trucks & axles — transfer load to wheels", board, [2.1, -0.35, 0.2], "left", 2);
    label("Polyurethane wheels — rolling contact", board, [2.1, -0.4, 0.85], "right", 2);
    camera = [7.6, 4.9, 10];
    target = [0, 0, 0];
    update = (t, e) => {
      grip.position.y = e * 1.2;
      board.rotation.z = Math.sin(t * 1.7) * 0.045;
      wheels.forEach((w) => (w.rotation.z = -t * 4));
      return "Rolling deck · cellular core revealed";
    };
  } else {
    const system = new T.Group();
    group.add(system);
    system.position.y = -0.15;
    const motor = new T.Group();
    system.add(motor);
    motor.position.y = 0.63;
    const body = mesh(
      new T.CylinderGeometry(0.62, 0.62, 2.2, 32),
      p.textile,
      motor,
      "electric-motor-body",
    );
    body.rotation.z = Math.PI / 2;
    for (let x = -0.9; x < 1.05; x += 0.18) {
      const fin = mesh(
        new T.TorusGeometry(0.61, 0.035, 6, 28),
        p.metal,
        motor,
        "cooling-fin",
      );
      fin.rotation.y = Math.PI / 2;
      fin.position.x = x;
    }
    const end = mesh(
      new T.CylinderGeometry(0.66, 0.66, 0.2, 28),
      p.dark,
      motor,
      "fan-housing",
    );
    end.rotation.z = Math.PI / 2;
    end.position.x = -1.18;
    const rotor = new T.Group();
    motor.add(rotor);
    rotor.position.x = 1.25;
    const pulley = mesh(
      new T.CylinderGeometry(0.43, 0.43, 0.23, 28),
      p.metal,
      rotor,
      "drive-pulley",
    );
    pulley.rotation.z = Math.PI / 2;
    rod(rotor, p.metal, [-0.2, 0, 0], [0.45, 0, 0], 0.12, "drive-shaft");
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ellipsoid(
        rotor,
        p.dark,
        [0.13, Math.sin(a) * 0.28, Math.cos(a) * 0.28],
        [0.02, 0.055, 0.055],
        "pulley-vent",
      );
    }
    box(motor, p.dark, [0.8, 0.38, 0.7], [0, 0.72, 0], "terminal-box");
    box(motor, p.accent, [0.62, 0.025, 0.48], [0, 0.925, 0], "terminal-cover");
    tube(
      motor,
      p.rubber,
      [
        [0, 0.9, -0.35],
        [-0.3, 0.7, -0.65],
        [-1.4, -0.3, -0.7],
      ],
      0.035,
      false,
      "power-cable",
    );
    for (let x of [-0.68, 0.68])
      box(motor, p.metal, [0.4, 0.12, 1.1], [x, -0.61, 0], "motor-foot");
    box(
      motor,
      p.metal,
      [3.0, 0.14, 1.65],
      [0, -0.67, 0],
      "load-transfer-platform",
    );
    const core = fitLattice(lattice, [3.0, 0.8, 1.65], [0, -0.58, 0], system);
    box(system, p.dark, [3.4, 0.13, 2.0], [0, -1.08, 0], "mounting-skid");
    for (let x of [-1.48, 1.48])
      for (let z of [-0.83, 0.83])
        ellipsoid(
          system,
          p.metal,
          [x, -0.985, z],
          [0.09, 0.035, 0.09],
          "anchor-bolt",
        );
    label("Motor — source of rotation & vibration", motor, [0.2, 0.67, 0.2], "left", 0);
    label("Resonator frame — carries the machine load", core, [0, 0, 0], "right", 1);
    label("Internal masses — move near tuned frequencies", core, [0.6, 0, 0.5], "left", 2);
    label("Mounting skid — anchors the assembly", system, [1.4, -1, 0.82], "right", 2);
    camera = [7.3, 4.3, 9.4];
    target = [0, 0.05, 0];
    update = (t, e) => {
      motor.position.y = 0.63 + e * 0.65 + Math.sin(t * 12) * 0.045;
      rotor.rotation.x = t * 8;
      lattice.traverse((o) => {
        if (o.userData.resonator) {
          const dy = Math.sin(t * 12 + o.userData.phase) * 0.13;
          o.position.y = o.userData.restY + dy;
          o.userData.spring.scale.y = 1 + dy / 0.58;
        }
      });
      return "Motor excitation · relative mass response";
    };
  }
  return { group, callouts, camera, target, update };
}
