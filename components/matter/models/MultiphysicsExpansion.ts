import * as T from 'three';
import type { LatticeOptions } from '@/lib/matter/geometry';
import type { Behavior } from './Behaviors';
import type { Application } from './Applications';
import { box, mesh, rod, anchor, type Callout } from './primitives';

/** Qualitative teaching models; fields are schematic, never numerical solvers. */
const ids = ['helmholtz','acoustic-hologram','ventilated-silencer','bubble-metascreen','acoustic-luneburg','thermal-concentrator','thermal-diode','thermal-emitter','magnetic-programmable','piezo-shunt'];
const unit = (p:LatticeOptions) => Math.max(0,Math.min(1,(p.thickness-.3)/1.3));
const count = (p:LatticeOptions) => Math.max(1,Math.min(5,Math.round(p.count)));
const physical = (color:string,opacity=1) => new T.MeshStandardMaterial({color,roughness:.4,metalness:.12,transparent:opacity<1,opacity,side:T.DoubleSide});
const field = (color:string,opacity=.55) => new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide});
const xyz=(p:number[])=>new T.Vector3(p[0],p[1],p[2]);
function path(parent:T.Object3D,pts:number[][],color='#66d9ff',name='semantic-field') {
  // Polyline avoids Catmull-Rom overshoot through physical channel walls.
  const curve = new T.CurvePath<T.Vector3>();
  for(let i=1;i<pts.length;i++)curve.add(new T.LineCurve3(xyz(pts[i-1]),xyz(pts[i])));
  const line=mesh(new T.TubeGeometry(curve,Math.max(12,pts.length*4),.011,5,false),field(color,.3),parent,name);
  line.castShadow=false; line.receiveShadow=false;
  return {curve,line};
}
function annulus(parent:T.Object3D,mat:T.Material,outer:number,inner:number,height:number,pos:number[],name:string) {
  const shape=new T.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);
  const hole=new T.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);
  const geo=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:24});geo.rotateX(-Math.PI/2);
  const o=mesh(geo,mat,parent,name);o.position.copy(xyz(pos));return o;
}
function platePolygon(parent:T.Object3D,mat:T.Material,points:number[][],h:number,y:number,name:string) {
  const shape=new T.Shape(points.map(q=>new T.Vector2(q[0],q[1])));
  const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const o=mesh(geo,mat,parent,name);o.position.y=y;return o;
}
export const multiphysicsControls:Record<string,{thickness:string,count:string,thicknessValue:(v:number)=>string,countValue:(v:number)=>string}> = Object.fromEntries([
 ['helmholtz','Neck length','Cavity count'],['acoustic-hologram','Channel detour','Tile count'],['ventilated-silencer','Cavity depth','Resonator count'],['bubble-metascreen','Bubble radius','Bubble rows'],['acoustic-luneburg','Index contrast','Grading rings'],['thermal-concentrator','Core radius','Sector pairs'],['thermal-diode','Paraffin thickness','Thermal paths'],['thermal-emitter','Resonator size','Pattern rows'],['magnetic-programmable','Field strength','Actuator units'],['piezo-shunt','Circuit tuning','Patch pairs'],
].map(([id,thickness,label])=>[id,{thickness,count:label,
 thicknessValue:(v:number)=>`${Math.round(100 * Math.max(0,Math.min(1,(v-0.3)/1.3)))}% illustrative`,
 countValue:(v:number)=>{
  const n=Math.max(1,Math.min(5,Math.round(v)));
  if(id==='bubble-metascreen')return `${n+1} rows · ${(n+1)**2} bubbles`;
  if(id==='acoustic-luneburg')return `${n+2} rings`;
  if(id==='thermal-concentrator')return `${4+2*n} pairs · ${8+4*n} sectors`;
  if(id==='thermal-emitter')return `${n+2} rows · ${(n+2)**2} resonators`;
  if(id==='magnetic-programmable')return `${n} panels / beams · ${4+2*n} continuous-beam domains`;
  if(id==='piezo-shunt')return `${n} pairs · ${2*n} PZT patches`;
  return `${n}`;
 }}]));

