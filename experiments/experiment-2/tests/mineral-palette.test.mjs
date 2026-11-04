import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../src/',import.meta.url);
const luminance=hex=>{const c=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const contrast=(a,b)=>{const l=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(l[0]+.05)/(l[1]+.05)};
test('mineral palette primary text pairs meet AA contrast',()=>{
 for(const [fg,bg] of [['#fff4df','#0b1032'],['#a7b4d9','#0b1032'],['#ffb08c','#0b1032'],['#fff0df','#290f26'],['#c79caa','#290f26'],['#f3a185','#0b1538'],['#172753','#f3ede5'],['#66677b','#ece8e3'],['#8d494a','#f1e7d7'],['#f3b095','#101536']])assert.ok(contrast(fg,bg)>=4.5,`${fg} on ${bg}: ${contrast(fg,bg).toFixed(2)}`);
});
test('color pass does not add loops or recolor historical-image pixels',()=>{
 const css=readFileSync(new URL('mineral.css',root),'utf8');
 assert.doesNotMatch(css,/animation\s*:|\binfinite\b|backdrop-filter|filter\s*:/);
 const atlas=readFileSync(new URL('components/RelationshipAtlas.jsx',root),'utf8');
 assert.doesNotMatch(atlas,/#ae9161|#292824|#191a1b/);
 const terrain=readFileSync(new URL('components/TerrainStage.jsx',root),'utf8');
 assert.doesNotMatch(terrain,/143,76,40|117,75,51|194,154,113/);
});
