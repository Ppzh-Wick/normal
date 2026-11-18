import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/opening-portrait.css',import.meta.url),'utf8');
const opening=source.slice(source.indexOf('<section id="opening"'),source.indexOf('<section id="life"'));
test('opening uses the same documented portrait as the biography and preserves access to its original',()=>{
 assert.match(opening,/className="hero-portrait-backdrop" aria-hidden="true"><img src=\{portrait.path\}/);
 assert.match(opening,/className="hero-portrait-source" onClick=\{\(\)=>setMedia\(portrait\)\}/);
 assert.match(opening,/历史肖像原始出处待补充/);
 assert.doesNotMatch(opening,/<StrataPrelude/);
 assert.equal((source.match(/hero-portrait-backdrop/g)||[]).length,1);
});
test('softness is image-only and adds no animated or backdrop blur workload',()=>{
 assert.match(css,/\.opening \.hero-portrait-backdrop img\{[^}]*filter:blur\(\.85px\)/);
 assert.doesNotMatch(css,/backdrop-filter|@keyframes|animation:|transition:|filter:blur\([2-9]/);
 assert.match(css,/\.opening \.hero-title,\.opening \.hero-foot,\.opening \.opening-topline\{z-index:4\}/);
});