export function createMultiphysicsGeometry(p:LatticeOptions,software=false):T.Group|undefined {
 if(!ids.includes(p.kind))return;
 const root=new T.Group();root.name=`multiphysics-${p.kind}`;
 const a=physical(p.color),b=physical(p.secondaryColor??'#b6cbd0'),dark=physical('#263640'),u=unit(p),n=count(p),v=p.variant;
 a.wireframe=p.wire??false;b.wireframe=p.wire??false;
 const B=(m:T.Material,size:number[],pos:number[],name:string,parent:T.Object3D=root)=>box(parent,m,size,pos,name);
 if(p.kind==='helmholtz'){
  const pitch=3.6/n,w=pitch*.86,neck=.22+u*.6;
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*pitch,h=v===1?.5+.15*(i%2):.65,depth=v===2?.94:1.25;
   B(a,[w,.08,depth],[x,.04,0],'cavity-floor');
   B(a,[.06,h,depth],[x-w/2+.03,.08+h/2,0],'cavity-wall');B(a,[.06,h,depth],[x+w/2-.03,.08+h/2,0],'cavity-wall');
   B(a,[w-.12,h,.06],[x,.08+h/2,-depth/2+.03],'cavity-back');
   // Front is an intentional section opening; air inside remains empty.
   const rad=Math.min(.16,w*.22);
   const sh=new T.Shape([new T.Vector2(-w/2,-depth/2),new T.Vector2(w/2,-depth/2),new T.Vector2(w/2,depth/2),new T.Vector2(-w/2,depth/2)]);
   const hole=new T.Path();hole.absarc(0,0,rad,0,Math.PI*2,true);sh.holes.push(hole);
   const geo=new T.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:false});geo.rotateX(-Math.PI/2);
   const roof=mesh(geo,a,root,'cavity-roof');roof.position.set(x,.08+h,0);
   annulus(root,a,rad+.045,rad,neck,[x,.14+h,0],'open-neck');
   root.userData.airPaths??=[];root.userData.airPaths.push([[x,.35,0],[x,.14+h+neck,0]]);
  }
 }else if(p.kind==='acoustic-hologram'){
  const w=3.6/n,d=2.1,folds=2+Math.round(u*3);
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*w;
   B(a,[w-.04,.07,d],[x,.035,0],'hologram-channel-floor');
   for(const side of [-1,1])B(a,[.045,.38,d],[x+side*(w/2-.0425),.26,0],'hologram-channel-wall');
   const localFolds=v===0?2:v===1?folds+(i%2):folds+Math.abs(i-(n-1)/2)|0;
   const points:number[][]=[[x,.22,-1.08]];
   for(let j=0;j<localFolds;j++){
    const z=-.78+(j+1)/(localFolds+1)*1.56,clear=(.16+.16*u)*w,span=w-.085-clear;
    const sign=j%2?1:-1;
    B(a,[span,.38,.035],[x+sign*clear/2,.26,z],'coiled-channel-divider');
    points.push([x-sign*(w/2-clear/2-.025),.22,z-.05],[x-sign*(w/2-clear/2-.025),.22,z+.05]);
   }
   points.push([x,.22,1.08]);root.userData.airPaths??=[];root.userData.airPaths.push(points);
  }
 }else if(p.kind==='ventilated-silencer'){
  B(a,[3.7,.08,2.4],[0,.04,0],'ventilation-floor');
  for(const z of [-1.16,1.16])B(a,[3.7,.6,.08],[0,.38,z],'duct-outer-wall');
  const pitch=3.5/n,dep=.38+u*.46;
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*pitch,side=v===1&&i%2?-1:1,outer=side*1.12,inner=side*(1.12-dep),w=pitch*.82;
   B(a,[.05,.6,dep],[x-w/2,.38,side*(1.12-dep/2)],'side-cavity-divider');B(a,[.05,.6,dep],[x+w/2,.38,side*(1.12-dep/2)],'side-cavity-divider');
   const gap=v===2?.13:.22;
   for(const s of [-1,1])B(a,[(w-gap)/2,.6,.045],[x+s*(w+gap)/4,.38,inner],'side-cavity-mouth');
   root.userData.airPaths??=[];root.userData.airPaths.push([[x,.35,0],[x,.35,inner],[x,.35,(inner+outer)/2]]);
  }
 }else if(p.kind==='bubble-metascreen'){
  const sheet=physical(p.color,.3),rows=n+1,r=(.08+u*.07)*(v===1?1.06:1),thick=.36;
  const sh=new T.Shape([new T.Vector2(-1.65,-1.1),new T.Vector2(1.65,-1.1),new T.Vector2(1.65,1.1),new T.Vector2(-1.65,1.1)]);
  for(let i=0;i<rows;i++)for(let j=0;j<rows;j++){
   const x=-1.35+2.7*i/(rows-1),z=-.84+1.68*j/(rows-1),rr=r*(v===2?(i%2?.7:1):1);
   const hole=new T.Path();hole.absarc(x,z,rr,0,Math.PI*2,true);sh.holes.push(hole);
   const bubble=mesh(new T.SphereGeometry(rr,software?10:18,software?8:12),field('#b9edff',.25),root,'trapped-air-bubble');bubble.position.set(x,.63,z);
  }
  const geo=new T.ExtrudeGeometry(sh,{depth:thick-.04,bevelEnabled:false,curveSegments:14});geo.rotateX(-Math.PI/2);
  mesh(geo,sheet,root,'pdms-bubble-layer').position.y=.47;
  for(const y of [.46,.80])B(sheet,[3.3,.02,2.2],[0,y,0],'pdms-sealing-skin');
  for(const z of [-1.08,1.08])B(b,[3.5,.45,.12],[0,.225,z],'steel-screen-rail');
  root.userData.sheetHeight=.63;
 }else if(p.kind==='acoustic-luneburg'){
  B(dark,[3.55,.06,3.55],[0,.03,0],'lens-support');
  const rings=n+2;
  for(let j=0;j<rings;j++){
   const r=(j+.5)*1.55/rings,sites=Math.max(6,Math.round(r*15));
   for(let i=0;i<sites;i++){
    const ang=i/sites*Math.PI*2,x=r*Math.cos(ang),z=r*Math.sin(ang),contrast=Math.max(0,1-(v===2?Math.hypot(x*.65,z*1.3):r)/1.7),size=(.042+contrast*(.025+u*.04))*Math.min(1,5/rings);
    if(v===1)annulus(root,a,size,size*.5,.3,[x,.06,z],'graded-solid-ring');
    else{B(a,[size*2,.3,.042],[x,.21,z],'graded-solid-cross');B(a,[.042,.3,size*2],[x,.21,z],'graded-solid-cross');}
   }
  }
 }else if(p.kind==='thermal-concentrator'){
  const pairs=4+n*2,r=.25+u*.4,N=pairs*2;
  for(let k=0;k<N;k++){
   const pts:number[][]=[];
   for(let j=0;j<=6;j++){const ang=(k+j/6)/N*Math.PI*2;pts.push([r*Math.cos(ang),r*Math.sin(ang)]);}
   for(let j=6;j>=0;j--){const ang=(k+j/6)/N*Math.PI*2,R=1.7/Math.max(Math.abs(Math.cos(ang)),Math.abs(Math.sin(ang)));pts.push([R*Math.cos(ang),R*Math.sin(ang)]);}
   platePolygon(root,k%2?a:b,pts,.16,0,k%2?'copper-radial-sector':'pdms-radial-sector');
  }
  const core=mesh(new T.CylinderGeometry(r,r,.16,40),a,root,'copper-core');core.position.y=.08;
  if(v===1)annulus(root,b,r*.72,r*.53,.025,[0,.16,0],'core-insulating-ring');
  if(v===2)B(a,[.15,.035,3.4],[0,.1775,0],'axial-copper-strap');
 }else if(p.kind==='thermal-diode'){
  const h=.1+u*.22;
  B(a,[3.4,.16,2.2],[0,.08,0],'tpu-layer');B(b,[3.4,h,2.2],[0,.16+h/2,0],'paraffin-layer');
  for(let j=0;j<n;j++){
   const z=(j-(n-1)/2)*1.7/Math.max(1,n-1);
   if(v===1)B(a,[3.4,.035,.075],[0,.16+h+.0175,z],'tpu-surface-trace');
   if(v===2){
    // Interface bridges replace paraffin locally conceptually; shown outside the edge to avoid hidden overlaps.
    B(a,[.11,.24+h,.11],[z,(.24+h)/2,-1.155],'tpu-edge-bridge');
    B(a,[.11,.035,.17],[z,.16+h+.0175,-1.055],'tpu-bridge-tab');
   }
  }
 }else if(p.kind==='thermal-emitter'){
  B(a,[3.4,.04,2.6],[0,.02,0],'gold-backplane');B(b,[3.4,.1,2.6],[0,.09,0],'alumina-spacer');
  const side=n+2,pitch=2.75/side,size=(.1+u*.11)*Math.min(1,pitch/.46);
  for(let i=0;i<side;i++)for(let j=0;j<side;j++){
   const x=(i-(side-1)/2)*pitch,z=(j-(side-1)/2)*2.05/side,s=size*(v===1&&(i+j)%2?.65:1);
   if(v===2)annulus(root,b,s,s*.62,.09,[x,.14,z],'alumina-ring');
   else{B(a,[s*2,.035,s*.4],[x,.1575,z],'gold-pattern-cross');B(a,[s*.4,.035,s*2],[x,.1575,z],'gold-pattern-cross');}
  }
 }else if(p.kind==='magnetic-programmable'){
  B(dark,[3.7,.12,2.6],[0,.06,0],'magnetic-actuator-frame');
  if(v===0){
   for(let i=0;i<n;i++){
    const x=(i-(n-1)/2)*3.1/n,w=2.7/n;
    for(const z of [-.76,.76])B(dark,[.12,.345,.12],[x,.2925,z],'panel-hinge-support');
    rod(root,dark,[x,.5,-.82],[x,.5,.82],.035,'panel-hinge-axle');
    const pivot=new T.Group();pivot.position.set(x,.5,0);pivot.name='magnetic-panel-pivot';pivot.userData.phase=i*.4;root.add(pivot);
    B(a,[w,.085,1.4],[0,.0425,0],'pdms-rotating-panel',pivot);
    for(const z of [-.4,.4])B(b,[w*.38,.022,.24],[0,.096,z],'ndfeb-magnetic-domain',pivot);
   }
  }else{
   B(dark,[.18,.35,1.8],[-1.65,.295,0],'beam-root-clamp');
   const rows=v===1?1:n;
   for(let j=0;j<rows;j++){
    const width=v===1?1.15:1.55/rows,z=(j-(rows-1)/2)*1.8/rows,segments=v===1?4+n*2:5,step=3.05/segments;
    let parent:T.Object3D=root;
    for(let i=0;i<segments;i++){
     const joint=new T.Group();joint.name='magnetic-beam-joint';joint.position.set(i?step:-1.56,i?0:.43,i?0:z);joint.userData.phase=i*.22+j*.3;parent.add(joint);
     B(a,[step,.08,width],[step/2,.04,0],'pdms-flexible-segment',joint);
     B(b,[step*.48,.018,width*.55],[step/2,.089,0],'ndfeb-magnetic-domain',joint);
     if(v===2&&i<segments-1)rod(joint,dark,[step,.04,-width/2],[step,.04,width/2],.04,'segment-hinge');
     parent=joint;
    }
   }
  }
 }else if(p.kind==='piezo-shunt'){
  B(b,[3.5,.09,.85],[0,.335,0],'aluminum-host-beam');
  for(const x of [-1.64,1.64])B(dark,[.22,.29,.9],[x,.145,0],'beam-support');
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*2.9/n,w=2.4/n;
   for(const z of [-.23,.23])B(a,[w,.04,.24],[x,.4,z],'bonded-pzt-patch');
   const board=B(dark,[w,.09,.48],[x,.045,1.0],v===0?'passive-rl-board':v===1?'digital-shunt-board':'active-control-board');
   B(dark,[w,.36,.045],[x,.18,.755],'circuit-support');
   for(const z of [-.23,.23]){
    path(root,[[x,.42,z],[x,.48,z],[x,.48,.84],[x,.09,.84]],'#a1b1b7','electrode-wire');
   }
   if(v===0){for(let k=0;k<4;k++)annulus(root,physical('#ab7659'),.045,.025,.055,[x+(k-1.5)*w*.13,.09,1.02],'rl-inductor-turn');}
   else B(physical('#566773'),[w*.48,.035,.2],[x,.1075,1.0],v===1?'digital-chip':'active-controller');
   board.userData.normalizedTuning=u;
  }
 }
 root.userData.primary=p.color;root.userData.secondary=p.secondaryColor;root.userData.qualitative=true;
 return root;
}

