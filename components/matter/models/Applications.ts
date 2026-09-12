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
  // Explanatory fields are never physical parts of the product. Keeping their
  // material independent prevents a material selector from recolouring light,
  // heat, or magnetic field lines into opaque solids.
  const fieldMaterial = (color: string, opacity = 0.68) =>
    new T.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: T.AdditiveBlending,
    });
  const fieldTube = (
    parent: T.Object3D,
    material: T.Material,
    points: number[][],
    radius = 0.018,
    name = "explanatory-field",
  ) => {
    const line = tube(parent, material, points, radius, false, name);
    line.castShadow = false;
    line.receiveShadow = false;
    return line;
  };
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
    label("Wing skin: keeps the airfoil shape", access, [0.2, 0.5, 1.6], "left", 0);
    label("Octet core: separates & supports the skins", core, [0, 0, 0], "right", 1);
    label("Engine mount area: transfers concentrated loads", plane, [0.45, -0.45, 1.42], "left", 2);
    label("Airframe: shown for context", plane, [-1.1, 0.36, 0], "right", 0);
    camera = [8.2, 5.2, 11.5];
    target = [0, 0, 0];
    update = (t, e) => {
      plane.rotation.z = Math.sin(t * 0.75) * 0.055;
      plane.rotation.x = Math.sin(t * 0.55) * 0.025;
      access.position.y = e * 0.9;
      return "Aircraft wing · internal load path";
    };
  } else if (kind === "metalens") {
    // The post field is mounted upright, perpendicular to the optical axis.
    // Its enlarged posts remain physically attached to a thin wafer.
    const optic = fitLattice(lattice, [2.45, 0.2, 2.45], [0, 0.2, 0], group);
    optic.rotation.z = Math.PI / 2;
    const bench = box(group, p.dark, [5.9, 0.14, 3.2], [0, -1.05, 0], "optics-bench");
    const mount = mesh(new T.TorusGeometry(1.32, 0.055, 8, 42), p.metal, group, "wafer-mount");
    mount.rotation.y = Math.PI / 2;
    mount.position.set(0, 0.2, 0);
    const source = box(group, p.dark, [0.46, 0.52, 0.72], [-2.52, 0.2, 0], "collimated-light-source");
    const aperture = mesh(new T.CylinderGeometry(0.12, 0.12, 0.035, 24), p.ivory, group, "source-aperture");
    aperture.rotation.z = Math.PI / 2;
    aperture.position.set(-2.27, 0.2, 0);
    const sensor = box(group, p.dark, [0.26, 0.72, 0.82], [2.15, 0.2, 0], "image-sensor");
    const sensorFace = mesh(new T.PlaneGeometry(0.56, 0.56), p.accent, group, "sensor-active-area");
    sensorFace.rotation.y = -Math.PI / 2;
    sensorFace.position.set(2.005, 0.2, 0);
    const focus = ellipsoid(group, fieldMaterial("#72dcff", 0.88), [1.84, 0.2, 0], [0.055, 0.055, 0.055], "focal-spot");
    focus.castShadow = false;
    const light = fieldMaterial("#72dcff", 0.68);
    const rays: T.Mesh[] = [];
    for (let i = -2; i <= 2; i++) {
      const z = i * 0.43;
      rays.push(
        fieldTube(
          group,
          light,
          [
            [-2.23, 0.2, z],
            [-0.16, 0.2, z],
            [0.7, 0.2, z * 0.48],
            [1.84, 0.2, 0],
          ],
          0.016,
          "focused-light-ray",
        ),
      );
    }
    label("Nanopost field: shapes the light phase", optic, [0, 0, 0], "left", 0);
    label("Collimated source: sends parallel light", source, [0, 0, 0], "left", 1);
    label("Focal spot: light meets here", focus, [0, 0, 0], "right", 0);
    label("Image sensor: records the focused light", sensor, [0, 0, 0], "right", 1);
    camera = [7.2, 4.1, 9.3];
    target = [0, -0.15, 0];
    const focusScale = focus.scale.clone();
    update = (t, e) => {
      const pulse = 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(t * 5));
      rays.forEach((ray, i) => (ray.position.y = Math.sin(t * 2 + i) * 0.01));
      focus.scale.copy(focusScale).multiplyScalar(pulse);
      return e > 0.15 ? "Wafer opened · phase path" : "Light focused · wavefront shaped";
    };
  } else if (kind === "cloak") {
    const shell = fitLattice(lattice, [3.45, 0.55, 3.45], [0, 0.03, 0], group);
    const hidden = mesh(new T.CylinderGeometry(0.43, 0.43, 0.64, 32), p.dark, group, "hidden-test-cylinder");
    hidden.position.y = 0.27;
    const floor = box(group, p.dark, [6.1, 0.13, 3.85], [0, -0.58, 0], "cloak-test-surface");
    const waves = fieldMaterial("#68d7ff", 0.68);
    const rays: T.Mesh[] = [];
    for (let i = -3; i <= 3; i++) {
      const z = i * 0.28;
      const bypass = Math.max(0.16, 0.62 - Math.abs(z) * 0.35);
      rays.push(
        fieldTube(
          group,
          waves,
          [
            [-3.05, 0.34, z],
            [-1.48, 0.34, z],
            [-0.72, 0.34 + bypass, z],
            [0, 0.34 + bypass * 1.18, z],
            [0.72, 0.34 + bypass, z],
            [1.48, 0.34, z],
            [3.05, 0.34, z],
          ],
          0.016,
          "microwave-field-line",
        ),
      );
    }
    label("Segmented shell: redirects the microwave path", shell, [0.86, 0.04, 0.62], "left", 0);
    label("Incoming field: straight before the shell", rays[0], [-1.7, 0, 0], "left", 1);
    label("Hidden object: scattering is reduced at one frequency", hidden, [0, 0.2, 0], "right", 0);
    label("Outgoing field: nearly parallel again", rays[6], [1.7, 0, 0], "right", 1);
    camera = [7.5, 4.5, 9.8];
    target = [0, -0.1, 0];
    update = (t, e) => {
      rays.forEach((ray, i) => (ray.position.z = Math.sin(t * 2.2 + i) * 0.012));
      return e > 0.15 ? "Shell opened · microwave route" : "Cloak present · rays rejoin after the object";
    };
  } else if (kind === "membrane-absorber") {
    const panel = fitLattice(lattice, [3.35, 0.44, 2.45], [0.34, 0.02, 0], group);
    panel.rotation.z = Math.PI / 2;
    const panelFrame = box(group, p.dark, [0.16, 3.45, 2.85], [0.31, 0, 0], "acoustic-panel-frame");
    const speaker = mesh(new T.CylinderGeometry(0.46, 0.46, 0.46, 28), p.dark, group, "speaker-cabinet");
    speaker.rotation.z = Math.PI / 2;
    speaker.position.set(-2.25, 0, 0);
    const speakerCone = mesh(new T.CylinderGeometry(0.29, 0.19, 0.06, 28), p.metal, group, "speaker-cone");
    speakerCone.rotation.z = Math.PI / 2;
    speakerCone.position.set(-1.99, 0, 0);
    const pressureRings: T.Mesh[] = [];
    const sound = fieldMaterial("#81cdf4", 0.38);
    for (let i = 0; i < 4; i++) {
      const ring = mesh(new T.TorusGeometry(0.34, 0.014, 8, 32), sound, group, "pressure-wave");
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-1.74 + i * 0.38, 0, 0);
      ring.castShadow = false;
      ring.receiveShadow = false;
      pressureRings.push(ring);
    }
    label("Membrane cells: flex at a selected tone", panel, [0, 0, 0], "left", 0);
    label("Speaker: sends a low-frequency pulse", speaker, [0, 0, 0], "left", 1);
    label("Bonded platelets: add a local mass", panel, [0, 0.03, 0.3], "right", 0);
    label("Panel frame: holds the recessed drums", panelFrame, [0, 0.7, 1.1], "right", 1);
    camera = [7.7, 4.0, 9.7];
    target = [0, -0.1, 0];
    update = (t, e) => {
      pressureRings.forEach((ring, i) => {
        const scale = ((t * 1.1 + i * 0.22) % 1) * 1.2 + 0.25;
        ring.scale.setScalar(scale);
        ring.position.x = -1.76 + scale * 1.26;
        (ring.material as T.MeshBasicMaterial).opacity = 0.42 - scale * 0.16;
      });
      return e > 0.15 ? "Panel opened · membrane motion" : "Resonant absorption · selected low tone";
    };
  } else if (kind === "thermal-cloak") {
    // Seat the annular composite directly on the plate. All thermal guides
    // share this surface height so the model reads as one manufactured part.
    const shield = fitLattice(lattice, [3.3, 0.34, 3.3], [0, -0.45, 0], group);
    box(group, p.dark, [5.9, 0.13, 3.2], [0, -0.72, 0], "thermal-plate");
    const heatSource = box(group, p.accent, [0.28, 0.23, 1.42], [-2.28, -0.54, 0], "heat-source");
    const coolSink = box(group, p.metal, [0.28, 0.23, 1.42], [2.28, -0.54, 0], "cool-boundary");
    const core = mesh(new T.CylinderGeometry(0.27, 0.27, 0.1, 28), p.ivory, group, "protected-core");
    core.position.set(0, -0.35, 0);
    const heat = fieldMaterial("#ffb266", 0.6);
    const heatDots: { dot: T.Mesh; base: T.Vector3 }[] = [];
    for (let z of [-0.82, -0.42, 0.42, 0.82])
      fieldTube(
        group,
        heat,
        [
          [-2.05, -0.30, z],
          [-0.95, -0.30, z],
          [-0.42, -0.30, z * 1.12],
          [0.42, -0.30, z * 1.12],
          [0.95, -0.30, z],
          [2.05, -0.30, z],
        ],
        0.014,
        "thermal-flow-path",
      );
    for (let i = 0; i < 9; i++) {
      const dot = ellipsoid(group, heat, [-1.7 + i * 0.4, -0.30, 0.72 * Math.sin(i * 1.4)], [0.045, 0.045, 0.045], "heat-flow-dot");
      dot.castShadow = false;
      heatDots.push({ dot, base: dot.scale.clone() });
    }
    label("Conductivity rings: guide heat around the core", shield, [0, 0, 0], "left", 0);
    label("Hot boundary: sends a short thermal pulse", heatSource, [0, 0, 0], "left", 1);
    label("Protected core: warms later", core, [0, 0, 0], "right", 0);
    label("Cool boundary: carries heat onward", coolSink, [0, 0, 0], "right", 1);
    camera = [7.5, 4.6, 9.2];
    target = [0, -0.4, 0];
    update = (t, e) => {
      const travel = (t * 0.46) % 1;
      heatDots.forEach(({ dot, base }, i) => {
        const phase = (travel + i / heatDots.length) % 1;
        dot.position.x = -1.8 + phase * 3.6;
        dot.position.y = -0.30;
        dot.position.z = 0.78 * Math.sin(phase * Math.PI * 2);
        dot.scale.copy(base).multiplyScalar(0.7 + 0.35 * Math.sin(phase * Math.PI));
      });
      return e > 0.15 ? "Layered plate · transient heat path" : "Heat diverted · core warms over time";
    };
  } else if (kind === "topological") {
    // The post bases meet the chip's top face at y = -0.75.
    const latticeHolder = fitLattice(lattice, [3.55, 0.65, 3.2], [0, -0.75, 0], group);
    box(group, p.dark, [5.8, 0.14, 3.4], [0, -0.82, 0], "photonic-chip");
    const inputPort = box(group, p.metal, [0.34, 0.16, 0.22], [-1.92, -0.67, -1.18], "waveguide-input");
    const signal = fieldMaterial("#66dbff", 0.75);
    const edgeRoute = fieldTube(
      group,
      signal,
      [
        [-1.75, -0.06, -1.18],
        [0.8, -0.06, -1.18],
        [0.8, -0.06, 1.18],
      ],
      0.028,
      "topological-edge-route",
    );
    const corner = anchor(group, [0.8, -0.06, -1.18], "edge-route-corner");
    const waveDots: { dot: T.Mesh; base: T.Vector3 }[] = [];
    for (let i = 0; i < 10; i++) {
      const dot = ellipsoid(group, signal, [-1.65 + i * 0.36, -0.06, -1.18], [0.052, 0.052, 0.052], "edge-mode-packet");
      dot.castShadow = false;
      waveDots.push({ dot, base: dot.scale.clone() });
    }
    label("Patterned bulk: blocks selected paths", latticeHolder, [-0.6, 0.26, 0.6], "left", 0);
    label("Input port: launches the signal", inputPort, [0, 0, 0], "left", 1);
    label("Edge route: carries the guided signal", edgeRoute, [0.8, -0.06, 0.15], "right", 0);
    label("Corner: the signal follows the boundary", corner, [0, 0, 0], "right", 1);
    camera = [7.6, 4.8, 9.6];
    target = [0, -0.4, 0];
    update = (t, e) => {
      waveDots.forEach(({ dot, base }, i) => {
        const phase = (t * 0.42 + i / waveDots.length) % 1;
        if (phase < 0.52) {
          dot.position.set(-1.75 + (phase / 0.52) * 2.55, -0.06, -1.18);
        } else {
          dot.position.set(0.8, -0.06, -1.18 + ((phase - 0.52) / 0.48) * 2.36);
        }
        dot.scale.copy(base).multiplyScalar(0.75 + 0.25 * Math.sin(phase * Math.PI * 2));
      });
      return e > 0.15 ? "Edge route opened · boundary test" : "Guided edge route · selected defects tolerated";
    };
  } else if (kind === "flux") {
    const shell = fitLattice(lattice, [3.7, 1.6, 2.6], [0, 0.02, 0], group);
    box(group, p.dark, [5.7, 0.13, 3.2], [0, -1.15, 0], "magnetic-test-bed");
    const coils = new T.Group();
    group.add(coils);
    for (let x of [-2.42, 2.42]) {
      const coil = mesh(new T.TorusGeometry(0.78, 0.07, 10, 42), p.metal, coils, "helmholtz-coil");
      coil.rotation.y = Math.PI / 2;
      coil.position.x = x;
    }
    const sensor = box(group, p.dark, [0.16, 0.16, 0.46], [0, 0.02, 0], "hall-sensor-chip");
    const contact = box(group, p.ivory, [0.07, 0.04, 0.62], [0, -0.08, 0], "sensor-contact");
    const fluxLines: T.Mesh[] = [];
    const magneticField = fieldMaterial("#70dbff", 0.58);
    for (let i = 0; i < 5; i++) {
      const z = (i - 2) * 0.3;
      fluxLines.push(
        fieldTube(
          group,
          magneticField,
          [[-3.0, 0.18, z], [-1.2, 0.18, z], [0, 0.18, z], [1.2, 0.18, z], [3.0, 0.18, z]],
          0.018,
          "straight-magnetic-field-line",
        ),
      );
    }
    label("Open funnels: guide the existing field inward", shell, [-0.9, 0.1, 0.55], "left", 0);
    label("Field coils: make a near-uniform background field", coils, [-2.42, 0, 0], "left", 1);
    label("Hall-sensor gap: reads the concentrated field", sensor, [0, 0, 0], "right", 0);
    label("Magnetic field lines: straight before and after the shell", fluxLines[2], [1.62, 0, 0], "right", 1);
    camera = [7.5, 4.6, 9.6];
    target = [0, -0.25, 0];
    update = (t, e) => {
      fluxLines.forEach((line, i) => {
        line.position.y = Math.sin(t * 1.7 + i * 0.45) * 0.01;
      });
      return e > 0.15 ? "Funnels opened · sensing gap" : "Static field lines · flux concentrated at the gap";
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
    label("Grip tape & upper skin: rider contact", grip, [0.8, 0.48, 0.6], "left", 0);
    label("Honeycomb core: keeps the skins apart", core, [0, 0, 0], "right", 1);
    label("Trucks & axles: transfer load to wheels", board, [2.1, -0.35, 0.2], "left", 2);
    label("Polyurethane wheels: rolling contact", board, [2.1, -0.4, 0.85], "right", 2);
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
    label("Motor: source of rotation & vibration", motor, [0.2, 0.67, 0.2], "left", 0);
    label("Resonator frame: carries the machine load", core, [0, 0, 0], "right", 1);
    label("Internal masses: move near tuned frequencies", core, [0.6, 0, 0.5], "left", 2);
    label("Mounting skid: anchors the assembly", system, [1.4, -1, 0.82], "right", 2);
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
