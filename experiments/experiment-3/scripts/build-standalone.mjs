import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAst } from 'rollup/parseAst';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const output = path.resolve(root, '../李承三-实验2-星河学脉.html');
const mime = { '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.gif':'image/gif', '.avif':'image/avif', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.otf':'font/otf' };
async function walk(dir) { const entries = await fs.readdir(dir, {withFileTypes:true}); return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]))).flat(); }
const assets = new Map();
for (const file of await walk(path.join(root,'public'))) {
  const type = mime[path.extname(file).toLowerCase()];
  if (type) assets.set(path.relative(path.join(root,'public'),file).split(path.sep).join('/'), `data:${type};base64,${(await fs.readFile(file)).toString('base64')}`);
}
const used = new Set();
function embed(value) {
  return value.replace(/(["'`])((?:\.\.\/|\.\/|\/)?(?:images|fonts)\/[^"'`\s]+)\1/g, (all,q,p) => {
    const key=p.replace(/^(?:\.\.\/|\.\/|\/)/,'');
    if (!assets.has(key)) throw Error(`Missing public asset: ${p}`);
    used.add(key); return q+assets.get(key)+q;
  }).replace(/url\(\s*([^"'\s)][^)]*)\s*\)/g,(all,p)=> {
    p=p.trim(); if (p.startsWith('data:')||p.startsWith('#')) return all;
    const key=p.replace(/^(?:\.\.\/|\.\/|\/)/,'');
    if (!assets.has(key)) throw Error(`Unresolved CSS asset: ${p}`);
    used.add(key); return `url("${assets.get(key)}")`;
  });
}
function validateJs(js) {
  const ast=parseAst(js); const stack=[ast];
  while(stack.length) { const node=stack.pop();
    if (node.type==='ImportDeclaration'||node.type==='ImportExpression'||((node.type==='ExportNamedDeclaration'||node.type==='ExportAllDeclaration')&&node.source)) throw Error('Runtime module import remains; bundle all chunks before exporting.');
    for(const value of Object.values(node)) { if(Array.isArray(value)) { for(const child of value) if(child&&typeof child==='object') stack.push(child); } else if(value&&typeof value==='object') stack.push(value); }
  }
}
let html=await fs.readFile(path.join(dist,'index.html'),'utf8');
const scriptTags=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
if (!scriptTags.length) throw Error('No built script found. Run npm run build first.');
for (const [tag,url] of scriptTags) {
  if (/^(?:https?:)?\/\//.test(url)) throw Error(`External script: ${url}`);
  let js=await fs.readFile(path.resolve(dist,url),'utf8'); validateJs(js); js=embed(js); validateJs(js);
  html=html.replace(tag,()=>`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
}
for (const match of [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]) {
  const url=match[0].match(/href=["']([^"']+)["']/i)?.[1];
  if(!url||/^(?:https?:)?\/\//.test(url)) throw Error('External stylesheet');
  const css=embed(await fs.readFile(path.resolve(dist,url),'utf8'));
  if(/@import\b/i.test(css)) throw Error('CSS import remains');
  html=html.replace(match[0],()=>`<style>${css.replace(/<\/style/gi,'<\\/style')}</style>`);
}
html=embed(html);
if (/<(?:script|link|img|image)\b[^>]*\b(?:src|href)=["'](?!data:|#)[^"']+["']/i.test(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,''))) throw Error('External/local HTML runtime reference remains');
const licenseFiles=await walk(path.join(root,'licenses'));
let notices='Self-contained local preview. Generated from dist; no source or dist files modified.\nReact Bits upstream: https://github.com/DavidHDev/react-bits/tree/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4\nReact Bits source retrieval: 2026-11-04 UTC. MIT + Commons Clause; integrated website source, not a standalone component distribution.\nHistorical image provenance and rights notes remain in the application. Public availability is not a reuse license.\n';
for(const file of licenseFiles) notices+=`\n===== ${path.basename(file)} =====\n${await fs.readFile(file,'utf8')}\n`;
for(const pkg of ['react','react-dom','scheduler','gsap','@gsap/react']) {
 for(const name of ['LICENSE','LICENSE.md']) { try { notices+=`\n===== ${pkg}/${name} =====\n${await fs.readFile(path.join(root,'node_modules',pkg,name),'utf8')}\n`; break; } catch {} }
}
html=html.replace('<head>',()=>`<head>\n<!--\n${notices.replace(/--/g,'- -')}\n-->\n`);
const serializedScripts=[...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
if(serializedScripts.length!==scriptTags.length) throw Error('Serialized script count mismatch');
for(const match of serializedScripts) validateJs(match[1]);
await fs.writeFile(output,html);
const report={output,bytes:Buffer.byteLength(html),embeddedAssets:used.size,availablePublicAssets:assets.size,unreferencedPublicAssets:[...assets.keys()].filter(k=>!used.has(k)),runtimeImports:0,externalRuntimeDependencies:0,note:'Source/provenance hyperlinks remain intentionally clickable; opening those links requires network. JavaScript and Canvas 2D support are browser capabilities, not downloads.'};
await fs.writeFile(path.join(root,'scripts','standalone-report.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(root,'README-standalone.md'),`# Standalone exhibition\n\nRun \`npm run build\`, then \`node scripts/build-standalone.mjs\`. Output: \`../李承三-实验2-星河学脉.html\`. Open locally with JavaScript enabled. No server, CDN, external module, image, or font request is required. Source links need network only when opened. The decorative abstract terrain uses Canvas 2D, not WebGL or historical map reconstruction.\n\nThe builder reads dist and public without modifying either, inlines all referenced public images/fonts and built CSS/JS, and rejects unresolved imports/resources. Unused public files are omitted. See scripts/standalone-report.json for counts.\n\nReact Bits Galaxy, Grainient, GlassSurface, SplitText, AnimatedContent and adapted StaggeredMenu source: https://github.com/DavidHDev/react-bits/tree/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4 . Retrieved 2026-11-04 UTC; MIT + Commons Clause notice is retained in the HTML and licenses/React-Bits-LICENSE.md. Font notices are retained in the HTML and licenses/Noto-CJK-COPYRIGHT.txt. Runtime package notices are also embedded. Historical-image provenance and rights cautions remain in the application; this local preview does not grant publication/reuse rights.\n`);
console.log(JSON.stringify(report,null,2));
