import React,{lazy,Suspense,useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {chronicleRecords} from './chronicleData.mjs';
import {galleryRoute,galleryPose,galleryVisible,clamp} from './galleryMath.mjs';
import {useMedia} from '../useExhibition.js';
import './ChronicleGallery.css';
const Mineral=lazy(()=>import('./ChronicleMineral.jsx'));
function Sources({record,data}){return <div className="gallery-sources">{record.sources.map((ref,i)=>{const s=data.graph.sources[ref.source];return s?.url&&!s.local?<a key={i} href={s.url+(ref.page?'#page='+ref.page:'')} target="_blank" rel="noreferrer">{s.title}{ref.page?` · 第${ref.page}页`:''} ↗</a>:<span key={i}>{s?.title}{ref.page?` · 第${ref.page}页`:''}（未公开原件）</span>})}</div>}
function ImageBoard({record,data}){const media=data.media[record.media];return media?<img src={media.path} alt={media.alt||record.imageNote} decoding="async"/>:<div className="gallery-contour" aria-hidden="true"><svg viewBox="0 0 600 400">{Array.from({length:19},(_,i)=><path key={i} d={`M-60 ${70+i*14} C100 ${-30+i*11} 210 ${350-i*3} 350 ${160+i*7} S540 ${30+i*16} 720 ${180+i*10}`}/>)}</svg><span>地层 · 抽象展陈</span></div>}
export default function ChronicleGallery({data,onExit,onOpenRelation,active}){
 const records=useMemo(()=>chronicleRecords(data),[data]),reduced=useMedia('(prefers-reduced-motion:reduce)');
 const initial=useRef(Math.max(0,records.findIndex(r=>String(r.year)===new URLSearchParams(location.hash.split('?')[1]).get('year'))));
 const [value,setValue]=useState(initial.current),[text,setText]=useState(false),[lite,setLite]=useState(false),[failed,setFailed]=useState(false),[hidden,setHidden]=useState(document.hidden);
 const dialog=useRef(null),scroller=useRef(null),step=useRef(Math.max(1100,innerHeight*1.8)),raf=useRef(0),trigger=useRef(null);
 const route=galleryRoute(value,records.length),current=records[route.index],showDetail=route.focus>.55||reduced||lite;
 const eligible=!reduced&&!lite&&!failed&&!hidden&&active&&(navigator.deviceMemory||8)>=4&&(navigator.hardwareConcurrency||8)>=4&&!navigator.connection?.saveData;
 const fail=useCallback(()=>setFailed(true),[]);
 useLayoutEffect(()=>{trigger.current=document.activeElement;dialog.current.showModal();scroller.current.scrollTop=initial.current*step.current;return()=>{if(raf.current)cancelAnimationFrame(raf.current);dialog.current?.close();trigger.current?.isConnected&&trigger.current.focus?.({preventScroll:true})}},[]);
 useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change)},[]);
 useEffect(()=>{const restore=()=>{if(location.hash.split('?')[0]!=='#archive')return;const p=new URLSearchParams(location.hash.split('?')[1]);if(p.get('view')!=='timeline')return;const i=records.findIndex(r=>String(r.year)===p.get('year'));if(i>=0){scroller.current.scrollTop=i*step.current;setValue(i)}};window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore)},[records]);
 useEffect(()=>{if(location.hash.split('?')[0]!=='#archive')return;const p=new URLSearchParams(location.hash.split('?')[1]);p.set('view','timeline');p.set('year',current.year);history.replaceState(history.state,'','#archive?'+p)},[current.year]);
 const scroll=()=>{if(!raf.current)raf.current=requestAnimationFrame(()=>{raf.current=0;setValue(clamp(scroller.current.scrollTop/step.current,0,records.length-.001))})};
 const go=(i,read=false)=>{const next=clamp(i,0,records.length-1)+(read?.28:0);if(text){setText(false);requestAnimationFrame(()=>{scroller.current.scrollTop=next*step.current;setValue(next)})}else scroller.current.scrollTo({top:next*step.current,behavior:reduced?'instant':'smooth'})};
 const switchText=()=>{setText(t=>!t);requestAnimationFrame(()=>{if(!text)document.querySelector('.gallery-reader h2')?.focus({preventScroll:true});else{scroller.current.scrollTop=value*step.current;dialog.current.querySelector('.gallery-title')?.focus({preventScroll:true})}})};
 const radius=Math.min(900,Math.max(580,innerWidth*.59));
 return <dialog ref={dialog} className={`chronicle-gallery ${showDetail?'gallery-reading':''} ${reduced||lite||failed?'gallery-lite':''}`} aria-label="李承三生平年谱空间展厅" data-scroll-lock onCancel={e=>{e.preventDefault();onExit()}}>
 <div className="gallery-background" aria-hidden="true"/>
 <header className="gallery-header"><div><span>CHENGSAN / 1899—1967</span><h2 className="gallery-title" tabIndex={-1}>生平年谱 <small>山河之间 · 展厅待审版</small></h2></div><nav aria-label="年谱显示与返回"><button onClick={()=>setLite(v=>!v)} aria-pressed={lite}>{lite?'开启空间':'轻量视图'}</button><button onClick={switchText}>{text?'返回空间年谱':'全文阅读'}</button><button onClick={onExit}>返回档案 ↗</button></nav></header>
 {text?<section className="gallery-reader"><h2 tabIndex={-1}>李承三生平年谱</h2><p>27条生平记述，另列2条身后纪念。年份空缺不补造。</p><ol>{records.map((r,i)=><li key={r.year}><time>{r.date}</time><article><small>{r.phase}</small><h3>{r.title}</h3><p>{r.text}</p><p>{r.detail}</p><Sources record={r} data={data}/><button onClick={()=>go(i,true)}>在空间年谱中读此年 ↗</button></article></li>)}</ol></section>:<div className="gallery-scroll" ref={scroller} onScroll={scroll} tabIndex={0} aria-label="滚动浏览生平年谱" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();scroller.current.scrollBy({top:step.current*.25,behavior:reduced?'instant':'smooth'})}if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();scroller.current.scrollBy({top:-step.current*.25,behavior:reduced?'instant':'smooth'})}}}>
 <div className="gallery-runway" style={{height:`${records.length*step.current+innerHeight}px`}}><div className="gallery-stage" data-index={route.index} data-year={current.year} data-progress={value.toFixed(4)} data-orbit={route.orbit.toFixed(4)} data-focus={route.focus.toFixed(4)}>
 {eligible&&<Suspense fallback={null}><Mineral orbit={route.orbit} focus={route.focus} onFailure={fail}/></Suspense>}
 <div className="gallery-axis" aria-hidden="true"><span>一生求索</span><i/><span>学脉留存</span></div>
 <div className="gallery-world" style={{'--focus':route.focus,'--perspective':`${Math.max(1050,innerHeight*1.5)}px`}}>
 {galleryVisible(route.orbit,records.length).map(i=>{const r=records[i],pose=galleryPose(i,route.orbit,reduced||lite?0:route.focus,radius),selected=i===route.index;return <article key={r.id} className={`gallery-plate ${selected?'is-selected':''}`} aria-hidden={!selected} inert={!selected?true:undefined} data-year={r.year} style={{transform:reduced||lite?(selected?'translate(-50%,-50%)':'translate(-50%,-50%) scale(.5)'): `translate(-50%,-50%) translate3d(${pose.x}px,${pose.y}px,${pose.z}px) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg)`,opacity:reduced||lite?(selected?1:0):pose.opacity,'--plate-focus':selected?route.focus:0}}>
 <div className="gallery-plate-image"><ImageBoard record={r} data={data}/><div className="gallery-image-shade"/></div><div className="gallery-plate-key"><small>{r.phase}</small><time>{r.year}</time><h3>{r.title}</h3><p>{r.date}</p></div>
 <div className="gallery-plate-text" inert={!selected||!showDetail}><span>{r.posthumous?'后人的纪念，不是本人经历':'年谱记载'}</span><p>{r.text}</p><p>{r.detail}</p><Sources record={r} data={data}/>{r.nodeId&&<button onClick={()=>{onExit();onOpenRelation?.(r.nodeId)}}>在图谱中查看 ↗</button>}</div>
 <p className="gallery-image-note">{r.imageNote||'抽象地层展陈，非历史现场复原。'}</p>
 <span className="gallery-plate-edge" aria-hidden="true"/>
 </article>})}
 </div>
 <div className="gallery-caption"><span>{String(route.index+1).padStart(2,'0')} / {records.length} <i>{current.phase}</i></span><p>{showDetail?'继续滚动退出近读，或向上沿原轨迹返回。':'向下滚动，进入这一年的记述。'}</p></div>
 <nav className="gallery-years" aria-label="年谱年份直达">{records.map((r,i)=><button key={r.year} aria-label={`${r.year} ${r.title}`} aria-current={i===route.index?'step':undefined} onClick={()=>go(i)}><span>{r.year}</span><i/></button>)}</nav>
 <footer className="gallery-footer"><p>{current.year} <span>{current.title}</span></p><div><button onClick={()=>go(route.index-1)} disabled={route.index===0} aria-label="上一年谱记录">↑</button><button onClick={()=>go(route.index,true)}>近读此年</button><button onClick={()=>go(route.index+1)} disabled={route.index===records.length-1} aria-label="下一年谱记录">↓</button></div><small>空间与矿物为抽象展陈 · 历史图像保持原貌</small></footer>
 <span className="gallery-live" role="status">{current.date}，{current.title}</span>
 </div></div></div>}
 </dialog>
}
