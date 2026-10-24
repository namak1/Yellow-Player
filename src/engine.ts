import{timelineDuration}from'./mediaTimeline';
export interface PlaybackEngine {play():Promise<void>;pause():void;seek(seconds:number):void;setRate(rate:number):void;stop():void;}
export class BrowserEngine implements PlaybackEngine{
 constructor(public media:HTMLVideoElement,private durationHint=0){}
 play(){return this.media.play();} pause(){this.media.pause();}
 seek(seconds:number){if(!Number.isFinite(seconds))return;const duration=timelineDuration(this.media,this.durationHint);if(duration>0)this.media.currentTime=Math.min(duration,Math.max(0,seconds));else if(this.media.readyState>=1)this.media.currentTime=Math.max(0,seconds);}
 setRate(rate:number){this.media.playbackRate=Math.max(.25,Math.min(4,rate));this.media.preservesPitch=true;}
 stop(){this.pause();this.seek(0);}
}
export const bands=[60,170,310,600,1000,3000,6000,12000,14000,16000];
export class Equalizer{
 context:AudioContext; filters:BiquadFilterNode[];input:GainNode;private nativeGain:GainNode;private nativeDelay:DelayNode;private master:GainNode;
 constructor(media:HTMLVideoElement){this.context=new AudioContext();const source=this.context.createMediaElementSource(media);this.nativeGain=this.context.createGain();this.nativeDelay=this.context.createDelay(10);this.input=this.context.createGain();this.master=this.context.createGain();source.connect(this.nativeGain);this.nativeGain.connect(this.nativeDelay);this.nativeDelay.connect(this.input);this.filters=bands.map(f=>{const n=this.context.createBiquadFilter();n.type='peaking';n.frequency.value=f;n.Q.value=1;return n;});let last:AudioNode=this.input;for(const f of this.filters){last.connect(f);last=f;}last.connect(this.master);this.master.connect(this.context.destination);}
 setNativeDelay(seconds:number){this.nativeDelay.delayTime.setValueAtTime(Math.max(0,Math.min(10,seconds)),this.context.currentTime);}
 setExternal(active:boolean){this.nativeGain.gain.setValueAtTime(active?0:1,this.context.currentTime);}
 setOutput(volume:number,muted:boolean){this.master.gain.setTargetAtTime(muted?0:volume,this.context.currentTime,.01);}
 async set(values:number[]){await this.context.resume();values.forEach((v,i)=>this.filters[i].gain.setTargetAtTime(v,this.context.currentTime,.02));}
}
