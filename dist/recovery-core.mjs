import {recoveryRules,difficultyFor} from './career-core.mjs?v=1.1.1';
export const rulesFor=s=>s?.rules||RULES;
import {moveScreenCar} from './screen-driving.mjs?v=1.1.1';
import {WORLD,collides,locationName} from './heist-core.mjs?v=1.1.1';
import {RO_LECTURE} from './ro-lecture.mjs?v=1.1.1';
export {RO_LECTURE};
export const RECOVERY_VERSION=1;
export const ANSWERS=['E quem disse que isso é problema nosso?','Como ocorreu, senhor?','Quem com ferro fere, com ferro será ferido.','Como você deixou isso acontecer, senhor?','Você procurou bem?'];
export const REPORT='Estacionei o veículo em frente à minha casa. Duas horas depois, quando voltei, ele já não estava mais lá.';
export const RULES=Object.freeze(recoveryRules());
// Rota inteiramente fictícia. As curvas arredondadas cabem nas ruas da cidade do Ato 4.
const corners=[[320,1190],[1880,1190],[1880,270],[320,270]],radius=42;
export const ROUTE=[];
for(let i=0;i<corners.length;i++){
 const p=corners[i],prev=corners[(i+3)%4],next=corners[(i+1)%4],before={x:p[0]+Math.sign(prev[0]-p[0])*radius,y:p[1]+Math.sign(prev[1]-p[1])*radius},after={x:p[0]+Math.sign(next[0]-p[0])*radius,y:p[1]+Math.sign(next[1]-p[1])*radius};
 const cx=before.x+after.x-p[0],cy=before.y+after.y-p[1],a=Math.atan2(before.y-cy,before.x-cx);for(let j=0;j<=6;j++){const theta=a-j*Math.PI/12;ROUTE.push({x:cx+Math.cos(theta)*radius,y:cy+Math.sin(theta)*radius});}
}
const segments=ROUTE.map((p,i)=>{const next=ROUTE[(i+1)%ROUTE.length];return {p,next,length:Math.hypot(next.x-p.x,next.y-p.y),angle:Math.atan2(next.y-p.y,next.x-p.x)};});
export const ROUTE_LENGTH=segments.reduce((v,s)=>v+s.length,0);
export function routePosition(distance){let left=((distance%ROUTE_LENGTH)+ROUTE_LENGTH)%ROUTE_LENGTH;for(const s of segments){if(left<=s.length)return {x:s.p.x+(s.next.x-s.p.x)*left/s.length,y:s.p.y+(s.next.y-s.p.y)*left/s.length,angle:s.angle};left-=s.length;}return {...ROUTE[0],angle:0};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createRecovery(caseId,details={}){return {rules:recoveryRules(details.difficulty,details.installation),difficulty:difficultyFor(details.difficulty).id,collisionCount:0,version:RECOVERY_VERSION,caseId,phase:'alert',phaseTime:0,elapsed:0,lectureIndex:0,lectureRead:false,lectureSeen:[],lectureCompleted:false,classified:false,reportAsked:false,platformOpen:false,targetDistance:520,target:{...routePosition(520),speed:155},copied:null,draft:'',destination:'response',sent:null,patrol:null,raceTime:0,stable:0,commandsOpen:false,windowLeft:null,blockSent:false,collisionTime:0,failure:null};}
const lose=(s,reason,phase='lost')=>({...s,phase,phaseTime:0,failure:reason,stable:0});
export function positionText(s){const p=s.target;return `FORD KA · ${locationName(p)} · setor ${Math.round(p.x/10)}-${Math.round(p.y/10)}\nGPS ${(-23.5505+p.y*.000006).toFixed(5)}, ${(-46.6333+p.x*.000006).toFixed(5)}\nAtualização #${Math.floor(s.elapsed)}`;}
export const locationFresh=s=>!!s.copied&&s.elapsed-s.copied.at<=rulesFor(s).locationAge;
export function proximity(s){if(!s.patrol)return {distance:Infinity,heading:0,relativeSpeed:Infinity,behind:0,lateral:Infinity,qualified:false};const dx=s.target.x-s.patrol.x,dy=s.target.y-s.patrol.y,distance=Math.hypot(dx,dy),heading=Math.cos(s.patrol.angle-s.target.angle),relativeSpeed=Math.abs(s.patrol.speed-s.target.speed),behind=dx*Math.cos(s.target.angle)+dy*Math.sin(s.target.angle),lateral=Math.abs(-dx*Math.sin(s.target.angle)+dy*Math.cos(s.target.angle));return {distance,heading,relativeSpeed,behind,lateral,qualified:distance>=rulesFor(s).minDistance&&distance<=rulesFor(s).maxDistance&&heading>.88&&relativeSpeed<=rulesFor(s).maxRelativeSpeed&&behind>35&&lateral<42};}
export function canBlock(s){const p=proximity(s);return s.phase==='chase'&&s.windowLeft!==null&&s.windowLeft>0&&p.distance>=42&&p.distance<=175&&p.heading>.75&&p.behind>8;}
export function applyRecoveryAction(s,a){
 if(['fired','lost','finish'].includes(s.phase))return s;
 if(a.type==='attend'&&s.phase==='alert')return {...s,phase:'contact',phaseTime:0};
 if(a.type==='answer'&&s.phase==='contact'&&Number.isInteger(a.index)&&a.index>=0&&a.index<5)return a.index===1?{...s,phase:'classify',phaseTime:0,reportAsked:true}:lose(s,'Essa resposta piorou o dia de quem precisava de ajuda.','fired');
 if(a.type==='classify'&&s.phase==='classify'){
  if(a.choice==='furto')return {...s,phase:'tracking',phaseTime:0,classified:true};
  if(a.choice==='roubo')return {...s,phase:'lecture',phaseTime:0,lectureIndex:0,lectureRead:false,lectureSeen:[],lectureCompleted:false};
 }
 if(a.type==='lecture-read'&&s.phase==='lecture'&&!s.lectureRead)return {...s,lectureRead:true};
 if(a.type==='lecture-next'&&s.phase==='lecture'&&s.lectureRead&&s.phaseTime>=RO_LECTURE[s.lectureIndex].minSeconds){
  const seen=[...s.lectureSeen,s.lectureIndex],last=s.lectureIndex===RO_LECTURE.length-1;
  return {...s,phase:last?'classify':'lecture',phaseTime:0,lectureIndex:last?0:s.lectureIndex+1,lectureRead:false,lectureSeen:seen,lectureCompleted:last};
 }
 if(a.type==='open-platform'&&s.phase==='tracking')return {...s,platformOpen:true};
 if(a.type==='copy-position'&&s.phase==='tracking'&&s.platformOpen)return {...s,copied:{text:positionText(s),at:s.elapsed}};
 if(a.type==='destination'&&s.phase==='tracking'&&['client','response'].includes(a.value))return {...s,destination:a.value};
 if(a.type==='draft'&&s.phase==='tracking')return {...s,draft:String(a.value??'').slice(0,500)};
 if(a.type==='paste-position'&&s.phase==='tracking'&&s.copied)return {...s,draft:s.copied.text};
 if(a.type==='send-position'&&s.phase==='tracking'&&s.destination==='response'&&s.draft===s.copied?.text&&locationFresh(s))return {...s,phase:'briefing',phaseTime:0,sent:s.copied.text};
 if(a.type==='start-chase'&&s.phase==='briefing')return {...s,phase:'countdown',phaseTime:0,patrol:{...routePosition(s.targetDistance-350),speed:0},raceTime:0,stable:0,windowLeft:null,commandsOpen:false};
 if(a.type==='commands'&&s.phase==='chase')return {...s,commandsOpen:!s.commandsOpen};
 if(a.type==='block'&&s.phase==='chase'&&s.commandsOpen){if(!canBlock(s))return lose(s,s.windowLeft===null?'Você enviou BLOQUEAR antes do aviso da Rô. Aguarde a aproximação estável.':'O bloqueio foi enviado fora da aproximação indicada.');return {...s,phase:'stopping',phaseTime:0,blockSent:true};}
 return s;
}
export function advanceRecovery(s,input={},seconds=0){
 const dt=clamp(Number(seconds)||0,0,.05);if(!dt||['fired','lost','finish'].includes(s.phase))return s;
 let n={...s,elapsed:s.elapsed+dt,phaseTime:s.phaseTime+dt};
 if(s.phase==='countdown'){if(n.phaseTime>=3)n={...n,phase:'chase',phaseTime:0};return n;}
 if(s.phase==='stopping'){
  n.targetDistance=s.targetDistance+s.target.speed*dt;n.target={...routePosition(n.targetDistance),speed:Math.max(0,s.target.speed-140*dt)};
  const speed=Math.max(0,s.patrol.speed-180*dt);n.patrol={...s.patrol,x:s.patrol.x+Math.cos(s.patrol.angle)*speed*dt,y:s.patrol.y+Math.sin(s.patrol.angle)*speed*dt,speed};
  if(n.phaseTime>=2.2)n={...n,phase:'finish',phaseTime:0,target:{...n.target,speed:0},patrol:{...n.patrol,speed:0}};return n;
 }
 if(s.phase==='tracking'||s.phase==='chase'){
  const speed=s.phase==='tracking'?112:155;n.targetDistance=s.targetDistance+speed*dt;n.target={...routePosition(n.targetDistance),speed};
 }
 if(s.phase==='chase'){
  n.raceTime=s.raceTime+dt;n.collisionTime=Math.max(0,s.collisionTime-dt);
  const motion=moveScreenCar(s.patrol,input,dt,{speed:180,turboSpeed:310,blocked:(x,y)=>collides(x,y,23)});n.patrol=motion.car;if(motion.hit){if(!(s.collisionTime>0))n.collisionCount=(s.collisionCount||0)+1;n.collisionTime=.65;}
  const p=proximity(n);n.stable=p.qualified?Math.min(rulesFor(s).hold,s.stable+dt):Math.max(0,s.stable-dt*2.5);
  if(s.windowLeft!==null){n.windowLeft=Math.max(0,s.windowLeft-dt);if(n.windowLeft<=0)return lose(n,'A janela de bloqueio passou. Você demorou demais para enviar o comando.');}
  else if(n.stable>=rulesFor(s).hold)n.windowLeft=rulesFor(s).window;
  if(n.raceTime>=rulesFor(s).deadline)return lose(n,'O Ford Ka escapou do acompanhamento. O tempo da operação acabou.');
 }
 return n;
}
export function roGuidance(s){
 if(s.phase==='alert')return 'ANDERSON, ATENDA! O CLIENTE ESTÁ PEDINDO AJUDA.';
 if(s.phase==='contact')return 'PRIMEIRO, ENTENDA O QUE ACONTECEU. ESCOLHA SUA RESPOSTA.';
 if(s.phase==='classify')return 'LEIA O RELATO. QUAL É A CLASSIFICAÇÃO DESTE CASO?';
 if(s.phase==='lecture')return 'NÃO SERÁ DEMITIDO. MAS VAI OUVIR TUDO. CADA. PÁGINA.';
 if(s.phase==='tracking')return !s.platformOpen?'ABRA O RASTREAMENTO. PRECISAMOS DA POSIÇÃO ATUAL.':!s.copied?'COPIE A LOCALIZAÇÃO DO FORD KA. ELE ESTÁ ANDANDO!':!locationFresh(s)?'ESSA POSIÇÃO ENVELHECEU. COPIE A ATUAL E COLE DE NOVO.':'COLE E ENVIE PARA PRONTA RESPOSTA. AGORA, ANDERSON!';
 if(['briefing','countdown'].includes(s.phase))return 'ALCANCE. FREIE. ACOMPANHE. BLOQUEIE SÓ QUANDO EU MANDAR.';
 if(s.phase==='stopping')return 'COMANDO ACEITO! O KA ESTÁ PARANDO. EQUIPE, CONFIRMEM A RECUPERAÇÃO!';
 if(s.phase==='finish')return 'VEÍCULO RECUPERADO! BOM TRABALHO, ANDERSON. VOCÊ DEU CONTA!';
 if(['fired','lost'].includes(s.phase))return 'OPERAÇÃO ENCERRADA. FALTOU ATENÇÃO, ANDERSON.';
 const p=proximity(s);
 if(s.windowLeft!==null)return canBlock(s)?'AGORA! BLOQUEIE! APERTE B OU TOQUE NO BOTÃO!':'VOLTE PARA PERTO! A JANELA JÁ ESTÁ CONTANDO!';
 if(s.collisionTime>0)return 'CUIDADO COM OS PRÉDIOS! VOLTE PARA A RUA.';
 if(!s.commandsOpen)return 'ABRA COMANDOS ANTES DE CHEGAR PERTO. DEIXE O BLOQUEIO À MÃO.';
 if(p.distance>240)return 'O FORD KA ESTÁ NO MAPA. ACELERE E SIGA O ALVO AZUL!';
 if(p.behind<25)return 'VOCÊ PASSOU DO ALVO! FREIE E VOLTE PARA TRÁS DELE.';
 if(p.heading<.88||p.lateral>42)return 'ALINHE A VIATURA ATRÁS DO KA. ACOMPANHE A CURVA.';
 if(p.distance<65||s.patrol.speed>s.target.speed+48)return 'FREIE! VOCÊ ESTÁ CHEGANDO RÁPIDO DEMAIS.';
 if(p.distance>145||s.patrol.speed<s.target.speed-48)return 'MAIS PERTO, ANDERSON! AJUSTE A VELOCIDADE.';
 return 'ISSO! MANTENHA ATRÁS DO KA. ESPERE MEU AVISO!';
}
export function restoreRecovery(raw,caseId,details={}){
 const phases=['alert','contact','classify','lecture','tracking','briefing','countdown','chase','stopping','finish'];
 if(!raw||raw.version!==RECOVERY_VERSION||raw.caseId!==caseId||!phases.includes(raw.phase))return null;
 const s=createRecovery(caseId,details),phase=raw.phase,finite=v=>Number.isFinite(v)&&v>=0;
 if(![raw.elapsed,raw.phaseTime,raw.targetDistance,raw.raceTime,raw.stable].every(finite))return null;
 if(!Number.isInteger(raw.lectureIndex)||raw.lectureIndex<0||raw.lectureIndex>=RO_LECTURE.length||!Array.isArray(raw.lectureSeen))return null;
 if(!raw.lectureSeen.every((v,i)=>v===i)||raw.lectureSeen.length>RO_LECTURE.length)return null;
 if(phase==='lecture'&&raw.lectureSeen.length!==raw.lectureIndex)return null;
 if(!['alert','contact'].includes(phase)&&!raw.reportAsked)return null;
 if(['tracking','briefing','countdown','chase','stopping','finish'].includes(phase)&&!raw.classified)return null;
 if(raw.lectureCompleted&&raw.lectureSeen.length!==RO_LECTURE.length)return null;
 const copied=raw.copied&&typeof raw.copied.text==='string'&&raw.copied.text.length<=500&&finite(raw.copied.at)&&raw.copied.at<=raw.elapsed?{...raw.copied}:null;
 if(['briefing','countdown','chase','stopping','finish'].includes(phase)&&(!copied||raw.sent!==copied.text))return null;
 if(['countdown','chase','stopping','finish'].includes(phase)){
  if(!raw.patrol||![raw.patrol.x,raw.patrol.y,raw.patrol.angle,raw.patrol.speed].every(Number.isFinite)||collides(raw.patrol.x,raw.patrol.y,20)||Math.abs(raw.patrol.speed)>311)return null;
  if(raw.raceTime>rulesFor(s).deadline+.1||raw.stable>rulesFor(s).hold+.01)return null;
  if(raw.windowLeft!==null&&(!finite(raw.windowLeft)||raw.windowLeft>rulesFor(s).window))return null;
  if(phase==='chase'&&raw.windowLeft!==null&&raw.windowLeft<=0)return null;
 }
 if(['stopping','finish'].includes(phase)&&(!raw.blockSent||raw.windowLeft===null||raw.windowLeft<=0||!raw.commandsOpen))return null;
 return {...s,collisionCount:Math.max(0,Number(raw.collisionCount)||0),phase,elapsed:raw.elapsed,phaseTime:raw.phaseTime,targetDistance:raw.targetDistance,target:{...routePosition(raw.targetDistance),speed:phase==='finish'?0:phase==='stopping'?Math.max(0,155-raw.phaseTime*140):phase==='tracking'?112:155},reportAsked:!!raw.reportAsked,classified:!!raw.classified,platformOpen:!!raw.platformOpen,lectureIndex:raw.lectureIndex,lectureRead:!!raw.lectureRead,lectureSeen:[...raw.lectureSeen],lectureCompleted:!!raw.lectureCompleted,copied,draft:String(raw.draft??'').slice(0,500),destination:raw.destination==='client'?'client':'response',sent:raw.sent??null,patrol:raw.patrol?{...raw.patrol}:null,raceTime:raw.raceTime,stable:raw.stable,commandsOpen:!!raw.commandsOpen,windowLeft:raw.windowLeft??null,blockSent:!!raw.blockSent};
}
