/* Software material renderer for browsers without WebGL. Same scroll-driven
   scene; no animation timer when idle, no effect on chronology input/state. */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function mount(scene){
 if(scene.dataset.softwareCrystal)return;
 scene.dataset.softwareCrystal='true';
 const canvas=document.createElement('canvas'); canvas.className='tl-software-crystal'; canvas.setAttribute('aria-hidden','true');scene.insertBefore(canvas,scene.querySelector('.tl-orbit'));
 const ctx=canvas.getContext('2d');if(!ctx)return;
 let seed=40419; const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const dust=Array.from({length:480},()=>({y:random()*9-4.5,offset:random()-.5,rad:random(),tone:random(),size:.35+random()*1.1}));
 let raf=0;
 let last=0; function draw(now=0){raf=0;if(!scene.isConnected||document.hidden||scene.dataset.sculptureReady==='true'||scene.dataset.mineral!=='fallback')return;if(now-last<32){raf=requestAnimationFrame(draw);return;}last=now;
  const w=scene.clientWidth,h=scene.clientHeight,dpr=Math.min(devicePixelRatio||1,1);if(!w||!h)return;
  if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const p=Number(scene.dataset.progress||0),yaw=p*.55+.23,c=Math.cos(yaw),s=Math.sin(yaw);
  const project=(x,y,z)=>{const xx=x*c+z*s,zz=-x*s+z*c,scale=h*.55/(3.7-zz);return{x:w*.52+xx*scale,y:h*.5-y*scale,z:zz,scale}};
  const items=[];
  for(let k=-9;k<=9;k++){
   const y=k*.39+.065*Math.sin(k*2.713)+(p*.62% .39)-.2;
   const turn=k*.39+p*.15, rings=[];
   for(let ring=0;ring<3;ring++){
    const pts=[];
    for(let j=0;j<8;j++){
     const a=j*Math.PI/4+turn;
     const radius=(ring===1?.55:.20)*( .82+.27*Math.sin(k*1.87)+.20*Math.sin(j*1.7+k*.8));
     pts.push(project(radius*Math.cos(a)+.08*Math.sin(y*1.2),y+(ring-1)*.12+.04*Math.sin(j*2+k),radius*Math.sin(a)));
    } rings.push(pts);
   }
   for(let ring=0;ring<2;ring++)for(let j=0;j<8;j++){
    if((k*13+j*7)%19===0)continue;
    const points=[rings[ring][j],rings[ring][(j+1)%8],rings[ring+1][(j+1)%8],rings[ring+1][j]];
    const a=j*Math.PI/4+turn+yaw;
    items.push({points,z:points.reduce((n,v)=>n+v.z,0)/4,light:Math.pow(Math.max(0,Math.sin(a+.7)),18),hue:180+130*(.5+.5*Math.sin(a*2+k*.7)),kind:'glass'});
   }
  }
  for(const dot of dust){
   const y=((dot.y+p*.62+4.5)%9+9)%9-4.5,a=y*1.5+dot.offset*1.3+(dot.tone>.5?Math.PI:0),r=.83+.35*dot.rad;
   const q=project(r*Math.cos(a),y,r*Math.sin(a));
   if(q.y<-10||q.y>h+10)continue;
   items.push({kind:'dust',z:q.z,q,dot});
  }
  items.sort((a,b)=>a.z-b.z);
  for(const item of items){
   if(item.kind==='dust'){const {q,dot}=item;ctx.fillStyle=`hsla(${205+110*dot.tone},78%,${64+20*dot.rad}%,${.25+.5*dot.rad})`;ctx.beginPath();ctx.arc(q.x,q.y,dot.size,0,Math.PI*2);ctx.fill();continue;}
   const {points,light,hue}=item;if(points.every(v=>v.y<0)||points.every(v=>v.y>h))continue;
   const gradient=ctx.createLinearGradient(points[0].x,points[0].y,points[2].x,points[2].y);
   gradient.addColorStop(0,`hsla(${hue},65%,${45+light*45}%,.72)`);
   gradient.addColorStop(.35,`hsla(${hue+35},65%,${80+light*18}%,.60)`);
   gradient.addColorStop(.53,`hsla(${hue-20},80%,28%,.38)`);
   gradient.addColorStop(1,`hsla(${hue+40},70%,${55+light*38}%,.74)`);
   ctx.fillStyle=gradient;ctx.strokeStyle=`rgba(191,235,255,${.12+light*.65})`;ctx.lineWidth=.5+light;
   ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();ctx.stroke();
  }
 }
 const schedule=()=>{if(!raf)raf=requestAnimationFrame(draw)};
 new ResizeObserver(schedule).observe(scene);
 new MutationObserver(schedule).observe(scene,{attributes:true,attributeFilter:['data-progress','data-mineral']});schedule();
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);
new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
