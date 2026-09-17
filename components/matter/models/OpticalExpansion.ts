import * as T from "three";
import type { LatticeOptions } from "@/lib/matter/geometry";
import type { Behavior } from "./Behaviors";
import type { Application } from "./Applications";
import { box, mesh, rod, tube, anchor, type Callout } from "./primitives";

/** Educational geometries; distances are illustrative, not a Maxwell solver. */
const ids = ["negative-index", "epsilon-near-zero", "photonic-bandgap", "bound-state-continuum", "phase-change", "liquid-crystal", "huygens", "structural-color", "graphene-absorber", "space-time"];
const norm = (p: LatticeOptions) => Math.max(0, Math.min(1, (p.thickness - .3) / 1.3));
const rows = (p: LatticeOptions) => Math.max(1, Math.min(5, Math.round(p.count)));
const variant = (p: LatticeOptions) => Math.max(0, Math.min(2, Math.round(p.variant)));
const pct = (x: number) => `${Math.round(100 * Math.max(0, Math.min(1, (x - .3) / 1.3)))}% of illustrated range`;
const countText = (x: number) => `${Math.round(x)} groups`;
export const opticalControls: Record<string, { thickness: string; count: string; thicknessValue: (value: number) => string; countValue: (value: number) => string }> = {
  "negative-index": { thickness: "Copper trace width", count: "Cells along beam", thicknessValue: pct, countValue: x => `${Math.round(x) + 2} cells` },
  "epsilon-near-zero": { thickness: "Channel height", count: "Channel sections", thicknessValue: pct, countValue: x => `${Math.round(x)} sections` },
  "photonic-bandgap": { thickness: "Pillar diameter", count: "Crystal rows", thicknessValue: pct, countValue: x => `${2 * Math.round(x) + 3} × ${2 * Math.round(x) + 3} sites` },
  "bound-state-continuum": { thickness: "Pair asymmetry", count: "Resonator pairs", thicknessValue: pct, countValue: x => `${(Math.round(x) + 2) ** 2} pairs` },
  "phase-change": { thickness: "Crystalline share", count: "Pixel rows", thicknessValue: pct, countValue: x => `${Math.round(x) + 2} × ${Math.round(x) + 2} pixels` },
  "liquid-crystal": { thickness: "Director rotation", count: "Disk rows", thicknessValue: pct, countValue: x => `${Math.round(x) + 2} × ${Math.round(x) + 2} disks` },
  "huygens": { thickness: "Post diameter", count: "Post rows", thicknessValue: pct, countValue: x => `${Math.round(x) + 3} × ${Math.round(x) + 3} posts` },
  "structural-color": { thickness: "Pillar diameter", count: "Color pixel rows", thicknessValue: pct, countValue: x => `${Math.round(x) + 3} × ${Math.round(x) + 3} pillars` },
  "graphene-absorber": { thickness: "Graphene feature width", count: "Pattern rows", thicknessValue: pct, countValue: countText },
  "space-time": { thickness: "Bias modulation depth", count: "Loaded cells", thicknessValue: pct, countValue: x => `${Math.round(x) + 3} cells` },
};
const solid = (color: string, wireframe = false) => new T.MeshStandardMaterial({ color, roughness: .4, metalness: .15, wireframe });
const glass = (color = "#b4d9e3", opacity = .22) => new T.MeshPhysicalMaterial({ color, transparent: true, opacity, roughness: .2, metalness: 0, depthWrite: false, side: T.DoubleSide });
const field = (color = "#69e7ff", opacity = .55) => new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
function cylinder(g: T.Object3D, m: T.Material, r: number, h: number, x: number, y: number, z: number, name: string, segments = 16) {
  const o = mesh(new T.CylinderGeometry(r, r, h, segments), m, g, name); o.position.set(x, y, z); return o;
}
function flatRing(g: T.Object3D, m: T.Material, r: number, width: number, x: number, y: number, z: number, gap: number, name: string) {
  const shape = new T.Shape(), inner = r - width, a = .22;
  shape.absarc(0, 0, r, a, 2 * Math.PI - a, false);
  shape.lineTo(inner * Math.cos(a), -inner * Math.sin(a));
  shape.absarc(0, 0, inner, 2 * Math.PI - a, a, true); shape.closePath();
  const o = mesh(new T.ExtrudeGeometry(shape, { depth: .022, bevelEnabled: false, curveSegments: 18 }), m, g, name);
  o.position.set(x, y, z); o.rotation.z = gap; return o;
}
function substrate(g: T.Group, color = "#a8c3ce", width = 3.6, depth = 3.2) {
  return box(g, color === "#a8c3ce" || color === "#c1dce3" ? glass(color, .48) : solid(color), [width, .16, depth], [0, -.08, 0], "substrate");
}
/** Primary/secondary selectors color only their designated physical phase. */
export function createOpticalGeometry(p: LatticeOptions, software = false): T.Group | undefined {
  if (!ids.includes(p.kind)) return undefined;
  const g = new T.Group(); g.name = `optical-${p.kind}`;
  const u = norm(p), n = rows(p), v = variant(p), segments = software ? 10 : 16;
  const primary = solid(p.color, p.wire);
  const secondary = solid(p.secondaryColor ?? "#abbdc9", p.wire);
  const copper = primary, gold = solid("#bda04f"), dark = solid("#263745");
  const mark = (name: string, pos: number[]) => anchor(g, pos, name);
  if (p.kind === "negative-index") {
    substrate(g, "#304553", 4.1, 2.3);
    const cols = n + 2, step = 3.7 / cols, r = step * .29, w = r * (.10 + .19 * u);
    for (const z of [-.7, .7]) {
      box(g, secondary, [3.9, 1.4, .055], [0, .7, z], "dielectric-board");
      for (let i = 0; i < cols; i++) {
        const x = (i - (cols - 1) / 2) * step;
        flatRing(g, copper, r, w, x, .75, z + .028, v === 2 && i % 2 ? Math.PI : 0, "split-ring");
        if (v === 1) flatRing(g, copper, r * .65, w * .65, x, .75, z + .028, Math.PI, "inner-ring");
        box(g, copper, [w, 1.25, .022], [x - step * .41, .71, z + .039], "electric-wire");
      }
    }
    mark("functional-array", [0, .75, .74]); mark("control-feature", [.7, .75, .74]);
    g.userData.polarization = "Propagation +x; E parallel y wires; H normal to xy ring planes (+z).";
  } else if (p.kind === "epsilon-near-zero") {
    // Air occupies the open volume. Fixed broad dimension in z sets TE10 cutoff;
    // changing y height is a squeezing control, not a cutoff-frequency knob.
    const len = .5 * n + 1.4, width = 1.8, h = .22 + .55 * u, wall = .08;
    substrate(g, "#304553", len + .3, width + .4);
    box(g, copper, [len, wall, width + 2 * wall], [0, wall / 2, 0], "guide-floor");
    const roofs = glass(p.color, .23);
    const pieces: { x: number; l: number; h: number }[] = [{ x: -len / 2 + .35, l: .7, h: 1.05 }];
    for (let i = 0; i < n; i++) pieces.push({ x: -.25 * n + .25 + .5 * i, l: .5, h: h * (v === 1 ? .75 + .25 * (i % 2) : v === 2 ? .72 + .28 * Math.abs(2 * (i + .5) / n - 1) : 1) });
    pieces.push({ x: len / 2 - .35, l: .7, h: 1.05 });
    pieces.forEach((q, i) => {
      for (const sign of [-1, 1]) box(g, copper, [q.l, q.h + wall, wall], [q.x, wall + q.h / 2, sign * (width / 2 + wall / 2)], "guide-side-wall");
      box(g, roofs, [q.l, wall, width], [q.x, wall + q.h + wall / 2, 0], "transparent-copper-roof");
      if (i) { const prev = pieces[i - 1], delta = Math.abs(prev.h - q.h); if (delta > .001) box(g, copper, [wall, delta, width], [q.x - q.l / 2, wall + Math.min(q.h, prev.h) + delta / 2, 0], "transition-wall-above-aperture"); }
    });
    mark("functional-array", [0, .08 + h / 2, 0]); mark("control-feature", [0, .08 + h, -.9]);
    g.userData.channelHeight = h; g.userData.channelLength = len;
  } else if (p.kind === "photonic-bandgap") {
    substrate(g); const k = 2 * n + 3, step = 3.2 / k, r = step * (.16 + .17 * u);
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      if ((v === 1 && j === Math.floor(k / 2)) || (v === 2 && i === Math.floor(k / 2) && j === Math.floor(k / 2))) continue;
      cylinder(g, primary, r, .65, (i - (k - 1) / 2) * step, .325, (j - (k - 1) / 2) * step, "silicon-pillar", segments);
    }
    mark("functional-array", [0, .4, 0]); mark("control-feature", [1, .5, 1]);
  } else if (p.kind === "bound-state-continuum") {
    substrate(g); const k = n + 2, step = 3.1 / k, a = .03 + .3 * u;
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) for (const side of [-1, 1]) {
      const length = step * .68 * (v === 0 && side === 1 ? 1 - a : 1);
      const width = step * .18 * (v === 2 && side === 1 ? 1 - a : 1);
      const o = box(g, primary, [width, .28, length], [(i - (k - 1) / 2) * step + side * step * .18, .14, (j - (k - 1) / 2) * step], "asymmetric-resonator");
      o.rotation.y = v === 1 ? side * a : 0;
    }
    mark("functional-array", [0, .28, 0]); mark("control-feature", [.55, .28, .55]);
  } else if (p.kind === "phase-change") {
    substrate(g); const k = n + 2, step = 3.05 / k;
    // Heater and optical film are electrically isolated by an oxide layer.
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const x = (i - (k - 1) / 2) * step, z = (j - (k - 1) / 2) * step;
      box(g, dark, [step * .86, .025, step * .82], [x, .0125, z], "resistive-heater");
      box(g, solid("#d4e0e0"), [step * .86, .025, step * .82], [x, .0375, z], "heater-insulator");
      const share = v === 0 ? u : v === 1 ? ((i + j) % 2 ? u : .15 * u) : u * i / (k - 1);
      const state = primary.clone(); state.color.lerp(new T.Color("#1e2539"), share * .8);
      const pixel = box(g, state, [step * .72, .06, step * .72], [x, .08, z], "gst-pixel"); pixel.userData.crystallineShare = share;
      box(g, glass("#c6dee2", .18), [step * .8, .025, step * .8], [x, .1225, z], "pixel-cap");
    }
    for (const z of [-1.61, 1.61]) box(g, secondary, [3.25, .025, .12], [0, .0125, z], "heater-bus");
    for (let i = 0; i < k; i++) box(g, secondary, [.028, .02, 3.15], [(i - (k - 1) / 2) * step, .01, 0], "heater-feed");
    mark("functional-array", [0, .14, 0]); mark("control-feature", [0, .025, 1.61]);
  } else if (p.kind === "liquid-crystal") {
    substrate(g, "#c1dce3");
    box(g, glass("#6cd2cc", .22), [3.4, .028, 3], [0, .014, 0], "lower-transparent-electrode");
    box(g, glass(p.secondaryColor ?? "#a5caba", .10), [3.3, .68, 2.9], [0, .368, 0], "liquid-crystal-volume");
    const k = n + 2, step = 2.8 / k;
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const x = (i - (k - 1) / 2) * step, z = (j - (k - 1) / 2) * step;
      cylinder(g, primary, step * .22, .26, x, .158, z, "silicon-disk", segments);
      const a = u * Math.PI / 2, az = v === 0 ? 0 : v === 1 ? Math.PI / 4 : (j / (k - 1) - .5) * Math.PI;
      const d = new T.Vector3(Math.cos(a) * Math.cos(az), Math.sin(a), Math.cos(a) * Math.sin(az)).multiplyScalar(step * .2);
      const c = new T.Vector3(x, .49, z);
      const director = rod(g, field("#ffe0a0", .75), c.clone().sub(d).toArray(), c.clone().add(d).toArray(), .018, "director-symbol"); director.userData.explanatory = true;
    }
    box(g, glass("#6cd2cc", .18), [3.4, .028, 3], [0, .722, 0], "upper-transparent-electrode");
    box(g, glass("#d5e6ed", .15), [3.6, .10, 3.2], [0, .786, 0], "glass-window");
    for (const z of [-1.52, 1.52]) box(g, dark, [3.4, .736, .08], [0, .368, z], "cell-spacer-seal");
    for (const [x, y] of [[-1.73, .014], [1.73, .722]]) box(g, secondary, [.16, .028, .6], [x, y, 0], "electrode-contact");
    mark("functional-array", [0, .26, 0]); mark("control-feature", [.6, .49, .6]);
  } else if (p.kind === "huygens" || p.kind === "structural-color") {
    substrate(g); const k = n + 3, step = 3.1 / k;
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const x = (i - (k - 1) / 2) * step, z = (j - (k - 1) / 2) * step;
      const profile = p.kind === "huygens" ? (v === 1 ? i / (k - 1) : v === 2 ? Math.min(1, (x * x + z * z) / 3.5) : .5) : (v === 1 ? (i + j) % 2 : v === 2 ? i / (k - 1) : .5);
      const r = step * (.16 + .12 * u + (v ? .09 * profile : 0));
      cylinder(g, primary, r, p.kind === "huygens" ? .55 : .42, x, p.kind === "huygens" ? .275 : .21, z, p.kind === "huygens" ? "huygens-post" : "color-pillar", segments);
    }
    mark("functional-array", [0, .4, 0]); mark("control-feature", [.9, .4, .9]);
  } else if (p.kind === "graphene-absorber") {
    substrate(g, "#344553");
    box(g, gold, [3.5, .035, 3.1], [0, .0175, 0], "gold-reflector-backgate");
    box(g, secondary, [3.3, .18, 2.9], [0, .125, 0], "silicon-nitride-spacer");
    const k = n + 2, step = 2.5 / k, width = step * (.18 + .32 * u), y = .223;
    for (let i = 0; i < k; i++) {
      const z = (i - (k - 1) / 2) * step;
      if (v !== 2) box(g, primary, [2.95, .016, width], [0, y, z], "graphene-ribbon");
      if (v === 1) box(g, primary, [width, .016, 2.65], [z, y, 0], "cross-ribbon");
      if (v === 2) {
        box(g, primary, [2.95, .016, .025], [0, y, z], "graphene-contact-bridge");
        for (let j = 0; j < k; j++) cylinder(g, primary, width * .7, .016, (j - (k - 1) / 2) * step, y, z, "graphene-disk", segments);
      }
    }
    // Contact begins exactly on spacer; ribbons overlap contact edge.
    box(g, gold, [.16, .032, 2.7], [-1.48, .231, 0], "graphene-edge-contact");
    box(g, gold, [.10, .18, .45], [1.70, .125, 1.23], "backgate-contact-riser");
    box(g, gold, [.3, .032, .45], [1.64, .231, 1.23], "backgate-pad");
    mark("functional-array", [0, y, 0]); mark("control-feature", [-1.48, .25, .6]);
  } else if (p.kind === "space-time") {
    substrate(g, "#284c49", 3.8, 2.7); const k = n + 3, step = 3.3 / k;
    box(g, solid("#bb844d"), [3.7, .018, 2.6], [0, -.169, 0], "ground-plane");
    for (let i = 0; i < k; i++) {
      const x = (i - (k - 1) / 2) * step;
      for (const sign of [-1, 1]) box(g, copper, [step * .76, .025, .58], [x, .0125, sign * .37], "rf-copper-pad");
      box(g, dark, [step * .3, .1, .23], [x, .05, 0], "varactor");
      for (const sign of [-1, 1]) box(g, gold, [step * .24, .016, .13], [x, .008, sign * .14], "varactor-solder-terminal");
      box(g, copper, [.025, .016, .47], [x, .008, -.90], "bias-feed");
      const bias = box(g, field("#ffc87c", .32 + .38 * u), [step * .65, .014, .12 + .23 * u], [x, .047, -1.16], "bias-level-symbol"); bias.userData.phase = i / k;
    }
    box(g, copper, [3.5, .016, .08], [0, .008, -1.17], "bias-bus");
    mark("functional-array", [0, .07, 0]); mark("control-feature", [0, .03, -1.17]);
    g.userData.biasDirection = v === 2 ? -1 : v === 1 ? 1 : 0;
  }
  if (!g.getObjectByName("substrate")) mark("substrate", [0, -.1, 0]);
  g.userData.opticalKind = p.kind; g.userData.variant = v;
  return g;
}

