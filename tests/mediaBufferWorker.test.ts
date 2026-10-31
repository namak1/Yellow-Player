import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('range cache prefetches from the requested offset and serves those bytes offline',async()=>{
 const size=6*1024*1024;const files=new Map<string,Response>();const requests:number[]=[];let offline=false;
 const cache={match:async(key:string)=>files.get(key)?.clone(),put:async(key:string,value:Response)=>{files.set(key,value.clone());},keys:async()=>[...files.keys()].map(url=>({url})),delete:async(key:string|{url:string})=>files.delete(typeof key==='string'?key:key.url)};
 const self={registration:{scope:'https://player.example/'},clients:{get:async()=>({postMessage:()=>{}})},addEventListener:()=>{}};
 const context=vm.createContext({URL,Headers,Response,ReadableStream,Uint8Array,Map,Number,Math,Error,Promise,setTimeout,self,caches:{open:async()=>cache},fetch:async(_url:string,init:{headers:{Range:string}})=>{
  if(offline)throw Error('offline');const [,first,last]=/^bytes=(\d+)-(\d+)$/.exec(init.headers.Range)!;const start=+first;requests.push(start);return new Response(new Uint8Array(+last-start+1).fill(Math.floor(start/1048576)),{status:206});
 }});
 vm.runInContext(await readFile('scripts/media-buffer-worker.js','utf8'),context);
 const run=vm.runInContext('bufferedMedia',context) as (event:unknown,url:URL,finish:()=>void)=>Promise<Response>;
 const url=new URL('https://player.example/__buffered_media__?source=https%3A%2F%2Fmedia.example%2Fvideo&session=test&size='+size);
 let finish!:()=>void;const done=new Promise<void>(resolve=>{finish=resolve;});
 const response=await run({request:{headers:new Headers({Range:'bytes=2097152-2098175'})},clientId:'test'},url,finish);
 assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),`bytes 2097152-2098175/${size}`);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],Array(1024).fill(2));
 await done;assert.ok(requests.length>1);assert.ok(requests.every(offset=>offset>=2097152));
 offline=true;let doneOffline!:()=>void;const finished=new Promise<void>(resolve=>{doneOffline=resolve;});const cached=await run({request:{headers:new Headers({Range:'bytes=3145728-3146751'})},clientId:'test'},url,doneOffline);
 assert.equal(cached.status,206);assert.deepEqual([...new Uint8Array(await cached.arrayBuffer())],Array(1024).fill(3));await finished;
});
