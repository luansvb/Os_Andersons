import {shuffleOptions} from '../dist/option-order.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as core from '../dist/activation-core.mjs';
import * as diagnosis from '../dist/activation-diagnosis.mjs';
import * as visuals from '../dist/activation-visuals.mjs';
import {LOCATIONS} from '../dist/lt32-core.mjs';
import {installShift} from './ui-shift-fixture.mjs';
const act=(s,type,id)=>core.applyActivationAction(s,{type,id});
const cases=Object.fromEntries(['none','identity','power','signal'].map(fault=>[fault,Array.from({length:80},(_,i)=>'diagnostic-case-'+i).find(id=>diagnosis.faultFor(id)===fault)]));
function platform(caseId){let s=core.createActivation(caseId);s=core.applyActivationAction(s,{type:'imei',value:s.imei});while(s.phase==='maze'){const check=core.challengeFor(s);if(check&&!check.solved)s=act(s,'solve-check',check.correct);s=act(s,'workflow',core.taskFor(s).id);}return s;}
function scan(fault){return core.advanceActivation(act(platform(cases[fault]),'command','position'),diagnosis.DIAGNOSIS_REVIEW_MS);}
function reviewed(s){for(const source of diagnosis.DIAGNOSIS_SOURCES)s=act(s,'inspect-diagnostic',source.id);return s;}
function repair(s){s=act(reviewed(s),'resolve-diagnosis',diagnosis.diagnosticFor(s).correct);return core.advanceActivation(s,diagnosis.DIAGNOSIS_REPAIR_MS);}
function complete(s){s=act(s,'command','position');s=core.advanceActivation(s,s.positionDelay);s=act(s,'copy-location');s=core.applyActivationAction(s,{type:'send',target:'tech',value:core.locationText(s)});while(s.phase==='handoff')s=act(s,'workflow',core.taskFor(s).id);s=act(s,'copy-credentials');return core.applyActivationAction(s,{type:'send',target:'client',value:core.credentialsText(s)});}

test('Cada falha impede o GPS automático, exige as três fontes e só permite liberar após correção confirmada e novo comando',()=>{
 for(const fault of ['identity','power','signal']){
  let s=scan(fault);assert.equal(s.phase,'diagnosis');assert.equal(core.advanceActivation(s,90000).phase,'diagnosis');assert.equal(s.gpsReady,false);
  assert.equal(act(s,'resolve-diagnosis',fault),s);assert.equal(act(s,'copy-location'),s);
  s=reviewed(s);const evidence=diagnosis.diagnosticFor(s);
  for(const wrong of evidence.actions.filter(a=>a.id!==fault)){const failed=act(s,'resolve-diagnosis',wrong.id);assert.equal(failed.phase,'failed');assert.ok(failed.failure.includes(evidence.hint));}
  s=act(s,'resolve-diagnosis',fault);assert.equal(s.phase,'repairing');assert.equal(act(s,'command','position'),s);
  s=core.advanceActivation(s,diagnosis.DIAGNOSIS_REPAIR_MS-1);assert.equal(s.phase,'repairing');assert.equal(s.gpsReady,false);
  s=core.advanceActivation(s,1);assert.equal(s.phase,'platform');assert.equal(s.commandSent,false);assert.equal(s.diagnosis.resolved,true);assert.equal(core.advanceActivation(s,90000).gpsReady,false);
  s=act(s,'command','position');assert.equal(act(s,'open-diagnosis'),s);s=core.advanceActivation(s,s.positionDelay-1);assert.equal(s.gpsReady,false);s=core.advanceActivation(s,1);assert.equal(s.phase,'location');assert.equal(s.gpsReady,true);
  assert.equal(diagnosis.diagnosticFor(s).external,'12,6 V');assert.equal(diagnosis.diagnosticFor(s).gsm,'ONLINE');assert.equal(diagnosis.diagnosticFor(s).satellites,'7 satélites');
  assert.equal(complete(repair(scan(fault))).phase,'finish');
 }
});

