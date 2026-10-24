import {CITY,ROAD_TEST,carAtHome,drive,routeToGarage,followRoute,mapLocation,createCityPainter} from './city.js';
import {FEATURES,greeting,serviceMission,roadChecks} from './story-model.js';

const PHASE_LABEL={intro:'OS ANDERSONS',chat:'01 · Atendimento',boarding:'02 · Saindo de casa',drive:'02 · Caminho até a sede',arrival:'03 · Chegada à oficina',config:'03 · Ordem de serviço',workshop:'04 · Instalação 3D',free:'Oficina livre',monitor:'05 · Teste de rua',finish:'Ato 2 · Instalação concluída'};
export function createInstallerGame({bridge,document=globalThis.document,autoLoop=true,painterFactory=createCityPainter,now=()=>new Date(),onProgress=()=>{},onExit=null}){
 const $=id=>document.getElementById(id),view=document.defaultView,keys=new Set(),accepted=new Set();
 const painter=painterFactory($('story-city')),cinema=painterFactory($('story-cinema'));
 let phase='intro',elapsed=0,total=0,chatStep=1,paused=false,resume=null,features={},car=carAtHome(),assisted=false,route=[],progress={index:0,laps:0},distance=0,uiElapsed=0,frame=0,last=0,roadStarted=false,checks=[];
 function clearKeys(){keys.clear();for(const b of document.querySelectorAll('[data-drive-key]'))b.classList.remove('pressed');}
 function setPhase(next){
  phase=next;elapsed=0;paused=false;clearKeys();
  for(const panel of document.querySelectorAll('[data-story-screen]'))panel.hidden=panel.dataset.storyScreen!==next;
  const workshop=next==='workshop'||next==='free';$('story-shell').hidden=workshop;$('workshop-shell').hidden=!workshop;$('story-workshop-bar').hidden=!workshop;
  $('story-scene-label').textContent=PHASE_LABEL[next];$('story-workshop-title').textContent=next==='free'?'Oficina livre':serviceMission(features).title;
  $('story-back-road').hidden=next==='free';$('story-change-service').hidden=next==='free';
  $('story-drive-panel').hidden=next!=='drive';$('story-monitor-panel').hidden=next!=='monitor';$('story-city-wrap').hidden=!['drive','monitor'].includes(next);$('story-cinema-wrap').hidden=!['boarding','arrival'].includes(next);
  $('story-pause').hidden=!['drive','monitor'].includes(next);$('story-pause').textContent='Pausar';
  $('story-resume').hidden=!resume;document.body.classList.toggle('story-road-test',next==='monitor');
  if(!workshop)$('story-shell').scrollIntoView?.({block:'start'});
  if(next==='workshop'||next==='free')bridge.resumeWorkshop?.();
  render();onProgress(snapshot());
 }
 function begin(){
  bridge.undock?.();features={};accepted.clear();roadStarted=false;total=0;distance=0;car=carAtHome();progress={index:0,laps:0};chatStep=1;resume=null;
  const hello=greeting(now());$('chat-central-greeting').textContent=`${hello}! Central O instalador. Como podemos ajudar?`;$('chat-client-greeting').textContent=`${hello}! Quero instalar telemetria.`;
  $('chat-clock').textContent=now().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});setPhase('chat');
 }
 function menu(event){event?.preventDefault?.();if(onExit){onExit('menu');return;}if(phase!=='intro')resume=phase;if(phase==='monitor')bridge.undock?.();setPhase('intro');}
 function renderConfig(){
  const mission=serviceMission(features);$('service-summary').textContent=mission.title;$('service-harnesses').textContent=mission.harnesses.length===2?'Serão usados os chicotes de 14 e 16 pinos.':'Será usado o chicote de 14 pinos.';
  $('service-wire-count').textContent=mission.required.length+' ligações para conferir';
  for(const box of document.querySelectorAll('[data-service-feature]'))box.checked=!!features[box.dataset.serviceFeature];
 }
 function render(){
  $('chat-client-message').hidden=chatStep<2;$('chat-invitation').hidden=chatStep<3;$('chat-reply').hidden=chatStep!==1;$('chat-next').hidden=chatStep!==3;
  $('story-assist').textContent=assisted?'Voltar a dirigir':'Piloto assistido até a sede';
  $('story-back-road').disabled=bridge.read().phase!=='running';
  if(phase==='config')renderConfig();
  if(phase==='drive'){
   $('story-speed').textContent=Math.round(Math.abs(car.speed)*.5)+' km/h';$('story-destination').textContent=Math.round(Math.hypot(car.x-CITY.garage.x,car.y-CITY.garage.y)*2)+' m até a sede';
  }
  if(phase==='monitor'){
   const reading=bridge.read();for(const command of bridge.commands?.()||[])if(command.status==='accepted')accepted.add(command.id);
   checks=roadChecks(features,accepted,progress.laps,reading);
   $('story-road-checks').innerHTML=checks.map(c=>`<span class="${c.done?'done':''}">${c.done?'✓':'○'} ${c.name}</span>`).join('');
   $('story-finish').disabled=!checks.every(c=>c.done);$('story-laps').textContent=progress.laps+' volta'+(progress.laps===1?'':'s');$('story-distance').textContent=(distance*.002).toFixed(1).replace('.',',')+' km virtuais';
   $('story-vehicle-status').textContent=reading.blocked?'Motor bloqueado · aguardando desbloqueio':!reading.ignition?'Chave desligada · veículo parado':paused?'Percurso pausado':'Percurso automático · você está na central';
  }
 }
 function openRoad(){
  if(bridge.read().phase!=='running')return false;
  if(!roadStarted){car={...CITY.garage,angle:Math.PI/2,speed:0};progress={index:1,laps:0};distance=0;accepted.clear();roadStarted=true;bridge.startDrive?.();}
  setPhase('monitor');bridge.dock($('story-telemetry-host'),returnWorkshop);render();return true;
 }
 function returnWorkshop(){bridge.undock?.();setPhase('workshop');bridge.resumeWorkshop?.();}
 function finish(){
  render();if(!checks.length||!checks.every(c=>c.done))return;
  bridge.undock?.();$('story-result-service').textContent=serviceMission(features).title;$('story-result-time').textContent=Math.max(1,Math.round(total/60))+' min de jogo';$('story-result-commands').textContent=accepted.size+' comandos confirmados';$('story-result-distance').textContent=(distance*.002).toFixed(1).replace('.',',')+' km de testes';setPhase('finish');
 }
 $('story-start').addEventListener('click',begin);$('story-free').addEventListener('click',()=>{bridge.undock?.();setPhase('free');bridge.enterWorkshop(null);});
 $('story-resume').addEventListener('click',()=>{const next=resume;resume=null;if(next==='monitor')openRoad();else setPhase(next||'chat');});
 for(const b of document.querySelectorAll('[data-story-menu]'))b.addEventListener('click',menu);
 $('story-skip-arrival')?.addEventListener('click',()=>{if(phase==='arrival')setPhase('config');});
 $('chat-reply').addEventListener('click',()=>{chatStep=2;elapsed=0;render();});$('chat-next').addEventListener('click',()=>setPhase('boarding'));
 $('story-assist').addEventListener('click',()=>{assisted=!assisted;car.speed=0;clearKeys();route=routeToGarage(car);progress={index:0,laps:0};render();});
 $('story-drive-reset').addEventListener('click',()=>{car=carAtHome();assisted=false;clearKeys();render();});
 $('story-pause').addEventListener('click',()=>{paused=!paused;clearKeys();$('story-pause').textContent=paused?'Continuar':'Pausar';render();});
 $('service-options').innerHTML=FEATURES.map(f=>`<label class="service-option"><input type="checkbox" data-service-feature="${f.id}"><span><strong>${f.name}</strong><small>${f.detail}</small></span></label>`).join('');
 $('service-options').addEventListener('change',e=>{if(e.target.dataset.serviceFeature){features[e.target.dataset.serviceFeature]=e.target.checked;renderConfig();}});
 $('service-all').addEventListener('click',()=>{features=Object.fromEntries(FEATURES.map(f=>[f.id,true]));renderConfig();});$('service-basic').addEventListener('click',()=>{features={};renderConfig();});
 $('service-start').addEventListener('click',()=>{roadStarted=false;setPhase('workshop');bridge.enterWorkshop(serviceMission(features));});
 $('story-change-service').addEventListener('click',()=>{bridge.undock?.();setPhase('config');});$('story-back-road').addEventListener('click',openRoad);
 $('story-finish').addEventListener('click',finish);$('story-new-case').addEventListener('click',()=>onExit?onExit('new-case'):begin());$('story-keep-testing').addEventListener('click',openRoad);
 const keyMap={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'brake'};
 function keyboard(e,pressed){if(phase!=='drive'||paused||assisted||!keyMap[e.code]||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;e.preventDefault();pressed?keys.add(keyMap[e.code]):keys.delete(keyMap[e.code]);}
 const keydown=e=>keyboard(e,true),keyup=e=>keyboard(e,false);document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);view.addEventListener('blur',clearKeys);
 for(const button of document.querySelectorAll('[data-drive-key]')){
  button.addEventListener('pointerdown',e=>{e.preventDefault();if(paused||assisted)return;keys.add(button.dataset.driveKey);button.classList.add('pressed');button.setPointerCapture?.(e.pointerId);});
  const release=()=>{keys.delete(button.dataset.driveKey);button.classList.remove('pressed');};for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
 }
 function tick(dt){
  dt=Math.min(['arrival','boarding','monitor'].includes(phase)?.25:.05,Math.max(0,dt));if(document.hidden||document.documentElement.dataset.suspended==='true')return;bridge.tick?.(dt);if(paused)return;
  elapsed+=dt;if(!['intro','free','finish'].includes(phase))total+=dt;
  if(phase==='chat'&&chatStep===2&&elapsed>.8){chatStep=3;render();}
  if(phase==='boarding'){cinema.cinematic('boarding',elapsed);if(elapsed>2.8){car=carAtHome();assisted=false;setPhase('drive');}}
  else if(phase==='arrival'){cinema.cinematic('arrival',elapsed);if(elapsed>4.2)setPhase('config');}
  else if(phase==='drive'){
   const result=assisted?followRoute(car,route,progress,dt,125):drive(car,Object.fromEntries([...keys].map(k=>[k,true])),dt);
   painter.draw(car,{time:total,assisted});if(result.arrived||result.finished)setPhase('arrival');
   if(result.bumped)$('story-driving-hint').textContent='Fique nas ruas. Solte o acelerador para reduzir ou use o freio.';
  }else if(phase==='monitor'){
   const r=bridge.read(),speed=r.powered&&r.ignition&&!r.blocked?Math.max(0,bridge.cruiseSpeed?.()??45)*2:0;
   const movement=followRoute(car,ROAD_TEST,progress,dt,speed,{loop:true});distance+=movement.distance;
   bridge.updateDrive?.({speed:speed*.5,...mapLocation(car)});painter.draw(car,{time:total,monitor:true,blocked:r.blocked,buzzer:r.buzzer});
  }
  uiElapsed+=dt;if(uiElapsed>.2){uiElapsed=0;render();}
 }
 function loop(time){if(last)tick((time-last)/1000);last=time;frame=view.requestAnimationFrame(loop);}
 function snapshot(){return {phase,paused,chatStep,features:{...features},car:{...car},laps:progress.laps,distance,total,roadStarted,progress:{...progress},accepted:[...accepted],checks:checks.map(c=>({...c}))};}
 setPhase('intro');if(autoLoop)frame=view.requestAnimationFrame(loop);
 return {tick,installationSucceeded(){return phase==='workshop'?openRoad():false;},syncWorkshop:render,
  startScheduled(){features={};accepted.clear();roadStarted=false;total=0;distance=0;resume=null;setPhase('arrival');},
  openFree(){setPhase('free');bridge.enterWorkshop(null);},
  restore(saved){
   const valid=['arrival','config','workshop','free','monitor','finish'];if(!saved||!valid.includes(saved.phase))return false;
   features=Object.fromEntries(FEATURES.map(f=>[f.id,!!saved.features?.[f.id]]));
   accepted.clear();for(const id of saved.accepted||[])if(typeof id==='string')accepted.add(id);
   total=Math.max(0,Number(saved.total)||0);distance=Math.max(0,Number(saved.distance)||0);roadStarted=!!saved.roadStarted;
   if(saved.car&&['x','y','angle','speed'].every(k=>Number.isFinite(saved.car[k])))car={...saved.car};
   progress={index:Math.max(0,Math.min(ROAD_TEST.length-1,Number(saved.progress?.index)||0)),laps:Math.max(0,Number(saved.laps)||0)};
   setPhase(saved.phase);if(saved.phase==='monitor')bridge.dock($('story-telemetry-host'),returnWorkshop);return true;
  },
  inspect:snapshot,
  destroy(){view.cancelAnimationFrame(frame);document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);view.removeEventListener('blur',clearKeys);}
 };
}

