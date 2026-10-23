import{type Cue}from'./subtitles';
export function srtTime(seconds:number):string{const n=Math.max(0,Math.round(seconds*1000));const ms=n%1000,total=Math.floor(n/1000);return`${Math.floor(total/3600)}`.padStart(2,'0')+':'+`${Math.floor(total/60)%60}`.padStart(2,'0')+':'+`${total%60}`.padStart(2,'0')+','+`${ms}`.padStart(3,'0');}
export function exportSrt(cues:Cue[],delayMs=0):string{return cues.map((c,i)=>`${i+1}\n${srtTime(c.start+delayMs/1000)} --> ${srtTime(c.end+delayMs/1000)}\n${c.text}`).join('\n\n')+'\n';}
export function correctTiming(cues:Cue[],first:{subtitle:number;media:number},second?:{subtitle:number;media:number}):Cue[]{
 if(![first.subtitle,first.media,...(second?[second.subtitle,second.media]:[])].every(Number.isFinite))throw Error('Enter valid times.');
 if(second&&(second.subtitle<=first.subtitle||second.media<=first.media))throw Error('Both anchors must progress forward in time.');
 const scale=second?(second.media-first.media)/(second.subtitle-first.subtitle):1;
 if(!Number.isFinite(scale)||scale<=0)throw Error('Both anchors must progress forward in time.');
 const offset=first.media-first.subtitle*scale;
 return cues.map(c=>({start:c.start*scale+offset,end:c.end*scale+offset,text:c.text}));
}
