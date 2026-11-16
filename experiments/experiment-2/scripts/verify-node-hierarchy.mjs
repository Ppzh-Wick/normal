import assert from 'node:assert/strict';
import{spawn}from'node:child_process';
import{mkdir,writeFile}from'node:fs/promises';
import{setTimeout as delay}from'node:timers/promises';
import{chromium}from'playwright';
const output='review/hierarchy',origin=process.env.REVIEW_ORIGIN||'http://127.0.0.1:4173';let server,browser;const results=[],errors=[];
const check=(name,value)=>{assert.ok(value,name);results.push(name);console.log('PASS',name);};
async function state(page){return page.locator('.atlas-atlas').evaluate(atlas=>{
 const svg=atlas.querySelector('svg.atlas-complete-network,svg.atlas-network'),compact=atlas.classList.contains('atlas-has-focus');
 const circle=el=>{const m=el.getScreenCTM(),p=new DOMPoint(+el.getAttribute('cx'),+el.getAttribute('cy')).matrixTransform(m);return{x:p.x,y:p.y,r:+el.getAttribute('r')*Math.hypot(m.a,m.b)};};
 const nodes=[...svg.querySelectorAll('.atlas-node')].map(n=>({id:n.dataset.relationId,tier:+n.dataset.nodeTier,selected:n.getAttribute('aria-pressed')==='true',base:(+n.querySelector('.atlas-node-disc').getAttribute('r')-1)*2,disc:circle(n.querySelector('.atlas-node-disc')),names:[...n.querySelectorAll('.atlas-complete-name,.atlas-node-name')].map(t=>{const r=t.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}),hit:n.querySelector('.atlas-node-hit').getBoundingClientRect().width}));
 const core=svg.querySelector('.atlas-core-portrait image').getBoundingClientRect();
 const name=svg.querySelector('.atlas-core-name').getBoundingClientRect();
 return {nodes,core:{x:core.x,y:core.y,w:core.width,h:core.height},coreName:{x:name.x,y:name.y,w:name.width,h:name.height},compact,documentWidth:document.documentElement.scrollWidth,width:innerWidth,legend:atlas.querySelector('.atlas-hierarchy-key').getBoundingClientRect().width};
 });}
function collides(rect,circle){return Math.hypot(circle.x-Math.max(rect.x,Math.min(circle.x,rect.x+rect.w)),circle.y-Math.max(rect.y,Math.min(circle.y,rect.y+rect.h)))<circle.r-1;}
async function inspect(page,label,overview=true){
 const s=await state(page);check(label+' center is largest',s.nodes.every(n=>s.core.w>n.disc.r*2));
 for(const n of s.nodes)check(label+' radius '+n.id,n.base===(overview?(n.tier===2?60:34):(n.tier===2?78:44)));
 if(!s.compact){
  const clashes=[];for(const n of s.nodes)for(const r of n.names)for(const other of s.nodes)if(n.id!==other.id&&collides(r,other.disc))clashes.push(n.id+' / '+other.id);
  check(label+' labels clear other portraits: '+clashes.join(', '),clashes.length===0);
 }
 for(const n of s.nodes)if(n.selected){check(label+' chosen portrait clears central name',!collides(s.coreName,n.disc));}
 return s;
}
async function snap(page,name){await page.screenshot({path:`${output}/${name}.jpg`,type:'jpeg',quality:78,animations:'disabled'});}
try{
 await mkdir(output,{recursive:true});
 if(!process.env.REVIEW_ORIGIN){server=spawn('npm',['run','preview','--','--port','4173','--strictPort'],{stdio:'ignore',detached:process.platform!=='win32'});for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break;}catch{}await delay(100);}}
 browser=await chromium.launch({headless:true});
 for(const width of[1440,1000,999,390]){
  const mobile=width<1000,page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce',isMobile:width===390,hasTouch:mobile});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/#network');await page.locator('.atlas-complete-node').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  const s=await inspect(page,width+' overview');check(width+' 24 records',s.nodes.length===24);check(width+' 13 people and 11 entities',s.nodes.filter(n=>n.tier===2).length===13&&s.nodes.filter(n=>n.tier===3).length===11);check(width+' page has no overflow',s.documentWidth<=width+1);
  if(width===1440)await snap(page,'desktop-overview');if(width===390)await snap(page,'mobile-overview');
  for(const id of['stille','chang-longqing','li-yongzhao','lu-dengshi','chengdu','sichuan-map']){
   const node=page.locator(`.atlas-complete-node[data-relation-id="${id}"]`);await node.evaluate(e=>e.focus({preventScroll:true}));await page.keyboard.press('Enter');await page.locator('.atlas-evidence[open]').waitFor();
   await inspect(page,width+' selected '+id);if(width===1440&&['stille','chengdu'].includes(id))await snap(page,'desktop-'+id);if(width===390&&id==='chengdu')await snap(page,'mobile-selected-school');
   await page.getByRole('button',{name:'关闭关系详情',exact:true}).click();check(width+' close restores hierarchy '+id,!(await state(page)).compact);
  }
  await page.getByRole('button',{name:'人物往来',exact:true}).click();await page.locator('svg.atlas-network').waitFor({state:'attached'});
  if(!mobile){await inspect(page,width+' people category',false);await page.getByRole('button',{name:'下一组关系',exact:true}).click();await inspect(page,width+' people second page',false);}
  await page.getByRole('button',{name:'求学任教',exact:true}).click();if(!mobile)await inspect(page,width+' institution category',false);
  await page.close();
 }
 check('no browser errors',errors.length===0);
}catch(e){console.error(e);process.exitCode=1;results.push('FAILED '+String(e));}
finally{await browser?.close();if(server?.pid){try{process.kill(-server.pid,'SIGTERM');}catch{}}await writeFile(`${output}/report.json`,JSON.stringify({assertions:results.length,failed:results.filter(x=>x.startsWith('FAILED')),errors},null,2));console.log(JSON.stringify({assertions:results.length,failed:results.filter(x=>x.startsWith('FAILED')),errors}));}
