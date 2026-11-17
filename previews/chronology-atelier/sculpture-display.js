// Offline rendered abstract material, not a historical specimen or live refraction.
// Two alpha images at most; the existing scroll progress drives everything.
const scenes=new WeakSet();
function mount(scene){if(scenes.has(scene))return;scenes.add(scene);
 const layer=document.createElement('div');layer.className='tl-presculpture';layer.setAttribute('aria-hidden','true');
 const dust=document.createElement('img');dust.className='sculpture-dust';dust.src='./images/sculpture/dust.svg';dust.alt='';layer.append(dust);
 const imgs=['reverse','front','turn'].map(name=>{const img=new Image();img.alt='';img.decoding='async';img.src='./images/sculpture/'+name+'.webp';img.style.opacity='0';layer.append(img);return img});
 let frame=0;const render=()=>{frame=0;if(!scene.isConnected||document.hidden)return;const p=Number(scene.dataset.progress||0),phase=1+Math.sin(p*.43);imgs.forEach((img,i)=>img.style.opacity=String(Math.max(0,1-Math.abs(i-phase))));layer.style.transform='translate(-50%,calc(-50% + '+(Math.sin(p*.21)*17).toFixed(2)+'px)) rotate('+(Math.sin(p*.33)*1.7).toFixed(2)+'deg)';dust.style.transform='translateY('+(Math.sin(p*.31)*24).toFixed(2)+'px)';};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(render)};
 Promise.all(imgs.map(img=>img.decode())).then(()=>{if(!scene.isConnected)return;scene.insertBefore(layer,scene.querySelector('.tl-orbit'));scene.dataset.sculptureReady='true';render();new MutationObserver(schedule).observe(scene,{attributes:true,attributeFilter:['data-progress']})}).catch(()=>{/* Lightweight canvas fallback remains intact if image loading fails. */});
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
