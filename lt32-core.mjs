// LT32 PRO v.04-082025, manual fornecido pelo autor: páginas 8–10.
// Os pontos do veículo são fictícios. A proibição do painel é uma regra do jogo.
import {shuffleOptions} from './option-order.mjs?v=1.1.2';
export const LT32_VERSION=2;
export const LEADS=Object.freeze([
 {id:'positive',name:'Vermelho',color:'#ef6658',function:'Positivo da bateria',role:'positive',detail:'Alimentação de 9–90 VCC. Aqui: +12 V permanente com fusível de 2 A.'},
 {id:'ground',name:'Preto',color:'#91a0ab',function:'Negativo da bateria',role:'ground',detail:'Conectar ao negativo da bateria do veículo.'},
 {id:'ignition',name:'Laranja',color:'#ffa854',function:'Entrada de ignição',role:'ignition',detail:'Pós-chave: sem tensão com a chave desligada e +12 V com a chave ligada nesta missão.'},
 {id:'output',name:'Amarelo',color:'#f5d85e',function:'Saída negativa',role:'relay',detail:'Saída GND de bloqueio. No diagrama do manual: terminal 86 do relé; 85 já recebe positivo.'}
]);
export const LOCATIONS=Object.freeze([
 {id:'dashboard',name:'Painel do veículo',label:'A',x:450,y:324,safe:false,reason:'A Cat avisou: é proibido instalar no painel.'},
 {id:'engine',name:'Compartimento do motor',label:'B',x:286,y:335,safe:false,reason:'Esse ponto tem cobertura metálica e calor. O local não atende à ordem de serviço.'},
 {id:'rear-side',name:'Lateral plástica do porta-malas',label:'C',x:846,y:420,safe:true,trim:'Acabamento lateral do porta-malas'},
 {id:'rear-trim',name:'Acabamento lateral traseiro',label:'D',x:674,y:430,safe:true,trim:'Acabamento lateral traseiro'},
 {id:'visible',name:'Sobre o piso do porta-malas',label:'E',x:826,y:299,safe:false,reason:'O rastreador ficou exposto. O cliente pediu uma instalação discreta.'}
]);
export const ROLE_INFO={
 positive:{label:'Positivo da bateria (+12 V permanente)',off:'12,6 V',on:'12,6 V',note:'Alimentação permanente protegida por fusível de 2 A.'},
 ground:{label:'Negativo da bateria',off:'0 V',on:'0 V',note:'Continuidade com o negativo da bateria.'},
 ignition:{label:'Ignição (pós-chave)',off:'0 V',on:'12,6 V',note:'Só recebe tensão quando a chave está ligada.'},
 relay:{label:'Terminal 86 do relé de bloqueio',off:'Circuito do relé',on:'Circuito do relé',note:'Borne 86 preparado para a saída negativa. O 85 já está no positivo.'},
 light:{label:'Luz de posição (lanterna)',off:'0 V',on:'0 V',note:'Recebe 12 V apenas quando as lanternas são acesas.'},
 radio:{label:'Alto-falante do rádio',off:'Sinal de áudio',on:'Sinal de áudio',note:'Fio de alto-falante. Não pertence a esta instalação.'},
 sensor:{label:'Sensor de temperatura do motor',off:'0,5 V',on:'2,4 V',note:'Sinal variável de sensor. Não é pós-chave.'},
 network:{label:'Rede de dados CAN',off:'2,5 V',on:'2,5 V',note:'Linha de dados. Não pertence ao chicote de alimentação.'},
 headlight:{label:'Farol baixo',off:'0 V',on:'0 V',note:'Alimentação do farol baixo. Só recebe tensão quando o farol é aceso.'},
 brake:{label:'Luz de freio',off:'0 V',on:'0 V',note:'Recebe tensão ao pisar no freio. Não é alimentação permanente.'},
 horn:{label:'Buzina',off:'0 V',on:'0 V',note:'Circuito acionado pelo botão da buzina. Não é ignição.'},
 defrost:{label:'Desembaçador traseiro',off:'0 V',on:'0 V',note:'Circuito do vidro traseiro. Não pertence à montagem do rastreador.'}
};
export function random(seed){let value=seed>>>0;return()=>{value=(Math.imul(1664525,value)+1013904223)>>>0;return value/4294967296;};}
export function hashCase(value){let n=2166136261;for(const c of String(value)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export const locationsFor=state=>shuffleOptions(LOCATIONS,state.seed??hashCase(state.caseId),'lt32.locations').map((place,i)=>({...place,label:String.fromCharCode(65+i)}));
export function installationLayout(state){
 const seed=state.seed??hashCase(state.caseId);
 return {origins:shuffleOptions(Object.keys(ROLE_INFO),seed,'lt32.origins'),wires:shuffleOptions(state.wires||[],seed,'lt32.ends'),leads:shuffleOptions(LEADS,seed,'lt32.leads'),locations:locationsFor(state),parts:shuffleOptions(['trim','hood','door','trunk'],seed,'lt32.parts')};
}
function shuffled(values,rng){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeWires(seed,count=12){const rng=random(seed),roles=shuffled(Object.keys(ROLE_INFO).slice(0,count),rng),colors=shuffled(['#8fa7b1','#df8867','#e6c781','#79ac98','#b690b0','#d5d7c4','#71a5b3','#c5b981','#bc8a94','#94b366','#bb9d6b','#829ac7'].slice(0,count),rng);return roles.map((role,i)=>({id:'wire-'+i,letter:String.fromCharCode(65+i),role,color:colors[i],bend:Math.round(rng()*210)-105,root:Math.floor(rng()*roles.length)}));}
export function inspectWire(state,id){const wire=state.wires.find(w=>w.id===id);return wire?{...wire,...ROLE_INFO[wire.role]}:null;}
export function createInstallation(caseId,seed=hashCase(caseId)){return {version:LT32_VERSION,caseId,seed,phase:'location',location:null,wires:makeWires(seed),connections:{},selected:null,antennaUp:false,secured:false,tidy:false,signalChecked:false,hidden:false,openParts:['trim','hood','door','trunk'],failure:null};}
export function failed(state,reason){return {...state,phase:'explosion',selected:null,failure:reason};}
export function applyAction(previous,action){
 if(['explosion','success'].includes(previous.phase))return previous;
 const state=structuredClone(previous);
 if(action.type==='location'&&state.phase==='location'){
  const place=LOCATIONS.find(p=>p.id===action.id);if(!place)return previous;
  if(!place.safe)return failed(state,place.reason);
  state.location=place.id;state.phase='wiring';return state;
 }
 if(action.type==='select-wire'&&state.phase==='wiring'){
  if(state.wires.some(w=>w.id===action.id)&&!Object.values(state.connections).includes(action.id))state.selected=action.id;return state;
 }
 if(action.type==='connect'&&state.phase==='wiring'){
  const lead=LEADS.find(l=>l.id===action.id),wire=state.wires.find(w=>w.id===state.selected);
  if(!lead||!wire||state.connections[lead.id])return previous;
  if(wire.role!==lead.role)return failed(state,`O cabo ${wire.letter} (${ROLE_INFO[wire.role].label.toLowerCase()}) foi ligado ao fio ${lead.name.toLowerCase()} do LT-32 PRO. Essa ligação está errada.`);
  state.connections[lead.id]=wire.id;state.selected=null;if(Object.keys(state.connections).length===LEADS.length)state.phase='hiding';return state;
 }
 if(action.type==='tidy'&&state.phase==='hiding'){state.tidy=true;return state;}
 if(action.type==='signal-check'&&state.phase==='hiding'){state.signalChecked=true;return state;}
 if(action.type==='flip'&&state.phase==='hiding'){state.antennaUp=!state.antennaUp;return state;}
 if(action.type==='secure'&&state.phase==='hiding'){state.secured=!state.secured;return state;}
 if(action.type==='hide'&&state.phase==='hiding'){
  if(action.id!==state.location)return failed(state,'Você tentou esconder o aparelho fora do ponto que preparou.');
  if(!state.antennaUp)return failed(state,'A face da antena sem adesivo ficou para baixo. Leia a orientação antes de guardar o rastreador.');
  if(!state.secured)return failed(state,'O rastreador e as emendas ficaram soltos. A instalação precisava ser fixada e isolada.');
  state.hidden=true;state.phase='closing';return state;
 }
 if(action.type==='close'&&state.phase==='closing'){
  if(!state.openParts.includes(action.id))return previous;
  if(action.id!=='trim'&&state.openParts.includes('trim'))return failed(state,'Você fechou o veículo antes de recolocar o acabamento da instalação. Ficou tudo aberto por dentro!');
  state.openParts=state.openParts.filter(p=>p!==action.id);return state;
 }
 if(action.type==='deliver'&&state.phase==='closing'){
  if(state.openParts.length)return failed(state,'Ainda havia peças abertas. Não dá para aprovar a instalação desse jeito!');
  state.phase='success';return state;
 }
 return previous;
}
export function restoreInstallation(raw,caseId){
 try{
  if(!raw||![1,LT32_VERSION].includes(raw.version)||raw.caseId!==caseId||!Number.isInteger(raw.seed)||!['location','wiring','hiding','closing','success'].includes(raw.phase))return null;
  const state=createInstallation(caseId,raw.seed),place=LOCATIONS.find(p=>p.id===raw.location);
  if(raw.phase!=='location'&&!place?.safe)return null;
  state.location=place?.id||null;
  if(!raw.connections||typeof raw.connections!=='object')return null;
  const savedWires=raw.version===1?makeWires(raw.seed,8):state.wires;
  for(const [leadId,id]of Object.entries(raw.connections)){const lead=LEADS.find(l=>l.id===leadId),wire=savedWires.find(w=>w.id===id);if(!lead||!wire||wire.role!==lead.role)return null;state.connections[leadId]=state.wires.find(w=>w.role===wire.role).id;}
  const count=Object.keys(state.connections).length;
  if(['hiding','closing','success'].includes(raw.phase)&&count!==4)return null;
  if(raw.phase==='wiring'&&count===4)return null;
  state.phase=raw.phase;state.antennaUp=!!raw.antennaUp;state.secured=!!raw.secured;state.tidy=!!raw.tidy;state.signalChecked=!!raw.signalChecked;state.hidden=!!raw.hidden;
  if(!Array.isArray(raw.openParts)||raw.openParts.some(p=>!['trim','hood','door','trunk'].includes(p)))return null;
  state.openParts=[...new Set(raw.openParts)];
  if(['closing','success'].includes(state.phase)&&(!state.hidden||!state.secured||!state.antennaUp))return null;
  if(state.phase==='success'&&state.openParts.length)return null;
  return state;
 }catch{return null;}
}
