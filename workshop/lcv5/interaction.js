import {Vector3,MathUtils} from 'three';

export const CAMERA_HELP='Arraste o fundo: girar · roda: zoom · botão direito: mover';
export const CABLE_HELP='Segure o cabo + roda: zoom · Alt + mover para baixo: afastar · bordas: mover a visão · Esc: soltar';

export function applySensitivity(controls,value){
 const percent=MathUtils.clamp(Number(value)||120,50,200),factor=percent/100;
 controls.rotateSpeed=.9*factor;controls.zoomSpeed=1.2*factor;controls.panSpeed=1.05*factor;
 controls.dampingFactor=.13;
 return percent;
}

export function zoomWhileHolding(camera,controls,delta,factor=1.2,maxDistance=controls.maxDistance){
 const offset=camera.position.clone().sub(controls.target),distance=offset.length();
 if(!distance||!Number.isFinite(delta))return false;
 const next=MathUtils.clamp(distance*Math.exp(MathUtils.clamp(delta,-600,600)*.0018*factor),controls.minDistance,maxDistance);
 if(Math.abs(next-distance)<.00001)return false;
 camera.position.copy(controls.target).add(offset.multiplyScalar(next/distance));
 controls.update();camera.updateMatrixWorld();return true;
}

// Pick and snap radii stay in CSS pixels at every zoom level.
export function nearestScreenPoint(event,entries,camera,rect,radius){
 let best=null,distance=radius;
 for(const [id,point] of entries){
  const v=point.clone().project(camera);if(v.z>1||v.z<-1||Math.abs(v.x)>1||Math.abs(v.y)>1)continue;
  const d=Math.hypot(event.clientX-rect.left-(v.x+1)*rect.width/2,event.clientY-rect.top-(1-v.y)*rect.height/2);
  if(d<distance){distance=d;best=id;}
 }
 return best;
}

function edgeAxis(value,size){
 const margin=Math.min(65,size*.16);
 return value<margin?-MathUtils.clamp((margin-value)/margin,0,1):value>size-margin?MathUtils.clamp((value-size+margin)/margin,0,1):0;
}

export function moveAtEdge(event,rect,camera,controls,dt,factor=1.2){
 const x=edgeAxis(event.clientX-rect.left,rect.width),y=edgeAxis(event.clientY-rect.top,rect.height);
 if(!x&&!y)return false;
 const distance=camera.position.distanceTo(controls.target),step=Math.min(dt,.05)*distance*.11*factor;
 const right=new Vector3().setFromMatrixColumn(camera.matrixWorld,0);right.y=0;right.normalize();
 const up=new Vector3().setFromMatrixColumn(camera.matrixWorld,1);up.y=0;up.normalize();
 const shift=right.multiplyScalar(x*step).add(up.multiplyScalar(-y*step)),next=controls.target.clone().add(shift);
 next.x=MathUtils.clamp(next.x,-9,8);next.z=MathUtils.clamp(next.z,-4,8);shift.copy(next).sub(controls.target);
 camera.position.add(shift);controls.target.copy(next);controls.update();camera.updateMatrixWorld();
 // A close-up opens gradually, then stops at an overview distance.
 if(distance<18)zoomWhileHolding(camera,controls,Math.max(Math.abs(x),Math.abs(y))*Math.min(dt,.05)*200,factor,Math.min(18,controls.maxDistance));
 return true;
}

export function bindCableInteraction({canvas,stage,camera,controls,hit,nearestTarget,onPick,onMove,onDrop,onPark,onRestore,onClick,onHover,onHint,getSensitivity=()=>1.2,autoView=()=>true}){
 let drag=null,down=null,lastHover=null;
 const document=canvas.ownerDocument,view=document.defaultView;
 const coords=e=>({clientX:e.clientX,clientY:e.clientY,pointerType:e.pointerType,altKey:e.altKey});
 function refresh(){if(drag)onMove(drag.key,drag.event,nearestTarget(drag.event));}
 function showHover(object,event){lastHover=event;onHover(object?.userData||null,event);canvas.style.cursor=object?'pointer':'grab';}
 function end(event,drop=false){
  if(!drag)return;
  const current=drag;drag=null;down=null;controls.enabled=true;stage.classList.remove('dragging');canvas.style.cursor='grab';onHover(null);
  if(canvas.hasPointerCapture?.(current.id))canvas.releasePointerCapture(current.id);
  const target=drop&&current.moved?nearestTarget(event):null;
  if(drop&&current.moved){onMove(current.key,event,target);if(target)onDrop(current.key,target);else if(onPark)onPark(current.key,event);else onRestore(current.key);}else onRestore(current.key);
  onHint(CAMERA_HELP);
 }
 canvas.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||e.button!==0||drag)return;
  const object=hit(e);down={x:e.clientX,y:e.clientY,object,id:e.pointerId};
  if(object?.userData.kind!=='wire')return;
  if(!onPick(object.userData.key)){down=null;return;}
  controls.enabled=false;drag={key:object.userData.key,id:e.pointerId,event:coords(e),moved:false};
  canvas.setPointerCapture?.(e.pointerId);stage.classList.add('dragging');canvas.style.cursor='grabbing';
  onHint(CABLE_HELP);onHover(object.userData,e,true);
 },{capture:true});
 canvas.addEventListener('pointermove',e=>{
  if(!drag){if(!down)showHover(hit(e),coords(e));return;}
  if(e.pointerId!==drag.id)return;
  if(e.pointerType!=='touch'&&e.buttons===0){end(e);return;}
  const delta=e.clientY-drag.event.clientY;
  drag.moved ||=Math.hypot(e.clientX-down.x,e.clientY-down.y)>4;
  if(e.altKey&&drag.moved)zoomWhileHolding(camera,controls,delta*3.5,getSensitivity());
  drag.event=coords(e);refresh();onHover({kind:'wire',key:drag.key},drag.event,true);
 });
 canvas.addEventListener('wheel',e=>{
  if(!drag)return;
  e.preventDefault();e.stopImmediatePropagation();
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
  zoomWhileHolding(camera,controls,delta,getSensitivity());
  drag.event=coords(e);drag.moved=true;refresh();onHover({kind:'wire',key:drag.key},drag.event,true);
 },{capture:true,passive:false});
 canvas.addEventListener('pointerup',e=>{
  if(drag){if(drag.id===e.pointerId)end(e,true);return;}
  if(down?.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5)onClick(down.object);
  down=null;showHover(hit(e),coords(e));
 });
 canvas.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId)end(e);down=null;});
 canvas.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId)end(e);});
 canvas.addEventListener('pointerleave',()=>{if(!drag){lastHover=null;onHover(null);}});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();end(e);}});
 view.addEventListener('blur',()=>{end(null);down=null;lastHover=null;onHover(null);});
 controls.addEventListener('start',()=>{if(!drag)onHover(null);});
 controls.addEventListener('end',()=>{if(!drag&&lastHover)showHover(hit(lastHover),lastHover);});
 return {
  get drag(){return drag;},cancel:()=>end(null),
  tick(dt){
   if(!drag?.moved)return;
   if(autoView()&&!drag.event.altKey&&!nearestTarget(drag.event))moveAtEdge(drag.event,canvas.getBoundingClientRect(),camera,controls,dt,getSensitivity());
   refresh();
  }
 };
}

