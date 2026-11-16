import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const output='review/hierarchy',origin=process.env.REVIEW_ORIGIN||'http://127.0.0.1:4173';let server,browser;const results=[],errors=[];
const check=(name,value)=>{assert.ok(value,name);results.push(name);console.log('PASS',name)};
const snap=(page,name)=>page.screenshot({path:`${output}/${name}.jpg`,type:'jpeg',quality:88,animations:'disabled'});
async function at(page,index){await page.locator('.journey-select select').selectOption(String(index));await page.waitForFunction(i=>+document.querySelector('.journey-stage')?.dataset.stopIndex===i,index);await delay(750)}
try{
 await mkdir(output,{recursive:true});
 if(!process.env.REVIEW_ORIGIN){server=spawn('npm',['run','preview','--','--port','4173','--strictPort'],{stdio:'ignore',detached:true});for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break}catch{}await delay(100)}}
 browser=await chromium.launch({headless:true});
 for(const [width,height,motion]of[[1440,1000,'no-preference'],[1000,700,'reduce'],[390,844,'reduce']]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:motion,isMobile:width===390,hasTouch:width===390});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/#network');await page.locator('.atlas-complete-node').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  const before=await page.evaluate(()=>({hash:location.hash,y:scrollY}));
  await page.locator('.masthead .footprint-launch').click();await page.locator('.journey-dialog[open]').waitFor();
  check(`${width} native modal and focus`,await page.locator('.journey-dialog').evaluate(e=>e.matches(':modal')&&e.contains(document.activeElement)));
  check(`${width} 20 year destinations`,await page.locator('.journey-years button').count()===20);
  check(`${width} background graph preserved`,await page.locator('.atlas-complete-node').count()===24);
  check(`${width} document wheel held`,await page.evaluate(()=>document.body.style.overflow==='hidden'));
  check(`${width} no new canvas`,await page.locator('.journey-dialog canvas').count()===0);
  if(width===1440)await snap(page,'journey-1899');
  for(const index of[7,9,13,18,19]){
   await at(page,index);check(`${width} reached ${index}`,+await page.locator('.journey-stage').getAttribute('data-stop-index')===index);
   check(`${width} one accessible current card ${index}`,await page.locator('.journey-card:not([inert])').count()===1);
   check(`${width} bounded live deck ${index}`,await page.locator('.journey-card').count()<=3);
   check(`${width} current card within viewport ${index}`,await page.locator('.journey-card.is-current').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=70&&r.bottom<=innerHeight-40}));
   check(`${width} readable main copy ${index}`,await page.locator('.journey-card.is-current .journey-record-copy>p').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=12&&parseFloat(getComputedStyle(e).lineHeight)>=20));
   if(width<1000){check(`${width} year and place clear the card ${index}`,await page.locator('.journey-year').evaluate(e=>e.getBoundingClientRect().bottom<document.querySelector('.journey-card.is-current').getBoundingClientRect().top-8));check(`${width} place stays readable ${index}`,await page.locator('.journey-year h3').evaluate(e=>e.getBoundingClientRect().height<60));}
   if(motion==='reduce')check(`${width} no 3D transform ${index}`,await page.locator('.journey-card.is-current').evaluate(e=>getComputedStyle(e).transform==='none'));
   if(width===1440&&index===7)await snap(page,'journey-berlin');if(width===1440&&index===9)await snap(page,'journey-jialing');if(width===390&&index===9)await snap(page,'journey-mobile');
  }
  if(motion==='reduce'){await page.locator('.journey-scroll').evaluate(e=>e.scrollTo({top:e.clientHeight*.78*.5,behavior:'instant'}));await delay(100);check(`${width} reduced midpoint remains visible`,await page.locator('.journey-card.is-current').evaluate(e=>getComputedStyle(e).opacity==='1'));await at(page,19);}
  check(`${width} final stop keeps 1967 boundary`,await page.locator('.journey-year b').first().innerText()==='1967');
  await page.getByRole('button',{name:'文字年表',exact:true}).click();check(`${width} full readable list`,await page.locator('.journey-reading li').count()===20);
  check(`${width} not a fabricated route disclosure`,(await page.locator('.journey-method').innerText()).includes('不代表完整路线'));
  await page.locator('.journey-reading li').nth(18).getByRole('button',{name:'在空间中查看'}).click();await page.waitForFunction(()=>document.querySelector('.journey-stage')?.dataset.activeStop==='advice');
  check(`${width} 1965 does not imply Xichang visit`,(await page.locator('.journey-card.is-current').innerText()).includes('不把考察队前往西昌'));
  await at(page,0);const scroll=page.locator('.journey-scroll');await scroll.focus();await page.keyboard.press('PageDown');await page.waitForFunction(()=>+document.querySelector('.journey-stage')?.dataset.stopIndex===1);await delay(700);
  check(`${width} keyboard advances a year`,+await page.locator('.journey-stage').getAttribute('data-stop-index')===1);
  await scroll.focus();await page.keyboard.press('Home');await page.waitForFunction(()=>+document.querySelector('.journey-stage')?.dataset.stopIndex===0);await delay(700);
  const still=await page.locator('.journey-stage').getAttribute('data-progress');await delay(400);check(`${width} idle does not change scene`,still===await page.locator('.journey-stage').getAttribute('data-progress'));
  if(width===1440){await page.mouse.move(340,430);await page.mouse.wheel(0,780);await delay(900);check('real wheel advances years',+await page.locator('.journey-stage').getAttribute('data-stop-index')>0);check('wheel leaves parent chapter unchanged',await page.evaluate(y=>Math.abs(scrollY-y)<10,before.y))}
  await page.keyboard.press('Escape');await page.locator('.journey-dialog').waitFor({state:'detached'});check(`${width} close returns opener focus`,await page.locator('.masthead .footprint-launch').evaluate(e=>document.activeElement===e));check(`${width} close preserves chapter`,await page.evaluate(hash=>location.hash===hash,before.hash));
  check(`${width} body scroll restored`,await page.evaluate(()=>document.body.style.overflow!=='hidden'));
  await page.close();
 }
 check('no runtime errors',errors.length===0);
}catch(e){console.error(e);results.push('FAILED '+String(e));process.exitCode=1}
finally{await browser?.close();if(server?.pid){try{process.kill(-server.pid,'SIGTERM')}catch{}}const report={assertions:results.length,failed:results.filter(s=>s.startsWith('FAILED')),errors};await writeFile(`${output}/footprint-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report))}
