import React, {memo} from 'react';

// Editorial geometry only. These contours are deliberately abstract: neither
// elevation data nor a reconstruction of Li Chengsan's historical routes.
// Generated once per module, never in an animation loop or scroll handler.
const contours=Array.from({length:19},(_,row)=>{
 const y=70+row*20;
 return Array.from({length:65},(_,point)=>{
  const x=point/64*1280;
  const ridge=Math.exp(-(((x-455)/235)**2))*135+Math.exp(-(((x-920)/190)**2))*90;
  const bend=Math.sin(x*.009+row*.105)*14;
  return `${point?'L':'M'}${x.toFixed(1)},${(y-ridge*(.47+row*.032)+bend).toFixed(1)}`;
 }).join(' ');
});

export const ContourBackdrop=memo(function ContourBackdrop({variant='default'}){
 return <svg className={`contour-backdrop contour-${variant}`} viewBox="0 0 1280 480" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  {contours.map((d,i)=><path key={i} d={d} className={i%5===0?'contour-major':undefined}/>)}
 </svg>;
});

export const StrataPrelude=memo(function StrataPrelude({image,onRead}){
 return <div className="strata-prelude">
  <div className="strata-block" aria-hidden="true"><div className="strata-slice slice-bottom"/><div className="strata-slice slice-middle"/><div className="strata-slice slice-top"><ContourBackdrop variant="plane"/></div><div className="strata-measure"><span>01</span><i/><span>03</span></div></div>
  <div className="prelude-axis" aria-hidden="true"><span>一条线 / THREE WAYS OF READING</span><i/><b>地形 · 史料 · 学脉</b></div>
  <button className="prelude-artifact" onClick={onRead} aria-label="从第24号历史手绘图开始阅读">
   <span className="prelude-artifact-edge" aria-hidden="true"/>
   <img decoding="async" src={image.path} alt="嘉陵江地形图集第24号图，点击进入原图章节"/>
   <span className="prelude-artifact-caption"><small>一纸山川 / ORIGINAL DOCUMENT</small><strong>第24号图 <i>↗</i></strong></span>
  </button>
  <p className="prelude-coordinate" aria-hidden="true">FIELD NOTES<br/><b>1940—1941</b><span>进入一张图，再看见人与人。</span></p>
 </div>;
});

export function ContourWayfinder({chapters,active,onGo}){
 return <nav className="contour-wayfinder" aria-label="章节快速导航">
  <span className="wayfinder-track" aria-hidden="true"><i style={{transform:`scaleY(${(active+1)/chapters.length})`}}/></span>
  {chapters.map(([id,label],i)=><a key={id} href={'#'+id} aria-current={active===i?'location':undefined} aria-label={`${String(i).padStart(2,'0')} ${label}`} onClick={e=>{e.preventDefault();onGo(i)}}><b>{String(i).padStart(2,'0')}</b><span>{label}</span><i/></a>)}
 </nav>;
}
