import assert from 'node:assert/strict';
import * as T from 'three';
import { createLattice } from '../lib/matter/geometry';
import { createBehavior } from '../components/matter/models/Behaviors';
import { createApplication } from '../components/matter/models/Applications';

const options = (kind:string,variant=0,count=3,thickness=.8) => ({kind,variant,count,thickness,color:'#ca926e',secondaryColor:'#83aa99'});
for(const variant of [0,1,2]) {
  // A force arrow follows the marked point throughout the snap cycle.
  const p=options('bistable-beam',variant), lattice=createLattice(p,true), behavior=createBehavior(p,lattice)!;
  const scene=new T.Group();scene.add(lattice,behavior.group);
  for(const time of [0,.8,1.7,3.4,5.2]) {
    behavior.update(time);scene.updateMatrixWorld(true);
    const halo=behavior.group.getObjectByName('explanatory-observation-marker')!;
    const arrow=behavior.group.getObjectByName('explanatory-load-arrow') as T.ArrowHelper;
    const center=halo.getWorldPosition(new T.Vector3());
    const tip=arrow.localToWorld(new T.Vector3(0,arrow.userData.length,0));
    assert.ok(Math.abs(tip.x-center.x)<1e-7 && Math.abs(tip.z-center.z)<1e-7,'load arrow is centered over halo');
    assert.ok(tip.y>center.y && tip.y-center.y<.1,'arrow tip clears marker');
  }
  for(const kind of ['negative-index','epsilon-near-zero','space-time']) {
    const p=options(kind,variant),root=createLattice(p,true), app=createApplication(kind,variant,root,p.color,p.count,p.thickness);
    app.update(1.2,0);app.group.updateMatrixWorld(true);
    const fields=app.group.getObjectByName('connected-instrument-fields')!;
    const paths=fields.children.filter(o=>o.name==='explanatory-wave-path') as T.Mesh<T.TubeGeometry>[];
    const source=app.group.getObjectByName('rf-source-beam-port')!.getWorldPosition(new T.Vector3());
    const receiver=app.group.getObjectByName('rf-receiver-beam-port')!.getWorldPosition(new T.Vector3());
    const endpoints=paths.flatMap(o=>[o.geometry.parameters.path.getPoint(0),o.geometry.parameters.path.getPoint(1)]);
    assert.ok(endpoints.some(v=>v.distanceTo(source)<1e-6),`${kind} source port attached`);
    assert.ok(endpoints.some(v=>v.distanceTo(receiver)<1e-6),`${kind} receiver port attached`);
    const duplicate=root.parent?.getObjectByName(`behavior-${kind}`);
    duplicate?.traverse(o=>{if(o.userData.propagatingField)assert.equal(o.visible,false,'application does not overlay independent beams');});
  }
  const equal=createLattice(options('bound-state-continuum',variant,3,.3),true);
  const pairs=equal.getObjectsByProperty('name','asymmetric-resonator') as T.Mesh<T.BoxGeometry>[];
  assert.equal(pairs[0].geometry.parameters.width,pairs[1].geometry.parameters.width);
  assert.equal(pairs[0].geometry.parameters.depth,pairs[1].geometry.parameters.depth);
  assert.ok(pairs.every(p=>p.rotation.y===0),'zero asymmetry is symmetric for every variant');
}
// Reversing the reservoirs reverses the direction glyph as well as its motion.
{
 const p=options('thermal-diode'),root=createLattice(p,true), b=createBehavior(p,root)!;
 for(const [t,sign] of [[1,1],[6,-1]]) {
  b.update(t);
  const marker=b.group.getObjectByName('thermal-flow-chevron')!;
  assert.ok(new T.Vector3(0,1,0).applyQuaternion(marker.quaternion).x*sign>.99,'heat chevron points from hot to cold');
 }
}
console.log('PASS: centered load arrows, connected microwave ports, symmetric zero-asymmetry pairs and heat direction');
