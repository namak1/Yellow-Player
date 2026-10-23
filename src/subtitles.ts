export type Cue={start:number;end:number;text:string};
export type SubtitleTrack={id:string;name:string;cues:Cue[];fallback:boolean;content?:string;sourceKey?:string;isDefault?:boolean};
export function timestamp(value:string):number {
 const parts=value.trim().replace(',','.').split(':').map(Number);
 if(parts.length<2||parts.length>3||parts.some(x=>!Number.isFinite(x)||x<0))return NaN;
 return parts.reduce((s,x)=>s*60+x,0);
}
export function parseSubtitles(input:string,filename:string):Cue[]{
 const text=input.replace(/^\uFEFF/,'').replace(/\r/g,'');const cues:Cue[]=[];
 if(/\.(ass|ssa)$/i.test(filename)){
  let fields=['layer','start','end','style','name','marginl','marginr','marginv','effect','text'];let events=false;
  for(const line of text.split('\n')){
   if(line.startsWith('[')){events=/^\[events\]/i.test(line);continue;}if(!events)continue;
   if(/^Format:/i.test(line))fields=line.slice(line.indexOf(':')+1).split(',').map(x=>x.trim().toLowerCase());
   if(!/^Dialogue:/i.test(line))continue;
   const values=line.slice(line.indexOf(':')+1).split(',');const ti=fields.indexOf('text');
   const start=timestamp(values[fields.indexOf('start')]||''),end=timestamp(values[fields.indexOf('end')]||'');
   const content=values.slice(ti).join(',').replace(/\{[^}]*\}/g,'').replace(/\\[Nn]/g,'\n').replace(/\\h/g,' ');
   if(Number.isFinite(start)&&end>start)cues.push({start,end,text:content});
  }
 }else{
  for(const block of text.split(/\n\s*\n/)){
   const lines=block.split('\n');if(/^(NOTE|STYLE|REGION)(\s|$)/.test(lines[0]))continue;
   const i=lines.findIndex(x=>x.includes('-->'));if(i<0)continue;
   const times=lines[i].split('-->');const start=timestamp(times[0]),end=timestamp(times[1].trim().split(/\s/)[0]);
   // Render text, never execute subtitle HTML.
   const content=lines.slice(i+1).join('\n').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').trimEnd();
   if(Number.isFinite(start)&&end>start)cues.push({start,end,text:content});
  }
 }
 return cues.sort((a,b)=>a.start-b.start);
}
export function activeCues(cues:Cue[],mediaTime:number,delayMs:number):Cue[]{const t=mediaTime-delayMs/1000;return cues.filter(c=>c.start<=t&&t<c.end);}
export function formatTime(s:number):string{if(!Number.isFinite(s)||s<0)s=0;const h=Math.floor(s/3600);return(h?`${h}:`:'')+`${Math.floor(s/60)%60}`.padStart(2,'0')+':'+`${Math.floor(s%60)}`.padStart(2,'0');}
export function mediaKey(f:File):string{return `${f.name}:${f.size}:${f.lastModified}`;}
