// Markup and asset contracts only. Real browser interaction is checked separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(root,'package.json'));
const data=JSON.parse(readFileSync(resolve(root,'src/data.json'),'utf8'));
const output=await build({entryPoints:[resolve(root,'src/components/ArchiveGallery.jsx')],bundle:true,jsx:'automatic',platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},external:['react','react-dom']});
const mod={exports:{}};
new Function('require','module','exports',output.outputFiles[0].text)(require,mod,mod.exports);
const markup=renderToStaticMarkup(React.createElement(mod.exports.default,{media:data.media}));
test('gallery preserves all 17 source entries and starts with authentic Jialing sketch',()=>{
 assert.equal((markup.match(/aria-controls=/g)||[]).length,17);
 assert.ok(markup.includes('aria-current="true"'));
 assert.ok(markup.includes(data.media.jialing.path));
 assert.match(markup,/当前影像的来源与权利说明/);
 assert.ok(markup.includes(data.media.jialing.sourceTitle));
 assert.ok(markup.includes('公开展示不等于开放授权'));
});
test('magnifier is a display of original pixels, not a replacement image',()=>{
 const source=readFileSync(resolve(root,'src/components/ArtifactLens.jsx'),'utf8');
 assert.match(source,/backgroundImage/);assert.match(source,/image\.path/);
 assert.match(source,/ArrowLeft/);assert.match(source,/Escape/);
 assert.doesNotMatch(source,/canvas|toDataURL|putImageData/);
});
test('original watermarked historical sketch remains byte-identical',()=>{
 const bytes=readFileSync(resolve(root,'public/images/chengsan-nodes/jialing-sketch.jpg'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'dd56fd0e38f67eff592e9321b67cff028c76a5a85e1f6146073fb719c755e5fa');
});
test('image reader keeps native modal semantics and reduced-motion fallback',()=>{
 const source=readFileSync(resolve(root,'src/components/MediaDialog.jsx'),'utf8');
 assert.match(source,/showModal\(\)/);assert.match(source,/prefers-reduced-motion/);
 assert.match(source,/onCancel=/);assert.match(source,/preventScroll: true/);
 assert.match(source,/aria-label="关闭影像"/);
});
test('nonmodal relation folio does not block other chapter navigation',()=>{
 const nav=readFileSync(resolve(root,'src/useExhibition.js'),'utf8');
 const app=readFileSync(resolve(root,'src/App.jsx'),'utf8');
 assert.ok(nav.includes("document.querySelector('dialog:modal')"));
 assert.ok(app.includes("document.querySelector('dialog:modal')"));
 assert.doesNotMatch(nav,/querySelector\('dialog\[open\]'\)/);
});
test('keyboard focus reveals compact graph nodes rather than leaving offscreen stops',()=>{
 const source=readFileSync(resolve(root,'src/components/RelationshipAtlas.jsx'),'utf8');
 const reveal="onFocus={()=>{setHovered(n.id);if(compact){focusRelation(n);onNavigateWithin?.();}}}";
 assert.equal(source.split(reveal).length-1,2,'both total and category graphs reveal focused nodes');
});
