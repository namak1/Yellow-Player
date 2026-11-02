import{mediaKey}from'./subtitles';
export type RecentFileHandle=FileSystemFileHandle&{queryPermission:(options:{mode:'read'})=>Promise<PermissionState>;requestPermission:(options:{mode:'read'})=>Promise<PermissionState>};
export type RecentMedia={id:string;name:string;time:number;local:boolean|undefined;url?:string;size?:number;lastModified?:number;handle?:RecentFileHandle;legacy?:boolean};
export function recentEntry(item:{id:string;name:string;local:boolean;url:string;file?:File;handle?:RecentFileHandle},time=Date.now()):RecentMedia{
 return item.local?{id:item.id,name:item.name,time,local:true,size:item.file?.size,lastModified:item.file?.lastModified,handle:item.handle}:{id:item.url,name:item.name,time,local:false,url:item.url};
}
export function rememberRecent(history:RecentMedia[],entry:RecentMedia){const old=history.find(h=>h.id===entry.id);return[{...entry,handle:entry.handle??old?.handle},...history.filter(h=>h.id!==entry.id&&!(h.legacy&&h.name===entry.name))].sort((a,b)=>b.time-a.time).slice(0,30);}
export function recentUrl(value:unknown):string|undefined{if(typeof value!=='string')return;try{const url=new URL(value);if(['http:','https:'].includes(url.protocol))return url.href;}catch{}}
export function restoreRecent(value:unknown):RecentMedia[]{
 if(!Array.isArray(value))return[];const result:RecentMedia[]=[];
 for(const item of value){if(!item||typeof item.name!=='string'||!Number.isFinite(item.time))continue;
 const url=recentUrl(item.url)||recentUrl(item.id)||recentUrl(item.name);
 if(url){result.push({id:url,name:item.name,time:item.time,local:false,url});continue;}
 // Early releases kept only a name/date. Do not invent a local source for those entries.
 if(item.local===false)continue;
 const knownLocal=item.local===true&&!item.legacy;
 result.push({...item,id:typeof item.id==='string'?item.id:'legacy:'+item.name,local:knownLocal?true:undefined,url:undefined,legacy:!knownLocal});
 }return result.sort((a,b)=>b.time-a.time).filter((r,i,all)=>all.findIndex(x=>x.id===r.id)===i).slice(0,30);
}
export function matchesRecentFile(entry:RecentMedia,file:File){return entry.legacy?entry.name===file.name:entry.id===mediaKey(file);}
export async function readRecentHandle(handle:RecentFileHandle){const options={mode:'read' as const};if(await handle.queryPermission(options)!=='granted'&&await handle.requestPermission(options)!=='granted')throw Error('File access was not granted. Use Choose file to reopen it.');return handle.getFile();}
