import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{timelineDuration,fileDuration,bufferedGradient}from'../src/mediaTimeline';import{BrowserEngine}from'../src/engine';
const ranges=(end:number)=>({length:1,start:()=>0,end:()=>end})as TimeRanges;
test('late native duration supersedes file estimate; unknown duration uses container or seekable range',()=>{
 assert.equal(timelineDuration({duration:30,seekable:ranges(10)},29),30);
 assert.equal(timelineDuration({duration:Infinity,seekable:ranges(10)},5400),5400);
 assert.equal(timelineDuration({duration:NaN,seekable:ranges(120)}),120);
 assert.equal(timelineDuration({duration:0,seekable:{length:0}as TimeRanges}),0);
});
test('seek works with unknown browser duration and container metadata, including keyboard targets',()=>{
 const media={duration:Infinity,currentTime:3905,readyState:4,seekable:{length:0}}as HTMLVideoElement;
 const engine=new BrowserEngine(media,5400);engine.seek(2700);assert.equal(media.currentTime,2700);engine.seek(6000);assert.equal(media.currentTime,5400);engine.seek(NaN);assert.equal(media.currentTime,5400);
 const seekable={duration:NaN,currentTime:0,seekable:ranges(120)}as HTMLVideoElement;new BrowserEngine(seekable).seek(60);assert.equal(seekable.currentTime,60);
});
test('local container duration is readable independently of browser metadata',async()=>{
 const file=new Blob([await readFile(new URL('./fixtures/embedded.mkv',import.meta.url))]);
 const duration=await fileDuration(file,new AbortController().signal);assert.ok(duration>0&&Number.isFinite(duration));
});

test('buffered timeline shows separate ranges and clamps them to the duration',()=>{
 const buffered={length:2,start:(i:number)=>[0,70][i],end:(i:number)=>[30,120][i]} as TimeRanges;
 assert.equal(bufferedGradient(buffered,100),'linear-gradient(to right,#555 0%,#555 0%,#38bdf8 0%,#38bdf8 30%,#555 30%,#555 70%,#38bdf8 70%,#38bdf8 100%,#555 100%,#555 100%)');
 assert.equal(bufferedGradient(buffered,0),'#555');
 assert.equal(bufferedGradient({length:0} as TimeRanges,100),'#555');
});
