import * as T from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import type { LatticeOptions } from '@/lib/matter/geometry';
import type { Behavior } from './Behaviors';
import type { Application } from './Applications';
import { mesh, box, rod, anchor, type Callout } from './primitives';

type V = [number, number, number];
type Rig = { update: (t: number) => string; landmarks: T.Object3D[]; labels: string[]; fixture: string; };
const ids = ['pentamode','rotating-squares','chiral-honeycomb','miura-origami','kirigami','bistable-beam','tensegrity','spinodal-shell','chainmail','thermal-expansion'];
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const normalized = (x: number) => (clamp(x,.3,1.6)-.3)/1.3;
const count = (x: number) => Math.round(clamp(x,1,5));
const vec = (v: V) => new T.Vector3(...v);
const UP = new T.Vector3(0,1,0);
const material = (color: string, metalness=0, wireframe=false) => new T.MeshStandardMaterial({color, metalness, roughness: metalness ? .35 : .57, side:T.DoubleSide, wireframe});
const on = (o:T.Object3D, a:V) => o.position.set(...a);
const segment = (o:T.Mesh,a:V,b:V,r:number) => { const va=vec(a),vb=vec(b);o.position.copy(va).add(vb).multiplyScalar(.5);o.quaternion.setFromUnitVectors(UP,vb.sub(va).normalize());o.scale.set(r,vec(a).distanceTo(vec(b)),r); };
const unitRod = (g:T.Object3D,m:T.Material,name:string) => mesh(new T.CylinderGeometry(1,1,1,8),m,g,name);
const ring = (g:T.Object3D,m:T.Material,r:number,t:number,name:string) => mesh(new T.TorusGeometry(r,t,7,32),m,g,name);
function ribbon(g:T.Object3D,m:T.Material,n:number,name:string) {
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array((n+1)*4*3),3));
  const ix:number[]=[];
  for(let i=0;i<n;i++){const a=i*4,b=a+4;ix.push(a,b,a+1,b,b+1,a+1,a+2,a+3,b+2,b+2,a+3,b+3,a,a+2,b,b,a+2,b+2,a+1,b+1,a+3,b+1,b+3,a+3);}
  ix.push(0,1,2,1,3,2,n*4,n*4+2,n*4+1,n*4+1,n*4+2,n*4+3);geo.setIndex(ix);
  const obj=mesh(geo,m,g,name);
  return {obj,write:(fn:(s:number,side:number,face:number)=>V)=>{const p=geo.attributes.position as T.BufferAttribute;for(let i=0;i<=n;i++)for(let k=0;k<4;k++)p.setXYZ(i*4+k,...fn(i/n,k%2?1:-1,k<2?1:-1));p.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();}};
}
function plate(g:T.Object3D,m:T.Material,name:string){return ribbon(g,m,1,name);}
function fieldArrow(g:T.Object3D,origin:V,direction:V,color:string,length=.58){ const arrow=new T.ArrowHelper(vec(direction).normalize(),vec(origin),length,color,.14,.07);arrow.name='explanatory-load-arrow';g.add(arrow);return arrow; }

export const mechanicalControls: Record<string,{thickness:string;count:string;thicknessValue:(v:number)=>string;countValue:(v:number)=>string}> = {
 'pentamode':{thickness:'Neck radius',count:'Cells across',thicknessValue:v=>`${(2+normalized(v)*5).toFixed(1)}% of cell`,countValue:v=>`${count(v)+1} cells`},
 'rotating-squares':{thickness:'Hinge width',count:'Tiles across',thicknessValue:v=>`${(3+normalized(v)*4).toFixed(1)}% of tile`,countValue:v=>`${count(v)+1} tiles`},
 'chiral-honeycomb':{thickness:'Ligament gauge',count:'Rings across',thicknessValue:v=>`${(2+normalized(v)*3).toFixed(1)}% of pitch`,countValue:v=>`${count(v)+1} rings`},
 'miura-origami':{thickness:'Crease gauge',count:'Facet rows',thicknessValue:v=>`${(1+normalized(v)*2).toFixed(1)}% of edge`,countValue:v=>`${count(v)+1} rows`},
 'kirigami':{thickness:'Ribbon gauge',count:'Cut ribbons',thicknessValue:v=>`${(1+normalized(v)*2).toFixed(1)}% of width`,countValue:v=>`${count(v)+2} ribbons`},
 'bistable-beam':{thickness:'Beam gauge',count:'Arch lanes',thicknessValue:v=>`${(1+normalized(v)*2).toFixed(1)}% of span`,countValue:v=>`${count(v)} lanes`},
 'tensegrity':{thickness:'Strut diameter',count:'Prism modules',thicknessValue:v=>`${(9+normalized(v)*7).toFixed(1)}% of radius`,countValue:v=>`${count(v)} modules`},
 'spinodal-shell':{thickness:'Shell gauge',count:'Disorder frequency',thicknessValue:v=>`${Math.round(normalized(v)*100)}% of illustrated range`,countValue:v=>`${(2.8+(count(v)-1)*.65).toFixed(2)} relative frequency`},
 'chainmail':{thickness:'Wire radius',count:'Links across',thicknessValue:v=>`${(5+normalized(v)*4).toFixed(1)}% of link radius`,countValue:v=>`${count(v)+1} links`},
 'thermal-expansion':{thickness:'Laminate gauge',count:'Bonded strips',thicknessValue:v=>`${(1+normalized(v)*2).toFixed(1)}% of length`,countValue:v=>`${count(v)} strips`},
};

