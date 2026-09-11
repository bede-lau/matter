import assert from "node:assert/strict";
import * as T from "three";
import { createApplication } from "../components/matter/models/Applications";
import { kneeFor, buildAthlete } from "../components/matter/models/Athlete";
import { warpLattice } from "../components/matter/models/primitives";
import { createLattice } from "../lib/matter/geometry";
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
    console.log(
      "PASS",
      kind,
      variant + 1,
      a.callouts.length + " component anchors",
    );
  }
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
