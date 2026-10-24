import {readBench} from './wiring.js';

export const COMMANDS=Object.freeze([
 {id:'clear-buffer',name:'Apagar o buffer',description:'Apaga os registros armazenados no buffer virtual do dispositivo.',category:'Gerenciamento do dispositivo',action:'Configurar'},
 {id:'buzzer-on',name:'Ativar buzzer',description:'Aciona o aviso sonoro na saída ligada ao buzzer desta instalação.',category:'Controle de alarme',action:'Ativar'},
 {id:'block',name:'Bloquear Motor',description:'Aciona o relé instalado na missão e bloqueia o motor do veículo do jogo.',category:'Controle de motor',action:'Ativar',warning:true},
 {id:'dmp',name:'Conectar ao DMP',description:'Simula a conexão com o Device Management Platform da Ruptela.',category:'Conexão do dispositivo',action:'Configurar'},
 {id:'buzzer-off',name:'Desativar buzzer',description:'Desliga o aviso sonoro do veículo pela saída instalada.',category:'Controle de alarme',action:'Desativar'},
 {id:'unblock',name:'Desbloquear Motor',description:'Libera o relé e permite a partida do motor do jogo.',category:'Controle de motor',action:'Desativar'},
 {id:'imei',name:'Obter IMEI',description:'Consulta o identificador virtual do rastreador desta oficina.',category:'Gerenciamento do dispositivo',action:'Consultar'},
 {id:'info',name:'Obter Informações',description:'Consulta alimentação, ignição, saídas e sinal analógico da instalação.',category:'Gerenciamento do dispositivo',action:'Consultar'},
 {id:'firmware',name:'Obter versão do Firmware',description:'Retorna a identificação do firmware simulado do dispositivo.',category:'Gerenciamento do dispositivo',action:'Consultar'},
 {id:'position',name:'Obter Coordenadas',description:'Solicita uma posição GPS atual do veículo da simulação.',category:'Gerenciamento do dispositivo',action:'Consultar'},
 {id:'reboot',name:'Reiniciar Dispositivo',description:'Reinicia o rastreador virtual. A comunicação fica offline por 5 segundos.',category:'Gerenciamento do dispositivo',action:'Configurar',warning:true}
]);

export function commandConnection(state,simulation){
 return state.phase==='running'&&readBench(state).powered&&simulation.connected!==false&&!(simulation.rebootRemaining>0);
}

export function executeSimulatedCommand(id,state,simulation,now=Date.now()){
 if(!COMMANDS.some(c=>c.id===id))return {ok:false,message:'Comando desconhecido.'};
 if(!commandConnection(state,simulation))return {ok:false,message:simulation.rebootRemaining>0?'Não aceito: dispositivo reiniciando e temporariamente offline.':'Não aceito: dispositivo offline. Ligue a instalação e a conexão com a central.'};
 const reading=readBench(state),relay=Object.entries(state.connections).find(([,t])=>t==='relay')?.[0],buzzer=Object.entries(state.connections).find(([,t])=>t==='buzzer')?.[0];
 if(['block','unblock'].includes(id)){
  if(!relay)return {ok:false,message:'Não aceito: o relé de bloqueio não foi instalado nesta missão.'};
  state.blocked=id==='block';state.relay=state.blocked;if(state.blocked){simulation.resumeSpeed=simulation.speed;simulation.speed=0;}else if(simulation.resumeSpeed!==undefined)simulation.speed=simulation.resumeSpeed;
  return {ok:true,message:`${state.blocked?'Motor bloqueado. Relé acionado':'Motor desbloqueado. Relé liberado'} pelo fio ${relay.replace('-',' / ')}. Estado atualizado no painel.`};
 }
 if(['buzzer-on','buzzer-off'].includes(id)){
  if(!buzzer)return {ok:false,message:'Não aceito: não há buzzer ligado na instalação.'};
  state.buzzer=id==='buzzer-on';return {ok:true,message:`Buzzer ${state.buzzer?'acionado':'desligado'} pelo fio ${buzzer.replace('-',' / ')}. Estado atualizado no painel.`};
 }
 if(id==='position'){
  if(!(simulation.satellites>0))return {ok:false,message:'Dispositivo online, mas sem fixação GPS. Nenhuma posição nova foi obtida.'};
  simulation.lastPosition=now;return {ok:true,message:`Posição recebida: ${(simulation.latitude??-25.445407).toFixed(6)}, ${(simulation.longitude??-49.264770).toFixed(6)} · ${simulation.satellites} satélites. Localização virtual atualizada.`};
 }
 if(id==='reboot'){simulation.rebootRemaining=5;return {ok:true,message:'Comando aceito. Reinício em andamento: offline por 5 segundos; a montagem será mantida.'};}
 if(id==='clear-buffer'){const count=simulation.buffer??12;simulation.buffer=0;return {ok:true,message:`Buffer apagado: ${count} registros virtuais removidos.`};}
 if(id==='dmp'){simulation.dmpConnected=true;return {ok:true,message:'Conexão ao DMP virtual estabelecida. Nenhuma conexão externa foi feita.'};}
 if(id==='imei')return {ok:true,message:'IMEI virtual: LCV5-DEMO-0001 · identificador exclusivo da simulação.'};
 if(id==='firmware')return {ok:true,message:'Firmware virtual: Oficina LCV5 · simulador de treinamento.'};
 return {ok:true,message:`Alimentação: ${reading.ignition&&!reading.blocked?'14,2':'12,6'} V · bateria interna: 4,10 V · ignição: ${reading.ignition?'ligada':'desligada'} · motor: ${reading.blocked?'bloqueado':'liberado'} · buzzer: ${reading.buzzer?'acionado':'desligado'} · analógica: ${reading.analog===null?'sem sensor':Number(reading.analog).toFixed(1)+' V'}.`};
}

