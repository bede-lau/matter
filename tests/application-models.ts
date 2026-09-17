import assert from "node:assert/strict";
import * as T from "three";
import { createApplication } from "../components/matter/models/Applications";
import { kneeFor, buildAthlete } from "../components/matter/models/Athlete";
import { warpLattice } from "../components/matter/models/primitives";
import { createLattice } from "../lib/matter/geometry";
import { createBehavior } from "../components/matter/models/Behaviors";
import { bases, families } from "../lib/matter/catalog";
import { materialCards, structureCards } from "../lib/matter/learning";
import glossary from "../lib/matter/glossary.json";
for (const kind of [
  "gyroid",
  "octet",
  "auxetic",
  "kelvin",
  "honeycomb",
  "resonator",
  "metalens",
  "cloak",
  "membrane-absorber",
  "thermal-cloak",
  "topological",
  "flux",
  "hyperbolic",
  "chiral",
  "labyrinth",
  "radiative-cooler",
  "seismic",
  "water-wave",
])
  for (let variant = 0; variant < 3; variant++) {
    const root = new T.Group();
    const geo = new T.BoxGeometry(3.5, 3.5, 3.5, 4, 4, 4);
    root.add(new T.Mesh(geo, new T.MeshStandardMaterial()));
    const a = createApplication(kind, variant, root, "#c2ef72");
    assert.ok(a.callouts.length >= 4);
    assert.ok(a.group.children.length > 0);
    for (const explode of [0, 0.35, 1])
      for (const t of [0, 0.1, 0.25, 0.38, 0.5, 0.75, 0.95, 1.2]) {
        a.update(t, explode);
        a.group.updateMatrixWorld(true);
        a.group.traverse((o) => {
          assert.ok(
            o.matrixWorld.elements.every(Number.isFinite),
            kind + " finite transform",
          );
          if (o instanceof T.Mesh) {
            const pos = o.geometry.attributes.position;
            assert.ok(
              Array.from(pos.array).every(Number.isFinite),
              kind + " finite vertices",
            );
          }
        });
      }
    const box = new T.Box3().setFromObject(a.group),
      extent = box.getSize(new T.Vector3());
    assert.ok(
      extent.x < 15 && extent.y < 15 && extent.z < 15,
      kind + " bounded scene",
    );
    if (kind === "hyperbolic")
      for (const marker of a.group.getObjectsByProperty("name", "hyperlens-field-marker") as T.Mesh[])
        assert.ok(marker.scale.length() < 0.09, "hyperbolic optical markers stay fine, not disc-sized");
    if (kind === "chiral")
      for (const marker of [
        a.group.getObjectByName("preferred-polarization-marker"),
        a.group.getObjectByName("reduced-polarization-marker"),
      ].filter(Boolean) as T.Mesh[])
        assert.ok(marker.scale.length() < 0.09, "polarization markers stay small relative to the helix array");
    if (kind === "labyrinth")
      assert.ok(a.group.getObjectsByProperty("name", "labyrinth-pressure-band").length >= 12, "labyrinth scene shows a sequence of sound-pressure wavefronts");
    if (kind === "radiative-cooler") {
      assert.equal(a.group.getObjectsByProperty("name", "reflected-sunlight").length, 8, "cooling scene has four clean incident-and-reflected sunlight paths");
      assert.equal(a.group.getObjectsByProperty("name", "emitted-infrared").length, 4, "cooling scene has four clean infrared paths");
    }
    if (kind === "labyrinth")
      assert.equal(a.group.getObjectsByProperty("name", "labyrinth-direct-reference").length, 0, "labyrinth scene has no off-panel comparison beam");
    if (kind === "seismic")
      assert.ok(a.group.getObjectsByProperty("name", "seismic-wavefront").length >= 8, "seismic scene shows a moving ground-wave train");
    if (kind === "water-wave") {
      assert.ok(a.group.getObjectsByProperty("name", "water-wave-front").length >= 11, "water-wave scene shows a dense set of surface ripples");
      assert.equal(a.group.getObjectsByProperty("name", "water-tank-wall").length, 4, "water-wave scene includes a clear tank boundary");
    }
    console.log(
      "PASS",
      kind,
      variant + 1,
      a.callouts.length + " component anchors",
    );
  }

