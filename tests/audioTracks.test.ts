import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{Input,BlobSource,ALL_FORMATS}from'mediabunny';import{nativeChoices,selectNativeTrack,audioSchedule,type NativeAudioList}from'../src/audioTracks';
test('native selection enables exactly one track and rejects invalid indices',()=>{const tracks=Object.assign(new EventTarget(),{length:2,0:{id:'en',label:'English',language:'eng',enabled:true},1:{id:'fa',label:'Persian',language:'fas',enabled:false}})as unknown as NativeAudioList;assert.equal(nativeChoices(tracks)[1].language,'fas');selectNativeTrack(tracks,1);assert.equal(tracks[0].enabled,false);assert.equal(tracks[1].enabled,true);assert.throws(()=>selectNativeTrack(tracks,3));assert.equal(tracks[1].enabled,true);});
test('audio scheduling trims elapsed samples and respects playback rate',()=>{assert.equal(audioSchedule(1,1,2,10,1),null);assert.deepEqual(audioSchedule(1,1,1.25,10,1),{when:10,offset:.25,duration:.75});assert.deepEqual(audioSchedule(4,1,2,10,2),{when:11,offset:0,duration:1});assert.equal(audioSchedule(1,1,0,0,0),null);});
test('local demux finds both AAC tracks and preserves language and default metadata',async()=>{const input=new Input({source:new BlobSource(new Blob([readFileSync(new URL('./fixtures/audio-tracks.m4a',import.meta.url))])),formats:ALL_FORMATS});try{const tracks=await input.getAudioTracks();assert.equal(tracks.length,2);assert.deepEqual(await Promise.all(tracks.map(t=>t.getLanguageCode())),['eng','fas']);assert.deepEqual(await Promise.all(tracks.map(t=>t.getCodec())),['aac','aac']);assert.equal((await input.getPrimaryAudioTrack())?.id,tracks[0].id);}finally{input.dispose();}});

test('signed audio delay schedules later audio and trims earlier audio, including speed changes',()=>{
 assert.deepEqual(audioSchedule(0,1,0,10,1,.5),{when:10.5,offset:0,duration:1});
 assert.deepEqual(audioSchedule(0,1,0,10,1,-.25),{when:10,offset:.25,duration:.75});
 assert.deepEqual(audioSchedule(5,1,5,10,2,.5),{when:10.25,offset:0,duration:1});
 assert.equal(audioSchedule(0,1,2,10,1,-1),null);
});
