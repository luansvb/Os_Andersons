import {portrait as applicantPortrait} from './heist-art.mjs?v=1.1.0';
import {ACT_NAMES,DIFFICULTIES,difficultyFor,emptyMetrics,sanitizeMetrics,pressureMood,MOOD_LABELS,reactiveLine,scoreReport,mergeMetrics} from './career-core.mjs?v=1.1.0';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
export function portrait(name='cat',mood='calm',extra=''){
 const label={cat:'Cat',bear:'Bear careca',ro:'Rô'}[name]||'Cat';
 return `<span class="character-face face-${name} mood-${mood} ${extra}" data-portrait="${name}" role="img" aria-label="${label}: ${MOOD_LABELS[mood]||mood}"></span>`;
}
export function difficultyMarkup(selected='normal'){
 return `<fieldset class="difficulty-picker"><legend>Escolha seu vínculo com a empresa</legend><div>${DIFFICULTIES.map(d=>`<button type="button" data-action="difficulty" data-id="${d.id}" aria-pressed="${selected===d.id}" class="${selected===d.id?'selected':''}"><strong>${d.name}</strong><span>${d.description}</span></button>`).join('')}</div></fieldset>`;
}
export class ShiftSession{
 constructor({act,context={},tell=()=>{},onMetrics=null}){
  this.act=act;this.context=context;this.tell=tell;this.onMetrics=onMetrics;
  this.profile=difficultyFor(context.difficulty||context.journey?.difficulty||context.prefs?.difficulty);
  this.key=`andersons-shift-v2:${context.mode||'campaign'}:${context.caseId}:${act}`;
  const saved=read(this.key,{});
  this.metrics=sanitizeMetrics(saved.metrics||context.journey?.acts?.[act]);this.snapshot=saved.snapshot||null;this.pendingRetry=!!saved.pendingRetry;
  this.idleMs=Number(saved.idleMs)||0;this.phase='';this.lastAction='';this.repeats=0;this.lastEmit=0;this.audio=null;this.beatMs=0;this.refreshMs=0;this.beat=0;this.mood='calm';
 }
 updateContext(context){this.context=context;}
 get canRetry(){return this.profile.checkpoints&&!!this.snapshot;}
 get pressure(){return Math.min(100,this.idleMs/this.profile.patienceMs*100+this.metrics.errors*7+Math.max(0,this.repeats-2)*8);}
 checkpoint(snapshot){
  if(!this.profile.checkpoints)return;
  this.snapshot=JSON.parse(JSON.stringify(snapshot));delete this.snapshot.journey;
  this.pendingRetry=false;this.persist();
 }
 persist(){write(this.key,{metrics:this.metrics,snapshot:this.snapshot,pendingRetry:this.pendingRetry,idleMs:this.idleMs});}
 emit(){this.persist();const payload={act:this.act,metrics:{...this.metrics}};this.onMetrics?.(payload);this.tell('metrics',payload);}
 record(action,{progress=false,imei=false,imeiCorrect=false,lecturePages=null}={}){
  if(this.metrics.completed)return;
  this.unlockAudio();this.metrics.actions++;
  this.repeats=this.lastAction===action?this.repeats+1:1;this.lastAction=action;
  if(imei){this.metrics.imeiAttempts++;this.metrics.imeiCorrect ||=imeiCorrect;}
  if(lecturePages!==null)this.metrics.lecturePages=Math.max(this.metrics.lecturePages,lecturePages);
  if(progress){this.idleMs=0;this.repeats=0;}
  this.emit();this.refresh();
 }
 collision(){this.metrics.collisions++;this.emit();}
 fail(){this.metrics.errors++;this.pendingRetry=true;this.emit();this.refresh('failed');}
 retry(){
  if(!this.canRetry)return null;
  this.metrics.retries++;this.pendingRetry=false;this.idleMs=0;this.repeats=0;this.emit();
  const snapshot=JSON.parse(JSON.stringify(this.snapshot));
  this.tell('retry',{phase:snapshot.phase});return snapshot;
 }
 finish(){if(!this.metrics.completed){this.metrics.completed=true;this.emit();}this.refresh('finish');}
 retryButton(){return this.canRetry?'<button class="checkpoint-button" data-action="retry-checkpoint">↶ Repetir deste checkpoint</button>':'';}
 markup(phase,{compact=false}={}){
  if(this.phase!==phase&&!['failed','explosion','caught','gameover','fired','lost'].includes(phase)){this.idleMs=0;this.repeats=0;}this.phase=phase;
  const complete=['finish','success'].includes(phase),mood=['failed','explosion','caught','gameover','fired','lost'].includes(phase)?'angry':pressureMood(this.pressure,complete),boss=this.act===3&&phase!=='imei'?'bear':this.act===5?'ro':'cat';
  this.mood=mood;return `<aside class="shift-bar ${compact?'shift-compact':''}" data-shift-bar aria-label="Supervisão e progresso">${portrait(boss,mood)}<div class="shift-patience"><div><strong>${boss==='bear'?'BEAR':boss==='ro'?'RÔ':'CAT'} · <span data-mood-label>${MOOD_LABELS[mood]}</span></strong><span data-patience-value>${Math.round(100-this.pressure)}%</span></div><div class="patience-track" role="meter" aria-label="Paciência da chefia" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(100-this.pressure)}"><i style="width:${100-this.pressure}%"></i></div><small>${esc(this.profile.name)} · ${this.profile.checkpoints?'Checkpoint ativo':'Sem checkpoints'}</small></div><p data-reactive-line>${esc(complete?'BOM TRABALHO, ANDERSON. PODE RESPIRAR.':reactiveLine(this.act,phase,this.lastAction.split(':')[0],this.repeats,this.pressure))}</p></aside>`;
 }
 refresh(phase=this.phase){
  this.phase=phase;const complete=['finish','success'].includes(phase),mood=['failed','explosion','caught','gameover','fired','lost'].includes(phase)?'angry':pressureMood(this.pressure,complete);
  for(const el of document.querySelectorAll('[data-portrait]:not([data-fixed-mood])')){
   for(const m of ['calm','suspicious','angry','happy'])el.classList.toggle('mood-'+m,m===mood);
   const name={cat:'Cat',bear:'Bear careca',ro:'Rô'}[el.dataset.portrait];el.setAttribute('aria-label',`${name}: ${MOOD_LABELS[mood]}`);
  }
  const bar=document.querySelector('[data-shift-bar]');if(!bar)return;
  this.mood=mood;const value=Math.round(100-this.pressure);bar.dataset.mood=mood;
  bar.querySelector('[data-mood-label]').textContent=MOOD_LABELS[mood];bar.querySelector('[data-patience-value]').textContent=value+'%';
  const meter=bar.querySelector('[role="meter"]');meter.setAttribute('aria-valuenow',value);meter.querySelector('i').style.width=value+'%';
  bar.querySelector('[data-reactive-line]').textContent=complete?'BOM TRABALHO, ANDERSON. PODE RESPIRAR.':reactiveLine(this.act,phase,this.lastAction.split(':')[0],this.repeats,this.pressure);
 }
 step(ms,phase,{waiting=false}={}){
  if(!Number.isFinite(ms)||ms<=0||this.pendingRetry||this.metrics.completed)return;
  const dt=Math.min(ms,2000);this.metrics.activeMs+=dt;
  if(phase!==this.phase){this.phase=phase;this.idleMs=0;this.repeats=0;}
  this.idleMs+=dt*(waiting?.15:1);this.beatMs+=dt;
  if(this.beatMs>=(this.act===5&&phase==='chase'?240:470)){this.beatMs=0;this.music(phase);}
  if(this.metrics.activeMs-this.lastEmit>3000){this.lastEmit=this.metrics.activeMs;this.emit();}
  this.refreshMs+=dt;if(this.refreshMs>=500){this.refreshMs=0;this.refresh(phase);}
 }
 unlockAudio(){
  if(this.context.prefs?.sound===false)return;
  try{this.audio??=new(window.AudioContext||window.webkitAudioContext)();if(this.audio.state==='suspended')this.audio.resume().catch(()=>{});}catch{}
 }
 tone(frequency,duration=.12,volume=.014,type='triangle'){
  if(!this.audio||this.context.prefs?.sound===false||document.hidden)return;
  try{const ctx=this.audio,o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime;o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+duration);}catch{}
 }
 music(phase){
  if(!['foot','drive','chase','countdown','wiring','hiding','maze','platform'].includes(phase))return;
  const fast=phase==='chase',notes=fast?[110,110,146.83,164.81,110,0,196,164.81]:[110,0,130.81,0,146.83,0,123.47,0],n=notes[this.beat++%notes.length];
  if(n)this.tone(n,fast?.18:.3,fast?.016:.009,'triangle');
 }
 cue(kind){this.unlockAudio();(kind==='window'?[660,880,1100]:kind==='near'?[440,660]:[220]).forEach((n,i)=>setTimeout(()=>this.tone(n,.17,.025),i*100));}
}
export function reportMarkup(journey,{solo=false}={}){
 const report=scoreReport(journey),acts=solo?report.acts.filter(a=>a.completed):report.acts;
 const minutes=Math.floor(report.activeMs/60000),seconds=Math.floor(report.activeMs/1000)%60;
 return `<section class="performance-report" aria-label="Relatório de desempenho"><header><span>RH / AVALIAÇÃO DO EXPEDIENTE</span><h2>${solo?'Missão avulsa concluída':esc(report.rank)}</h2><p>${solo?'Seu resultado nesta missão.':`Nota geral: ${report.score}/100 · ${esc(difficultyFor(journey?.difficulty).name)}`}</p></header><div class="performance-summary"><span><b>${minutes}:${String(seconds).padStart(2,'0')}</b>Tempo ativo</span><span><b>${report.errors}</b>Erros graves</span><span><b>${report.retries}</b>Retomadas</span><span><b>${report.collisions}</b>Colisões</span><span><b>${journey?.installation?.quality??'—'}${journey?.installation?'%':''}</b>Instalação</span></div><div class="performance-table-wrap"><table><thead><tr><th>Ato</th><th>Tempo</th><th>Erros</th><th>Nota</th></tr></thead><tbody>${acts.map(a=>`<tr><th>${a.act}. ${a.name}</th><td>${Math.floor(a.activeMs/60000)}:${String(Math.floor(a.activeMs/1000)%60).padStart(2,'0')}</td><td>${a.errors}</td><td>${a.completed?a.score+'/100':'—'}</td></tr>`).join('')}</tbody></table></div>${report.badges.length?`<div class="achievement-grid">${report.badges.map(b=>`<article><span aria-hidden="true">★</span><strong>${b.title}</strong><p>${b.detail}</p></article>`).join('')}</div>`:''}</section>`;
}
export function endingMarkup(journey){
 const r=scoreReport(journey);if(!r.completed)return '';
 const endings={promotion:['PROMOÇÃO APROVADA','A Cat assinou sua promoção. O Bear perguntou se você já terminou o próximo expediente. A Rô pediu para ninguém usar a palavra “roubo” sem ler o relato.'],retained:['VOCÊ CONTINUA EMPREGADO','A Cat guardou a carta de demissão. O Bear marcou uma reunião sobre produtividade. A Rô, por precaução, imprimiu mais 28 páginas.'],probation:['MAIS UMA CHANCE. SÓ MAIS UMA.','O carro voltou. Seu crachá também. A Cat carimbou “acompanhamento intensivo” e o Bear já está digitando.']};
 const [title,text]=endings[r.ending];
 return `<section class="career-ending"><div class="ending-faces">${portrait('cat','happy')}${portrait('bear','happy')}${portrait('ro','happy')}</div><small>FIM DO EXPEDIENTE</small><h2>${title}</h2><p>${text}</p></section><section class="after-credits"><div class="cv-photo">${applicantPortrait()}</div><div><small>CENA PÓS-CRÉDITOS / RH, NO DIA SEGUINTE</small><h3>“Meu nome é Anderson. Estão contratando?”</h3><p>O ladrão entrega o currículo. Experiência: encontrar veículos e trabalhar sob pressão.</p><blockquote>CAT: “Anderson? O nome já passou na primeira etapa.”</blockquote><strong>OS ANDERSONS VOLTAM NO PRÓXIMO EXPEDIENTE.</strong></div></section>`;
}
export function completedJourney(context,act,metrics){return mergeMetrics(context.journey,act,metrics);}
export function rememberReport(journey){
 const report=scoreReport(journey);if(!report.completed)return;
 const records=read('andersons-records-v2',[]).filter(r=>r.caseId!==journey.caseId);
 records.unshift({caseId:journey.caseId,date:new Date().toISOString(),difficulty:journey.difficulty,score:report.score,rank:report.rank,badges:report.badges,errors:report.errors});
 write('andersons-records-v2',records.slice(0,12));const unlocked=new Map(read('andersons-achievements-v2',[]).map(b=>[b.id,b]));for(const b of report.badges)unlocked.set(b.id,b);write('andersons-achievements-v2',[...unlocked.values()]);
}
export function recordsMarkup(){
 const records=read('andersons-records-v2',[]),badges=new Map(read('andersons-achievements-v2',[]).map(b=>[b.id,b]));for(const r of records)for(const b of r.badges||[])badges.set(b.id,b);
 return `<div class="records-board"><small>MURAL DA EMPRESA / NESTE NAVEGADOR</small><h2 id="modal-title">Seus expedientes</h2>${records.length?`<div class="achievement-grid">${[...badges.values()].map(b=>`<article><span>★</span><strong>${esc(b.title)}</strong><p>${esc(b.detail)}</p></article>`).join('')}</div><ol class="record-list">${records.map(r=>`<li><strong>${esc(r.rank)}</strong><span>${r.score}/100 · ${esc(difficultyFor(r.difficulty).name)} · ${r.errors} erros</span></li>`).join('')}</ol>`:'<p>Conclua a campanha para ganhar sua primeira avaliação. As conquistas ficam guardadas neste navegador.</p>'}<button class="checkpoint-button" data-action="close-modal">Voltar ao jogo</button></div>`;
}
