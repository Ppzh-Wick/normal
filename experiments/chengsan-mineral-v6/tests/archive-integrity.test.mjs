import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(resolve(root, 'src/data.json'), 'utf8'));
const ids = new Set(data.graph.nodes.map(node => node.id));
const sourceIds = new Set(Object.keys(data.graph.sources));
const require = createRequire(resolve(root, 'package.json'));
async function component(name) {
  const result = await build({ entryPoints:[resolve(root, `src/components/${name}.jsx`)], bundle:true, platform:'node', format:'cjs', write:false, loader:{'.css':'empty'}, external:['react','react-dom'] });
  const mod = {exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(require,mod,mod.exports);
  return mod.exports.default;
}
const ArchiveRoom = await component('ArchiveRoom');
const RelationshipAtlas = await component('RelationshipAtlas');
function renderArchive(hash, fixture = data, storage = 'false') {
  const previous = globalThis.window;
  if (hash !== undefined) globalThis.window = {location:{hash},localStorage:{getItem:()=>storage}};
  else delete globalThis.window;
  try { return renderToStaticMarkup(React.createElement(ArchiveRoom,{data:fixture})); }
  finally { if(previous === undefined) delete globalThis.window; else globalThis.window = previous; }
}
function* walk(value) {
  if (!value || typeof value !== 'object') return;
  yield value;
  for (const child of Object.values(value)) yield* walk(child);
}
function files(dir) {
  return readdirSync(dir,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? files(resolve(dir,entry.name)) : [resolve(dir,entry.name)]);
}

test('complete source dataset: 24 nodes, 29 events, 14 places, 19 works, 17 images, 3 reports, 4 extended chapters', () => {
  assert.equal(data.graph.nodes.length,24); assert.equal(data.graph.milestones.length,29);
  assert.equal(data.places.length,14); assert.equal(data.works.length,19);
  assert.equal(Object.keys(data.media).length,17); assert.equal(data.reports.length,3);
  assert.equal(data.extendedBiography.length,4); assert.equal(data.biography.length,4);
});
test('node/category IDs are unique and milestone relationships point to existing nodes', () => {
  assert.equal(ids.size,data.graph.nodes.length);
  const categories=new Set(data.graph.categories.map(item=>item.id));
  assert.equal(categories.size,data.graph.categories.length);
  for(const node of data.graph.nodes) { assert.ok(node.id && node.name && node.evidence); assert.ok(categories.has(node.category),node.id); }
  for(const event of data.graph.milestones) if(event.nodeId) assert.ok(ids.has(event.nodeId),event.nodeId);
  assert.equal(new Set(data.graph.milestones.map(item=>item.year)).size,29);
});
test('all source citations resolve; provided chronology page references stay within its 11 pages', () => {
  let refs=0, pages=0;
  for(const item of walk(data)) if(typeof item.source === 'string') {
    assert.ok(sourceIds.has(item.source),item.source); refs++;
    if(item.page !== undefined) {
      assert.ok(Number.isInteger(item.page) && item.page > 0); pages++;
      if(item.source === 'enhancedChronology') assert.ok(item.page <= 11,`Page ${item.page}`);
    }
  }
  assert.ok(refs>100); assert.ok(pages>100);
  for(const source of Object.values(data.graph.sources)) if(!source.local && source.url) assert.equal(new URL(source.url).protocol,'https:');
});
test('every explicitly referenced historical image exists and is nonempty', () => {
  const paths=new Set();
  for(const item of walk(data)) if(typeof item.path === 'string' && item.path.startsWith('images/')) paths.add(item.path);
  // personId is a legacy identifier, not an implicit asset path. The atlas uses only explicit media.path and otherwise a text symbol.
  assert.ok(paths.size>=17);
  for(const asset of paths) {
    const path=resolve(root,'public',asset);
    assert.ok(path.startsWith(resolve(root,'public')+'/'));
    assert.ok(existsSync(path),asset); assert.ok(statSync(path).size>0,asset);
  }
  assert.ok(statSync(resolve(root,'public/fonts/archive-serif.woff')).size>0);
});
test('unpublished source PDFs are not shipped as public assets', () => {
  assert.equal(files(resolve(root,'public')).filter(path=>/\.pdf$/i.test(path)).length,0);
  for(const source of Object.values(data.graph.sources).filter(item=>item.local)) assert.ok(!existsSync(resolve(root,'public',source.url)));
});
test('archive server-renders without browser globals and exposes six accessible tabs', () => {
  const html=renderArchive();
  assert.equal((html.match(/role="tab"/g)||[]).length,6);
  assert.ok(html.includes('role="tabpanel"')); assert.ok(html.includes('下载档案 JSON'));
  for(const chapter of data.extendedBiography) assert.ok(html.includes(chapter.title));
  assert.ok(!html.includes('href="sources/')); assert.ok(html.includes('未公开原件'));
});
test('all six archive views server-render from their URL state', () => {
  const cases=[['timeline',data.graph.milestones.map(item=>item.title)],['places',[data.places[0].title]],['works',data.works.map(item=>item.title)],['images',Object.values(data.media).map(item=>item.alt)],['reports',data.reports.map(item=>item.title)]];
  for(const [view,strings] of cases) {
    const html=renderArchive(`#archive?view=${view}`);
    for(const text of strings) assert.ok(html.includes(text),`${view}: ${text}`);
  }
});
test('archive URL search/type/sort filter works and preserves valid source PDF page fragments', () => {
  const html=renderArchive('#archive?view=works&q=离堆&type=论文&sort=newest');
  assert.ok(html.includes('《离堆与离堆山考》')); assert.ok(!html.includes('《海南岛火山》'));
  assert.ok(html.includes('200995181319.pdf#page=292'));
  const ordered=renderArchive('#archive?view=works&sort=newest');
  assert.ok(ordered.indexOf('《四川龙门山南段东坡及其山前带第四纪冰川遗迹》')<ordered.indexOf('《广东海南岛北部地质矿产》'));
});
test('era/place URL state validates ranges and malformed values fall back safely', () => {
  const era=renderArchive('#archive?view=timeline&era=early');
  assert.ok(era.includes('出生于河北涉县')); assert.ok(!era.includes('承三亭留下校园纪念'));
  const last=renderArchive('#archive?view=places&placeIndex=999');
  assert.ok(last.includes(data.places.at(-1).title));
  assert.ok(renderArchive('#archive?view=places&placeIndex=-10').includes(data.places[0].title));
  assert.ok(renderArchive('#archive?view=places&placeIndex=NaN').includes(data.places[0].title));
  assert.ok(renderArchive('#archive?view=invalid&sort=invalid&era=invalid').includes(data.extendedBiography[0].title));
  assert.ok(renderArchive('#network?view=works').includes(data.extendedBiography[0].title));
});
test('bookmark state reflects local browser value; storage failures degrade safely', () => {
  assert.ok(renderArchive('#archive',data,'true').includes('已收藏档案'));
  const previous=globalThis.window;
  globalThis.window={location:{hash:'#archive'},localStorage:{getItem(){throw new Error('Blocked')}}};
  try { assert.ok(renderToStaticMarkup(React.createElement(ArchiveRoom,{data})).includes('收藏档案')); }
  finally { if(previous === undefined) delete globalThis.window; else globalThis.window=previous; }
});
test('missing source URL renders a visible non-link instead of an undefined href', () => {
  const fixture=structuredClone(data); delete fixture.graph.sources.biography.url;
  const html=renderArchive('#archive?view=reports',fixture);
  assert.ok(!html.includes('href="undefined')); assert.ok(html.includes('学校《攀登志》· 李承三人物传记（未公开原件）'));
});
test('relationship atlas server-renders a real SVG and its category controls', () => {
  const html=renderToStaticMarkup(React.createElement(RelationshipAtlas,{data}));
  assert.ok(html.includes('<svg')); assert.ok(html.includes('李承三'));
  for(const category of data.graph.categories) assert.ok(html.includes(category.label));
});
test('single-person exhibit contains no routes to other scholar profile pages', () => {
  const relevant=files(resolve(root,'src')).filter(path=>/\.(jsx?|json)$/.test(path));
  for(const path of relevant) {
    const content=readFileSync(path,'utf8');
    assert.ok(!/(?:href|to)\s*=\s*["'][^"']*(?:\/people\/|\/scholars\/|\/person\/|person\.html|profile\.html)/i.test(content),relative(root,path));
  }
  const app=readFileSync(resolve(root,'src/App.jsx'),'utf8');
  assert.match(app,/const chapters=\[\['opening'/);
  assert.ok(!/react-router/.test(app));
});
