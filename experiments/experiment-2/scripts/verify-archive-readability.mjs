import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const origin=process.env.REVIEW_ORIGIN||'http://127.0.0.1:4173';
const output='review/readability',results=[],errors=[];
let browser,server;
const check=(name,value)=>{assert.ok(value,name);results.push({name,pass:true});};
async function contrast(page,selector,minimum=4.5){
 const values=await page.locator(selector).evaluateAll(elements=>{
  const lum=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  return elements.filter(e=>e.getClientRects().length).map(e=>{
   const c=getComputedStyle(e),fg=c.color.match(/[\d.]+/g).map(Number),bg=[236,232,227];
   const a=lum(fg),b=lum(bg);return {text:e.textContent?.slice(0,60),color:c.color,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),opacity:c.opacity};
  });
 });
 check(`${selector}: visible text samples`,values.length>0);
 check(`${selector}: contrast >= ${minimum}`,values.every(v=>v.ratio>=minimum&&v.opacity==='1'));
}
async function snap(page,name){await page.screenshot({path:`${output}/${name}.jpg`,type:'jpeg',quality:75,animations:'disabled'});}
async function go(page,view){await page.goto(origin+'/#archive?view='+view);await page.locator('.archive-room-panel').waitFor();}
try{
 await mkdir(output,{recursive:true});
 if(!process.env.REVIEW_ORIGIN){
  server=spawn('npm',['run','preview','--','--port','4173','--strictPort'],{stdio:'pipe'});
  for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break;}catch{}await delay(100);}
 }
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 await go(page,'timeline');
 await contrast(page,'.archive-room-events h3');await contrast(page,'.archive-room-events p');await contrast(page,'.archive-room-events time');
 await contrast(page,'.archive-heading h2, .archive-heading>p, .archive-back');
 await contrast(page,'.archive-room-tabs>button');
 await page.locator('.archive-room-events summary').first().click();
 await contrast(page,'.archive-room-event-detail>p');
 await snap(page,'timeline-desktop');
 await page.locator('.archive-room-tabs>button').first().hover();await contrast(page,'.archive-room-tabs>button');
 await page.locator('.archive-room-events summary').first().focus();
 check('keyboard focus ring visible',await page.locator('.archive-room-events summary').first().evaluate(e=>getComputedStyle(e).outlineStyle==='solid'));
 const samples={biography:'.archive-room-chapter h3, .archive-room-chapter>p, .archive-room-references',places:'.archive-room-place-feature h3, .archive-room-place-feature>p, .archive-room-place-index button',works:'.archive-room-work-list h3, .archive-room-work-list p, .archive-room-results',images:'.archive-gallery-object h4, .archive-gallery-provenance dd, .archive-gallery-index-list button',reports:'.archive-room-report-list h3, .archive-room-references'};
 for(const [view,selector]of Object.entries(samples)){
  await go(page,view);await contrast(page,selector);await contrast(page,'.archive-room-source-notes h3, .archive-room-source-notes p');
  if(view==='works'){
   const input=page.locator('.archive-room-search input');await input.fill('___no_match___');await page.locator('.archive-room-empty').waitFor();await contrast(page,'.archive-room-empty h3');
   check('search input uses light surface and dark text',await input.evaluate(e=>getComputedStyle(e).backgroundColor==='rgb(248, 243, 235)'&&getComputedStyle(e).color==='rgb(36, 49, 83)'));
  }
  if(view==='images'){
   check('image-open label stays light on dark stage',await page.locator('.archive-gallery-open-label').evaluate(e=>getComputedStyle(e).color==='rgb(230, 221, 202)'));
   await snap(page,'images-desktop');
  }
 }
 await page.goto(origin+'/#network');await page.locator('.atlas-complete-node').first().waitFor();
 check('24 graph nodes preserved',await page.locator('.atlas-complete-node').count()===24);
 check('top blue spotlight absent',await page.locator('.galaxy-nebula').evaluate(e=>!getComputedStyle(e).backgroundImage.includes('21, 59, 96')));
 await snap(page,'network-desktop');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 mobile.on('pageerror',e=>errors.push(e.message));await go(mobile,'timeline');
 await contrast(mobile,'.archive-room-events h3, .archive-room-events p, .archive-room-events time');
 check('mobile archive has no horizontal document overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await snap(mobile,'timeline-mobile');
 await go(mobile,'images');await contrast(mobile,'.archive-gallery-provenance dd, .archive-gallery-object h4');
 check('no browser page errors',errors.length===0);
} catch(error){console.error(error);results.push({name:'browser validation',pass:false,error:String(error)});process.exitCode=1;}
finally{await browser?.close();server?.kill();await writeFile(`${output}/report.json`,JSON.stringify({results,errors},null,2));console.log(JSON.stringify({assertions:results.length,passed:results.filter(x=>x.pass).length,errors},null,2));}