type Path = { curve: T.CatmullRomCurve3; mesh: T.Mesh; packets: T.Mesh[]; phase: number; opacity: number; speed: number; };
function addPath(g: T.Group, points: number[][], color = "#69e7ff", opacity = .46, phase = 0, speed = .22): Path {
  const curve = new T.CatmullRomCurve3(points.map(a => new T.Vector3(...a as [number, number, number])));
  const m = field(color, opacity), line = mesh(new T.TubeGeometry(curve, 40, .012, 5, false), m, g, "explanatory-wave-path");
  line.castShadow = false;
  const packets = Array.from({ length: 3 }, () => { const o = mesh(new T.BoxGeometry(.13, .034, .034), field(color, .72), g, "wave-packet"); o.castShadow = false; return o; });
  return { curve, mesh: line, packets, phase, opacity, speed };
}
function advance(path: Path, time: number, strength = 1, reverse = false) {
  (path.mesh.material as T.MeshBasicMaterial).opacity = path.opacity * strength;
  path.packets.forEach((p, i) => {
    let t = ((time * path.speed + i / path.packets.length + path.phase) % 1 + 1) % 1; if (reverse) t = 1 - t;
    p.position.copy(path.curve.getPointAt(t)); p.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), path.curve.getTangentAt(t));
    (p.material as T.MeshBasicMaterial).opacity = .8 * strength * Math.sin(Math.PI * t);
  });
}
/** Fields share the specimen's coordinates and never recolor its material. */
export function createOpticalBehavior(p: LatticeOptions, lattice: T.Group): Behavior | undefined {
  if (!ids.includes(p.kind)) return undefined;
  const group = new T.Group(); group.name = `behavior-${p.kind}`;
  const paths: Path[] = [], u = norm(p), v = variant(p), n = rows(p);
  let label = "", custom = (_time: number) => {};
  const path = (pts: number[][], color?: string, opacity?: number, phase?: number, speed?: number) => { const q = addPath(group, pts, color, opacity, phase, speed); paths.push(q); return q; };
  if (p.kind === "negative-index") {
    for (let i = -1; i <= 1; i++) path([[-2.65, .6 + i * .23, 0], [-1.7, .75 + i * .23, 0], [1.7, .45 + i * .23, 0], [2.65, .6 + i * .23, 0]]);
    const phaseFronts = Array.from({ length: 5 }, (_, i) => { const o = box(group, field("#b0f4ff", .32), [.014, .65, .9], [0, .75, 0], "backward-phase-front"); o.userData.index = i; return o; });
    custom = t => phaseFronts.forEach((o, i) => { o.position.x = 1.55 - ((t * .42 + i * .62) % 3.1); });
    label = "Energy travels forward; phase travels backward in the designed microwave band. E: vertical wires. H: normal to rings.";
  } else if (p.kind === "epsilon-near-zero") {
    const len = Number(lattice.userData.channelLength ?? 3), h = Number(lattice.userData.channelHeight ?? .5);
    for (const z of [-.52, 0, .52]) path([[-len / 2 - .5, .48, z], [-len / 2 + .5, .48, z], [-len / 2 + .8, .08 + h * .32, z], [len / 2 - .8, .08 + h * .32, z], [len / 2 - .5, .48, z], [len / 2 + .5, .48, z]]);
    const front = box(group, field("#a4f4ff", .25), [Math.max(.25, len - 1.5), .015, 1.55], [0, .08 + h * .48, 0], "near-uniform-channel-phase");
    custom = t => { (front.material as T.MeshBasicMaterial).opacity = .12 + .2 * (.5 + .5 * Math.sin(t * 3)); };
    label = "Near TE10 cutoff: little phase accumulation through the air channel. Fixed broad width sets cutoff; height controls squeezing.";
  } else if (p.kind === "photonic-bandgap") {
    if (v === 0) { path([[-2.45, .32, 0], [-1.68, .32, 0], [-2.4, .32, .65]]); label = "Within a directional stop band, a periodic pillar array reflects the incident light."; }
    if (v === 1) { path([[-2.45, .32, 0], [-1.45, .32, 0], [1.45, .32, 0], [2.45, .32, 0]]); label = "A missing row can carry a defect mode through a frequency range blocked by the surrounding crystal."; }
    if (v === 2) {
      path([[-2.45, .32, 0], [-1.7, .32, 0], [-.7, .32, 0], [0, .32, 0]], "#69e7ff", .18, 0, .11);
      const radius = 3.2 / (2 * n + 3) * .48;
      const pts = Array.from({ length: 17 }, (_, i) => [radius * Math.cos(i * Math.PI / 8), .38, radius * Math.sin(i * Math.PI / 8)]);
      path(pts, "#a3efff", .75, 0, .34); label = "A missing pillar forms a localized cavity. Weak tunneling excites a narrow defect resonance; it is not a through-channel.";
    }
  } else if (p.kind === "bound-state-continuum") {
    path([[-1.8, 2.3, 0], [-.5, .6, 0], [0, .3, 0]], undefined, .35);
    const gap = .1 + u * .32;
    for (const x of [-.32, .32]) path([[x, .35, -.24], [x + .13, .5, 0], [x, .35, .24], [x - .13, .22, 0], [x, .35, -.24]], "#aaf5ff", .65, x, .5);
    const leak = path([[0, .38, 0], [.6, 1.2, 0], [1.6, 2.3, 0]], undefined, gap, 0, .12 + .16 * u);
    custom = t => advance(leak, t, .25 + .65 * u);
    label = "Small asymmetry opens a weak radiation channel: a narrow quasi-BIC resonance. More asymmetry increases radiative leakage.";
  } else if (p.kind === "phase-change") {
    const outputs: Path[] = [];
    for (let i = -2; i <= 2; i++) {
      path([[i * .42 - .65, 2.1, 0], [i * .42, .17, 0]], undefined, .35, i * .02);
      outputs.push(path([[i * .42, .17, 0], [i * .42 + (v === 2 ? .8 * u : .65), 2.1, 0]], undefined, .5, (v === 2 ? i * .09 * u : u * .12)));
    }
    const heat = box(group, field("#ffad65", .1), [3.15, .012, 3.0], [0, .031, 0], "heater-pulse");
    custom = t => { (heat.material as T.MeshBasicMaterial).opacity = Math.max(0, Math.sin(t * 1.1)) ** 12 * .5; outputs.forEach((q, i) => advance(q, t, .25 + .65 * (v === 1 && i % 2 ? u * .15 : 1 - .65 * u))); };
    label = v === 2 ? "Heaters write a spatial phase gradient; the programmed reflected beam can change direction." : "Heaters set a persistent optical state. Uniform switching changes reflection and phase, not beam direction.";
  } else if (p.kind === "liquid-crystal") {
    for (const x of [-.7, 0, .7]) path([[x, 2.15, 0], [x, .85, 0], [x, .32, 0], [x, -.8, 0]], undefined, .35, u * .2);
    const output = tube(group, field("#c0f4ff", .8), [[-.4, -.65, 0], [.4, -.65, 0]], .018, false, "transmitted-polarization-symbol");
    custom = t => { output.rotation.y = u * Math.PI / 2 + (v === 2 ? .35 : 0); (output.material as T.MeshBasicMaterial).opacity = .45 + .25 * Math.sin(t * 3); };
    label = "Voltage rotates the liquid-crystal director around silicon disks, shifting their resonance and changing transmitted phase or polarization.";
  } else if (p.kind === "huygens") {
    for (let i = -3; i <= 3; i++) {
      const x = i * .38;
      const out = v === 2 ? 0 : x + (v === 1 ? .85 * (.5 + u) : 0);
      path([[x, 2.25, 0], [x, .58, 0], [out, -1.45, 0]], undefined, .4, v ? Math.abs(i) * .06 : 0);
    }
    label = v === 0 ? "Balanced electric and magnetic scattering can suppress reflection near a designed frequency." : v === 1 ? "A post-size gradient imposes a phase ramp; transmitted wave packets steer together." : "A radial post-size profile supplies different phase delays that bring light to a common focus.";
  } else if (p.kind === "structural-color") {
    const colored: Path[] = [];
    for (let i = -2; i <= 2; i++) {
      path([[i * .43 - .85, 2.2, 0], [i * .43, .43, 0]], "#d4f7ff", .25);
      const hue = new T.Color().setHSL((.62 - .5 * u + (v === 1 ? (i % 2) * .13 : v === 2 ? i * .07 : 0) + 1) % 1, .85, .63);
      colored.push(path([[i * .43, .43, 0], [i * .43 + .85, 2.2, 0]], `#${hue.getHexString()}`, .64));
    }
    label = "White illumination excites size-dependent resonances. Colored return paths show a qualitative spectral trend, not a calculated color prediction.";
  } else if (p.kind === "graphene-absorber") {
    for (const x of [-.7, 0, .7]) {
      path([[x - .5, 2.2, 0], [x, .23, 0]], undefined, .5);
      path([[x, .23, 0], [x + .55, 2.2, 0]], undefined, .09 + .11 * (1 - u));
      path([[x - .12, .26, -.2], [x, .29, 0], [x + .12, .26, .2]], "#9cf0ff", .75, 0, .65);
    }
    const heat = box(group, field("#ffbf84", .08), [2.8, .012, 2.3], [0, .25, 0], "absorbed-energy-symbol");
    custom = t => { (heat.material as T.MeshBasicMaterial).opacity = .06 + .24 * (.5 + .5 * Math.sin(t * 2)); };
    label = "At a matched infrared resonance, graphene confines and dissipates light; the gold mirror prevents transmission. Gating shifts the resonance.";
  } else if (p.kind === "space-time") {
    path([[-2.5, .6, 0], [-1.4, .25, 0], [1.3, .25, 0], [2.5, .65, v === 0 ? 0 : .5]], undefined, .55, 0, .22);
    const reverse = path([[2.5, .65, v === 0 ? 0 : .5], [1.3, .25, 0], [-1.3, .25, v === 0 ? 0 : v === 2 ? .55 : -.55], [-2.5, .65, v === 0 ? 0 : v === 2 ? .8 : -.8]], "#b7f6ff", .35, .5, .22);
    const indicators: T.Mesh[] = []; lattice.traverse(o => { if (o instanceof T.Mesh && o.name === "bias-level-symbol") indicators.push(o); });
    custom = t => { indicators.forEach((o, i) => { (o.material as T.MeshBasicMaterial).opacity = v === 0 ? .3 + .35 * u : .12 + (.25 + .4 * u) * (.5 + .5 * Math.sin(t * 3 - (v === 2 ? -1 : 1) * i * Math.PI / 2)); }); advance(reverse, t, 1); };
    label = v === 0 ? "Static bias: the reciprocal reference. Swap source and receiver to recover the same channel." : "A traveling electrical bias changes RF scattering in space and time, so reversed paths can differ. This implementation needs modulation power.";
  }
  return { group, camera: [10, 7, 11], target: [0, .35, 0], update(time) { paths.forEach(q => advance(q, time)); custom(time); return label; } };
}

