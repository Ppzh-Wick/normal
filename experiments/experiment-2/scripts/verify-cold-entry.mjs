// A/B/C reproduction: exact pre-navigation UI, navigation-only UI, then
// the fixed UI. Only source files listed here are swapped for isolated builds.
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const app='src/App.jsx',nav='src/components/ContourNarrative.jsx';
const currentApp=await readFile(app,'utf8'),currentNav=await readFile(nav,'utf8');
const oldApp=await readFile('scripts/fixtures/cold-entry-before-App.jsx','utf8'),oldNav=await readFile('scripts/fixtures/cold-entry-before-ContourNarrative.jsx','utf8');
let browser,server;const observations=[];
const stop=()=>{if(server?.pid){try{process.kill(-server.pid,'SIGTERM')}catch{}}server=null};
try{
 browser=await chromium.launch({headless:true});await mkdir('review/hierarchy',{recursive:true});
 for(const [label,sourceApp,sourceNav] of [['before-navigation',oldApp,oldNav],['navigation-only',oldApp,currentNav],['reserved-image-size',currentApp,currentNav]]){
  await writeFile(app,sourceApp);await writeFile(nav,sourceNav);
  const out='dist-cold-'+label;
  const result=spawnSync('node',['node_modules/vite/bin/vite.js','build','--base','./','--outDir',out],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);
  server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4174','--strictPort','--outDir',out],{stdio:'ignore',detached:true});
  for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:4174')).ok)break}catch{}await delay(100)}
  for(let attempt=0;attempt<2;attempt++){
   const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
   // Real image bytes with a controlled short decode delay, never mocked dimensions.
   await page.route('**/images/portraits/li-chengsan.jpg',async route=>{await delay(250);await route.continue()});
   await page.goto('http://127.0.0.1:4174/#network');await page.evaluate(()=>document.fonts.ready);await delay(1000);
   const observation=await page.evaluate(()=>({top:document.getElementById('network').getBoundingClientRect().top,current:document.querySelector('nav[aria-label="章节快速导航"] [aria-current]')?.getAttribute('href'),portrait:{width:document.querySelector('.life-portrait img').width,height:document.querySelector('.life-portrait img').height,loaded:document.querySelector('.life-portrait img').complete},errors:[]}));
   observations.push({label,attempt,...observation});console.log('COLD_ENTRY',JSON.stringify(observations.at(-1)));
   if(label==='reserved-image-size'){assert.ok(Math.abs(observation.top)<12,'cold entry stays aligned after historical image loads');assert.equal(observation.current,'#network')}
   await page.close();
  }
  stop();await delay(150);
 }
}catch(e){console.error(e);process.exitCode=1}
finally{stop();await browser?.close();await writeFile(app,currentApp);await writeFile(nav,currentNav);await writeFile('review/hierarchy/cold-entry-report.json',JSON.stringify(observations,null,2))}
