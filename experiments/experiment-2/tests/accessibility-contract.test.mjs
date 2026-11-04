// Static HTML contracts only. These tests do not prove browser keyboard, scroll,
// dialog, visual-contrast, or reduced-motion behavior; those need browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'package.json'));
const result=await build({entryPoints:[resolve(root,'src/App.jsx')],bundle:true,jsx:'automatic',platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},external:['react','react-dom']});
const mod={exports:{}};
new Function('require','module','exports',result.outputFiles[0].text)(require,mod,mod.exports);
const prior=globalThis.matchMedia;
globalThis.matchMedia=()=>({matches:false});
let html;
try {html=renderToStaticMarkup(React.createElement(mod.exports.default));}
finally {if(prior===undefined) delete globalThis.matchMedia;else globalThis.matchMedia=prior;}
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));

test('all seven chapter regions reference existing labels and contain semantic headings',()=>{
 const chapterIds=['opening','life','field','network','legacy','archive','sources'];
 const elements=[...html.matchAll(/<[a-z][^>]*>/g)].map(m=>attrs(m[0]));
 for(const id of chapterIds){
  const region=[...html.matchAll(/<section\b[^>]*>/g)].map(m=>attrs(m[0])).find(a=>a.id===id);
  assert.ok(region,`chapter ${id} exists`);
  assert.ok(elements.some(h=>h.id===region['aria-labelledby']),`${id} accessible label ${region['aria-labelledby']} must exist`);
  const sectionStart=html.indexOf(`id="${id}"`);
  const sectionEnd=html.indexOf('</section>',sectionStart);
  assert.match(html.slice(sectionStart,sectionEnd),/<h[12]\b/,`${id} contains a heading`);
 }
});
test('factual biography precedes the complete 24-node relationship graph',()=>{
 assert.ok(html.indexOf('id="life"')<html.indexOf('id="network"'));
 const life=html.slice(html.indexOf('id="life"'),html.indexOf('id="field"'));
 for(const fact of ['1899','1967','河北涉县','1931','1936','1950','1956']) assert.ok(life.includes(fact),fact);
 assert.equal((html.match(/data-relation-id="/g)||[]).length,24);
 const data=JSON.parse(readFileSync(resolve(root,'src/data.json'),'utf8'));
 for(const n of data.graph.nodes)assert.ok(html.includes(`data-relation-id="${n.id}"`),n.id);
});
test('timeline text-only tabpanel is keyboard reachable',()=>{
 const panel=[...html.matchAll(/<div\b[^>]*>/g)].map(m=>attrs(m[0])).find(a=>a.id==='moment-panel');
 assert.equal(panel?.role,'tabpanel');
 assert.equal(panel?.tabindex,'0','Tab must reach timeline content after the selected tab');
});
test('three research articles expose headings, citations, and relationship crosslinks without tab hiding',()=>{
 const legacy=html.slice(html.indexOf('id="legacy"'),html.indexOf('id="archive"'));
 const articles=[...legacy.matchAll(/<article\b[^>]*class="knowledge-layer[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
 assert.equal(articles.length,3);
 const headings=['观察山川','整理成学问','指导徐开礼'];
 articles.forEach((article,i)=>{
  assert.ok(article.includes(`<h3>${headings[i]}</h3>`),headings[i]);
  assert.match(article,/class="source-note"[^>]*>据《李承三先生年谱》第[^<]+页整理/);
  assert.match(article,/<button class="text-link"[^>]*>[^<]+<\/button>/);
  // Decorative glyphs may be hidden from assistive technology; factual
  // content and its containers must not be. This is an HTML, not CSS, check.
  const factual=article.replace(/<span class="layer-glyph" aria-hidden="true">[^<]*<\/span>/g,'');
  assert.doesNotMatch(factual,/\shidden(?:[=\s>])|aria-hidden="true"/);
 });
 assert.doesNotMatch(legacy,/role="tab(?:panel|list)?"/);
 const source=readFileSync(resolve(root,'src/App.jsx'),'utf8');
 const sourceLegacy=source.slice(source.indexOf('<section id="legacy"'),source.indexOf('<section id="archive"'));
 const data=JSON.parse(readFileSync(resolve(root,'src/data.json'),'utf8'));
 for(const target of ['jialing','sichuan-map','xu-kaili']){
  assert.ok(sourceLegacy.includes(`openRelation('${target}')`),`crosslink to ${target}`);
  assert.ok(data.graph.nodes.some(n=>n.id===target),`crosslink target exists: ${target}`);
 }
});

test('default graph exposes 24 keyboard nodes, 24 alternative-list records, and two unpressed display toggles',()=>{
 const graph=html.slice(html.indexOf('id="network"'),html.indexOf('id="legacy"'));
 const radial=graph.slice(graph.indexOf('<svg'),graph.indexOf('</svg>'));
 assert.equal((radial.match(/data-relation-id=/g)||[]).length,24);
 for(const tag of radial.match(/<g\b[^>]*data-relation-id[^>]*>/g)||[]){
  const a=attrs(tag);assert.equal(a.role,'button');assert.equal(a.tabindex,'0');assert.ok(a['aria-label'].includes('查看史料'));
 }
 assert.match(graph,/<button aria-pressed="false">显示全部关系词<\/button>/);
 assert.match(graph,/<button aria-pressed="false">列表阅读<\/button>/);
 assert.doesNotMatch(radial,/show-all-labels/);
 const list=graph.slice(graph.indexOf('<div class="atlas-complete-list"'),graph.indexOf('<div class="atlas-complete-controls"'));
 assert.equal((list.match(/<button\b/g)||[]).length,24);
 const data=JSON.parse(readFileSync(resolve(root,'src/data.json'),'utf8'));
 for(const node of data.graph.nodes)assert.ok(list.includes(`<strong>${node.name}</strong>`),node.id);
 const source=readFileSync(resolve(root,'src/components/RelationshipAtlas.jsx'),'utf8');
 assert.match(source,/data-scroll-lock=\{list\|\|undefined\}/,'both overview and category lists opt out of chapter-wheel handling');
});
test('reduced-motion rendering contains a plain readable title and decorative terrain only',()=>{
 const previous=globalThis.matchMedia;
 globalThis.matchMedia=query=>({matches:query.includes('prefers-reduced-motion')});
 let reduced;
 try{reduced=renderToStaticMarkup(React.createElement(mod.exports.default));}
 finally{if(previous===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=previous;}
 const opening=reduced.slice(reduced.indexOf('id="opening"'),reduced.indexOf('id="life"'));
 assert.match(opening,/<h1 class="hero-name">李承三<\/h1>/);
 assert.doesNotMatch(opening,/will-change|filter:blur/);
 assert.match(opening,/<canvas[^>]*aria-hidden="true"/);
 assert.ok(opening.includes('非历史地形复原'));
});

// The following exercise actual hook event handlers in a deliberately minimal
// fake DOM. They validate control flow, not layout or real browser interaction.
const hookBuild=await build({entryPoints:[resolve(root,'src/useExhibition.js')],bundle:true,platform:'node',format:'cjs',write:false,external:['react','react-dom']});
function hookHarness(run,{reduced=false}={}){
 const keys=['window','document','location','history','matchMedia','ResizeObserver','innerHeight','performance'];
 const saved=keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]);
 const listeners={},effects=[],states=[],scrolls=[];let clock=1000,activeIndex=0,fontReady;
 const ids=['opening','life','field'];
 const nodes=ids.map((id,i)=>({offsetHeight:800,getBoundingClientRect:()=>({top:(i-activeIndex)*800,bottom:(i-activeIndex+1)*800,height:800}),scrollIntoView:options=>{activeIndex=i;scrolls.push({id,...options});}}));
 const values={
  window:{addEventListener:(k,f)=>listeners[k]=f,removeEventListener:()=>{},scrollBy:()=>{}},
  document:{getElementById:id=>nodes[ids.indexOf(id)],querySelector:()=>null,documentElement:{dataset:{}},fonts:{ready:{then:f=>fontReady=f}}},
  location:{hash:''},history:{replaceState:()=>{},pushState:()=>{}},
  matchMedia:query=>({matches:query.includes('min-width')||reduced,addEventListener:()=>{},removeEventListener:()=>{}}),
  ResizeObserver:class{observe(){}disconnect(){}},innerHeight:800,performance:{now:()=>clock}
 };
 for(const [k,v] of Object.entries(values))Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});
 const react={useCallback:f=>f,useRef:v=>({current:v}),useState:initial=>{const state={value:typeof initial==='function'?initial():initial};states.push(state);return[state.value,v=>state.value=typeof v==='function'?v(state.value):v]},useEffect:f=>effects.push(f)};
 const hookModule={exports:{}};
 try{
  new Function('require','module','exports',hookBuild.outputFiles[0].text)(name=>name==='react'?react:{flushSync:f=>f()},hookModule,hookModule.exports);
  const nav=hookModule.exports.default(ids);const cleanups=effects.map(f=>f());
  const event=(key,{repeat=false,control=false}={})=>{const e={key,repeat,prevented:false,preventDefault(){this.prevented=true},target:{closest:()=>control?{}:null}};listeners.keydown(e);return e};
  run({nav,event,states,scrolls,listeners,document:values.document,advance:n=>clock+=n,fontReady:()=>fontReady(),controlTarget:{closest:()=>({})}});
  cleanups.forEach(f=>f?.());
 }finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
}
test('keyboard handler rejects repeated and locked chapter moves but always permits Escape from controls',()=>{
 hookHarness(({event,scrolls,states})=>{
  assert.equal(event('PageDown',{repeat:true}).prevented,true);assert.equal(scrolls.length,0);
  event('PageDown');assert.equal(scrolls.length,1);assert.equal(scrolls[0].id,'life');
  assert.equal(event('PageDown').prevented,true);assert.equal(scrolls.length,1);
  event('Escape',{control:true});assert.equal(states[3].value,false,'guided state disabled even on nested controls');
 });
});
test('reduced-motion navigation skips native transitions and delayed fonts never restore position',()=>{
 hookHarness(({nav,document,scrolls,fontReady})=>{
  let transitions=0;document.startViewTransition=()=>{transitions++;throw Error('unexpected transition')};
  nav.go(1);assert.equal(transitions,0);assert.deepEqual(scrolls,[{id:'life',behavior:'instant',block:'start'}]);
  fontReady();assert.equal(scrolls.length,1,'font completion does not move the reader');
 },{reduced:true});
});
test('one wheel chapter move locks repeated deltas and ignores nested scrollable controls',()=>{
 hookHarness(({listeners,scrolls,controlTarget})=>{
  const event=target=>({ctrlKey:false,metaKey:false,deltaX:0,deltaY:100,deltaMode:0,target,preventDefault(){}});
  listeners.wheel(event(controlTarget));assert.equal(scrolls.length,0);
  const plain={closest:()=>null};listeners.wheel(event(plain));assert.equal(scrolls.length,1);
  listeners.wheel(event(plain));assert.equal(scrolls.length,1);
 });
});

test('wheel lock is bounded: momentum cannot keep extending the dead period',()=>{
 hookHarness(({listeners,scrolls,advance})=>{
  const e={ctrlKey:false,metaKey:false,deltaX:0,deltaY:100,deltaMode:0,target:{closest:()=>null},preventDefault(){}};
  listeners.wheel(e);assert.equal(scrolls.length,1);
  for(let i=0;i<3;i++){advance(100);listeners.wheel(e);assert.equal(scrolls.length,1);}
  advance(90);listeners.wheel(e);assert.equal(scrolls.length,2,'new gesture responds after fixed 380ms, not an extended 950ms lock');
 });
});

const archiveBuild=await build({entryPoints:[resolve(root,'src/components/ArchiveRoom.jsx')],bundle:true,jsx:'automatic',platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},external:['react','react-dom']});
const archiveModule={exports:{}};
new Function('require','module','exports',archiveBuild.outputFiles[0].text)(require,archiveModule,archiveModule.exports);
const archiveData=JSON.parse(readFileSync(resolve(root,'src/data.json'),'utf8'));
test('archive defaults to six factual entry buttons rather than an already-open reading panel',()=>{
 const archive=html.slice(html.indexOf('id="archive"'),html.indexOf('id="sources"'));
 assert.ok(archive.includes('archive-is-index'));
 assert.doesNotMatch(archive,/class="archive-room-panel"/);
 const buttons=[...archive.matchAll(/<button class="archive-door [^"]*"[^>]*>[\s\S]*?<\/button>/g)].map(m=>m[0]);
 assert.equal(buttons.length,6);
 const expected=[['年谱',archiveData.graph.milestones.length],['著述',archiveData.works.length],['影像',Object.keys(archiveData.media).length],['生平',archiveData.extendedBiography.length],['足迹',archiveData.places.length],['纪念',archiveData.reports.length]];
 buttons.forEach((button,i)=>{
  assert.ok(button.includes(`<strong>${expected[i][0]}</strong>`));
  assert.match(button,/<small>[^<]+<\/small>/);
  const count=button.match(/class="archive-door-number">(\d+)<\/span>/)?.[1];
  assert.equal(Number(count),expected[i][1],`${expected[i][0]} reflects actual destination record count`);
 });
 const app=readFileSync(resolve(root,'src/App.jsx'),'utf8');
 assert.match(app,/onClick=\{\(\)=>openArchive\(view\)\}/);
 const archiveTag=app.match(/<ArchiveRoom\b[^>]*\/>/)?.[0];
 assert.ok(archiveTag,'App renders ArchiveRoom');
 assert.match(archiveTag,/\brequestedView=\{archiveView\}/);
});
test('requestedView initially selects each of all six archive tabs and renders its matching data',()=>{
 const cases=[['biography',archiveData.extendedBiography[0].title],['timeline',archiveData.graph.milestones[0].title],['places',archiveData.places[0].title],['works',archiveData.works[0].title],['images',Object.values(archiveData.media)[0].alt],['reports',archiveData.reports[0].title]];
 for(const [view,text] of cases){
  const rendered=renderToStaticMarkup(React.createElement(archiveModule.exports.default,{data:archiveData,requestedView:view}));
  const tabs=[...rendered.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(m=>attrs(m[0]));
  assert.equal(tabs.length,6,`${view} retains all tabs`);
  const selected=tabs.filter(t=>t['aria-selected']==='true');
  assert.equal(selected.length,1,view);assert.ok(selected[0].id.endsWith('-tab-'+view));
  assert.ok(rendered.includes(`id="${selected[0]['aria-controls']}"`));
  assert.ok(rendered.includes(text),`${view} includes its content`);
 }
});
test('invalid requestedView cannot suppress every archive tab and leave a blank panel',()=>{
 const rendered=renderToStaticMarkup(React.createElement(archiveModule.exports.default,{data:archiveData,requestedView:'invalid-view'}));
 const selected=[...rendered.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(m=>attrs(m[0])).filter(t=>t['aria-selected']==='true');
 assert.equal(selected.length,1,'unrecognized view falls back to a valid archive tab');
 assert.ok(rendered.includes(archiveData.extendedBiography[0].title),'default biography remains readable');
});

// Component callbacks below run with state/ref hooks and focus targets mocked.
// This validates which target is selected, not browser focus-trap behavior.
const atlasBuild=await build({entryPoints:[resolve(root,'src/components/RelationshipAtlas.jsx')],bundle:true,jsx:'automatic',platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},external:['react','react-dom']});
function atlasFocusHarness(run){
 const state=[],refs=[];let stateCursor=0,refCursor=0;
 const fakeReact={...React,useState:initial=>{const i=stateCursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],v=>state[i]=typeof v==='function'?v(state[i]):v]},useRef:initial=>refs[refCursor++]??(refs[refCursor-1]={current:initial}),useEffect:()=>{},useMemo:f=>f(),useId:()=>':test:'};
 const module={exports:{}};
 new Function('require','module','exports',atlasBuild.outputFiles[0].text)(name=>name==='react'?fakeReact:require(name),module,module.exports);
 const saved=['requestAnimationFrame','document','matchMedia'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]);
 const changes={requestAnimationFrame:f=>f(),document:{activeElement:null},matchMedia:()=>({matches:false})};
 for(const[k,v]of Object.entries(changes))Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});
 const render=()=>{stateCursor=0;refCursor=0;return module.exports.RelationshipAtlas({data:archiveData})};
 function* walkElements(el){if(!el||typeof el!=='object')return;if(Array.isArray(el)){for(const child of el)yield*walkElements(child);return;}if(el.props){yield el;yield*walkElements(el.props.children)}}
 try{run({render,state,find:(tree,predicate)=>[...walkElements(tree)].find(predicate)});}
 finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
}
test('closing relationship evidence restores its connected opener and pre-selection graph view',()=>{
 atlasFocusHarness(({render,state,find})=>{
  let tree=render();const focused=[];
  const opener={isConnected:true,getClientRects:()=>[{}],focus:options=>focused.push(options)};
  const zoom=find(tree,e=>e.props['aria-label']==='放大全部关系图');zoom.props.onClick();tree=render();
  const before={...state[5]};assert.equal(before.scale,1.15);
  const node=find(tree,e=>e.props['data-relation-id']==='jialing');
  node.props.onClick({currentTarget:opener,type:'click',detail:1});
  tree=render();state[5]={x:140,y:30,scale:1.12};
  const event={key:'Escape',preventDefault(){},stopPropagation(){}};tree.props.onKeyDown(event);
  assert.equal(state[3],null,'selection closes');
  assert.deepEqual(state[5],before,'original graph zoom/pan restored');
  assert.deepEqual(focused,[{preventScroll:true}]);
 });
});
test('closing evidence falls back to graph focus when its original opener has disappeared',()=>{
 atlasFocusHarness(({render,find})=>{
  let tree=render();let openerFocus=0,graphFocus=0;
  const graph=find(tree,e=>e.type==='svg'&&String(e.props.className).includes('atlas-complete-network'));
  graph.props.ref.current={getClientRects:()=>[{}],focus:()=>graphFocus++};
  const opener={isConnected:false,getClientRects:()=>[],focus:()=>openerFocus++};
  find(tree,e=>e.props['data-relation-id']==='jialing').props.onClick({currentTarget:opener,type:'click',detail:1});
  tree=render();tree.props.onKeyDown({key:'Escape',preventDefault(){},stopPropagation(){}});
  assert.equal(openerFocus,0);assert.equal(graphFocus,1);
 });
});

