import {readBench} from './wiring.js';
import {commandConnection,createCommandSimulation,createCommandPanel} from './commands.js';
export function sensorSnapshot(state,simulation,now=Date.now()){
 const r=readBench(state),powered=state.phase==='running'&&r.powered,online=commandConnection(state,simulation),engine=powered&&r.ignition&&!r.blocked;
 const satellites=powered?simulation.satellites:0;
 const speed=powered&&satellites>0&&!r.blocked?simulation.speed:0;
 const can=powered&&r.canPair;
 const analog=powered&&r.analog!==null;
 const fuel=can||analog?simulation.fuel:null;
 const alerts=[];
 if(speed>80)alerts.push({title:'Velocidade Acima do Permitido',level:'Alto',tone:'high'});
 if(speed>0&&!r.ignition)alerts.push({title:'Movimento com Ignição Desligada',level:'Alto',tone:'high'});
 if(online&&satellites===0)alerts.push({title:'Sem Fixação GPS',level:'Baixo',tone:'low'});
 if(engine&&speed===0)alerts.push({title:'Início Motor Ocioso',level:'Baixo',tone:'low'});
 if(r.blocked)alerts.push({title:'Motor Bloqueado por Comando',level:'Jogo',tone:'high'});
 if(r.buzzer)alerts.push({title:'Buzzer Acionado',level:'Jogo',tone:'low'});
 return {latitude:simulation.latitude??-25.445407,longitude:simulation.longitude??-49.264770,address:simulation.address,online,blocked:r.blocked,engine,ignition:powered&&r.ignition,movement:speed>0?'Em movimento':'Parado',speed,satellites,trackerBattery:simulation.trackerBattery,vehicleBattery:powered?(engine?14.2:12.6):0,odometer:simulation.odometer,fuel,consumption:can?(engine?Number((.8+speed*.032).toFixed(1)):0):null,rpm:can?(engine?Math.round(850+speed*34):0):null,can,analog,relay:r.relay,buzzer:r.buzzer,alerts,updated:simulation.locationUpdated||now};
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const br=(n,d=0)=>n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const date=ms=>new Date(ms).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
function gauge(value,max,unit,label){const n=value===null?0:Math.min(max,Math.max(0,value));const a=(135+270*n/max)*Math.PI/180,x=90+Math.cos(a)*57,y=80+Math.sin(a)*57;return `<svg class="tele-gauge" viewBox="0 0 180 165" role="img" aria-label="${escape(label)}: ${value===null?'sem sinal':br(value)+' '+unit}"><path d="M40.5 129.5 A70 70 0 1 1 139.5 129.5" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="M40.5 129.5 A70 70 0 1 1 139.5 129.5" fill="none" stroke="#5f90f2" stroke-width="3" stroke-linecap="round" stroke-dasharray="${n/max*330} 500"/><line x1="90" y1="80" x2="${x}" y2="${y}" stroke="#1b2942" stroke-width="3"/><circle cx="90" cy="80" r="7" fill="#1b2942"/><text x="90" y="134" text-anchor="middle" font-size="28" font-weight="800" fill="#1d2b46">${value===null?'—':br(value)}</text><text x="90" y="153" text-anchor="middle" font-size="10" fill="#647795">${unit}</text></svg>`;}
export function createTelemetry({getState,onIgnition,onSensor,onCommands,onUpdate=()=>{}}){
 const $=id=>document.getElementById(id),simulation={speed:0,fuel:68.6,satellites:12,trackerBattery:4.1,odometer:36196,connected:true,rebootRemaining:0,buffer:12,cruiseSpeed:45};
 let alerts=[],lastAlertKeys=new Set(),elapsed=0,lastOnline=false,panel,docked=false,onReturn=null;
 const center=createCommandSimulation({getState,simulation,onChange:()=>{onUpdate();render();}});
 function tab(name){const commands=name==='commands';$('tele-summary').hidden=commands;$('tele-commands').hidden=!commands;for(const b of document.querySelectorAll('[data-tele-tab]')){b.classList.toggle('active',b.dataset.teleTab===name);b.setAttribute('aria-selected',String(b.dataset.teleTab===name));}render();}
 for(const button of document.querySelectorAll('[data-tele-tab]'))button.addEventListener('click',()=>tab(button.dataset.teleTab));
 function render(){
  const state=getState(),s=sensorSnapshot(state,simulation),r=readBench(state);
  const keys=new Set(s.alerts.map(a=>a.title));
  for(const a of s.alerts)if(!lastAlertKeys.has(a.title))alerts.unshift({...a,time:Date.now()});lastAlertKeys=keys;
  if(s.online&&!lastOnline)alerts.unshift({title:'Instalação Validada · Veículo Ligado',level:'Jogo',tone:'low',time:Date.now()});lastOnline=s.online;alerts=alerts.slice(0,10);
  const cards=[['⚿','Ignição',s.ignition?'Ligada':'Desligada',s.ignition],['▰','Bat. Rastreador',br(s.trackerBattery,2)+' V',true],['↝','Movimento',s.movement,s.speed>0],['◴','Velocidade',br(s.speed)+' km/h',false],['⌖','GPS',s.satellites+' satélites',s.satellites>0],['▰','Bat. Veículo',br(s.vehicleBattery,1)+' V',r.powered],['⊘','Motor',s.blocked?'Bloqueado':s.engine?'Ligado':'Desligado',s.engine],['♫','Buzzer',s.buzzer?'Acionado':'Desligado',s.buzzer],['●','Comunicação',s.online?'Online':'Offline',s.online]];
  $('tele-motor-state').textContent=s.blocked?'MOTOR BLOQUEADO':s.engine?'MOTOR LIGADO':'MOTOR DESLIGADO';$('tele-motor-state').dataset.blocked=String(s.blocked);$('tele-output-state').textContent=`Relé: ${s.relay?'acionado':'desligado'} · Buzzer: ${s.buzzer?'acionado':'desligado'}`;
  $('tele-cards').innerHTML=cards.map(([icon,label,value,on])=>`<div class="tele-card${on?' on':''}"><i>${icon}</i><div><small>${label}</small><strong>${value}</strong></div></div>`).join('');
  $('tele-updated').textContent=date(s.updated)+' · simulação';$('tele-latitude').textContent=s.latitude.toFixed(6);$('tele-longitude').textContent=s.longitude.toFixed(6);$('tele-address').textContent=s.address||'1821 · Avenida Marechal Floriano Peixoto · Curitiba/PR · 80220-000';
  $('tele-speed-gauge').innerHTML=gauge(s.speed,140,'km/h','Velocidade');$('tele-rpm-gauge').innerHTML=gauge(s.rpm,8000,'RPM','Rotação do motor');
  $('tele-odometer').textContent=br(s.odometer);$('tele-odometer-bar').style.width=Math.min(100,s.odometer/500000*100)+'%';$('tele-fuel').textContent=s.fuel===null?'Sem sinal':br(s.fuel,1)+'%';$('tele-fuel-bar').style.width=(s.fuel??0)+'%';
  $('tele-consumption').textContent=s.consumption===null?'—':br(s.consumption,1);$('tele-consumption-note').textContent=s.can?'Consumo CAN · jogo':'Aguardando o par CAN';
  $('tele-fuel-note').textContent=s.analog?'Nível do sensor · jogo':s.can?'Nível CAN · jogo':'Aguardando sensor ou CAN';$('tele-rpm-note').textContent=s.can?'Rotação do motor (CAN) · jogo':'Aguardando o par CAN';
  $('tele-alerts').innerHTML=alerts.length?alerts.map(a=>`<article class="tele-alert ${a.tone}"><i>△</i><div><strong>${escape(a.title)}</strong><small>${escape(date(a.time))} <b>${escape(a.level)}</b></small></div></article>`).join(''):'<p class="tele-empty">Sem alertas nesta simulação.</p>';
  $('sim-speed').disabled=s.blocked;$('sim-ignition').checked=state.ignition;$('sim-speed').value=simulation.speed;$('sim-speed-value').textContent=br(simulation.speed)+' km/h';$('sim-fuel').value=simulation.fuel;$('sim-fuel-value').textContent=br(simulation.fuel,1)+'%';$('sim-gps').value=simulation.satellites;$('sim-gps-value').textContent=simulation.satellites;
  $('sim-relay').checked=state.relay;$('sim-buzzer').checked=state.buzzer;
  $('tele-status').textContent=(s.online?'Online · conectado à central virtual':simulation.rebootRemaining>0?'Offline · dispositivo reiniciando':'Offline · sem comunicação com a central virtual')+' · '+(s.blocked?'motor bloqueado':s.engine?'motor ligado':'motor desligado');
  panel?.render();
  return s;
 }
 $('sim-ignition').addEventListener('change',e=>{onIgnition(e.target.checked);render();});
 $('sim-speed').addEventListener('input',e=>{simulation.speed=Number(e.target.value);simulation.cruiseSpeed=simulation.speed;render();});
 $('sim-fuel').addEventListener('input',e=>{simulation.fuel=Number(e.target.value);onSensor(simulation.fuel/100*5);render();});
 $('sim-gps').addEventListener('input',e=>{simulation.satellites=Number(e.target.value);render();});
 for(const key of ['relay','buzzer'])$('sim-'+key).addEventListener('change',e=>{onCommands(key,e.target.checked);render();});
 panel=createCommandPanel({center,getState,simulation,onChange:()=>{onUpdate();render();}});
 $('telemetry-close').addEventListener('click',()=>{if(docked)onReturn?.();else $('telemetry-dialog').close();});$('telemetry-dialog').addEventListener('click',e=>{if(!docked&&e.target===$('telemetry-dialog'))$('telemetry-dialog').close();});
 function undock(){const dialog=$('telemetry-dialog');if(docked){dialog.close();document.body.append(dialog);dialog.classList.remove('telemetry-docked');docked=false;onReturn=null;}$('telemetry-close').textContent='Voltar à oficina';}
 return {serialize:()=>({simulation:{...simulation},center:center.serialize(),alerts:alerts.map(a=>({...a}))}),restore(saved){if(!saved)return;Object.assign(simulation,saved.simulation||{});alerts=Array.isArray(saved.alerts)?saved.alerts.slice(0,10):[];center.restore(saved.center);render();},dock(host,callback){const dialog=$('telemetry-dialog');if(dialog.open)dialog.close();host.append(dialog);docked=true;onReturn=callback;dialog.classList.add('telemetry-docked');dialog.open=true;$('telemetry-close').textContent='Voltar à oficina 3D';render();},undock,
 commandHistory:()=>center.history,cruiseSpeed:()=>simulation.cruiseSpeed,startDrive(){simulation.cruiseSpeed=45;simulation.speed=45;},
 updateDrive(data){simulation.speed=data.speed??simulation.speed;if(simulation.satellites>0&&data.latitude!==undefined){simulation.latitude=data.latitude;simulation.longitude=data.longitude;simulation.address=data.address;simulation.locationUpdated=Date.now();}},
 open(){undock();simulation.fuel=Math.round(getState().sensor/5*1000)/10;tab('summary');render();if(!$('telemetry-dialog').open)$('telemetry-dialog').showModal();},render,reset(){simulation.speed=0;simulation.cruiseSpeed=45;simulation.latitude=undefined;simulation.longitude=undefined;simulation.address=undefined;simulation.locationUpdated=null;alerts=[];lastAlertKeys.clear();lastOnline=false;center.reset();panel?.reset();},snapshot:()=>sensorSnapshot(getState(),simulation),tick(dt){center.tick(dt);const s=sensorSnapshot(getState(),simulation);if(readBench(getState()).powered)simulation.odometer+=s.speed*dt/3600;elapsed+=dt;if(elapsed>1){elapsed=0;if($('telemetry-dialog').open)render();}}};
}

