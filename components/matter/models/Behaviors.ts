import { addHeatFlowRoute, addHeatFlowChevron, placeHeatFlowChevron } from "./HeatFlow";
import { createMechanicalBehavior } from "./MechanicalExpansion";
import { createOpticalBehavior } from "./OpticalExpansion";
import { createMultiphysicsBehavior } from "./MultiphysicsExpansion";
import * as T from "three";
import type { LatticeOptions } from "@/lib/matter/geometry";

export type Behavior = {
  group: T.Group;
  camera?: number[];
  target?: number[];
  update: (time: number) => string;
};

const cycle = (value: number) => value - Math.floor(value);

const fieldMaterial = (color: string, opacity = 0.7) =>
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
  points: T.Vector3[],
  radius = 0.018,
  name = "behavior-field",
) => {
  const curve = new T.CatmullRomCurve3(points);
  const line = new T.Mesh(
    new T.TubeGeometry(curve, Math.max(24, points.length * 7), radius, 6, false),
    material,
  );
  line.name = name;
  line.castShadow = false;
  line.receiveShadow = false;
  parent.add(line);
  return { curve, line };
};

const marker = (parent: T.Object3D, material: T.Material, scale = 0.045) => {
  const dot = new T.Mesh(new T.SphereGeometry(1, 12, 8), material);
  dot.scale.setScalar(scale);
  dot.castShadow = false;
  parent.add(dot);
  return dot;
};

const curveMarkers = (
  parent: T.Object3D,
  curves: T.CatmullRomCurve3[],
  material: T.Material,
  amount = 8,
  speed = 0.32,
) => {
  const dots = Array.from({ length: amount }, (_, index) => ({
    dot: marker(parent, material, 0.038),
    curve: curves[index % curves.length],
    offset: index / amount,
  }));
  return (time: number) => {
    dots.forEach(({ dot, curve, offset }) => {
      const u = cycle(time * speed + offset);
      dot.position.copy(curve.getPointAt(u));
      dot.scale.setScalar(0.026 + 0.027 * Math.sin(Math.PI * u));
    });
  };
};

