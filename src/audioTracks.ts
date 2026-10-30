import{AudioClock,stereoAudioBuffer}from'./audioPlayback';
import{ensureAudioDecoder,needsSoftwareAudio}from'./audioDecoders';
import{Input,BlobSource,UrlSource,ALL_FORMATS,AudioBufferSink,type InputAudioTrack,type WrappedAudioBuffer}from'mediabunny';
import{type Equalizer}from'./engine';
/** Remote audio uses bounded HTTP-range reads and the same decoder path as local media. */
export function audioInputSource(source:File|string){return typeof source==='string'?new UrlSource(source,{maxCacheSize:32*1024*1024,getRetryDelay:attempt=>attempt<2?.5:null}):new BlobSource(source);}
export type NativeAudioTrack={id:string;label:string;language:string;enabled:boolean};
export type NativeAudioList=EventTarget&{length:number;[index:number]:NativeAudioTrack};
export type VideoWithAudio=HTMLVideoElement&{audioTracks?:NativeAudioList};
export type AudioChoice={id:string;name:string;language:string;codec:string;channels:number;available:boolean;reason?:string};
export function nativeChoices(list:NativeAudioList):AudioChoice[]{return Array.from({length:list.length},(_,i)=>({id:'native:'+i,name:list[i].label||`Audio ${i+1}`,language:list[i].language||'und',codec:'Browser decoder',channels:0,available:true}));}
export function selectNativeTrack(list:NativeAudioList,index:number){if(!Number.isInteger(index)||index<0||index>=list.length)throw Error('Audio track is unavailable.');list[index].enabled=true;for(let i=0;i<list.length;i++)if(i!==index)list[i].enabled=false;}
/** Return a WebAudio start time and offset, or null for an expired buffer. */
export function audioSchedule(timestamp:number,duration:number,mediaTime:number,contextTime:number,rate:number,delay=0){timestamp+=delay;if(duration<=0||rate<=0||timestamp+duration<=mediaTime)return null;const offset=Math.max(0,mediaTime-timestamp);return{when:contextTime+Math.max(0,timestamp-mediaTime)/rate,offset,duration:duration-offset};}
export class SyncedAudio{
 private sink:AudioBufferSink;private generation=0;private iterator:AsyncGenerator<WrappedAudioBuffer,void,unknown>|null=null;private sources=new Set<AudioBufferSourceNode>();private timer:ReturnType<typeof setInterval>;private disposed=false;private anchor:AudioClock|null=null;
 private restart=()=>{this.cancel();if(this.disposed||this.media.paused||this.media.seeking||this.media.readyState<3)return;const gen=this.generation;void this.run(gen).catch(e=>{if(gen===this.generation&&!this.disposed){this.cancel();this.onError(e);}});};
 private stop=()=>this.cancel();
 constructor(track:InputAudioTrack,private media:HTMLVideoElement,private graph:Equalizer,private onError:(error:unknown)=>void,private delay=0){this.sink=new AudioBufferSink(track);for(const name of ['playing','seeked','ratechange'])media.addEventListener(name,this.restart);for(const name of ['pause','waiting','seeking','ended'])media.addEventListener(name,this.stop);this.timer=setInterval(()=>{const a=this.anchor;if(!a||media.paused||media.seeking)return;const expected=a.mediaAt(graph.context.currentTime);if(Math.abs(expected-media.currentTime)>.25)this.restart();},150);this.restart();}
 private cancel(){this.generation++;this.anchor=null;const iterator=this.iterator;this.iterator=null;if(iterator)void iterator.return().catch(()=>{});for(const source of this.sources){try{source.stop();}catch{}source.disconnect();}this.sources.clear();}
 private async run(gen:number){
 await this.graph.context.resume();if(gen!==this.generation)return;
 const iterator=this.sink.buffers(Math.max(0,this.media.currentTime-this.delay));this.iterator=iterator;const rate=this.media.playbackRate;const pending:WrappedAudioBuffer[]=[];
 try{
  // Decode ahead before starting the clock. This leaves room for worker/main-thread jitter.
  while(gen===this.generation){const next=await iterator.next();if(next.done)break;pending.push(next.value);if(next.value.timestamp+next.value.buffer.duration+this.delay>=this.media.currentTime+.25*rate||pending.length>=64)break;}
  if(gen!==this.generation||!pending.length)return;
  const lead=.08;const clock=new AudioClock(this.media.currentTime+lead*rate,this.graph.context.currentTime+lead,rate,this.delay);this.anchor=clock;
  while(gen===this.generation){const chunk=pending.shift()||(await iterator.next()).value;if(gen!==this.generation||!chunk)break;
   const buffer=stereoAudioBuffer(chunk.buffer,this.graph.context);const plan=clock.plan(chunk.timestamp,buffer.duration);if(!plan)continue;
   while(gen===this.generation&&plan.when-this.graph.context.currentTime>1)await new Promise(resolve=>setTimeout(resolve,25));if(gen!==this.generation)break;
   // A genuine underrun needs a fresh buffered segment, not overlapping late packets.
   if(plan.when<this.graph.context.currentTime+.002){this.restart();return;}
   const node=this.graph.context.createBufferSource();node.buffer=buffer;node.playbackRate.value=rate;node.connect(this.graph.input);this.sources.add(node);node.onended=()=>{this.sources.delete(node);node.disconnect();};node.start(plan.when,plan.offset,plan.duration);
  }
 }finally{await iterator.return();if(this.iterator===iterator)this.iterator=null;}
 }

