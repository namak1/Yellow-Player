export type SubtitleDirection='auto'|'rtl'|'ltr';
// Display-only cleanup: imported/exported cue contents remain untouched.
export function cleanSubtitleBidi(text:string){return text.replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'');}
export function subtitleDirection(text:string,mode:SubtitleDirection='auto'):'rtl'|'ltr'{if(mode!=='auto')return mode;const letters=cleanSubtitleBidi(text).replace(/\{[^}]*\}/g,'').match(/\p{Letter}/gu)||[];return letters.some(c=>/[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(c))?'rtl':'ltr';}
const visible=(s:string)=>cleanSubtitleBidi(s).replace(/\{[^}]*\}/g,'').trim();
/** Detect old visual-order punctuation at track level; a legitimate opening ellipsis alone is not evidence. */
export function hasLegacyPunctuation(texts:Iterable<string>){
 let leading=0,trailing=0,endDash=0,startDash=0;
 for(const text of texts)for(const raw of text.split(/\n|\\[Nn]/)){
  const line=visible(raw);if(subtitleDirection(line)!=='rtl')continue;
  if(/^[-–—]\s/u.test(line))startDash++;
  if(/\s[-–—]$/u.test(line))endDash++;
  const body=line.replace(/^[-–—]\s+/u,'').replace(/\s+[-–—]$/u,'');
  if(/^[.!?؟…]+\s*(?=\p{Letter})/u.test(body))leading++;
  if(/[.!?؟…]$/u.test(body))trailing++;
 }
 return leading>=2&&leading>trailing||endDash>=2&&endDash>startDash;
}
/** Normalize legacy punctuation without reversing letters or changing source/exported cues. */
export function normalizeSubtitleLine(text:string,mode:SubtitleDirection='auto',legacy=false){
 const clean=cleanSubtitleBidi(text);if(subtitleDirection(clean,mode)!=='rtl')return clean;
 const prefix=clean.match(/^(\s*(?:\{[^}]*\}\s*)*)/)![1];let body=clean.slice(prefix.length);
 const suffix=body.match(/((?:\{[^}]*\}\s*)+)$/)?.[1]||'';if(suffix)body=body.slice(0,-suffix.length);
 let dialogue='';
 if(legacy){const endDash=body.match(/\s+([-–—])\s*$/u);if(endDash&&!/^[-–—]\s/u.test(body)){dialogue=endDash[1]+' ';body=body.slice(0,endDash.index);}}
 const opening=body.match(/^([-–—]\s+)/u);if(opening){dialogue=opening[1];body=body.slice(opening[1].length);}
 const punctuation=body.match(/^([.!?؟…]+)\s*(?=\p{Letter}|\{)/u);
 if(punctuation){const mark=punctuation[1],ellipsis=/^(?:\.{2,}|…+)$/.test(mark),rest=body.slice(punctuation[0].length);if((!ellipsis||legacy)&&!/[.!?؟…]$/.test(visible(rest)))body=rest.trimEnd()+mark;}
 return prefix+dialogue+body+suffix;
}
export function directionalAss(content:string,mode:SubtitleDirection='auto'){
 const lines=content.split('\n'),texts:string[]=[];let events=false,textIndex=9;
 for(const line of lines){if(line.startsWith('[')){events=/^\[events\]/i.test(line);continue;}if(!events)continue;if(/^Format:/i.test(line))textIndex=line.slice(line.indexOf(':')+1).split(',').findIndex(f=>f.trim().toLowerCase()==='text');if(/^Dialogue:/i.test(line)&&textIndex>=0)texts.push(line.slice(line.indexOf(':')+1).split(',').slice(textIndex).join(','));}
 const legacy=hasLegacyPunctuation(texts);events=false;textIndex=9;
 return lines.map(line=>{
  if(line.startsWith('[')){events=/^\[events\]/i.test(line);return line;}if(!events)return line;
  if(/^Format:/i.test(line)){textIndex=line.slice(line.indexOf(':')+1).split(',').findIndex(f=>f.trim().toLowerCase()==='text');return line;}
  if(!/^Dialogue:/i.test(line)||textIndex<0)return line;
  const colon=line.indexOf(':')+1,parts=line.slice(colon).split(','),original=parts.slice(textIndex).join(',');
  // Drawing commands are geometry rather than subtitle prose.
  if(/\{[^}]*\\p[1-9]/.test(original))return line;
  const rtl=subtitleDirection(original,mode)==='rtl';
  let source=original.replace(/\{\\fe-1\}/g,'');if(rtl)source=source.replace(/\{[^}]*\}/g,tag=>tag.replace(/\\fe-?\d+/g,'\\fe-1'));
  let body=source.split(/(\\[Nn])/).map(part=>{
   if(/^\\[Nn]$/.test(part))return part;const clean=normalizeSubtitleLine(part,mode,legacy);if(!clean)return clean;
   const mark=subtitleDirection(clean,mode)==='rtl'?'\u200f':'\u200e';return mark+clean+mark;
  }).join('');
  // libass otherwise uses VSFilter's LTR base and lays individually styled runs left-to-right.
  // Encoding -1 enables whole-line bidi layout; the per-line marks retain explicit direction.
  if(rtl)body='{\\fe-1}'+body.replace(/(\{[^}]*\\r[^}]*)(\})/g,'$1\\fe-1$2');
  return line.slice(0,colon)+parts.slice(0,textIndex).join(',')+','+body;
 }).join('\n');
}
