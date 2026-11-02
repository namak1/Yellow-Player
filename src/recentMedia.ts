import{mediaKey}from'./subtitles';
export type RecentFileHandle=FileSystemFileHandle&{queryPermission:(options:{mode:'read'})=>Promise<PermissionState>;requestPermission:(options:{mode:'read'})=>Promise<PermissionState>};
export type RecentMedia={id:string;name:string;time:number;local:boolean;url?:string;size?:number;lastModified?:number;handle?:RecentFileHandle;legacy?:boolean};
export function recentEntry(item:{id:string;name:string;local:boolean;url:string;file?:File;handle?:RecentFileHandle},time=Date.now()):RecentMedia{
 return item.local?{id:item.id,name:item.name,time,local:true,size:item.file?.size,lastModified:item.file?.lastModified,handle:item.handle}:{id:item.url,name:item.name,time,local:false,url:item.url};
}
export function rememberRecent(history:RecentMedia[],entry:RecentMedia){const old=history.find(h=>h.id===entry.id);return[{...entry,handle:entry.handle??old?.handle},...history.filter(h=>h.id!==entry.id&&!(h.legacy&&h.name===entry.name))].sort((a,b)=>b.time-a.time).slice(0,30);}
export function restoreRecent(value:unknown):RecentMedia[]{
 if(!Array.isArray(value))return[];const result:RecentMedia[]=[];
 for(const item of value){if(!item||typeof item.name!=='string'||!Number.isFinite(item.time))continue;
 if(typeof item.id!=='string'){result.push({id:'legacy:'+item.name,name:item.name,time:item.time,local:true,legacy:true});continue;}
 if(item.local===false){try{const url=new URL(item.url);if(!['http:','https:'].includes(url.protocol))continue;result.push({...item,id:url.href,url:url.href,local:false,handle:undefined});}catch{continue;}}
 else result.push({...item,local:true,url:undefined});
 }return result.sort((a,b)=>b.time-a.time).filter((r,i,all)=>all.findIndex(x=>x.id===r.id)===i).slice(0,30);
}
export function matchesRecentFile(entry:RecentMedia,file:File){return entry.legacy?entry.name===file.name:entry.id===mediaKey(file);}
export async function readRecentHandle(handle:RecentFileHandle){const options={mode:'read' as const};if(await handle.queryPermission(options)!=='granted'&&await handle.requestPermission(options)!=='granted')throw Error('File access was not granted. Use Choose file to reopen it.');return handle.getFile();}
