import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createJourney,mergeMetrics,installationSummary,installationEffects,recoveryRules,scoreReport,makeClient,pressureMood,reactiveLine} from '../dist/career-core.mjs';
import {createActivation,applyActivationAction,advanceActivation,challengeFor,taskFor,restoreActivation} from '../dist/activation-core.mjs';
import {createRecovery,advanceRecovery,routePosition} from '../dist/recovery-core.mjs';
import {installShift} from './ui-shift-fixture.mjs';

function completeRun(caseId='completed',difficulty='normal'){
 let run=createJourney(caseId,difficulty);
 for(let act=1;act<=5;act++)run=mergeMetrics(run,act,{activeMs:60000,completed:true,imeiAttempts:act===3?1:0,imeiCorrect:act===3});
 run.installation=installationSummary({location:'rear-trim',tidy:true,signalChecked:true});return run;
}
test('Capricho na instalação persiste como efeito na ativação e na janela da recuperação',()=>{
 const basic=installationSummary({location:'rear-side'}),good=installationSummary({location:'rear-trim',tidy:true,signalChecked:true});
 assert.equal(good.quality,100);assert.ok(good.quality>basic.quality);
 const a=createActivation('effects',{installation:good}),b=createActivation('effects',{installation:basic});
 assert.ok(a.positionDelay<b.positionDelay);assert.equal(a.positionDelay,13000);
 assert.ok(recoveryRules('normal',good).window>recoveryRules('normal',basic).window);
 assert.equal(installationEffects(good).locationAge,15);
});
test('As cinco conferências exigem ler os dados; erro demite e clicar em avançar não as pula',()=>{
 let s=createActivation('checks');s=applyActivationAction(s,{type:'imei',value:s.imei});let count=0;
 while(s.phase==='maze'){
  const check=challengeFor(s);
  if(check){count++;assert.equal(applyActivationAction(s,{type:'workflow',id:taskFor(s).id}),s);assert.equal(applyActivationAction(s,{type:'solve-check',id:'wrong'}).phase,'failed');s=applyActivationAction(s,{type:'solve-check',id:check.correct});assert.equal(challengeFor(s).solved,true);}
  s=applyActivationAction(s,{type:'workflow',id:taskFor(s).id});
 }
 assert.equal(count,5);assert.equal(s.phase,'platform');assert.ok(restoreActivation(s,s.caseId));assert.equal(restoreActivation({...s,checks:[]},s.caseId),null);
 const legacy=restoreActivation({...s,version:1,checks:undefined},s.caseId);assert.ok(legacy);assert.equal(legacy.checks.length,5);
});
test('Dificuldades alteram os prazos reais e a janela, sem depender de textos na interface',()=>{
 const training=recoveryRules('training'),normal=recoveryRules('normal'),strict=recoveryRules('probation');
 assert.ok(training.deadline>normal.deadline&&normal.deadline>strict.deadline);
 assert.ok(training.window>normal.window&&normal.window>strict.window);
 for(const difficulty of ['training','normal','probation']){
  let s=createRecovery('difficulty',{difficulty});s={...s,phase:'chase',patrol:{...routePosition(170),speed:180},reportAsked:true,classified:true,raceTime:s.rules.deadline-.01};
  assert.equal(advanceRecovery(s,{},.05).phase,'lost');
 }
});
test('O relatório diferencia tentativas, colisões, IMEI e finais, e não premia campanha incompleta',()=>{
 const run=completeRun(),perfect=scoreReport(run);assert.equal(perfect.score,100);assert.equal(perfect.ending,'promotion');assert.ok(perfect.badges.some(b=>b.id==='imei'));assert.ok(perfect.badges.some(b=>b.id==='driver'));
 const changed=mergeMetrics(run,5,{...run.acts[5],errors:6,retries:6,collisions:2});const report=scoreReport(changed);assert.equal(report.ending,'probation');assert.ok(report.score<perfect.score);assert.ok(!report.badges.some(b=>b.id==='clean'||b.id==='driver'));
 assert.equal(scoreReport(createJourney('new')).badges.length,0);
 assert.equal(mergeMetrics(run,9,{completed:true}),run);
 assert.equal(mergeMetrics(changed,5,{errors:0}).acts[5].errors,6);
});
test('Clientes variam nome, horário, mensagens corrigidas e áudio preservando o mesmo Ford Ka',()=>{
 const clients=Array.from({length:30},(_,i)=>makeClient('client-'+i));assert.equal(new Set(clients.map(c=>c.variant)).size,3);
 for(const c of clients){assert.equal(c.vehicle,'Ford Ka');assert.ok(['10:00','12:00','14:00'].includes(c.time));assert.equal(c.dayOffset,1);}
 const revised=clients.find(c=>c.variant===1);assert.match(revised.replies[1].at(-1),/Ford Ka/);assert.match(revised.replies[2].at(-1),/14 horas/);assert.equal(revised.time,'14:00');
});
test('Checkpoints conservam a etapa e contabilizam demissão e retomada; Contrato não permite retry',t=>{
 const dom=new JSDOM('<body></body>',{url:'https://game.test',runScripts:'outside-only'});t.after(()=>dom.window.close());installShift(dom.window);const {ShiftSession}=dom.window.testShift;
 const context={caseId:'retry',mode:'campaign',difficulty:'normal',prefs:{sound:false}},s=new ShiftSession({act:2,context});
 s.checkpoint({phase:'wiring',connections:{positive:'wire-2'}});s.fail();const resumed=s.retry();assert.equal(resumed.phase,'wiring');assert.equal(resumed.connections.positive,'wire-2');assert.equal(s.metrics.errors,1);assert.equal(s.metrics.retries,1);
 const reloaded=new ShiftSession({act:2,context});assert.equal(reloaded.metrics.errors,1);assert.equal(reloaded.metrics.retries,1);
 const strict=new ShiftSession({act:2,context:{...context,caseId:'strict',difficulty:'probation'}});strict.checkpoint({phase:'wiring'});strict.fail();assert.equal(strict.canRetry,false);assert.equal(strict.retry(),null);
});
test('Conquistas permanecem no mural depois que os 12 resultados recentes são substituídos',t=>{
 const dom=new JSDOM('<body></body>',{url:'https://game.test',runScripts:'outside-only'});t.after(()=>dom.window.close());installShift(dom.window);const {rememberReport,recordsMarkup}=dom.window.testShift;
 rememberReport(completeRun('first','probation'));for(let i=0;i<14;i++)rememberReport(completeRun('new-'+i));
 assert.equal(JSON.parse(dom.window.localStorage.getItem('andersons-records-v2')).length,12);assert.match(recordsMarkup(),/Contrato cumprido/);
});
test('A chefia reage a repetição e espera de GPS, com expressões distintas e aprovação ao concluir',()=>{
 assert.equal(pressureMood(0),'calm');assert.equal(pressureMood(40),'suspicious');assert.equal(pressureMood(80),'angry');assert.equal(pressureMood(80,true),'happy');assert.match(reactiveLine(3,'maze','workflow',3,0),/TRÊS VEZES/);assert.match(reactiveLine(3,'platform','command',1,0),/GPS/);
});
