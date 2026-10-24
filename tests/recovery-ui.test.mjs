import {installShift} from './ui-shift-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as core from '../dist/recovery-core.mjs';
import * as screen from '../dist/screen-driving.mjs';
import {creditsMarkup} from '../dist/credits.mjs';
import {LEGAL_SOURCES} from '../dist/ro-lecture.mjs';
const html=await readFile(new URL('../dist/recovery.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../dist/recovery.mjs',import.meta.url),'utf8')).replace(/^import[^\n]*\n/gm,'').replace(/tell\('ready'\);if\(parent===window\)initialize\([^\n]+\);/,"initialize(window.testPayload);");
function fixture(t,{mode='campaign',finished=true}={}){
 const dom=new JSDOM(html,{url:'https://game.test/recovery.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;w.scrollTo=()=>{};installShift(w);w.testCore=core;w.testScreen=screen;w.testCredits=creditsMarkup;w.testLegal=LEGAL_SOURCES;w.testPayload={caseId:'credits-case',mode,prefs:{sound:false,reduceMotion:true}};
 if(finished){const s=core.createRecovery('credits-case'),copy={text:core.positionText(s),at:0},saved={...s,phase:'finish',reportAsked:true,classified:true,platformOpen:true,copied:copy,sent:copy.text,patrol:{...core.routePosition(420),speed:0},raceTime:8,stable:2.2,commandsOpen:true,windowLeft:1.2,blockSent:true};w.localStorage.setItem(mode==='campaign'?'andersons-recovery-campaign-v1':'andersons-recovery-solo-v1',JSON.stringify(saved));}
 w.eval(`const {createJourney,installationEffects}=window.testCareer;const {ShiftSession,portrait,reportMarkup,endingMarkup,completedJourney}=window.testShift;const {sampleScreenControls,tapMotion,screenPadMarkup,SCREEN_KEYS}=window.testScreen;const {rulesFor,createRecovery,restoreRecovery,applyRecoveryAction,advanceRecovery,proximity,canBlock,roGuidance,positionText,locationFresh,ANSWERS,REPORT,RULES,RO_LECTURE}=window.testCore;const creditsMarkup=window.testCredits,LEGAL_SOURCES=window.testLegal,makeCity=()=>null,updateMap=()=>{},drawChase=(c,city,s)=>window.testLastState=s,mapMarkup=()=>'';\n${source}\nwindow.testTick=ms=>tick(last+ms);`);t.after(()=>w.close());return dom;
}
test('Vitória da campanha abre o encerramento, preserva a missão ao fechar e limpa o modal ao repetir',t=>{
 const dom=fixture(t),d=dom.window.document;d.querySelector('[data-action="credits"]').click();assert.match(d.querySelector('#recovery-modal').textContent,/FIM DO EXPEDIENTE/);assert.equal(d.querySelectorAll('.credits-cast img').length,3);assert.equal(d.querySelector('#recovery-app').inert,true);d.querySelector('#recovery-modal [data-action="close-help"]').click();assert.equal(d.querySelector('#recovery-app').inert,false);assert.match(d.querySelector('.recovery-ending').textContent,/RECUPERADO/);d.querySelector('[data-action="credits"]').click();d.querySelector('#recovery-modal [data-action="replay"]').click();assert.equal(d.querySelector('#recovery-modal').children.length,0);assert.equal(d.querySelector('#recovery-app').inert,false);assert.ok(d.querySelector('.alert-card'));
});
test('Encerramento não aparece antes da recuperação e missão isolada não afirma vencer a campanha inteira',t=>{
 const ongoing=fixture(t,{finished:false});assert.equal(ongoing.window.document.querySelector('[data-action="credits"]'),null);const solo=fixture(t,{mode:'recovery-free'}),d=solo.window.document;d.querySelector('[data-action="credits"]').click();assert.match(d.querySelector('#recovery-modal').textContent,/MISSÃO CUMPRIDA/);assert.doesNotMatch(d.querySelector('#recovery-modal').textContent,/Sobreviveu ao expediente inteiro/);
});

test('Largada desabilita Comandos e preserva a direção segurada e os botões de toque ao terminar a contagem',t=>{
 const dom=fixture(t,{finished:false}),w=dom.window,d=w.document;
 for(const selector of ['[data-action="attend"]','[data-action="answer"][data-index="1"]','[data-action="classify"][data-choice="furto"]','[data-action="open-platform"]','[data-action="copy-position"]','[data-action="paste-position"]','[data-action="send-position"]','[data-action="start-chase"]'])d.querySelector(selector).click();
 const commands=d.querySelector('[data-action="commands"]'),up=d.querySelector('[data-pad="up"]');assert.equal(commands.disabled,true);
 d.querySelector('#chase-canvas').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
 for(let i=0;i<65;i++)w.testTick(50);
 assert.equal(d.querySelector('[data-action="commands"]'),commands);assert.equal(d.querySelector('[data-pad="up"]'),up);assert.equal(commands.disabled,false);
 assert.equal(w.testLastState.phase,'chase');assert.ok(w.testLastState.patrol.x>core.routePosition(170).x+20);
 d.querySelector('#chase-canvas').dispatchEvent(new w.KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));
});
