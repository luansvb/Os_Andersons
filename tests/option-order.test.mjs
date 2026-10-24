import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {shuffleOptions,choiceOptions} from '../dist/option-order.mjs';
import {INTRO,FIELDS} from '../dist/core.mjs';
import * as lt32 from '../dist/lt32-core.mjs';
import * as car from '../dist/lt32-car.mjs';
import {createActivation,challengeFor,restoreActivation} from '../dist/activation-core.mjs';
import {installShift} from './ui-shift-fixture.mjs';

test('Cada decisão distribui todas as respostas sem duplicar, mantém a identidade correta e não muda ao retomar',()=>{
 for(const [q,question] of [...INTRO,...FIELDS].entries()){
  const positions=new Set(),original=[...question.options];
  for(let run=0;run<60;run++){
   const options=choiceOptions(question.options,'case-'+run,'question-'+q);
   assert.deepEqual(options.map(o=>o.index).sort((a,b)=>a-b),[0,1,2,3,4]);
   assert.equal(options.find(o=>o.index===question.correct).text,question.options[question.correct]);
   assert.deepEqual(options,choiceOptions(question.options,'case-'+run,'question-'+q));
   positions.add(options.findIndex(o=>o.index===question.correct));
  }
  assert.equal(positions.size,5);assert.deepEqual(question.options,original);
 }
 assert.notDeepEqual(shuffleOptions([1,2,3,4,5],'same','first'),shuffleOptions([1,2,3,4,5],'same','second'));
});

test('Instalações variam ambos os lados dos cabos, terminais e letras; saves conservam ligações por função',()=>{
 const seen={origins:new Set(),wires:new Set(),leads:new Set(),places:new Set(),parts:new Set()};
 for(let i=0;i<30;i++){
  let s=lt32.createInstallation('case-'+i),layout=lt32.installationLayout(s);
  assert.equal(new Set(layout.origins).size,12);assert.equal(new Set(layout.wires.map(w=>w.id)).size,12);
  assert.deepEqual(layout.leads.map(l=>l.id).sort(),lt32.LEADS.map(l=>l.id).sort());
  assert.deepEqual(layout.locations.map(l=>l.label),['A','B','C','D','E']);
  seen.origins.add(layout.origins.join());seen.wires.add(layout.wires.map(w=>w.id).join());seen.leads.add(layout.leads.map(l=>l.id).join());seen.places.add(layout.locations.map(l=>l.id).join());seen.parts.add(layout.parts.join());
  s=lt32.applyAction(s,{type:'location',id:'rear-side'});
  const lead=layout.leads[0],wire=layout.wires.find(w=>w.role===lead.role);
  s=lt32.applyAction(lt32.applyAction(s,{type:'select-wire',id:wire.id}),{type:'connect',id:lead.id});
  const restored=lt32.restoreInstallation(JSON.parse(JSON.stringify(s)),s.caseId);
  assert.deepEqual(lt32.installationLayout(restored),layout);assert.equal(restored.connections[lead.id],wire.id);
 }
 for(const set of Object.values(seen))assert.ok(set.size>10);
});

test('Todas as conferências da ativação variam a resposta correta entre as três posições e preservam o save',()=>{
 for(const step of [1,3,9,10,15]){
  const positions=new Set();
  for(let i=0;i<40;i++){
   const s={...createActivation('check-'+i),phase:'maze',mazeStep:step,checks:[1,3,9,10,15].filter(n=>n<step)};
   const check=challengeFor(s);assert.equal(check.choices.filter(c=>c.id===check.correct).length,1);
   assert.deepEqual(check,challengeFor({...s,elapsedMs:90000}));
   assert.deepEqual(check,challengeFor(restoreActivation(JSON.parse(JSON.stringify(s)),s.caseId)));
   positions.add(check.choices.findIndex(c=>c.id===check.correct));
  }
  assert.equal(positions.size,3);
 }
});

const html=await readFile(new URL('../dist/lt32.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../dist/lt32.mjs',import.meta.url),'utf8')).replace(/^import[^\n]*\n/gm,'').replace(/tellParent\('ready'\);if\(parent===window\)initialize\([^\n]+\);/,"initialize(window.testPayload);");
function installationUI(t,caseId){
 const dom=new JSDOM(html,{url:'https://game.test/lt32.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 t.after(()=>w.close());w.scrollTo=()=>{};installShift(w);w.testLT=lt32;w.testArt=car;w.testPayload={caseId,mode:'lt32-free',prefs:{sound:false}};
 w.eval(`const {ShiftSession,portrait}=window.testShift;const {installationSummary}=window.testCareer;const {${Object.keys(lt32).join(',')}}=window.testLT;const {carSvg,trackerSvg}=window.testArt;\n${source}`);
 return dom;
}
test('Desenho e botões da instalação concordam após embaralhar, medir, conectar e fechar o carro',t=>{
 for(const caseId of ['visual-one','visual-two']){
  const dom=installationUI(t,caseId),d=dom.window.document,base=lt32.createInstallation(caseId),layout=lt32.installationLayout(base);
  for(const place of layout.locations){
   assert.equal(d.querySelector(`.location-options [data-id="${place.id}"] b`).textContent,place.label);
   assert.equal(d.querySelector(`.location-hotspot[data-id="${place.id}"] text`).textContent,place.label);
  }
  d.querySelector('.location-options [data-id="rear-side"]').click();
  const ids=()=>[...d.querySelectorAll('.wire-choice')].map(b=>b.dataset.id),before=ids();
  assert.deepEqual(before,layout.wires.map(w=>w.id));
  assert.deepEqual([...d.querySelectorAll('.terminal-choice')].map(b=>b.dataset.id),layout.leads.map(l=>l.id));
  for(const [row,role] of layout.origins.entries()){
   const wire=base.wires.find(w=>w.role===role),label=d.querySelector(`.wire-route[data-id="${wire.id}"] .origin-label`);
   assert.equal(label.textContent,lt32.ROLE_INFO[role].label);assert.equal(Number(label.getAttribute('y')),87+row*55);
  }
  const lead=layout.leads[0],wire=layout.wires.find(w=>w.role===lead.role);
  d.querySelector(`.wire-choice[data-id="${wire.id}"]`).click();assert.deepEqual(ids(),before);
  assert.match(d.querySelector('.probe').textContent,new RegExp(lt32.ROLE_INFO[wire.role].off.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  d.querySelector(`.terminal-choice[data-id="${lead.id}"]`).click();
  const path=d.querySelector('.made-connection');assert.ok(path.getAttribute('d').startsWith('M650 '+(87+layout.wires.findIndex(w=>w.id===wire.id)*55)));
  assert.deepEqual(ids(),before);
  for(const next of layout.leads.slice(1)){const cable=layout.wires.find(w=>w.role===next.role);d.querySelector(`.wire-choice[data-id="${cable.id}"]`).click();d.querySelector(`.terminal-choice[data-id="${next.id}"]`).click();}
  d.querySelector('[data-action="flip"]').click();d.querySelector('[data-action="secure"]').click();d.querySelector('.hide-actions [data-action="hide"]').click();
  assert.deepEqual([...d.querySelectorAll('.closing-actions button')].map(b=>b.dataset.id),layout.parts);
  for(const id of ['trim','hood','door','trunk'])d.querySelector(`.closing-actions [data-id="${id}"]`).click();d.querySelector('[data-action="deliver"]').click();assert.ok(d.querySelector('.success'));
 }
});
