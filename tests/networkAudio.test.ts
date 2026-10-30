import{test}from'node:test';import assert from'node:assert/strict';import{createServer}from'node:http';import{readFile}from'node:fs/promises';
import{AudioTrackSession,audioInputSource}from'../src/audioTracks';import{Input,ALL_FORMATS,AudioSampleSink}from'mediabunny';
test('network MKV discovers and automatically routes AC-3, E-AC-3 and DTS; HTTP-range samples decode after seeking',async()=>{
 const data=Object.fromEntries(await Promise.all(['ac3','eac3','dts'].map(async c=>[c,await readFile(new URL(`./fixtures/audio-${c}.mkv`,import.meta.url))])));
 let ranges=0;const server=createServer((req,res)=>{const bytes=data[req.url!.slice(1)];if(!bytes){res.writeHead(404).end();return;}res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Accept-Ranges','bytes');const match=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');let start=0,end=bytes.length-1;if(match){ranges++;start=+match[1];end=Math.min(end,match[2]?+match[2]:end);res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${bytes.length}`);}res.setHeader('Content-Length',end-start+1);res.end(bytes.subarray(start,end+1));});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address()as{port:number};
 try{for(const codec of ['ac3','eac3','dts']){const url=`http://127.0.0.1:${address.port}/${codec}`,selected:string[]=[];class Probe extends AudioTrackSession{override async select(id:string){selected.push(id);}}
 const session=new Probe(new EventTarget()as HTMLVideoElement,()=>{throw Error('No graph needed for routing');},()=>{});
 try{const choices=await session.inspect(url);assert.equal(choices[0].codec,codec);assert.equal(choices[0].available,true);assert.equal(await session.autoSelect(),choices[0].id);assert.deepEqual(selected,[choices[0].id]);}finally{session.dispose();}
 const input=new Input({source:audioInputSource(url),formats:ALL_FORMATS});try{const track=await input.getPrimaryAudioTrack();assert.ok(track);const sink=new AudioSampleSink(track);for(const time of [.5,.1]){const sample=await sink.getSample(time);assert.ok(sample);try{const plane=new Float32Array(sample.allocationSize({planeIndex:0,format:'f32'})/4);sample.copyTo(plane,{planeIndex:0,format:'f32'});assert.ok(plane.every(Number.isFinite));assert.ok(plane.some(v=>Math.abs(v)>.001));}finally{sample.close();}}}finally{input.dispose();}
 }assert.ok(ranges>0);}finally{await new Promise<void>((r,j)=>server.close(e=>e?j(e):r()));}
});
test('unreachable network media reports an error instead of silently returning no tracks',async()=>{
 const session=new AudioTrackSession(new EventTarget()as HTMLVideoElement,()=>{throw Error('No graph');},()=>{});try{await assert.rejects(session.inspect('http://127.0.0.1:1/unavailable.mkv'));}finally{session.dispose();}
});
