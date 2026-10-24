import * as THREE from 'three';
import {createExplosion} from './explosion.js';
export function createVehicle({scene,box,material,textPlane,put,targets,pickables,reduced}){
 const group=new THREE.Group();scene.add(group);const moving=[],parts=[],lights=[],needles=[];let explosionTime=-1,lastPhase='wiring',opened=true;
 const mat={body:material('#269ac7',{metalness:.48,roughness:.35}),trim:material('#172131',{roughness:.8}),dark:material('#080f1b'),steel:material('#8da0b5',{metalness:.8}),seat:material('#a84e49',{roughness:.85})};
 function part(obj,x,y,z,explode=true){put(group,obj,x,y,z);obj.castShadow=true;obj.receiveShadow=true;if(explode)parts.push({obj,p:obj.position.clone(),r:obj.rotation.clone(),v:new THREE.Vector3(),spin:new THREE.Vector3()});return obj;}
 // A stylized cutaway training car: an open dashboard, steering wheel, seats and wheels.
 part(box(6.1,.5,3.5,mat.body,.2),3.6,.48,-1.65);
 part(box(6.2,.25,.4,mat.trim,.08),3.6,.45,.15);
 for(const x of [.55,6.65])for(const z of [-2.8,-.55]){
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.32,28),mat.dark);tire.rotation.z=Math.PI/2;const t=part(tire,x,.48,z);parts.at(-1).r.copy(t.rotation);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.34,20),mat.steel);hub.rotation.z=Math.PI/2;part(hub,x,.48,z);
 }
 for(const x of [.95,6.25]){
  const lamp=part(box(.52,.23,.08,material('#c6e8ff',{emissive:'#90dfff',emissiveIntensity:.05}),.04),x,.85,.13);lights.push(lamp);
 }
 for(const x of [1.5,5.1]){part(box(1.35,.3,1.15,mat.seat,.13),x,.85,-2.5);const back=part(box(1.35,1.3,.3,mat.seat,.15),x,1.45,-3);back.rotation.x=-.12;part(box(.7,.4,.25,mat.trim,.08),x,2.18,-3.1);}
 const dash=part(box(5.85,.8,1.18,mat.trim,.15),3.6,2.77,-1.8);
 // Hollow opening: dark rear wall, metal rails and a cover folded downward.
 part(box(3.6,1.45,.08,mat.dark,.025),4.6,1.9,-1.14);
 for(const x of [2.72,6.48])part(box(.12,1.7,.4,mat.steel,.025),x,1.9,-1.17);
 part(box(3.85,.11,.4,mat.steel,.025),4.6,2.72,-1.17);part(box(3.85,.11,.4,mat.steel,.025),4.6,1.03,-1.17);
 const cover=part(box(3.8,.85,.13,mat.body,.08),4.6,.82,-.25);cover.rotation.x=-.65;parts.at(-1).r.copy(cover.rotation);
 const coverLabel=textPlane('ACESSO AO CHICOTE DO VEÍCULO',{width:3.3,height:.22,font:29,color:'#c5edff'});coverLabel.position.set(4.6,.79,-.12);coverLabel.rotation.x=-.65;group.add(coverLabel);
 part(box(.12,1.2,.25,mat.trim,.03),.65,2.45,-2.65);part(box(.12,1.2,.25,mat.trim,.03),6.55,2.45,-2.65);part(box(6,.12,.25,mat.body,.04),3.6,3.1,-2.65);
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(5.7,1.13),new THREE.MeshPhysicalMaterial({color:'#98d8ff',transparent:true,opacity:.13,roughness:.15,metalness:0,side:THREE.DoubleSide,depthWrite:false}));part(glass,3.6,2.5,-2.68);
 for(const x of [1.14,2.03]){
  const dial=new THREE.Mesh(new THREE.CircleGeometry(.39,40),material('#071624',{emissive:'#07333b',emissiveIntensity:.25}));part(dial,x,2.55,-1.12);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.39,.027,8,40),material('#59c8dd',{emissive:'#36bbdc',emissiveIntensity:.3}));part(ring,x,2.55,-1.1);lights.push(ring);
  for(let k=0;k<9;k++){const a=-Math.PI*.75+k*Math.PI*1.5/8;part(box(.025,.055,.012,material('#badde8'),.005),x+Math.sin(a)*.32,2.55+Math.cos(a)*.32,-1.075,false);}
  const needle=new THREE.Group();put(group,needle,x,2.55,-1.04);put(needle,box(.02,.27,.012,material('#f39762',{emissive:'#ed7138',emissiveIntensity:.3}),.004),0,.1,0);needles.push(needle);
 }
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.59,.065,10,44),mat.trim);part(wheel,1.6,1.65,-.03);for(const a of [0,2.1,4.2]){const spoke=part(box(.06,.48,.07,mat.trim,.02),1.6+Math.sin(a)*.22,1.65+Math.cos(a)*.22,-.03);spoke.rotation.z=-a;}
 const center=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.13,24),mat.body);center.rotation.x=Math.PI/2;part(center,1.6,1.65,-.02);
 put(group,textPlane('OFICINA · VEÍCULO DE TREINO',{width:5.5,height:.33,font:32,color:'#b1e7ff'}),3.6,3.37,-1.17);
 const nodes=new Map(),portObjects=[];
 for(let i=0;i<targets.length;i++){
  const t=targets[i],x=3.14+(i%4)*.93,y=2.25-Math.floor(i/4)*.78,z=-.96;
  const root=new THREE.Mesh(new THREE.SphereGeometry(.075,12,10),material(t.color));put(group,root,x,y,z);
  const point=new THREE.Vector3(x,y-.17,z+.58);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,z),new THREE.Vector3(x-.08,y-.08,z+.27),point]);
  const lead=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.036,8,false),material(t.color,{emissive:t.color,emissiveIntensity:.05}));group.add(lead);lead.userData={kind:'target',target:t.id};pickables.push(lead);
  const port=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),material(t.color,{emissive:t.color,emissiveIntensity:.12}));port.position.copy(point);group.add(port);port.userData={kind:'target',target:t.id};pickables.push(port);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.105,.015,7,24),mat.steel);ring.position.copy(point);group.add(ring);
  const label=textPlane(t.short,{width:.88,height:.19,font:29,color:t.color});put(group,label,x,y+.19,z+.13);
  portObjects.push(root,lead,port,ring,label);nodes.set(t.id,{mesh:port,point:point.clone(),color:t.color,ring});
 }
 const coil=part(box(.48,.5,.35,material('#bba979'),.04),5.6,1.32,-1.12);put(group,textPlane('RELÉ',{width:.5,height:.15,font:25,color:'#182331'}),5.6,1.34,-.925);
 const explosion=createExplosion(scene,{reduced});
 const blockedLabel=put(group,textPlane('MOTOR BLOQUEADO',{width:3.5,height:.42,color:'#ff8f87',bg:'#471a1d',font:34}),3.6,3.9,-1.2);blockedLabel.visible=false;
 const buzzerLabel=put(group,textPlane('BUZZER ACIONADO',{width:3,height:.34,color:'#ffe49b',font:30}),3.6,4.35,-1.2);buzzerLabel.visible=false;
 for(const p of parts){p.p.copy(p.obj.position);p.r.copy(p.obj.rotation);}
 let gaugeOn=false;
 function setOpen(value){opened=value;cover.position.y=value?.82:1.9;cover.position.z=value?-.25:-.6;cover.rotation.x=value?-.65:0;coverLabel.visible=value;for(const o of portObjects)o.visible=value;}
 function explode(){explosionTime=0;explosion.start();for(const [i,p] of parts.entries()){const a=i*2.399;p.v.set(Math.cos(a)*(1.2+i%3),2.5+(i%4)*.7,Math.sin(a)*(1.5+i%2));p.spin.set((i%3-.8)*2,(i%4-1.5)*1.5,(i%5-2)*1.2);}for(const o of portObjects)o.visible=false;}
 function reset(){lastPhase='wiring';explosionTime=-1;explosion.reset();for(const p of parts){p.obj.position.copy(p.p);p.obj.rotation.copy(p.r);}group.rotation.set(0,0,0);setOpen(true);}
 function update(dt,phase,reading,time,camera){
  explosion.update(dt,camera);blockedLabel.visible=phase==='running'&&reading.blocked;buzzerLabel.visible=phase==='running'&&reading.buzzer&&(reduced||Math.sin(time*8)>-.2);
  if(phase==='exploded'&&lastPhase!=='exploded')explode();if(phase!=='exploded'&&lastPhase==='exploded')reset();lastPhase=phase;
  gaugeOn=phase==='running'&&reading.ignition&&!reading.blocked;
  for(const lamp of lights)lamp.material.emissiveIntensity=gaugeOn?1.6:.08;
  for(const [i,n] of needles.entries())n.rotation.z=gaugeOn?(i===0?-.18:-.7)+Math.sin(time*13)*.02:1.1;
  if(explosionTime>=0){explosionTime+=dt;const t=explosionTime;
   if(t<2.4&&!reduced)for(const p of parts){p.v.y-=dt*8;p.obj.position.addScaledVector(p.v,dt);p.obj.rotation.x+=p.spin.x*dt;p.obj.rotation.y+=p.spin.y*dt;p.obj.rotation.z+=p.spin.z*dt;if(p.obj.position.y<.18){p.obj.position.y=.18;p.v.multiplyScalar(.3);p.v.y=Math.abs(p.v.y)*.2;}}

  }
 }
 return {group,nodes,update,setOpen,reset,get shake(){return explosion.shake;},get open(){return opened;},get exploded(){return explosionTime>=0;}};
}

