import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createInstallerGame} from '../workshop/lcv5/story.js';
import {serviceMission} from '../workshop/lcv5/story-model.js';
import {createChallenge,startChallenge,relocateWire} from '../workshop/lcv5/challenge.js';
import {setHarness,readBench} from '../workshop/lcv5/wiring.js';
import {createCommandSimulation} from '../workshop/lcv5/commands.js';
const template=await readFile(new URL('../workshop/lcv5/template.html',import.meta.url),'utf8');
function fixture(){
 const dom=new JSDOM(template,{url:'https://game.test/workshop.html',pretendToBeVisual:true});
 let state=createChallenge(),history=[],mission=null;const phases=[];
 const bridge={read:()=>({...readBench(state),phase:state.phase}),commands:()=>history,tick(){},resumeWorkshop(){},enterWorkshop(m){mission=m;state=createChallenge(m?'service':'basic');if(m)state.customMission=m;},dock(){},undock(){},startDrive(){},cruiseSpeed:()=>45,updateDrive(){}};
 const game=createInstallerGame({document:dom.window.document,autoLoop:false,painterFactory:()=>({draw(){},cinematic(){}}),bridge,onProgress:s=>phases.push(s.phase),onExit:()=>{}});
 return {dom,game,bridge,phases,get state(){return state;},get mission(){return mission;},set history(v){history=v;},close(){game.destroy();dom.window.close();}};
}
test('O agendamento entra na chegada e na recepção sem repetir o WhatsApp antigo',()=>{
 const f=fixture();f.game.startScheduled();assert.equal(f.game.inspect().phase,'arrival');for(let i=0;i<90;i++)f.game.tick(.05);assert.equal(f.game.inspect().phase,'config');assert.equal(f.phases.includes('chat'),false);f.game.startScheduled();f.dom.window.document.getElementById('story-skip-arrival').click();assert.equal(f.game.inspect().phase,'config');f.close();
});
test('A instalação reaproveita as regras do LCV5 para todas as 16 combinações',()=>{
 for(let mask=0;mask<16;mask++){
  const flags=Object.fromEntries(['block','buzzer','analog','can'].map((key,i)=>[key,!!(mask&(1<<i))]));const mission=serviceMission(flags),state=createChallenge('service');state.customMission=mission;
  for(const c of mission.harnesses)setHarness(state,c,true);
  for(const [pin,target] of mission.required)assert.equal(relocateWire(state,pin,target).ok,true);
  assert.equal(startChallenge(state).outcome,'success');
  const r=readBench(state);assert.equal(r.powered,true);assert.equal(r.canPair,flags.can);assert.equal(r.analog!==null,flags.analog);
 }
});
test('Recepção completa exige 8 fios e os dois chicotes antes do teste',()=>{
 const f=fixture();f.game.startScheduled();for(let i=0;i<90;i++)f.game.tick(.05);
 f.dom.window.document.getElementById('service-all').click();f.dom.window.document.getElementById('service-start').click();
 assert.equal(f.game.inspect().phase,'workshop');assert.equal(f.mission.required.length,8);assert.deepEqual(f.mission.harnesses,[14,16]);assert.equal(startChallenge(f.state).outcome,'incomplete');
 for(const c of [14,16])setHarness(f.state,c,true);for(const [pin,target] of f.mission.required)relocateWire(f.state,pin,target);
 assert.equal(startChallenge(f.state).outcome,'success');assert.equal(f.game.installationSucceeded(),true);assert.equal(f.game.inspect().phase,'monitor');f.close();
});
test('Teste de rua só libera a entrega após volta e comando; retomada preserva o percurso',()=>{
 const f=fixture();f.game.startScheduled();for(let i=0;i<90;i++)f.game.tick(.05);f.dom.window.document.getElementById('service-start').click();
 setHarness(f.state,14,true);for(const [pin,target] of f.mission.required)relocateWire(f.state,pin,target);startChallenge(f.state);f.game.installationSucceeded();
 const before=f.game.inspect().distance;f.game.tick(.2);assert.equal(f.game.inspect().distance-before,18);
 for(let i=0;i<850;i++)f.game.tick(.05);
 assert.ok(f.game.inspect().laps>=1);assert.equal(f.dom.window.document.getElementById('story-finish').disabled,true);
 f.history=[{id:'position',status:'accepted'}];for(let i=0;i<6;i++)f.game.tick(.05);assert.equal(f.dom.window.document.getElementById('story-finish').disabled,false);
 const snapshot=f.game.inspect();assert.ok(snapshot.distance>0);assert.equal(f.game.restore(snapshot),true);assert.equal(f.game.inspect().laps,snapshot.laps);assert.equal(f.game.inspect().distance,snapshot.distance);
 f.dom.window.document.getElementById('story-finish').click();assert.equal(f.game.inspect().phase,'finish');f.close();
});
test('Fila de comandos pendentes é retomada e comandos confirmados não são reenviados',()=>{
 const state=createChallenge();setHarness(state,14,true);for(const [pin,target] of serviceMission().required)relocateWire(state,pin,target);startChallenge(state);
 const sim={connected:true,rebootRemaining:0,satellites:12,latitude:0,longitude:0,buffer:12};const first=createCommandSimulation({getState:()=>state,simulation:sim});first.enqueue(['position']);const saved=first.serialize();
 const restored=createCommandSimulation({getState:()=>state,simulation:sim});restored.restore(saved);assert.equal(restored.busy,true);restored.tick(2);assert.equal(restored.history[0].status,'accepted');
 const done=restored.serialize();restored.restore(done);assert.equal(restored.busy,false);assert.equal(restored.history.length,1);
});
test('HTML final contém engine local, identidade e nenhuma configuração do Firebase',async()=>{
 const html=await readFile(new URL('../dist/workshop.html',import.meta.url),'utf8');assert.ok(html.includes('andersons-cat-line'));assert.ok(html.includes('andersons-workshop'));assert.ok(html.includes('three.js'));assert.equal(/\{\{(?:INSTALL_|PHOTOS|LAB_ENGINE)/.test(html),false);assert.equal(/firebaseConfig|apiKey|firebaseapp\.com/.test(html),false);
});
