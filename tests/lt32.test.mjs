import test from 'node:test';
import assert from 'node:assert/strict';
import {LEADS,LOCATIONS,createInstallation,applyAction,makeWires,restoreInstallation,ROLE_INFO} from '../dist/lt32-core.mjs';
const act=(s,type,id)=>applyAction(s,{type,id});
function wired(seed=123){let s=act(createInstallation('case',seed),'location','rear-side');for(const lead of LEADS){s=act(s,'select-wire',s.wires.find(w=>w.role===lead.role).id);s=act(s,'connect',lead.id);}return s;}
function hidden(){let s=wired();s=act(s,'flip');s=act(s,'secure');return act(s,'hide',s.location);}
test('LT-32 PRO usa cores e funções do manual, com amarelo na saída negativa do relé 86',()=>{
 assert.deepEqual(LEADS.map(l=>[l.name,l.role]),[['Vermelho','positive'],['Preto','ground'],['Laranja','ignition'],['Amarelo','relay']]);assert.match(LEADS[3].detail,/86/);
});
test('Painel e pontos inadequados são demissão; ambos os pontos plásticos permitem continuar',()=>{
 for(const p of LOCATIONS){const s=act(createInstallation('case'),'location',p.id);assert.equal(s.phase,p.safe?'wiring':'explosion');if(!p.safe)assert.ok(s.failure);}
});
test('Emaranhado muda com a semente e inclui doze funções distintas',()=>{
 assert.deepEqual(makeWires(123),makeWires(123));assert.notDeepEqual(makeWires(123),makeWires(124));assert.equal(new Set(makeWires(123).map(w=>w.role)).size,12);
});
test('Cada terminal aceita somente seu circuito; todos os cabos errados causam explosão',()=>{
 for(const lead of LEADS){for(const source of makeWires(891)){
  let s=act(createInstallation('case',891),'location','rear-trim');s=act(s,'select-wire',source.id);s=act(s,'connect',lead.id);assert.equal(s.phase,source.role===lead.role?'wiring':'explosion');
 }}
});
test('Quatro ligações corretas em qualquer ordem liberam a ocultação',()=>{
 let s=act(createInstallation('case',555),'location','rear-side');for(const lead of [...LEADS].reverse()){s=act(s,'select-wire',s.wires.find(w=>w.role===lead.role).id);s=act(s,'connect',lead.id);}assert.equal(s.phase,'hiding');assert.equal(Object.keys(s.connections).length,4);
});
test('Guardar antena invertida, sem fixação ou no ponto errado causa demissão',()=>{
 let s=wired();s=act(s,'secure');assert.equal(act(s,'hide',s.location).phase,'explosion');s=wired();s=act(s,'flip');assert.equal(act(s,'hide',s.location).phase,'explosion');s=act(s,'secure');assert.equal(act(s,'hide','rear-trim').phase,'explosion');assert.equal(act(s,'hide',s.location).phase,'closing');
});
test('Acabamento precisa voltar primeiro; entrega incompleta falha; veículo fechado conclui',()=>{
 let s=hidden();assert.equal(act(s,'close','trunk').phase,'explosion');assert.equal(act(s,'deliver').phase,'explosion');s=act(s,'close','trim');for(const p of ['door','trunk','hood'])s=act(s,'close',p);assert.equal(s.openParts.length,0);assert.equal(act(s,'deliver').phase,'success');
});
test('Save correto retoma; save de outro cliente, danificado ou após explosão não retoma',()=>{
 const s=hidden(),restored=restoreInstallation(JSON.parse(JSON.stringify(s)),'case');assert.equal(restored.phase,'closing');assert.equal(restored.hidden,true);assert.equal(restoreInstallation(s,'other'),null);assert.equal(restoreInstallation({...s,connections:{positive:s.wires.find(w=>w.role==='ground').id}},'case'),null);assert.equal(restoreInstallation(act(s,'deliver'),'case'),null);
});

test('Os cabos usam nomes explícitos; save anterior de oito fios preserva ligações por função',()=>{
 assert.equal(ROLE_INFO.ground.label,'Negativo da bateria');assert.ok(!Object.values(ROLE_INFO).some(v=>/massa/i.test(v.label)));const seed=123,old={...wired(seed),version:1,wires:makeWires(seed,8),connections:{}};for(const lead of LEADS)old.connections[lead.id]=old.wires.find(w=>w.role===lead.role).id;
 const restored=restoreInstallation(old,'case');assert.equal(restored.phase,'hiding');assert.equal(restored.wires.length,12);for(const lead of LEADS)assert.equal(restored.wires.find(w=>w.id===restored.connections[lead.id]).role,lead.role);
});
