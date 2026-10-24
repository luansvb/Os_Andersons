import {hashCase} from './lt32-core.mjs?v=1.2.0';
import {shuffleOptions} from './option-order.mjs?v=1.2.0';

export const DIAGNOSIS_REVIEW_MS=6000;
export const DIAGNOSIS_REPAIR_MS=3500;
export const DIAGNOSIS_SOURCES=Object.freeze([{id:'record',name:'Cadastro'},{id:'report',name:'Laudo'},{id:'telemetry',name:'Telemetria'}]);
export const DIAGNOSIS_ACTIONS=Object.freeze([
 {id:'identity',label:'Corrigir o vínculo do aparelho no cadastro da ordem'},
 {id:'power',label:'Pedir revisão da alimentação externa ao técnico'},
 {id:'signal',label:'Pedir novo teste de recepção em área aberta'},
 {id:'wait',label:'Aguardar a aquisição normal da primeira posição'}
]);
export const faultFor=caseId=>['none','identity','power','signal'][hashCase('diagnosis:'+caseId)%4];
export function createDiagnosis(caseId,legacy=false){return {legacy,tab:'record',reviewed:[],action:null,repairMs:0,resolved:legacy||faultFor(caseId)==='none'};}
export const diagnosisFault=s=>s.diagnosis?.legacy?'none':faultFor(s.caseId);
export function enterDiagnosis(s){return {...s,phase:'diagnosis',diagnosis:{...s.diagnosis,tab:'record',reviewed:[...new Set([...s.diagnosis.reviewed,'record'])],action:null}};}
export function diagnosticFor(s){
 const fault=diagnosisFault(s),active=s.diagnosis?.resolved?'none':fault,other=s.imei.slice(0,-1)+(Number(s.imei.at(-1))+1)%10;
 const external=active==='power'?'0,0 V':'12,6 V',gsm=active==='power'?'SEM COMUNICAÇÃO':'ONLINE',satellites=active==='power'?'SEM LEITURA':active==='signal'?'0 satélites':'7 satélites';
 const sources={
  record:{title:'Cadastro vinculado à ordem',rows:[['Modelo','LT-32 PRO'],['Veículo e placa',`${s.vehicle} · AND-0032`],['IMEI da etiqueta',s.imei],['IMEI do cadastro',active==='identity'?other:s.imei]],note:active==='identity'?'Após a sincronização, uma importação antiga regravou o vínculo. Compare com a etiqueta atual.':'O aparelho da plataforma deve ser o mesmo da etiqueta enviada pelo técnico.'},
  report:{title:'Laudo do teste inicial',rows:[['Alimentação na bancada','12,6 V'],['Ignição desligada','0,0 V'],['Ignição ligada','12,6 V'],['Ambiente do teste',active==='signal'?'Galpão com cobertura metálica':'Área externa']],note:active==='power'?'Laudo registrado no início da ativação. Após movimentar o veículo, a leitura mudou. Compare com o retorno atual.':'O laudo registra o teste inicial; compare também o cadastro e a telemetria.'},
  telemetry:{title:'Leitura atual do equipamento',rows:[['Comunicação GSM',gsm],['Alimentação externa atual',external],['Recepção GNSS',satellites],['Primeira posição',s.gpsReady?'RECEBIDA':'AGUARDANDO']],note:'Comunicação móvel e recepção GNSS são indicadores diferentes neste teste simulado.'}
 };
 const hints={none:'Cadastro e etiqueta conferem. A alimentação e a recepção também estão presentes: o prazo normal de aquisição ainda pode ser necessário.',identity:'Compare os 15 dígitos do cadastro com os da etiqueta. Ter sinal não corrige o vínculo com outro aparelho.',power:'Compare os 12,6 V do laudo com a alimentação externa atual, medida depois do fechamento.',signal:'Há alimentação e comunicação móvel. Compare a recepção GNSS com o ambiente onde o teste foi feito.'};
 const receipt={identity:'Etiqueta conferida. O cadastro da ordem agora aponta para o IMEI correto. Solicite uma nova posição.',power:'Revisei a alimentação após a movimentação do veículo. Leitura atual: 12,6 V, comunicação restabelecida. Solicite uma nova posição.',signal:'Refiz o teste em área aberta. A recepção agora mostra 7 satélites. Solicite uma nova posição.'};
 return {fault,correct:fault==='none'?'wait':fault,sources,external,gsm,satellites,hint:hints[fault],receipt:receipt[fault]||'Os indicadores conferem. Aguarde a aquisição normal; o tempo já decorrido foi preservado.',actions:shuffleOptions(DIAGNOSIS_ACTIONS,s.caseId,'activation.diagnosis')};
}
export function restoreDiagnosis(raw,caseId){
 if(!raw||typeof raw.legacy!=='boolean'||!DIAGNOSIS_SOURCES.some(s=>s.id===raw.tab)||!Array.isArray(raw.reviewed)||new Set(raw.reviewed).size!==raw.reviewed.length||raw.reviewed.some(id=>!DIAGNOSIS_SOURCES.some(s=>s.id===id)))return null;
 if(raw.reviewed.length&&!raw.reviewed.includes(raw.tab))return null;
 if(raw.action!==null&&!DIAGNOSIS_ACTIONS.some(a=>a.id===raw.action))return null;
 if(typeof raw.resolved!=='boolean'||!Number.isFinite(raw.repairMs)||raw.repairMs<0||raw.repairMs>DIAGNOSIS_REPAIR_MS)return null;
 const fault=raw.legacy?'none':faultFor(caseId);
 if(fault==='none'){if(!raw.resolved||raw.repairMs!==0||raw.action!==null&&raw.action!=='wait')return null;}
 else if(raw.action===null){if(raw.resolved||raw.repairMs!==0)return null;}
 else if(raw.action!==fault||raw.resolved!==(raw.repairMs===DIAGNOSIS_REPAIR_MS))return null;
 if(raw.action!==null&&raw.reviewed.length!==3)return null;
 return {legacy:raw.legacy,tab:raw.tab,reviewed:[...raw.reviewed],action:raw.action,repairMs:raw.repairMs,resolved:raw.resolved};
}
