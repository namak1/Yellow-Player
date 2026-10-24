import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{renderToStaticMarkup}from'react-dom/server';import{hasLegacyPunctuation,normalizeSubtitleLine,directionalAss}from'../src/subtitleDirection';import SubtitleText from'../src/SubtitleText';import{parseSubtitles}from'../src/subtitles';import{exportSrt}from'../src/subtitleEditing';
test('screenshot punctuation examples are normalized at track level while source cues remain unchanged',async()=>{
 const raw=await readFile(new URL('./fixtures/rtl-punctuation.srt',import.meta.url),'utf8'),cues=parseSubtitles(raw,'fixture.srt');const legacy=hasLegacyPunctuation(cues.map(c=>c.text));assert.equal(legacy,true);
 const lines=cues.map(c=>c.text).join('\n').split('\n');const expected=['بیا بهمون کمک کن!','- سلام جناب ناخدا. خوشوقتم','- منم همینطور','میدونی دیگه...'];assert.deepEqual(lines.map(l=>normalizeSubtitleLine(l,'auto',legacy)),expected);
 const html=renderToStaticMarkup(<SubtitleText text={cues[1].text} legacyPunctuation={legacy}/>);assert.match(html,/dir="rtl">- سلام/);assert.match(html,/dir="rtl">- منم/);assert.ok(exportSrt(cues).includes('!بیا بهمون کمک کن'));assert.ok(exportSrt(cues).includes('...میدونی دیگه'));
});
test('ordinary leading ellipses, decimals, English, correct punctuation and forced LTR are preserved',()=>{
 assert.equal(hasLegacyPunctuation(['...شاید','سلام.','خداحافظ!']),false);assert.equal(normalizeSubtitleLine('...شاید'),'...شاید');assert.equal(normalizeSubtitleLine('.5 درصد','auto',true),'.5 درصد');assert.equal(normalizeSubtitleLine('...The end','auto',true),'...The end');assert.equal(normalizeSubtitleLine('سلام!'),'سلام!');assert.equal(normalizeSubtitleLine('!بیا','ltr',true),'!بیا');assert.equal(normalizeSubtitleLine('!بیا'),'بیا!');assert.equal(normalizeSubtitleLine('؟چطوری'),'چطوری؟');assert.equal(normalizeSubtitleLine('...شاید...','auto',true),'...شاید...');
});
test('ASS enables whole-line bidi layout and corrects punctuation across style runs without modifying timing',async()=>{
 const raw=await readFile(new URL('./fixtures/rtl-punctuation.ass',import.meta.url),'utf8');const fixed=directionalAss(raw);assert.ok(fixed.includes('{\\fe-1}\u200fبیا بهمون کمک کن!\u200f'));assert.ok(fixed.includes('\u200f- سلام {\\b1}جناب{\\b0} ناخدا. خوشوقتم\u200f\\N\u200f- منم همینطور\u200f'));assert.ok(fixed.includes('\u200fمیدونی دیگه...\u200f'));assert.ok(fixed.includes('0:00:08.00,0:00:16.00'));assert.ok(raw.includes('...میدونی دیگه'));
});
test('ASS reset tags retain automatic bidi encoding; vector drawings remain untouched',()=>{
 const raw='[Events]\nDialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,سلام {\\rDefault}دنیا.\nDialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,{\\p1}m 0 0 l 20 20';const fixed=directionalAss(raw);assert.ok(fixed.includes('{\\rDefault\\fe-1}'));assert.ok(fixed.endsWith('{\\p1}m 0 0 l 20 20'));assert.ok(!directionalAss(raw,'ltr').includes('{\\fe-1}'));
});
