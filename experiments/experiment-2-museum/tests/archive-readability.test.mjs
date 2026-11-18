import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
test('paper archive ink and controls contrast across both gradient endpoints',()=>{
 for(const background of ['#ece8e3','#f8eadb','#f8f3eb']) {
  for(const foreground of ['#243153','#54586a','#784c36']) assert.ok(ratio(foreground,background)>=4.5,`${foreground}/${background}`);
  assert.ok(ratio('#8a8075',background)>=3);
 }
});
test('archive light theme owns all foreground tokens without recoloring historical images',()=>{
 const room=read('src/components/ArchiveRoom.css'),gallery=read('src/components/ArchiveGallery.css'),theme=read('src/frost.css');
 assert.doesNotMatch(room,/color:#e5dccb|color:#a89d8e/);
 assert.doesNotMatch(gallery,/color:#d0ccc0/);
 for(const token of ['--ar-ink:#243153','--ar-muted:#54586a','--ar-accent:#784c36','--gallery-paper:#243153','--gallery-provenance:#243153'])assert.ok(theme.includes(token));
 assert.doesNotMatch(theme,/\.archive-is-open[^{}]*img[^{}]*\{[^}]*filter/);
});
test('memorial background removes upper cyan ribbons and spotlight, retaining lower violet mist',()=>{
 const svg=read('public/images/materials/memorial-aurora.svg'),css=read('src/galaxy.css');
 assert.doesNotMatch(svg,/id="ribbon"|id="veil"|#56d6cb|#6cdbc6|M-180|M650 60/);
 assert.match(svg,/id="violet"/);assert.equal((svg.match(/<path /g)||[]).length,2);
 assert.doesNotMatch(css,/#153b60/);
});
