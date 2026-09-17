import { createMechanicalApplication } from "./MechanicalExpansion";
import { createOpticalApplication } from "./OpticalExpansion";
import { createMultiphysicsApplication } from "./MultiphysicsExpansion";
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
  const options = { kind, variant, count, thickness, color };
  const expanded = createMechanicalApplication(options, lattice) ?? createOpticalApplication(options, lattice) ?? createMultiphysicsApplication(options, lattice);
  if (expanded) return expanded;
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
    // Raise the full circular assembly until the mounting rim, rather than the
    // wafer body, is the only feature that reaches the bench.
    const opticY = 0.4;
    const optic = fitLattice(lattice, [2.45, 0.2, 2.45], [0, opticY, 0], group);
    optic.name = "metalens-wafer";
    optic.rotation.z = Math.PI / 2;
    const bench = box(group, p.dark, [5.9, 0.14, 3.2], [0, -1.05, 0], "optics-bench");
    const mount = mesh(new T.TorusGeometry(1.32, 0.055, 8, 42), p.metal, group, "wafer-mount");
    mount.rotation.y = Math.PI / 2;
    mount.position.set(0, opticY, 0);
    const source = box(group, p.dark, [0.46, 0.52, 0.72], [-2.52, opticY, 0], "collimated-light-source");
    const aperture = mesh(new T.CylinderGeometry(0.12, 0.12, 0.035, 24), p.ivory, group, "source-aperture");
    aperture.rotation.z = Math.PI / 2;
    aperture.position.set(-2.27, opticY, 0);
    const sensor = box(group, p.dark, [0.26, 0.72, 0.82], [2.15, opticY, 0], "image-sensor");
    const sensorFace = mesh(new T.PlaneGeometry(0.56, 0.56), p.accent, group, "sensor-active-area");
    sensorFace.rotation.y = -Math.PI / 2;
    sensorFace.position.set(2.005, opticY, 0);
    const focus = ellipsoid(group, fieldMaterial("#72dcff", 0.88), [1.84, opticY, 0], [0.055, 0.055, 0.055], "focal-spot");
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
            [-2.23, opticY, z],
            [-0.16, opticY, z],
            [0.7, opticY, z * 0.48],
            [1.84, opticY, 0],
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
    // Raise the test surface until it meets the shallow cloak substrate.
    const floor = box(group, p.dark, [6.1, 0.13, 3.85], [0, -0.31, 0], "cloak-test-surface");
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
    // fitLattice centres its result, so place its centre half its own height
    // above the chip surface. This seats the lower ends of the posts exactly
    // on the chip instead of cutting through it.
    const chipY = -2.38;
    const chipTop = chipY + 0.07;
    const latticeHeight = 0.65;
    const latticeCenterY = chipTop + latticeHeight / 2;
    const latticeHolder = fitLattice(
      lattice,
      [3.55, latticeHeight, 3.2],
      [0, latticeCenterY, 0],
      group,
    );
    latticeHolder.name = "topological-post-field";
    box(group, p.dark, [5.8, 0.14, 3.4], [0, chipY, 0], "photonic-chip");
    const inputPort = box(group, p.metal, [0.34, 0.16, 0.22], [-1.92, chipTop + 0.08, -1.18], "waveguide-input");
    const signal = fieldMaterial("#66dbff", 0.75);
    const edgeRoute = fieldTube(
      group,
      signal,
      [
        [-1.75, chipTop + 0.69, -1.18],
        [0.8, chipTop + 0.69, -1.18],
        [0.8, chipTop + 0.69, 1.18],
      ],
      0.028,
      "topological-edge-route",
    );
    const corner = anchor(group, [0.8, chipTop + 0.69, -1.18], "edge-route-corner");
    const waveDots: { dot: T.Mesh; base: T.Vector3 }[] = [];
    for (let i = 0; i < 10; i++) {
      const dot = ellipsoid(group, signal, [-1.65 + i * 0.36, chipTop + 0.69, -1.18], [0.052, 0.052, 0.052], "edge-mode-packet");
      dot.castShadow = false;
      waveDots.push({ dot, base: dot.scale.clone() });
    }
    label("Patterned bulk: blocks selected paths", latticeHolder, [-0.6, 0.26, 0.6], "left", 0);
    label("Input port: launches the signal", inputPort, [0, 0, 0], "left", 1);
    label("Edge route: carries the guided signal", edgeRoute, [0.8, chipTop + 0.69, 0.15], "right", 0);
    label("Corner: the signal follows the boundary", corner, [0, 0, 0], "right", 1);
    camera = [7.6, 4.8, 9.6];
    target = [0, -1.88, 0];
    update = (t, e) => {
      waveDots.forEach(({ dot, base }, i) => {
        const phase = (t * 0.42 + i / waveDots.length) % 1;
        if (phase < 0.52) {
          dot.position.set(-1.75 + (phase / 0.52) * 2.55, chipTop + 0.69, -1.18);
        } else {
          dot.position.set(0.8, chipTop + 0.69, -1.18 + ((phase - 0.52) / 0.48) * 2.36);
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
  } else if (kind === "hyperbolic") {
    // Keep the deposited-film stack at its native proportions so the layer
    // count and metal share remain visible when the control changes.
    group.add(lattice);
    const bench = box(group, p.dark, [5.9, 0.14, 3.25], [0, -1.15, 0], "hyperlens-optics-bench");
    lattice.position.set(0, bench.position.y + 0.07, 0);
    const emitter = box(group, p.dark, [0.38, 0.46, 0.74], [-2.45, -0.28, 0], "hyperlens-near-field-emitter");
    const aperture = mesh(new T.CylinderGeometry(0.12, 0.12, 0.04, 18), p.ivory, group, "hyperlens-object-aperture");
    aperture.rotation.z = Math.PI / 2;
    aperture.position.set(-2.23, -0.28, 0);
    const plane = box(group, p.dark, [0.08, 0.82, 1.48], [2.1, -0.28, 0], "hyperlens-observation-plane");
    const pathMaterial = fieldMaterial("#79ddff", 0.48);
    const pathDots: { dot: T.Mesh; curve: T.CatmullRomCurve3; offset: number }[] = [];
    for (let i = -3; i <= 3; i++) {
      const z = i * 0.21;
      const points: T.Vector3[] = [
        new T.Vector3(-2.18, -0.28, z),
        new T.Vector3(-0.85, -0.28, z),
        new T.Vector3(0.72, -0.28, z * 0.74),
        new T.Vector3(2.02, -0.28, z * 0.6),
      ];
      fieldTube(
        group,
        pathMaterial,
        points.map((point) => point.toArray()),
        0.011,
        "hyperlens-energy-path",
      );
      const dot = ellipsoid(group, pathMaterial, [-2.12, -0.28, z], [0.026, 0.026, 0.026], "hyperlens-field-marker");
      pathDots.push({ dot, curve: new T.CatmullRomCurve3(points), offset: (i + 3) / 7 });
    }
    label("Metal films: carry the optical response", lattice, [-0.38, 0.78, 0.35], "left", 0);
    label("Nearby source: launches fine optical detail", emitter, [0, 0, 0], "left", 1);
    label("Dielectric films: separate the metal layers", lattice, [0.42, 0.78, -0.3], "right", 0);
    label("Observation plane: receives the transported pattern", plane, [0, 0, 0], "right", 1);
    camera = [7.4, 4.6, 9.2];
    target = [0, -0.2, 0];
    update = (t, e) => {
      pathDots.forEach(({ dot, curve, offset }) => {
        const progress = (t * 0.24 + offset) % 1;
        dot.position.copy(curve.getPointAt(progress));
        dot.scale.setScalar(0.018 + 0.014 * Math.sin(progress * Math.PI));
      });
      return e > 0.15 ? "Layer stack opened · deposited film order" : "Fine optical pattern · illustrative near-field transport";
    };
  } else if (kind === "chiral") {
    // The whole helix wafer rotates into an upright optical holder. Its lower
    // edge is aligned to the bench top rather than hovering above it.
    group.add(lattice);
    lattice.rotation.z = -Math.PI / 2;
    const bench = box(group, p.dark, [5.9, 0.14, 3.25], [0, -1.15, 0], "chiral-optics-bench");
    lattice.position.set(0, 0.61, 0);
    const holder = box(group, p.dark, [0.18, 0.18, 2.22], [0.02, -0.98, 0], "chiral-wafer-holder");
    const waferRing = mesh(new T.TorusGeometry(1.63, 0.045, 8, 48), p.metal, group, "chiral-wafer-ring");
    waferRing.rotation.y = Math.PI / 2;
    waferRing.position.set(0, 0.61, 0);
    const source = box(group, p.dark, [0.42, 0.48, 0.74], [-2.5, 0.61, 0], "chiral-light-source");
    const detector = box(group, p.dark, [0.28, 0.72, 0.82], [2.46, 0.61, 0], "chiral-polarization-detector");
    const rightHanded = fieldMaterial("#8be5ff", 0.76);
    const leftHanded = fieldMaterial("#c99bff", 0.76);
    const selected = variant === 1 ? leftHanded : rightHanded;
    const reduced = variant === 1 ? rightHanded : leftHanded;
    const polarizationPath = (handedness: number, zOffset: number, travel = 1) =>
      Array.from({ length: 34 }, (_, index) => {
        const progress = index / 33;
        const angle = handedness * progress * Math.PI * 7;
        const radius = progress > 0.34 && progress < 0.67 ? 0.105 : 0.075;
        return [
          -2.27 + progress * 4.57 * travel,
          0.61 + Math.cos(angle) * radius,
          zOffset + Math.sin(angle) * radius,
        ];
      });
    const selectedPoints = polarizationPath(variant === 1 ? -1 : 1, -0.16);
    const reducedPoints = polarizationPath(variant === 1 ? 1 : -1, 0.22, 0.78);
    const selectedLine = fieldTube(group, selected, selectedPoints, 0.016, "preferred-polarization");
    const reducedLine = fieldTube(group, reduced, reducedPoints, 0.013, "reduced-polarization");
    const selectedCurve = new T.CatmullRomCurve3(selectedPoints.map((point) => new T.Vector3(...(point as [number, number, number]))));
    const reducedCurve = new T.CatmullRomCurve3(reducedPoints.map((point) => new T.Vector3(...(point as [number, number, number]))));
    const selectedDot = ellipsoid(group, selected, [-2.1, 0.61, -0.16], [0.038, 0.038, 0.038], "preferred-polarization-marker");
    const reducedDot = ellipsoid(group, reduced, [-2.1, 0.61, 0.22], [0.03, 0.03, 0.03], "reduced-polarization-marker");
    label("Polarized source: sends two light twists", source, [0, 0, 0], "left", 0);
    label("Gold helices: select a handedness", waferRing, [0, 0, 0], "left", 1);
    label("Preferred polarization: stays stronger", selectedLine, [1.65, 0, 0], "right", 0);
    label("Detector: compares the outgoing light", detector, [0, 0, 0], "right", 1);
    camera = [7.6, 4.7, 9.3];
    target = [0, -0.05, 0];
    update = (t, e) => {
      const progress = (t * 0.34) % 1;
      selectedDot.position.copy(selectedCurve.getPointAt(progress));
      reducedDot.position.copy(reducedCurve.getPointAt(progress));
      (reducedLine.material as T.MeshBasicMaterial).opacity = 0.18 + 0.1 * Math.sin(t * 3);
      selectedDot.scale.setScalar(0.027 + 0.014 * Math.sin(progress * Math.PI));
      reducedDot.scale.setScalar(0.018 + 0.009 * Math.sin(progress * Math.PI));
      return e > 0.15 ? "Helix array opened · handedness comparison" : "Circular polarizations · one is reduced more strongly";
    };
  } else if (kind === "labyrinth") {
    group.add(lattice);
    const ductFloor = box(group, p.dark, [5.8, 0.14, 3.2], [0, -1.15, 0], "labyrinth-duct-floor");
    lattice.position.y = ductFloor.position.y + 0.07;
    const speaker = mesh(new T.CylinderGeometry(0.42, 0.42, 0.38, 24), p.dark, group, "labyrinth-speaker");
    speaker.rotation.z = Math.PI / 2;
    speaker.position.set(-2.36, -0.63, 0);
    const receiver = box(group, p.dark, [0.22, 0.52, 0.62], [2.26, -0.63, 0], "labyrinth-receiver");
    const field = fieldMaterial("#7edfff", 0.72);
    const folds = variant === 0 ? 0 : count + 1 + (variant === 2 ? 2 : 0);
    const path: number[][] = [[-1.72, -0.62, 0]];
    for (let i = 0; i < folds; i++)
      path.push([-1.35 + ((i + 1) / (folds + 1)) * 2.7, -0.62, i % 2 === 0 ? -0.82 : 0.82]);
    if (folds) path.push([1.72, -0.62, folds % 2 === 0 ? 0.82 : -0.82]);
    path.push([2.14, -0.62, 0]);
    const route = fieldTube(group, field, path, 0.018, "labyrinth-sound-route");
    const routeCurve = new T.CatmullRomCurve3(path.map((point) => new T.Vector3(...(point as [number, number, number]))), false, "centripetal");
    const pressureBands = Array.from({ length: 12 }, (_, index) => {
      const band = mesh(
        new T.TorusGeometry(0.115, 0.009, 6, 20),
        fieldMaterial("#80e1ff", 0.58),
        group,
        "labyrinth-pressure-band",
      );
      band.castShadow = false;
      band.receiveShadow = false;
      band.userData.offset = index / 12;
      return band;
    });
    label("Inlet: sound enters the panel", speaker, [0, 0, 0], "left", 0);
    label(folds ? "Divider walls: make the air route longer" : "Side walls: contain the short air route", lattice, [0, 0.4, 0], "left", 1);
    label(folds ? "Folded air path: delays the sound" : "Straight air path: gives sound a short route", route, [0.62, 0, 0], "right", 0);
    label("Receiver: compares the delayed output", receiver, [0, 0, 0], "right", 1);
    camera = [6.8, 5.6, 9.4];
    target = [0, -0.5, 0];
    update = (t, e) => {
      pressureBands.forEach((band) => {
        const progress = (t * 0.13 + (band.userData.offset as number)) % 1;
        const point = routeCurve.getPointAt(progress);
        const tangent = routeCurve.getTangentAt(progress).normalize();
        band.position.copy(point);
        band.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), tangent);
        const pulse = 0.74 + 0.3 * Math.sin(progress * Math.PI);
        band.scale.setScalar(pulse);
        (band.material as T.MeshBasicMaterial).opacity = 0.16 + 0.42 * Math.sin(progress * Math.PI);
      });
      return e > 0.15
        ? "Panel opened · continuous folded passage"
        : folds
          ? "Sound pulse · folded route arrives later"
          : "Sound pulse · short reference route";
    };
  } else if (kind === "radiative-cooler") {
    group.add(lattice);
    const roof = box(group, p.dark, [5.8, 0.16, 3.2], [0, -1.15, 0], "cooler-roof-coupon");
    lattice.position.y = roof.position.y + 0.08;
    const control = Math.max(0, Math.min(1, (thickness - 0.3) / 1.3));
    const filmHeight = 0.12 + control * 0.26 + (variant === 2 ? 0.08 : 0);
    // Keep every explanatory ray tangent to the polymer's outer surface at
    // each control setting. The ray thickness starts just above the film.
    const filmSurface = lattice.position.y + 0.07 + filmHeight;
    const sun = fieldMaterial("#ffe289", 0.42);
    const infrared = fieldMaterial("#ff9f72", 0.48);
    const solarLines: T.Mesh[] = [];
    const infraredLines: T.Mesh[] = [];
    const solarCurves: T.LineCurve3[] = [];
    const infraredCurves: T.CatmullRomCurve3[] = [];
    for (const x of [-0.9, -0.3, 0.3, 0.9]) {
      const solarStart = [x - 0.72, 1.48, -0.34];
      const solarContact = [x, filmSurface + 0.011, -0.34];
      const solarExit = [x + 0.62, 0.82, -0.34];
      const infraredPoints = [[x, filmSurface + 0.012, 0.3], [x + 0.12, 0.12, 0.3], [x + 0.22, 1.18, 0.3]];
      solarLines.push(
        fieldTube(group, sun, [solarStart, solarContact], 0.011, "reflected-sunlight"),
        fieldTube(group, sun, [solarContact, solarExit], 0.011, "reflected-sunlight"),
      );
      infraredLines.push(fieldTube(group, infrared, infraredPoints, 0.012, "emitted-infrared"));
      solarCurves.push(
        new T.LineCurve3(
          new T.Vector3(...(solarStart as [number, number, number])),
          new T.Vector3(...(solarContact as [number, number, number])),
        ),
      );
      infraredCurves.push(new T.CatmullRomCurve3(infraredPoints.map((point) => new T.Vector3(...(point as [number, number, number])))));
    }
    const solarDots = solarCurves.map((curve, index) => ({ dot: ellipsoid(group, sun, curve.getPointAt(0).toArray(), [0.024, 0.024, 0.024], "sunlight-marker"), curve, offset: index / solarCurves.length }));
    const infraredDots = infraredCurves.map((curve, index) => ({ dot: ellipsoid(group, infrared, curve.getPointAt(0).toArray(), [0.022, 0.022, 0.022], "infrared-marker"), curve, offset: index / infraredCurves.length }));
    const film = lattice.getObjectByName("radiative-polymer-film") ?? lattice;
    const backing = lattice.getObjectByName("radiative-silver-backing") ?? lattice;
    label("Polymer film: holds embedded microspheres", film, [0, 0, 0], "left", 0);
    label("Sunlight: mostly reflects away", solarLines[0], [0, 0, 0], "left", 1);
    label("Infrared emission: carries heat toward the sky", infraredLines[3], [0, 0, 0], "right", 0);
    label("Silver backing: reflects light below the film", backing, [0, 0, 0], "right", 1);
    camera = [7.4, 4.9, 9.2];
    target = [0, -0.1, 0];
    update = (t, e) => {
      solarDots.forEach(({ dot, curve, offset }) => {
        const progress = (t * 0.25 + offset) % 1;
        dot.position.copy(curve.getPointAt(progress));
        dot.scale.setScalar(0.016 + 0.012 * Math.sin(progress * Math.PI));
      });
      infraredDots.forEach(({ dot, curve, offset }) => {
        const progress = (t * 0.18 + offset) % 1;
        dot.position.copy(curve.getPointAt(progress));
        dot.scale.setScalar(0.015 + 0.011 * Math.sin(progress * Math.PI));
      });
      return e > 0.15 ? "Film layers opened · fixed backing and microspheres" : "Sunlight reflected · thermal infrared emitted";
    };
  } else if (kind === "seismic") {
    group.add(lattice);
    lattice.position.y = -1.08;
    const building = box(group, p.dark, [0.72, 1.35, 1.06], [2.22, -0.225, 0], "seismic-test-building");
    const window = box(group, p.ivory, [0.03, 0.26, 0.48], [1.85, -0.015, 0], "seismic-building-window");
    const field = fieldMaterial("#80dcff", 0.44);
    const waveBands: T.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const x = -2.48 + i * 0.45;
      const band = fieldTube(group, field, [[x, -0.868, -1.36], [x + 0.09, -0.83, -0.68], [x, -0.868, 0], [x + 0.09, -0.83, 0.68], [x, -0.868, 1.36]], 0.014, "seismic-wavefront");
      waveBands.push(band);
    }
    const pivots = lattice.getObjectsByProperty("name", "seismic-resonator-pivot") as T.Group[];
    label("Incoming ground wave: travels across the surface", waveBands[1], [0, 0, 0], "left", 0);
    label("Anchored rods: respond at selected frequencies", lattice, [-0.8, 0.35, 0], "left", 1);
    label("Graded array: changes height along the route", lattice, [0.82, 0.55, 0.3], "right", 0);
    label("Test region: shows the downstream comparison", building, [0, 0, 0], "right", 1);
    camera = [7.6, 4.95, 9.5];
    target = [0.1, -0.5, 0];
    update = (t, e) => {
      pivots.forEach((pivot) => {
        pivot.rotation.z = Math.sin(t * 4.1 + (pivot.userData.phase ?? 0)) * 0.075;
      });
      waveBands.forEach((band, index) => {
        band.position.x = ((t * 0.34 + index * 0.12) % 1) * 0.48;
        (band.material as T.MeshBasicMaterial).opacity = 0.14 + 0.3 * (0.5 + 0.5 * Math.sin(t * 3 + index));
      });
      return e > 0.15 ? "Ground array opened · rods stay anchored" : "Selected surface wave · graded rods couple to motion";
    };
  } else if (kind === "water-wave") {
    group.add(lattice);
    lattice.position.y = -1.08;
    const glass = new T.MeshPhysicalMaterial({ color: "#75d7ee", transparent: true, opacity: 0.16, roughness: 0.14, metalness: 0.04, depthWrite: false });
    box(group, glass, [3.94, 0.58, 0.04], [0, -0.79, -1.48], "water-tank-wall");
    box(group, glass, [3.94, 0.58, 0.04], [0, -0.79, 1.48], "water-tank-wall");
    box(group, glass, [0.04, 0.58, 3.0], [-1.95, -0.79, 0], "water-tank-wall");
    box(group, glass, [0.04, 0.58, 3.0], [1.95, -0.79, 0], "water-tank-wall");
    const source = box(group, p.dark, [0.24, 0.56, 1.85], [-2.18, -0.7, 0], "water-wave-paddle");
    const field = fieldMaterial("#78e0f4", 0.54);
    const fronts: T.Mesh[] = [];
    for (let i = 0; i < 11; i++) {
      const x = -1.78 + i * 0.31;
      const points = Array.from({ length: 19 }, (_, index) => {
        const z = -1.27 + (index / 18) * 2.54;
        const turn = variant === 1 ? z * 0.22 : 0;
        return [x + turn + Math.sin(index * 0.9) * 0.035, -0.505, z];
      });
      fronts.push(fieldTube(group, field, points, 0.011, "water-wave-front"));
    }
    const plates = lattice.getObjectsByProperty("name", "water-wave-plate") as T.Mesh[];
    label("Wave paddle: makes small test ripples", source, [0, 0, 0], "left", 0);
    label("Submerged plates: stay fixed to the tank floor", plates[0] ?? lattice, [0, 0, 0], "left", 1);
    label("Water channels: guide the visible wavefronts", lattice, [0, 0.35, 0], "right", 0);
    label("Emerging wavefront: shows the changed route", fronts[8], [0, 0, 0], "right", 1);
    camera = [7.7, 6.45, 9.5];
    target = [0, -0.55, 0];
    update = (t, e) => {
      fronts.forEach((front, i) => {
        front.position.x = ((t * 0.21 + i * 0.09) % 1) * 0.36;
        front.position.y = Math.sin(t * 3 + i * 0.72) * 0.012;
        (front.material as T.MeshBasicMaterial).opacity = 0.16 + 0.38 * (0.5 + 0.5 * Math.sin(t * 2.5 + i * 0.42));
      });
      return e > 0.15 ? "Tank opened · plates attached to the floor" : "Surface ripples · patterned channels guide the route";
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
