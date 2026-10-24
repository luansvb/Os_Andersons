import test from 'node:test';
import assert from 'node:assert/strict';
import {compilePhoneCss} from '../scripts/build-mobile.mjs';

test('wide mobile fallback preserves phone cascade, units and motion preferences',()=>{
 const result=compilePhoneCss(`@import url('fonts.css');
  .card{padding:16px;transform:translateX(-8px);content:"16px"}
  @media(max-width:1000px){.card{gap:12px}}
  @media(max-width:760px){.card{grid-template-columns:1fr}}
  @media(max-width:375px){.too-small{display:none}}
  @media(min-width:1450px){.desktop{display:grid}}
  @media(max-height:600px) and (min-width:651px){.landscape{display:none}}
  @media(prefers-reduced-motion:reduce){.card{animation:none}}
  @keyframes slide{from{transform:translateY(32px)}to{transform:translateY(0)}}`);
 assert.match(result,/padding:1rem/);assert.match(result,/translateX\(-0.5rem\)/);
 assert.match(result,/content:"16px"/);assert.match(result,/gap:0.75rem/);
 assert.match(result,/grid-template-columns:1fr/);
 assert.doesNotMatch(result,/@import|too-small|desktop|landscape/);
 assert.match(result,/@media \(prefers-reduced-motion:reduce\)/);
 assert.match(result,/@keyframes slide\{from\{transform:translateY\(2rem\)/);
});
