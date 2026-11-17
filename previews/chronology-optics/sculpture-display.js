// Two offline-rendered optical views, not a realtime refraction shader.
// Progress-only compositing: stops immediately when the original camera stops.
const scenes=new WeakSet();
function mount(scene){
 if(innerWidth<900||scenes.has(scene))return;scenes.add(scene);
 const layer=document.createElement('div');layer.className='tl-presculpture';layer.setAttribute('aria-hidden','true');
 const front=new Image(),turn=new Image();front.alt=turn.alt='';front.decoding=turn.decoding='async';
 front.src='./images/optics/crystal-front.webp';turn.src='./images/optics/crystal-turn.webp';turn.className='crystal-turn';layer.append(front,turn);
 Promise.all([front.decode(),turn.decode()]).then(()=>{if(!scene.isConnected)return;scene.insertBefore(layer,scene.querySelector('.tl-orbit'));scene.dataset.sculptureReady='true';}).catch(()=>{/* Retain the optimized canvas material if textures cannot load. */});
 let queued=false;const update=()=>{queued=false;const p=Number(scene.dataset.progress)||0;const t=(1-Math.cos(p*.58))*.5;turn.style.opacity=t.toFixed(3);front.style.opacity=(1-t).toFixed(3);layer.style.transform=`translate3d(calc(-50% + ${Math.sin(p*.36)*5}px),calc(-50% + ${Math.cos(p*.32)*7}px),0)`;};
 new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(update)}}).observe(scene,{attributes:true,attributeFilter:['data-progress']});update();
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