assert.equal(families.length, 48, "the atlas contains 48 material families");
assert.equal(new Set(families.map((family) => family.id)).size, families.length, "family IDs stay unique");
families.forEach((family) => {
  assert.equal(family.variants.length, 3, family.id + " has three variants");
  assert.equal(family.variantLessons.length, family.variants.length, family.id + " variants have matching lessons");
  assert.ok(structureCards.some((card) => card.id === family.id), family.id + " has a field-guide reference");
  assert.ok(family.allowedBase?.includes(family.defaultBase ?? -1), family.id + " default base is permitted");
  assert.ok((family.defaultBase ?? -1) >= 0 && (family.defaultBase ?? -1) < bases.length, family.id + " base exists");
  if (family.allowedSecondary?.length) {
    assert.ok(family.allowedSecondary.includes(family.defaultSecondary ?? -1), family.id + " default secondary is permitted");
    assert.ok(Boolean(family.secondaryRole), family.id + " declares the secondary role");
  }
});
for (const card of [...materialCards, ...structureCards]) {
  const source = new URL(card.sourceUrl);
  assert.equal(source.protocol, "https:", card.id + " field-guide source uses HTTPS");
  assert.ok(source.hostname.length > 0, card.id + " field-guide source has a hostname");
  assert.ok(card.sourceLabel.trim().length > 0, card.id + " field-guide source has an accessible label");
}
families.forEach((family) => {
  const source = new URL(family.source);
  assert.equal(source.protocol, "https:", family.id + " lesson source uses HTTPS");
  assert.ok(source.hostname.length > 0, family.id + " lesson source has a hostname");
});
for (const requiredTerm of [
  "Hyperbolic multilayer",
  "Chirality",
  "Space coiling",
  "Radiative cooling",
  "Seismic metawedge",
  "Bathymetry",
])
  assert.ok(glossary.some((entry) => entry.term === requiredTerm), requiredTerm + " has a quick glossary definition");

for (const kind of [
  "hyperbolic",
  "chiral",
  "labyrinth",
  "radiative-cooler",
  "seismic",
  "water-wave",
])
  for (let variant = 0; variant < 3; variant++)
    for (const [count, thickness] of [
      [1, 0.3],
      [3, 0.8],
      [5, 1.6],
    ] as const) {
      const root = createLattice({
        kind,
        variant,
        count,
        thickness,
        color: "#d4e0eb",
        secondaryColor: "#f8fbfd",
      });
      root.updateMatrixWorld(true);
      const bounds = new T.Box3().setFromObject(root);
      assert.ok(bounds.getSize(new T.Vector3()).length() > 0.2, kind + " builds visible geometry");
      assert.ok(bounds.getSize(new T.Vector3()).length() < 12, kind + " stays within the scene budget");
      const behavior = createBehavior({ kind, variant, count, thickness, color: "#d4e0eb" }, root);
      assert.ok(behavior, kind + " has a dedicated behavior animation");
      behavior?.update(0.2);
      behavior?.update(1.1);
      root.traverse((object) =>
        assert.ok(object.matrix.elements.every(Number.isFinite), kind + " behavior keeps transforms finite"),
      );
      if (kind === "labyrinth") {
        const base = root.getObjectByName("labyrinth-base")!;
        for (const divider of root.getObjectsByProperty("name", "labyrinth-divider") as T.Mesh[]) {
          const baseBounds = new T.Box3().setFromObject(base);
          const dividerBounds = new T.Box3().setFromObject(divider);
          assert.ok(Math.abs(dividerBounds.min.y - baseBounds.max.y) < 1e-6, "labyrinth divider sits on the base");
        }
      }
      if (kind === "radiative-cooler") {
        const filmBounds = new T.Box3().setFromObject(root.getObjectByName("radiative-polymer-film")!);
        const spheres = new T.Box3().setFromObject(root.getObjectByName("radiative-silica-microsphere")!);
        assert.ok(spheres.min.y >= filmBounds.min.y - 1e-6 && spheres.max.y <= filmBounds.max.y + 1e-6, "microspheres stay inside the polymer film");
        const application = createApplication(kind, variant, root, "#d4e0eb", count, thickness);
        application.update(0.7, 0);
        application.group.updateMatrixWorld(true);
        const appliedFilm = new T.Box3().setFromObject(application.group.getObjectByName("radiative-polymer-film")!);
        const sunlight = new T.Box3().setFromObject(application.group.getObjectByName("reflected-sunlight")!);
        const infrared = new T.Box3().setFromObject(application.group.getObjectByName("emitted-infrared")!);
        assert.ok(Math.abs(sunlight.min.y - appliedFilm.max.y) < 0.025, `sunlight path touches the polymer-film surface (${sunlight.min.y}, ${appliedFilm.max.y})`);
        assert.ok(Math.abs(infrared.min.y - appliedFilm.max.y) < 0.025, `infrared path starts at the polymer-film surface (${infrared.min.y}, ${appliedFilm.max.y})`);
      }
      if (kind === "seismic") {
        const groundBounds = new T.Box3().setFromObject(root.getObjectByName("seismic-ground-plate")!);
        const feet = root.getObjectsByProperty("name", "seismic-anchor-foot") as T.Mesh[];
        const pivots = root.getObjectsByProperty("name", "seismic-resonator-pivot") as T.Group[];
        assert.equal(feet.length, pivots.length, "every seismic rod has an anchor foot");
        for (const foot of feet) {
          const footBounds = new T.Box3().setFromObject(foot);
          assert.ok(Math.abs(footBounds.min.y - groundBounds.max.y) < 1e-6, "seismic anchor foot meets the ground surface");
        }
        for (const pivot of pivots)
          assert.ok(pivot.position.y > groundBounds.max.y, "seismic rod pivots sit on their visible anchor foot");
      }
      if (kind === "water-wave") {
        const floorBounds = new T.Box3().setFromObject(root.getObjectByName("water-tank-floor")!);
        for (const plate of root.getObjectsByProperty("name", "water-wave-plate") as T.Mesh[]) {
          const plateBounds = new T.Box3().setFromObject(plate);
          assert.ok(Math.abs(plateBounds.min.y - floorBounds.max.y) < 1e-6, "water-wave plates meet the tank floor");
        }
      }
    }
