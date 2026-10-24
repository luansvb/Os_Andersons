import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {creditsMarkup,CAST,RELEASE} from '../dist/credits.mjs';

test('Créditos distinguem vitória na campanha de missão isolada e apresentam os três personagens',()=>{
 assert.equal(RELEASE,'1.1.2');assert.equal(CAST.length,3);
 const menu=new JSDOM(creditsMarkup()),campaign=new JSDOM(creditsMarkup({victory:true,campaign:true,closeAction:'close-help'})),solo=new JSDOM(creditsMarkup({victory:true}));
 assert.equal(menu.window.document.querySelectorAll('.credits-cast img').length,3);assert.match(menu.window.document.body.textContent,/Luan/);assert.doesNotMatch(menu.window.document.body.textContent,/Sobreviveu ao expediente inteiro/);
 assert.match(campaign.window.document.body.textContent,/FIM DO EXPEDIENTE/);assert.match(campaign.window.document.body.textContent,/Sobreviveu ao expediente inteiro/);assert.equal(campaign.window.document.querySelector('[aria-label="Fechar créditos"]').dataset.action,'close-help');assert.ok(campaign.window.document.querySelector('[data-action="menu"]'));assert.ok(campaign.window.document.querySelector('[data-action="replay"]'));
 assert.match(solo.window.document.body.textContent,/MISSÃO CUMPRIDA/);assert.doesNotMatch(solo.window.document.body.textContent,/Sobreviveu ao expediente inteiro/);for(const dom of [menu,campaign,solo])dom.window.close();
});