export function createMultiphysicsBehavior(p:LatticeOptions,lattice:T.Group):Behavior|undefined {
 if(!ids.includes(p.kind))return;
 const group=new T.Group();group.name=`behavior-${p.kind}`;
 const u=unit(p),n=count(p),v=p.variant;
 const packets:{mesh:T.Mesh,curve:T.CurvePath<T.Vector3>,offset:number,speed:number,reverse?:boolean}[]=[];
 const dynamic:{mesh:T.Mesh,phase:number}[]=[];
 const add=(pts:number[][],color:string,speed=.25,reverse=false)=>{
  const q=path(group,pts,color);
  for(let j=0;j<3;j++){
   const packet=mesh(new T.TorusGeometry(.052,.009,4,12),field(color,.72),group,'field-packet');packet.castShadow=false;
   packets.push({mesh:packet,curve:q.curve,offset:j/3,speed,reverse});
  }
  return q.line;
 };
 let status='Illustrative field response';
 if(p.kind==='helmholtz'){
  (lattice.userData.airPaths as number[][][]).forEach((pts,i)=>{
   const q=add(pts,'#69d9ff',.3+u*.1);q.name='oscillating-neck-air';
   const band=mesh(new T.TorusGeometry(.13,.009,5,24),field('#ffd28a',.6),group,'cavity-pressure-band');band.rotation.x=Math.PI/2;band.position.set(pts[0][0],.35,0);dynamic.push({mesh:band,phase:i*.7});
  });status='Neck air oscillates against cavity compression · resonance schematic';
 }else if(p.kind==='acoustic-hologram'){
  (lattice.userData.airPaths as number[][][]).forEach((pts,i)=>{
   add(pts,'#74dbff',.16/(1+Math.max(0,pts.length-6)*.04));
   const x=pts[0][0],endX=v===0?x:v===1?.85:0;
   add([[x,.22,1.08],[x*.6+endX*.4,.24,1.5],[endX,.27,1.65]],'#ffcb82',.22);
  });status=v===0?'Equal path lengths · aligned outgoing phase':'Different air-path lengths · outgoing phase forms a wavefront';
 }else if(p.kind==='ventilated-silencer'){
  add([[-2.35,.34,0],[2.35,.34,0]],'#83e9ce',.3);
  (lattice.userData.airPaths as number[][][]).forEach(pts=>add(pts,'#ffbe84',.35));
  for(let i=0;i<5;i++){
   const q=path(group,[[1.94+i*.08,.25,-.18],[1.94+i*.08,.42,0],[1.94+i*.08,.25,.18]],'#78d9ff','reduced-transmitted-pressure');dynamic.push({mesh:q.line,phase:i*.7});
  }status='Open air route + side-cavity resonance · selected sound reduced';
 }else if(p.kind==='bubble-metascreen'){
  for(let i=-2;i<=2;i++){
   add([[i*.52,1.55,0],[i*.52,.83,0]],'#71d5ff',.25);
   add([[i*.52,.43,0],[i*.52,-.32,0]],'#86acda',.15);
  }
  lattice.getObjectsByProperty('name','trapped-air-bubble').forEach((o,i)=>dynamic.push({mesh:o as T.Mesh,phase:i*.23}));
  status='Underwater pressure drives trapped air · bubble resonance filters sound';
 }else if(p.kind==='acoustic-luneburg'){
  for(let j=-3;j<=3;j++){
   const z=j*.37,aim=v===2?.55:0;
   add([[-2.5,.39,z],[-1.5,.39,z],[-.4,.39,z*.86],[.7,.39,z*.42+aim*.35],[1.85,.39,aim]],'#7cddff',.18);
  }status='Graded solid filling guides sound toward a focal region';
 }else if(p.kind==='thermal-concentrator'){
  const core=.25+u*.4;
  for(let j=-2;j<=2;j++){
   const z=j*.62;
   add([[-1.9,.19,z],[-1.2,.19,z*.72],[-core,.19,z*.17],[core,.19,z*.17],[1.2,.19,z*.72],[1.9,.19,z]],'#ffb775',.15);
  }status='Copper sectors crowd heat flow near the core · hot to cold';
 }else if(p.kind==='thermal-diode'){
  for(let j=0;j<n;j++){
   const z=(j-(n-1)/2)*1.7/Math.max(1,n-1);
   add([[-1.9,.32+u*.22,z],[0,.32+u*.22,z],[1.9,.32+u*.22,z]],'#ffc075',.14,true);
  }status='Reverse the hot and cold boundaries · compare heat-flow magnitude';
 }else if(p.kind==='thermal-emitter'){
  for(let j=-2;j<=2;j++)add([[j*.48,.26,0],[j*.57,.8,.05],[j*.72,1.55,.15]],'#ffad78',.2+u*.08);
  status='Patterned metal/dielectric stack · selective thermal emission concept';
 }else if(p.kind==='magnetic-programmable'){
  for(let j=-1;j<=1;j++){
   const q=path(group,[[-2.1,.65,j*.65],[-1.2,1.15,j*.65],[1.2,1.15,j*.65],[2.1,.65,j*.65]],'#c797ff','applied-magnetic-field');
   dynamic.push({mesh:q.line,phase:j});
  }
  status='Applied magnetic field exerts torque · programmed domains bend elastomer';
 }else if(p.kind==='piezo-shunt'){
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*2.9/n;
   add([[x,.43,0],[x,.49,0],[x,.49,.85],[x,.13,1.0]],'#dfb6ff',.2+u*.2);
  }
  const pts=Array.from({length:25},(_,i)=>{const x=-1.65+i/24*3.3;return[x,.52+Math.sin(i/24*Math.PI)*.12,0]});
  const q=path(group,pts,'#7dd9ff','beam-vibration-envelope');dynamic.push({mesh:q.line,phase:0});
  status=v===0?'PZT converts bending strain to charge · passive RL dissipates energy':v===1?'Digital shunt emulates an electrical impedance · tuning is normalized':'Active control concept feeds back sensed strain · external power required';
 }
 const camera=[6.3,5.1,7.6],target=[0,.35,.1];
 return {group,camera,target,update:(time:number)=>{
  const reverse=p.kind==='thermal-diode'&&Math.floor(time/5)%2===1;
  packets.forEach(q=>{
   let progress=(time*q.speed+q.offset)%1;
   if(p.kind==='helmholtz')progress=.5+.48*Math.sin(time*3.3+q.offset*6.28);
   if(p.kind==='ventilated-silencer'&&q.curve.getLength()<2)progress=.5+.48*Math.sin(time*3+q.offset*6.28);
   if(q.reverse){progress=(time*q.speed*(reverse?.48:1)+q.offset)%1;if(reverse)progress=1-progress;}
   q.mesh.position.copy(q.curve.getPointAt(progress));q.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),q.curve.getTangentAt(Math.max(.0001,Math.min(.9999,progress))).normalize());
  });
  dynamic.forEach(q=>{
   const pulse=.5+.5*Math.sin(time*3+q.phase);
   if(q.mesh.name==='trapped-air-bubble')q.mesh.scale.setScalar(.95+.025*Math.sin(time*3+q.phase));
   else (q.mesh.material as T.MeshBasicMaterial).opacity=.13+.38*pulse;
  });
  if(p.kind==='magnetic-programmable'){
   lattice.getObjectsByProperty('name','magnetic-panel-pivot').forEach(o=>{o.rotation.z=Math.sin(time*1.8+(o.userData.phase??0))*(.035+u*.2);});
   lattice.getObjectsByProperty('name','magnetic-beam-joint').forEach(o=>{o.rotation.z=Math.sin(time*1.5+(o.userData.phase??0))*(.003+u*.022)*(v===1?8/(4+n*2):1);});
  }
  if(p.kind==='piezo-shunt'){
   const envelope=dynamic[0]?.mesh;
   if(envelope)envelope.position.y=Math.sin(time*9)*(.005+Math.abs(u-.55)*.06);
  }
  return p.kind==='thermal-diode'?`${reverse?'Right hot → left cold (reversed)':'Left hot → right cold'} · qualitative rectification comparison`:status;
 }};
}

