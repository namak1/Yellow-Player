import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';import vm from'node:vm';
test('service worker updates cached app HTML online, retains offline fallback and activates completed updates',async t=>{
 if(!existsSync('dist/sw.js')){t.skip('Run npm run build to test generated service worker');return;}
 const handlers:Record<string,(e:any)=>void>={};const cache=new Map<string,unknown>();let claimed=false,skipped=false,online=false,requests=0;
 const scope='https://example.com/Yellow-Player/';const normalize=(x:any)=>new URL(typeof x==='string'?x:x.url||x.href,scope).href;
 const fresh={ok:true,version:'latest',clone:()=>({version:'latest cached'})};
 const context={URL,location:{origin:'https://example.com'},self:{registration:{scope},skipWaiting:async()=>{skipped=true;},clients:{claim:()=>{claimed=true;}},addEventListener:(k:string,fn:any)=>handlers[k]=fn},caches:{open:async()=>({addAll:async(items:string[])=>{for(const item of items){assert.ok(existsSync('dist/'+item.slice(2)));cache.set(normalize(item),{asset:item});}},put:async(key:any,value:any)=>cache.set(normalize(key),value)}),keys:async()=>[],delete:async()=>true,match:async(x:any)=>cache.get(normalize(x))},fetch:async(_request:any,options:any)=>{requests++;if(online){assert.equal(options?.cache,'no-cache');return fresh;}throw Error('offline');}};
 vm.runInNewContext(readFileSync('dist/sw.js','utf8'),context);let waiting:Promise<unknown>=Promise.resolve();handlers.install({waitUntil:(p:Promise<unknown>)=>waiting=p});await waiting;assert.ok(cache.size>5);assert.ok(skipped);handlers.activate({waitUntil:(p:Promise<unknown>)=>waiting=p});await waiting;assert.ok(claimed);
 const navigate=async()=>{let response:Promise<any>=Promise.resolve();handlers.fetch({request:{url:scope,method:'GET',mode:'navigate'},respondWith:(p:Promise<any>)=>response=p});return response;};
 // Even a previously cached root page must be checked against the network.
 cache.set(scope,{version:'stale root'});online=true;assert.equal(await navigate(),fresh);assert.equal(requests,1);online=false;assert.deepEqual(await navigate(),{version:'latest cached'});
 let intercepted=false;handlers.fetch({request:{url:'https://remote.example/video.mp4',method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 const assetKey=[...cache.keys()].find(k=>k.endsWith('.wasm'))!;const count=requests;let asset:Promise<unknown>=Promise.resolve();handlers.fetch({request:{url:assetKey,method:'GET'},respondWith:(p:Promise<unknown>)=>asset=p});assert.ok(await asset);assert.equal(requests,count);
});
