import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';import vm from'node:vm';
test('built service worker caches all bundled files, falls back offline, and ignores foreign requests',async t=>{
 if(!existsSync('dist/sw.js')){t.skip('Run npm run build to test generated service worker');return;}
 const handlers:Record<string,(e:any)=>void>={};const cache=new Map<string,unknown>();let claimed=false;
 const scope='https://example.com/Yellow-Player/';const normalize=(x:any)=>new URL(typeof x==='string'?x:x.url||x.href,scope).href;
 const context={URL,location:{origin:'https://example.com'},self:{registration:{scope},clients:{claim:()=>{claimed=true;}},addEventListener:(k:string,fn:any)=>handlers[k]=fn},caches:{open:async()=>({addAll:async(items:string[])=>{for(const item of items){assert.ok(existsSync('dist/'+item.slice(2)));cache.set(normalize(item),{asset:item});}}}),keys:async()=>[],delete:async()=>true,match:async(x:any)=>cache.get(normalize(x))},fetch:async()=>{throw Error('offline');}};
 vm.runInNewContext(readFileSync('dist/sw.js','utf8'),context);let waiting:Promise<unknown>=Promise.resolve();handlers.install({waitUntil:(p:Promise<unknown>)=>waiting=p});await waiting;assert.ok(cache.size>5);handlers.activate({waitUntil:(p:Promise<unknown>)=>waiting=p});await waiting;assert.ok(claimed);
 let response:Promise<any>=Promise.resolve();handlers.fetch({request:{url:scope,method:'GET',mode:'navigate'},respondWith:(p:Promise<any>)=>response=p});assert.deepEqual(await response,{asset:'./index.html'});
 let intercepted=false;handlers.fetch({request:{url:'https://remote.example/video.mp4',method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
