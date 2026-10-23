import {useEffect,useRef,type RefObject} from 'react';
import SubtitlesOctopus from 'libass-wasm';
export default function AssOverlay({content,time,delay,video,onError}:{content:string;time:number;delay:number;video:RefObject<HTMLVideoElement|null>;onError:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<SubtitlesOctopus|null>(null),error=useRef(onError);error.current=onError;
 useEffect(()=>{const c=canvas.current!;const parent=c.parentElement!;let disposed=false;const r=new SubtitlesOctopus({canvas:c,subContent:content,workerUrl:new URL('./libass/subtitles-octopus-worker.js',location.href).href,legacyWorkerUrl:new URL('./libass/subtitles-octopus-worker-legacy.js',location.href).href,fallbackFont:new URL('./libass/fallback.ttf',location.href).href,onError:()=>{if(!disposed)error.current();},libassMemoryLimit:64,libassGlyphLimit:8});renderer.current=r;
 const resize=()=>{const v=video.current;const ratio=v?.videoWidth&&v.videoHeight?v.videoWidth/v.videoHeight:16/9;const width=Math.min(parent.clientWidth,parent.clientHeight*ratio),height=width/ratio;if(width&&height){r.resize(Math.round(width),Math.round(height));c.style.width=width+'px';c.style.height=height+'px';}};const ro=new ResizeObserver(resize);ro.observe(parent);video.current?.addEventListener('loadedmetadata',resize);resize();return()=>{disposed=true;ro.disconnect();video.current?.removeEventListener('loadedmetadata',resize);r.dispose();renderer.current=null;};},[content,video]);
 useEffect(()=>{renderer.current?.setCurrentTime(Math.max(0,time-delay/1000));},[time,delay]);
 return <canvas ref={canvas} className="ass-overlay" aria-label="Styled ASS subtitles"/>;
}
