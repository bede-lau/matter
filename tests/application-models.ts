import assert from "node:assert/strict";
import * as T from "three";
import { createApplication } from "../components/matter/models/Applications";
import { kneeFor, buildAthlete } from "../components/matter/models/Athlete";
for (const kind of [
  "gyroid",
  "octet",
  "auxetic",
  "kelvin",
  "honeycomb",
  "resonator",
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
