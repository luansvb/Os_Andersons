import * as ordering from '../dist/option-order.mjs';
import {installShift} from './ui-shift-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as core from '../dist/core.mjs';
import {makeClient} from '../dist/career-core.mjs';
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const script=(await readFile(new URL('../dist/app.mjs',import.meta.url),'utf8')).replace(/^import[^\n]+\n/gm,'');
const appPreamble='const {shuffleOptions,choiceOptions}=window.testOrdering;const {INTRO,FIELDS,SAVE_VERSION,validateField,nearestIds,saoPauloDate,addDays,isCorrectBooking,routePosition}=window.testCore;const {createJourney,restoreJourney,mergeMetrics,difficultyFor,makeClient,installationSummary}=window.testCareer;const {ShiftSession,portrait,difficultyMarkup,recordsMarkup,rememberReport}=window.testShift;\n';
const checkpoint={version:1,phase:'success',completed:true,baseDate:'2026-10-23',messages:[],tech:2,form:{name:'Anderson da Silva Anderson',vehicle:'Ford Ka',availability:'Para amanhã, meio dia.'}};
function fixture(t,saved=checkpoint,difficulty='probation'){const dom=new JSDOM(html,{url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});dom.window.scrollTo=()=>{};dom.window.testCore=core;dom.window.testOrdering=ordering;installShift(dom.window);dom.window.localStorage.setItem('andersons-prefs-v1',JSON.stringify({difficulty,sound:true}));dom.window.localStorage.setItem('andersons-save-v1',JSON.stringify(saved));dom.window.eval(appPreamble+script);return dom;}
test('Atalhos numéricos seguem a ordem visível embaralhada e o atendimento aceita a identidade da resposta',t=>{
 const positions=new Set();
 for(let i=0;i<8;i++){
  const saved={...checkpoint,caseId:'keyboard-'+i,completed:false,phase:'intro',introStep:0,introReady:true,introPrompted:true,awaiting:null},dom=fixture(t,saved,'normal'),w=dom.window,d=w.document;
  d.querySelector('[data-action="continue"]').click();
  const buttons=[...d.querySelectorAll('[data-action="intro-choice"]')],correct=buttons.find(b=>b.dataset.index==='0');positions.add(buttons.indexOf(correct));
  assert.deepEqual(buttons.map(b=>b.querySelector('.choice-number').textContent),['1','2','3','4','5']);
  const before=buttons.map(b=>b.textContent);d.querySelector('[data-action="sound"]').click();assert.deepEqual([...d.querySelectorAll('[data-action="intro-choice"]')].map(b=>b.textContent),before);
  d.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:String(buttons.indexOf(correct)+1),bubbles:true}));
  const result=JSON.parse(w.localStorage.getItem('andersons-save-v1'));assert.equal(result.awaiting,'intro-1');assert.equal(result.messages.at(-1).text,core.INTRO[0].options[0]);
 }
 assert.ok(positions.size>1);
});
test('Orientação e motivo da demissão correspondem à escolha embaralhada e permanecem no checkpoint',async t=>{
 for(const [number,question,phase,step] of [[0,core.INTRO[0],'intro',0],[1,core.INTRO[1],'intro',1],[2,core.FIELDS[1],'intake',1]]){
  const saved={...checkpoint,caseId:'feedback-'+number,completed:false,phase,introStep:step,introReady:true,introPrompted:true,awaiting:null,intakeIndex:step,asked:{},intakeMessages:[],tab:'chat'},dom=fixture(t,saved,'normal'),w=dom.window,d=w.document;
  d.querySelector('[data-action="continue"]').click();assert.equal(d.querySelector('.decision-brief p').textContent,question.brief);
  const action=phase==='intro'?'intro-choice':'intake-choice',before=[...d.querySelectorAll(`[data-action="${action}"]`)].map(b=>b.textContent);
  d.querySelector(`[data-action="${action}"][data-index="${number===0?1:0}"]`).click();await new Promise(resolve=>w.setTimeout(resolve,500));
  assert.ok(d.querySelector('.failure-modal'));assert.ok(d.querySelector('#modal-root').textContent.includes(question.feedback[number===0?1:0]));
  d.querySelector('[data-action="retry-checkpoint"]').click();assert.equal(d.querySelector('#modal-root').children.length,0);assert.equal(d.querySelector('.decision-brief p').textContent,question.brief);
  assert.deepEqual([...d.querySelectorAll(`[data-action="${action}"]`)].map(b=>b.textContent),before);
 }
});
test('Save concluído da versão anterior continua diretamente no Ato 2',t=>{
 const dom=fixture(t),d=dom.window.document;const continueButton=d.querySelector('[data-action="continue"]');assert.match(continueButton.textContent,/Continuar para a instalação/);continueButton.click();
 const frame=d.querySelector('#workshop-frame');assert.ok(frame);assert.match(frame.src,/lt32\.html\?mode=campaign/);const saved=JSON.parse(dom.window.localStorage.getItem('andersons-save-v1'));assert.equal(saved.phase,'workshop');assert.equal(saved.form.vehicle,'Ford Ka');assert.equal(saved.form.name,checkpoint.form.name);assert.ok(saved.caseId);
});
test('Oficina livre não substitui o save da campanha',t=>{
 const dom=fixture(t),d=dom.window.document;d.querySelector('[data-action="free-workshop"]').click();assert.match(d.querySelector('#workshop-frame').src,/mode=free/);assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('andersons-save-v1')),checkpoint);
});
test('Ponte da oficina rejeita mensagens de outra origem e salva etapa da própria oficina',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://other.test',source:frame.contentWindow,data:{type:'andersons-workshop',event:'menu'}}));assert.ok(d.querySelector('#workshop-frame'));
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-workshop',event:'progress',payload:{phase:'config'}}}));assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).workshopStage,'config');
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-workshop',event:'menu'}}));assert.ok(d.querySelector('[data-action="continue"]'));assert.equal(d.querySelector('#workshop-frame'),null);
});

