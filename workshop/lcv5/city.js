// The streets and coordinates belong to a fictional training city.
export const CITY={width:1000,height:800,xs:[160,480,840],ys:[160,420,700],garage:{x:840,y:78},home:{x:160,y:700}};
export const ROAD_TEST=[{x:840,y:78},{x:840,y:160},{x:480,y:160},{x:160,y:160},{x:160,y:420},{x:160,y:700},{x:480,y:700},{x:840,y:700},{x:840,y:420},{x:840,y:160},{x:840,y:78}];
export const carAtHome=()=>({x:160,y:700,angle:-Math.PI/2,speed:0});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function onRoad(x,y){return x>=96&&x<=915&&y>=62&&y<=754&&(CITY.xs.some(v=>Math.abs(x-v)<48)||CITY.ys.some(v=>Math.abs(y-v)<48));}
export function drive(car,input,dt){
 dt=clamp(dt,0,.05);const throttle=(input.up?1:0)-(input.down?1:0),turn=(input.right?1:0)-(input.left?1:0);
 car.speed=clamp(car.speed+throttle*150*dt,-65,155);
 if(!throttle)car.speed*=Math.exp(-2.5*dt);if(input.brake)car.speed*=Math.exp(-13*dt);
 if(Math.abs(car.speed)<.3)car.speed=0;
 car.angle+=turn*2.2*dt*(car.speed<-.5?-1:1);
 const x=car.x+Math.cos(car.angle)*car.speed*dt,y=car.y+Math.sin(car.angle)*car.speed*dt;
 const bumped=!onRoad(x,y);if(bumped)car.speed*=.2;else {car.x=x;car.y=y;}
 return {bumped,arrived:Math.hypot(car.x-CITY.garage.x,car.y-CITY.garage.y)<39&&Math.abs(car.speed)<45};
}
export function routeToGarage(car){
 const nearest=(a,v)=>a.reduce((best,n)=>Math.abs(n-v)<Math.abs(best-v)?n:best,a[0]);
 const x=nearest(CITY.xs,car.x),y=nearest(CITY.ys,car.y),vertical=Math.abs(car.x-x)<Math.abs(car.y-y);
 const anchor=vertical?{x,y:car.y}:{x:car.x,y},node={x,y};
 return [anchor,node,{x:840,y},{x:840,y:160},{...CITY.garage}].filter((p,i,a)=>i===0||p.x!==a[i-1].x||p.y!==a[i-1].y);
}
export function followRoute(car,route,progress,dt,speed,{loop=false}={}){
 let budget=Math.max(0,dt*speed),distance=0,finished=false;
 while(budget>0&&progress.index<route.length){
  const target=route[progress.index],dx=target.x-car.x,dy=target.y-car.y,d=Math.hypot(dx,dy);
  if(d<.001){progress.index++;continue;}
  const step=Math.min(budget,d);car.angle=Math.atan2(dy,dx);car.x+=dx/d*step;car.y+=dy/d*step;budget-=step;distance+=step;
  if(step>=d-.001)progress.index++;
 }
 if(progress.index>=route.length){finished=true;if(loop){progress.laps=(progress.laps||0)+1;progress.index=1;}}
 car.speed=speed;return {distance,finished};
}
export function mapLocation(car){return {latitude:-25.445407+(78-car.y)*.000012,longitude:-49.264770+(car.x-840)*.000012,address:Math.abs(car.x-840)<55?'Avenida da Oficina · cidade de treinamento':car.y>550?'Rua das Araucárias · cidade de treinamento':car.y<270?'Avenida Central · cidade de treinamento':'Rua do Parque · cidade de treinamento'};}

