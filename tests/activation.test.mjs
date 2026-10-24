import {faultFor} from '../dist/activation-diagnosis.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivation,applyActivationAction as action,advanceActivation as advance,buttonsFor,taskFor,ACTIVATION_STEPS,ACCESS_STEPS,challengeFor,POSITION_DELAY,PRESSURE_INTERVAL,PRESSURE,BEAR_LINES,locationText,credentialsText,restoreActivation} from '../dist/activation-core.mjs';
import {vehiclePoint} from '../dist/activation-visuals.mjs';
const healthyCase=Array.from({length:20},(_,i)=>'activation-healthy-'+i).find(id=>faultFor(id)==='none');
const fresh=()=>createActivation(healthyCase,{client:'Anderson da Silva Anderson',vehicle:'Ford Ka',installationLocation:'rear-trim'});
function maze(){const s=fresh();return action(s,{type:'imei',value:s.imei});}
function platform(){let s=maze();for(let i=0;i<20;i++){const check=challengeFor(s);if(check&&!check.solved)s=action(s,{type:'solve-check',id:check.correct});s=action(s,{type:'workflow',id:taskFor(s).id});}return s;}
function positioned(){return advance(action(platform(),{type:'command',id:'position'}),POSITION_DELAY);}
function handoff(){let s=action(positioned(),{type:'copy-location'});return action(s,{type:'send',target:'tech',value:locationText(s)});}
function credentials(){let s=handoff();for(let i=0;i<6;i++)s=action(s,{type:'workflow',id:taskFor(s).id});return s;}
test('IMEI tem 15 dígitos estáveis por partida; qualquer dígito diferente demite',()=>{
 const s=fresh();assert.match(s.imei,/^\d{15}$/);assert.equal(s.imei,fresh().imei);assert.notEqual(s.imei,createActivation('another').imei);assert.equal(action(s,{type:'imei',value:s.imei}).phase,'maze');assert.equal(action(s,{type:'imei',value:s.imei.slice(0,14)}).phase,'failed');assert.equal(action(s,{type:'imei',value:'0'+s.imei.slice(1)}).phase,'failed');
});
test('São 20 telas, com uma única ação correta e sete distrações em cada uma',()=>{
 let s=maze();assert.equal(ACTIVATION_STEPS.length,20);for(let i=0;i<20;i++){const check=challengeFor(s);if(check&&!check.solved)s=action(s,{type:'solve-check',id:check.correct});const task=taskFor(s),buttons=buttonsFor(s);assert.equal(buttons.length,8);assert.equal(buttons.filter(b=>b.id===task.id).length,1);for(const wrong of buttons.filter(b=>b.id!==task.id))assert.equal(action(s,{type:'workflow',id:wrong.id}).phase,'failed');s=action(s,{type:'workflow',id:task.id});assert.equal(s.mazeStep,i+1);}assert.equal(s.phase,'platform');
});
test('Botões ficam estáveis durante notificações e mudam entre etapas e partidas',()=>{
 const s=maze();assert.deepEqual(buttonsFor(s),buttonsFor(advance(s,13000)));assert.notDeepEqual(buttonsFor(s),buttonsFor(action(s,{type:'workflow',id:taskFor(s).id})));const other=createActivation('other');assert.notDeepEqual(buttonsFor(s),buttonsFor(action(other,{type:'imei',value:other.imei})));
});
test('Só solicitar posição é correto; GPS só fica verde após aguardar e não reinicia com reenvio',()=>{
 let s=platform();for(const id of ['factory','block','offline'])assert.equal(action(s,{type:'command',id}).phase,'failed');assert.equal(advance(s,100000).gpsReady,false);s=action(s,{type:'command',id:'position'});s=advance(s,POSITION_DELAY-1);assert.equal(s.phase,'platform');const copy=action(s,{type:'command',id:'position'});assert.equal(copy.waitMs,s.waitMs);s=advance(s,1);assert.equal(s.phase,'location');assert.equal(s.gpsReady,true);
});
test('Localização deve ser copiada e enviada exatamente ao técnico',()=>{
 let s=positioned();assert.equal(action(s,{type:'send',target:'tech',value:locationText(s)}).phase,'failed');s=action(s,{type:'copy-location'});assert.equal(action(s,{type:'send',target:'client',value:locationText(s)}).phase,'failed');assert.equal(action(s,{type:'send',target:'tech',value:'posição errada'}).phase,'failed');s=action(s,{type:'send',target:'tech',value:locationText(s)});assert.equal(s.phase,'handoff');assert.equal(s.locationSent,true);
});
test('Seis telas de acesso e envio de login/senha ao cliente precedem a conclusão',()=>{
 let s=handoff();assert.equal(ACCESS_STEPS.length,6);for(let i=0;i<6;i++){const task=taskFor(s),wrong=buttonsFor(s).find(b=>b.id!==task.id);assert.equal(action(s,{type:'workflow',id:wrong.id}).phase,'failed');s=action(s,{type:'workflow',id:task.id});}assert.equal(s.phase,'credentials');s=action(s,{type:'copy-credentials'});assert.equal(action(s,{type:'send',target:'tech',value:credentialsText(s)}).phase,'failed');assert.equal(action(s,{type:'send',target:'client',value:credentialsText(s).slice(0,-1)}).phase,'failed');s=action(s,{type:'send',target:'client',value:credentialsText(s)});assert.equal(s.phase,'finish');assert.equal(s.accessSent,true);
});
test('Retomada conserva espera, sequência, texto e destinatário; rejeita outro caso e conclusão incompleta',()=>{
 let s=advance(action(platform(),{type:'command',id:'position'}),7000);let resumed=restoreActivation(JSON.parse(JSON.stringify(s)),healthyCase);assert.equal(resumed.waitMs,7000);assert.equal(advance(resumed,11000).phase,'location');assert.equal(restoreActivation(s,'other'),null);assert.equal(restoreActivation({...s,phase:'finish'},healthyCase),null);s=action(credentials(),{type:'copy-credentials'});s=action(s,{type:'chat-target',id:'client'});s=action(s,{type:'paste'});resumed=restoreActivation(s,healthyCase);assert.equal(resumed.chatTarget,'client');assert.equal(resumed.chatDraft,credentialsText(resumed));assert.equal(resumed.clipboard.kind,'credentials');
});
test('Veículo percorre a rota automaticamente e faz um ciclo completo',()=>{
 assert.notDeepEqual(vehiclePoint(0),vehiclePoint(8000));assert.deepEqual(vehiclePoint(0),vehiclePoint(60000));const s=action(action(credentials(),{type:'copy-credentials'}),{type:'send',target:'client',value:credentialsText(credentials())});assert.equal(advance(s,4000).finishMs,4000);assert.equal(advance(s,4000).elapsedMs,s.elapsedMs);
});

test('Cobranças são mais frequentes e usam mensagens de alto destaque',()=>{
 assert.equal(PRESSURE_INTERVAL,3500);assert.ok(PRESSURE.every(s=>s===s.toUpperCase()));assert.ok(BEAR_LINES.every(s=>s===s.toUpperCase()));assert.ok(PRESSURE.some(s=>s.includes('CAT')));
});
