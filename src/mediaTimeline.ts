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
