import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecovery,applyRecoveryAction as act,advanceRecovery as advance,restoreRecovery,proximity,canBlock,positionText,locationFresh,RO_LECTURE,ROUTE_LENGTH,routePosition,RULES,roGuidance} from '../dist/recovery-core.mjs';
import {collides} from '../dist/heist-core.mjs';
const tick=(s,seconds,input={})=>{for(let t=0;t<seconds-1e-8;t+=.05)s=advance(s,typeof input==='function'?input(s):input,Math.min(.05,seconds-t));return s;};
const contact=()=>act(createRecovery('case-5'),{type:'attend'});
const classify=()=>act(contact(),{type:'answer',index:1});
const tracking=()=>act(act(classify(),{type:'classify',choice:'furto'}),{type:'open-platform'});
function briefing(){let s=act(tracking(),{type:'copy-position'});s=act(s,{type:'paste-position'});return act(s,{type:'send-position'});}
const matchSpeed=s=>({x:Math.cos(s.target.angle),y:Math.sin(s.target.angle)});
const chase=()=>tick(act(briefing(),{type:'start-chase'}),3.05);
function aligned(){const s=chase(),p=routePosition(s.targetDistance-140);return {...s,commandsOpen:true,patrol:{...p,speed:155}};}

test('Ato 5 começa com alerta; só a resposta 2 atende sem demissão',()=>{
 assert.equal(createRecovery('a').phase,'alert');for(let index=0;index<5;index++){const s=act(contact(),{type:'answer',index});assert.equal(s.phase,index===1?'classify':'fired');}assert.equal(act(contact(),{type:'answer',index:99}).phase,'contact');
});
test('Furto libera o rastreamento; roubo dá uma bronca completa sem demitir',()=>{
 const s=classify();assert.equal(act(s,{type:'classify',choice:'furto'}).phase,'tracking');const wrong=act(s,{type:'classify',choice:'roubo'});assert.equal(wrong.phase,'lecture');assert.equal(wrong.failure,null);assert.match(roGuidance(wrong),/NÃO SERÁ DEMITIDO/);
});
test('As 28 páginas exigem tempo de leitura, fim do texto e avanço individual',()=>{
 assert.equal(RO_LECTURE.length,28);let s=act(classify(),{type:'classify',choice:'roubo'});for(let i=0;i<28;i++){
  assert.equal(s.lectureIndex,i);assert.equal(act(s,{type:'lecture-next'}),s);let after=tick(s,5.05);assert.equal(act(after,{type:'lecture-next'}),after);s=act(after,{type:'lecture-read'});s=act(s,{type:'lecture-next'});
 }assert.equal(s.phase,'classify');assert.equal(s.lectureCompleted,true);assert.deepEqual(s.lectureSeen,Array.from({length:28},(_,i)=>i));assert.equal(act(s,{type:'classify',choice:'roubo'}).lectureIndex,0);assert.equal(act(s,{type:'classify',choice:'furto'}).phase,'tracking');
});
test('O rastreamento se move; a cópia preserva a posição exata e expira em 12 segundos',()=>{
 let s=tracking();const first=positionText(s);s=act(s,{type:'copy-position'});const copied=s.copied.text;s=tick(s,2);assert.notEqual(positionText(s),first);assert.equal(s.copied.text,copied);assert.equal(locationFresh(s),true);s=tick(s,10.1);assert.equal(locationFresh(s),false);assert.equal(act(act(s,{type:'paste-position'}),{type:'send-position'}).phase,'tracking');
});
test('Enviar requer cópia completa e destinatário Pronta resposta, sem perder por corrigir o texto',()=>{
 let s=tracking();assert.equal(act(s,{type:'send-position'}),s);s=act(s,{type:'copy-position'});s=act(s,{type:'draft',value:s.copied.text.slice(1)});assert.equal(act(s,{type:'send-position'}),s);s=act(s,{type:'paste-position'});s=act(s,{type:'destination',value:'client'});assert.equal(act(s,{type:'send-position'}),s);s=act(s,{type:'destination',value:'response'});assert.equal(act(s,{type:'send-position'}).phase,'briefing');
});
test('Rota é contínua, cíclica e cabe nas ruas; a contagem prepara a direção sem consumir o prazo',()=>{
 const start=routePosition(0),end=routePosition(ROUTE_LENGTH);assert.ok(Math.hypot(start.x-end.x,start.y-end.y)<.001);let prev=start;for(let d=0;d<ROUTE_LENGTH;d+=8){const p=routePosition(d);assert.equal(collides(p.x,p.y,23),false);assert.ok(Math.hypot(p.x-prev.x,p.y-prev.y)<=8.01);prev=p;}let s=act(briefing(),{type:'start-chase'});assert.equal(s.raceTime,0);s=tick(s,2);assert.equal(s.phase,'countdown');assert.equal(s.raceTime,0);s=tick(s,1.1);assert.equal(s.phase,'chase');assert.ok(s.raceTime<.15);
});
test('Viatura obedece a quatro direções absolutas, freia sem ré e mantém colisões',()=>{
 for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const [x,y]of [[0,-1],[0,1],[-1,0],[1,0]]){
  const s={...chase(),patrol:{x:1000,y:730,angle,speed:-50}},n=advance(s,{x,y},.05);assert.equal(Math.sign(n.patrol.x-s.patrol.x),x);assert.equal(Math.sign(n.patrol.y-s.patrol.y),y);assert.equal(n.patrol.angle,Math.atan2(y,x));
 }
 let s=chase();s=tick(s,1,{x:1});assert.equal(s.patrol.speed,180);const before={...s.patrol};s=advance(s,{brake:true,x:1},.05);assert.equal(s.patrol.speed,0);assert.equal(s.patrol.x,before.x);assert.equal(s.patrol.y,before.y);s=advance(s,{x:1,boost:true},.05);assert.equal(s.patrol.speed,310);s=advance(s,{},.05);assert.equal(s.patrol.speed,0);
 s={...chase(),patrol:{x:400,y:940,angle:0,speed:200}};s=advance(s,{x:1},.05);assert.equal(s.patrol.speed,0);assert.equal(s.patrol.x,400);assert.ok(s.collisionTime>0);
});
test('Aproximação exige distância, alinhamento, posição atrás e velocidade parecida',()=>{
 const s=aligned();assert.equal(proximity(s).qualified,true);for(const patch of [{x:s.target.x-220},{x:s.target.x-20},{angle:Math.PI},{speed:310},{y:s.target.y+65},{x:s.target.x+100}])assert.equal(proximity({...s,patrol:{...s.patrol,...patch}}).qualified,false);
});
test('Janela só abre após 2,2 s estáveis e o aviso pede o comando; cedo ou tarde perde',()=>{
 let s=aligned();const early=act(s,{type:'block'});assert.equal(early.phase,'lost');s=tick(s,2,matchSpeed);assert.equal(s.windowLeft,null);s=tick(s,.3,matchSpeed);assert.ok(s.windowLeft>0);assert.match(roGuidance(s),/AGORA/);assert.equal(canBlock(s),true);s=tick(s,1.6,matchSpeed);assert.equal(s.phase,'lost');assert.match(s.failure,/demorou/);
});
test('Comando dentro da janela para o alvo e conclui a recuperação; fora da proximidade não funciona',()=>{
 let s=aligned();s=tick(s,2.25,matchSpeed);assert.ok(s.windowLeft>0);assert.equal(act({...s,commandsOpen:false},{type:'block'}).phase,'chase');assert.equal(act({...s,patrol:{...s.patrol,x:s.target.x-250}},{type:'block'}).phase,'lost');s=act(s,{type:'block'});assert.equal(s.phase,'stopping');assert.equal(s.blockSent,true);s=tick(s,2.3);assert.equal(s.phase,'finish');assert.equal(s.target.speed,0);assert.equal(s.patrol.speed,0);assert.equal(restoreRecovery(s,s.caseId).target.speed,0);
});
test('Prazo de 70 s encerra a missão e saves não recuperam falhas ou vitórias incompletas',()=>{
 const s={...chase(),raceTime:69.98};assert.equal(advance(s,{},.05).phase,'lost');assert.equal(restoreRecovery({...s,phase:'lost'},s.caseId),null);assert.equal(restoreRecovery({...s,phase:'finish'},s.caseId),null);assert.equal(restoreRecovery(s,'outro'),null);assert.equal(restoreRecovery({...s,patrol:{...s.patrol,x:NaN}},s.caseId),null);
});
test('Retomada conserva a página da bronca, mensagem copiada e a curta janela da corrida',()=>{
 let lecture=act(classify(),{type:'classify',choice:'roubo'});lecture=act(act(tick(lecture,5.1),{type:'lecture-read'}),{type:'lecture-next'});assert.deepEqual(restoreRecovery(lecture,lecture.caseId),lecture);let s=act(tracking(),{type:'copy-position'});s=act(s,{type:'paste-position'});const restored=restoreRecovery(s,s.caseId);assert.equal(restored.copied.text,s.copied.text);assert.equal(restored.draft,s.draft);s=tick(aligned(),2.25,matchSpeed);assert.equal(restoreRecovery(s,s.caseId).windowLeft,s.windowLeft);assert.equal(restoreRecovery({...lecture,lectureIndex:4},lecture.caseId),null);
});
test('Perseguição pode ser vencida desde a largada com direções da tela e Turbo',()=>{
 let s=act(chase(),{type:'commands'}),corner=0;const corners=[[1880,1190],[1880,270],[320,270],[320,1190]];
 for(let i=0;i<1300&&s.phase==='chase';i++){
  if(canBlock(s)){s=act(s,{type:'block'});break;}
  const goal=corners[corner],dx=goal[0]-s.patrol.x,dy=goal[1]-s.patrol.y;if(Math.hypot(dx,dy)<14){corner=(corner+1)%4;continue;}
  const input=Math.abs(dx)>Math.abs(dy)?{x:Math.sign(dx)}:{y:Math.sign(dy)};s=advance(s,{...input,boost:proximity(s).distance>220},.05);
 }
 assert.equal(s.phase,'stopping');s=tick(s,2.3);assert.equal(s.phase,'finish');
});
