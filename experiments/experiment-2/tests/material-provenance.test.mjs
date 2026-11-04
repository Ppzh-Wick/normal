import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the live Grainient shaders match the independently rendered poster shaders',()=>{
 const source=read('src/vendor/Grainient.jsx'),report=JSON.parse(read('docs/grainient-native-render.json'));
 for(const [name,sha] of Object.entries(report.shader_sha256)){
  const match=source.match(new RegExp('const '+name+' = `([\\s\\S]*?)`;'));assert.ok(match,name);
  assert.equal(createHash('sha256').update(match[1]).digest('hex'),sha,name);
 }
 assert.match(report.kind,/not browser GPU/);
});
test('the material poster ships and the frosted-only GlassSurface does not create graphics resources',()=>{
 const poster=readFileSync(new URL('../public/images/materials/mineral-grain.webp',import.meta.url));assert.ok(poster.length>10000);assert.ok(poster.length<60000);assert.equal(poster.toString('ascii',8,12),'WEBP');
 const glass=read('src/vendor/GlassSurface.jsx');assert.match(glass,/glass-surface__sheen/);assert.match(glass,/glass-surface__rim/);assert.match(glass,/glass-surface__content/);assert.doesNotMatch(glass,/getContext|requestAnimationFrame|ResizeObserver|useEffect/);
 const css=read('src/frost.css');assert.match(css,/max-width:999px/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/backdrop-filter:none/);
});
test('the new preview is visibly named experiment two and keeps the documented source path',()=>{
 assert.match(read('index.html'),/<title>李承三 · 山河之间 · 实验2<\/title>/);assert.match(read('src/App.jsx'),/李承三 · 实验2/);assert.match(read('README.md'),/previews\/experiment-2\//);
});
