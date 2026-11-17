// Projection-correct local light coordinates, including a tilted 3D panel.
// One paint update per pointer frame; no independent or idle animation loop.
const diagnostic=new URLSearchParams(location.search).get("bench")==="1";const trace=data=>{if(diagnostic)document.documentElement.dataset.pointerDebug=JSON.stringify(data)};
let active=null,frame=0,last=null;const layers=new Map();
function prepare(plate){if(layers.has(plate))return layers.get(plate);
 const glass=plate.querySelector('.tl-glass');if(!glass)return null;
 for(const cls of ['pointer-glass-light','pointer-glass-rim']){const el=document.createElement('span');el.className=cls;el.setAttribute('aria-hidden','true');glass.append(el);}
 const markers=[[0,0],[100,0],[100,100],[0,100]].map(([x,y])=>{const el=document.createElement('span');el.className='glass-coordinate';el.style.left=x+'%';el.style.top=y+'%';el.setAttribute('aria-hidden','true');glass.append(el);return el});layers.set(plate,{glass,markers});return layers.get(plate);
}
function local(points,x,y){const [p0,p1,p2,p3]=points,dx1=p1.x-p2.x,dx2=p3.x-p2.x,dy1=p1.y-p2.y,dy2=p3.y-p2.y,dx3=p0.x-p1.x+p2.x-p3.x,dy3=p0.y-p1.y+p2.y-p3.y,det=dx1*dy2-dx2*dy1;if(Math.abs(det)<.001)return null;
 const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det,a=p1.x-p0.x+g*p1.x,b=p3.x-p0.x+h*p3.x,d=p1.y-p0.y+g*p1.y,e=p3.y-p0.y+h*p3.y,A=a-x*g,B=b-x*h,D=d-y*g,E=e-y*h,X=x-p0.x,Y=y-p0.y,Z=A*E-B*D;if(Math.abs(Z)<.001)return null;return{x:(X*E-B*Y)/Z,y:(A*Y-X*D)/Z};}
function clear(reason="target-change"){trace({event:"clear",reason:typeof reason==="string"?reason:reason.type});if(active){delete active.dataset.reflecting;active=null;}}
function update(){frame=0;if(!last||!active||!active.isConnected)return;const data=prepare(active);if(!data)return;const pts=data.markers.map(el=>{const r=el.getBoundingClientRect();return{x:r.left,y:r.top}}),p=local(pts,last.x,last.y);if(!p)return;
 data.glass.style.setProperty('--light-x',(Math.max(0,Math.min(1,p.x))*100).toFixed(2)+'%');data.glass.style.setProperty('--light-y',(Math.max(0,Math.min(1,p.y))*100).toFixed(2)+'%');active.dataset.reflecting='true';trace({event:'paint',pointer:last,local:p,points:pts,plate:active.dataset.index});}
document.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const plate=event.target.closest?.('.tl-plate');if(plate!==active){clear();active=plate;}last={x:event.clientX,y:event.clientY};trace({event:'move',pointer:last,target:event.target.tagName,plate:plate?.dataset.index});if(active&&!frame)frame=requestAnimationFrame(update);},{passive:true});
document.addEventListener('pointerout',event=>{if(!event.relatedTarget)clear("outside-document")},{passive:true});
window.addEventListener('blur',clear);window.addEventListener('scroll',clear,{passive:true});
new MutationObserver(()=>{for(const p of layers.keys())if(!p.isConnected)layers.delete(p)}).observe(document.getElementById('root'),{childList:true,subtree:true});
