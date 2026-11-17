// Offline optical geometry, composited once. No live refraction or per-scroll
// alpha crossfade: the native gallery camera carries the motion.
const scenes=new WeakSet();
function mount(scene){if(innerWidth<900||scenes.has(scene))return;scenes.add(scene);
 const layer=document.createElement('div');layer.className='tl-presculpture';layer.setAttribute('aria-hidden','true');
 const image=new Image();image.alt='';image.decoding='async';image.src='./images/optics/crystal-front.webp';layer.append(image);
 image.decode().then(()=>{if(!scene.isConnected)return;scene.insertBefore(layer,scene.querySelector('.tl-orbit'));scene.dataset.sculptureReady='true';}).catch(()=>{});
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
