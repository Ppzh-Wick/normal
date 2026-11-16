import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const output='review/hierarchy',origin=process.env.REVIEW_ORIGIN||'http://127.0.0.1:4173';
let server,browser;const results=[],errors=[];
const check=(name,value)=>{assert.ok(value,name);results.push(name);console.log('PASS',name)};
const snap=(page,name)=>page.screenshot({path:`${output}/${name}.jpg`,type:'jpeg',quality:86,animations:'disabled'});
const style=locator=>locator.evaluate(e=>({transform:getComputedStyle(e).transform,opacity:getComputedStyle(e.querySelector('.museum-tab-label')).opacity,duration:getComputedStyle(e).transitionDuration,right:e.getBoundingClientRect().right}));
try{
 await mkdir(output,{recursive:true});
 if(!process.env.REVIEW_ORIGIN){server=spawn('npm',['run','preview','--','--port','4173','--strictPort'],{stdio:'ignore',detached:process.platform!=='win32'});for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break}catch{}await delay(100)}}
 browser=await chromium.launch({headless:true});
 for(const [width,height,motion] of [[1440,1000,'no-preference'],[1000,760,'reduce'],[1440,600,'reduce'],[390,844,'reduce']]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:motion,isMobile:width===390,hasTouch:width===390});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/#network');await page.locator('.atlas-complete-node').first().waitFor();await page.evaluate(()=>document.fonts.ready);await delay(800);
  const nav=page.getByRole('navigation',{name:'章节快速导航'}),links=page.locator('.museum-tab');
  check(`${width}x${height} 24 nodes preserved`,await page.locator('.atlas-complete-node').count()===24);
  check(`${width} no peripheral orbit lines`,await page.locator('.atlas-orbit-plane path,.atlas-orbit').count()===0);
  check(`${width} no horizontal document overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(width>=1000){
   check(`${width} desktop sidebar visible`,await nav.isVisible());check(`${width} seven accessible anchors`,await links.count()===7);
   const current=nav.locator('[aria-current="location"]');check(`${width} current network`,await current.getAttribute('href')==='#network');
   const opening=links.nth(0);await page.mouse.move(width/2,70);await delay(400);
   check(`${width} inactive bookmark collapsed`,(await style(opening)).opacity==='0');check(`${width} active bookmark visible`,(await style(current)).opacity==='1');
   check(`${width} bookmark stays within content gutter`,(await style(current)).right<=Math.max(70,width*.07));
   if(width===1440&&height===1000){await snap(page,'nav-desktop');await opening.hover();await delay(400);check('hover expands and labels bookmark',(await style(opening)).opacity==='1');await snap(page,'nav-hover');await page.mouse.move(width/2,70);await delay(400);check('leave restores collapsed bookmark',(await style(opening)).opacity==='0')}
   if(motion==='reduce')check(`${width} reduced motion removes animation`,(await style(opening)).duration==='0s');
   await opening.focus();await delay(400);check(`${width} keyboard focus expands bookmark`,(await style(opening)).opacity==='1');
   await page.keyboard.press('ArrowDown');check(`${width} arrow focus next`,await links.nth(1).evaluate(e=>document.activeElement===e));
   await page.keyboard.press('End');check(`${width} End focuses final`,await links.nth(6).evaluate(e=>document.activeElement===e));
   await page.keyboard.press('Home');check(`${width} Home focuses first`,await opening.evaluate(e=>document.activeElement===e));
   await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.waitForFunction(()=>location.hash==='#life');await delay(900);
   check(`${width} chapter current updated`,await nav.locator('[aria-current="location"]').getAttribute('href')==='#life');
   check(`${width} chapter heading gets focus`,await page.evaluate(()=>!!document.activeElement?.closest('#life')));
   if(width===1440&&height===1000)await snap(page,'nav-light');
   await page.goBack();await page.waitForFunction(()=>location.hash==='#network');await delay(800);check(`${width} back restores chapter`,await nav.locator('[aria-current="location"]').getAttribute('href')==='#network');
  }else{
   check('mobile uses menu instead of sidebar',!(await nav.isVisible()));
   await page.locator('.menu-toggle').click();await page.locator('#chapter-menu[open]').waitFor();check('mobile menu has all seven chapters',await page.locator('#chapter-menu .sm-panel-item').count()===7);await snap(page,'nav-mobile-menu');
   await page.locator('#chapter-menu .sm-panel-item[href="#life"]').click();await page.waitForFunction(()=>location.hash==='#life');await delay(500);check('mobile menu navigates and closes',await page.locator('#chapter-menu[open]').count()===0);
   await page.locator('.menu-toggle').click();await page.locator('#chapter-menu[open]').waitFor();await page.keyboard.press('Escape');await delay(400);check('Escape closes menu',await page.locator('#chapter-menu[open]').count()===0);check('menu returns focus to opener',await page.locator('.menu-toggle').evaluate(e=>document.activeElement===e));
  }
  await page.close();
 }
 check('no browser errors',errors.length===0);
}catch(e){console.error(e);results.push('FAILED '+String(e));process.exitCode=1}
finally{await browser?.close();if(server?.pid){try{process.kill(-server.pid,'SIGTERM')}catch{}}const report={assertions:results.length,failed:results.filter(x=>x.startsWith('FAILED')),errors};await writeFile(`${output}/museum-navigation-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report))}
