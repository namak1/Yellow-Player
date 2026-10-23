export interface PlaybackEngine {play():Promise<void>;pause():void;seek(seconds:number):void;setRate(rate:number):void;stop():void;}
export class BrowserEngine implements PlaybackEngine{
 constructor(public media:HTMLVideoElement){}
 play(){return this.media.play();} pause(){this.media.pause();}
 seek(seconds:number){if(Number.isFinite(this.media.duration))this.media.currentTime=Math.min(this.media.duration,Math.max(0,seconds));}
 setRate(rate:number){this.media.playbackRate=Math.max(.25,Math.min(4,rate));this.media.preservesPitch=true;}
 stop(){this.pause();this.seek(0);}
}
export const bands=[60,170,310,600,1000,3000,6000,12000,14000,16000];
export class Equalizer{
 context:AudioContext; filters:BiquadFilterNode[];
 constructor(media:HTMLVideoElement){this.context=new AudioContext();const source=this.context.createMediaElementSource(media);this.filters=bands.map(f=>{const n=this.context.createBiquadFilter();n.type='peaking';n.frequency.value=f;n.Q.value=1;return n;});let last:AudioNode=source;for(const f of this.filters){last.connect(f);last=f;}last.connect(this.context.destination);}
 async set(values:number[]){await this.context.resume();values.forEach((v,i)=>this.filters[i].gain.setTargetAtTime(v,this.context.currentTime,.02));}
}
