import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {TARGETS,setHarness,readBench} from './wiring.js';
import {MISSIONS,createChallenge,missionFor,startChallenge,stopChallenge,repairChallenge,relocateWire} from './challenge.js';
import {createVehicle} from './vehicle.js';
import {createTelemetry} from './telemetry.js';
import {createInstallerGame} from './story.js';
import {CAMERA_HELP,CABLE_HELP,applySensitivity,nearestScreenPoint,bindCableInteraction} from './interaction.js';

const $=id=>document.getElementById(id),guide=window.LCV5Installation,photos=JSON.parse($('lab-photos-data').textContent);
const pinMap=new Map(guide.data.pins.map(p=>[p.key,p]));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette={vermelho:'#d74b4b',preto:'#26303f',branco:'#e3e8ee',amarelo:'#eed252',verde:'#40a57d',azul:'#5689e0',roxo:'#9d70df',rosa:'#e7a0cc',laranja:'#eea35e',marrom:'#936d50',castanho:'#936d50',cinza:'#a6b0bb',cinzento:'#a6b0bb',ciano:'#56cbd4'};
let state=createChallenge(),connector=14,selected='14-1',harness='agile';
let renderer,scene,camera,controls,device,vehicle,telemetry,frameId,interaction,story,hoverTarget=null;
const sourceNodes=new Map(),wires=new Map(),plugs=new Map(),targetNodes=new Map(),pickables=[],feedbackLines=[];
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.22);
let relayLamp,buzzerLamp,powerLamp,deviceGlow;
const stage=$('stage');let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let booted=false,context=null,saveTimer=0,sceneAttempted=false;
const mode=new URLSearchParams(location.search).get('mode')==='free'?'free':'campaign';
const workshopSaveKey='andersons-workshop-'+mode+'-v1';
const worldPin=(c,n)=>new THREE.Vector3((c===14?-7.4:-3.6)+((n-1)%3)*1.18,.25,1.25+Math.floor((n-1)/3)*.94);
function colors(pin){return guide.pinColor(pin,harness).toLowerCase().split('/').map(c=>palette[c.trim()]||'#b3c1d3');}
function swatch(pin){const c=colors(pin);return `<i class="swatch" style="background:${c.length===1?c[0]:`repeating-linear-gradient(125deg,${c[0]} 0,${c[0]} 6px,${c[1]} 6px,${c[1]} 10px)`}" aria-hidden="true"></i>`;}
function say(message,kind='info'){$('feedback').textContent=message;$('feedback').dataset.kind=kind;}
function chosenTarget(){return state.connections[selected];}
function renderUI(){
 const pin=pinMap.get(selected),family=guide.data.families.find(f=>f.id===pin.kind),status=readBench(state),mission=missionFor(state),running=state.phase==='running',destroyed=state.phase==='exploded';
 const oldCustom=$('mission-select').querySelector('[value=service]');if(state.customMission&&!oldCustom){const option=document.createElement('option');option.value='service';option.textContent='Ordem de serviço do cliente';$('mission-select').append(option);}else if(!state.customMission)oldCustom?.remove();
 $('mission-select').value=state.mission;
 $('briefing').innerHTML=`<strong>${escape(mission.title)}</strong><p>${escape(mission.brief)}</p><ol>${mission.instructions.map(s=>`<li>${escape(s)}</li>`).join('')}</ol>`;
 $('harness').value=String(connector);$('attach').textContent=state.attached[connector]?'Retirar chicote de '+connector:'Encaixar chicote de '+connector;
 $('attach').classList.toggle('active',state.attached[connector]);$('attach').disabled=running||destroyed;
 $('attach-both').disabled=running||destroyed;$('attach-both').textContent=state.attached[14]&&state.attached[16]?'Dois chicotes encaixados · 14 + 16':'Usar os dois chicotes · 14 + 16';
 for(const c of [14,16]){$('attached-'+c).textContent=c+' · '+(state.attached[c]?'encaixado':'solto');$('attached-'+c).classList.toggle('on',state.attached[c]);}
 $('pins').innerHTML=guide.data.pins.filter(p=>p.connector===connector).sort((a,b)=>a.number-b.number).map(p=>`<button class="pin" type="button" data-pin="${p.key}" aria-pressed="${p.key===selected}" aria-label="Pino ${p.number}, ${escape(p.name)}, ${escape(guide.pinColor(p,harness))}">${swatch(p)}<span class="number">${p.number}</span><span>${escape(p.name)}</span>${state.connections[p.key]?'<span class="connected" aria-label="cabo ligado">'+(running?'✓':'●')+'</span>':''}</button>`).join('');
 $('wire-detail').innerHTML=`<div class="detail-top">Conector ${pin.connector} · pino ${pin.number}</div><div class="detail-title">${escape(pin.name)}</div><div class="wire-color">${swatch(pin)}${escape(guide.pinColor(pin,harness))}</div>`;
 $('wire-limits').innerHTML=`<p>${escape(family.simple)}</p><p>${escape(family.wiring)}</p><p>${escape(family.limits)}</p>`;
 $('targets').innerHTML=TARGETS.map(t=>`<button type="button" data-target="${t.id}" data-connected="${running&&chosenTarget()===t.id}" title="${escape(t.name)}"${running||destroyed?' disabled':''}>${escape(t.short)}</button>`).join('');
 const target=TARGETS.find(t=>t.id===chosenTarget());
 $('connection-detail').innerHTML=target?`Cabo ligado a: <strong>${escape(target.name)}</strong>${running?' · conferido':destroyed?(state.lastFault===selected?' · erro apontado':' · aguarda nova conferência'):' · aguarda teste'}<br><button type="button" id="disconnect"${running||destroyed?' disabled':''}>Desconectar este fio</button>`:`${destroyed?'Repare o veículo para tentar outra montagem.':state.attached[pin.connector]?'Puxe a ponta até o cabo do veículo, ou selecione uma ponta pelos botões.':'Encaixe o chicote de '+pin.connector+' pinos para usar esse fio.'}`;
 $('power').textContent=destroyed?'Veículo avariado · repare para continuar':running?'Desligar veículo e alterar instalação':'Testar instalação e dar partida';$('power').disabled=destroyed;
 $('telemetry-open').disabled=!running;$('power').classList.toggle('active',running);
 for(const key of ['ignition','relay','buzzer']){$(key).checked=state[key];$(key).disabled=!running;}$('sensor').disabled=!running;$('sensor').value=state.sensor;$('sensor-value').textContent=state.sensor.toFixed(1).replace('.',',')+' V';
 $('power-badge').textContent=destroyed?'VEÍCULO AVARIADO':running?(status.blocked?'MOTOR BLOQUEADO':state.ignition?'MOTOR LIGADO · INSTALAÇÃO OK':'CHAVE DESLIGADA · INSTALAÇÃO OK'):'MONTAGEM · AGUARDA TESTE';
 const count=Object.keys(state.connections).length;$('progress').style.width=Math.min(100,count/mission.required.length*100)+'%';$('mission').firstChild.textContent=`${mission.title} · ${count}/${mission.required.length} cabos ligados`;
 $('outcome').hidden=!destroyed;stage.classList.toggle('exploded',destroyed);stage.classList.toggle('blocked',status.blocked);
 const values=[['Energia',status.powered?'12,6 V':'desligada',status.powered],['DIN4',status.ignition?'ativa':'inativa',status.ignition],['Bloqueio',status.blocked?'bloqueado':'liberado',status.blocked],['Buzzer',status.buzzer?'acionado':'desligado',status.buzzer],['Analógica',status.analog===null?'sem leitura':state.sensor.toFixed(1).replace('.',',')+' V',status.analog!==null],['Instalação',destroyed?'avariada':running?'validada':'aguarda teste',running]];
 $('readings').innerHTML=values.map(([label,value,on])=>`<span${on?' class="on"':''}>${label}<strong>${value}</strong></span>`).join('');
 syncScene();telemetry?.render();story?.syncWorkshop();if(booted){clearTimeout(saveTimer);saveTimer=setTimeout(saveWorkshop,250);}
}
function choosePin(key){if(!pinMap.has(key))return;selected=key;connector=pinMap.get(key).connector;renderUI();}
function connectTo(id){const result=relocateWire(state,selected,id);say(result.message,result.ok?'info':'error');renderUI();}
function toggleHarness(c){if(state.phase!=='wiring'){say('Desligue ou repare o veículo antes de mexer nos chicotes.','error');return;}const result=setHarness(state,c,!state.attached[c]);say(result.message,result.ok?'success':'error');renderUI();}
function repairCurrent(){interaction?.cancel();const fault=repairChallenge(state);vehicle?.reset();telemetry?.reset();if(fault&&pinMap.has(fault)){selected=fault;connector=pinMap.get(fault).connector;}renderUI();say('Montagem preservada. Puxe o fio incorreto para outra ponta, solte-o na mesa ou use Desconectar. Depois teste novamente.');}
function resetChallenge(mission=state.mission,custom=mission===state.mission?state.customMission:null){interaction?.cancel();state=createChallenge(mission);if(custom)state.customMission=structuredClone(custom);selected='14-1';connector=14;telemetry?.reset();vehicle?.reset();renderUI();setView('overview');say('Veículo pronto. Leia a indicação do serviço e monte a instalação.');}
function tryEngine(){
 interaction?.cancel();
 if(state.phase==='running'){stopChallenge(state);renderUI();say('Veículo desligado. Você pode alterar a instalação.');return;}
 const result=startChallenge(state);
 if(result.outcome!=='incomplete')stage.scrollIntoView({block:'center',behavior:reduced?'auto':'smooth'});
 if(result.outcome==='explode'){$('outcome-message').textContent=result.message;say('BOOM! A instalação tem uma ligação errada. Você pode corrigir mantendo os cabos ou recomeçar do zero.','error');setView('vehicle');}
 else if(result.outcome==='success'){say(result.message,'success');setView('vehicle');const attempt=state;setTimeout(()=>{if(state===attempt&&state.phase==='running'&&!story?.installationSucceeded())telemetry.open();},850);}
 else say(result.message,'error');renderUI();
}
$('mission-select').innerHTML=MISSIONS.map(m=>`<option value="${m.id}">${escape(m.title)}</option>`).join('');
$('mission-select').addEventListener('change',e=>resetChallenge(e.target.value));
$('harness').addEventListener('change',e=>{connector=Number(e.target.value);selected=connector+'-1';renderUI();});
$('palette').addEventListener('change',e=>{harness=e.target.value;renderUI();});
$('attach').addEventListener('click',()=>toggleHarness(connector));
$('attach-both').addEventListener('click',()=>{if(state.phase!=='wiring')return;setHarness(state,14,true);setHarness(state,16,true);say('Os dois chicotes estão encaixados. Você pode escolher fios de 14 e de 16 pinos.','success');renderUI();});
$('pins').addEventListener('click',e=>{const b=e.target.closest('[data-pin]');if(b)choosePin(b.dataset.pin);});
$('targets').addEventListener('click',e=>{const b=e.target.closest('[data-target]');if(b)connectTo(b.dataset.target);});
$('connection-detail').addEventListener('click',e=>{if(e.target.id==='disconnect'){if(state.phase==='exploded')return;const point=sourceNodes.get(selected)?.cap.position.toArray()||[0,.25,1];const result=relocateWire(state,selected,null,point);say(result.message,result.ok?'info':'error');renderUI();}});
$('power').addEventListener('click',tryEngine);$('telemetry-open').addEventListener('click',()=>{if(state.phase==='running')telemetry.open();});
for(const key of ['ignition','relay','buzzer'])$(key).addEventListener('change',e=>{if(state.phase!=='running')return;state[key]=e.target.checked;if(key==='relay')state.blocked=state.relay;renderUI();});
$('sensor').addEventListener('input',e=>{if(state.phase!=='running')return;state.sensor=Number(e.target.value);renderUI();});
$('reset').addEventListener('click',()=>resetChallenge());$('repair').addEventListener('click',repairCurrent);$('restart-after-error').addEventListener('click',()=>resetChallenge());
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>setView(b.dataset.view));
telemetry=createTelemetry({getState:()=>state,onIgnition:value=>{state.ignition=value;renderUI();},onSensor:value=>{state.sensor=value;renderUI();},onCommands:(key,value)=>{state[key]=value;if(key==='relay')state.blocked=value;renderUI();},onUpdate:()=>renderUI()});
function updateSensitivity(){const value=controls?applySensitivity(controls,$('camera-sensitivity').value):Number($('camera-sensitivity').value);$('camera-sensitivity-value').textContent=value+'%';$('camera-settings').textContent='Sensibilidade: '+value+'% ⚙';}
$('camera-sensitivity').addEventListener('input',()=>{updateSensitivity();try{localStorage.setItem('lcv5-camera-sensitivity',$('camera-sensitivity').value);}catch{}});
try{const value=Number(localStorage.getItem('lcv5-camera-sensitivity'));if(value>=50&&value<=200)$('camera-sensitivity').value=value;}catch{}
$('camera-settings').addEventListener('click',()=>{const panel=$('camera-panel');panel.hidden=!panel.hidden;$('camera-settings').setAttribute('aria-expanded',String(!panel.hidden));});
function syncFullscreen(){const active=!!document.fullscreenElement||document.documentElement.classList.contains('theater');document.documentElement.classList.toggle('is-fullscreen',!!document.fullscreenElement);$('fullscreen').textContent=active?'Sair da tela cheia ⛶':'Tela cheia ⛶';$('fullscreen').setAttribute('aria-pressed',String(active));requestAnimationFrame(()=>{if(renderer)resize();});}
$('fullscreen').addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else if(document.documentElement.classList.contains('theater'))document.documentElement.classList.remove('theater');
  else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
  else {document.documentElement.classList.add('theater');say('Modo ampliado ativado. Use Esc ou o botão para sair.');}
 }catch{document.documentElement.classList.add('theater');say('Modo ampliado ativado nesta guia. Use Esc ou o botão para sair.');}
 syncFullscreen();
});
document.addEventListener('fullscreenchange',syncFullscreen);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.documentElement.classList.contains('theater')){document.documentElement.classList.remove('theater');syncFullscreen();}});
try{$('manual-link').href=(parent.location.origin==='null'?'':parent.location.origin)+'/';}catch{}
const photoTitles={top:'Etiqueta superior',connectors:'Frente dos conectores',side:'Lateral',leds:'Lado dos indicadores',bottom:'Parte inferior',connector14:'Conector de 14 pinos',connector16:'Conector de 16 pinos',harness14:'Chicote de 14 pinos',harness16:'Chicote de 16 pinos'};
for(const [key,url] of Object.entries(photos)){const b=document.createElement('button');b.type='button';const img=new Image();img.src=url;img.alt=photoTitles[key];img.loading='lazy';b.append(img,document.createTextNode(photoTitles[key]));b.addEventListener('click',()=>{$('photo-large').src=url;$('photo-large').alt=photoTitles[key];$('photo-large').hidden=false;$('photos').hidden=true;$('photo-back').hidden=false;$('photo-title').textContent=photoTitles[key];});$('photos').append(b);}
$('photos-open').addEventListener('click',()=>{$('photos-dialog').showModal();});$('photos-close').addEventListener('click',()=>$('photos-dialog').close());$('photos-dialog').addEventListener('click',e=>{if(e.target===$('photos-dialog'))$('photos-dialog').close();});$('photo-back').addEventListener('click',()=>{$('photo-large').hidden=true;$('photos').hidden=false;$('photo-back').hidden=true;$('photo-title').textContent='Referências reais';});

