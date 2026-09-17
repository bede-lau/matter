import assert from 'node:assert/strict';
import * as T from 'three';
import { families, bases } from '../lib/matter/catalog';
import { createLattice } from '../lib/matter/geometry';
import { createBehavior } from '../components/matter/models/Behaviors';
import { createApplication } from '../components/matter/models/Applications';
function fingerprint(group:T.Object3D) {
 const state:unknown[]=[];
 group.updateMatrixWorld(true);
 group.traverse(o=>{if(o instanceof T.Mesh){
  const a=o.geometry.attributes.position;
  const mats=Array.isArray(o.material)?o.material:[o.material];
  state.push(o.name,o.visible,...o.matrixWorld.elements,a.count,...Array.from(a.array).slice(0,90),...mats.flatMap(m=>[m.opacity,(m as T.MeshStandardMaterial).color?.getHex(),(m as T.MeshStandardMaterial).emissiveIntensity]));
 }});return JSON.stringify(state);
}
function dispose(group:T.Object3D){group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});}
for(const f of families.slice(18))for(let variant=0;variant<3;variant++){
 const base={kind:f.id,variant,color:bases[f.defaultBase!].color,secondaryColor:bases[f.defaultSecondary!].color,blend:.35,wire:false};
 const signatures:string[]=[];
 for(const [count,thickness] of [[1,.3],[3,.8],[5,1.6]]){
  const p={...base,count,thickness};const lattice=createLattice(p,true);
  const behavior=createBehavior(p,lattice);assert.ok(behavior,`${f.id} dedicated behavior`);
  const scene=new T.Group();scene.add(lattice,behavior.group);
  behavior.update(0);const before=fingerprint(scene);behavior.update(1.7);const after=fingerprint(scene);
  if (thickness === .8) assert.notEqual(before,after,`${f.id}/${variant} animated geometry, field or material`);
  signatures.push(after);
  const application=createApplication(f.id,variant,lattice,p.color,count,thickness);
  assert.equal(application.callouts.length,4,`${f.id} four labels`);
  assert.equal(application.callouts.filter(c=>c.side==='left').length,2);
  for(const time of [0,1.7,4.2]){
   application.update(time,0);application.group.updateMatrixWorld(true);
   const extent=new T.Box3().setFromObject(application.group).getSize(new T.Vector3());
   assert.ok(Math.max(...extent.toArray())<15,`${f.id} bounded application`);
   application.group.traverse(o=>{
    assert.ok(o.matrixWorld.elements.every(Number.isFinite),`${f.id} finite transforms`);
    if(o instanceof T.Mesh)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite),`${f.id} finite vertices`);
   });
   for(const c of application.callouts)assert.ok(c.anchor.getWorldPosition(new T.Vector3()).toArray().every(Number.isFinite));
  }
  dispose(application.group);dispose(behavior.group);
 }
 assert.notEqual(signatures[0],signatures[2],`${f.id} controls change the displayed model`);
 console.log('PASS expansion',f.id,variant+1);
}