export function createMultiphysicsApplication(p:LatticeOptions,lattice:T.Group):Application|undefined {
 if(!ids.includes(p.kind))return;
 const group=new T.Group();group.name=`application-${p.kind}`;group.add(lattice);
 const dark=physical('#263942'),metal=physical('#8b9ca7'),glass=field('#7fd8ee',.12);
 const callouts:Callout[]=[];
 const label=(text:string,o:T.Object3D,side:'left'|'right',slot:number,pos:number[]=[0,0,0])=>callouts.push({label:text,anchor:anchor(o,pos,text),side,slot});
 const get=(name:string)=>lattice.getObjectByName(name)??lattice;
 const floor=box(group,dark,[5.7,.12,3.8],[0,-.06,0],'context-test-bed');
 const b=createMultiphysicsBehavior(p,lattice)!;group.add(b.group);
 let boundaryLeft:T.Mesh|undefined,boundaryRight:T.Mesh|undefined;
 const k=p.kind;
 if(['helmholtz','acoustic-hologram','ventilated-silencer','acoustic-luneburg'].includes(k)){
  const source=box(group,dark,[.24,.7,.7],[-2.48,.35,-.25],'acoustic-source');
  const receiver=box(group,metal,k==='acoustic-hologram'?[.28,.5,.13]:[.13,.5,.28],k==='acoustic-hologram'?[p.variant===1?.85:0,.25,1.82]:[2.4,.25,.1],'acoustic-receiver');
  if(k==='acoustic-hologram'){source.geometry.dispose();source.geometry=new T.BoxGeometry(.7,.7,.24);source.position.set(0,.35,-1.52);}
  const names:Record<string,string[]>={
   helmholtz:['cavity-wall','open-neck','Cavity walls: enclose compressible air','Open neck: oscillating air plug'],
   'acoustic-hologram':['hologram-channel-floor','coiled-channel-divider','Solid tiles: support the air channels','Coiled route: sets acoustic phase'],
   'ventilated-silencer':['side-cavity-mouth','duct-outer-wall','Side cavities: resonant sound coupling','Open passage: ventilation continues'],
   'acoustic-luneburg':['graded-solid-cross','lens-support','Graded solid inclusions: steer sound','Lens support: fixes the pattern'],
  };
  const parts=names[k];label('Sound source: drives the test',source,'left',0);label(parts[2],get(k==='acoustic-luneburg'&&p.variant===1?'graded-solid-ring':parts[0]),'left',1);label(parts[3],get(parts[1]),'right',0);label('Receiver: samples outgoing sound',receiver,'right',1);
 }else if(k==='bubble-metascreen'){
  // Tank floor is below all under-screen wave paths; screen rails stand on pedestals.
  floor.position.y=-.65;
  for(const z of [-1.08,1.08])box(group,dark,[3.5,.59,.12],[0,-.295,z],'submerged-rail-pedestal');
  box(group,glass,[4.8,1.95,.035],[0,.315,-1.75],'water-tank-back');
  const transducer=box(group,dark,[.42,1.0,.45],[-2.35,-.09,0],'underwater-transducer');
  const hydrophone=box(group,metal,[.14,1.0,.14],[2.3,-.09,0],'hydrophone');
  label('Transducer: launches water pressure',transducer,'left',0);label('PDMS sheet: traps air pockets',get('pdms-bubble-layer'),'left',1);label('Air bubbles: resonant compressibility',get('trapped-air-bubble'),'right',0);label('Hydrophone: samples transmitted sound',hydrophone,'right',1);
 }else if(k==='thermal-concentrator'||k==='thermal-diode'){
  const depth=k==='thermal-concentrator'?3.4:2.2;
  boundaryLeft=box(group,physical('#ef945f'),[.24,.34,depth],[-1.82,.17,0],'left-thermal-boundary');
  boundaryRight=box(group,physical('#76b9dc'),[.24,.34,depth],[1.82,.17,0],'right-thermal-boundary');
  label('Boundary reservoir: initially hot',boundaryLeft,'left',0);
  label(k==='thermal-concentrator'?'Copper sectors: guide heat inward':'TPU layer: polymer conduction path',get(k==='thermal-concentrator'?'copper-radial-sector':'tpu-layer'),'left',1);
  label(k==='thermal-concentrator'?'Core region: heat-flow concentration':'Paraffin layer: temperature-dependent transport',get(k==='thermal-concentrator'?'copper-core':'paraffin-layer'),'right',0);
  label('Boundary reservoir: initially cold',boundaryRight,'right',1);
 }else if(k==='thermal-emitter'){
  const heater=box(group,dark,[3.4,.22,2.6],[0,-.11,0],'heater-stage');floor.position.y=-.28;
  const detector=box(group,metal,[.55,.12,.65],[2.25,1.4,0],'ir-detector');box(group,dark,[.1,1.56,.14],[2.25,.56,0],'detector-post');
  label('Heater stage: warms the sample',heater,'left',0);label('Gold backing: reflective lower layer',get('gold-backplane'),'left',1);label(p.variant===2?'Alumina rings: dielectric resonators':'Gold pattern: selects emission bands',get(p.variant===2?'alumina-ring':'gold-pattern-cross'),'right',0);label('IR detector: compares emitted radiation',detector,'right',1);
 }else if(k==='magnetic-programmable'){
  const left=box(group,physical('#62678c'),[.42,1.35,2.0],[-2.28,.675,0],'magnetic-field-pole');
  const right=box(group,physical('#8972a8'),[.42,1.35,2.0],[2.28,.675,0],'magnetic-field-pole');
  label('Field pole: applied magnetic drive',left,'left',0);label('PDMS: deformable actuator body',get(p.variant===0?'pdms-rotating-panel':'pdms-flexible-segment'),'left',1);label('NdFeB domains: programmed magnetic torque',get('ndfeb-magnetic-domain'),'right',0);label('Opposite pole: completes test fixture',right,'right',1);
 }else{
  const exciter=box(group,dark,[.42,.3,.45],[-2.2,.15,0],'beam-exciter');
  rod(group,metal,[-1.99,.335,0],[-1.75,.335,0],.035,'excitation-stinger');
  box(group,metal,[.1,.2,.1],[-2.06,.3,0],'exciter-stinger-link');
  label('Exciter: imposes beam vibration',exciter,'left',0);label('PZT patches: strain becomes charge',get('bonded-pzt-patch'),'left',1);label('Aluminum beam: carries bending waves',get('aluminum-host-beam'),'right',0);label(p.variant===0?'Passive RL: tuned energy dissipation':p.variant===1?'Digital shunt: emulated impedance':'Active controller: powered feedback',get(p.variant===0?'passive-rl-board':p.variant===1?'digital-shunt-board':'active-control-board'),'right',1);
 }
 return {group,callouts,camera:[7,5.6,8.8],target:[0,.35,.1],update:(t,_e)=>{
  if(k==='thermal-diode'&&boundaryLeft&&boundaryRight){const rev=Math.floor(t/5)%2===1;(boundaryLeft.material as T.MeshStandardMaterial).color.set(rev?'#76b9dc':'#ef945f');(boundaryRight.material as T.MeshStandardMaterial).color.set(rev?'#ef945f':'#76b9dc');}
  return b.update(t);
 }};
}
