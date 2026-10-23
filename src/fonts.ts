export type LocalFont={family:string;fullName:string;postscriptName:string;style:string;blob?:()=>Promise<Blob>};
export type LocalFontWindow={isSecureContext?:boolean;queryLocalFonts?:()=>Promise<LocalFont[]>};
export function normalizeFonts(fonts:LocalFont[]):LocalFont[]{
 const seen=new Set<string>();return fonts.filter(f=>{if(!f.family||!f.fullName||!f.postscriptName||seen.has(f.postscriptName))return false;seen.add(f.postscriptName);return true;}).sort((a,b)=>a.family.localeCompare(b.family,undefined,{sensitivity:'base'})||a.fullName.localeCompare(b.fullName));
}
export async function enumerateLocalFonts(host:LocalFontWindow):Promise<LocalFont[]>{
 if(!host.queryLocalFonts)throw Error('This browser cannot list installed fonts. Type an installed font name below, or load a font file.');
 if(host.isSecureContext===false)throw Error('System font access requires HTTPS or localhost.');
 try{return normalizeFonts(await host.queryLocalFonts());}catch(e){if(e instanceof DOMException&&e.name==='NotAllowedError')throw Error('Font access was not allowed. You can still type a font name or load a font file.');throw e;}
}
export async function activateLocalFace(font:LocalFont):Promise<string>{
 const quote=(name:string)=>'"'+name.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
 const face=new FontFace(font.fullName,`local(${quote(font.postscriptName)}), local(${quote(font.fullName)})`);await face.load();document.fonts.add(face);return font.fullName;
}