test('Instalação 2D avulsa não apaga a campanha, mesmo após demissão',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="lt32-solo"]').click();const frame=d.querySelector('#workshop-frame');assert.match(frame.src,/lt32\.html\?mode=solo/);
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-workshop',event:'failed',payload:{phase:'explosion'}}}));assert.deepEqual(JSON.parse(w.localStorage.getItem('andersons-save-v1')),checkpoint);
});
test('Demissão no LT32 da campanha encerra o expediente e impede continuar o save',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-workshop',event:'failed',payload:{phase:'explosion'}}}));assert.equal(w.localStorage.getItem('andersons-save-v1'),null);
});
test('Instalação concluída abre o Ato 3 com o mesmo cliente, veículo e local',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');const send=(event,payload)=>w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-workshop',event,payload}}));send('complete',{phase:'finish',installationLocation:'rear-trim'});send('activate',{installationLocation:'rear-trim'});assert.match(d.querySelector('#workshop-frame').src,/activation\.html\?mode=campaign/);const saved=JSON.parse(w.localStorage.getItem('andersons-save-v1'));assert.equal(saved.phase,'activation');assert.equal(saved.form.name,checkpoint.form.name);assert.equal(saved.installationLocation,'rear-trim');assert.equal(saved.completed,false);
});
test('Ato 3 isolado preserva a campanha; falha e mensagens de outra origem não contaminam o save',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="activation-solo"]').click();const frame=d.querySelector('#workshop-frame');assert.match(frame.src,/activation\.html\?mode=solo/);w.dispatchEvent(new w.MessageEvent('message',{origin:'https://other.test',source:frame.contentWindow,data:{type:'andersons-activation',event:'menu'}}));assert.ok(d.querySelector('#workshop-frame'));w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-activation',event:'failed'}}));assert.deepEqual(JSON.parse(w.localStorage.getItem('andersons-save-v1')),checkpoint);
});
test('Ato 3 da campanha conclui apenas com mensagem do frame de ativação; erro encerra a campanha',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();let frame=d.querySelector('#workshop-frame');for(const event of ['complete','activate'])w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-workshop',event,payload:{phase:'finish'}}}));frame=d.querySelector('#workshop-frame');for(const phase of ['diagnosis','repairing']){w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-activation',event:'progress',payload:{phase}}}));assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).activationStage,phase);assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).completed,false);}w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:w,data:{type:'andersons-activation',event:'complete',payload:{phase:'finish'}}}));assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).completed,false);w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-activation',event:'complete',payload:{phase:'finish'}}}));assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).activationCompleted,true);w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-activation',event:'failed'}}));assert.equal(w.localStorage.getItem('andersons-save-v1'),null);
});