function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.15,...extra});}
const mats={shell:material('#1e252d',{roughness:.85}),rubber:material('#080e18',{roughness:.95}),metal:material('#91a5bd',{metalness:.75,roughness:.28}),gold:material('#d8bf7a',{metalness:.85,roughness:.3}),panel:material('#192b42',{roughness:.55}),label:material('#bfd2ec')};
function box(w,h,d,mat,r=.04){return new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,r),mat);}
function put(group,object,x,y,z){object.position.set(x,y,z);group.add(object);return object;}
function textSprite(text,{width=2.4,height=.4,color='#d2e2f7',bg=null,font=34}={}){
 const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,768,128);}ctx.fillStyle=color;ctx.font=`700 ${font*2}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,64,744);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sprite.scale.set(width,height,1);return sprite;
}
function textPlane(text,options={}){const sprite=textSprite(text,options);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(options.width||2.4,options.height||.4),new THREE.MeshBasicMaterial({map:sprite.material.map,transparent:true,depthWrite:false}));return mesh;}
function buildDevice(){
 device=new THREE.Group();device.position.set(-4,.36,-1.2);scene.add(device);
 const body=put(device,box(2.65,.63,1.94,mats.shell,.11),0,.32,0);body.castShadow=true;body.receiveShadow=true;
 put(device,box(2.62,.025,1.9,mats.rubber,.04),0,.28,0);
 put(device,box(2.45,.045,1.78,material('#2e3540'),.06),0,.66,0);
 // Map the photographed label to the top plane without changing its printed contents.
 const textureCanvas=document.createElement('canvas');textureCanvas.width=1024;textureCanvas.height=748;
 const texture=new THREE.CanvasTexture(textureCanvas);texture.colorSpace=THREE.SRGBColorSpace;
 const top=new THREE.Mesh(new THREE.PlaneGeometry(2.43,1.76),new THREE.MeshStandardMaterial({map:texture,roughness:.9}));top.rotation.x=-Math.PI/2;put(device,top,0,.687,0);
 const image=new Image();image.onload=()=>{const ctx=textureCanvas.getContext('2d');ctx.translate(512,374);ctx.rotate(-Math.PI/2);ctx.drawImage(image,image.width*.038,image.height*.248,image.width*.9,image.height*.567,-374,-512,748,1024);texture.needsUpdate=true;};image.src=photos.top;
 for(const x of [-1.32,1.32])for(let z=-.65;z<.9;z+=.42)put(device,box(.07,.08,.16,mats.shell,.02),x,.64,z);
 for(const z of [-.76,.76])for(const x of [-.95,.95]){const screw=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.025,12),mats.metal);put(device,screw,x,.015,z);}
 for(let x=-1.05;x<1.1;x+=.3)put(device,box(.07,.04,1.45,mats.rubber,.01),x,-.005,0);
 for(const c of [16,14]){
  const x=c===16?-.47:.85,w=c===16?.98:.87;
  const socket=put(device,box(w,.28,.12,mats.rubber,.025),x,.4,.988);socket.userData={kind:'socket',connector:c};pickables.push(socket);
  const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,.28,.12)),new THREE.LineBasicMaterial({color:0x5f6b7a}));put(device,frame,x,.4,.99);
  for(let n=0;n<c;n++){const col=n%(c/2),row=Math.floor(n/(c/2));put(device,box(.078,.075,.025,material('#111820'),.006),x-w/2+.08+col*.115,.458-row*.115,1.059);}
  put(device,textPlane(c+' PINOS',{width:w,height:.17,font:30}),x,.17,1.09);
  const plug=new THREE.Group();plug.userData={connector:c};const cap=put(plug,box(w+.02,.29,.36,mats.rubber,.025),0,0,0);cap.userData={kind:'plug',connector:c};pickables.push(cap);put(plug,box(.23,.08,.2,mats.shell,.015),0,.18,0);
  plug.position.copy(device.position).add(new THREE.Vector3(x,.4,1.8));scene.add(plug);plugs.set(c,{group:plug,x,attachedZ:device.position.z+1.2,freeZ:device.position.z+1.8});
 }
 const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.1,24),mats.gold);antenna.rotation.x=Math.PI/2;put(device,antenna,-1.15,.4,1.04);antenna.userData={kind:'info',text:'Antena GNSS externa opcional. A antena celular é interna.'};pickables.push(antenna);
 const usb=put(device,box(.24,.13,.07,mats.metal,.015),.18,.21,1.04);put(device,box(.18,.07,.075,mats.rubber,.01),.18,.21,1.08);usb.userData={kind:'info',text:'Micro-USB: configuração e diagnóstico no computador. Não é alimentação veicular.'};pickables.push(usb);
 // LTE Cat M1 has a molded cover in place of the legacy audio connector.
 const cover=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.012,24),mats.shell);cover.rotation.x=Math.PI/2;put(device,cover,.29,.43,.99);
 for(let i=0;i<3;i++){const led=put(device,box(.06,.2,.025,material('#243d35'),.015),-.18+i*.16,.35,-.99);led.userData={kind:'info',text:'LEDs de GNSS, rede e periféricos. A bancada não inventa registro na rede nem sinal GNSS.'};pickables.push(led);}
 deviceGlow=new THREE.PointLight('#67abff',0,3);put(device,deviceGlow,0,.9,0);
 put(scene,textSprite('LCV5 · LTE Cat M1',{width:2.9,height:.28,color:'#8ca9cd'}),-4,.05,-2.65);
}
function buildPanel(){
 vehicle=createVehicle({scene,box,material,textPlane,put,targets:TARGETS,pickables,reduced});
 for(const [key,node] of vehicle.nodes)targetNodes.set(key,node);
 relayLamp=targetNodes.get('relay').mesh;buzzerLamp=targetNodes.get('buzzer').mesh;powerLamp=targetNodes.get('battery').mesh;
 const table=put(scene,box(4,.14,2.75,material('#274352'),.08),-4,.15,-1.2);table.receiveShadow=true;
 for(const c of [14,16]){const deck=put(scene,box(3.6,.09,c===14?5.05:5.95,material('#132a39'),.09),c===14?-6.22:-2.42,.025,c===14?3.18:3.65);deck.receiveShadow=true;}
}
function createSources(){
 for(const p of guide.data.pins){
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.14,14,12),material('#e2b962',{metalness:.65}));cap.position.copy(worldPin(p.connector,p.number));cap.userData={kind:'wire',key:p.key};scene.add(cap);pickables.push(cap);
  const label=textSprite(p.number+' · '+p.name,{width:1.05,height:.32,font:32,color:'#c7d9f1',bg:'#14253ee8'});label.position.copy(cap.position).add(new THREE.Vector3(0,.19,.19));scene.add(label);
  sourceNodes.set(p.key,{cap,label,rest:cap.position.clone()});
 }
 put(scene,textSprite('PONTAS DO CHICOTE 14',{width:3.45,height:.28,color:'#8aa9d2'}),-6.22,.09,5.75);
 put(scene,textSprite('PONTAS DO CHICOTE 16',{width:3.45,height:.28,color:'#8aa9d2'}),-2.42,.09,6.65);
}
function wirePoints(key,end){
 const p=pinMap.get(key),plug=plugs.get(p.connector).group,start=plug.position.clone().add(new THREE.Vector3((p.number%(p.connector/2)-(p.connector/4))*.012,-.02,.18));
 const source=sourceNodes.get(key),connected=!!state.connections[key],dest=end|| (connected?targetNodes.get(state.connections[key]).point.clone():(state.looseEnds[key]?new THREE.Vector3().fromArray(state.looseEnds[key]):source.rest.clone()));
 if(connected||end){return [start,new THREE.Vector3(start.x,.18,start.z+.8),new THREE.Vector3((start.x+dest.x)/2,.2,Math.max(1.15,dest.z+.8)),new THREE.Vector3(dest.x,dest.y*.75+.1,dest.z+.8),dest];}
 return [start,new THREE.Vector3(start.x,.25,start.z+.55),new THREE.Vector3(dest.x,.12,dest.z-.3),dest];
}
function drawWire(key,end=null){
 const p=pinMap.get(key),visible=state.attached[p.connector],source=sourceNodes.get(key);if(!source)return;
 const old=wires.get(key);if(old){scene.remove(old);old.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});wires.delete(key);}
 source.cap.visible=visible;source.label.visible=visible&&!state.connections[key];if(!visible)return;
 const curve=new THREE.CatmullRomCurve3(wirePoints(key,end)),cs=colors(p),active=key===selected;
 const group=new THREE.Group(),tube=new THREE.Mesh(new THREE.TubeGeometry(curve,42,active?.052:.032,6,false),material(cs[0],{emissive:active?cs[0]:'#000000',emissiveIntensity:active?.28:0,metalness:0,roughness:.85}));tube.userData={kind:'wire',key};group.add(tube);
 if(cs.length>1){const stripe=new THREE.Mesh(new THREE.TubeGeometry(curve,42,.013,6,false),material(cs[1]));stripe.position.y=.025;stripe.position.x=.012;stripe.userData={kind:'wire',key};group.add(stripe);}
 scene.add(group);wires.set(key,group);
 const points=wirePoints(key,end),dest=points[points.length-1];source.cap.position.copy(dest);source.cap.material.color.set(active?'#fff2a8':'#d2b36c');source.cap.scale.setScalar(active?1.35:1);
 source.label.position.copy(dest).add(new THREE.Vector3(0,.19,.19));
}
function syncScene(){
 if(!scene)return;for(const p of guide.data.pins)drawWire(p.key,interaction?.drag?.key===p.key?sourceNodes.get(p.key).cap.position:null);
 const status=readBench(state);for(const [id,node] of targetNodes){node.mesh.material.color.set(node.color);node.mesh.material.emissiveIntensity=.12;node.ring.material=mats.metal;}
 if(powerLamp)powerLamp.material.emissiveIntensity=status.powered?1.1:.12;
 if(relayLamp)relayLamp.material.emissiveIntensity=status.relay?1.7:.12;
 if(buzzerLamp)buzzerLamp.material.emissiveIntensity=status.buzzer?1.7:.12;
 if(deviceGlow)deviceGlow.intensity=status.powered?1.6:0;
}
function flashError(id){const n=targetNodes.get(id);if(!n)return;n.mesh.material.color.set('#ff4a4a');n.mesh.material.emissive.set('#ff3333');n.mesh.material.emissiveIntensity=.9;setTimeout(()=>{n.mesh.material.emissive.set(n.color);syncScene();},700);}
function pointerFromEvent(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
function hit(e){
 const entries=[...sourceNodes].filter(([key,n])=>n.cap.visible&&state.attached[pinMap.get(key).connector]).map(([key,n])=>[key,n.cap.position]);
 const near=nearestScreenPoint(e,entries,camera,renderer.domElement.getBoundingClientRect(),e.pointerType==='touch'?23:15);
 if(near)return sourceNodes.get(near).cap;
 pointerFromEvent(e);
 const objects=pickables.filter(o=>o.visible&&(!o.userData.key||state.attached[pinMap.get(o.userData.key).connector]));
 for(const group of wires.values())objects.push(...group.children);
 return raycaster.intersectObjects(objects,false)[0]?.object;
}
function nearestTarget(e){return nearestScreenPoint(e,[...targetNodes].map(([id,n])=>[id,n.point]),camera,renderer.domElement.getBoundingClientRect(),e.pointerType==='touch'?48:40);}
function showCableTooltip(data,event,holding=false){
 const tooltip=$('cable-tooltip');
 if(!data||!['wire','target'].includes(data.kind)){tooltip.hidden=true;return;}
 let title,meta,description;
 if(data.kind==='wire'){
  const pin=pinMap.get(data.key),family=guide.data.families.find(f=>f.id===pin.kind);
  title=pin.name;meta=`Chicote ${pin.connector} · pino ${pin.number} · ${guide.pinColor(pin,harness)}`;description=family.simple;
 }else{const target=TARGETS.find(t=>t.id===data.target);title=target.name;meta='Cabo do veículo';description=target.description;}
 $('cable-tooltip-title').textContent=title;$('cable-tooltip-meta').textContent=meta;$('cable-tooltip-description').textContent=description;
 $('cable-tooltip-action').textContent=holding?'Segurando · roda ou Alt + mover: zoom · Esc: soltar':data.kind==='wire'?'Segure a ponta ou o cabo para puxar':'Ponta do veículo · solte o fio aqui';
 tooltip.hidden=false;const rect=stage.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
 const width=tooltip.offsetWidth,height=tooltip.offsetHeight;
 tooltip.style.left=Math.max(8,Math.min(rect.width-width-8,x+18))+'px';tooltip.style.top=Math.max(8,Math.min(rect.height-height-8,y-height-18))+'px';
}

function highlightTarget(id){
 if(hoverTarget===id)return;
 for(const [key,n] of targetNodes){n.mesh.scale.setScalar(key===id?1.4:1);n.mesh.material.emissiveIntensity=key===id?.8:.12;}
 hoverTarget=id;
 if(id)$('hint').textContent='Solte para ligar a: '+TARGETS.find(t=>t.id===id).name;
}
function setupPointers(){
 interaction=bindCableInteraction({canvas:renderer.domElement,stage,camera,controls,hit,nearestTarget,
  getSensitivity:()=>Number($('camera-sensitivity').value)/100,autoView:()=>$('camera-auto-view').checked,
  onPick:key=>{
   choosePin(key);
   if(state.phase!=='wiring'){say('Desligue ou repare o veículo antes de mover os cabos.','error');return false;}
   return true;
  },
  onMove:(key,event,id)=>{
   pointerFromEvent(event);highlightTarget(id);if(!id)$('hint').textContent=CABLE_HELP;
   const point=new THREE.Vector3();
   if(id)point.copy(targetNodes.get(id).point);else{if(!raycaster.ray.intersectPlane(plane,point))point.copy(sourceNodes.get(key).rest);point.x=THREE.MathUtils.clamp(point.x,-9,8);point.z=THREE.MathUtils.clamp(point.z,-4,8);}
   drawWire(key,point);
  },
  onDrop:(key,id)=>{highlightTarget(null);selected=key;connectTo(id);},
  onPark:key=>{highlightTarget(null);const result=relocateWire(state,key,null,sourceNodes.get(key).cap.position.toArray());say(result.message);renderUI();},
  onRestore:key=>{highlightTarget(null);drawWire(key);},
  onClick:object=>{const data=object?.userData;if(data?.kind==='target')connectTo(data.target);else if(['plug','socket'].includes(data?.kind))toggleHarness(data.connector);else if(data?.kind==='info')say(data.text);},
  onHover:showCableTooltip,onHint:text=>{$('hint').textContent=text;}
 });
}

function setView(name){
 if(!camera)return;interaction?.cancel();$('cable-tooltip').hidden=true;
 const views={overview:{pos:[7.4,8.4,12.6],target:[-.6,1.1,1.35]},device:{pos:[-4,3.6,5.4],target:[-4,.7,-1.1]},back:{pos:[-4,2.7,-7],target:[-4,.7,-1.2]},bottom:{pos:[-4,-3.3,3.8],target:[-4,.7,-1.2]},vehicle:{pos:[7.1,4.4,8],target:[3.8,1.7,-1.3]},wires14:{pos:[-6.2,6,8.8],target:[-6.2,.3,3.2]},wires16:{pos:[-2.4,6,9.7],target:[-2.4,.3,3.5]},top:{pos:[0,18,.1],target:[0,0,1.6]}};
 const view=views[name]||views.overview;camera.position.fromArray(view.pos);controls.target.fromArray(view.target);controls.update();
}
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(21))/Math.min(1,camera.aspect/1.65)));camera.updateProjectionMatrix();}
function initScene(){
 if(sceneAttempted)return;sceneAttempted=true;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch{ $('fallback').hidden=false;return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 stage.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Cena 3D interativa: rastreador, chicotes e painel do veículo');
 scene=new THREE.Scene();scene.fog=new THREE.Fog('#142227',23,52);
 camera=new THREE.PerspectiveCamera(42,1,.05,90);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=3;controls.maxDistance=30;controls.maxPolarAngle=Math.PI-.02;controls.minPolarAngle=.02;controls.target.set(0,.5,0);controls.enablePan=true;updateSensitivity();
 scene.add(new THREE.HemisphereLight('#c4ddff','#16252d',2.5));const key=new THREE.DirectionalLight('#e3efff',3.5);key.position.set(-3,9,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.normalBias=.03;scene.add(key);const rim=new THREE.DirectionalLight('#e6b85c',2.0);rim.position.set(7,5,-4);scene.add(rim);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(50,50),material('#17272b',{roughness:.85,metalness:.2}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=-.025;scene.add(floor);scene.add(new THREE.GridHelper(32,48,'#827247','#2b4142'));const glow=new THREE.PointLight('#53d5d0',10,16);put(scene,glow,1,5,-4);const warm=new THREE.PointLight('#ffb778',6,14);put(scene,warm,-6,3,4);
 buildDevice();buildPanel();createSources();setupPointers();resize();new ResizeObserver(resize).observe(stage);new ResizeObserver(()=>{$('hint').style.bottom=($('camera-nav').offsetHeight+22)+'px';}).observe($('camera-nav'));setView('overview');syncScene();
 let previous=performance.now();const animate=()=>{frameId=requestAnimationFrame(animate);const now=performance.now(),dt=Math.min(.08,(now-previous)/1000);previous=now;if($('workshop-shell').hidden||document.hidden||document.documentElement.dataset.suspended==='true')return;controls.update();interaction?.tick(dt);vehicle?.update(dt,state.phase,readBench(state),now/1000,camera);let moving=false;for(const [c,p] of plugs){const z=state.attached[c]?p.attachedZ:p.freeZ;if(Math.abs(p.group.position.z-z)>.002){p.group.position.z=reduced?z:THREE.MathUtils.lerp(p.group.position.z,z,.14);moving=true;}}if(moving)for(const p of guide.data.pins)if(state.attached[p.connector])drawWire(p.key,interaction?.drag?.key===p.key?sourceNodes.get(p.key).cap.position:null);const shake=vehicle?.shake||0,offset=new THREE.Vector3(Math.sin(now*.12)*shake,Math.cos(now*.15)*shake,0);camera.position.add(offset);renderer.render(scene,camera);camera.position.sub(offset);if(shake)camera.updateMatrixWorld();};animate();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frameId);interaction?.cancel();$('fallback').hidden=false;say('A cena 3D perdeu a conexão com a placa gráfica. Recarregue para restaurar.','error');});
}
renderUI();
function resumeWorkshop(){if(!renderer&&!$('workshop-shell').hidden)initScene();if(renderer){resize();controls.update();}document.body.classList.toggle('campaign-workshop',story?.inspect().phase==='workshop');}
story=createInstallerGame({onProgress:workshopProgress,onExit:action=>{saveWorkshop();notifyParent(action);},bridge:{
 read:()=>({...readBench(state),phase:state.phase}),commands:()=>telemetry.commandHistory(),tick:dt=>telemetry.tick(dt),
 enterWorkshop:mission=>{resetChallenge(mission?'service':'basic',mission);if(!renderer)initScene();resumeWorkshop();},resumeWorkshop,
 startDrive:()=>telemetry.startDrive(),cruiseSpeed:()=>telemetry.cruiseSpeed(),updateDrive:data=>telemetry.updateDrive(data),
 dock:(host,onReturn)=>telemetry.dock(host,onReturn),undock:()=>{telemetry.updateDrive({speed:0});telemetry.undock();}
}});

function project(point){if(!camera||!renderer)return null;const r=renderer.domElement.getBoundingClientRect(),p=point.clone().project(camera);return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2,visible:p.z>=-1&&p.z<=1};}
// Read-only inspection used by browser checks; all mutations still go through UI events.
window.LCV5Bench=Object.freeze({getState:()=>JSON.parse(JSON.stringify(state)),getReading:()=>readBench(state),projectWire:key=>{const n=sourceNodes.get(key);return n?project(n.cap.position):null;},projectTarget:id=>{const n=targetNodes.get(id);return n?project(n.point):null;},camera:()=>camera?{position:camera.position.toArray(),target:controls.target.toArray()}:null,ready:()=>!!renderer,getMission:()=>missionFor(state).id,vehicleState:()=>({open:vehicle?.open,exploded:vehicle?.exploded}),story:()=>story.inspect()});


function notifyParent(event,payload={}){if(parent!==window)parent.postMessage({type:'andersons-workshop',event,payload},location.origin);}
function updateIdentity(){
 const vehicle=context?.vehicle||'Veículo de treinamento',client=context?.client||'Anderson';
 for(const el of document.querySelectorAll('[data-case-client]'))el.textContent=client;
 for(const el of document.querySelectorAll('[data-case-vehicle]'))el.textContent=vehicle;
 const text=$('telemetry-title');if(text){text.replaceChildren(document.createTextNode('Resumo do veículo · '+vehicle+' '));const badge=document.createElement('span');badge.className='badge';badge.textContent='SIMULAÇÃO';text.append(badge);}
 $('andersons-case-label').textContent=mode==='free'?'OFICINA LIVRE · SEM AGENDAMENTO':'ATO 02 · INSTALAÇÃO / '+vehicle;
 $('andersons-appointment').textContent=mode==='free'?'Monte e teste à vontade.':context?.appointment||'AGENDAMENTO CONFIRMADO';
 $('andersons-sound').textContent=context?.prefs?.sound===false?'Som: desligado':'Som: ligado';
}
function workshopProgress(snapshot){
 document.body.dataset.workshopPhase=snapshot.phase;
 const lines={arrival:'O CLIENTE CHEGOU. AGORA É COM A OFICINA.',config:'QUAL É O SERVIÇO, ANDERSON?',workshop:'CADA FIO NO SEU LUGAR. EU ESTOU DE OLHO.',free:'OFICINA LIVRE. MAS CONTINUO OBSERVANDO.',monitor:'TESTE TUDO ANTES DE ENTREGAR.',finish:'INSTALAÇÃO APROVADA. VOCÊ CONTINUA EMPREGADO!'};
 const line=$('andersons-cat-line');if(line)line.textContent=lines[snapshot.phase]||'EU ESTOU DE OLHO.';
 if(booted){saveWorkshop();notifyParent(snapshot.phase==='finish'?'complete':'progress',{phase:snapshot.phase});}
}
function saveWorkshop(){if(!booted||!context)return;try{localStorage.setItem(workshopSaveKey,JSON.stringify({version:1,caseId:context.caseId,state,selected,connector,harness,story:story.inspect(),telemetry:telemetry.serialize()}));}catch{}}
function initialize(payload){
 context=payload;reduced=!!payload.prefs?.reduceMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;document.body.classList.toggle('reduce-motion',reduced);updateIdentity();if(booted)return;
 let saved=null;try{saved=JSON.parse(localStorage.getItem(workshopSaveKey));}catch{}
 if(saved?.version===1&&saved.caseId===context.caseId&&saved.state&&saved.story){
  state={...createChallenge(saved.state.mission),...saved.state};selected=pinMap.has(saved.selected)?saved.selected:'14-1';connector=[14,16].includes(saved.connector)?saved.connector:14;harness=['agile','original'].includes(saved.harness)?saved.harness:'agile';
  telemetry.restore(saved.telemetry);if(!story.restore(saved.story)){mode==='free'?story.openFree():story.startScheduled();}
 }else mode==='free'?story.openFree():story.startScheduled();
 booted=true;document.body.classList.remove('awaiting-context');renderUI();if(saved?.caseId===context.caseId)say('Montagem retomada. Seus cabos e o progresso do teste foram preservados.');workshopProgress(story.inspect());
}
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='andersons-context')return;
 if(event.data.suspended!==undefined){document.documentElement.dataset.suspended=String(!!event.data.suspended);return;}
 if(event.data.payload?.caseId)initialize(event.data.payload);
});
window.addEventListener('pagehide',saveWorkshop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveWorkshop();});
setInterval(()=>{if(booted&&!document.hidden){saveWorkshop();const snapshot=story.inspect();if(snapshot.phase==='monitor')workshopProgress(snapshot);}},2500);
$('andersons-sound').addEventListener('click',()=>notifyParent('sound'));
$('andersons-help').addEventListener('click',()=>{$('andersons-help-dialog').showModal();});
$('andersons-help-close').addEventListener('click',()=>$('andersons-help-dialog').close());
$('manual-link').textContent='Menu do jogo ↗';$('manual-link').addEventListener('click',event=>{event.preventDefault();saveWorkshop();notifyParent('menu');});
notifyParent('ready');
if(parent===window)initialize({caseId:mode==='free'?'free':'standalone',client:'Anderson',vehicle:'Ford Ka',prefs:{}});