console.log("PASS: advanced-family materials, glossary coverage, field-specific motion and support-surface contacts");
for (let i = 0; i <= 100; i++) {
  const hip = new T.Vector3(0, 1.5, 0.17),
    ankle = new T.Vector3(-0.5 + i / 100, 0.135, 0.17),
    knee = kneeFor(hip, ankle);
  assert.ok(Math.abs(hip.distanceTo(knee) - 0.76) < 1e-8);
  assert.ok(Math.abs(ankle.distanceTo(knee) - 0.74) < 1e-8);
  assert.ok(knee.x > Math.min(hip.x, ankle.x));
}
console.log(
  "PASS: two-link leg lengths and forward knee bend across contact phase",
);

const athlete = buildAthlete("#c2ef72");
const shoes = athlete.group.getObjectsByProperty("name", "athletic-shoe");
assert.equal(shoes.length, 2, "runner has two shoes");
for (let i = 0; i < 240; i++) {
  const cycle = i / 240;
  athlete.update(cycle / 1.28);
  athlete.group.updateMatrixWorld(true);
  for (const name of ["upper-arm", "forearm"])
    for (const limb of athlete.group.getObjectsByProperty("name", name))
      assert.ok(
        Math.abs(limb.scale.y - (name === "upper-arm" ? 0.44 : 0.32)) < 1e-9,
        "arm segment length stays anatomical",
      );
  shoes.forEach((shoe, side) => {
    const sole = shoe.getObjectByName("rubber-outsole") as T.Mesh;
    const pos = sole.geometry.attributes.position;
    let lowest = Infinity;
    const v = new T.Vector3();
    for (let j = 0; j < pos.count; j++) {
      v.fromBufferAttribute(pos, j).applyMatrix4(sole.matrixWorld);
      lowest = Math.min(lowest, v.y);
    }
    const phase = (cycle + side * 0.5) % 1;
    assert.ok(lowest >= -1e-7, "outsole does not penetrate ground");
    if (phase < 0.36)
      assert.ok(Math.abs(lowest) < 1e-7, "stance outsole contacts ground");
  });
}
for (const phase of [0.36, 1]) {
  athlete.update((phase - 1e-7) / 1.28);
  const before = shoes.map((s) => ({
    p: s.position.clone(),
    q: s.quaternion.clone(),
  }));
  athlete.update((phase + 1e-7) / 1.28);
  shoes.forEach((s, i) => {
    assert.ok(
      before[i].p.distanceTo(s.position) < 0.00001,
      "shoe position is continuous at contact boundary",
    );
    assert.ok(
      before[i].q.angleTo(s.quaternion) < 0.00001,
      "shoe pitch is continuous at contact boundary",
    );
  });
}
console.log(
  "PASS: fixed arm lengths, outsole-ground contact and continuous toe-off over 240 gait samples",
);