/** A common optical-table layout carries family-specific specimen, excitation,
 * receiver and control hardware; every physical component has a support. */
export function createOpticalApplication(p: LatticeOptions, lattice: T.Group): Application | undefined {
  if (!ids.includes(p.kind)) return undefined;
  const group = new T.Group(); group.name = `application-${p.kind}`;
  const dark = solid("#223440"), metal = solid("#91a3ae"), ivory = solid("#d3e0e2");
  box(group, dark, [6.8, .18, 3.8], [0, -1.06, 0], "optical-table");
  for (const x of [-2.8, 2.8]) for (const z of [-1.35, 1.35]) cylinder(group, metal, .09, .5, x, -1.4, z, "table-leg");
  const sample = new T.Group(); group.add(sample); sample.scale.setScalar(.52); sample.position.set(0, -.16, 0); sample.add(lattice);
  // Substrate bottom -.16 * .52 + -.16 = -.2432, exactly on holder top.
  box(group, ivory, [2.3, .10, 1.85], [0, -.2932, 0], "sample-holder");
  cylinder(group, metal, .14, .6268, 0, -.6566, 0, "sample-post");
  box(group, metal, [.85, .08, .75], [0, -.93, 0], "sample-foot");
  const microwave = ["negative-index", "epsilon-near-zero", "space-time"].includes(p.kind);
  const inplane = microwave || p.kind === "photonic-bandgap";
  const reflective = ["phase-change", "structural-color", "graphene-absorber"].includes(p.kind);
  const beamY = p.kind === "negative-index" ? .23 : p.kind === "epsilon-near-zero" ? .0896 : p.kind === "photonic-bandgap" ? .0064 : -.03;
  const sourcePos = inplane ? [-2.5, beamY, 0] : [-1.6, 1.1, 0];
  const detectorPos = inplane ? [2.5, beamY, 0] : reflective ? [1.6, 1.1, 0] : [1.6, -.42, 0];
  function instrument(pos: number[], name: string, isSource: boolean) {
    const unit = new T.Group(); unit.position.set(...pos as [number, number, number]); group.add(unit); unit.name = name;
    box(unit, isSource ? dark : ivory, [.64, .40, .60], [0, 0, 0], `${name}-body`);
    const axis = new T.Vector3(-pos[0], (inplane ? beamY : 0) - pos[1], -pos[2]).normalize();
    const lens = cylinder(unit, microwave ? metal : glass("#75d7f0", .55), .18, .12, 0, 0, 0, `${name}-aperture`);
    lens.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), axis); lens.position.copy(axis.multiplyScalar(.36));
    const bottom = pos[1] - .2;
    cylinder(group, metal, .075, bottom + .89, pos[0], (bottom - .89) / 2, pos[2], `${name}-post`);
    box(group, metal, [.75, .08, .65], [pos[0], -.93, pos[2]], `${name}-foot`);
    return unit;
  }
  const source = instrument(sourcePos, microwave ? "rf-source" : "light-source", true);
  const detector = instrument(detectorPos, microwave ? "rf-receiver" : "optical-detector", false);
  // The lower detector uses an open sample-holder slot; its beam is oblique.
  if (!inplane && !reflective) {
    group.remove(group.getObjectByName("sample-holder")!);
    for (const z of [-.78, .78]) box(group, ivory, [2.3, .10, .3], [0, -.2932, z], "sample-holder-rail");
    for (const x of [-1.07, 1.07]) box(group, ivory, [.16, .10, 1.56], [x, -.2932, 0], "sample-holder-end");
  }
  const controller = box(group, dark, [1.2, .30, .60], [0, -.82, -1.44], "readout-controller");
  box(group, field("#80e5ed", .8), [.8, .06, .025], [0, -.76, -1.128], "readout-screen");
  tube(group, metal, [[sourcePos[0], sourcePos[1] - .18, -.25], [sourcePos[0], -.88, -.5], [-2.65, -.88, -1.45], [-.6, -.88, -1.45]], .024, false, "source-cable");
  tube(group, metal, [[detectorPos[0], detectorPos[1] - .18, -.25], [detectorPos[0], -.88, -.5], [2.65, -.88, -1.45], [.6, -.88, -1.45]], .024, false, "receiver-cable");
  const beam = new T.Group(); group.add(beam);
  const halfSample = p.kind === "epsilon-near-zero" ? Number(lattice.userData.channelLength) * .26 : 1.0;
  const hit = inplane ? [-halfSample, beamY, 0] : [0, .04, 0];
  const exit = inplane ? [halfSample, beamY, 0] : hit;
  const incoming = addPath(beam, [sourcePos, hit], "#69e7ff", .4, 0, .28);
  const outgoing = addPath(beam, [exit, detectorPos], "#69e7ff", p.kind === "graphene-absorber" ? .10 : .4, .4, .28);
  // In-plane specimen phenomena remain visible at their own physical scale.
  const behavior = createOpticalBehavior(p, lattice)!;
  sample.add(behavior.group);
  const labels: Record<string, [string, string, string, string]> = {
    "negative-index": ["Microwave source", "Copper rings + wires", "Phase receiver", "Dielectric support"],
    "epsilon-near-zero": ["Microwave feed", "Air-filled throat", "Output receiver", "Copper guide wall"],
    "photonic-bandgap": ["Edge light input", "Silicon pillar crystal", "Output detector", "Silica support"],
    "bound-state-continuum": ["Tunable light source", "Asymmetric pairs", "Resonance detector", "Silica support"],
    "phase-change": ["Probe light", "GST optical pixels", "Reflected signal", "Heater controller"],
    "liquid-crystal": ["Polarized light", "Disks inside LC", "Optical detector", "Voltage controller"],
    "huygens": ["Collimated light", "Silicon post field", "Wavefront detector", "Silica support"],
    "structural-color": ["White light", "Color pillar array", "Spectrum detector", "Silica support"],
    "graphene-absorber": ["Infrared light", "Graphene pattern", "Reflected signal", "Gate controller"],
    "space-time": ["RF source", "Loaded copper cells", "RF receiver", "Bias waveform unit"],
  };
  if (["phase-change", "liquid-crystal", "graphene-absorber", "space-time"].includes(p.kind)) {
    const controlTarget = lattice.getObjectByName(p.kind === "liquid-crystal" ? "electrode-contact" : p.kind === "graphene-absorber" ? "graphene-edge-contact" : "control-feature")!;
    group.updateMatrixWorld(true);
    const c = controlTarget.getWorldPosition(new T.Vector3());
    tube(group, metal, [[.25, -.67, -1.44], [1.35, -.6, -1.15], [1.35, c.y, c.z], c.toArray()], .018, false, "specimen-control-cable");
    if (p.kind === "graphene-absorber") {
      const q = lattice.getObjectByName("backgate-pad")!.getWorldPosition(new T.Vector3());
      tube(group, metal, [[-.25, -.67, -1.44], [1.55, -.6, -.9], [1.55, q.y, q.z], q.toArray()], .018, false, "backgate-return-cable");
    }
  }
  const names = labels[p.kind]; const callouts: Callout[] = [
    { label: names[0], anchor: anchor(source, [0, .2, 0], "source-callout"), side: "left", slot: 0 },
    { label: names[1], anchor: lattice.getObjectByName("functional-array")!, side: "left", slot: 1 },
    { label: names[2], anchor: anchor(detector, [0, .2, 0], "detector-callout"), side: "right", slot: 0 },
    { label: names[3], anchor: ["phase-change", "liquid-crystal", "graphene-absorber", "space-time"].includes(p.kind) ? anchor(controller, [0, .15, 0], "controller-callout") : lattice.getObjectByName("substrate")!, side: "right", slot: 1 },
  ];
  return { group, callouts, camera: [10, 7, 11], target: [0, .1, 0], update(t, _e) {
    advance(incoming, t); advance(outgoing, t, p.kind === "graphene-absorber" ? .3 : p.kind === "photonic-bandgap" && variant(p) !== 1 ? .08 : p.kind === "phase-change" ? .35 + .6 * (1 - norm(p)) : 1);
    return behavior.update(t);
  } };
}