test('Um caso sem falha aceita aguardar e preserva o tempo adquirido; corrigir um problema inexistente demite',()=>{
 let s=scan('none');assert.equal(s.phase,'platform');assert.equal(s.waitMs,6000);assert.equal(act(s,'command','position'),s);
 s=reviewed(act(s,'open-diagnosis'));assert.equal(diagnosis.diagnosticFor(s).correct,'wait');assert.equal(act(s,'resolve-diagnosis','power').phase,'failed');
 s=act(s,'resolve-diagnosis','wait');assert.equal(s.phase,'platform');assert.equal(s.waitMs,6000);s=core.advanceActivation(s,s.positionDelay-6000);assert.equal(s.phase,'location');assert.equal(s.gpsReady,true);
 assert.equal(core.advanceActivation(act(platform(cases.none),'command','position'),core.POSITION_DELAY).phase,'location');
});

test('Os cenários possuem evidências distintas e uma única conduta correta em posições variadas',()=>{
 const positions=new Set();
 for(const [fault,caseId] of Object.entries(cases)){
  const s=core.createActivation(caseId),evidence=diagnosis.diagnosticFor(s),record=evidence.sources.record.rows;
  assert.equal(evidence.actions.filter(a=>a.id===evidence.correct).length,1);assert.deepEqual(evidence.actions,diagnosis.diagnosticFor({...s,elapsedMs:120000}).actions);
  assert.equal(record.find(([label])=>label==='IMEI da etiqueta')[1]===record.find(([label])=>label==='IMEI do cadastro')[1],fault!=='identity');
  assert.equal(evidence.external==='0,0 V',fault==='power');assert.equal(evidence.satellites==='0 satélites',fault==='signal');
 }
 for(let i=0;i<50;i++){const e=diagnosis.diagnosticFor(core.createActivation('position-'+i));positions.add(e.actions.findIndex(a=>a.id===e.correct));}assert.equal(positions.size,4);
});

test('Retomada preserva o quadro aberto, as fontes lidas, a correção em curso e a espera após o novo comando',()=>{
 for(const fault of ['identity','power','signal']){
  let s=act(scan(fault),'inspect-diagnostic','report');let restored=core.restoreActivation(JSON.parse(JSON.stringify(s)),s.caseId);assert.deepEqual(restored,s);
  s=act(reviewed(s),'resolve-diagnosis',fault);s=core.advanceActivation(s,1200);restored=core.restoreActivation(JSON.parse(JSON.stringify(s)),s.caseId);assert.deepEqual(restored,s);
  s=core.advanceActivation(restored,diagnosis.DIAGNOSIS_REPAIR_MS-1200);s=act(s,'command','position');s=core.advanceActivation(s,7000);restored=core.restoreActivation(JSON.parse(JSON.stringify(s)),s.caseId);assert.deepEqual(restored,s);assert.equal(core.advanceActivation(restored,s.positionDelay-7000).phase,'location');
  assert.equal(core.restoreActivation({...s,diagnosis:{...s.diagnosis,resolved:true,action:null}},s.caseId),null);
 }
 const s=scan('power');assert.equal(core.restoreActivation({...s,diagnosis:{...s.diagnosis,reviewed:['record','record']}},s.caseId),null);assert.equal(core.restoreActivation({...s,phase:'location',gpsReady:true,waitMs:s.positionDelay},s.caseId),null);
});

test('Saves anteriores de ativação mantêm a espera original e não recebem uma falha retroativa',()=>{
 for(const version of [1,2]){
  let raw=act(platform(cases.signal),'command','position');raw={...raw,version,diagnosis:undefined,waitMs:7000};if(version===1)raw.checks=undefined;
  const s=core.restoreActivation(raw,raw.caseId);assert.ok(s);assert.equal(s.diagnosis.legacy,true);assert.equal(diagnosis.diagnosisFault(s),'none');assert.equal(s.waitMs,7000);assert.equal(core.advanceActivation(s,s.positionDelay-7000).phase,'location');
  assert.ok(core.restoreActivation(JSON.parse(JSON.stringify(s)),s.caseId));
 }
});

