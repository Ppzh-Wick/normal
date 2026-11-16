import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {footprintStops,footprintIndex,footprintPose} from '../src/components/footprintData.mjs';
const data=JSON.parse(readFileSync(new URL('../src/data.json',import.meta.url),'utf8'));
test('footprints contain 20 chronological life records, each with a source page',()=>{
 assert.equal(footprintStops.length,20);assert.equal(new Set(footprintStops.map(s=>s.id)).size,20);
 footprintStops.forEach((s,i)=>{assert.ok(s.year>=1899&&s.year<=1967);if(i)assert.ok(s.year>=footprintStops[i-1].year);assert.ok(s.place&&s.text&&s.page);for(const p of String(s.page).split('—'))assert.ok(+p>=1&&+p<=11)});
});
test('ambiguous dates and locations remain explicit, publication is not travel',()=>{
 const get=id=>footprintStops.find(s=>s.id===id);
 assert.match(get('nankai').note,/停办范围表述不清/);assert.match(get('xikang').text,/11月15日返校/);
 assert.match(get('xukun').note,/南段.*北段/);assert.match(get('songpan-taiwan').note,/先后未明确/);
 assert.match(get('advice').place,/成都/);assert.match(get('advice').note,/不把.*西昌/);
 assert.match(get('longmen').note,/1960.*1964/);assert.match(get('jialing').note,/1946年报告出版/);
 assert.ok(!footprintStops.some(s=>/海南/.test(s.place)));
 assert.match(get('beijing').note,/不补写月份与日期/);
});
test('historical images have existing files and date-disambiguating captions',()=>{
 for(const s of footprintStops.filter(s=>s.media)){const m=data.media[s.media];assert.ok(m?.path);assert.ok(existsSync(new URL('../public/'+m.path,import.meta.url)));assert.ok(m.width>0&&m.height>0);assert.ok(s.imageNote&&m.sourceUrl)}
 assert.match(footprintStops.find(s=>s.id==='berlin').imageNote,/1938.*晚于/);
});
test('scroll index clamps and reduced-motion poses do not use perspective motion',()=>{
 assert.equal(footprintIndex(-100),0);assert.equal(footprintIndex(999),19);assert.equal(footprintIndex(NaN),0);assert.equal(footprintIndex(5.6),6);
 assert.deepEqual(footprintPose(0,false,true),{transform:'none',opacity:1});assert.equal(footprintPose(1,false,true).opacity,0);assert.equal(footprintPose(.5,false,true).opacity,1);
 assert.doesNotMatch(footprintPose(.2,true).transform,/rotate/);
});
test('journey uses a bounded scroll frame, not a perpetual render loop',()=>{
 const source=readFileSync(new URL('../src/components/FootprintJourney.jsx',import.meta.url),'utf8');
 assert.match(source,/addEventListener\('scroll',onScroll,\{passive:true\}\)/);assert.match(source,/cancelAnimationFrame/);assert.match(source,/document.hidden/);
 assert.doesNotMatch(source,/setInterval|setTimeout|WebGL|preventDefault\(\).*wheel/);
 assert.match(source,/inert=\{!current\}/);assert.match(source,/showModal\(\)/);assert.match(source,/opener.current.focus/);
 const css=readFileSync(new URL('../src/components/FootprintJourney.css',import.meta.url),'utf8');assert.doesNotMatch(css,/infinite|backdrop-filter|filter:blur/);assert.match(css,/prefers-reduced-motion:reduce/);
});
