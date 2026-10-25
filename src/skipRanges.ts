export type SkipRange={id:string;start:number;end:number;enabled:boolean};
export type SkipSettings={enabled:boolean;ranges:SkipRange[]};
export const emptySkips=():SkipSettings=>({enabled:true,ranges:[]});
export function parseSkipTime(text:string):number|null{
 const value=text.trim();
 const millis=/^(\d+):([0-5]?\d):([0-5]?\d):(\d{1,3})$/.exec(value);
 if(millis){const seconds=Number(millis[1])*3600+Number(millis[2])*60+Number(millis[3])+Number(millis[4])/1000;return Number.isFinite(seconds)?seconds:null;}
 if(!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(value))return null;
 const parts=value.split(':').map(Number);if(parts.slice(1).some(n=>n>=60))return null;
 const seconds=parts.reduce((total,n)=>total*60+n,0);return Number.isFinite(seconds)?seconds:null;
}
export function formatSkipTime(seconds:number):string{
 const total=Math.round(Math.max(0,Number.isFinite(seconds)?seconds:0)*1000);
 const pad=(n:number,size=2)=>String(n).padStart(size,'0');
 return `${Math.floor(total/3600000)}:${pad(Math.floor(total/60000)%60)}:${pad(Math.floor(total/1000)%60)}:${pad(total%1000,3)}`;
}
export function skipRangeError(start:number|null,end:number|null,duration=0):string{
 if(start===null||end===null||!Number.isFinite(start)||!Number.isFinite(end)||start<0)return 'Enter a valid time: hh:mm:ss:SSS, hh:mm:ss, mm:ss, or seconds.';
 if(end<=start)return 'End time must be after start time.';
 if(Number.isFinite(duration)&&duration>0&&end>duration)return 'End time is past the end of this video.';
 return '';
}
export function restoreSkips(value:unknown):SkipSettings{
 if(!value||typeof value!=='object')return emptySkips();
 const saved=value as Partial<SkipSettings>;
 return{enabled:saved.enabled!==false,ranges:Array.isArray(saved.ranges)?saved.ranges.filter(r=>r&&typeof r.id==='string'&&!skipRangeError(r.start,r.end)).map(r=>({...r,enabled:r.enabled!==false})):[]};
}
/** Half-open ranges: the start is skipped; the end is playable. Merge overlaps and touching ranges. */
export function skipIntervals(settings:SkipSettings):{start:number;end:number}[]{
 const merged:{start:number;end:number}[]=[];if(!settings.enabled)return merged;
 for(const range of settings.ranges.filter(r=>r.enabled&&!skipRangeError(r.start,r.end)).sort((a,b)=>a.start-b.start)){
  const last=merged.at(-1);if(last&&range.start<=last.end)last.end=Math.max(last.end,range.end);else merged.push({start:range.start,end:range.end});
 }
 return merged;
}
export function skipTarget(time:number,intervals:readonly{start:number;end:number}[],duration=0):number{
 if(!Number.isFinite(time))return time;
 const target=intervals.find(r=>time>=r.start&&time<r.end)?.end??time;
 return duration>0&&Number.isFinite(duration)?Math.min(target,duration):target;
}
