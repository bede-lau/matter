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
    for (let i = -3; i <= 3; i++) {
      const z = i === 0 ? 0.24 : i * 0.23;
      const side = z < 0 ? -1 : 1;
      const { curve } = fieldTube(
        group,
        cyan,
        [
          new T.Vector3(-2.7, 0.32, z),
          new T.Vector3(-1.25, 0.32, z),
          new T.Vector3(-0.62, 0.32, side * 0.92),
          new T.Vector3(0, 0.32, side * 1.06),
          new T.Vector3(0.62, 0.32, side * 0.92),
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
    const heat = fieldMaterial("#ffb06d", 0.6);
    const paths: T.CatmullRomCurve3[] = [];
    for (const z of [-0.82, -0.42, 0.42, 0.82]) {
      const { curve } = fieldTube(
        group,
        heat,
        [
          new T.Vector3(-2.05, 0.25, z),
          new T.Vector3(-0.8, 0.25, z),
          new T.Vector3(-0.35, 0.25, z * 1.45),
          new T.Vector3(0.35, 0.25, z * 1.45),
          new T.Vector3(0.8, 0.25, z),
          new T.Vector3(2.05, 0.25, z),
        ],
        0.015,
        "thermal-bypass-path",
      );
      paths.push(curve);
    }
    const updateDots = curveMarkers(group, paths, heat, 10, 0.12);
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
  return undefined;
};

export function createBehavior(p: LatticeOptions, lattice: T.Group) {
  return behaviorField(p.kind, lattice, p.variant);
}
