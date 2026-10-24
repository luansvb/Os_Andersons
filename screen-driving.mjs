// Norte da tela é sempre cima. A orientação anterior nunca altera uma seta.
export const SCREEN_DIRECTIONS=Object.freeze({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]});
export const SCREEN_KEYS=Object.freeze({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',Shift:'shift',' ':'brake'});
export function screenPadMarkup(turbo=false){return `<div class="screen-pad-wrap"><button class="turbo-button ${turbo?'active':''}" data-action="turbo" aria-pressed="${turbo}" aria-label="${turbo?'Desativar':'Ativar'} turbo"><span>TURBO: ${turbo?'ON':'OFF'}</span><small>SHIFT</small></button><div class="direction-pad screen-pad" role="group" aria-label="Direção do carro na tela"><button class="up" data-pad="up" aria-label="Dirigir para cima na tela">↑</button><button class="left" data-pad="left" aria-label="Dirigir para a esquerda na tela">←</button><button class="brake" data-pad="brake" aria-label="Frear o carro">FREIO</button><button class="right" data-pad="right" aria-label="Dirigir para a direita na tela">→</button><button class="down" data-pad="down" aria-label="Dirigir para baixo na tela">↓</button><span class="pad-label">SETAS = DIREÇÃO NA TELA</span></div></div>`;}
export function moveScreenCar(car,input,seconds,{speed=260,turboSpeed=365,blocked=()=>false}={}){
 const dt=Math.min(.05,Math.max(0,Number(seconds)||0)),x=Math.max(-1,Math.min(1,Number(input.x)||0)),y=Math.max(-1,Math.min(1,Number(input.y)||0)),length=Math.hypot(x,y);
 if(!dt||!length||input.brake)return {car:{...car,speed:0},hit:false};
 const velocity=input.boost?turboSpeed:speed,angle=Math.atan2(y,x),nx=car.x+x/length*velocity*dt,ny=car.y+y/length*velocity*dt;
 if(blocked(nx,ny))return {car:{...car,angle,speed:0},hit:true};
 return {car:{...car,x:nx,y:ny,angle,speed:velocity},hit:false};
}
export function sampleScreenControls(keys,pointers,{now=0,tap=null,turbo=false}={}){
 const active=new Set([...keys.keys(),...pointers.values()].map(v=>typeof v==='string'?v:v.direction));
 if(![...active].some(k=>SCREEN_DIRECTIONS[k])&&tap&&tap.until>now)active.add(tap.direction);
 let x=0,y=0;for(const key of active){const direction=SCREEN_DIRECTIONS[key];if(direction){x+=direction[0];y+=direction[1];}}
 return {x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y)),brake:active.has('brake'),boost:turbo||active.has('shift'),run:active.has('shift')};
}
export function tapMotion(direction,started,now){return SCREEN_DIRECTIONS[direction]&&Number.isFinite(started)&&now-started>=0&&now-started<180?{direction,until:now+140}:null;}
