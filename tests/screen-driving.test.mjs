import test from 'node:test';
import assert from 'node:assert/strict';
import {moveScreenCar,sampleScreenControls,SCREEN_KEYS,tapMotion} from '../dist/screen-driving.mjs';
const car={x:100,y:100,angle:Math.PI,speed:-90};
test('Setas e WASD têm o mesmo sentido; Espaço freia e S move para baixo',()=>{
 for(const [arrow,letter,x,y]of [['ArrowUp','w',0,-1],['ArrowDown','s',0,1],['ArrowLeft','a',-1,0],['ArrowRight','d',1,0]]){
  for(const key of [arrow,letter]){const controls=sampleScreenControls(new Map([[SCREEN_KEYS[key],0]]),new Map());assert.equal(controls.x,x);assert.equal(controls.y,y);assert.equal(controls.brake,false);}
 }
 assert.equal(sampleScreenControls(new Map([[SCREEN_KEYS[' '],0]]),new Map()).brake,true);
});
test('Diagonal não aumenta a velocidade; soltar ou frear para sem movimento residual',()=>{
 const right=moveScreenCar(car,{x:1},.05).car,diagonal=moveScreenCar(car,{x:1,y:-1},.05).car;assert.ok(Math.abs(Math.hypot(right.x-car.x,right.y-car.y)-Math.hypot(diagonal.x-car.x,diagonal.y-car.y))<1e-9);for(const input of [{},{x:1,brake:true}]){const n=moveScreenCar(car,input,.05).car;assert.equal(n.x,car.x);assert.equal(n.y,car.y);assert.equal(n.speed,0);}
});
test('Toque curto continua brevemente pelo relógio normal; uma nova direção prevalece',()=>{
 const tap=tapMotion('left',100,180);assert.ok(tap);let n=sampleScreenControls(new Map(),new Map(),{now:200,tap});assert.equal(n.x,-1);n=sampleScreenControls(new Map(),new Map(),{now:321,tap});assert.equal(n.x,0);n=sampleScreenControls(new Map([['right',0]]),new Map(),{now:200,tap});assert.equal(n.x,1);assert.equal(tapMotion('up',0,500),null);assert.equal(tapMotion('brake',100,150),null);
});
test('Dois dedos combinam direções e o freio prevalece; Turbo exige direção',()=>{
 const pointers=new Map([[1,{direction:'up'}],[2,{direction:'right'}]]);let input=sampleScreenControls(new Map(),pointers);assert.equal(input.x,1);assert.equal(input.y,-1);pointers.set(3,{direction:'brake'});input=sampleScreenControls(new Map(),pointers);assert.equal(moveScreenCar(car,input,.05).car.speed,0);assert.equal(moveScreenCar(car,{boost:true},.05).car.x,car.x);assert.ok(moveScreenCar(car,{x:1,boost:true},.05).car.x>moveScreenCar(car,{x:1},.05).car.x);
});
