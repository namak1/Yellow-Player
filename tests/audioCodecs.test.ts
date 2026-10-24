import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{Input,BlobSource,ALL_FORMATS,AudioSampleSink}from'mediabunny';import{ensureAudioDecoder,needsSoftwareAudio}from'../src/audioDecoders';
for(const codec of ['ac3','eac3','dts'])test(`software decoder produces audible six-channel PCM from ${codec.toUpperCase()} in MKV, including a seek`,async()=>{
 await ensureAudioDecoder(codec);const input=new Input({source:new BlobSource(new Blob([await readFile(new URL(`./fixtures/audio-${codec}.mkv`,import.meta.url))])),formats:ALL_FORMATS});
 try{const track=await input.getPrimaryAudioTrack();assert.ok(track);assert.equal(await track.getCodec(),codec);assert.equal(await track.getNumberOfChannels(),6);assert.equal(await track.canDecode(),true);const sink=new AudioSampleSink(track);for(const time of [0,.5,.1]){const sample=await sink.getSample(time);assert.ok(sample);try{assert.equal(sample.numberOfChannels,6);assert.equal(sample.sampleRate,48000);const data=new Float32Array(sample.allocationSize({planeIndex:0,format:'f32'})/4);sample.copyTo(data,{planeIndex:0,format:'f32'});assert.ok(data.every(Number.isFinite));if(time>0)assert.ok(data.some(n=>Math.abs(n)>.001),`decoded ${codec} PCM must not be silent`);}finally{sample.close();}}}finally{input.dispose();}
});
test('software fallback policy targets AC-3, E-AC-3 and DTS without overriding ordinary browser audio',()=>{for(const codec of ['ac3','eac3','dts'])assert.equal(needsSoftwareAudio(codec),true);for(const codec of ['aac','mp3','opus','flac','vorbis','pcm-s16',null])assert.equal(needsSoftwareAudio(codec),false);});

test('local AC-3 inspection and automatic routing work even when the browser exposes a native audio-track list',async()=>{
 const{AudioTrackSession}=await import('../src/audioTracks');const selected:string[]=[];
 class SelectionProbe extends AudioTrackSession{override async select(id:string){selected.push(id);}}
 const media=Object.assign(new EventTarget(),{audioTracks:{length:1,0:{id:'0',label:'Browser track',language:'en',enabled:true}}})as unknown as HTMLVideoElement;
 const session=new SelectionProbe(media,()=>{throw Error('Graph is not needed for the routing probe');},()=>{});
 try{const choices=await session.inspect(new File([await readFile(new URL('./fixtures/audio-ac3.mkv',import.meta.url))],'audio-ac3.mkv'));assert.equal(choices[0].codec,'ac3');assert.equal(choices[0].channels,6);assert.equal(choices[0].available,true);assert.equal(await session.autoSelect(),choices[0].id);assert.deepEqual(selected,[choices[0].id]);}finally{session.dispose();}
});
