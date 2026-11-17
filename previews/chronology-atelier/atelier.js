// Content-aware art direction only. No changes to chronology navigation/state.
const done=new WeakSet();
function scan(){for(const plate of document.querySelectorAll('.tl-plate')){
 if(done.has(plate))continue;done.add(plate);
 const year=plate.querySelector('.tl-year')?.textContent?.trim();
 const caption=plate.querySelector('.tl-art-label');if(caption&&['1938','1941'].includes(year))caption.textContent='相关人物影像 · '+caption.textContent;
 if(['1940','1946','1959'].includes(year))plate.dataset.artLayout='document';
 if(['1899','1918','1926','1940','1946','1959'].includes(year))plate.style.setProperty('--art-accent','210,192,146');
 else if(['1957','1960','1964'].includes(year))plate.style.setProperty('--art-accent','168,198,215');
 else plate.style.setProperty('--art-accent','171,196,186');
}}
let scheduled=false;const queue=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan()})};
new MutationObserver(queue).observe(document.getElementById('root'),{childList:true,subtree:true});scan();
