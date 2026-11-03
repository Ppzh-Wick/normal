import {useEffect,useRef} from 'react';
import './ArtifactLens.css';

/** A display-only magnifier of existing pixels. It never reconstructs detail. */
export default function ArtifactLens({image,enabled,figureRef,position,onExit}){
 const lensRef=useRef(null),point=useRef({x:.5,y:.5});
 useEffect(()=>{
  const figure=figureRef.current,lens=lensRef.current,img=figure?.querySelector('.artifact-original img');
  if(!enabled||!figure||!lens||!img)return;
  point.current={x:(position?.x??50)/100,y:(position?.y??50)/100};
  const paint=()=>{
   const r=img.getBoundingClientRect(),f=figure.getBoundingClientRect();
   const x=point.current.x*r.width,y=point.current.y*r.height;
   const size=Math.min(178,r.width*.42),radius=size/2;
   lens.style.width=lens.style.height=size+'px';
   lens.style.left=(r.left-f.left+x-radius)+'px';lens.style.top=(r.top-f.top+y-radius)+'px';
   lens.style.backgroundSize=`${r.width*2}px ${r.height*2}px`;
   lens.style.backgroundPosition=`${radius-x*2}px ${radius-y*2}px`;
  };
  const move=e=>{if(e.pointerType==='touch')return;const r=img.getBoundingClientRect();point.current={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};paint()};
  const key=e=>{const vectors={ArrowLeft:[-.035,0],ArrowRight:[.035,0],ArrowUp:[0,-.035],ArrowDown:[0,.035]};if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onExit?.();return}if(!vectors[e.key])return;e.preventDefault();e.stopPropagation();const[dx,dy]=vectors[e.key];point.current={x:Math.max(0,Math.min(1,point.current.x+dx)),y:Math.max(0,Math.min(1,point.current.y+dy))};paint()};
  figure.addEventListener('pointermove',move);figure.addEventListener('keydown',key);
  const observer=new ResizeObserver(paint);observer.observe(img);paint();
  return()=>{figure.removeEventListener('pointermove',move);figure.removeEventListener('keydown',key);observer.disconnect()};
 },[enabled,figureRef,position,onExit]);
 if(!enabled)return null;
 return <><div ref={lensRef} className="artifact-lens" style={{backgroundImage:`url("${image.path}")`}} aria-hidden="true"><span>2×</span></div><span className="artifact-lens-instruction" role="status">原图两倍显示 · 移动鼠标或用方向键观察 · Escape 退出</span></>;
}
