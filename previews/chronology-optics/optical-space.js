// A sparse pre-baked cloud field gives far-depth without per-particle frame cost.
// The original scene progress is observed; there is no idle animation loop.
const installed=new WeakSet();
function mount(scene){
 if(installed.has(scene)||innerWidth<900)return;installed.add(scene);
 const layer=document.createElement('div');layer.className='tl-optical-clouds';layer.setAttribute('aria-hidden','true');
 const image=new Image();image.alt='';image.decoding='async';image.src='./images/optics/clouds.webp';layer.append(image);
 image.decode().then(()=>{if(!scene.isConnected)return;scene.insertBefore(layer,scene.querySelector('.tl-presculpture')||scene.querySelector('.tl-orbit'));scene.dataset.cloudsReady='true';}).catch(()=>{});
 let queued=false;const update=()=>{queued=false;const p=Number(scene.dataset.progress)||0;image.style.transform=`translate3d(${Math.sin(p*.24)*7}px,${Math.cos(p*.18)*9}px,0) scale(1.035)`;};
 const observer=new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(update)}});observer.observe(scene,{attributes:true,attributeFilter:['data-progress']});update();
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
