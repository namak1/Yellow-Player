export type SubtitleDirection='auto'|'rtl'|'ltr';
// Display-only cleanup: imported/exported cue contents remain untouched.
export function cleanSubtitleBidi(text:string){return text.replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'');}
export function subtitleDirection(text:string,mode:SubtitleDirection='auto'):'rtl'|'ltr'{if(mode!=='auto')return mode;const letters=cleanSubtitleBidi(text).replace(/\{[^}]*\}/g,'').match(/\p{Letter}/gu)||[];return letters.some(c=>/[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(c))?'rtl':'ltr';}
/** Some legacy Persian subtitles store a sentence's period before its first word.
 * Normalize that specific pattern for display, never the original cues/export.
 * Preserve leading ellipses, decimal fractions and English/forced-LTR lines.
 */
export function normalizeSubtitleLine(text:string,mode:SubtitleDirection='auto'){
 const clean=cleanSubtitleBidi(text);if(subtitleDirection(clean,mode)!=='rtl')return clean;
 const match=clean.match(/^(\s*(?:\{[^}]*\}\s*)*)\.(?![.\d۰-۹٠-٩])\s*(?=\p{Letter})([\s\S]*?)(\s*)$/u);
 if(!match)return clean;
 const visible=match[2].replace(/\{[^}]*\}/g,'').trimEnd();if(/[.!?؟…]$/.test(visible))return clean;
 return match[1]+match[2]+'.'+match[3];
}
export function directionalAss(content:string,mode:SubtitleDirection='auto'){
 let events=false,textIndex=9;return content.split('\n').map(line=>{if(line.startsWith('[')){events=/^\[events\]/i.test(line);return line;}if(!events)return line;if(/^Format:/i.test(line)){textIndex=line.slice(line.indexOf(':')+1).split(',').findIndex(f=>f.trim().toLowerCase()==='text');return line;}if(!/^Dialogue:/i.test(line)||textIndex<0)return line;const colon=line.indexOf(':')+1,parts=line.slice(colon).split(',');const body=parts.slice(textIndex).join(',').split(/(\\[Nn])/).map(part=>{if(/^\\[Nn]$/.test(part))return part;const clean=normalizeSubtitleLine(part,mode);if(!clean)return clean;const dir=subtitleDirection(clean,mode);const mark=dir==='rtl'?'\u200f':'\u200e';return mark+clean+mark;}).join('');return line.slice(0,colon)+parts.slice(0,textIndex).join(',')+','+body;}).join('\n');
}