test('Ativação concluída de versões anteriores continua para O grande roubo',t=>{
 const saved={...checkpoint,phase:'activation',installationMode:'campaign',caseId:'existing',workshopCompleted:true,activationCompleted:true};const dom=fixture(t,saved),d=dom.window.document;assert.match(d.querySelector('[data-action="continue"]').textContent,/O grande roubo/);d.querySelector('[data-action="continue"]').click();assert.match(d.querySelector('#workshop-frame').src,/heist\.html\?mode=campaign/);const next=JSON.parse(dom.window.localStorage.getItem('andersons-save-v1'));assert.equal(next.phase,'heist');assert.equal(next.caseId,'existing');assert.equal(next.completed,false);
});
test('Ato 4 isolado não altera a campanha após prisão ou conclusão',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="heist-solo"]').click();const frame=d.querySelector('#workshop-frame');assert.match(frame.src,/heist\.html\?mode=solo/);for(const event of ['complete','failed'])w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-heist',event,payload:{phase:event==='complete'?'finish':'caught'}}}));assert.deepEqual(JSON.parse(w.localStorage.getItem('andersons-save-v1')),checkpoint);
});
test('Ponte do Ato 4 rejeita origem errada e encerra campanha apenas por mensagem do próprio frame',t=>{
 const saved={...checkpoint,phase:'activation',installationMode:'campaign',caseId:'existing',workshopCompleted:true,activationCompleted:true},dom=fixture(t,saved),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');w.dispatchEvent(new w.MessageEvent('message',{origin:'https://other.test',source:frame.contentWindow,data:{type:'andersons-heist',event:'failed'}}));assert.ok(w.localStorage.getItem('andersons-save-v1'));w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-heist',event:'complete',payload:{phase:'finish'}}}));assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).heistCompleted,true);w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-heist',event:'failed',payload:{phase:'caught'}}}));assert.equal(w.localStorage.getItem('andersons-save-v1'),null);
});

test('Save concluído do Ato 4 continua no Ato 5 com o mesmo caso e cliente',t=>{
 const saved={...checkpoint,phase:'heist',installationMode:'campaign',caseId:'case-four',heistCompleted:true},dom=fixture(t,saved),d=dom.window.document;
 assert.match(d.querySelector('[data-action="continue"]').textContent,/Atuação anti furto/);d.querySelector('[data-action="continue"]').click();assert.match(d.querySelector('#workshop-frame').src,/recovery\.html\?mode=campaign/);const next=JSON.parse(dom.window.localStorage.getItem('andersons-save-v1'));assert.equal(next.phase,'recovery');assert.equal(next.caseId,saved.caseId);assert.equal(next.form.name,saved.form.name);assert.equal(next.completed,false);
});
test('Fim do Ato 4 só libera o Ato 5 após conclusão do próprio frame',t=>{
 const saved={...checkpoint,phase:'heist',completed:false,installationMode:'campaign',caseId:'case-four'},dom=fixture(t,saved),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');const send=(event,payload)=>w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-heist',event,payload}}));send('recovery');assert.match(d.querySelector('#workshop-frame').src,/heist/);send('complete',{phase:'finish'});send('recovery');assert.match(d.querySelector('#workshop-frame').src,/recovery\.html/);
});
test('Ato 5 isolado preserva o save da campanha após falha ou conclusão',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="recovery-solo"]').click();const frame=d.querySelector('#workshop-frame');assert.match(frame.src,/recovery\.html\?mode=solo/);for(const event of ['complete','failed'])w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-recovery',event,payload:{phase:event==='complete'?'finish':'lost'}}}));assert.deepEqual(JSON.parse(w.localStorage.getItem('andersons-save-v1')),checkpoint);
});
test('Ato 5 retoma páginas e corrida; ponte rejeita outra janela, origem, tipo e conclusão incompleta',t=>{
 const saved={...checkpoint,phase:'recovery',completed:false,installationMode:'campaign',caseId:'case-five',heistCompleted:true},dom=fixture(t,saved),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');const send=(event,payload={},origin='https://game.test',source=frame.contentWindow,type='andersons-recovery')=>w.dispatchEvent(new w.MessageEvent('message',{origin,source,data:{type,event,payload}}));send('failed',{},'https://other.test');send('failed',{},'https://game.test',w);send('failed',{},'https://game.test',frame.contentWindow,'andersons-heist');send('complete',{phase:'tracking'});assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).completed,false);send('progress',{phase:'lecture'});assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).recoveryStage,'lecture');send('progress',{phase:'chase'});assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).recoveryStage,'chase');send('complete',{phase:'finish'});assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).recoveryCompleted,true);send('menu');assert.match(d.querySelector('[data-action="continue"]').textContent,/Rever o encerramento/);d.querySelector('[data-action="continue"]').click();assert.match(d.querySelector('#workshop-frame').src,/recovery\.html/);assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).completed,true);
});
test('Falha da campanha no Ato 5 apaga o expediente e bloqueia conclusão atrasada',t=>{
 const saved={...checkpoint,phase:'recovery',completed:false,installationMode:'campaign',caseId:'case-five',heistCompleted:true},dom=fixture(t,saved),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');for(const event of ['failed','complete'])w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-recovery',event,payload:{phase:event==='complete'?'finish':'lost'}}}));assert.equal(w.localStorage.getItem('andersons-save-v1'),null);
});
test('Repetir o desafio após a vitória abre uma partida isolada e preserva a campanha concluída',t=>{
 const saved={...checkpoint,phase:'recovery',completed:false,installationMode:'campaign',caseId:'case-five',heistCompleted:true},dom=fixture(t,saved),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');const send=(event,payload)=>w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-recovery',event,payload}}));send('complete',{phase:'finish'});const finished=w.localStorage.getItem('andersons-save-v1');send('replay');assert.match(d.querySelector('#workshop-frame').src,/recovery\.html\?mode=solo/);assert.equal(w.localStorage.getItem('andersons-save-v1'),finished);
});
test('Preferência de som é encaminhada ao frame do Ato 5',t=>{
 const dom=fixture(t),w=dom.window,d=w.document;d.querySelector('[data-action="recovery-solo"]').click();const frame=d.querySelector('#workshop-frame'),received=[];frame.contentWindow.postMessage=data=>received.push(data);w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-recovery',event:'sound'}}));assert.equal(received.length,1);assert.equal(received[0].type,'andersons-context');assert.equal(received[0].payload.prefs.sound,false);
});

