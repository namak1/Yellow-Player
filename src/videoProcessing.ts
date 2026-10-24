export type ToneSettings={gamma:number;toneMapping:string;exposure:number;sourcePeak:number;targetNits:number};
export const processingDefaults={gamma:1,toneMapping:'browser',exposure:0,sourcePeak:1000,targetNits:203,aspect:'auto'};
export const aspectPresets=['auto','16:9','4:3','16:10','21:9','1.85:1','2.35:1','2.39:1','1:1'];
export function aspectRatio(preset:string){const [a,b]=preset.split(':').map(Number);return a>0&&b>0?a/b:0;}
export function toneValue(value:number,p:ToneSettings){
 let x=Math.max(0,value)*2**p.exposure;
 if(p.toneMapping!=='browser'){
  x*=p.sourcePeak/p.targetNits;
  if(p.toneMapping==='reinhard')x=x/(1+x);
  else if(p.toneMapping==='aces')x=(x*(2.51*x+.03))/(x*(2.43*x+.59)+.14);
  else if(p.toneMapping==='hable'){const h=(v:number)=>((v*(.15*v+.05)+.004)/(v*(.15*v+.5)+.06))-.02/.3;x=h(x)/h(p.sourcePeak/p.targetNits);}
 }
 return Math.max(0,Math.min(1,x))**(1/Math.max(.1,p.gamma));
}
export function toneTable(p:ToneSettings){return Array.from({length:257},(_,i)=>toneValue(i/256,p).toFixed(6)).join(' ');}
export function zoomFromWheel(zoom:number,delta:number){return Math.max(50,Math.min(300,zoom+(delta<0?10:-10)));}
