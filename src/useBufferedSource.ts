import {useEffect,useState} from 'react';
type Prepared={key:string;url:string;session?:string;managed:boolean;failed?:boolean};
export function useBufferedSource(key:string,source?:string){
 const [prepared,setPrepared]=useState<Prepared|null>(null),[cached,setCached]=useState(0),[cacheError,setCacheError]=useState(false);
 useEffect(()=>{
  if(!source)return;
  const abort=new AbortController(),session=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;let alive=true,used=false;
  const timeout=setTimeout(()=>abort.abort(),10000);
  setPrepared(null);setCached(0);setCacheError(false);
  const message=(event:MessageEvent)=>{if(event.data?.session!==session)return;if(event.data.type==='yellow-cache-progress')setCached(event.data.bytes);if(event.data.type==='yellow-cache-error'){setCached(0);setCacheError(true);}};
  navigator.serviceWorker?.addEventListener('message',message);
  const leave=(event:PageTransitionEvent)=>{if(!event.persisted&&used)navigator.serviceWorker?.controller?.postMessage({type:'yellow-clear-media',session});};
  window.addEventListener('pagehide',leave);
  void (async()=>{
   try{
    if(!navigator.serviceWorker?.controller)throw Error('Service worker is not controlling this page');
    const head=await fetch(source,{method:'HEAD',mode:'cors',signal:abort.signal});
    const size=Number(head.headers.get('content-length'));
    if(!head.ok||!Number.isSafeInteger(size)||size<=0)throw Error('Unknown media size');
    const probe=await fetch(source,{mode:'cors',headers:{Range:'bytes=0-0'},signal:abort.signal});
    if(probe.status!==206||(await probe.arrayBuffer()).byteLength!==1)throw Error('Range requests unsupported');
    const url=new URL('./__buffered_media__',location.href);url.searchParams.set('source',source);url.searchParams.set('session',session);url.searchParams.set('size',String(size));url.searchParams.set('type',head.headers.get('content-type')||'application/octet-stream');
    if(alive){used=true;setPrepared({key,url:url.href,session,managed:true});}
   }catch{if(alive)setPrepared({key,url:source,managed:false});}
   finally{clearTimeout(timeout);}
  })();
  return()=>{alive=false;clearTimeout(timeout);abort.abort();navigator.serviceWorker?.removeEventListener('message',message);window.removeEventListener('pagehide',leave);if(used)navigator.serviceWorker?.controller?.postMessage({type:'yellow-clear-media',session});};
 },[key,source]);
 const current=prepared?.key===key?prepared:null;
 return {url:source?current?.url:undefined,cached:current?.managed?cached:0,managed:!!current?.managed,cacheError,failed:!!current?.failed,ready:!!current,
  fallback:()=>{if(current?.session)navigator.serviceWorker?.controller?.postMessage({type:'yellow-clear-media',session:current.session});if(source)setPrepared({key,url:source,managed:false,failed:true});}};
}