/** Qualitative mechanisms. Deformation is prescribed, not an FE solution. */
export function createMechanicalGeometry(p:LatticeOptions,software=false):T.Group|undefined {
 if(!ids.includes(p.kind))return undefined;
 const g=new T.Group();g.name=`mechanical-${p.kind}`;
 const q=normalized(p.thickness),n=count(p.count),v=clamp(Math.floor(p.variant),0,2);
 const primary=material(p.color,p.kind==='chainmail'||p.kind==='tensegrity'||p.kind==='bistable-beam'?.7:.14,!!p.wire);
 const metal=material('#a5b5bf',.76,!!p.wire),tpu=material(p.secondaryColor||'#46525c',.02,!!p.wire),invar=material(p.secondaryColor||'#52697e',.75,!!p.wire);
 const landmarks=[anchor(g,[0,0,0],'mechanical-anchor-0'),anchor(g,[0,0,0],'mechanical-anchor-1'),anchor(g,[0,0,0],'mechanical-anchor-2'),anchor(g,[0,0,0],'mechanical-anchor-3')];
 let update:Rig['update']=()=> 'Illustrative mechanism'; let labels=['','','','']; let fixture='';
 if(p.kind==='pentamode'){
  const nx=n+1, ny=2, nz=2,step=Math.min(4.1/nx,1.3),rs=step*(.02+.05*q);
  type Strut={a:V;b:V;lo:T.Mesh;hi:T.Mesh;neck:number};const struts:Strut[]=[];
  const nodes=new Map<string,V>();
  for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++)for(let k=0;k<=nz;k++)if((i+j+k)%2===0){
   const a:V=[(i-nx/2)*step,(j-ny/2)*step,(k-nz/2)*step];
   for(const d of [[.5,.5,.5],[.5,-.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5]]){
    if(i+d[0]<0||i+d[0]>nx||j+d[1]<0||j+d[1]>ny||k+d[2]<0||k+d[2]>nz)continue;
    const b:V=[a[0]+d[0]*step,a[1]+d[1]*step,a[2]+d[2]*step];const neck=rs*(v===1?.56:v===2?.65+.5*(j/ny):1);
    const wide=step*.135; const lo=mesh(new T.CylinderGeometry(wide,neck,1,software?6:10),primary,g,'pentamode-tapered-half');
    const hi=mesh(new T.CylinderGeometry(neck,wide,1,software?6:10),primary,g,'pentamode-tapered-half');
    struts.push({a,b,lo,hi,neck});nodes.set(a.join(','),a);nodes.set(b.join(','),b);
   }
  }
  const tips=Array.from(nodes.values()).map(a=>({a,o:mesh(new T.SphereGeometry(rs*(v===1?.56:1),8,6),primary,g,'shared-flexible-neck')}));
  const deform=(a:V,s:number):V=>[a[0]+s*(a[1]+step),a[1],a[2]];
  update=t=>{const shear=.075*Math.sin(t*.75);for(const e of struts){const a=deform(e.a,shear),b=deform(e.b,shear),mid:V=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];for(const [o,x,y] of [[e.lo,a,mid],[e.hi,mid,b]] as [T.Mesh,V,V][]){const va=vec(x),vb=vec(y);o.position.copy(va).add(vb).multiplyScalar(.5);o.quaternion.setFromUnitVectors(UP,vb.sub(va).normalize());o.scale.y=va.distanceTo(vec(y));}}tips.forEach(({a,o})=>on(o,deform(a,shear)));on(landmarks[0],deform(struts[0].a,shear));on(landmarks[1],deform(struts[Math.floor(struts.length/2)].a,shear));on(landmarks[2],[0,step,0]);on(landmarks[3],[0,-step,0]);return 'Small imposed shear · slender shared necks flex';};
  labels=['Shared narrow neck','Double-cone strut','Shear carriage','Fixed lower tips'];fixture='shear';
 }else if(p.kind==='rotating-squares'){
  const cols=n+1,rows=v===1?2:n+1,a=(v===2?2.1:3.0)/(n+1),gauge=a*(.03+.04*q);
  const patch=new T.Group();g.add(patch);if(v===2)patch.rotation.y=Math.PI/4;
  const tiles:T.Mesh[][]=[];for(let i=0;i<cols;i++){tiles[i]=[];for(let j=0;j<rows;j++)tiles[i][j]=box(patch,primary,[a,.075,a],[0,0,0],'rigid-rotating-square');}
  type Join={i:number;j:number;k:number;l:number;o:T.Mesh};const joins:Join[]=[];
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){if(i+1<cols)joins.push({i,j,k:i+1,l:j,o:unitRod(patch,tpu,'TPU-corner-hinge')});if(j+1<rows)joins.push({i,j,k:i,l:j+1,o:unitRod(patch,tpu,'TPU-corner-hinge')});}
  const corners=(o:T.Mesh):V[]=>{o.updateMatrix();return [[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=>new T.Vector3(x*a/2,0,z*a/2).applyMatrix4(o.matrix).toArray() as V);};
  update=t=>{const theta=.24+.15*(.5+.5*Math.sin(t*.75)),pitch=(a+gauge*1.5)*(Math.cos(theta)+Math.sin(theta));for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const o=tiles[i][j];o.position.set((i-(cols-1)/2)*pitch,.12,(j-(rows-1)/2)*pitch);o.rotation.y=((i+j)%2?1:-1)*theta;}
   for(const h of joins){let best=Infinity,aa:V=[0,0,0],bb:V=[0,0,0];for(const a of corners(tiles[h.i][h.j]))for(const b of corners(tiles[h.k][h.l])){const d=vec(a).distanceToSquared(vec(b));if(d<best){best=d;aa=a;bb=b;}}segment(h.o,aa,bb,gauge);}
   patch.updateMatrix();on(landmarks[0],tiles[0][0].position.clone().applyMatrix4(patch.matrix).toArray() as V);on(landmarks[1],joins[0].o.position.clone().applyMatrix4(patch.matrix).toArray() as V);on(landmarks[2],tiles[cols-1][rows-1].position.clone().applyMatrix4(patch.matrix).toArray() as V);on(landmarks[3],tiles[0][rows-1].position.clone().applyMatrix4(patch.matrix).toArray() as V);return 'Rigid squares counter-rotate · both patch dimensions open';};
  labels=['Rigid aluminium tile','Flexible TPU corner','Opening edge','Counter-rotating neighbor'];fixture='planar';
 }else if(p.kind==='chiral-honeycomb'){
  const cols=n+1,rows=Math.min(n+1,4),pitch=3.7/(n+1),R=pitch*.23,gauge=pitch*(.02+.03*q),tubeR=R*.15;
  type Node={x:number;z:number;angle:number;o:T.Mesh};const nodes:Node[][]=[];
  for(let i=0;i<cols;i++){nodes[i]=[];for(let j=0;j<rows;j++){const o=ring(g,primary,R,tubeR,'rigid-chiral-ring');o.rotation.x=Math.PI/2;nodes[i][j]={x:(i-(cols-1)/2)*pitch,z:(j-(rows-1)/2)*pitch,angle:0,o};}}
  type Link={a:Node;b:Node;nx:number;nz:number;hand:number;parts:T.Mesh[]};const links:Link[]=[];
  const add=(a:Node,b:Node,hand:number)=>{const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),c=2*R/d,s=Math.sqrt(1-c*c),nx=c*dx/d-hand*s*dz/d,nz=c*dz/d+hand*s*dx/d;links.push({a,b,nx,nz,hand,parts:Array.from({length:12},()=>unitRod(g,tpu,'TPU-tangential-ligament'))});};
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const hand=v===1?-1:v===2&&j%2?-1:1;if(i+1<cols)add(nodes[i][j],nodes[i+1][j],hand);if(j+1<rows)add(nodes[i][j],nodes[i][j+1],hand);}
  update=t=>{const turn=.11*Math.sin(t*.7),strain=.025*Math.sin(t*.7);for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const node=nodes[i][j];node.angle=turn*(v===1?-1:v===2&&j%2?-1:1);node.o.position.set(node.x*(1+strain),.12,node.z*(1+strain));node.o.rotation.z=node.angle;}
   for(const l of links){const rotate=(x:number,z:number,a:number):[number,number]=>[x*Math.cos(a)-z*Math.sin(a),x*Math.sin(a)+z*Math.cos(a)];const na=rotate(l.nx,l.nz,l.a.angle),nb=rotate(-l.nx,-l.nz,l.b.angle);const a:V=[l.a.o.position.x+R*na[0],.12,l.a.o.position.z+R*na[1]],b:V=[l.b.o.position.x+R*nb[0],.12,l.b.o.position.z+R*nb[1]];const len=vec(a).distanceTo(vec(b));const tangent:V=[-l.nz*l.hand,0,l.nx*l.hand];if((b[0]-a[0])*tangent[0]+(b[2]-a[2])*tangent[2]<0){tangent[0]*=-1;tangent[2]*=-1;}const ta=rotate(tangent[0],tangent[2],l.a.angle),tb=rotate(tangent[0],tangent[2],l.b.angle);const curve=new T.CubicBezierCurve3(vec(a),vec(a).add(new T.Vector3(ta[0],0,ta[1]).multiplyScalar(len/3)),vec(b).sub(new T.Vector3(tb[0],0,tb[1]).multiplyScalar(len/3)),vec(b));l.parts.forEach((o,i)=>segment(o,curve.getPoint(i/12).toArray() as V,curve.getPoint((i+1)/12).toArray() as V,gauge));}
   on(landmarks[0],nodes[0][0].o.position.clone().add(new T.Vector3(R,0,0)).toArray() as V);on(landmarks[1],links[0].parts[5].position.toArray() as V);on(landmarks[2],nodes[cols-1][rows-1].o.position.clone().add(new T.Vector3(R,0,0)).toArray() as V);on(landmarks[3],nodes[0][rows-1].o.position.clone().add(new T.Vector3(-R,0,0)).toArray() as V);return 'Ring rotation bends attached tangent ligaments';};
  labels=['Rigid aluminium ring','Tangent TPU ligament',v===1?'Left handed attachment':'Rotating ring','Elastic lateral connection'];fixture='planar';
 }else if(p.kind==='miura-origami'){
  const cols=n+1,rows=n+1,a=3.35/(n+1),b=a*.82,alpha=[55,65,75][v]*Math.PI/180,th=a*.018,hr=a*(.01+.02*q);
  const facets:{i:number;j:number;sheet:ReturnType<typeof plate>}[]=[];const creases:{i:number;j:number;k:number;l:number;o:T.Mesh}[]=[];
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)facets.push({i,j,sheet:plate(g,primary,'rigid-Miura-parallelogram')});
  for(let i=0;i<=cols;i++)for(let j=0;j<=rows;j++){if(i<cols)creases.push({i,j,k:i+1,l:j,o:unitRod(g,tpu,'Miura-crease-hinge')});if(j<rows)creases.push({i,j,k:i,l:j+1,o:unitRod(g,tpu,'Miura-crease-hinge')});}
  update=t=>{const theta=.20+.30*(.5+.5*Math.sin(t*.6)),L=a*Math.cos(theta),H=a*Math.sin(theta),D=b*Math.cos(alpha)/Math.cos(theta),W=Math.sqrt(b*b-D*D);const point=(i:number,j:number):V=>[(i-cols/2)*L+(j%2?D:0)-D/2,.15+(i%2?H:0),(j-rows/2)*W];
   facets.forEach(({i,j,sheet})=>{const A=vec(point(i,j)),B=vec(point(i+1,j)),C=vec(point(i,j+1)),U=B.clone().sub(A),V=C.clone().sub(A),normal=new T.Vector3().crossVectors(U,V).normalize();sheet.write((s,side,face)=>A.clone().addScaledVector(U,s).addScaledVector(V,(side+1)/2).addScaledVector(normal,face*th/2).toArray() as V);});creases.forEach(c=>segment(c.o,point(c.i,c.j),point(c.k,c.l),hr));on(landmarks[0],point(1,1));on(landmarks[1],vec(point(1,0)).lerp(vec(point(1,1)),.5).toArray() as V);on(landmarks[2],point(cols,rows));on(landmarks[3],point(0,rows));return 'Rigid parallelograms fold at shared creases · edge lengths stay fixed';};
  labels=['Rigid facet','Flexible shared crease','Coupled unfolding','Alternating mountain fold'];fixture='fold';
 }else if(p.kind==='kirigami'){
  const lanes=n+2,width=2.8/lanes*.66,gauge=width*(.01+.02*q),length=3.75,steps=48,waves=v+1;
  const strips=Array.from({length:lanes},()=>ribbon(g,primary,steps,'connected-cut-ribbon'));
  const left=box(g,primary,[.16,gauge*2,3.05],[0,.22,0],'uncut-end-tab'),right=box(g,primary,[.16,gauge*2,3.05],[0,.22,0],'uncut-end-tab');
  update=t=>{const amplitude=.34+.43*(.5+.5*Math.sin(t*.65)),xx=[0],yy=[0];for(let i=1;i<=steps;i++){const theta=amplitude*Math.cos(waves*Math.PI*(i-.5)/steps);xx.push(xx[i-1]+length/steps*Math.cos(theta));yy.push(yy[i-1]+length/steps*Math.sin(theta));}const span=xx[steps];strips.forEach((s,k)=>{const z=(k-(lanes-1)/2)*2.8/lanes;s.write((u,side,face)=>{const i=Math.round(u*steps);return [xx[i]-span/2,.22+yy[i]+face*gauge/2,z+side*width/2];});});left.position.x=-span/2-.07;right.position.x=span/2+.07;on(landmarks[0],[0,.22+yy[steps/2],-(lanes-1)/2*2.8/lanes]);on(landmarks[1],[-span/2,.22,0]);on(landmarks[2],[0,.22+yy[steps/2],2.8/lanes*.5]);on(landmarks[3],[span/2,.22,0]);return 'Attached slit ribbons bow out of plane as the end tabs approach';};
  labels=['Continuous cut ribbon','Uncut attachment tab','Open slit','Moving end tab'];fixture='ribbons';
 }else if(p.kind==='bistable-beam'){
  const span=3.35,h=v===0?.27:.49,th=span*(.01+.02*q),lanes=n,spacing=2.65/lanes,base=.05;
  const arches:{z:number;s:ReturnType<typeof ribbon>}[]=[];
  for(let k=0;k<lanes;k++)for(let side=0;side<(v===2?2:1);side++){const z=(k-(lanes-1)/2)*spacing+(v===2?(side-.5)*spacing*.29:0);arches.push({z,s:ribbon(g,primary,40,'precurved-steel-arch')});}
  box(g,metal,[.28,.24,3.05],[-span/2-.10,base,0],'rigid-aluminium-end-clamp');box(g,metal,[.28,.24,3.05],[span/2+.10,base,0],'rigid-aluminium-end-clamp');
  const shuttle=box(g,metal,[.23,.15,2.95],[0,0,0],'rigid-aluminium-shuttle');
  update=t=>{const snap=Math.tanh(5*Math.cos(t*.65)),height=h*snap;arches.forEach(({z,s})=>s.write((u,side,face)=>[-span/2+span*u,base+height*Math.sin(Math.PI*u)+face*th/2,z+side*spacing*(v===2?.065:.13)]));shuttle.position.y=base+height;on(landmarks[0],[-span/2,base,0]);on(landmarks[1],[-span*.25,base+height*.707,arches[0].z]);on(landmarks[2],[0,base+height,0]);on(landmarks[3],[span/2,base,0]);return 'Prescribed snap-through · the arch passes between two curved states';};
  labels=['Rigid end clamp','Precurved steel beam','Moving aluminium shuttle','Fixed beam end'];fixture='snap';
 }else if(p.kind==='tensegrity'){
  primary.color.lerp(new T.Color('#bac6cc'),.3);
  const sides=3+v,moduleScale=Math.min(1,4.35/(n*1.8)),R=.66*moduleScale,L=2.02*moduleScale,barR=R*(.045+.035*q),cableR=R*.023;
  const modules=Array.from({length:n},(_,k)=>{const x=(k-(n-1)/2)*1.8*moduleScale;const bars=Array.from({length:sides},()=>unitRod(g,primary,'isolated-composite-compression-strut'));const cables=Array.from({length:sides*3},()=>unitRod(g,metal,'steel-tension-cable'));const nodes=Array.from({length:sides*2},()=>mesh(new T.SphereGeometry(barR*1.55,8,6),metal,g,'cable-and-strut-node'));return {x,bars,cables,nodes};});
  update=t=>{const theta=Math.PI/2+Math.PI/sides+.07*Math.sin(t*.6),height=Math.sqrt(L*L-4*R*R*Math.sin(theta/2)**2);modules.forEach(mod=>{const b:V[]=[],u:V[]=[];for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides;b.push([mod.x+R*Math.cos(a),barR*1.55,R*Math.sin(a)]);u.push([mod.x+R*Math.cos(a+theta),barR*1.55+height,R*Math.sin(a+theta)]);}for(let i=0;i<sides;i++){segment(mod.bars[i],b[i],u[i],barR);segment(mod.cables[i*3],b[i],b[(i+1)%sides],cableR);segment(mod.cables[i*3+1],u[i],u[(i+1)%sides],cableR);segment(mod.cables[i*3+2],b[i],u[(i+sides-1)%sides],cableR);on(mod.nodes[i],b[i]);on(mod.nodes[i+sides],u[i]);}if(mod===modules[0]){on(landmarks[0],mod.bars[0].position.toArray() as V);on(landmarks[1],mod.cables[2].position.toArray() as V);on(landmarks[2],u[0]);on(landmarks[3],b[0]);}});return 'Fixed-length struts · a prescribed twist changes cable geometry';};
  labels=['Isolated compression strut','Tension-only steel cable','Cable junction','Supported lower node'];fixture='tensegrity';
 }else if(p.kind==='spinodal-shell'){
  // A band around a deterministic, non-periodic random-wave level set.
  // Not a gyroid; orientation bias is explicit and no isotropy is claimed.
  const resolution=software?25:34,mc=new MarchingCubes(resolution,primary,false,false,140000);mc.isolation=0;
  const modes=[[.87,.31,.38,0],[.14,.93,-.34,1.3],[-.62,.54,.57,2.1],[.43,-.72,.55,.7],[-.28,-.34,.90,3.4],[.76,.62,-.18,4.2],[.57,-.20,-.80,1.8],[-.84,.16,.51,5.1],[.21,.77,.60,2.7]];
  const freq=2.8+(n-1)*.65,band=.16+q*.19;
  for(let z=0;z<resolution;z++)for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
   const xx=(x/(resolution-1)-.5)*2,yy=(y/(resolution-1)-.5)*2,zz=(z/(resolution-1)-.5)*2;
   const bias=v===1?[1,.55,1]:v===2?[.67,1,.67]:[1,1,1];let f=0;for(const [a,b,c,phase] of modes)f+=Math.cos(freq*(a*xx*bias[0]+b*yy*bias[1]+c*zz*bias[2])+phase);f/=Math.sqrt(modes.length);
   const border=Math.min(x,y,z,resolution-1-x,resolution-1-y,resolution-1-z);mc.field[x+y*resolution+z*resolution*resolution]=border<2?-2:band-Math.abs(f);
  }
  mc.update();
  // Retain the largest connected component: no detached shell islands.
  const src=mc.geometry.attributes.position as T.BufferAttribute;const triangles=Math.floor(Math.min(mc.geometry.drawRange.count,src.count)/3),parent=new Int32Array(triangles),weight=new Int32Array(triangles);const vertexOwner=new Map<string,number>();
  const find=(a:number):number=>{while(parent[a]!==a){parent[a]=parent[parent[a]];a=parent[a];}return a;};
  for(let i=0;i<triangles;i++){parent[i]=i;weight[i]=1;for(let k=0;k<3;k++){const at=i*3+k,key=`${Math.round(src.getX(at)*1e5)},${Math.round(src.getY(at)*1e5)},${Math.round(src.getZ(at)*1e5)}`;const seen=vertexOwner.get(key);if(seen===undefined)vertexOwner.set(key,i);else{const a=find(i),b=find(seen);if(a!==b){parent[a]=b;weight[b]+=weight[a];}}}}
  let largest=0;for(let i=0;i<triangles;i++)if(weight[find(i)]>weight[largest])largest=find(i);
  const pos:number[]=[];for(let i=0;i<triangles;i++)if(find(i)===largest)for(let k=0;k<3;k++){const at=i*3+k;pos.push(src.getX(at)*2,src.getY(at)*1.30+1.22,src.getZ(at)*1.5);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();geo.computeBoundingBox();const shell=mesh(geo,primary,g,'connected-disordered-implicit-shell');mc.geometry.dispose();
  const bounds=geo.boundingBox!;const center=bounds.getCenter(new T.Vector3());
  const pointNear=(target:V):V=>{let best=Infinity,out:V=[0,0,0];const attr=geo.attributes.position;for(let i=0;i<attr.count;i++){const a:V=[attr.getX(i),attr.getY(i),attr.getZ(i)],d=vec(a).distanceToSquared(vec(target));if(d<best){best=d;out=a;}}return out;};
  on(landmarks[0],pointNear([-1,1.5,.7]));on(landmarks[1],pointNear([.3,1.8,.9]));on(landmarks[2],pointNear([1,.7,.9]));on(landmarks[3],pointNear([-.6,bounds.min.y,.3]));
  update=t=>{const strength=.5+.5*Math.sin(t*.8);primary.emissive.set('#dc8e54');primary.emissiveIntensity=.025+.075*strength;return 'Load path illustration · connected disordered shell; no solved stress field';};
  void shell;void center;labels=['Continuous curved shell','Disordered pore opening','Connected load path','Seated lower surface'];fixture='spinodal';
 }else if(p.kind==='chainmail'){
  const cols=n+1,rows=v===1?2:n+1,pitch=3.8/(n+1),R=pitch*.37,bridgeR=pitch*.36,wire=R*(.05+.04*q);
  type Link={x:number;z:number;kind:number;o:T.Mesh};const links:Link[]=[];
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=(i-(cols-1)/2)*pitch,z=(j-(rows-1)/2)*pitch;links.push({x,z,kind:0,o:ring(g,primary,R,wire,'closed-steel-link')});if(i+1<cols)links.push({x:x+pitch/2,z,kind:1,o:ring(g,primary,bridgeR,wire,'interlocking-bridge-link')});if(j+1<rows)links.push({x,z:z+pitch/2,kind:2,o:ring(g,primary,bridgeR,wire,'interlocking-bridge-link')});}
  update=t=>{const sag=.17+.10*(.5+.5*Math.sin(t*.65)),half=(cols-1)*pitch/2;links.forEach(l=>{const x=l.x,offset=v===2?.12:0,y=.35+offset*x/half-sag*(1-(x/half)**2),slope=offset/half+2*sag*x/(half*half);l.o.position.set(x,y,l.z);l.o.rotation.set(0,0,0);if(l.kind===0)l.o.rotation.x=Math.PI/2;else if(l.kind===2)l.o.rotation.y=Math.PI/2;l.o.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.atan(slope)));});[0,1,links.length-1,Math.floor(links.length/2)].forEach((k,i)=>{on(landmarks[i],links[k].o.position.toArray() as V);if(links[k].kind===0)landmarks[i].position.z+=R;else landmarks[i].position.y+=bridgeR;});return 'Rigid closed links change orientation · clearance permits drape';};
  labels=['Closed steel link','Interlocking bridge','Free outer link','Same steel phase'];fixture='drape';
 }else if(p.kind==='thermal-expansion'){
  const length=3.45,total=length*(.01+.02*q),share=[.5,.7,.3][v],alT=total*share,invarT=total*(1-share),width=2.5/n*.62;
  const aluminium=material(p.color,.7,!!p.wire),strips=Array.from({length:n},(_,i)=>({z:(i-(n-1)/2)*2.5/n,al:ribbon(g,aluminium,36,'bonded-aluminium-layer'),low:ribbon(g,invar,36,'bonded-Invar-layer')}));
  box(g,metal,[.25,.34,2.85],[-length/2-.09,.65,0],'bimetal-fixed-clamp');
  update=t=>{const heat=.5+.5*Math.sin(t*.6),curvature=(.035+heat*.20)/(1+q*.8)*(v===0?1:.84);const location=(s:number,d:number,z:number):V=>{const a=curvature*length*s;return [-length/2+Math.sin(a)/curvature-d*Math.sin(a),.65+(1-Math.cos(a))/curvature+d*Math.cos(a),z];};strips.forEach(s=>{s.al.write((u,side,face)=>location(u,-alT/2+face*alT/2,s.z+side*width/2));s.low.write((u,side,face)=>location(u,invarT/2+face*invarT/2,s.z+side*width/2));});aluminium.emissive.set('#d86d28');aluminium.emissiveIntensity=heat*.13;on(landmarks[0],location(.38,-alT,strips[0].z));on(landmarks[1],location(.55,invarT,strips[0].z));on(landmarks[2],location(1,0,0));on(landmarks[3],[-length/2,.65,0]);return 'Heating bows bonded aluminium/Invar toward the lower-expansion Invar';};
  labels=['Higher-expansion aluminium','Lower-expansion Invar','Thermally moving tip','Bonded, clamped root'];fixture='thermal';
 }
 g.userData.mechanicalRig={update,landmarks,labels,fixture} satisfies Rig;update(0);return g;
}

