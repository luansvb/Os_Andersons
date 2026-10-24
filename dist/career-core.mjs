export const RELEASE='1.1.1';
export const ACT_NAMES=['Agendamento','Instalação','Ativação','O grande roubo','Atuação anti furto'];
export const DIFFICULTIES=Object.freeze([
 {id:'training',name:'Estagiário',description:'Mais tempo, dicas e checkpoints.',checkpoints:true,patienceMs:100000,notificationMs:6500,choices:5,mapSpeed:.7,deadline:100,window:3.2,hold:1.6},
 {id:'normal',name:'Efetivado',description:'Cobrança normal e checkpoints.',checkpoints:true,patienceMs:65000,notificationMs:4200,choices:8,mapSpeed:1,deadline:70,window:1.5,hold:2.2},
 {id:'probation',name:'Contrato de experiência',description:'Pressão máxima. Perdeu, encerra a campanha.',checkpoints:false,patienceMs:40000,notificationMs:2800,choices:9,mapSpeed:1.2,deadline:60,window:1.1,hold:2.4}
]);
export const difficultyFor=value=>DIFFICULTIES.find(d=>d.id===value)||DIFFICULTIES[1];
export const cleanNumber=(n,max=1e9)=>Math.min(max,Math.max(0,Number(n)||0));
export function emptyMetrics(){return {activeMs:0,errors:0,retries:0,actions:0,collisions:0,imeiAttempts:0,imeiCorrect:false,lecturePages:0,completed:false};}
export function sanitizeMetrics(raw={}){
 const m=emptyMetrics();for(const key of Object.keys(m))m[key]=typeof m[key]==='boolean'?raw[key]===true:cleanNumber(raw[key]);
 return m;
}
export function createJourney(caseId,difficulty='normal'){
 return {version:1,caseId:String(caseId),difficulty:difficultyFor(difficulty).id,acts:{},installation:null};
}
export function restoreJourney(raw,caseId,difficulty='normal'){
 const run=createJourney(caseId,raw?.difficulty||difficulty);
 if(raw?.version!==1||raw.caseId!==String(caseId))return run;
 for(let act=1;act<=5;act++)if(raw.acts?.[act])run.acts[act]=sanitizeMetrics(raw.acts[act]);
 if(raw.installation)run.installation=installationSummary(raw.installation);
 return run;
}
export function mergeMetrics(run,act,metrics){
 if(!run||!Number.isInteger(act)||act<1||act>5)return run;
 const old=run.acts[act]||emptyMetrics(),next=sanitizeMetrics(metrics);
 for(const key of Object.keys(old))next[key]=typeof old[key]==='boolean'?old[key]||next[key]:Math.max(old[key],next[key]);
 return {...run,acts:{...run.acts,[act]:next}};
}
export function installationSummary(raw={}){
 const location=raw.location==='rear-trim'?'rear-trim':'rear-side',tidy=raw.tidy===true,signalChecked=raw.signalChecked===true;
 const concealment=Math.min(100,(location==='rear-side'?90:80)+(tidy?20:0));
 const signal=Math.min(100,(location==='rear-trim'?90:80)+(signalChecked?20:0));
 return {location,tidy,signalChecked,concealment,signal,quality:Math.round((concealment+signal)/2)};
}
export function installationEffects(raw){
 const install=raw?installationSummary(raw):null;
 return {gpsDelay:install?Math.round(18000-(install.signal-80)*250):18000,locationAge:install?.signal===100?15:12,windowBonus:install?.signal===100 ? .35 : 0,signal:install?.signal??90};
}
export function recoveryRules(difficulty='normal',installation=null){
 const d=difficultyFor(difficulty),effect=installationEffects(installation);
 return {deadline:d.deadline,window:d.window+effect.windowBonus,hold:d.hold,minDistance:65,maxDistance:145,maxRelativeSpeed:d.id==='training'?65:48,locationAge:effect.locationAge};
}
export function scoreReport(run){
 const acts=ACT_NAMES.map((name,i)=>{
  const m=sanitizeMetrics(run?.acts?.[i+1]);
  const target=[300,360,480,180,240][i];
  const overtime=Math.min(10,Math.max(0,m.activeMs/1000-target)/45);
  return {act:i+1,name,...m,score:m.completed?Math.max(0,Math.round(100-m.errors*12-m.retries*5-m.collisions*3-overtime)):0};
 });
 const completed=acts.every(a=>a.completed),errors=acts.reduce((n,a)=>n+a.errors,0),collisions=acts.reduce((n,a)=>n+a.collisions,0),retries=acts.reduce((n,a)=>n+a.retries,0),activeMs=acts.reduce((n,a)=>n+a.activeMs,0);
 const score=Math.round(acts.reduce((n,a)=>n+a.score,0)/5);
 const rank=score>=95?'Anderson do mês':score>=80?'Funcionário que a Cat tolera':score>=60?'Efetivado por insistência':'Estagiário sobrevivente';
 const badges=[];
 if(completed){
  badges.push({id:'survivor',title:'Expediente encerrado',detail:'Sobreviveu aos cinco atos.'});
  if(!errors)badges.push({id:'clean',title:'Sem justa causa',detail:'Concluiu a campanha sem cometer um erro grave.'});
  if(acts[2].imeiAttempts===1&&acts[2].imeiCorrect)badges.push({id:'imei',title:'IMEI de primeira',detail:'Digitou a etiqueta corretamente na primeira tentativa.'});
  if(!acts[1].errors)badges.push({id:'installer',title:'Mãos de cirurgião',detail:'Instalou sem provocar explosões.'});
  if(!acts[4].collisions)badges.push({id:'driver',title:'Volante de ouro',detail:'Recuperou o Ka sem colisões na perseguição.'});
  if(run.installation?.quality>=95)badges.push({id:'hidden',title:'Quem procura não acha',detail:'Entregou uma instalação caprichada.'});
  if(acts[4].lecturePages>=28)badges.push({id:'lecture',title:'Ouvido de aço',detail:'Chegou ao fim da bronca da Rô.'});
  if(run?.difficulty==='probation')badges.push({id:'contract',title:'Contrato cumprido',detail:'Terminou sem checkpoints no Contrato de experiência.'});
 }
 return {acts,completed,score,rank,badges,errors,collisions,retries,activeMs,ending:score>=90&&errors===0?'promotion':errors>=5?'probation':'retained'};
}
export function makeClient(caseId){
 let hash=0;for(const c of String(caseId))hash=(hash*31+c.charCodeAt(0))>>>0;
 const variant=hash%3,name=['Anderson da Silva Anderson','Anderson Pereira Anderson','Anderson Souza Anderson'][variant];
 const time=variant===1?'14:00':variant===2?'10:00':'12:00';
 const availability=variant===1?'Para amanhã, às 14 horas.':variant===2?'Para amanhã, às 10 horas.':'Para amanhã, meio dia.';
 return {variant,name,vehicle:'Ford Ka',time,dayOffset:1,availability,style:['Objetivo','Manda tudo picado','Só manda áudio'][variant],replies:[
  variant===1?['Anderson.','Pereira.','Anderson. Esse é o nome completo.']:[name],
  variant===1?['É um Chevrolet Onix.','Pera, esse é o da minha esposa! O meu é um Ford Ka.']:['Ford Ka'],
  variant===1?['Pode ser amanhã, meio-dia.','Opa, preciso mudar: amanhã, às 14 horas. Confirme esse horário, por favor.']:[availability]
 ]};
}
export const MOOD_LABELS={calm:'Observando',suspicious:'Desconfiando',angry:'Sem paciência',happy:'Aprovando'};
export function pressureMood(value,completed=false){return completed?'happy':value>=68?'angry':value>=32?'suspicious':'calm';}
export function reactiveLine(act,phase,action,repeats,pressure){
 if(repeats>=3)return 'ANDERSON, VOCÊ JÁ FEZ ISSO TRÊS VEZES. O BOTÃO NÃO MUDA POR SOLIDARIEDADE!';
 if(act===3&&phase==='platform')return 'O GPS ESTÁ RESPONDENDO. NÃO ENVIE OUTRO COMANDO SÓ PARA PARECER OCUPADO.';
 if(act===3&&action==='chat-target')return 'CONFERE O SOBRENOME: TÉCNICO NÃO É CLIENTE. EU SEI QUE OS DOIS SÃO ANDERSON!';
 if(act===1&&phase==='calendar')return 'O HORÁRIO É O ÚLTIMO QUE O CLIENTE CONFIRMOU. MEMÓRIA SELETIVA NÃO AGENDA CARRO!';
 if(act===2&&phase==='wiring')return 'EXAMINE O CABO ANTES DE LIGAR. A SEGURADORA JÁ BLOQUEOU O MEU NÚMERO!';
 if(act===2&&phase==='hiding')return 'CAPRICHA NO CHICOTE E CONFERE O SINAL. O PRÓXIMO ANDERSON VAI PRECISAR DISSO.';
 if(act===4&&phase==='foot')return 'ANDERSON ESTÁ PASSEANDO. A CIDADE NÃO VAI PROCURAR O FORD KA POR ELE.';
 if(act===5&&phase==='tracking')return 'POSIÇÃO ATUAL, CONTATO CERTO. NÃO MANDE A VIATURA PARA O ONTEM!';
 return pressure>=68?'ANDERSON! EU CONTRATEI UM FUNCIONÁRIO, NÃO UMA TELA DE CARREGAMENTO!':pressure>=32?'ESTOU VENDO ESSE TEMPO PASSAR, ANDERSON. CONCENTRA NO SERVIÇO.':'Leia a ordem, confira os dados e faça uma coisa de cada vez.';
}