test('Efetivado conserva os atos anteriores após demissão e só aceita conclusão depois do retry do próprio frame',t=>{
 const dom=fixture(t,checkpoint,'normal'),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();const frame=d.querySelector('#workshop-frame');
 const send=(event,payload={},source=frame.contentWindow)=>w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source,data:{type:'andersons-workshop',event,payload}}));
 send('failed',{phase:'explosion'});assert.ok(w.localStorage.getItem('andersons-save-v1'));
 send('complete',{phase:'finish'});assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).workshopCompleted,undefined);
 send('retry',{phase:'wiring'},w);send('complete',{phase:'finish'});assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).workshopCompleted,undefined);
 send('retry',{phase:'wiring'});send('complete',{phase:'finish'});assert.equal(JSON.parse(w.localStorage.getItem('andersons-save-v1')).workshopCompleted,true);
});

test('Horário corrigido pelo cliente e checkpoint do calendário funcionam pela interface e contam a retomada',t=>{
 const customer=Array.from({length:10},(_,i)=>makeClient('custom-'+i)).find(c=>c.variant===1);
 const saved={...checkpoint,phase:'calendar',completed:false,caseId:'calendar-retry',intakeMessages:[],customer,form:{name:customer.name,vehicle:customer.vehicle,availability:customer.availability}};
 const dom=fixture(t,saved,'normal'),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();
 const tomorrow=core.addDays(saved.baseDate,1);d.querySelector(`[data-date="${tomorrow}"]`).click();d.querySelector('[data-time="12:00"]').click();d.querySelector('[data-action="confirm-booking"]').click();assert.match(d.querySelector('#modal-root').textContent,/14 horas/);
 d.querySelector('[data-action="booking-fail"]').click();assert.ok(d.querySelector('[data-action="retry-checkpoint"]'));d.querySelector('[data-action="retry-checkpoint"]').click();
 d.querySelector('[data-time="14:00"]').click();d.querySelector('[data-action="confirm-booking"]').click();const final=JSON.parse(w.localStorage.getItem('andersons-save-v1'));
 assert.equal(final.phase,'success');assert.equal(final.journey.acts[1].errors,1);assert.equal(final.journey.acts[1].retries,1);assert.equal(final.customer.time,'14:00');
});

test('A instalação repassa ocultação e qualidade de sinal para o contexto dos atos seguintes',t=>{
 const dom=fixture(t,checkpoint,'normal'),w=dom.window,d=w.document;d.querySelector('[data-action="continue"]').click();let frame=d.querySelector('#workshop-frame');
 const send=(event,payload)=>w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-workshop',event,payload}}));
 send('installation',{location:'rear-trim',tidy:true,signalChecked:true});send('complete',{phase:'finish',installationLocation:'rear-trim'});send('activate',{installationLocation:'rear-trim'});frame=d.querySelector('#workshop-frame');const received=[];frame.contentWindow.postMessage=x=>received.push(x);
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://game.test',source:frame.contentWindow,data:{type:'andersons-activation',event:'ready'}}));
 assert.equal(received[0].payload.installation.location,'rear-trim');assert.equal(received[0].payload.installation.signal,100);assert.equal(received[0].payload.journey.installation.quality,100);
});
