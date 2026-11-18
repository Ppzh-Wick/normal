import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const source=new URL('../src/components/ContourNarrative.jsx',import.meta.url);
const output=await build({entryPoints:[source.pathname],bundle:true,jsx:'automatic',platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},external:['react','react-dom']});
const mod={exports:{}};
new Function('require','module','exports',output.outputFiles[0].text)(require,mod,mod.exports);
const data=JSON.parse(readFileSync(new URL('../src/data.json',import.meta.url),'utf8'));

test('abstract contours remain decorative and have a fixed geometry budget',()=>{
 const html=renderToStaticMarkup(React.createElement(mod.exports.ContourBackdrop));
 assert.match(html,/aria-hidden="true"/);
 assert.match(html,/focusable="false"/);
 assert.equal((html.match(/<path /g)||[]).length,19);
 const code=readFileSync(source,'utf8');
 assert.doesNotMatch(code,/requestAnimationFrame|setInterval|setTimeout|addEventListener/);
 assert.match(code,/const contours=Array\.from/);
});
test('opening paper uses unchanged historical media and a named reading action',()=>{
 const html=renderToStaticMarkup(React.createElement(mod.exports.StrataPrelude,{image:data.media.jialing,onRead:()=>{}}));
 assert.ok(html.includes(`src="${data.media.jialing.path}"`));
 assert.match(html,/aria-label="从第24号历史手绘图开始阅读"/);
 assert.equal((html.match(/<button/g)||[]).length,1);
 assert.match(html,/第24号图/);
});
test('chapter ruler has real fragment links and exactly one current location',()=>{
 const chapters=[['opening','山河之间'],['life','走近其人'],['field','一纸山川'],['network','学脉相连'],['legacy','所见所传'],['archive','档案深处'],['sources','有所依据']];
 const calls=[];
 const component=mod.exports.ContourWayfinder({chapters,active:2,onGo:i=>calls.push(i)});
 const html=renderToStaticMarkup(component);
 assert.equal((html.match(/<a /g)||[]).length,7);
 assert.equal((html.match(/aria-current="location"/g)||[]).length,1);
 for(const [id]of chapters)assert.ok(html.includes(`href="#${id}"`));
 const links=component.props.children;
 let prevented=false;links[5].props.onClick({preventDefault(){prevented=true}});
 assert.equal(prevented,true);assert.deepEqual(calls,[5]);
});
test('new spatial styling contains mobile and reduced-motion fallback, no perpetual animation',()=>{
 const css=readFileSync(new URL('../src/contour.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none!important/);
 assert.doesNotMatch(css,/\binfinite\b|backdrop-filter|will-change/);
 const builder=readFileSync(new URL('../scripts/build-standalone.mjs',import.meta.url),'utf8');
 assert.match(builder,/星河学脉\.html/);
 assert.doesNotMatch(builder,/深化候选\.html/);
});

test('museum bookmarks support arrows, Home and End without changing chapter',()=>{
 const chapters=Array.from({length:7},(_,i)=>['chapter-'+i,'章节'+i]);let focused=-1,prevented=0;
 const nav=mod.exports.ContourWayfinder({chapters,active:3,onGo:()=>{throw Error('arrows must not navigate')}});
 const links=chapters.map((_,i)=>({focus(){focused=i}}));
 for(const [current,key,expected]of[[3,'ArrowDown',4],[0,'ArrowUp',6],[6,'ArrowDown',0],[3,'Home',0],[2,'End',6]]){
  nav.props.onKeyDown({key,currentTarget:{querySelectorAll:()=>links},target:{closest:()=>links[current]},preventDefault(){prevented++}});assert.equal(focused,expected);
 }
 assert.equal(prevented,5);
});
test('museum bookmarks preserve readable foregrounds and zero idle animation cost',()=>{
 const chapters=Array.from({length:7},(_,i)=>['chapter-'+i,'章节'+i]);
 const nav=mod.exports.ContourWayfinder({chapters,active:3,onGo:()=>{}});
 const lum=hex=>{const v=hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};
 for(const link of nav.props.children)assert.ok((lum('#f8efdd')+.05)/(lum(link.props.style['--bookmark-color'])+.05)>=4.5);
 const css=readFileSync(new URL('../src/components/MuseumWayfinder.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:999px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(css,/\binfinite\b|backdrop-filter|will-change|@keyframes/);
});
