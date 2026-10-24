import {difficultyFor,installationEffects} from './career-core.mjs?v=1.1.2';
import {challengeFor,CHECK_STEPS} from './activation-checks.mjs?v=1.1.2';
export {challengeFor,CHECK_STEPS};
import {hashCase,random} from './lt32-core.mjs?v=1.1.2';
export const ACTIVATION_VERSION=2;
export const POSITION_DELAY=18000;
export const ACTIVATION_STEPS=Object.freeze([
 ['equipment','Abrir cadastro de equipamento','Abra o cadastro do aparelho recebido na foto.'],
 ['model','Selecionar LT-32 PRO','Selecione o modelo instalado pelo técnico.'],
 ['identity','Confirmar IMEI digitado','Confirme a identificação que você digitou.'],
 ['vehicle','Vincular ao veículo','Associe o aparelho ao veículo desta ordem.'],
 ['network','Selecionar rede móvel','Abra a rede de comunicação do rastreador.'],
 ['profile','Abrir perfil de comunicação','Entre no perfil de comunicação do equipamento.'],
 ['tracking','Aplicar perfil de rastreamento','Aplique o perfil de rastreamento desta ordem.'],
 ['interval','Salvar parâmetros de envio','Salve os parâmetros de envio configurados.'],
 ['power','Confirmar alimentação externa','Registre a confirmação da alimentação do veículo.'],
 ['off','Validar ignição desligada','Valide a leitura com a ignição desligada.'],
 ['on','Validar ignição ligada','Agora valide a leitura com a ignição ligada.'],
 ['relay','Abrir teste de bloqueio','Abra o teste simulado do bloqueio.'],
 ['block','Confirmar bloqueio em bancada','Confirme o bloqueio no teste simulado.'],
 ['unblock','Desbloquear veículo','Desfaça o bloqueio do teste antes de continuar.'],
 ['end-test','Encerrar teste de bloqueio','Encerre o teste já desbloqueado.'],
 ['sync','Sincronizar cadastro','Sincronize o cadastro na plataforma.'],
 ['technician','Registrar técnico responsável','Registre o Anderson como técnico responsável.'],
 ['report','Salvar laudo de testes','Salve o laudo desta instalação.'],
 ['activate','Confirmar ativação','Confirme a ativação do equipamento.'],
 ['monitor','Abrir plataforma de rastreamento','Abra a plataforma para solicitar a primeira posição.']
].map(([id,label,instruction])=>({id,label,instruction})));
export const ACCESS_STEPS=Object.freeze([
 ['client-file','Abrir ficha do cliente','A posição já foi enviada. Abra a ficha do cliente.'],
 ['owner','Conferir titular','Confira o titular desta ordem.'],
 ['access-vehicle','Associar veículo ao cliente','Associe o veículo ao acesso do cliente.'],
 ['create-login','Criar acesso do cliente','Crie o login de consulta do cliente.'],
 ['password','Gerar senha provisória','Gere a senha provisória do acesso.'],
 ['release','Liberar credenciais','Libere os dados para enviar ao cliente.']
].map(([id,label,instruction])=>({id,label,instruction})));
export const COMMANDS=Object.freeze([
 {id:'position',label:'Solicitar posição atual'},
 {id:'factory',label:'Restaurar padrão de fábrica'},
 {id:'block',label:'Bloquear veículo'},
 {id:'offline',label:'Desativar comunicação'}
]);
export const PRESSURE_INTERVAL=3500;
export const PRESSURE=Object.freeze([
 'ANDERSON! O CLIENTE ESTÁ AQUI. ATIVA ESSE EQUIPAMENTO AGORA!',
 'VAI FICAR OLHANDO PARA A TELA? PRECISO DA POSIÇÃO!',
 'ANDERSON??? RESPONDE! EU NÃO VOU FICAR AQUI O DIA INTEIRO!',
 'O CARRO ESTÁ PRONTO. A FILA SÓ ESTÁ PARADA POR SUA CAUSA!',
 'CADÊ O SINAL VERDE? CONFERE E ME MANDA LOGO!',
 'PARA DE ENROLAR E MANDA A LOCALIZAÇÃO!',
 'EU TENHO OUTRA INSTALAÇÃO! ACELERA ESSE ATENDIMENTO!',
 'É PARA ATIVAR, TESTAR E LIBERAR. VAMOS RESOLVER HOJE?',
 'NÃO ME MANDA QUALQUER COISA! QUERO A POSIÇÃO CERTA!',
 'ESTOU ESPERANDO DE NOVO! PRECISO DE UMA RESPOSTA!',
 'O CLIENTE QUER IR EMBORA! VAI LIBERAR OU VOU CHAMAR A CAT?',
 'ANDERSON! FOCO NO SERVIÇO. TERMINA ESSA ATIVAÇÃO!'
]);
export const BEAR_LINES=Object.freeze([
 'MAIS RÁPIDO, ANDERSON! EU NÃO PEDI UMA ETERNIDADE!',
 'EFICIÊNCIA! PARA DE ENROLAR E ACERTA ESSE CLIQUE!',
 'O CLIENTE NÃO VAI MORAR NA OFICINA! ACELERA!',
 'LEIA A ORDEM E EXECUTE! NÃO INVENTA OUTRO BOTÃO!',
 'VOCÊ CONSEGUE FAZER MELHOR. ENTÃO FAÇA AGORA!',
 'CADA SEGUNDO CONTA. EU ESTOU DE OLHO EM VOCÊ!',
 'CONFERE O CONTATO! RÁPIDO NÃO SIGNIFICA ERRADO!',
 'NÃO TERMINOU! TESTA, ENVIA O ACESSO E LIBERA!'
]);
function shuffled(items,rng){const a=[...items];for(let i=a.length-1;i;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function taskFor(s){return s.phase==='maze'?ACTIVATION_STEPS[s.mazeStep]:s.phase==='handoff'?ACCESS_STEPS[s.accessStep]:null;}
export function buttonsFor(s){const task=taskFor(s);if(!task)return [];const pool=[...ACTIVATION_STEPS,...ACCESS_STEPS,{id:'delete',label:'Excluir equipamento'},{id:'skip',label:'Liberar sem testes'},{id:'archive',label:'Arquivar atendimento'},{id:'cancel',label:'Cancelar ativação'}].filter(t=>t.id!==task.id);const rng=random(s.seed+(s.phase==='maze'?s.mazeStep:100+s.accessStep)*7919);return shuffled([task,...shuffled(pool,rng).slice(0,difficultyFor(s.difficulty).choices-1)],rng);}
export function imeiFor(seed){const rng=random(seed);let digits='86';for(let i=0;i<12;i++)digits+=Math.floor(rng()*10);const sum=[...digits].reduce((sum,d,i)=>{let n=Number(d)*(i%2?2:1);return sum+(n>9?n-9:n);},0);return digits+((10-sum%10)%10);}
export function locationText(s){return `${s.address}\n${s.coordinates}`;}
export function credentialsText(s){return `Olá, ${s.client}! Seu acesso ao rastreamento está liberado.\nLogin: ${s.login}\nSenha: ${s.password}`;}
export function createActivation(caseId,details={}){
 const seed=hashCase(caseId),imei=imeiFor(seed),suffix=imei.slice(-6);
 return {version:ACTIVATION_VERSION,caseId,seed,difficulty:difficultyFor(details.difficulty).id,positionDelay:installationEffects(details.installation).gpsDelay,checks:[],client:details.client||'Anderson da Silva Anderson',vehicle:details.vehicle||'Ford Ka',installationLocation:details.installationLocation==='rear-trim'?'rear-trim':'rear-side',imei,serial:'LT32'+String(seed).padStart(10,'0'),iccid:'895501'+String(seed).padStart(10,'0')+'3401',login:'anderson.'+suffix,password:'Ander#'+suffix.slice(0,4)+'!',address:'Av. dos Andersons, 320 · Distrito Industrial',coordinates:'-25.432100, -49.271200',phase:'imei',imeiDraft:'',mazeStep:0,accessStep:0,elapsedMs:0,waitMs:0,commandSent:false,gpsReady:false,clipboard:null,chatTarget:'tech',chatDraft:'',locationSent:false,accessSent:false,finishMs:0,failure:null};
}
const fail=(s,message)=>({...s,phase:'failed',failure:message});
const clean=v=>String(v??'').trim().replace(/\r\n/g,'\n');
export function applyActivationAction(s,a){
 if(['failed','finish'].includes(s.phase))return s;
 if(a.type==='imei'){
  if(s.phase!=='imei')return s;
  if(!/^\d{15}$/.test(String(a.value))||a.value!==s.imei)return fail(s,'O IMEI digitado não é o da etiqueta do equipamento. Um número errado já muda o aparelho inteiro, Anderson.');
  return {...s,imeiDraft:a.value,phase:'maze'};
 }
 if(a.type==='solve-check'){const check=challengeFor(s);if(!check||check.solved)return s;if(a.id!==check.correct)return fail(s,check.failureHint);return {...s,checks:[...(s.checks||[]),s.mazeStep]};}
 if(a.type==='workflow'){
  const task=taskFor(s);if(!task)return s;const check=challengeFor(s);if(check&&!check.solved)return s;
  if(a.id!==task.id)return fail(s,`A etapa pedia “${task.label}”. Você clicou em outra função e comprometeu a ativação.`);
  if(s.phase==='maze'){const mazeStep=s.mazeStep+1;return {...s,mazeStep,phase:mazeStep===20?'platform':'maze'};}
  const accessStep=s.accessStep+1;return {...s,accessStep,phase:accessStep===6?'credentials':'handoff'};
 }
 if(a.type==='command'&&s.phase==='platform'){
  if(s.commandSent)return s;
  if(a.id!=='position')return fail(s,'O teste exigia solicitar a posição atual. Você enviou outro comando ao rastreador.');
  return {...s,commandSent:true,waitMs:0};
 }
 if(a.type==='copy-location'&&s.phase==='location'&&s.gpsReady)return {...s,clipboard:{kind:'location',text:locationText(s)}};
 if(a.type==='copy-credentials'&&s.phase==='credentials')return {...s,clipboard:{kind:'credentials',text:credentialsText(s)}};
 if(a.type==='chat-target'&&['tech','client'].includes(a.id))return {...s,chatTarget:a.id,chatDraft:''};
 if(a.type==='paste'&&s.clipboard)return {...s,chatDraft:s.clipboard.text};
 if(a.type==='send'){
  if(s.phase==='location'){
   if(a.target!=='tech')return fail(s,'A localização precisava ser enviada ao técnico Anderson. Você enviou para o contato errado.');
   if(s.clipboard?.kind!=='location'||clean(a.value)!==locationText(s))return fail(s,'A localização enviada não confere com a posição verde da plataforma.');
   return {...s,phase:'handoff',locationSent:true,chatDraft:'',clipboard:null};
  }
  if(s.phase==='credentials'){
   if(a.target!=='client')return fail(s,'O login e a senha eram para o cliente Anderson. Confira o contato antes de enviar!');
   if(s.clipboard?.kind!=='credentials'||clean(a.value)!==credentialsText(s))return fail(s,'O acesso enviado está incompleto ou diferente do cadastro. Confira login e senha.');
   return {...s,phase:'finish',accessSent:true,chatDraft:'',finishMs:0};
  }
 }
 return s;
}
export function advanceActivation(s,ms){
 if(!Number.isFinite(ms)||ms<=0||s.phase==='failed')return s;
 const next={...s,elapsedMs:s.phase==='finish'?s.elapsedMs:s.elapsedMs+ms};
 if(s.phase==='platform'&&s.commandSent){next.waitMs=Math.min(s.positionDelay||POSITION_DELAY,s.waitMs+ms);if(next.waitMs>=(s.positionDelay||POSITION_DELAY)){next.phase='location';next.gpsReady=true;}}
 if(s.phase==='finish')next.finishMs=(s.finishMs+ms)%60000;
 return next;
}
export function restoreActivation(raw,caseId,details={}){
 if(!raw||![1,ACTIVATION_VERSION].includes(raw.version)||raw.caseId!==caseId||!['imei','maze','platform','location','handoff','credentials','finish'].includes(raw.phase))return null;
 const base=createActivation(caseId,details),mazeStep=raw.mazeStep,accessStep=raw.accessStep;
 if(raw.imei!==base.imei||!Number.isInteger(mazeStep)||mazeStep<0||mazeStep>20||!Number.isInteger(accessStep)||accessStep<0||accessStep>6)return null;
 if(raw.phase==='imei'&&(mazeStep||accessStep))return null;
 if(raw.phase==='maze'&&(mazeStep>=20||accessStep))return null;
 if(['platform','location','handoff','credentials','finish'].includes(raw.phase)&&mazeStep!==20)return null;
 if(['location','handoff','credentials','finish'].includes(raw.phase)&&(!raw.commandSent||!raw.gpsReady||raw.waitMs<base.positionDelay))return null;
 if(['handoff','credentials','finish'].includes(raw.phase)&&!raw.locationSent)return null;
 if(raw.phase==='handoff'&&accessStep>=6)return null;
 if(['credentials','finish'].includes(raw.phase)&&accessStep!==6)return null;
 if(raw.phase==='finish'&&!raw.accessSent)return null;
 const checks=raw.version===1?CHECK_STEPS.filter(i=>i<mazeStep):raw.checks;if(!Array.isArray(checks)||checks.some(i=>!CHECK_STEPS.includes(i)||i>mazeStep)||new Set(checks).size!==checks.length||CHECK_STEPS.some(i=>i<mazeStep&&!checks.includes(i)))return null;
 const next={...base,checks:[...checks],phase:raw.phase,mazeStep,accessStep,commandSent:!!raw.commandSent,gpsReady:!!raw.gpsReady,locationSent:!!raw.locationSent,accessSent:!!raw.accessSent,elapsedMs:Math.max(0,Number(raw.elapsedMs)||0),waitMs:Math.min(base.positionDelay,Math.max(0,Number(raw.waitMs)||0)),imeiDraft:String(raw.imeiDraft||'').slice(0,15),chatTarget:raw.chatTarget==='client'?'client':'tech',chatDraft:String(raw.chatDraft||'').slice(0,800),finishMs:Math.max(0,Number(raw.finishMs)||0)%60000};
 if(raw.clipboard?.kind==='location'&&next.phase==='location')next.clipboard={kind:'location',text:locationText(next)};
 if(raw.clipboard?.kind==='credentials'&&next.phase==='credentials')next.clipboard={kind:'credentials',text:credentialsText(next)};
 return next;
}
