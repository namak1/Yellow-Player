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
export function fontDescriptors(font:LocalFont):FontFaceDescriptors{
 const style=font.style+' '+font.fullName;const weight=/black|heavy/i.test(style)?'900':/extra.?bold|ultra.?bold/i.test(style)?'800':/semi.?bold|demi/i.test(style)?'600':/bold/i.test(style)?'700':/medium/i.test(style)?'500':/extra.?light|ultra.?light/i.test(style)?'200':/light/i.test(style)?'300':/thin/i.test(style)?'100':'400';
 return{weight,style:/italic|oblique/i.test(style)?'italic':'normal'};
}
export function familyFaces(font:LocalFont,fonts:LocalFont[]):LocalFont[]{return normalizeFonts([font,...fonts.filter(f=>f.family===font.family)]);}
export async function activateLocalFace(font:LocalFont,fonts:LocalFont[]=[]):Promise<string>{
 const quote=(name:string)=>JSON.stringify(name);
 const loaded=await Promise.all(familyFaces(font,fonts).map(async variant=>{const face=new FontFace(font.fullName,`local(${quote(variant.postscriptName)}), local(${quote(variant.fullName)})`,fontDescriptors(variant));await face.load();return face;}));
 for(const face of loaded)document.fonts.add(face);return font.fullName;
}
