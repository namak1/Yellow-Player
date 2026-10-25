import{test}from'node:test';import assert from'node:assert/strict';
import{emptySkips,parseSkipTime,skipRangeError,restoreSkips,skipIntervals,skipTarget,type SkipSettings}from'../src/skipRanges';
import{BrowserEngine}from'../src/engine';
const settings:SkipSettings={enabled:true,ranges:[{id:'1',start:1210,end:1335,enabled:true},{id:'2',start:2400,end:2460,enabled:true}]};
test('user example: 1:50:49 video skips 0:20:10 through 0:22:15 with multiple ranges',()=>{
 const duration=parseSkipTime('1:50:49')!;assert.equal(duration,6649);assert.equal(parseSkipTime('0:20:10'),1210);assert.equal(parseSkipTime('0:22:15'),1335);assert.equal(skipRangeError(1210,1335,duration),'');
 const intervals=skipIntervals(settings);assert.equal(skipTarget(1209.99,intervals,duration),1209.99);assert.equal(skipTarget(1210,intervals,duration),1335);assert.equal(skipTarget(1300,intervals,duration),1335);assert.equal(skipTarget(1335,intervals,duration),1335);assert.equal(skipTarget(2420,intervals,duration),2460);
});
test('strict time input and validation reject malformed, reversed, and out-of-duration ranges',()=>{
 for(const text of ['',':','-1','1::20','1:60','0:20:70','1:2:3:4:5','NaN','Infinity','4e3'])assert.equal(parseSkipTime(text),null,text);
 assert.equal(parseSkipTime('20:10'),1210);assert.equal(parseSkipTime(' 125.25 '),125.25);assert.equal(parseSkipTime('0:00:01.5'),1.5);
 assert.ok(skipRangeError(null,2));assert.ok(skipRangeError(5,5));assert.ok(skipRangeError(5,4));assert.ok(skipRangeError(-1,4));assert.ok(skipRangeError(5,11,10));assert.equal(skipRangeError(5,10,10),'');
});
test('overlap and touching intervals form one jump, independent of input order',()=>{
 const intervals=skipIntervals({enabled:true,ranges:[{id:'c',start:20,end:30,enabled:true},{id:'b',start:15,end:22,enabled:true},{id:'a',start:10,end:15,enabled:true}]});
 assert.deepEqual(intervals,[{start:10,end:30}]);assert.equal(skipTarget(10,intervals),30);assert.equal(skipTarget(30,intervals),30);
});
test('individual and master toggles preserve saved ranges, but disable their jumps',()=>{
 assert.deepEqual(skipIntervals({...settings,enabled:false}),[]);assert.equal(skipTarget(1300,skipIntervals({...settings,enabled:false})),1300);
 const disabled={...settings,ranges:settings.ranges.map(r=>({...r,enabled:r.id!=='1'}))};assert.equal(skipTarget(1300,skipIntervals(disabled)),1300);assert.equal(skipTarget(2420,skipIntervals(disabled)),2460);assert.equal(settings.ranges.length,2);
});
test('saved ranges restore safely and cannot leak malformed times into playback',()=>{
 assert.deepEqual(restoreSkips(null),emptySkips());assert.deepEqual(restoreSkips(settings),settings);
 assert.deepEqual(restoreSkips({enabled:false,ranges:[{id:'bad',start:NaN,end:3},{id:'reverse',start:5,end:2},{id:'valid',start:2,end:4,enabled:true}]}),{enabled:false,ranges:[{id:'valid',start:2,end:4,enabled:true}]});
});
test('seeking and restarting route through skip ranges, including ranges at video boundaries',()=>{
 const intervals=skipIntervals({enabled:true,ranges:[{id:'intro',start:0,end:10,enabled:true},{id:'end',start:25,end:30,enabled:true}]});
 const media={duration:30,currentTime:15,readyState:4,seekable:{length:0}}as HTMLVideoElement;
 const engine=new BrowserEngine(media,30,t=>skipTarget(t,intervals,30));engine.seek(0);assert.equal(media.currentTime,10);engine.seek(6);assert.equal(media.currentTime,10);engine.seek(10);assert.equal(media.currentTime,10);engine.seek(26);assert.equal(media.currentTime,30);engine.seek(NaN);assert.equal(media.currentTime,30);
 assert.equal(skipTarget(20,[{start:10,end:40}],30),30);
});

test('millisecond colon input preserves the exact requested endpoints and boundary behavior',async()=>{
 const {formatSkipTime}=await import('../src/skipRanges');
 const start=parseSkipTime('0:20:10:200')!,end=parseSkipTime('0:22:15:400')!;
 assert.equal(start,1210.2);assert.equal(end,1335.4);
 assert.equal(formatSkipTime(start),'0:20:10:200');assert.equal(formatSkipTime(end),'0:22:15:400');
 const intervals=skipIntervals({enabled:true,ranges:[{id:'ms',start,end,enabled:true}]});
 assert.equal(skipTarget(1210.199,intervals),1210.199);assert.equal(skipTarget(1210.2,intervals),1335.4);assert.equal(skipTarget(1335.399,intervals),1335.4);assert.equal(skipTarget(1335.4,intervals),1335.4);
 for(const value of [0,.001,.999,59.999,60,3599.999,3600,6649.4])assert.equal(parseSkipTime(formatSkipTime(value)),value);
 assert.equal(formatSkipTime(59.9999),'0:01:00:000');assert.equal(formatSkipTime(3599.9999),'1:00:00:000');
 assert.equal(parseSkipTime('0:00:00:001'),.001);assert.equal(parseSkipTime('0:00:00:999'),.999);
 for(const value of ['0:20:10:1000','0:20:10:','0:20:60:200','0:60:10:200','0:20:10:-2','0:20:10:20.5'])assert.equal(parseSkipTime(value),null,value);
});
