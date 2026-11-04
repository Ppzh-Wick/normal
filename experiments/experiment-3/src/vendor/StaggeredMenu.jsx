/* Adapted from React Bits StaggeredMenu by David Haz (MIT + Commons Clause).
   Official layerStates/panelInsertTime/itemsStart timeline retained. Adaptations:
   native dialog, controlled state, semantic navigation, reduced/mobile fallback,
   no social/logo/text-cycle effects, shorter stagger and immediate cancellation.
   Source and exact upstream revision: docs/V7-MOTION.md. */
import React,{useEffect,useLayoutEffect,useRef} from 'react';
import {gsap} from 'gsap';
const useIsoLayoutEffect=typeof window!=='undefined'?useLayoutEffect:useEffect;
export default function StaggeredMenu({open,onClose,onNavigate,chapters,active,reduced}){
 const dialogRef=useRef(null),panelRef=useRef(null),preLayersRef=useRef(null),openerRef=useRef(null),timelineRef=useRef(null);
 const latest=useRef({onClose,onNavigate});latest.current={onClose,onNavigate};
 useIsoLayoutEffect(()=>{
  const dialog=dialogRef.current;if(!dialog)return;
  timelineRef.current?.kill();
  if(!open){if(dialog.open)dialog.close();return;}
  openerRef.current=document.activeElement;
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  if(!dialog.open)dialog.showModal();
  const panel=panelRef.current,layers=Array.from(preLayersRef.current.children);
  const itemEls=Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
  const numberEls=Array.from(panel.querySelectorAll('.sm-panel-item-number'));
  let frame=requestAnimationFrame(()=>panel.querySelector('a')?.focus({preventScroll:true}));
  const ctx=gsap.context(()=>{
   if(reduced)return;
   const layerStates=layers.map(el=>({el,start:100}));
   gsap.set(itemEls,{yPercent:140,rotate:7});
   gsap.set(numberEls,{opacity:0});
   const tl=gsap.timeline({paused:true});
   layerStates.forEach((ls,i)=>tl.fromTo(ls.el,{xPercent:ls.start},{xPercent:0,duration:.42,ease:'power4.out'},i*.05));
   const lastTime=layerStates.length?(layerStates.length-1)*.05:0;
   const panelInsertTime=lastTime+(layerStates.length?.06:0),panelDuration=.48;
   tl.fromTo(panel,{xPercent:100},{xPercent:0,duration:panelDuration,ease:'power4.out'},panelInsertTime);
   const itemsStart=panelInsertTime+panelDuration*.15;
   tl.to(itemEls,{yPercent:0,rotate:0,duration:.54,ease:'power4.out',stagger:{each:.035,from:'start'}},itemsStart);
   tl.to(numberEls,{opacity:1,duration:.3,ease:'power2.out',stagger:{each:.025,from:'start'}},itemsStart+.1);
   timelineRef.current=tl;tl.play();
  },dialog);
  return()=>{
   cancelAnimationFrame(frame);timelineRef.current?.kill();ctx.revert();
   if(dialog.open)dialog.close();document.body.style.overflow=oldOverflow;
   if(openerRef.current?.isConnected)openerRef.current.focus({preventScroll:true});
  };
 },[open,reduced]);
 return <dialog ref={dialogRef} id="chapter-menu" className="chapter-menu motion-menu" aria-label="展览目录" onCancel={e=>{e.preventDefault();latest.current.onClose()}}>
  <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true"><div className="sm-prelayer"/><div className="sm-prelayer"/></div>
  <div ref={panelRef} className="sm-panel">
   <button className="chapter-menu-close" onClick={onClose} aria-label="关闭展览目录">关闭 <span aria-hidden="true">×</span></button>
   <div className="sm-caption"><span>CHENGSAN ARCHIVE</span><span>七个章节 · 一段人生</span></div>
   <div className="sm-identity" aria-hidden="true"><span className="sm-menu-index">0{active}</span><p>循着山川，<br/>走近一生。</p><small>正在阅读 / {chapters[active][1]}</small><i/></div>
   <nav className="sm-panel-list" aria-label="选择展览章节">{chapters.map(([id,label],i)=><a className="sm-panel-item" href={'#'+id} key={id} aria-current={active===i?'location':undefined} onClick={e=>{e.preventDefault();latest.current.onNavigate(i)}}><small className="sm-panel-item-number">0{i}</small><span className="sm-panel-item-mask"><span className="sm-panel-itemLabel">{label}</span></span><i aria-hidden="true">↗</i></a>)}</nav>
   <div className="sm-footer"><span>李承三 · 数字人物展</span><small>1899 — 1967</small></div>
  </div>
 </dialog>;
}