const html=await readFile(new URL('../dist/activation.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../dist/activation.mjs',import.meta.url),'utf8')).replace(/^import[^\n]*\n/gm,'').replace(/tell\('ready'\);if\(parent===window\)initialize\([^\n]+\);/,"initialize(window.testPayload);");
function fixture(t,fault,saved=scan(fault)){
 const dom=new JSDOM(html,{url:'https://game.test/activation.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;let clock=0;
 t.after(()=>w.close());w.scrollTo=()=>{};w.performance.now=()=>clock;installShift(w);w.testShuffle=shuffleOptions;w.testCore=core;w.testDiagnosis=diagnosis;w.testVisuals=visuals;w.testLocations=LOCATIONS;w.testPayload={caseId:cases[fault],mode:'activation-free',difficulty:'normal',prefs:{sound:false}};
 w.localStorage.setItem('andersons-activation-solo-v1',JSON.stringify(saved));
 w.eval(`const shuffleOptions=window.testShuffle;const {${Object.keys(core).join(',')}}=window.testCore;const {${Object.keys(diagnosis).join(',')}}=window.testDiagnosis;const {${Object.keys(visuals).join(',')}}=window.testVisuals;const LOCATIONS=window.testLocations;const {ShiftSession,portrait}=window.testShift;const {installationEffects,reactiveLine}=window.testCareer;\n${source}\nwindow.testTick=tick;`);
 w.step=ms=>{clock+=ms;w.testTick();};return dom;
}
test('Interface exige visitar os quadros, conserva a ordem durante cobranças e pede uma nova posição após confirmar o reparo',t=>{
 for(const fault of ['identity','power','signal']){
  const dom=fixture(t,fault),w=dom.window,d=w.document;assert.equal(d.querySelectorAll('.diagnostic-actions button:disabled').length,4);
  const order=()=>[...d.querySelectorAll('.diagnostic-actions button')].map(b=>b.dataset.id),before=order();
  for(const id of ['report','telemetry'])d.querySelector(`[data-action="inspect-diagnostic"][data-id="${id}"]`).click();assert.deepEqual(order(),before);assert.equal(d.querySelectorAll('.diagnostic-actions button:disabled').length,0);
  for(let i=0;i<5;i++)w.step(1000);assert.deepEqual(order(),before);
  d.querySelector(`[data-action="resolve-diagnosis"][data-id="${fault}"]`).click();assert.ok(d.querySelector('#diagnostic-repair-progress'));assert.match(d.querySelector('.pressure-message').textContent,/AGUARDE A CONFIRMAÇÃO/);
  for(let i=0;i<4;i++)w.step(1000);assert.ok(d.querySelector('.diagnostic-receipt'));assert.equal(d.querySelector('[data-action="send-command"]').disabled,true);assert.equal(d.querySelector('#gps-status').classList.contains('green'),false);
  d.querySelector('[data-action="select-command"][data-id="position"]').click();d.querySelector('[data-action="send-command"]').click();
  for(let i=0;i<18;i++)w.step(1000);assert.ok(d.querySelector('#gps-status.green'));assert.ok(d.querySelector('[data-action="copy-location"]'));
 }
});

test('Um diagnóstico errado mostra as evidências na demissão e o checkpoint devolve os mesmos quadros e alternativas',t=>{
 const dom=fixture(t,'power'),w=dom.window,d=w.document;for(const id of ['report','telemetry'])d.querySelector(`[data-action="inspect-diagnostic"][data-id="${id}"]`).click();
 const before=[...d.querySelectorAll('.diagnostic-actions button')].map(b=>b.textContent);d.querySelector('[data-action="resolve-diagnosis"][data-id="signal"]').click();assert.match(d.querySelector('.fired-dialog').textContent,/12,6 V.*alimentação externa atual/);
 d.querySelector('[data-action="retry-checkpoint"]').click();assert.equal(d.querySelector('#activation-modal').children.length,0);assert.deepEqual([...d.querySelectorAll('.diagnostic-actions button')].map(b=>b.textContent),before);assert.match(d.querySelector('#diagnostic-evidence').textContent,/0,0 V/);assert.equal(d.querySelectorAll('.diagnostic-actions button:disabled').length,0);
 const saved=JSON.parse(w.localStorage.getItem('andersons-activation-solo-v1'));const resumed=fixture(t,'power',saved);assert.match(resumed.window.document.querySelector('#diagnostic-evidence').textContent,/0,0 V/);
});