test('graph drag batches pointer events and flushes the final view at release',()=>{
 atlasFocusHarness(({render,state,find})=>{
  let queued,reads=0,scheduled=0;
  const oldRAF=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame=f=>{scheduled++;queued=f;return scheduled};
  globalThis.cancelAnimationFrame=()=>{queued=null};
  try{
   const tree=render(),svg=find(tree,e=>e.type==='svg'&&String(e.props.className).includes('atlas-complete-network'));
   const target={closest:()=>null},currentTarget={getBoundingClientRect:()=>{reads++;return {width:1240}},setPointerCapture(){}};
   svg.props.onPointerDown({button:0,pointerId:1,clientX:100,clientY:100,target,currentTarget});
   for(let i=1;i<=20;i++)svg.props.onPointerMove({pointerId:1,clientX:100+i,clientY:100+i});
   assert.equal(scheduled,1);assert.equal(reads,1);assert.deepEqual(state[5],{x:0,y:0,scale:1});
   queued();assert.deepEqual(state[5],{x:20,y:20,scale:1});
   svg.props.onPointerMove({pointerId:1,clientX:130,clientY:125});
   svg.props.onPointerUp();assert.deepEqual(state[5],{x:30,y:25,scale:1});
   assert.equal(queued,null);
  }finally{globalThis.requestAnimationFrame=oldRAF;if(oldCancel)globalThis.cancelAnimationFrame=oldCancel;else delete globalThis.cancelAnimationFrame;}
 });
});

