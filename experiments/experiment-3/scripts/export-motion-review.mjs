import fs from 'node:fs';
const p='review/relation-motion/report.json';
if(fs.existsSync(p)){const r=JSON.parse(fs.readFileSync(p,'utf8'));console.log('__MOTION_REPORT__ '+JSON.stringify({status:r.status,passed:r.passed,failed:r.failed,failures:r.assertions.filter(x=>x.status==='failed')}));}
else console.log('__MOTION_REPORT__ '+JSON.stringify({status:'missing'}));
for(const f of ['idle-samples.json','motion-samples.json']){
 const p='review/relation-motion/'+f;if(fs.existsSync(p)){const s=fs.readFileSync(p,'utf8');console.log('__MOTION_DIAGNOSTIC__ '+JSON.stringify({file:f,content:s.slice(0,55000)}));}
}
