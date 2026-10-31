// Bounded byte-range cache for direct network media. Each playback session has its own cache.
const MEDIA_CHUNK=1024*1024,MEDIA_AHEAD=32,MEDIA_LIMIT=72;
const mediaPending=new Map(),mediaGeneration=new Map(),mediaPrefetch=new Map(),mediaCacheErrors=new Set();
async function mediaChunk(cache,session,source,index,total){
 const key=new URL(`./__media_chunk__/${session}/${index}`,self.registration.scope).href;
 const hit=await cache.match(key);if(hit)return new Uint8Array(await hit.arrayBuffer());
 const pendingKey=session+':'+index;if(mediaPending.has(pendingKey))return mediaPending.get(pendingKey);
 const task=(async()=>{
  const first=index*MEDIA_CHUNK,last=Math.min(total-1,first+MEDIA_CHUNK-1);
  let bytes;let error;for(let attempt=0;attempt<3;attempt++){try{
   const response=await fetch(source,{mode:'cors',headers:{Range:`bytes=${first}-${last}`}});
   if(response.status!==206)throw Error('Media server did not honor the range request');
   bytes=new Uint8Array(await response.arrayBuffer());if(bytes.byteLength!==last-first+1)throw Error('Media server returned an incomplete range');
   break;
  }catch(e){error=e;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,300*(attempt+1)));}}
  if(!bytes||bytes.byteLength!==last-first+1)throw error||Error('Media range unavailable');
  try{await cache.put(key,new Response(bytes));const keys=await cache.keys();for(let i=0;i<keys.length-MEDIA_LIMIT;i++)await cache.delete(keys[i]);}catch{mediaCacheErrors.add(session);/* Playback can still use the network response. */}
  return bytes;
 })().finally(()=>mediaPending.delete(pendingKey));mediaPending.set(pendingKey,task);return task;
}
function mediaStartPrefetch(cache,session,source,index,total,generation,generationKey){
 if(mediaPrefetch.has(generationKey))return;
 const task=(async()=>{for(let i=index;i<index+MEDIA_AHEAD&&i*MEDIA_CHUNK<total;i++){
  if(mediaGeneration.get(generationKey)!==generation)break;
  try{await mediaChunk(cache,session,source,i,total);}catch{break;}
 }})().finally(()=>{mediaPrefetch.delete(generationKey);});mediaPrefetch.set(generationKey,task);
}
async function bufferedMedia(event,url,finish){
 const source=url.searchParams.get('source'),session=url.searchParams.get('session'),total=Number(url.searchParams.get('size'));
 if(!source||!session||!/^[a-zA-Z0-9-]{1,80}$/.test(session)||!/^https?:$/.test(new URL(source).protocol)||!Number.isSafeInteger(total)||total<=0){finish();return new Response('Invalid media source',{status:400});}
 const match=/^bytes=(\d+)-(\d*)$/.exec(event.request.headers.get('range')||'bytes=0-');
 if(!match){finish();return new Response(null,{status:416,headers:{'Content-Range':`bytes */${total}`}});}
 const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),total-1):total-1;
 if(start>=total||end<start){finish();return new Response(null,{status:416,headers:{'Content-Range':`bytes */${total}`}});}
 const cache=await caches.open('yellow-media-'+session);const generationKey=session+':'+(url.searchParams.get('consumer')==='audio'?'audio':'video');const generation=(mediaGeneration.get(generationKey)||0)+1;mediaGeneration.set(generationKey,generation);
 // Keep the worker alive while filling the initial window, including during pause.
 const prefetch=(async()=>{let bytes=0;for(let i=Math.floor(start/MEDIA_CHUNK);i<Math.floor(start/MEDIA_CHUNK)+MEDIA_AHEAD&&i*MEDIA_CHUNK<total;i++){
  if(mediaGeneration.get(generationKey)!==generation)break;
  try{const chunk=await mediaChunk(cache,session,source,i,total);if(mediaGeneration.get(generationKey)!==generation)break;const client=await self.clients.get(event.clientId);if(mediaCacheErrors.has(session)){client?.postMessage({type:'yellow-cache-error',session});break;}bytes+=chunk.byteLength;if(!generationKey.endsWith(':audio'))client?.postMessage({type:'yellow-cache-progress',session,bytes});}catch{break;}
 }})().finally(finish);
 let position=start;
 const stream=new ReadableStream({async pull(controller){
  if(position>end){controller.close();return;}
  try{const index=Math.floor(position/MEDIA_CHUNK),chunk=await mediaChunk(cache,session,source,index,total);const offset=position-index*MEDIA_CHUNK,amount=Math.min(chunk.length-offset,end-position+1);
   if(amount<=0)throw Error('Invalid media range');controller.enqueue(chunk.subarray(offset,offset+amount));position+=amount;
   if(index%4===0)mediaStartPrefetch(cache,session,source,index+1,total,generation,generationKey);
  }catch(error){controller.error(error);}
 }});
 return new Response(stream,{status:206,headers:{'Content-Type':url.searchParams.get('type')||'application/octet-stream','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${total}`,'Content-Length':String(end-start+1),'Cache-Control':'no-store'}});
}
self.addEventListener('message',event=>{if(event.data?.type==='yellow-clear-media'&&/^[a-zA-Z0-9-]+$/.test(event.data.session||'')){mediaCacheErrors.delete(event.data.session);for(const type of ['audio','video']){const key=event.data.session+':'+type;mediaGeneration.set(key,(mediaGeneration.get(key)||0)+1);}event.waitUntil(caches.delete('yellow-media-'+event.data.session));}});