export function createMechanicalBehavior(p:LatticeOptions,lattice:T.Group):Behavior|undefined {
 if(!ids.includes(p.kind))return undefined;
 const rig=lattice.userData.mechanicalRig as Rig|undefined;if(!rig)return undefined;
 const group=new T.Group();group.name=`behavior-${p.kind}`;
 const arrow=fieldArrow(group,[2.5,.8,0],p.kind==='thermal-expansion'?[-1,0,0]:[0,-1,0],p.kind==='thermal-expansion'?'#ffb36d':'#85ddf7',.48);
 const halo=new T.Mesh(new T.TorusGeometry(.14,.009,5,28),new T.MeshBasicMaterial({color:p.kind==='thermal-expansion'?'#ffb36d':'#85ddf7',transparent:true,opacity:.65}));halo.name='explanatory-observation-marker';group.add(halo);
 return {group,camera:[9,6,10],target:[0,.25,0],update:t=>{const status=rig.update(t);const a=rig.landmarks[p.kind==='thermal-expansion'?2:1];a.updateWorldMatrix(true,false);halo.position.copy(a.getWorldPosition(new T.Vector3()));halo.position.y+=.18;halo.rotation.x=Math.PI/2;arrow.position.copy(halo.position).add(new T.Vector3(.12,.7,0));return status;}};
}

