import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const folder='review/pair-focus';
const files=['report.json','browser-events.json'].map(n=>path.join(folder,n)).filter(p=>fs.existsSync(p));
let report={status:'missing'};if(fs.existsSync(path.join(folder,'report.json')))report=JSON.parse(fs.readFileSync(path.join(folder,'report.json'),'utf8'));
const names=fs.existsSync(folder)?fs.readdirSync(folder):[];
const reviewImage=report.status==='passed'?'desktop-selected-person.jpg':names.find(n=>n.startsWith('failure-')&&n.endsWith('.jpg'));
if(reviewImage&&fs.existsSync(path.join(folder,reviewImage)))files.push(path.join(folder,reviewImage));
console.log('__PAIR_REPORT__ '+JSON.stringify({status:report.status,passed:report.passed,failed:report.failed,failures:report.assertions?.filter(x=>x.status==='failed')}));
for(const file of files){
 const bytes=fs.readFileSync(file),base64=bytes.toString('base64'),chunks=Math.ceil(base64.length/12000);
 const sha=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 console.log('__PAIR_FILE__ '+JSON.stringify({path:file,bytes:bytes.length,sha,chunks}));
 for(let i=0;i<chunks;i++)console.log('__PAIR_CHUNK__ '+JSON.stringify({path:file,index:i,data:base64.slice(i*12000,(i+1)*12000)}));
}
