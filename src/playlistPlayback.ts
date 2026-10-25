export type RepeatMode='off'|'one'|'all';
export const nextRepeat=(mode:RepeatMode):RepeatMode=>mode==='off'?'one':mode==='one'?'all':'off';
/** A shuffled cycle visits every queued URL once; back/forward retraces history. */
export class ShuffleOrder{
 private history:string[]=[];private position=-1;private seen=new Set<string>();
 reset(){this.history=[];this.position=-1;this.seen.clear();}
 private sync(keys:string[],current:string){
  const active=this.history[this.position];this.history=this.history.filter(k=>keys.includes(k));this.position=active?this.history.indexOf(active):-1;
  this.seen=new Set([...this.seen].filter(k=>keys.includes(k)));
  if(current&&this.history[this.position]!==current){this.history=this.history.slice(0,this.position+1);this.history.push(current);this.position=this.history.length-1;}
  if(current)this.seen.add(current);
 }
 next(keys:string[],current:string,loop:boolean,random= Math.random):string|undefined{
  this.sync(keys,current);
  if(this.position+1<this.history.length)return this.history[++this.position];
  let pool=keys.filter(k=>!this.seen.has(k));
  if(!pool.length&&loop){this.seen=new Set(current?[current]:[]);pool=keys.filter(k=>k!==current);if(!pool.length)pool=[...keys];}
  if(!pool.length)return;
  const next=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];this.seen.add(next);this.history.push(next);this.position++;return next;
 }
 previous(keys:string[],current:string):string|undefined{this.sync(keys,current);if(this.position>0)return this.history[--this.position];}
}
