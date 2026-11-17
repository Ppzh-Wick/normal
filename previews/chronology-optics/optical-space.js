// Offline cloud sprites with independent depth. No per-particle drawing and
// no animation loop when the native chronology camera is stationary.
const installed=new WeakSet();
async function mount(scene){
 if(installed.has(scene)||innerWidth<900)return;installed.add(scene);
 const layer=document.createElement('div');layer.className='tl-optical-clouds';layer.setAttribute('aria-hidden','true');
 let specs;try{const response=await fetch('./images/optics/cloud-layers.json');if(!response.ok)throw Error('sprite manifest');specs=await response.json();}catch{specs=[{file:'clouds.webp',left:0,top:0,width:1,height:1,depth:.5}]}
 const sprites=specs.map(spec=>{const image=new Image();image.alt='';image.decoding='async';image.src='./images/optics/'+spec.file;image.style.cssText=`left:${spec.left*100}%;top:${spec.top*100}%;width:${spec.width*100}%;height:${spec.height*100}%;right:auto;bottom:auto`;layer.append(image);return{image,depth:spec.depth};});
 try{await Promise.all(sprites.map(({image})=>image.decode()));if(!scene.isConnected)return;scene.insertBefore(layer,scene.querySelector('.tl-presculpture')||scene.querySelector('.tl-orbit'));scene.dataset.cloudsReady='true';}catch{return}
 let queued=false;const update=()=>{queued=false;const p=Number(scene.dataset.progress)||0;for(const{image,depth}of sprites)image.style.transform=`translate3d(${Math.sin(p*.28)*18*depth}px,${Math.cos(p*.23)*22*depth}px,0) rotate(${Math.sin(p*.16)*1.1*depth}deg)`;};
 const observer=new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(update)}});observer.observe(scene,{attributes:true,attributeFilter:['data-progress']});update();
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