const behaviorField = (kind: string, lattice: T.Group, variant: number): Behavior | undefined => {
  const group = new T.Group();
  group.name = `behavior-${kind}`;
  const cyan = fieldMaterial("#74dcff", 0.76);

  if (kind === "metalens") {
    const paths: T.CatmullRomCurve3[] = [];
    for (let i = -3; i <= 3; i++) {
      const x = i * 0.38;
      const outX = variant === 0 ? x : 0;
      const { curve } = fieldTube(
        group,
        cyan,
        [
          new T.Vector3(x, -1.85, 0),
          new T.Vector3(x, -0.12, 0),
          new T.Vector3(variant === 0 ? x : x * 0.45, 0.82, 0),
          new T.Vector3(outX, 2.0, 0),
        ],
        0.014,
        "metalens-light-path",
      );
      paths.push(curve);
    }
    const updateDots = curveMarkers(group, paths, cyan, 12, 0.24);
    const focus = marker(group, fieldMaterial("#d7f8ff", 0.9), 0.08);
    focus.position.set(0, 2.0, 0);
    return {
      group,
      camera: [7.2, 4.8, 8.8],
      target: [0, 0.35, 0],
      update: (time) => {
        updateDots(time);
        focus.visible = variant !== 0;
        focus.scale.setScalar(0.06 + 0.025 * (0.5 + 0.5 * Math.sin(time * 4)));
        return variant === 0
          ? "Parallel light · baseline post field"
          : "Focused light · posts shape the wavefront";
      },
    };
  }

  if (kind === "cloak") {
    const paths: T.CatmullRomCurve3[] = [];
    for (const z of [-0.70, -0.42, -0.14, 0.14, 0.42, 0.70]) {
      const side = z < 0 ? -1 : 1;
      const bend = side * (0.78 + Math.abs(z) * 0.55);
      const { curve } = fieldTube(
        group,
        cyan,
        [
          new T.Vector3(-2.7, 0.32, z),
          new T.Vector3(-1.25, 0.32, z),
          new T.Vector3(-0.62, 0.32, bend * 0.9),
          new T.Vector3(0, 0.32, bend),
          new T.Vector3(0.62, 0.32, bend * 0.9),
          new T.Vector3(1.25, 0.32, z),
          new T.Vector3(2.7, 0.32, z),
        ],
        0.016,
        "cloak-bypass-field",
      );
      paths.push(curve);
    }
    const testObject = new T.Mesh(
      new T.CylinderGeometry(0.34, 0.34, 0.52, 28),
      new T.MeshStandardMaterial({ color: "#111c24", roughness: 0.72 }),
    );
    testObject.position.y = 0.26;
    group.add(testObject);
    const updateDots = curveMarkers(group, paths, cyan, 14, 0.22);
    return {
      group,
      camera: [7.3, 4.6, 9.5],
      target: [0, -0.1, 0],
      update: (time) => {
        updateDots(time);
        return "Microwave path · bends around the test region";
      },
    };
  }

  if (kind === "membrane-absorber") {
    const membranes: T.Mesh[] = [];
    const platelets = new Map<string, T.Mesh>();
    lattice.traverse((node) => {
      if (!(node instanceof T.Mesh)) return;
      if (node.name === "membrane-diaphragm") membranes.push(node);
      if (node.name === "bonded-platelet") platelets.set(String(node.userData.cell), node);
    });
    const rest = membranes.map((m) => ({ mesh: m, y: m.position.y, phase: m.userData.phase ?? 0 }));
    const plateletRest = Array.from(platelets.entries()).map(([cell, mesh]) => ({ cell, mesh, y: mesh.position.y }));
    const waves = Array.from({ length: 4 }, (_, index) => {
      const ring = new T.Mesh(
        new T.TorusGeometry(0.45, 0.012, 7, 32),
        fieldMaterial("#8ed9ff", 0.38 - index * 0.06),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 1.15 + index * 0.22, 0);
      group.add(ring);
      return ring;
    });
    return {
      group,
      camera: [7.4, 4.8, 9.2],
      target: [0, 0.15, 0],
      update: (time) => {
        const amplitude = 0.055;
        rest.forEach(({ mesh, y, phase }) => {
          const motion = amplitude * Math.sin(time * 6 + phase);
          mesh.position.y = y + motion;
          const platelet = platelets.get(String(mesh.userData.cell));
          if (platelet) platelet.position.y = (plateletRest.find((p) => p.mesh === platelet)?.y ?? 0) + motion;
        });
        waves.forEach((ring, index) => {
          const scale = 0.7 + cycle(time * 0.52 + index * 0.24) * 1.3;
          ring.scale.setScalar(scale);
          (ring.material as T.MeshBasicMaterial).opacity = Math.max(0, 0.38 - scale * 0.16);
        });
        return "Membranes pulse · tuned masses move with them";
      },
    };
  }

  if (kind === "thermal-cloak") {
    const paths = [-0.82, -0.42, 0.42, 0.82].map(z =>
      addHeatFlowRoute(group, [
        [-2.05, 0.25, z], [-0.8, 0.25, z],
        [-0.35, 0.25, z * 1.45], [0.35, 0.25, z * 1.45],
        [0.8, 0.25, z], [2.05, 0.25, z],
      ], "thermal-bypass-path"));
    const markers = paths.flatMap(curve => [0, 1, 2].map(i => ({
      curve, marker: addHeatFlowChevron(group), offset: i / 3,
    })));
    const updateDots = (time: number) => markers.forEach(({ marker, curve, offset }) =>
      placeHeatFlowChevron(marker, curve, (time * 0.12 + offset) % 1));
    const core = lattice.getObjectByName("thermal-protected-core") as T.Mesh | undefined;
    const coreMaterial = core?.material instanceof T.MeshStandardMaterial ? core.material : undefined;
    const cool = new T.Color("#334853"), warm = new T.Color("#d98c68");
    return {
      group,
      camera: [7.4, 4.7, 9.1],
      target: [0, -0.1, 0],
      update: (time) => {
        updateDots(time);
        if (coreMaterial) {
          const delayed = Math.max(0, Math.sin(time * 0.22 - 1.1) * 0.5 + 0.16);
          coreMaterial.color.copy(cool).lerp(warm, delayed);
        }
        return "Heat path · slowly diverts around the core";
      },
    };
  }

  if (kind === "topological") {
    const route = new T.CatmullRomCurve3([
      new T.Vector3(-1.72, 0.42, -1.18),
      new T.Vector3(0.8, 0.42, -1.18),
      new T.Vector3(0.8, 0.42, 1.18),
    ]);
    fieldTube(group, cyan, route.getPoints(24), 0.018, "edge-mode-route");
    const dots = Array.from({ length: 9 }, (_, index) => marker(group, cyan, 0.042));
    return {
      group,
      camera: [7.6, 4.8, 9.6],
      target: [0, 0, 0],
      update: (time) => {
        dots.forEach((dot, index) => {
          const phase = cycle(time * 0.26 - index * 0.07);
          const envelope = Math.exp(-(((phase - 0.48) / 0.2) ** 2));
          dot.position.copy(route.getPointAt(phase));
          dot.scale.setScalar(0.018 + envelope * 0.06);
          (dot.material as T.MeshBasicMaterial).opacity = 0.15 + envelope * 0.78;
        });
        return "Guided wave packet · follows the edge route";
      },
    };
  }

  if (kind === "flux") {
    const lines: T.Mesh[] = [];
    for (const z0 of [-0.7, -0.35, 0, 0.35, 0.7]) {
      const pts: T.Vector3[] = [];
      for (let i = 0; i <= 20; i++) {
        const x = -2.7 + (i / 20) * 5.4;
        const focus = 0.25 + 0.75 * (1 - Math.exp(-((x / 0.82) ** 2)));
        pts.push(new T.Vector3(x, 0.08, z0 * focus));
      }
      const { line } = fieldTube(group, cyan, pts, 0.016, "concentrated-flux-line");
      lines.push(line);
    }
    const sensor = marker(group, fieldMaterial("#d8f6ff", 0.92), 0.065);
    sensor.position.set(0, 0.08, 0);
    return {
      group,
      camera: [7.5, 4.6, 9.6],
      target: [0, -0.25, 0],
      update: (time) => {
        const strength = 0.35 + 0.65 * (0.5 - 0.5 * Math.cos(time * 0.7));
        lines.forEach((line) => ((line.material as T.MeshBasicMaterial).opacity = 0.2 + strength * 0.6));
        sensor.scale.setScalar(0.04 + strength * 0.055);
        return "External field · funnels concentrate flux at the gap";
      },
    };
  }

  if (kind === "hyperbolic") {
    const paths: T.CatmullRomCurve3[] = [];
    for (let z = -2; z <= 2; z++) {
      const { curve } = fieldTube(
        group,
        cyan,
        [
          new T.Vector3(-1.65, 0.7, z * 0.23),
          new T.Vector3(-0.45, 0.7, z * 0.23),
          new T.Vector3(0.48, 0.7, z * 0.18),
          new T.Vector3(1.65, 0.7, z * 0.14),
        ],
        0.014,
        "hyperbolic-near-field-path",
      );
      paths.push(curve);
    }
    const updateDots = curveMarkers(group, paths, cyan, 11, 0.22);
    return {
      group,
      camera: [7.2, 4.7, 9.1],
      target: [0, 0.6, 0],
      update: (time) => {
        updateDots(time);
        return "Layered response · selected fine optical detail is carried through the stack";
      },
    };
  }

  if (kind === "chiral") {
    const preferred = fieldMaterial("#8be5ff", 0.78);
    const reduced = fieldMaterial("#c99bff", 0.27);
    const preferredPaths: T.CatmullRomCurve3[] = [];
    for (let x = -1; x <= 1; x++) {
      const { curve } = fieldTube(
        group,
        preferred,
        [
          new T.Vector3(x * 0.55, -0.4, 0),
          new T.Vector3(x * 0.55, 0.2, 0.08),
          new T.Vector3(x * 0.4, 1.15, 0.12),
          new T.Vector3(x * 0.28, 1.8, 0),
        ],
        0.017,
        "chiral-preferred-field",
      );
      preferredPaths.push(curve);
      fieldTube(
        group,
        reduced,
        [
          new T.Vector3(x * 0.55 + 0.17, -0.4, 0.18),
          new T.Vector3(x * 0.55 + 0.17, 0.25, 0.22),
          new T.Vector3(x * 0.45 + 0.17, 0.92, 0.18),
        ],
        0.014,
        "chiral-reduced-field",
      );
    }
    const updateDots = curveMarkers(group, preferredPaths, preferred, 8, 0.24);
    return {
      group,
      camera: [7.1, 4.8, 8.9],
      target: [0, 0.55, 0],
      update: (time) => {
        updateDots(time);
        return variant === 1
          ? "Right-handed helices · opposite light twist passes more readily"
          : "Left-handed helices · one circular polarization is reduced more strongly";
      },
    };
  }

  if (kind === "labyrinth") {
    const field = fieldMaterial("#80e1ff", 0.74);
    const folds = variant === 0 ? 0 : 4 + (variant === 2 ? 2 : 0);
    const points = [new T.Vector3(-1.7, 0.43, 0)];
    for (let i = 0; i < folds; i++)
      points.push(new T.Vector3(-1.35 + ((i + 1) / (folds + 1)) * 2.7, 0.43, i % 2 ? 0.8 : -0.8));
    points.push(new T.Vector3(1.7, 0.43, folds % 2 ? 0.8 : -0.8));
    const { curve } = fieldTube(group, field, points, 0.019, "labyrinth-pressure-route");
    const markerUpdate = curveMarkers(group, [curve], field, 7, 0.16);
    const reference = marker(group, fieldMaterial("#b7cdd7", 0.38), 0.04);
    return {
      group,
      camera: [6.7, 5.4, 9.1],
      target: [0, 0.35, 0],
      update: (time) => {
        markerUpdate(time);
        reference.position.set(-1.7 + cycle(time * 0.42) * 3.4, 0.7, 1.15);
        return folds
          ? "Folded air passage · the same pulse takes a longer route"
          : "Straight reference · sound crosses the short air path";
      },
    };
  }

  if (kind === "radiative-cooler") {
    const sunlight = fieldMaterial("#ffe187", 0.64);
    const infrared = fieldMaterial("#ff9f72", 0.6);
    const incoming: T.CatmullRomCurve3[] = [];
    const outgoing: T.CatmullRomCurve3[] = [];
    for (let x = -2; x <= 2; x++) {
      const { curve: inCurve } = fieldTube(
        group,
        sunlight,
        [new T.Vector3(x * 0.42 - 0.22, 2.1, 0), new T.Vector3(x * 0.42, 0.48, 0), new T.Vector3(x * 0.42 + 0.35, 1.38, 0)],
        0.017,
        "radiative-sunlight-path",
      );
      incoming.push(inCurve);
      const { curve: outCurve } = fieldTube(
        group,
        infrared,
        [new T.Vector3(x * 0.42, 0.48, 0.16), new T.Vector3(x * 0.46, 1.18, 0.12), new T.Vector3(x * 0.5, 2.18, 0.08)],
        0.014,
        "radiative-infrared-path",
      );
      outgoing.push(outCurve);
    }
    const sunDots = curveMarkers(group, incoming, sunlight, 7, 0.18);
    const heatDots = curveMarkers(group, outgoing, infrared, 7, 0.14);
    return {
      group,
      camera: [7.2, 4.9, 8.8],
      target: [0, 0.35, 0],
      update: (time) => {
        sunDots(time);
        heatDots(time);
        return "Energy balance · sunlight reflects while thermal infrared leaves the film";
      },
    };
  }

  if (kind === "seismic") {
    const wave = fieldMaterial("#82dcff", 0.5);
    const fronts = Array.from({ length: 5 }, (_, index) => {
      const { line } = fieldTube(
        group,
        wave,
        [new T.Vector3(-2.35 + index * 0.14, 0.27, -1.28), new T.Vector3(-1.55 + index * 0.14, 0.36, 0), new T.Vector3(-0.7 + index * 0.14, 0.27, 1.28)],
        0.018,
        "seismic-surface-wavefront",
      );
      return line;
    });
    const pivots = lattice.getObjectsByProperty("name", "seismic-resonator-pivot") as T.Group[];
    return {
      group,
      camera: [7.8, 5.4, 9.5],
      target: [0, 0.38, 0],
      update: (time) => {
        fronts.forEach((front, index) => (front.position.x = cycle(time * 0.38 + index * 0.14) * 0.54));
        pivots.forEach((pivot) => {
          pivot.rotation.z = Math.sin(time * 4.2 + (pivot.userData.phase ?? 0)) * 0.075;
        });
        return "Ground-wave coupling · the anchored rods oscillate near a selected band";
      },
    };
  }

  if (kind === "water-wave") {
    const water = fieldMaterial("#7de2f4", 0.62);
    const fronts: T.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const x = -1.65 + i * 0.62;
      const bend = variant === 1 ? 0.46 : 0.14;
      const { line } = fieldTube(
        group,
        water,
        [new T.Vector3(x, 0.57, -1.12), new T.Vector3(x + 0.09, 0.57, -bend), new T.Vector3(x + 0.09, 0.57, bend), new T.Vector3(x, 0.57, 1.12)],
        0.014,
        "water-wavefront",
      );
      fronts.push(line);
    }
    return {
      group,
      camera: [7.1, 6.0, 9.0],
      target: [0, 0.35, 0],
      update: (time) => {
        fronts.forEach((front, index) => {
          front.position.x = cycle(time * 0.35 + index * 0.2) * 0.42;
          front.position.y = Math.sin(time * 3 + index) * 0.014;
        });
        return variant === 1
          ? "Rotated plates · ripples leave on a changed route"
          : "Submerged plate rows · ripples pass through the water channels";
      },
    };
  }
  return undefined;
};

export function createBehavior(p: LatticeOptions, lattice: T.Group) {
  return createMechanicalBehavior(p, lattice) ?? createOpticalBehavior(p, lattice) ?? createMultiphysicsBehavior(p, lattice) ?? behaviorField(p.kind, lattice, p.variant);
}
