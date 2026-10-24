// Small roadworks leave the centre of each street free. They are shared by
// city drawing, foot pathfinding and both vehicles' collision checks.
export const ROADWORKS=Object.freeze([{x:1090,y:762},{x:1120,y:762},{x:1150,y:762},{x:1392,y:930},{x:1392,y:960}]);
export const hitsRoadwork=(x,y,r=12)=>ROADWORKS.some(p=>Math.hypot(x-p.x,y-p.y)<r+8);
export function drawStreetDetails(c,time=0){
 for(const p of ROADWORKS){c.fillStyle='#14272b88';c.fillRect(p.x-11,p.y+5,24,7);c.fillStyle='#df9461';c.beginPath();c.moveTo(p.x,p.y-11);c.lineTo(p.x-9,p.y+7);c.lineTo(p.x+9,p.y+7);c.fill();c.fillStyle='#f2d99c';c.fillRect(p.x-5,p.y-1,10,3);}
 for(const [x,y] of [[840,1190],[1360,270],[320,730]]){c.fillStyle='#142b30';c.fillRect(x-80,y-94,12,30);c.fillStyle=Math.floor(time/7)%2?'#c17862':'#9ab882';c.beginPath();c.arc(x-74,y-84,4,0,Math.PI*2);c.fill();}
}
export function cityComment(p){
 if(p.x<720&&p.y>800&&p.y<1110)return 'SEGUROS ANDERSON: “Segurança absoluta.” *Consulte o Anderson responsável.';
 if(p.x>1380&&p.x<1790&&p.y>350&&p.y<700)return 'EM CARTAZ: “SUMIU O KA” — baseado em um expediente real. Quase.';
 if(p.x>1480&&p.y>1240)return 'ANDERSONS CORP.: só contratamos Andersons. Currículos no RH.';
 if(p.x<800&&p.y<300)return 'PADARIA ANDERSON: pão quente, atendimento sob pressão.';
 return '';
}