// Regression checks for the v3 gravity and equipment fit fixes.
import {
  sampleDrop,
  DROP_GRAVITY,
  DROP_HEIGHT,
  DROP_RESTITUTION,
} from "../components/matter/models/Helmet";
import { nearestDesigns, type ResearchRow } from "../lib/matter/research";
const impactTime = Math.sqrt((2 * DROP_HEIGHT) / DROP_GRAVITY);
for (let i = 0; i < 100; i++) {
  const t = (i / 100) * impactTime,
    result = sampleDrop(t);
  assert.ok(
    Math.abs(result.height - (DROP_HEIGHT - 0.5 * DROP_GRAVITY * t * t)) <
      1e-10,
    "free fall obeys constant gravity",
  );
  assert.ok(
    Math.abs(result.velocity + DROP_GRAVITY * t) < 1e-10,
    "free-fall velocity accelerates downward",
  );
}
const reboundSpeed =
  Math.sqrt(2 * DROP_GRAVITY * DROP_HEIGHT) * DROP_RESTITUTION;
assert.ok(
  Math.abs(
    sampleDrop(impactTime + reboundSpeed / DROP_GRAVITY).height -
      DROP_HEIGHT * DROP_RESTITUTION ** 2,
  ) < 1e-10,
  "rebound loses energy",
);
for (let i = 0; i < 2000; i++)
  assert.ok(
    sampleDrop(i / 2000).height >= 0,
    "ball never penetrates contact surface",
  );
assert.equal(sampleDrop(1).height, 0, "ball settles at rest");
const fitRoot = new T.Group();
fitRoot.add(
  new T.Mesh(new T.BoxGeometry(3.5, 3.5, 3.5), new T.MeshStandardMaterial()),
);
const brace = createApplication("auxetic", 0, fitRoot, "#ffae82");
for (let i = 0; i < 120; i++) {
  brace.update(i / 12, 0);
  brace.group.updateMatrixWorld(true);
  const ankle = brace.group
    .getObjectByName("ankle-centre")!
    .getWorldPosition(new T.Vector3());
  const collar = brace.group
    .getObjectByName("shoe-collar-centre")!
    .getWorldPosition(new T.Vector3());
  assert.ok(
    ankle.distanceTo(collar) < 1e-10,
    "ankle remains seated at shoe collar throughout knee flexion",
  );
}
const tailRoot = new T.Group();
tailRoot.add(
  new T.Mesh(new T.BoxGeometry(3.5, 3.5, 3.5), new T.MeshStandardMaterial()),
);
const aircraft = createApplication("octet", 0, tailRoot, "#86caff");
for (const tail of aircraft.group.getObjectsByProperty(
  "name",
  "horizontal-tail",
) as T.Mesh[]) {
  const pos = tail.geometry.attributes.position;
  assert.ok(
    pos.getX(42) < pos.getX(0),
    "horizontal tail tips sweep aft, away from +X nose",
  );
}

const opticalRoot = createLattice({
  kind: "metalens",
  variant: 1,
  count: 3,
  thickness: 0.8,
  color: "#e7b5ff",
});
const optical = createApplication("metalens", 1, opticalRoot, "#e7b5ff");
optical.group.updateMatrixWorld(true);
const waferBounds = new T.Box3().setFromObject(
  optical.group.getObjectByName("metalens-wafer")!,
);
const benchBounds = new T.Box3().setFromObject(
  optical.group.getObjectByName("optics-bench")!,
);
const mountBounds = new T.Box3().setFromObject(
  optical.group.getObjectByName("wafer-mount")!,
);
assert.ok(
  mountBounds.min.y >= benchBounds.max.y - 1e-6 &&
    mountBounds.min.y - benchBounds.max.y < 0.01,
  "metalens mounting rim meets the bench without penetrating it",
);
assert.ok(
  waferBounds.min.y - benchBounds.max.y > 0.12,
  "metalens wafer body remains raised above the bench",
);

