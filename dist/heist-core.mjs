import {hitsRoadwork} from './city-details.mjs?v=1.1.1';
import {moveScreenCar} from './screen-driving.mjs?v=1.1.1';
import {hashCase,random} from './lt32-core.mjs?v=1.1.1';
export const HEIST_VERSION=1;
export const WORLD={width:2200,height:1480,roadX:[320,840,1360,1880],roadY:[270,730,1190],roadWidth:108};
export const TARGET={x:1510,y:790,angle:0,color:'#64a1ad',model:'Ford Ka'};
export const SPAWN={x:360,y:1190,angle:-Math.PI/2};
export const BUILDINGS=Object.freeze([
 {x:35,y:52,w:180,h:125,name:'ARMAZÉM',color:'#8c7760'},
 {x:430,y:52,w:290,h:125,name:'PADARIA ANDERSON',color:'#aa8664'},
 {x:950,y:46,w:292,h:136,name:'SUPERMERCADO',color:'#6e8978'},
 {x:1470,y:40,w:280,h:142,name:'POLÍCIA',color:'#6b8290'},
 {x:1990,y:55,w:165,h:120,name:'GARAGEM',color:'#8c7868'},
 {x:40,y:386,w:174,h:232,name:'RESIDENCIAL',color:'#957967'},
 {x:430,y:390,w:290,h:230,name:'ANDERSON & ANDERSON',color:'#9d9d79'},
 {x:955,y:385,w:285,h:244,name:'OFICINA DO ANDERSON',color:'#9e7556'},
 {x:1470,y:390,w:278,h:234,name:'CINEMA: SUMIU O KA',color:'#887982'},
 {x:2000,y:390,w:154,h:224,name:'HOTEL',color:'#a28b72'},
 {x:45,y:850,w:168,h:230,name:'DEPÓSITO',color:'#718984'},
 {x:430,y:850,w:280,h:236,name:'SEGUROS ANDERSON',color:'#8e7967'},
 {x:980,y:872,w:245,h:195,name:'CAFÉ CENTRAL',color:'#a08760'},
 {x:1500,y:860,w:250,h:210,name:'AUTOPEÇAS',color:'#8b7768'},
 {x:1990,y:851,w:155,h:238,name:'LOJAS',color:'#7d8d80'},
 {x:40,y:1310,w:180,h:120,name:'CASAS',color:'#997e69'},
 {x:450,y:1310,w:270,h:122,name:'RESIDENCIAL SUL',color:'#718584'},
 {x:990,y:1320,w:240,h:105,name:'FARMÁCIA',color:'#8b9072'},
 {x:1500,y:1320,w:250,h:115,name:'ANDERSONS CORP.',color:'#827c69'},
 {x:1995,y:1310,w:155,h:125,name:'POSTO',color:'#a18769'}
]);
export const TOKENS=Object.freeze([
 {id:'triangle',symbol:'△',name:'Triângulo'}, {id:'circle',symbol:'○',name:'Círculo'},
 {id:'diamond',symbol:'◇',name:'Losango'}, {id:'star',symbol:'★',name:'Estrela'},
 {id:'moon',symbol:'☾',name:'Lua'}, {id:'plus',symbol:'+',name:'Cruz'},
 {id:'hex',symbol:'⬡',name:'Hexágono'}, {id:'wave',symbol:'≈',name:'Ondas'},
 {id:'square',symbol:'□',name:'Quadrado'}, {id:'infinity',symbol:'∞',name:'Infinito'},
 {id:'spark',symbol:'✦',name:'Brilho'}, {id:'sun',symbol:'⊙',name:'Sol'}
]);
function shuffled(items,rng){const a=[...items];for(let i=a.length-1;i;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makePuzzle(seed){const rng=random(seed),tokens=shuffled(TOKENS,rng),colors=shuffled(['#d79074','#a7b776','#72a4b8','#c4a1b3','#d8c581','#92b7a5','#c9806b','#83a0ce','#c1bd9a','#b29b79','#99bdc5','#a5a3bf'],rng);return {wires:tokens.map((t,i)=>({id:'wire-'+i,letter:String.fromCharCode(65+i),token:t.id,color:colors[i],bend:Math.round(rng()*150)-75})),sockets:shuffled(TOKENS,rng).slice(0,3).map((t,i)=>({id:'socket-'+i,token:t.id,name:['I','II','III'][i]}))};}
export function createHeist(caseId){const seed=hashCase(caseId);return {version:HEIST_VERSION,caseId,seed,phase:'intro',actor:{...SPAWN},car:{...TARGET,speed:0},puzzle:makePuzzle(seed),selected:null,connections:{},discovered:false,walking:false,path:[],elapsed:0,phaseTime:0,collisionCount:0,collisionTime:0,escapeView:null,failure:null};}
export const nearCar=s=>Math.hypot(s.actor.x-TARGET.x,s.actor.y-TARGET.y)<=104;
export function collides(x,y,radius=12){if(x<radius||y<radius||x>WORLD.width-radius||y>WORLD.height-radius)return true;return hitsRoadwork(x,y,radius)||BUILDINGS.some(b=>x+radius>b.x&&x-radius<b.x+b.w&&y+radius>b.y&&y-radius<b.y+b.h);}
export function defaultView(){return {x:TARGET.x-540,y:TARGET.y-340,w:1080,h:680};}
export function validView(v){return v&&[v.x,v.y,v.w,v.h].every(Number.isFinite)&&v.w>=300&&v.w<=2400&&v.h>=200&&v.h<=2000&&TARGET.x>v.x&&TARGET.x<v.x+v.w&&TARGET.y>v.y&&TARGET.y<v.y+v.h;}
const caught=(s,reason)=>({...s,phase:'caught',phaseTime:0,selected:null,path:[],failure:reason});
export function applyHeistAction(s,a){
 if(['caught','gameover','finish'].includes(s.phase))return s;
 if(a.type==='begin'&&s.phase==='intro')return {...s,phase:'foot',phaseTime:0};
 if(a.type==='enter'&&s.phase==='foot'&&nearCar(s))return {...s,phase:'interior',phaseTime:0,path:[],escapeView:validView(a.view)?{...a.view}:defaultView(),discovered:true};
 if(a.type==='open-panel'&&s.phase==='interior')return {...s,phase:'wiring',phaseTime:0};
 if(a.type==='select-wire'&&s.phase==='wiring'&&s.puzzle.wires.some(w=>w.id===a.id)&&!Object.values(s.connections).includes(a.id))return {...s,selected:a.id};
 if(a.type==='connect'&&s.phase==='wiring'){
  const source=s.puzzle.wires.find(w=>w.id===s.selected),socket=s.puzzle.sockets.find(t=>t.id===a.id);
  if(!source||!socket||s.connections[socket.id])return s;
  if(source.token!==socket.token)return caught(s,'O circuito errado disparou o alarme do carro. A polícia chegou antes de Anderson sair.');
  return {...s,selected:null,connections:{...s.connections,[socket.id]:source.id}};
 }
 if(a.type==='start-engine'&&s.phase==='wiring'){
  if(Object.keys(s.connections).length!==3)return caught(s,'Anderson tentou dar partida com o painel incompleto. O alarme entregou tudo.');
  return {...s,phase:'starting',phaseTime:0};
 }
 if(a.type==='walk-to'&&s.phase==='foot'){const path=findPath(s.actor,{x:a.x,y:a.y});return {...s,path};}
 return s;
}
function moveActor(actor,dx,dy){let next={...actor};if(!collides(next.x+dx,next.y))next.x+=dx;if(!collides(next.x,next.y+dy))next.y+=dy;return next;}
export function advanceHeist(s,input={},seconds=0){
 const dt=Math.min(.05,Math.max(0,Number(seconds)||0));if(!dt||s.phase==='gameover'||s.phase==='finish')return s;
 let n={...s,elapsed:s.elapsed+dt,phaseTime:s.phaseTime+dt,collisionTime:Math.max(0,(s.collisionTime||0)-dt)};
 if(s.phase==='caught'){if(n.phaseTime>=2.8)n.phase='gameover';return n;}
 if(s.phase==='starting'){if(n.phaseTime>=1.2){n.phase='drive';n.phaseTime=0;}return n;}
 if(s.phase==='foot'){
  let dx=Number(input.x)||0,dy=Number(input.y)||0,path=[...s.path],distance=Math.hypot(dx,dy);
  if(distance>.05)path=[];
  else if(path.length){const p=path[0];dx=p.x-s.actor.x;dy=p.y-s.actor.y;distance=Math.hypot(dx,dy);if(distance<10){path.shift();dx=0;dy=0;distance=0;}}
  if(distance){const speed=input.run?270:190,step=Math.min(speed*dt,s.path.length&&!input.x&&!input.y?distance:1000);n.actor=moveActor(s.actor,dx/distance*step,dy/distance*step);n.actor.angle=Math.atan2(dy,dx);}
  n.walking=!!distance;n.path=path;if(Math.hypot(n.actor.x-TARGET.x,n.actor.y-TARGET.y)<255)n.discovered=true;
 }
 if(s.phase==='drive'){
  const motion=moveScreenCar(s.car,input,dt,{speed:260,turboSpeed:365,blocked:(x,y)=>hitsRoadwork(x,y,24)||BUILDINGS.some(b=>x+24>b.x&&x-24<b.x+b.w&&y+24>b.y&&y-24<b.y+b.h)});
  n.car=motion.car;if(motion.hit){if(!(s.collisionTime>0))n.collisionCount=(s.collisionCount||0)+1;n.collisionTime=.65;}
  const view=s.escapeView||defaultView();if(n.car.x<view.x-42||n.car.x>view.x+view.w+42||n.car.y<view.y-42||n.car.y>view.y+view.h+42){n.phase='finish';n.phaseTime=0;n.car.speed=0;}
 }
 return n;
}
export function findPath(from,to){
 if(!Number.isFinite(to.x)||!Number.isFinite(to.y))return [];
 const grid=40,cols=Math.ceil(WORLD.width/grid),rows=Math.ceil(WORLD.height/grid),point=i=>({x:(i%cols)*grid+grid/2,y:Math.floor(i/cols)*grid+grid/2}),key=(x,y)=>y*cols+x;
 const cell=p=>({x:Math.max(0,Math.min(cols-1,Math.floor(p.x/grid))),y:Math.max(0,Math.min(rows-1,Math.floor(p.y/grid)))});
 const start=cell(from),goal=cell(to),startKey=key(start.x,start.y),queue=[startKey],parents=new Map([[startKey,null]]);let best=startKey,bestDistance=Infinity;
 for(let head=0;head<queue.length;head++){
  const current=queue[head],p=point(current),distance=Math.hypot(p.x-to.x,p.y-to.y);if(distance<bestDistance){best=current;bestDistance=distance;}if(current===key(goal.x,goal.y)){best=current;break;}
  const x=current%cols,y=Math.floor(current/cols);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,id=key(nx,ny);if(nx<0||ny<0||nx>=cols||ny>=rows||parents.has(id))continue;const next=point(id);if(collides(next.x,next.y,15))continue;parents.set(id,current);queue.push(id);}
 }
 const path=[];let at=best;while(at!==null&&at!==startKey){path.unshift(point(at));at=parents.get(at)??null;}if(path.length&&!collides(to.x,to.y,15)&&Math.hypot(path.at(-1).x-to.x,path.at(-1).y-to.y)<60)path.push({x:to.x,y:to.y});return path;
}
export function restoreHeist(raw,caseId){
 if(!raw||raw.version!==HEIST_VERSION||raw.caseId!==caseId||!['intro','foot','interior','wiring','starting','drive','finish'].includes(raw.phase))return null;
 const s=createHeist(caseId),actor=raw.actor,car=raw.car;if(!actor||!car||![actor.x,actor.y,actor.angle,car.x,car.y,car.angle,car.speed].every(Number.isFinite))return null;
 if(collides(actor.x,actor.y)||Math.abs(car.x)>5000||Math.abs(car.y)>5000||Math.abs(car.speed)>400)return null;
 if(!raw.connections||typeof raw.connections!=='object')return null;
 const connections={};for(const [id,source]of Object.entries(raw.connections)){const socket=s.puzzle.sockets.find(p=>p.id===id),wire=s.puzzle.wires.find(p=>p.id===source);if(!socket||!wire||socket.token!==wire.token)return null;connections[id]=source;}
 if(['starting','drive','finish'].includes(raw.phase)&&Object.keys(connections).length!==3)return null;
 if(['interior','wiring','starting','drive','finish'].includes(raw.phase)&&!validView(raw.escapeView))return null;
 if(['intro','foot','interior'].includes(raw.phase)&&Object.keys(connections).length)return null;
 return {...s,phase:raw.phase,actor:{x:actor.x,y:actor.y,angle:actor.angle},car:{...s.car,x:car.x,y:car.y,angle:car.angle,speed:car.speed},connections,discovered:!!raw.discovered,elapsed:Math.max(0,Number(raw.elapsed)||0),phaseTime:Math.max(0,Number(raw.phaseTime)||0),collisionCount:Math.max(0,Number(raw.collisionCount)||0),escapeView:raw.escapeView?{...raw.escapeView}:null};
}
export function locationName(p){const y=WORLD.roadY.reduce((a,b)=>Math.abs(a-p.y)<Math.abs(b-p.y)?a:b),x=WORLD.roadX.reduce((a,b)=>Math.abs(a-p.x)<Math.abs(b-p.x)?a:b);if(Math.abs(p.y-y)<100)return {270:'AVENIDA NORTE',730:'RUA DAS OFICINAS',1190:'AVENIDA CENTRAL'}[y];return {320:'RUA DO MERCADO',840:'RUA DA PRAÇA',1360:'RUA DO CINEMA',1880:'RUA DAS GARAGENS'}[x];}
