import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const files=[];
for(const folder of ['dist/assets','review/pair-focus']){
 if(!fs.existsSync(folder))continue;
 for(const name of fs.readdirSync(folder))if(/\.(?:js|css|json|png)$/.test(name))files.push(path.join(folder,name));
}
if(fs.existsSync('dist/index.html'))files.push('dist/index.html');
for(const file of files){
 const bytes=fs.readFileSync(file),base64=bytes.toString('base64'),chunks=Math.ceil(base64.length/12000);
 const sha=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 console.log('__PAIR_FILE__ '+JSON.stringify({path:file,bytes:bytes.length,sha,chunks}));
 for(let i=0;i<chunks;i++)console.log('__PAIR_CHUNK__ '+JSON.stringify({path:file,index:i,data:base64.slice(i*12000,(i+1)*12000)}));
}
