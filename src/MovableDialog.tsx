import {useLayoutEffect,useRef,useState,type ReactNode,type PointerEvent as ReactPointerEvent} from 'react';
import {X} from 'lucide-react';

export type DialogPoint={x:number;y:number};
export function clampDialog(point:DialogPoint,width:number,height:number,viewportWidth:number,viewportHeight:number):DialogPoint{
 const margin=6;
 return {x:Math.max(margin,Math.min(point.x,Math.max(margin,viewportWidth-width-margin))),y:Math.max(margin,Math.min(point.y,Math.max(margin,viewportHeight-height-margin)))};
}
const storageKey='yellow-player.dialog-positions.v1';
function stored(id:string):DialogPoint|null{try{const p=JSON.parse(localStorage.getItem(storageKey)||'{}')[id];return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y))}:null;}catch{return null;}}
export default function MovableDialog({id,title,className='',onClose,children}:{id:string;title:string;className?:string;onClose:()=>void;children:ReactNode}){
 const backdrop=useRef<HTMLDivElement>(null),box=useRef<HTMLElement>(null),position=useRef<DialogPoint|null>(null),drag=useRef<{id:number;x:number;y:number;origin:DialogPoint}|null>(null);
 const [point,setPoint]=useState<DialogPoint|null>(null),[dragging,setDragging]=useState(false);
 const dimensions=()=>{const outer=backdrop.current!,inner=box.current!;return {width:inner.offsetWidth,height:inner.offsetHeight,vw:outer.clientWidth,vh:outer.clientHeight};};
 const place=(next:DialogPoint)=>{const d=dimensions(),p=clampDialog(next,d.width,d.height,d.vw,d.vh);position.current=p;setPoint(p);return p;};
 const save=()=>{if(!position.current)return;const d=dimensions(),p=position.current;try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');localStorage.setItem(storageKey,JSON.stringify({...saved,[id]:{x:p.x/Math.max(1,d.vw-d.width),y:p.y/Math.max(1,d.vh-d.height)}}));}catch{/* Dragging remains available when browser storage is disabled. */}};
 useLayoutEffect(()=>{
  const d=dimensions(),saved=stored(id);
  place(saved?{x:saved.x*Math.max(0,d.vw-d.width),y:saved.y*Math.max(0,d.vh-d.height)}:{x:(d.vw-d.width)/2,y:(d.vh-d.height)/2});
  const fit=()=>{if(position.current)place(position.current);};
  const observer=new ResizeObserver(fit);observer.observe(backdrop.current!);observer.observe(box.current!);
  window.addEventListener('resize',fit);document.addEventListener('fullscreenchange',fit);window.visualViewport?.addEventListener('resize',fit);
  return()=>{observer.disconnect();window.removeEventListener('resize',fit);document.removeEventListener('fullscreenchange',fit);window.visualViewport?.removeEventListener('resize',fit);};
 },[id]);
 const down=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(event.button!==0||!event.isPrimary||(event.target as HTMLElement).closest('button,input,select,textarea,a'))return;
  if(!position.current)return;
  event.preventDefault();event.stopPropagation();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);
  drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,origin:position.current};setDragging(true);
 };
 const finish=(event:ReactPointerEvent<HTMLDivElement>)=>{if(drag.current?.id!==event.pointerId)return;drag.current=null;setDragging(false);save();if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
 return <div ref={backdrop} className="modal-backdrop" onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section ref={box} className={'modal movable-dialog '+className} role="dialog" aria-modal="true" aria-label={id} style={point?{left:point.x,top:point.y}:undefined}>
   <div className={'modal-head dialog-drag-handle'+(dragging?' dragging':'')} tabIndex={0} aria-label={'Move '+title+' dialog with arrow keys; double-click to center'} onPointerDown={down} onPointerMove={event=>{const start=drag.current;if(start?.id===event.pointerId)place({x:start.origin.x+event.clientX-start.x,y:start.origin.y+event.clientY-start.y});}} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish} onDoubleClick={event=>{if((event.target as HTMLElement).closest('button'))return;const d=dimensions();place({x:(d.vw-d.width)/2,y:(d.vh-d.height)/2});save();}} onKeyDown={event=>{
    if(event.target!==event.currentTarget||!position.current)return;
    const delta=event.shiftKey?1:10,p=position.current;
    const moves:Record<string,DialogPoint>={ArrowLeft:{x:p.x-delta,y:p.y},ArrowRight:{x:p.x+delta,y:p.y},ArrowUp:{x:p.x,y:p.y-delta},ArrowDown:{x:p.x,y:p.y+delta}};
    if(moves[event.key]){event.preventDefault();event.stopPropagation();place(moves[event.key]);save();}
   }}><h2>{title}</h2><button className="icon" aria-label="Close dialog" onClick={onClose}><X size={19}/></button></div>
   {children}
  </section>
 </div>;
}
