import React,{memo,useEffect,useRef,useState} from 'react';
import {footprintStops,footprintIndex,footprintPose} from './footprintData.mjs';
import {ContourBackdrop} from './ContourNarrative.jsx';
import './FootprintJourney.css';

const particles=Array.from({length:52},(_,i)=>({x:(i*173+41)%1200,y:(i*i*31+23)%740,r:i%5===0?1.8:.7}));
const Atmosphere=memo(function Atmosphere(){return <div className="journey-atmosphere" aria-hidden="true"><div className="journey-haze"/><svg viewBox="0 0 1200 740" preserveAspectRatio="none">{particles.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.r}/>)}</svg><div className="journey-ground"><ContourBackdrop/></div><i className="journey-horizon"/></div>});
function Plate({stop,media}){return media?<figure className="journey-media"><img src={media.path} alt={media.alt} width={media.width} height={media.height} decoding="async"/><figcaption>{stop.imageNote}</figcaption></figure>:<div className="journey-abstract" aria-label="抽象地层图形，非历史现场照片"><ContourBackdrop/><span>FIELD RECORD / 地点记录</span><strong>{stop.place}</strong><small>抽象地层演绎 · 非历史现场复原</small></div>}
function Record({stop,data}){const media=data.media[stop.media];return <><Plate stop={stop} media={media}/><div className="journey-record-copy"><small>{stop.region}</small><h3>{stop.title}</h3><p>{stop.text}</p><span className="journey-source">据本次提供《李承三先生年谱》· 第{stop.page}页</span>{stop.note&&<p className="journey-caution">{stop.note}</p>}{media&&<details className="journey-image-source"><summary>图像出处与使用说明</summary><p>{media.credit}</p><a href={media.sourceUrl} target="_blank" rel="noreferrer">查看图像出处 ↗</a>{media.licenseUrl&&<a href={media.licenseUrl} target="_blank" rel="noreferrer">{media.license} ↗</a>}<p>{media.rightsNote}</p></details>}</div></>}
export default function FootprintJourney({open,onClose,data,reduced=false,desktop=true}){
 const dialog=useRef(null),viewport=useRef(null),track=useRef(null),opener=useRef(null),frame=useRef(0),step=useRef(600),progressRef=useRef(0);
 const [progress,setProgress]=useState(0),[list,setList]=useState(false);
 const index=footprintIndex(progress),stop=footprintStops[index];const compact=!desktop;
 useEffect(()=>{
  const el=dialog.current;if(!open||!el)return;
  opener.current=document.activeElement;const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';el.showModal();
  const heading=el.querySelector('h2');heading?.focus({preventScroll:true});
  return()=>{if(frame.current)cancelAnimationFrame(frame.current);frame.current=0;el.close();document.body.style.overflow=oldOverflow;if(opener.current?.isConnected)opener.current.focus({preventScroll:true})};
 },[open]);
 useEffect(()=>{
  if(!open||list)return;const view=viewport.current,rail=track.current;if(!view||!rail)return;
  let disposed=false;
  const sync=()=>{frame.current=0;if(disposed||document.hidden)return;const next=Math.min(footprintStops.length-1,Math.max(0,view.scrollTop/step.current));progressRef.current=next;setProgress(next)};
  const onScroll=()=>{if(!frame.current)frame.current=requestAnimationFrame(sync)};
  const resize=()=>{const old=progressRef.current;step.current=Math.max(300,view.clientHeight*.78);rail.style.height=`${view.clientHeight+step.current*(footprintStops.length-1)}px`;view.scrollTop=old*step.current;sync()};
  const observer=new ResizeObserver(resize);observer.observe(view);resize();view.addEventListener('scroll',onScroll,{passive:true});document.addEventListener('visibilitychange',onScroll);
  return()=>{disposed=true;observer.disconnect();view.removeEventListener('scroll',onScroll);document.removeEventListener('visibilitychange',onScroll);if(frame.current)cancelAnimationFrame(frame.current);frame.current=0};
 },[open,list]);
 const go=i=>{const target=Math.max(0,Math.min(footprintStops.length-1,i));progressRef.current=target;viewport.current?.scrollTo({top:target*step.current,behavior:reduced||compact?'instant':'smooth'})};
 if(!open)return null;
 return <dialog ref={dialog} className={`journey-dialog ${list?'journey-list-mode':''} ${reduced?'journey-reduced':''}`} aria-labelledby="journey-title" onCancel={e=>{e.preventDefault();onClose()}}>
  <header className="journey-header"><div><span>CHENGSAN / 人物足迹</span><h2 id="journey-title" tabIndex={-1}>循年，行于山河。</h2></div><div className="journey-header-actions"><button onClick={()=>setList(v=>!v)} aria-pressed={list}>{list?'返回空间漫游':'文字年表'}</button><button className="journey-close" onClick={onClose} aria-label="关闭人物足迹">关闭 <span aria-hidden="true">×</span></button></div></header>
  {list?<div className="journey-reading" tabIndex={0}><p className="journey-method">20个有据可查的生平节点。年份空缺不补造，同年地点不擅自排列，地点之间不代表完整路线。资料据本次提供年谱整理，尚非全部独立核验；原件未公开。</p><ol>{footprintStops.map((item,i)=><li key={item.id}><time>{item.date}</time><div><h3>{item.place}</h3><p>{item.title}。{item.text}</p>{item.note&&<p>{item.note}</p>}<small>《李承三先生年谱》第{item.page}页</small><button onClick={()=>{progressRef.current=i;setProgress(i);setList(false)}}>在空间中查看 ↗</button></div></li>)}</ol></div>:<>
  <div className="journey-scroll" ref={viewport} tabIndex={0} role="region" aria-label="滚动浏览人物足迹，方向键和上下页也可使用" onKeyDown={e=>{if(e.target!==e.currentTarget)return;const target={ArrowDown:index+1,PageDown:index+1,ArrowUp:index-1,PageUp:index-1,Home:0,End:footprintStops.length-1}[e.key];if(target!==undefined){e.preventDefault();go(target)}}}>
   <div className="journey-track" ref={track}><div className="journey-stage" data-active-stop={stop.id} data-stop-index={index} data-progress={progress.toFixed(3)}>
    <Atmosphere/>
    <aside className="journey-year"><span>{stop.phase}</span><div key={stop.id}><b>{stop.year}</b><time>{stop.date}</time><h3>{stop.place}</h3></div><p>向下滚动，行向下一段岁月。<br/>这里记录已知节点，不补写空白。</p><div className="journey-era"><span>1899</span><i><b style={{transform:`scaleX(${index/(footprintStops.length-1)})`}}/></i><span>1967</span></div></aside>
    <div className="journey-gallery" aria-live="off">{[index-1,index,index+1].filter(i=>i>=0&&i<footprintStops.length).map(i=>{const item=footprintStops[i],current=i===index;return <article key={item.id} className={`journey-card ${current?'is-current':''}`} style={footprintPose(i-progress,compact,reduced)} aria-hidden={!current} inert={!current} data-card-index={i}><div className="journey-card-top"><span>足迹 / {String(i+1).padStart(2,'0')}</span><time>{item.date}</time></div><Record stop={item} data={data}/></article>})}</div>
    <nav className="journey-years" aria-label="足迹年份直达">{footprintStops.map((item,i)=><button key={item.id} onClick={()=>go(i)} aria-label={`${item.date} ${item.place}`} aria-current={i===index?'step':undefined}><span>{item.year}</span><i/></button>)}</nav>
    <div className="journey-footer"><span className="journey-counter">{String(index+1).padStart(2,'0')} <i>/ {footprintStops.length}</i></span><label className="journey-select"><span>跳到</span><select aria-label="跳转到足迹年份" value={index} onChange={e=>go(+e.target.value)}>{footprintStops.map((item,i)=><option key={item.id} value={i}>{item.date} · {item.place}</option>)}</select></label><div><button onClick={()=>go(index-1)} disabled={index===0} aria-label="上一段足迹">↑</button><button onClick={()=>go(index+1)} disabled={index===footprintStops.length-1} aria-label="下一段足迹">↓</button></div><small>地点序列，不是精确路线。</small></div>
   </div></div>
  </div><span className="journey-live sr-only" role="status">{stop.date}，{stop.place}，{stop.title}</span></>}
 </dialog>;
}
