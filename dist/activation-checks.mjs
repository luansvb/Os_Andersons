import {shuffleOptions} from './option-order.mjs?v=1.1.1';
export const CHECK_STEPS=[1,3,9,10,15];
function baseChallenge(s){
 if(s.phase!=='maze'||!CHECK_STEPS.includes(s.mazeStep))return null;
 const solved=(s.checks||[]).includes(s.mazeStep),base={solved,step:s.mazeStep};
 if(s.mazeStep===1)return {...base,title:'Compare com a etiqueta',instruction:'O técnico fotografou um LT-32 PRO. Qual modelo você vai cadastrar?',correct:'lt32',choices:[{id:'lt30',label:'LT-30 · rastreador básico'},{id:'lt32',label:'LT-32 PRO · etiqueta recebida'},{id:'lcv5',label:'LCV5 · oficina de prática'}]};
 if(s.mazeStep===3)return {...base,title:'Cruze a ordem e o veículo',instruction:`Ordem recebida: ${s.vehicle} · placa fictícia AND-0032. Escolha o vínculo que corresponde aos dois dados.`,correct:'match',choices:[{id:'wrong-plate',label:`${s.vehicle} · AND-0023`},{id:'match',label:`${s.vehicle} · AND-0032`},{id:'wrong-model',label:'Ford Focus · AND-0032'}]};
 if(s.mazeStep===9)return {...base,title:'Leia a medição da bancada',instruction:'Teste simulado: chave DESLIGADA, entrada em 0,0 V. Qual registro confere?',correct:'off-zero',choices:[{id:'off-twelve',label:'Ignição desligada · 12,6 V'},{id:'on-zero',label:'Ignição ligada · 0,0 V'},{id:'off-zero',label:'Ignição desligada · 0,0 V'}]};
 if(s.mazeStep===10)return {...base,title:'Compare o segundo teste',instruction:'Teste simulado: chave LIGADA, entrada em 12,6 V. Escolha o laudo correspondente.',correct:'on-twelve',choices:[{id:'on-twelve',label:'Ignição ligada · 12,6 V'},{id:'off-twelve',label:'Ignição desligada · 12,6 V'},{id:'on-zero',label:'Ignição ligada · 0,0 V'}]};
 const other=s.imei.slice(0,-1)+(Number(s.imei.at(-1))+1)%10,swapped=s.imei.slice(0,5)+String((Number(s.imei[5])+1)%10)+s.imei.slice(6);
 return {...base,title:'Resolva o cadastro duplicado',instruction:`Há três aparelhos com o mesmo veículo. Vincule apenas o IMEI ${s.imei}, que está na foto do técnico.`,correct:'original',choices:[{id:'stale',label:`Cadastro antigo · IMEI ${other}`},{id:'original',label:`Aparelho recebido · IMEI ${s.imei}`},{id:'duplicate',label:`Registro duplicado · IMEI ${swapped}`}]};
}

export function challengeFor(s){const check=baseChallenge(s);return check?{...check,choices:shuffleOptions(check.choices,s.caseId,'activation.check:'+check.step)}:null;}
