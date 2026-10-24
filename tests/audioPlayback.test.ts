import{test}from'node:test';import assert from'node:assert/strict';import{AudioClock,stereoDownmix}from'../src/audioPlayback';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('a thousand millisecond-rounded DTS packets schedule without gaps or overlaps',()=>{
 const clock=new AudioClock(0,10,1);let end=10;
 for(let i=0;i<1000;i++){const timestamp=Math.round(i*512/48000*1000)/1000;const p=clock.plan(timestamp,512/48000)!;assert.ok(p);near(p.when,end);end=p.when+p.duration;}
 near(end,10+1000*512/48000);
});
test('audio timing remains on one clock across decode jitter, fractional offsets and playback rates',()=>{
 for(const rate of [.5,1,1.5,2]){const clock=new AudioClock(5.08,10.08,rate);let end:number|undefined;for(let i=0;i<100;i++){const p=clock.plan(5+i*.032,.032);if(!p)continue;if(end!==undefined)near(p.when,end);else{near(p.when,10.08);near(p.offset,.016);}end=p.when+p.duration/rate;}near(clock.mediaAt(11.08),5.08+rate);}
 const later=new AudioClock(5,10,1,.5).plan(5,.032)!;near(later.when,10.5);
 const earlier=new AudioClock(5,10,1,-.5).plan(5.5,.032)!;near(earlier.when,10);
});
test('real timestamp discontinuities retain their gap instead of being squeezed together',()=>{const c=new AudioClock(0,0,1);c.plan(0,.032);near(c.plan(.2,.032)!.when,.2);assert.equal(c.plan(NaN,.032),null);});
test('full-scale correlated 5.1 channels retain stereo headroom without hard clipping',()=>{const channels=Array.from({length:6},()=>Float32Array.from([1,-1,.75,-.75]));const [l,r]=stereoDownmix(channels);for(let i=0;i<4;i++){near(l[i],channels[0][i]);near(r[i],channels[0][i]);assert.ok(Math.abs(l[i])<=1);}});
test('5.1 dialogue and surrounds reach the correct stereo sides; LFE is omitted',()=>{
 const channels=Array.from({length:6},()=>new Float32Array(6));channels.forEach((c,i)=>c[i]=1);const[l,r]=stereoDownmix(channels),gain=1/(1+Math.SQRT2);
 near(l[0],gain);near(r[0],0);near(r[1],gain);near(l[1],0);near(l[2],Math.SQRT1_2*gain);near(r[2],l[2]);near(l[3],0);near(r[3],0);near(l[4],Math.SQRT1_2*gain);near(r[4],0);near(l[5],0);near(r[5],Math.SQRT1_2*gain);
});
test('mono/stereo samples are preserved and 7.1 downmix remains bounded',()=>{const a=Float32Array.from([.2,-.4,.8]);assert.deepEqual(stereoDownmix([a]),[a,a]);assert.deepEqual(stereoDownmix([a,a]),[a,a]);const out=stereoDownmix(Array.from({length:8},()=>Float32Array.from([1,-1])));for(const c of out)for(const n of c)assert.ok(Math.abs(n)<=1.000001);});

test('decoded AC-3 plays as contiguous stereo buffers through the actual scheduler',async()=>{
 const{readFile}=await import('node:fs/promises');const{Input,BlobSource,ALL_FORMATS}=await import('mediabunny');const{ensureAudioDecoder}=await import('../src/audioDecoders');const{SyncedAudio}=await import('../src/audioTracks');
 class TestBuffer{readonly numberOfChannels:number;readonly length:number;readonly sampleRate:number;private channels:Float32Array[];constructor(o:{numberOfChannels:number;length:number;sampleRate:number}){Object.assign(this,o);this.numberOfChannels=o.numberOfChannels;this.length=o.length;this.sampleRate=o.sampleRate;this.channels=Array.from({length:o.numberOfChannels},()=>new Float32Array(o.length));}get duration(){return this.length/this.sampleRate;}copyToChannel(data:Float32Array,c:number){this.channels[c].set(data);}getChannelData(c:number){return this.channels[c];}}
 const original=Object.getOwnPropertyDescriptor(globalThis,'AudioBuffer');Object.defineProperty(globalThis,'AudioBuffer',{value:TestBuffer,configurable:true});
 const records:{when:number;offset:number;duration:number;buffer:TestBuffer}[]=[],errors:unknown[]=[];let playback:InstanceType<typeof SyncedAudio>|undefined;
 const input=new Input({source:new BlobSource(new Blob([await readFile(new URL('./fixtures/audio-ac3.mkv',import.meta.url))])),formats:ALL_FORMATS});
 try{await ensureAudioDecoder('ac3');const track=(await input.getPrimaryAudioTrack())!;const media=Object.assign(new EventTarget(),{currentTime:0,paused:false,seeking:false,readyState:4,playbackRate:1})as unknown as HTMLVideoElement;
 const context={currentTime:0,resume:async()=>{},createBuffer:(channels:number,length:number,sampleRate:number)=>new TestBuffer({numberOfChannels:channels,length,sampleRate}),createBufferSource:()=>({buffer:null as TestBuffer|null,playbackRate:{value:1},connect(){},disconnect(){},stop(){},onended:null,start(when:number,offset:number,duration:number){records.push({when,offset,duration,buffer:this.buffer!});}})};
 playback=new SyncedAudio(track,media,{context,input:{}}as never,e=>errors.push(e));const deadline=Date.now()+5000;while(!errors.length&&(!records.length||records.at(-1)!.when+records.at(-1)!.duration<1)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));assert.deepEqual(errors,[]);assert.ok(records.length>20);
 for(let i=0;i<records.length;i++){const r=records[i];assert.equal(r.buffer.numberOfChannels,2);if(i)near(r.when,records[i-1].when+records[i-1].duration);for(let c=0;c<2;c++)assert.ok(r.buffer.getChannelData(c).every(v=>Number.isFinite(v)&&Math.abs(v)<=1));}near(records[0].when,.08);
 }finally{playback?.dispose();input.dispose();if(original)Object.defineProperty(globalThis,'AudioBuffer',original);else Reflect.deleteProperty(globalThis,'AudioBuffer');}
});