export function createMechanicalApplication(p:LatticeOptions,lattice:T.Group):Application|undefined {
 if(!ids.includes(p.kind))return undefined;const rig=lattice.userData.mechanicalRig as Rig|undefined;if(!rig)return undefined;
 const group=new T.Group();group.name=`application-${p.kind}`;group.add(lattice);rig.update(0);
 const frame=material('#314653',.42),steel=material('#bdc7cc',.78),rubber=material('#263238');
 const bounds=new T.Box3().setFromObject(lattice),min=bounds.min.clone(),max=bounds.max.clone();
 // All fixture dimensions derive from actual material bounds, not its centre.
 const baseY=Math.min(-.58,min.y-.30),base=box(group,frame,[5.9,.20,4.25],[0,baseY-.10,0],'teaching-fixture-base');
 const hardware:T.Mesh[]=[];let moving:T.Mesh|undefined;let support:T.Mesh|undefined;
 if(rig.fixture==='shear'){
  support=box(group,steel,[4.7,.16,3.15],[0,min.y-.08,0],'fixed-lower-shear-platen');moving=box(group,steel,[4.7,.16,3.15],[0,max.y+.08,0],'moving-upper-shear-platen');
  for(const x of [-2.62,2.62])rod(group,frame,[x,baseY,0],[x,max.y+.48,0],.085,'guide-post');
 }else if(rig.fixture==='snap'){
  for(const x of [-1.775,1.775])box(group,frame,[.28,-.07-baseY,3.05],[x,(baseY-.07)/2,0],'end-clamp-support');
  const cross=box(group,frame,[4.65,.18,.22],[0,1.05,0],'snap-test-crosshead');for(const x of [-2.25,2.25])box(group,frame,[.16,1.05-baseY,.22],[x,(1.05+baseY)/2,0],'crosshead-post');moving=box(group,steel,[.10,.7,.10],[0,.65,0],'shuttle-actuator');void cross;
 }else if(rig.fixture==='thermal'){
  box(group,frame,[.30,.48-baseY,2.85],[-1.815,(.48+baseY)/2,0],'bimetal-clamp-pedestal');
  box(group,material('#955d3f',.5),[3.6,.12,2.8],[.1,.02,0],'radiant-heater');
  box(group,frame,[3.6,.02-baseY-.06,2.8],[.1,(baseY-.04)/2,0],'heater-pedestal');for(let i=0;i<9;i++)box(group,steel,[.035,.10,2.64],[-1.35+i*.37,.13,0],'heater-fin');
  box(group,frame,[.05,1.43-baseY,.05],[2.16,(1.43+baseY)/2,1.45],'tip-displacement-scale');for(let i=0;i<7;i++)box(group,steel,[.13,.014,.05],[2.11,.15+i*.19,1.45],'scale-tick');
 }else if(rig.fixture==='spinodal'){
  support=box(group,steel,[4.15,.12,3.18],[0,min.y-.06,0],'shell-test-support');moving=box(group,steel,[4.15,.12,3.18],[0,max.y+.06,0],'shell-load-platen');for(const x of [-2.5,2.5])rod(group,frame,[x,baseY,0],[x,max.y+.45,0],.075,'load-frame-column');
 }else if(rig.fixture==='tensegrity'){
  // Individual seats contact each lower junction at its actual lower surface.
  const nodes:T.Mesh[]=[];lattice.traverse(o=>{if(o instanceof T.Mesh&&o.name==='cable-and-strut-node'&&o.position.y<.3)nodes.push(o);});nodes.forEach(o=>{const radius=(o.geometry as T.SphereGeometry).parameters.radius;const y=o.position.y-radius;box(group,frame,[radius*3.3,y-baseY,radius*3.3],[o.position.x,(y+baseY)/2,o.position.z],'lower-node-seat');});
 }else if(rig.fixture==='drape'){
  // Support the edge links on a rail; interlocking links carry the interior.
  const pitch=3.8/(count(p.count)+1),R=pitch*.37,wire=R*(.05+.04*normalized(p.thickness)),edge=count(p.count)*pitch/2;for(const x of [-edge,edge]){const railY=.35+(p.variant===2?.12*x/edge:0)-wire-.05;const rail=rod(group,steel,[x,railY,min.z-.15],[x,railY,max.z+.15],.05,'curtain-support-rail');hardware.push(rail);for(const z of [min.z-.15,max.z+.15])box(group,frame,[.12,railY-baseY,.12],[x,(railY+baseY)/2,z],'curtain-support-post');}
 }else {
  // An open fixture exposes both faces. Movable pins meet real boundary parts.
  for(const z of [-1.85,1.85])box(group,frame,[5.4,.12,.15],[0,-.32,z],'linear-guide-rail');
  for(const x of [-2.6,2.6])box(group,frame,[.15,.12,3.85],[x,-.32,0],'guide-end');
  for(const x of [-2.6,2.6])for(const z of [-1.85,1.85])box(group,frame,[.18,-.38-baseY,.18],[x,(baseY-.38)/2,z],'guide-rail-leg');for(const idx of (rig.fixture==='ribbons'?[1,3]:[0,2,3])){const a=rig.landmarks[idx];const pin=unitRod(group,steel,'boundary-grip-pin');hardware.push(pin);pin.userData.anchorIndex=idx;const carriage=box(group,steel,[.12,.12,3.70],[a.position.x,-.32,0],'transverse-sliding-carriage');pin.userData.carriage=carriage;}
 }
 // Visible legs attach each elevated platen to the bench beneath it.
 if(support)for(const x of [-1.8,1.8])for(const z of [-1.1,1.1]){const y=support.position.y-(support.geometry as T.BoxGeometry).parameters.height/2;box(group,frame,[.20,Math.max(.02,y-baseY),.20],[x,(y+baseY)/2,z],'support-leg');}
 const callouts:Callout[]=rig.landmarks.map((a,i)=>({label:rig.labels[i],anchor:a,side:i<2?'left':'right',slot:i%2}));
 const loadColor=p.kind==='thermal-expansion'?'#ffb36d':'#85ddf7';const load=fieldArrow(group,[0,max.y+.55,0],p.kind==='pentamode'?[1,0,0]:[0,-1,0],loadColor,.4);
 const update=(t:number,_e:number)=>{const status=rig.update(t);
  if(rig.fixture==='shear'&&moving)moving.position.x=.075*Math.sin(t*.75)*(max.y-min.y);
  if(rig.fixture==='snap'&&moving){const a=rig.landmarks[2];const top=1.03,bottom=a.position.y+.075;moving.position.y=(top+bottom)/2;moving.scale.y=(top-bottom)/.7;}
  for(const pin of hardware){const idx=pin.userData.anchorIndex;if(typeof idx==='number'){const a=rig.landmarks[idx].position;(pin.userData.carriage as T.Mesh).position.x=a.x;segment(pin,[a.x,-.26,a.z],[a.x,a.y,a.z],.035);}}
  if(p.kind==='thermal-expansion'){load.position.set(0,.30,1.0);load.setDirection(new T.Vector3(0,1,0));}else if(p.kind==='pentamode')load.position.set(moving?.position.x??0,max.y+.28,0);else if(p.kind==='bistable-beam')load.position.set(.38,rig.landmarks[2].position.y+.53,0);else load.position.set(rig.landmarks[2].position.x,rig.landmarks[2].position.y+.58,rig.landmarks[2].position.z);
  return status;};update(0,0);void base;void rubber;
 return {group,callouts,camera:[10,7,11],target:[0,.4,0],update};
}
