import React, {memo} from 'react';
import './MuseumWayfinder.css';

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

// Original geological bookmarks, informed by SXHM's retracting chapter tabs.
// No museum artwork, logo, fonts or source assets are reused.
const bookmarkColors=['#243d68','#773e41','#706052','#1e3c5c','#4c4270','#714c3f','#35404f'];
const bookmarkEdges=[
 'M0 0H73C70 29 81 43 83 67C85 104 75 130 79 160H0Z',
 'M0 0H79C87 26 84 45 75 70C65 100 72 125 73 160H0Z',
 'M0 0H73C68 28 77 53 71 80C64 112 80 134 77 160H0Z',
 'M0 0H77C85 36 70 57 77 86C85 119 86 140 76 160H0Z',
 'M0 0H76C69 27 68 49 81 73C92 97 80 129 84 160H0Z',
 'M0 0H84C86 29 71 45 75 72C82 103 75 130 70 160H0Z',
 'M0 0H70C66 32 78 58 73 90C68 115 76 141 74 160H0Z'
];
export function ContourWayfinder({chapters,active,onGo}){
 const navigateKeys=e=>{
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
  const links=Array.from(e.currentTarget.querySelectorAll('a'));
  const current=links.indexOf(e.target.closest('a'));if(current<0)return;
  const next=e.key==='Home'?0:e.key==='End'?links.length-1:(current+(e.key==='ArrowDown'?1:-1)+links.length)%links.length;
  e.preventDefault();links[next]?.focus();
 };
 return <nav className="museum-wayfinder" aria-label="章节快速导航" onKeyDown={navigateKeys}>
  {chapters.map(([id,label],i)=><a className="museum-tab" key={id} href={'#'+id} style={{'--bookmark-color':bookmarkColors[i]}} aria-current={active===i?'location':undefined} aria-label={`${String(i).padStart(2,'0')} ${label}`} onClick={e=>{e.preventDefault();onGo(i)}}>
   <svg className="museum-tab-shape" viewBox="0 0 88 160" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={bookmarkEdges[i]} className="museum-tab-silhouette"/><path d="M7 0C16 35 7 57 18 83S14 132 23 160M28 0C37 39 26 61 35 89S32 133 42 160" className="museum-tab-strata"/></svg>
   <span className="museum-tab-label">{label}</span><span className="museum-tab-number" aria-hidden="true">{String(i).padStart(2,'0')}</span>
   <span className="museum-tab-current" aria-hidden="true"/>
  </a>)}
 </nav>;
}