 dispose(){this.disposed=true;this.cancel();clearInterval(this.timer);for(const name of ['playing','seeked','ratechange'])this.media.removeEventListener(name,this.restart);for(const name of ['pause','waiting','seeking','ended'])this.media.removeEventListener(name,this.stop);}
}
export class AudioTrackSession{
 choices:AudioChoice[]=[];private file?:File|string;private delay=0;private lastId='default';private primary:InputAudioTrack|null=null;private primaryCodec:string|null=null;private input:Input|null=null;private parsed:InputAudioTrack[]=[];private native:NativeAudioList|undefined;private synced:SyncedAudio|null=null;private closed=false;private selection=0;defaultId='';
 constructor(private media:VideoWithAudio,private graph:()=>Equalizer,private onPlaybackError:(message:string)=>void){}
 async inspect(file?:File|string){
 this.file=file;this.native=this.media.audioTracks;
 if(!file){if(this.native?.length){this.choices=nativeChoices(this.native);this.defaultId='native:'+Math.max(0,Array.from({length:this.native.length},(_,i)=>i).find(i=>this.native![i].enabled)??0);}return this.choices;}
 this.input=new Input({source:audioInputSource(file),formats:ALL_FORMATS});this.parsed=await this.input.getAudioTracks();this.primary=await this.input.getPrimaryAudioTrack();this.primaryCodec=await this.primary?.getCodec()||null;this.defaultId=this.primary?'embedded:'+this.primary.id:'';
 this.choices=await Promise.all(this.parsed.map(async(track,i)=>{const[name,language,codec,channels]=await Promise.all([track.getName(),track.getLanguageCode(),track.getCodec(),track.getNumberOfChannels()]);let reason:string|undefined;try{await ensureAudioDecoder(codec);}catch(e){reason=String(e);}const available=!reason&&await track.canDecode().catch(()=>false);return{id:'embedded:'+track.id,name:name||`Audio ${i+1}`,language,codec:codec||'Unknown codec',channels,available,reason:available?undefined:reason||`No decoder is available for ${codec||'this codec'} on this browser.`};}));return this.choices;
 }
 async autoSelect(){
 if(needsSoftwareAudio(this.primaryCodec)){const choice=this.choices.find(c=>c.id===this.defaultId);if(!choice?.available)throw Error(choice?.reason||'The default audio track has no available decoder.');await this.select(choice.id);return choice.id;}
 if(this.primary&&!this.primaryCodec)throw Error('This audio codec has no decoder in the web player. Select another track if one is available.');
 return 'default';
 }
 async setDelay(seconds:number){if(!Number.isFinite(seconds)||Math.abs(seconds)>10)throw Error('Audio delay must be within ±10 seconds.');const previous=this.delay;this.delay=seconds;try{await this.select(this.lastId);}catch(e){this.delay=previous;throw e;}}
 async select(id:string){if(id==='default'&&needsSoftwareAudio(this.primaryCodec))id=this.defaultId;const generation=++this.selection;if(this.closed)return;if(id==='default'&&this.delay>=0){if(this.native?.length&&this.defaultId.startsWith('native:'))selectNativeTrack(this.native,Number(this.defaultId.slice(7)));this.synced?.dispose();this.synced=null;if(this.delay>0){const graph=this.graph();this.graphIfCreated=graph;await graph.context.resume();graph.setNativeDelay(this.delay);}else this.graphIfCreated?.setNativeDelay(0);this.graphIfCreated?.setExternal(false);this.lastId=id;return;}if(id.startsWith('native:')&&this.delay>=0){if(!this.native)throw Error('The browser no longer exposes audio tracks.');this.synced?.dispose();this.synced=null;this.graphIfCreated?.setExternal(false);selectNativeTrack(this.native,Number(id.slice(7)));if(this.delay>0){const graph=this.graph();this.graphIfCreated=graph;await graph.context.resume();graph.setNativeDelay(this.delay);}else this.graphIfCreated?.setNativeDelay(0);this.lastId=id;return;}
 if(!this.parsed.length){if(!this.file)throw Error('Independent audio requires a readable media source and supported decoder.');this.input??=new Input({source:audioInputSource(this.file),formats:ALL_FORMATS});this.parsed=await this.input.getAudioTracks();this.primary=await this.input.getPrimaryAudioTrack();this.primaryCodec=await this.primary?.getCodec()||null;}
 const track=id==='default'?(this.primary||this.parsed[0]):id.startsWith('native:')?this.parsed[Number(id.slice(7))]:this.parsed.find(t=>'embedded:'+t.id===id);if(!track)throw Error('Audio track not found.');await ensureAudioDecoder(await track.getCodec());if(!await track.canDecode())throw Error('This audio codec cannot be independently decoded for synchronization.');const graph=this.graph();this.graphIfCreated=graph;await graph.context.resume();if(generation!==this.selection||this.closed)return;
 // Decode a sample before silencing the original, so an unsupported stream cannot leave silent playback.
 const first=await new AudioBufferSink(track).getBuffer(Math.max(0,this.media.currentTime-this.delay));if(generation!==this.selection||this.closed)return;if(!first)throw Error('No audio samples at this position.');this.synced?.dispose();graph.setNativeDelay(0);graph.setExternal(true);this.synced=new SyncedAudio(track,this.media,graph,e=>{this.synced?.dispose();this.synced=null;graph.setExternal(false);this.onPlaybackError('Audio decoding stopped. '+(needsSoftwareAudio(this.primaryCodec)?'The browser cannot play this track directly. Choose another audio track or retry. ':'Restored browser audio. ')+String(e));},this.delay);this.lastId=id;}
 private graphIfCreated:Equalizer|null=null;
 dispose(){this.closed=true;this.selection++;this.synced?.dispose();this.graphIfCreated?.setExternal(false);this.graphIfCreated?.setNativeDelay(0);this.input?.dispose();}
}
export function audioChoiceLabel(c:AudioChoice){const lang=c.language&&c.language!=='und'?c.language:'';return[c.name,lang,c.codec,c.channels?`${c.channels} ch`:''].filter(Boolean).join(' · ');}
