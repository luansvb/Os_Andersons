import test from 'node:test';
import assert from 'node:assert/strict';
import {INTRO,FIELDS,validateField,nearestIds,saoPauloDate,addDays,isCorrectBooking,routePosition} from '../dist/core.mjs';

test('As cinco decisões de diálogo têm uma única resposta correta nas posições do roteiro',()=>{
  assert.deepEqual([...INTRO,...FIELDS].map(q=>q.correct),[0,3,2,4,3]);
  for(const question of [...INTRO,...FIELDS]){
    assert.equal(question.options.length,5);
    assert.ok(question.correct>=0&&question.correct<5);
  }
});
test('Cadastro aceita a resposta do cliente e rejeita resposta de outro campo',()=>{
  for(let i=0;i<FIELDS.length;i++){
    assert.equal(validateField(i,FIELDS[i].answer),true);
    assert.equal(validateField(i,FIELDS[(i+1)%FIELDS.length].answer),false);
    assert.equal(validateField(i,''),false);
  }
  assert.equal(validateField(2,'  Para amanhã,   meio dia. '),true);
});
test('Escolha do técnico usa o estado atual e aceita empates exatos',()=>{
  const techs=[{id:1,x:0,y:0},{id:2,x:9,y:0},{id:3,x:12,y:12}];
  assert.deepEqual(nearestIds({x:1,y:0},techs),[1]);
  assert.deepEqual(nearestIds({x:10,y:0},techs),[2]);
  assert.deepEqual(nearestIds({x:4.5,y:0},techs),[1,2]);
  assert.deepEqual(nearestIds({x:0,y:0},[]),[]);
});
test('Amanhã ao meio-dia funciona em viradas de mês, ano e fuso de Brasília',()=>{
  assert.equal(saoPauloDate(new Date('2026-10-24T01:30:00Z')),'2026-10-23');
  assert.equal(addDays('2026-12-31',1),'2027-01-01');
  assert.equal(addDays('2028-02-28',1),'2028-02-29');
  assert.equal(isCorrectBooking('2026-10-23','2026-10-24','12:00'),true);
  assert.equal(isCorrectBooking('2026-10-23','2026-10-23','12:00'),false);
  assert.equal(isCorrectBooking('2026-10-23','2026-10-24','09:00'),false);
});
test('Marcadores percorrem a rota continuamente e retornam ao início',()=>{
  const route=[[0,0],[10,0],[10,10],[0,10]];
  assert.deepEqual(routePosition(route,0),{x:0,y:0});
  assert.deepEqual(routePosition(route,5),{x:5,y:0});
  assert.deepEqual(routePosition(route,15),{x:10,y:5});
  assert.deepEqual(routePosition(route,40),{x:0,y:0});
  assert.deepEqual(routePosition(route,45),{x:5,y:0});
});
