// Physical wiring rules for the didactic 12 V bench. No hardware communication.
export const TARGETS=Object.freeze([
 {id:'battery',name:'+12 V permanente',short:'+12 V',description:'Positivo da bateria, protegido por fusível.',accept:['14-1'],color:'#ed5c58'},
 {id:'ground',name:'Negativo / massa',short:'GND',description:'Referência negativa comum do veículo.',accept:['14-8','16-8'],multiple:true,color:'#93a4bb'},
 {id:'ignition',name:'Pós-chave',short:'PÓS-CHAVE',description:'Saída da chave: 0 V desligada e 12 V ligada. DIN4 no padrão Ágile.',accept:['14-5'],color:'#f4d056'},
 {id:'relay',name:'Negativo da bobina do relé',short:'RELÉ · 85',description:'Terminal 85 da bobina; o terminal 86 já recebe +12 V nesta bancada. DOUT comanda pelo negativo.',accept:['14-2','14-9','16-12','16-13'],color:'#ac8bfa'},
 {id:'sensor',name:'Sinal analógico 0–5 V',short:'SENSOR',description:'Saída em tensão de um sensor didático, com negativo comum. Sem conversão automática em litros.',accept:['14-11','14-12','16-6','16-14'],color:'#5ed4dc'},
 {id:'buzzer',name:'Negativo do buzzer',short:'BUZZER −',description:'Buzzer compatível, de baixa corrente, alimentado por +12 V na bancada. DOUT fecha o negativo.',accept:['14-2','14-9','16-12','16-13'],color:'#ed9ac4'},
 {id:'can-h',name:'CAN do veículo · H',short:'CAN-H',description:'Linha alta do mesmo barramento CAN da linha L. A ligação física não configura o veículo.',accept:['14-13','16-15'],color:'#72bf9c'},
 {id:'can-l',name:'CAN do veículo · L',short:'CAN-L',description:'Linha baixa do mesmo barramento CAN da linha H.',accept:['14-6','16-7'],color:'#76a8ee'}
]);
export function createBench(){return {attached:{14:false,16:false},connections:{},powered:false,ignition:false,relay:false,buzzer:false,sensor:2.5};}
export function validateWire(state,key,targetId){
 const target=TARGETS.find(t=>t.id===targetId);
 if(!target)return {ok:false,code:'target',message:'Escolha um borne do painel veicular.'};
 if(!state.attached[Number(key.split('-')[0])])return {ok:false,code:'harness',message:'Encaixe esse chicote no rastreador antes de ligar o fio.'};
 if(state.powered)return {ok:false,code:'powered',message:'Desligue a alimentação da bancada antes de mudar as ligações.'};
 if(!target.accept.includes(key))return {ok:false,code:'mismatch',message:'Essa ligação não combina com '+target.name+'. '+target.description};
 if(state.connections[key])return {ok:false,code:'connected',message:'Esse fio já está conectado. Desconecte-o antes de mudar a ligação.'};
 if(!target.multiple&&Object.values(state.connections).includes(targetId))return {ok:false,code:'occupied',message:'Esse borne já tem um fio. Remova a ligação anterior primeiro.'};
 return {ok:true,code:'ready',message:'Ligação correta: '+target.name+'.'};
}
export function connectWire(state,key,targetId){const result=validateWire(state,key,targetId);if(result.ok)state.connections[key]=targetId;return result;}
export function disconnectWire(state,key){
 if(state.powered)return {ok:false,code:'powered',message:'Desligue a alimentação antes de desconectar.'};
 delete state.connections[key];return {ok:true,message:'Fio desconectado.'};
}
export function setHarness(state,connector,attached){
 if(![14,16].includes(connector))return {ok:false,message:'Chicote inválido.'};
 if(state.powered)return {ok:false,code:'powered',message:'Desligue a bancada antes de encaixar ou retirar o chicote.'};
 state.attached[connector]=attached;
 if(!attached)for(const key of Object.keys(state.connections))if(key.startsWith(connector+'-'))delete state.connections[key];
 return {ok:true,message:attached?'Chicote de '+connector+' pinos encaixado. Agora puxe uma ponta até o painel.':'Chicote retirado; as ligações dele foram removidas.'};
}
export function readBench(state){
 const base=state.connections['14-1']==='battery'&&state.connections['14-8']==='ground';
 const powered=state.powered&&base&&state.attached[14];
 const input=target=>Object.entries(state.connections).find(([,id])=>id===target)?.[0];
 const h=input('can-h'),l=input('can-l');
 return {base,powered,blocked:!!(powered&&state.blocked&&input('relay')),ignition:powered&&state.ignition&&state.connections['14-5']==='ignition',relay:powered&&state.relay&&!!input('relay'),buzzer:powered&&state.buzzer&&!!input('buzzer'),analog:powered&&input('sensor')?state.sensor:null,canPair:!!h&&!!l&&h.split('-')[0]===l.split('-')[0],canMixed:!!h&&!!l&&h.split('-')[0]!==l.split('-')[0],basicCount:['14-1','14-8','14-5'].filter((key,i)=>state.connections[key]===['battery','ground','ignition'][i]).length};
}
export function setPower(state,powered){
 if(powered&&!readBench(state).base)return {ok:false,message:'Ligue +BAT (14/1) ao +12 V e GND (14/8) à massa para alimentar esta bancada.'};
 if(powered&&!state.attached[14])return {ok:false,message:'Encaixe o chicote de 14 pinos primeiro.'};
 state.powered=powered;return {ok:true,message:powered?'Bancada energizada. Experimente a chave e os comandos das saídas.':'Bancada desligada. Você pode alterar as ligações.'};
}

