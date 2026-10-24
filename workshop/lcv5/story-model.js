export const FEATURES=[
 {id:'block',name:'Bloqueio do motor',detail:'Relé comandado por DOUT1. Teste bloquear e desbloquear.'},
 {id:'buzzer',name:'Buzzer',detail:'Aviso sonoro por DOUT2. Teste ativar e desativar.'},
 {id:'analog',name:'Sensor analógico',detail:'Sinal de 0–5 V em AIN3, com leitura de nível no painel.'},
 {id:'can',name:'Telemetria CAN1',detail:'Par CAN1-H/L, com rotação e consumo simulados.'}
];
export function greeting(date=new Date()){
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',hourCycle:'h23'}).format(date));
 return hour<12&&hour>=5?'Bom dia':hour<18&&hour>=12?'Boa tarde':'Boa noite';
}
export function serviceMission(features={}){
 const selected=FEATURES.filter(f=>features[f.id]),required=[['14-1','battery'],['14-8','ground'],['14-5','ignition']];
 const instructions=['Alimente o rastreador: +BAT no positivo de 12 V, GND na massa e DIN4 no pós-chave.'];
 if(features.block){required.push(['14-2','relay']);instructions.push('Bloqueio: DOUT1 no negativo da bobina do relé (terminal 85). O terminal 86 já recebe +12 V no jogo.');}
 if(features.buzzer){required.push(['14-9','buzzer']);instructions.push('Buzzer: DOUT2 no negativo do acessório, cujo positivo já está alimentado.');}
 if(features.analog){required.push(['16-14','sensor']);instructions.push('Sensor: AIN3 no sinal de 0–5 V. A referência negativa é comum à massa.');}
 if(features.can){required.push(['16-15','can-h'],['16-7','can-l']);instructions.push('CAN1: conecte H na linha alta e L na linha baixa do mesmo barramento.');}
 return {id:'service',title:selected.length?'Rastreador + '+selected.map(f=>f.name.toLowerCase()).join(' + '):'Só rastreador',harnesses:features.analog||features.can?[14,16]:[14],brief:'Ordem de serviço do cliente. Instale somente as funções escolhidas na recepção.',instructions,required,features:{...features}};
}
export function roadChecks(features,accepted,laps,reading){
 const checks=[{id:'lap',name:'Completar uma volta pela cidade',done:laps>0},{id:'position',name:'Solicitar uma posição pelo comando',done:accepted.has('position')}];
 if(features.block)checks.push({id:'block',name:'Bloquear e desbloquear o veículo',done:accepted.has('block')&&accepted.has('unblock')&&!reading.blocked});
 if(features.buzzer)checks.push({id:'buzzer',name:'Ativar e desativar o buzzer',done:accepted.has('buzzer-on')&&accepted.has('buzzer-off')&&!reading.buzzer});
 if(features.analog)checks.push({id:'analog',name:'Conferir o sinal do sensor instalado',done:reading.analog!==null});
 if(features.can)checks.push({id:'can',name:'Conferir o par CAN e os medidores',done:reading.canPair});
 return checks;
}

