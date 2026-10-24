export type AudioPlan={when:number;offset:number;duration:number};
/** One fixed audio clock per playback segment. Never retime individual packets from video.currentTime. */
export class AudioClock{
 private end:number|null=null;
 constructor(readonly mediaTime:number,readonly contextTime:number,readonly rate:number,readonly delay=0){}
 plan(timestamp:number,duration:number):AudioPlan|null{
  if(!Number.isFinite(timestamp)||!Number.isFinite(duration)||duration<=0||this.rate<=0)return null;
  let when=this.contextTime+(timestamp+this.delay-this.mediaTime)/this.rate;
  // MKV timestamps are often rounded to milliseconds. PCM sample counts remain exact.
  if(this.end!==null&&Math.abs(when-this.end)<=.008/this.rate)when=this.end;
  this.end=when+duration/this.rate;
  const offset=Math.max(0,(this.contextTime-when)*this.rate);
  if(offset>=duration-1e-9)return null;
  return{when:Math.max(this.contextTime,when),offset,duration:duration-offset};
 }
 mediaAt(contextTime:number){return this.mediaTime+(contextTime-this.contextTime)*this.rate;}
}
/** Web Audio/FFmpeg order: L R C LFE SL SR (5.1); back L/R precede side L/R for 7.1. */
export function stereoDownmix(channels:readonly Float32Array[]):[Float32Array<ArrayBuffer>,Float32Array<ArrayBuffer>]{
 const frames=channels[0]?.length||0;const left=new Float32Array(frames),right=new Float32Array(frames);const n=channels.length,s=Math.SQRT1_2;
 if(!n)return[left,right];if(channels.some(c=>c.length!==frames))throw Error('Audio channel lengths do not match.');
 let l:number[],r:number[];
 if(n===1){l=[1];r=[1];}else if(n===2){l=[1,0];r=[0,1];}
 else if(n===3){l=[1,0,s];r=[0,1,s];}
 else if(n===4){l=[1,0,1,0];r=[0,1,0,1];}
 else if(n===5){l=[1,0,s,s,0];r=[0,1,s,0,s];}
 else if(n===6){l=[1,0,s,0,s,0];r=[0,1,s,0,0,s];}
 else if(n===7){l=[1,0,s,0,.5,s,0];r=[0,1,s,0,.5,0,s];}
 else if(n===8){l=[1,0,s,0,.5,0,.5,0];r=[0,1,s,0,0,.5,0,.5];}
 else throw Error(`Stereo downmix for ${n} channels is unavailable.`);
 // Retain dialogue/surround channels, omit the LFE as in the standard stereo matrix,
 // and reserve enough headroom even when all full-range channels peak together.
 const gain=1/Math.max(1,l.reduce((a,b)=>a+b,0),r.reduce((a,b)=>a+b,0));
 for(let c=0;c<n;c++){const lg=(l[c]||0)*gain,rg=(r[c]||0)*gain;for(let i=0;i<frames;i++){left[i]+=channels[c][i]*lg;right[i]+=channels[c][i]*rg;}}
 return[left,right];
}
export function stereoAudioBuffer(buffer:AudioBuffer,context:BaseAudioContext){
 if(buffer.numberOfChannels<=2)return buffer;
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));const mixed=stereoDownmix(channels);
 const result=context.createBuffer(2,buffer.length,buffer.sampleRate);result.copyToChannel(mixed[0],0);result.copyToChannel(mixed[1],1);return result;
}
