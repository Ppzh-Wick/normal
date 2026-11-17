// The three authored cloud depths are baked together for low-cost display.
// No full-screen sprite rotations, idle loops or scroll-time alpha blending.
const installed=new WeakSet();
function mount(scene){if(installed.has(scene)||innerWidth<900)return;installed.add(scene);
 const layer=document.createElement('div');layer.className='tl-optical-clouds';layer.setAttribute('aria-hidden','true');
 const image=new Image();image.alt='';image.decoding='async';image.src='./images/optics/clouds-bounded.webp';layer.append(image);
 image.decode().then(()=>{if(!scene.isConnected)return;scene.insertBefore(layer,scene.querySelector('.tl-presculpture')||scene.querySelector('.tl-orbit'));scene.dataset.cloudsReady='true';}).catch(()=>{});
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
