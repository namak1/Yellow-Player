import{Input,BlobSource,ALL_FORMATS}from'mediabunny';
export function timelineDuration(media:Pick<HTMLMediaElement,'duration'|'seekable'>,fileDuration=0){
 if(Number.isFinite(media.duration)&&media.duration>0)return media.duration;
 if(Number.isFinite(fileDuration)&&fileDuration>0)return fileDuration;
 const ranges=media.seekable;
 const end=ranges?.length?ranges.end(ranges.length-1):0;
 return Number.isFinite(end)&&end>0?end:0;
}
// Some playable MKVs report Infinity to HTMLMediaElement while their container has a duration.
export async function fileDuration(file:Blob,signal:AbortSignal){
 const input=new Input({source:new BlobSource(file),formats:ALL_FORMATS});
 const cancel=()=>input.dispose();signal.addEventListener('abort',cancel,{once:true});
 try{if(signal.aborted)return 0;const duration=await input.getDurationFromMetadata();return duration&&Number.isFinite(duration)&&duration>0?duration:0;}
 finally{signal.removeEventListener('abort',cancel);input.dispose();}
}

// Preserve gaps after seeking; a stream may have several separate buffered ranges.
export function bufferedGradient(ranges:TimeRanges,duration:number){
 if(!Number.isFinite(duration)||duration<=0||!ranges.length)return '#555';
 const stops:string[]=['#555 0%'];
 for(let i=0;i<ranges.length;i++){
  const start=Math.max(0,Math.min(100,ranges.start(i)/duration*100));
  const end=Math.max(0,Math.min(100,ranges.end(i)/duration*100));
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)continue;
  stops.push(`#555 ${start}%`,`#38bdf8 ${start}%`,`#38bdf8 ${end}%`,`#555 ${end}%`);
 }
 stops.push('#555 100%');
 return `linear-gradient(to right,${stops.join(',')})`;
}

// Report only the contiguous buffered interval at the current position.
export function bufferedAhead(ranges:TimeRanges,time:number){
 if(!Number.isFinite(time))return 0;
 for(let i=0;i<ranges.length;i++){
  if(time>=ranges.start(i)&&time<=ranges.end(i))return Math.max(0,ranges.end(i)-time);
 }
 return 0;
}