const trailBuild=await build({entryPoints:[resolve(root,'src/components/EvidenceTrail.jsx')],bundle:true,jsx:'automatic',platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},external:['react','react-dom']});
const trailModule={exports:{}};
new Function('require','module','exports',trailBuild.outputFiles[0].text)(require,trailModule,trailModule.exports);
test('evidence trail is optional and rejects out-of-range or non-integer steps',()=>{
 assert.doesNotMatch(html,/class="evidence-trail(?:\s|\")/,'initial App has no active trail');
 for(const step of [undefined,null,-1,4,1.5,'1',NaN]){
  assert.equal(renderToStaticMarkup(React.createElement(trailModule.exports.default,{step,media:archiveData.media.jialing})), '',String(step));
 }
});
test('all four trail steps expose status, close, thumbnail, and valid expand controls using the historical asset',()=>{
 const names=['原图','考察关系','成果书目','出处'];
 for(let step=0;step<4;step++){
  const rendered=renderToStaticMarkup(React.createElement(trailModule.exports.default,{step,media:archiveData.media.jialing}));
  assert.ok(rendered.includes('第24号图的阅读线索'));
  assert.match(rendered,/role="status" aria-live="polite" aria-atomic="true"/);
  assert.ok(rendered.includes(`0${step+1} / 04`));assert.ok(rendered.includes(names[step]));
  assert.match(rendered,/aria-label="返回第24号图的原图章节"/);
  assert.ok(rendered.includes(`src="${archiveData.media.jialing.path}"`),'thumbnail is the existing historical image');
  assert.match(rendered,/<img[^>]*alt=""/,'thumbnail is decorative inside its named button');
  assert.match(rendered,/class="evidence-trail-close"[^>]*aria-label="[^"]+"/);
  const expand=[...rendered.matchAll(/<button\b[^>]*>/g)].map(m=>attrs(m[0])).find(a=>a.class==='evidence-trail-expand');
  assert.equal(expand['aria-expanded'],'false');assert.ok(rendered.includes(`id="${expand['aria-controls']}"`));
 }
 const app=readFileSync(resolve(root,'src/App.jsx'),'utf8');
 assert.match(app,/openRelation\('jialing'\)/);
 assert.match(app,/openArchive\('works','嘉陵江'\)/);
 assert.match(app,/<EvidenceTrail\b[^>]*media=\{data\.media\.jialing\}/);
 assert.ok(archiveData.graph.nodes.some(n=>n.id==='jialing'));
 assert.ok(archiveData.works.some(w=>[w.title,w.note].join(' ').includes('嘉陵江')));
});
test('trail callbacks advance three steps, finish the fourth, close explicitly, and return thumbnail to step zero',()=>{
 let expanded=false;
 const fakeReact={...React,useId:()=>':trail-test:',useState:initial=>[expanded,v=>expanded=typeof v==='function'?v(expanded):v]};
 const mocked={exports:{}};
 new Function('require','module','exports',trailBuild.outputFiles[0].text)(name=>name==='react'?fakeReact:require(name),mocked,mocked.exports);
 function* buttons(el){if(!el||typeof el!=='object')return;if(Array.isArray(el)){for(const item of el)yield*buttons(item);return;}if(el.type==='button')yield el;if(el.props)yield*buttons(el.props.children);}
 for(let step=0;step<4;step++){
  const calls=[];let closed=0;
  const render=()=>mocked.exports.default({step,media:archiveData.media.jialing,onStep:i=>calls.push(i),onClose:()=>closed++});
  let controls=[...buttons(render())];
  const control=className=>controls.find(b=>b.props.className===className);
  control('evidence-trail-expand').props.onClick();controls=[...buttons(render())];
  assert.equal(control('evidence-trail-expand').props['aria-expanded'],true);
  control('evidence-trail-next').props.onClick();
  assert.equal(expanded,false);
  if(step<3)assert.deepEqual(calls,[step+1]);else assert.equal(closed,1);
  control('evidence-trail-image').props.onClick();assert.equal(calls.at(-1),0);
  const prior=closed;control('evidence-trail-close').props.onClick();assert.equal(closed,prior+1);
 }
});

test('selection emphasizes only the selected and center portraits, with restoration across all nodes',()=>{
 atlasFocusHarness(({render,state,find})=>{
  let tree=render();state[9]=true;tree=render();
  const oldView={x:22,y:-15,scale:1.15};state[5]={...oldView};tree=render();
  for(const record of archiveData.graph.nodes){
   const node=find(tree,e=>e.props['data-relation-id']===record.id);
   assert.ok(node,record.id);
   node.props.onClick({currentTarget:{isConnected:false},type:'click',detail:1});tree=render();
   assert.equal(state[5].scale,1,'auto focus must not enlarge the camera');
   for(const other of archiveData.graph.nodes){
    const n=find(tree,e=>e.props['data-relation-id']===other.id);
    const avatar=find(n,e=>e.props.className==='atlas-node-portrait');
    assert.ok(avatar.props.transform.includes('scale('+(other.id===record.id?1.55:1)+')'),other.id);
    assert.equal(n.props.className.includes('is-defocused'),other.id!==record.id);
   }
   const core=find(tree,e=>e.props.className==='atlas-core-portrait');
   assert.ok(core.props.transform.includes('scale(1.22)'));
  }
  find(tree,e=>e.props['aria-label']==='关闭关系详情').props.onClick();tree=render();
  assert.equal(state[3],null);assert.equal(state[10],false);
  assert.deepEqual(state[5],oldView);
  for(const record of archiveData.graph.nodes){
   const n=find(tree,e=>e.props['data-relation-id']===record.id);
   assert.ok(!n.props.className.includes('is-defocused'));
   assert.ok(find(n,e=>e.props.className==='atlas-node-portrait').props.transform.includes('scale(1)'));
  }
  assert.ok(find(tree,e=>e.props.className==='atlas-core-portrait').props.transform.includes('scale(1)'));
 });
});
test('hover and keyboard focus do not change the selected pair',()=>{
 atlasFocusHarness(({render,state,find})=>{
  let tree=render();state[9]=true;tree=render();
  find(tree,e=>e.props['data-relation-id']==='stille').props.onClick({currentTarget:{isConnected:false},type:'click',detail:1});
  tree=render();find(tree,e=>e.props['data-relation-id']==='berlin').props.onMouseEnter();tree=render();
  const chosen=find(tree,e=>e.props['data-relation-id']==='stille'),other=find(tree,e=>e.props['data-relation-id']==='berlin');
  assert.ok(chosen.props.className.includes('is-active'));assert.ok(other.props.className.includes('is-defocused'));
  assert.ok(find(other,e=>e.props.className==='atlas-node-portrait').props.transform.includes('scale(1)'));
 });
});
