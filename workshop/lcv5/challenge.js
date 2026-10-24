import {TARGETS,createBench} from './wiring.js';
const base=[['14-1','battery'],['14-8','ground'],['14-5','ignition']];
export const MISSIONS=Object.freeze([
 {id:'basic',title:'Alimentação e pós-chave',harnesses:[14],brief:'Faça o rastreador reconhecer a alimentação do veículo e a posição da chave.',instructions:['Leve +BAT ao positivo permanente de 12 V e GND à massa.','No padrão Ágile desta missão, DIN4 recebe o pós-chave positivo.','Encaixe o chicote, faça as três ligações e teste a partida.'],required:base},
 {id:'relay',title:'Relé de bloqueio',harnesses:[14],brief:'Instale a alimentação, a leitura da chave e o acionamento do relé de bloqueio.',instructions:['Mantenha +BAT no positivo permanente, GND na massa e DIN4 no pós-chave.','Use DOUT1 para fechar o negativo da bobina no terminal 85. O terminal 86 já recebe +12 V no veículo do jogo.','A saída comanda a bobina; não deve alimentar o motor diretamente.'],required:[...base,['14-2','relay']]},
 {id:'buzzer',title:'Aviso sonoro',harnesses:[14],brief:'Instale um buzzer compatível, comandado pela saída digital do rastreador.',instructions:['Alimente o LCV5 com +BAT e GND e use DIN4 para o pós-chave.','Nesta missão, use DOUT2 no negativo do buzzer. O positivo do acessório já está alimentado no painel.','Depois da partida, o comando de buzzer fica disponível na leitura de sensores.'],required:[...base,['14-9','buzzer']]},
 {id:'analog',title:'Sensor analógico · dois chicotes',harnesses:[14,16],brief:'Alimente o LCV5 e conecte o sinal em tensão de um sensor usando o segundo chicote.',instructions:['Use +BAT, GND e DIN4 do chicote de 14 pinos para alimentação e pós-chave.','Nesta missão, AIN3 recebe o sinal do sensor de 0 a 5 V. A referência negativa do sensor já é comum à massa.','AIN3 está no chicote de 16 pinos: os dois chicotes devem ficar encaixados.'],required:[...base,['16-14','sensor']]},
 {id:'can1',title:'Rede CAN1 · dois chicotes',harnesses:[14,16],brief:'Faça a alimentação básica e conecte o par físico CAN1 ao veículo.',instructions:['No chicote de 14 pinos, use +BAT, GND e DIN4 para alimentação e pós-chave.','No chicote de 16 pinos, conecte CAN1-H à linha alta e CAN1-L à linha baixa.','Use as duas linhas do mesmo barramento. A missão confere a ligação física, sem aprovar a configuração real do veículo.'],required:[...base,['16-15','can-h'],['16-7','can-l']]},
 {id:'complete',title:'Instalação completa · dois chicotes',harnesses:[14,16],brief:'Monte alimentação, ignição, relé, buzzer, sensor e CAN1 em uma única instalação.',instructions:['Use +BAT, GND e DIN4 para alimentação e pós-chave.','DOUT3 vai ao negativo da bobina do relé; DOUT2 vai ao negativo do buzzer.','AIN3 recebe o sensor de 0–5 V. Complete CAN1-H e CAN1-L nas linhas H e L do veículo.'],required:[...base,['16-12','relay'],['14-9','buzzer'],['16-14','sensor'],['16-15','can-h'],['16-7','can-l']]}
]);
export function createChallenge(mission='basic'){return {...createBench(),mission,phase:'wiring',attempted:false,looseEnds:{},blocked:false,lastFault:null};}
export function repairChallenge(state){state.phase='wiring';state.powered=false;state.ignition=false;state.relay=false;state.buzzer=false;state.blocked=false;return state.lastFault;}
export function relocateWire(state,key,targetId,position){
 if(state.phase!=='wiring'||state.powered)return {ok:false,message:'Desligue ou repare o veículo antes de mover os cabos.'};
 const [connector,pin]=key.split('-').map(Number);
 if(![14,16].includes(connector)||!Number.isInteger(pin)||pin<1||pin>connector||!state.attached[connector])return {ok:false,message:'Encaixe o chicote correspondente a esse fio.'};
 if(!targetId&&(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite)))return {ok:false,message:'Posição de cabo inválida.'};
 const previous=state.connections[key];delete state.connections[key];
 if(targetId){const result=placeWire(state,key,targetId);if(!result.ok&&previous)state.connections[key]=previous;return result;}
 state.looseEnds[key]=[Math.max(-9,Math.min(8,position[0])),Math.max(.22,Math.min(4,position[1])),Math.max(-4,Math.min(8,position[2]))];
 return {ok:true,message:'Cabo solto nessa posição. Você pode pegá-lo novamente quando quiser.'};
}
export function missionFor(state){if(state.customMission)return state.customMission;return MISSIONS.find(m=>m.id===state.mission)||MISSIONS[0];}
export function placeWire(state,key,targetId){
 if(state.phase==='exploded')return {ok:false,code:'destroyed',message:'Repare o veículo para tentar novamente.'};
 if(state.phase==='running'||state.powered)return {ok:false,code:'powered',message:'Desligue o veículo antes de mudar os cabos.'};
 if(!state.attached[Number(key.split('-')[0])])return {ok:false,code:'harness',message:'Encaixe esse chicote antes de usar o fio.'};
 const target=TARGETS.find(t=>t.id===targetId);if(!target)return {ok:false,code:'target',message:'Escolha a ponta de um cabo do veículo.'};
 if(state.connections[key])return {ok:false,code:'connected',message:'Esse fio já está ligado. Desconecte-o antes de mudar a ponta.'};
 if(!target.multiple&&Object.values(state.connections).includes(targetId))return {ok:false,code:'occupied',message:'Essa ponta já tem um fio. Desconecte o anterior para trocar.'};
 state.connections[key]=targetId;
 return {ok:true,message:'Cabo conectado. A instalação será avaliada quando você der a partida.'};
}
export function assessChallenge(state){
 if(state.phase==='exploded')return {outcome:'locked',message:'Repare o veículo para começar outra tentativa.'};
 const mission=missionFor(state);
 for(const [key,id] of Object.entries(state.connections)){
  const target=TARGETS.find(t=>t.id===id);
  if(!target?.accept.includes(key))return {outcome:'explode',key,target:id,message:`O fio ${key.replace('-',' / ')} não deve ser ligado a ${target?.name||'essa ponta'}. ${target?.description||''}`};
 }
 for(const [key,id] of mission.required){
  const other=Object.entries(state.connections).find(([k,t])=>t===id&&k!==key);
  // A shared ground may also have the accessory reference; the base 14/8 remains required.
  if(!state.connections[key]&&other&&id!=='ground')return {outcome:'explode',key:other[0],target:id,message:`O circuito em ${TARGETS.find(t=>t.id===id).name} usa outro canal. Releia a indicação desta missão: ela exige o fio ${key.replace('-',' / ')}.`};
 }
 const missingHarness=mission.harnesses.find(c=>!state.attached[c]);
 if(missingHarness)return {outcome:'incomplete',message:`Encaixe o chicote de ${missingHarness} pinos para esta missão.`};
 const missing=mission.required.filter(([key,id])=>state.connections[key]!==id);
 if(missing.length)return {outcome:'incomplete',message:`Ainda faltam ${missing.length} ligação(ões) da missão. Termine a montagem antes de dar a partida.`};
 return {outcome:'success',message:'Instalação conferida! O veículo ligou e os sensores do jogo estão disponíveis.'};
}
export function startChallenge(state){
 const result=assessChallenge(state);state.attempted=true;
 if(result.outcome==='explode'){state.phase='exploded';state.powered=false;state.ignition=false;state.relay=false;state.buzzer=false;state.blocked=false;state.lastFault=result.key;}
 if(result.outcome==='success'){state.phase='running';state.powered=true;state.ignition=true;state.lastFault=null;}
 return result;
}
export function stopChallenge(state){if(state.phase==='exploded')return;state.phase='wiring';state.powered=false;state.ignition=false;}