export function createCityPainter(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return {draw(){},cinematic(){}};
 canvas.width=1000;canvas.height=800;
 const c=ctx;
 function rect(x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
 function text(value,x,y,size=13,color='#6c7b76',align='left'){c.fillStyle=color;c.font=`600 ${size}px system-ui`;c.textAlign=align;c.fillText(value,x,y);}
 function tree(x,y,s=1){rect(x-3,y,6,19,'#8c8267',2);c.fillStyle='#679b76';c.beginPath();c.arc(x,y-3,16*s,0,Math.PI*2);c.fill();c.fillStyle='#7eae84';c.beginPath();c.arc(x-5,y-8,10*s,0,Math.PI*2);c.fill();}
 function building(x,y,w,h,color,label){rect(x+5,y+8,w,h,'#9ba99b44',7);rect(x,y,w,h,color,7);rect(x+6,y+6,w-12,h-12,'#ffffff19',5);for(let i=x+12;i<x+w-12;i+=24)rect(i,y+15,12,17,'#f9f1d0',2);text(label,x+w/2,y+h-14,12,'#172a2f','center');}
 function car(x,y,a,color='#ed9558',buzzer=false,blocked=false,scale=1){
  c.save();c.translate(x,y);c.rotate(a);c.scale(scale,scale);rect(-19,-13,39,26,'#203c4c33',7);rect(-20,-12,38,23,color,6);rect(-8,-10,14,19,'#dcebec',3);rect(7,-9,7,17,'#294959',2);rect(-16,-9,6,17,'#355567',2);rect(15,-10,4,5,'#fff4cb',1);rect(15,5,4,5,'#fff4cb',1);rect(-19,-11,3,4,'#d06365',1);rect(-19,6,3,4,'#d06365',1);
  if(blocked){c.strokeStyle='#ec6570';c.lineWidth=3;c.beginPath();c.arc(0,0,27,0,Math.PI*2);c.stroke();}if(buzzer){c.strokeStyle='#f3bd50';c.lineWidth=2;for(const r of [29,36]){c.beginPath();c.arc(0,0,r,-.8,.8);c.stroke();}}
  c.restore();
 }
 function person(x,y,walk=0,color='#277e85'){
  c.strokeStyle='#344e55';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(x,y-15);c.lineTo(x-7-Math.sin(walk)*3,y);c.moveTo(x,y-15);c.lineTo(x+7+Math.sin(walk)*3,y);c.stroke();rect(x-10,y-40,20,26,color,5);c.fillStyle='#e1b291';c.beginPath();c.arc(x,y-49,9,0,Math.PI*2);c.fill();c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.moveTo(x-8,y-34);c.lineTo(x-17,y-21);c.moveTo(x+8,y-34);c.lineTo(x+17,y-21);c.stroke();
 }
 function base(){
  rect(0,0,1000,800,'#182b31');
  for(const x of CITY.xs){rect(x-58,44,116,730,'#2e4146',4);rect(x-45,44,90,730,'#41565b');}
  for(const y of CITY.ys){rect(73,y-58,855,116,'#2e4146',4);rect(73,y-45,855,90,'#41565b');}
  c.strokeStyle='#e3c789';c.lineWidth=3;c.setLineDash([12,17]);for(const x of CITY.xs){c.beginPath();c.moveTo(x,55);c.lineTo(x,760);c.stroke();}for(const y of CITY.ys){c.beginPath();c.moveTo(80,y);c.lineTo(920,y);c.stroke();}c.setLineDash([]);
  for(const x of CITY.xs)for(const y of CITY.ys){rect(x-45,y-45,90,90,'#41565b');for(let i=-30;i<=30;i+=12){rect(x+i,y-60,7,15,'#81948b',1);rect(x+i,y+45,7,15,'#81948b',1);}}
  building(225,230,185,105,'#dcb693','MERCADO');building(560,225,190,110,'#b5c7d5','CENTRO COMERCIAL');building(235,500,155,100,'#bdc9ae','CASA DO CLIENTE');building(575,510,170,115,'#dbc2ab','CAFETERIA');
  rect(235,350,175,14,'#b8ca9e',4);for(const x of [250,290,330,375,590,640,710])tree(x,x>500?365:330,.9);for(const y of [240,290,540,590])tree(65,y,.9);for(const y of [260,330,540,600])tree(954,y);
  building(600,45,155,60,'#ced3bd','PRAÇA CENTRAL');building(225,46,185,60,'#c1cfb1','BIBLIOTECA');
  rect(778,20,126,70,'#24565c',6);rect(795,53,90,37,'#364b51',2);text('SEDE',841,43,18,'#f4ddb0','center');text('ANDERSONS CORP.',841,16,13,'#e2bc66','center');
  text('AV. CENTRAL',350,146,11,'#ffffffc0','center');text('RUA DO PARQUE',650,406,11,'#ffffffc0','center');text('RUA DAS ARAUCÁRIAS',350,686,11,'#ffffffc0','center');
 }
 function draw(vehicle,{time=0,monitor=false,buzzer=false,blocked=false,trail=[],assisted=false}={}){
  base();
  const route=monitor?ROAD_TEST:assisted?routeToGarage(vehicle):[];
  if(route.length){c.strokeStyle=monitor?'#6cbfb988':'#e8bf67aa';c.lineWidth=8;c.lineJoin='round';c.beginPath();c.moveTo(vehicle.x,vehicle.y);for(const p of route)c.lineTo(p.x,p.y);c.stroke();}
  if(trail.length){c.strokeStyle='#4c9a953d';c.lineWidth=5;c.beginPath();trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
  const t=time*.04;car(480,290+Math.sin(t)*35,Math.PI/2,'#b7c4c7');car(300+Math.sin(t*.8)*45,420,0,'#dbc397');
  if(!monitor){c.strokeStyle='#f4c768';c.lineWidth=4;c.beginPath();c.arc(840,96,35+Math.sin(time*3)*3,0,Math.PI*2);c.stroke();}
  car(vehicle.x,vehicle.y,vehicle.angle,'#ef985f',buzzer&&(Math.sin(time*8)>-.2),blocked);
 }
 function cinematic(kind,elapsed){
  rect(0,0,1000,800,'#17272d');rect(0,460,1000,200,'#273b40');rect(0,630,1000,170,'#3b5055');rect(0,615,1000,15,'#4a5e61');
  if(kind==='boarding'){
   building(80,190,300,270,'#c3d2b9','CASA DO CLIENTE');rect(170,350,70,110,'#476b68',5);tree(425,437,1.8);tree(905,438,1.8);
   const step=clamp(elapsed/2,0,1),x=275+step*390;car(710,535,0,'#ef985f',false,false,3.1);
   if(step<1)person(x,555,elapsed*11);else {rect(695,500,22,13,'#e3b491',4);}
   if(step>.65&&step<1){c.strokeStyle='#e8a579';c.lineWidth=8;c.beginPath();c.moveTo(700,563);c.lineTo(672,590);c.stroke();}
   text('HORA DE IR ATÉ A SEDE',500,112,22,'#f4c35c','center');text('O cliente entra no veículo.',500,152,16,'#bdc9c4','center');
  }else{
   building(190,160,620,305,'#2f6266','');text('ANDERSONS CORP.',500,213,32,'#eef4df','center');rect(265,255,470,210,'#203c46',5);
   const open=clamp(elapsed/1.4,0,1);rect(265,255,470,210*(1-open),'#aabbb0',4);for(let y=268;y<255+210*(1-open);y+=16)rect(272,y,456,2,'#7f998f');
   const position=210+clamp((elapsed-.8)/1.8,0,1)*330;car(position,530,0,'#ef985f',false,false,2.6);
   if(elapsed>2.5)person(545+clamp((elapsed-2.5)/1.3,0,1)*100,530,elapsed*9);person(755,500,0,'#e9a953');
   text('BEM-VINDO À NOSSA SEDE',500,100,23,'#f4c35c','center');text('Vamos preparar a instalação.',500,135,16,'#bdc9c4','center');
  }
 }
 return {draw,cinematic};
}