// Time and transport are local to this scene. No fetch, SMS or device access.
export function createCommandSimulation({getState,simulation,onChange=()=>{},now=Date.now}){
 let history=[],queue=[],serial=0,elapsed=0;
 function enqueue(ids){
  for(const id of [...new Set(ids)]){
   const command=COMMANDS.find(c=>c.id===id);if(!command)continue;
   const entry={request:++serial,id,name:command.name,status:'pending',message:'Enviando · aguardando confirmação do dispositivo virtual…',sentAt:now(),receivedAt:null};
   history.unshift(entry);queue.push(entry);
  }
  history=history.slice(0,40);onChange();
 }
 return {enqueue,get history(){return history.map(e=>({...e}));},get busy(){return queue.length>0;},
  serialize(){return {history:history.map(e=>({...e})),serial,elapsed};},
  restore(saved){history=(saved?.history||[]).filter(e=>COMMANDS.some(c=>c.id===e.id)&&['accepted','rejected','pending'].includes(e.status)).slice(0,40).map(e=>({...e,name:COMMANDS.find(c=>c.id===e.id).name}));queue=history.filter(e=>e.status==='pending').reverse();serial=Math.max(0,...history.map(e=>Number(e.request)||0));elapsed=Math.max(0,Number(saved?.elapsed)||0);onChange();},
  reset(){queue=[];history=[];elapsed=0;simulation.rebootRemaining=0;simulation.connected=true;simulation.dmpConnected=false;simulation.lastPosition=null;simulation.buffer=12;onChange();},
  tick(dt){
   const previous=Math.ceil(simulation.rebootRemaining||0);simulation.rebootRemaining=Math.max(0,(simulation.rebootRemaining||0)-dt);
   if(queue.length){elapsed+=dt;if(elapsed>=.7){elapsed=0;const entry=queue.shift(),result=executeSimulatedCommand(entry.id,getState(),simulation,now());Object.assign(entry,{status:result.ok?'accepted':'rejected',message:result.message,receivedAt:now()});onChange();}}
   if(Math.ceil(simulation.rebootRemaining)!==previous)onChange();
  }
 };
}

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createCommandPanel({center,getState,simulation,onChange}){
 const $=id=>document.getElementById(id),selected=new Set();let prepared=[],historyMarkup='';
 function visibleCommands(){const query=$('command-search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return COMMANDS.filter(c=>(c.name+' '+c.description).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));}
 function renderCatalog(){
  const list=visibleCommands();$('command-count').textContent=`${list.length} comandos disponíveis para Ruptela LCV5 · simulação`;
  $('command-catalog').innerHTML=list.length?list.map(c=>`<article class="command-card${c.warning?' caution':''}"><label><input type="checkbox" data-command-select="${c.id}"${selected.has(c.id)?' checked':''}><span><strong>${escape(c.name)}${c.warning?' △':''}</strong><small>${escape(c.description)}</small><em>${escape(c.category)} · ${c.action}</em></span></label><button type="button" data-command-prepare="${c.id}" aria-label="Preparar ${escape(c.name)}">Enviar ↗</button></article>`).join(''):'<p class="command-empty">Nenhum comando encontrado.</p>';
  $('command-select-all').checked=list.length>0&&list.every(c=>selected.has(c.id));render();
 }
 function prepare(ids){prepared=ids;$('command-composer').hidden=false;$('command-composer-name').textContent=ids.map(id=>COMMANDS.find(c=>c.id===id).name).join(' · ');$('command-composer').scrollIntoView?.({block:'nearest',behavior:'smooth'});render();}
 function render(){
  const online=commandConnection(getState(),simulation),status=online?'Online':simulation.rebootRemaining>0?`Reiniciando · ${Math.ceil(simulation.rebootRemaining)} s`:'Offline';
  $('command-online').textContent=status;$('command-online').dataset.online=String(online);
  $('command-send-selected').textContent=`Enviar selecionados (${selected.size})`;$('command-send-selected').disabled=!selected.size||center.busy;
  $('command-confirm').disabled=!prepared.length||center.busy;$('command-confirm').textContent=center.busy?'Aguardando confirmação…':'Enviar comando'+(prepared.length>1?'s':'');
  $('command-send-state').textContent=online?'Dispositivo online · aguarda o envio':`Dispositivo ${status.toLowerCase()} · o envio será recusado enquanto estiver offline`;
  $('command-network').checked=simulation.connected!==false;
  const markup=center.history.length?center.history.map(e=>`<article class="command-response ${e.status}"><div><strong>${escape(e.name)}</strong><b>${e.status==='accepted'?'Aceito · confirmado':e.status==='rejected'?'Não aceito':'Enviando…'}</b></div><p>${escape(e.message)}</p><small>#${String(e.request).padStart(3,'0')} · ${new Date(e.receivedAt||e.sentAt).toLocaleTimeString('pt-BR')}</small></article>`).join(''):'<p class="command-empty">Envie um comando para acompanhar o pedido e a confirmação aqui.</p>';
  if(markup!==historyMarkup){$('command-history').innerHTML=markup;historyMarkup=markup;}
 }
 $('command-search').addEventListener('input',renderCatalog);
 $('command-catalog').addEventListener('change',e=>{const id=e.target.dataset.commandSelect;if(!id)return;e.target.checked?selected.add(id):selected.delete(id);renderCatalog();});
 $('command-catalog').addEventListener('click',e=>{const button=e.target.closest('[data-command-prepare]');if(button)prepare([button.dataset.commandPrepare]);});
 $('command-select-all').addEventListener('change',e=>{for(const c of visibleCommands())e.target.checked?selected.add(c.id):selected.delete(c.id);renderCatalog();});
 $('command-send-selected').addEventListener('click',()=>prepare([...selected]));
 $('command-defaults').addEventListener('click',()=>{$('command-search').value='';selected.clear();renderCatalog();});
 for(const button of document.querySelectorAll('[data-command-view]'))button.addEventListener('click',()=>{$('command-catalog').classList.toggle('list',button.dataset.commandView==='list');for(const b of document.querySelectorAll('[data-command-view]'))b.setAttribute('aria-pressed',String(b===button));});
 $('command-composer-close').addEventListener('click',()=>{$('command-composer').hidden=true;prepared=[];});
 $('command-confirm').addEventListener('click',()=>{if(!prepared.length||center.busy)return;center.enqueue(prepared);render();});
 $('command-network').addEventListener('change',e=>{simulation.connected=e.target.checked;onChange();render();});
 renderCatalog();return {render,reset(){selected.clear();prepared=[];$('command-composer').hidden=true;$('command-search').value='';renderCatalog();}};
}

