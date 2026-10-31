import {useEffect,useState,type RefObject} from 'react';

type Download={key:string;url:string;position:number};
type Status={key:string;text:string};

// Download the original response separately so buffering can continue when media is paused.
export function usePausedDownload(video:RefObject<HTMLVideoElement|null>,key:string,source?:string){
 const [download,setDownload]=useState<Download|null>(null);
 const [status,setStatus]=useState<Status|null>(null);
 useEffect(()=>{
  const media=video.current;setDownload(null);setStatus(null);if(!media||!source)return;
  const controller=new AbortController();let started=false,objectUrl='',ready=false,activated=false,closed=false;
  const activate=()=>{if(!ready||!objectUrl||activated||!media.paused||media.ended)return;activated=true;setDownload({key,url:objectUrl,position:media.currentTime});setStatus({key,text:'Downloaded'});};
  const begin=()=>{
   if(ready){activate();return;}
   if(started||media.ended||media.currentSrc!==source)return;
   if(!Number.isFinite(media.duration)||media.duration<=0){setStatus({key,text:'Background download unavailable for live streams'});return;}
   started=true;setStatus({key,text:'Downloading in background…'});
   void (async()=>{
    try{
     const response=await fetch(source,{signal:controller.signal,mode:'cors'});
     if(!response.ok||response.status!==200||!response.body||/mpegurl|dash\+xml/i.test(response.headers.get('content-type')||'')||/\.(m3u8|mpd)(?:[?#]|$)/i.test(source))throw Error('The server did not provide a complete media file.');
     const total=Number(response.headers.get('content-length'))||0,reader=response.body.getReader(),chunks:Uint8Array<ArrayBuffer>[]=[];let received=0,lastUpdate=0;
     while(true){const {done,value}=await reader.read();if(done)break;if(value){chunks.push(value as Uint8Array<ArrayBuffer>);received+=value.byteLength;if(Date.now()-lastUpdate>500){lastUpdate=Date.now();setStatus({key,text:total?`Downloading in background… ${Math.min(100,Math.floor(received/total*100))}%`:`Downloading in background… ${(received/1048576).toFixed(1)} MB`});}}}
     if(!received||closed)return;
     objectUrl=URL.createObjectURL(new Blob(chunks,{type:response.headers.get('content-type')||''}));ready=true;
     if(media.paused)activate();else setStatus({key,text:'Downloaded · ready when paused'});
    }catch(e){if(!controller.signal.aborted){started=false;setStatus({key,text:'Background download unavailable'});}}
   })();
  };
  media.addEventListener('pause',begin);
  return()=>{closed=true;controller.abort();media.removeEventListener('pause',begin);if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[video,key,source]);
 return {download:download?.key===key?download:null,status:status?.key===key?status.text:''};
}
