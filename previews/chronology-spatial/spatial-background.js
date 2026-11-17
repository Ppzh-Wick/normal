// Generated decorative optical terrain, not historical geography.
// One precomposed image; a bounded 4px scroll parallax, never an idle loop.
const mounted=new WeakSet();
function mount(scene){if(mounted.has(scene)||innerWidth<900)return;mounted.add(scene);
 const layer=document.createElement('div');layer.className='tl-spatial-world';layer.setAttribute('aria-hidden','true');
 const image=new Image();image.className='tl-spatial-far';image.alt='';image.decoding='async';image.src='./images/environment/world.webp';layer.append(image);
 let frame=0;function paint(){frame=0;if(!scene.isConnected||document.hidden)return;const p=Number(scene.dataset.progress||0);image.style.transform='translate3d('+(Math.sin(p*.16)*4).toFixed(2)+'px,'+(Math.cos(p*.18)*4).toFixed(2)+'px,0) scale(1.025)';}
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint)};
 image.decode().then(()=>{if(!scene.isConnected)return;scene.querySelector('.tl-atmosphere').after(layer);scene.dataset.spatialReady='true';paint();new MutationObserver(schedule).observe(scene,{attributes:true,attributeFilter:['data-progress']});}).catch(()=>{/* Existing quiet atmosphere remains if loading fails. */});
}
const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
