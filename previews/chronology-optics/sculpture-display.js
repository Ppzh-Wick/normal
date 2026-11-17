// Pre-rendered optical sculpture. Static single texture: no scroll repaint or
// multi-angle alpha mixing. The original panel trajectory provides spatial motion.
const scenes=new WeakSet();
function mount(scene){if(scenes.has(scene))return;scenes.add(scene);
 const layer=document.createElement('div');layer.className='tl-presculpture';layer.setAttribute('aria-hidden','true');
 const img=new Image();img.alt='';img.decoding='async';img.src='./images/sculpture/front-glass.webp';layer.append(img);
 img.decode().then(()=>{if(!scene.isConnected)return;scene.insertBefore(layer,scene.querySelector('.tl-orbit'));scene.dataset.sculptureReady='true';}).catch(()=>{/* Optimized canvas is retained only as a loading-error fallback. */});
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
