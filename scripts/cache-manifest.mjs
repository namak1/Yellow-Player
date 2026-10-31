import{readdir,writeFile,readFile}from'node:fs/promises';import{createHash}from'node:crypto';
async function files(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${e.name}`;out.push(...(e.isDirectory()?await files(p):[p]));}return out;}
const assets=(await files('dist')).filter(x=>!x.endsWith('sw.js')).map(x=>'./'+x.slice(5));const hash=createHash('sha256');for(const asset of assets){hash.update(asset);hash.update(await readFile('dist/'+asset.slice(2)));}const version=hash.digest('hex').slice(0,12);
const mediaWorker=await readFile('scripts/media-buffer-worker.js','utf8');
await writeFile('dist/sw.js',`${mediaWorker}
const CACHE='yellow-${version}',ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('yellow-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const INDEX=new URL('./index.html',self.registration.scope).href;
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==location.origin)return;
if(u.pathname===new URL('./__buffered_media__',self.registration.scope).pathname){let finish;const keepalive=new Promise(resolve=>{finish=resolve;});event.waitUntil(keepalive);const response=bufferedMedia(event,u,finish);response.catch(finish);event.respondWith(response);return;}
if(event.request.mode==='navigate'&&(u.pathname===new URL(self.registration.scope).pathname||u.pathname===new URL(INDEX).pathname)){event.respondWith(fetch(event.request,{cache:'no-cache'}).then(async response=>{if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(INDEX,response.clone());}catch{}}return response;}).catch(async error=>{const hit=await caches.match(INDEX);if(hit)return hit;throw error;}));return;}
event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));});`);