const topologicalRoot = createLattice({
  kind: "topological",
  variant: 0,
  count: 3,
  thickness: 0.8,
  color: "#97b3cf",
});
const topological = createApplication(
  "topological",
  0,
  topologicalRoot,
  "#97b3cf",
);
topological.group.updateMatrixWorld(true);
const postFieldBounds = new T.Box3().setFromObject(
  topological.group.getObjectByName("topological-post-field")!,
);
const chipBounds = new T.Box3().setFromObject(
  topological.group.getObjectByName("photonic-chip")!,
);
assert.ok(
  Math.abs(postFieldBounds.min.y - chipBounds.max.y) < 1e-6,
  "topological posts start on the chip surface",
);
console.log("PASS: optical wafer rim and topological posts seat on their support surfaces");
let seed = 414;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const queryRows: ResearchRow[] = Array.from({ length: 2500 }, (_, i) => [
  String(i),
  Math.floor(random() * 2000),
  Math.floor(random() * 500),
]);
for (let i = 0; i < 150; i++) {
  const target = Math.round(random() * 2000),
    width = Math.round(random() * 500);
  const expected = queryRows
    .filter((r) => r[2] >= width)
    .sort((a, b) => Math.abs(a[1] - target) - Math.abs(b[1] - target))
    .slice(0, 5);
  assert.deepEqual(
    nearestDesigns(queryRows, target, width),
    expected,
    "fast lookup preserves exact ranking and ties",
  );
}
console.log(
  "PASS: ballistic drop, dissipative rebound, collision bounds, brace/shoe fit, aft-swept tail and stable exact nearest matches",
);

// A secondary material must change the rendered lattice, not only a number in
// the estimate panel. The product warp must keep the phase colours as well.
const singlePhase = createLattice({
  kind: "octet",
  variant: 0,
  count: 2,
  thickness: 0.8,
  color: "#c2ef72",
  secondaryColor: "#e6e5de",
  blend: 0,
});
const singleStruts = singlePhase.children.find(
  (o): o is T.InstancedMesh => o instanceof T.InstancedMesh,
)!;
assert.equal(singleStruts.instanceColor, null, "single phase has no phase map");
const twoPhase = createLattice({
  kind: "octet",
  variant: 0,
  count: 3,
  thickness: 0.8,
  color: "#c2ef72",
  secondaryColor: "#e6e5de",
  blend: 0.45,
});
const phaseStruts = twoPhase.children.find(
  (o): o is T.InstancedMesh => o instanceof T.InstancedMesh,
)!;
assert.ok(phaseStruts.instanceColor, "two-phase view creates per-strut colours");
const phaseColours = new Set<string>();
const sampledColor = new T.Color();
for (let i = 0; i < phaseStruts.count; i++) {
  phaseStruts.getColorAt(i, sampledColor);
  phaseColours.add(sampledColor.getHexString());
}
assert.ok(phaseColours.size >= 2, "two-phase view visibly contains both phases");
const curvedPhase = warpLattice(twoPhase, (v) => v);
const curvedMesh = curvedPhase.getObjectByName("curved-cellular-liner") as T.Mesh;
assert.ok(
  curvedMesh.geometry.getAttribute("color"),
  "product-shaped lattice keeps its phase allocation",
);
const softwareGyroid = createLattice(
  {
    kind: "gyroid",
    variant: 0,
    count: 3,
    thickness: 0.8,
    color: "#c2ef72",
  },
  true,
);
const gyroidSurface = softwareGyroid.children[0] as T.Mesh;
assert.ok(
  gyroidSurface.geometry.getAttribute("position").count > 9 &&
    gyroidSurface.geometry.drawRange.count > 9,
  "software gyroid has a non-empty surface",
);
console.log("PASS: visible secondary-phase allocation survives product shaping");

import "./expansion-models";
