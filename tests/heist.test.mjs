import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeist,applyHeistAction as action,advanceHeist as advance,findPath,collides,nearCar,TARGET,SPAWN,BUILDINGS,restoreHeist,defaultView} from '../dist/heist-core.mjs';
const fresh=()=>createHeist('heist-case');
function atCar(){let s=action(fresh(),{type:'begin'});return {...s,actor:{...s.actor,x:TARGET.x-62,y:TARGET.y}};}
function wiring(){return action(action(atCar(),{type:'enter',view:defaultView()}),{type:'open-panel'});}
function connected(){let s=wiring();for(const socket of s.puzzle.sockets){const wire=s.puzzle.wires.find(w=>w.token===socket.token);s=action(s,{type:'select-wire',id:wire.id});s=action(s,{type:'connect',id:socket.id});}return s;}
function driving(){let s=action(connected(),{type:'start-engine'});for(let i=0;i<30;i++)s=advance(s,{},.05);return s;}
test('Anderson começa a pé e só pode entrar perto do Ford Ka',()=>{
 let s=fresh();assert.equal(s.phase,'intro');s=action(s,{type:'begin'});assert.equal(s.phase,'foot');assert.equal(action(s,{type:'enter'}),s);assert.equal(nearCar(atCar()),true);assert.equal(action(atCar(),{type:'enter'}).phase,'interior');assert.equal(action(s,{type:'open-panel'}),s);
});
test('Cidade tem colisões e caminho por ruas até o carro sem atravessar prédios',()=>{
 const b=BUILDINGS[5];assert.equal(collides(b.x+20,b.y+20),true);assert.equal(collides(SPAWN.x,SPAWN.y),false);const path=findPath(SPAWN,TARGET);assert.ok(path.length>10);assert.ok(path.every(p=>!collides(p.x,p.y,15)));let s=action(action(fresh(),{type:'begin'}),{type:'walk-to',...TARGET});for(let i=0;i<1500&&!nearCar(s);i++)s=advance(s,{},.05);assert.equal(nearCar(s),true);assert.equal(s.discovered,true);assert.equal(s.phase,'foot');
});
test('Movimento manual respeita obstáculos, diagonal e limites da cidade',()=>{
 let s=action(fresh(),{type:'begin'});for(let i=0;i<500;i++)s=advance(s,{x:-1,y:0},.05);assert.ok(s.actor.x>=12);assert.equal(s.phase,'foot');const b=BUILDINGS[10];s={...s,actor:{x:b.x-20,y:b.y+70,angle:0}};for(let i=0;i<20;i++)s=advance(s,{x:1,y:0},.05);assert.ok(s.actor.x+12<=b.x);assert.equal(collides(s.actor.x,s.actor.y),false);
});
test('Partida arcade contém 12 símbolos distintos e varia por caso',()=>{
 const s=fresh();assert.equal(s.puzzle.wires.length,12);assert.equal(new Set(s.puzzle.wires.map(w=>w.token)).size,12);assert.deepEqual(s.puzzle,fresh().puzzle);assert.notDeepEqual(s.puzzle,createHeist('other-case').puzzle);assert.equal(s.puzzle.sockets.length,3);
});
test('Examinar é seguro; todo símbolo errado dispara alarme e polícia',()=>{
 const base=wiring();for(const socket of base.puzzle.sockets)for(const wire of base.puzzle.wires){let s=action(base,{type:'select-wire',id:wire.id});assert.equal(s.phase,'wiring');s=action(s,{type:'connect',id:socket.id});assert.equal(s.phase,wire.token===socket.token?'wiring':'caught');if(s.phase==='caught'){for(let i=0;i<60;i++)s=advance(s,{},.05);assert.equal(s.phase,'gameover');}}
});
test('Dar partida antes de concluir falha; três ligações corretas permitem dirigir',()=>{
 assert.equal(action(wiring(),{type:'start-engine'}).phase,'caught');const s=connected();assert.equal(Object.keys(s.connections).length,3);assert.equal(action(s,{type:'start-engine'}).phase,'starting');assert.equal(driving().phase,'drive');
});
test('Setas dirigem o Ford Ka na direção da tela, com freio separado e saída de cena',()=>{
 for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const [x,y]of [[0,-1],[0,1],[-1,0],[1,0]]){
  const s={...driving(),car:{...driving().car,angle,speed:-80}},n=advance(s,{x,y},.05);assert.equal(Math.sign(n.car.x-s.car.x),x);assert.equal(Math.sign(n.car.y-s.car.y),y);assert.ok(n.car.speed>0);assert.equal(n.car.angle,Math.atan2(y,x));
 }
 let s=advance(driving(),{x:1},.05),stopped=advance(s,{brake:true,x:1},.05);assert.equal(stopped.car.x,s.car.x);assert.equal(stopped.car.speed,0);assert.equal(advance(s,{},.05).car.x,s.car.x);const slow=advance(driving(),{x:1},.05),fast=advance(driving(),{x:1,boost:true},.05);assert.ok(fast.car.x>slow.car.x);
 s=driving();for(let i=0;i<300&&s.phase==='drive';i++)s=advance(s,{x:1},.05);assert.equal(s.phase,'finish');assert.equal(s.car.speed,0);
});
test('Retomada preserva puzzle, cidade e direção; rejeita save de outro caso ou ligações inválidas',()=>{
 for(const s of [fresh(),atCar(),wiring(),connected(),driving()]){const resumed=restoreHeist(JSON.parse(JSON.stringify(s)),'heist-case');assert.ok(resumed);assert.equal(resumed.phase,s.phase);assert.deepEqual(resumed.connections,s.connections);assert.equal(resumed.car.x,s.car.x);}
 const s=wiring();assert.equal(restoreHeist(s,'other'),null);assert.equal(restoreHeist({...s,phase:'drive'},'heist-case'),null);assert.equal(restoreHeist({...s,connections:{'socket-0':'invalid'}},'heist-case'),null);assert.equal(restoreHeist(action(s,{type:'start-engine'}),'heist-case'),null);
});
