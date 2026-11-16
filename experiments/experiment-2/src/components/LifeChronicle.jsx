import React,{lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {chronicleRecords} from './chronicleData.mjs';
import {spatialEligible} from './spatialJourneyMath.mjs';
import {ContourBackdrop} from './ContourNarrative.jsx';
import './LifeChronicle.css';
const SpatialJourney=lazy(()=>import('./SpatialJourney.jsx'));
function Sources({record,data}){return <div className="chronicle-sources">{record.sources.map((ref,i)=>{const source=data.graph.sources[ref.source];return <span key={i}>{source?.local||!source?.url?<span>{source?.title||'资料'}{ref.page?` · 第${ref.page}页`:''}</span>:<a href={source.url+(ref.page?'#page='+ref.page:'')} target="_blank" rel="noreferrer">{source.title}{ref.page?` · 第${ref.page}页`:''} ↗</a>}</span>})}</div>}
function Media({record,data}){const media=data.media[record.media];return media?<figure><img src={media.path} alt={media.alt||record.imageNote} width={media.width||106} height={media.height||176} decoding="async" loading="lazy"/><figcaption>{record.imageNote}</figcaption></figure>:<div className="chronicle-abstract" role="img" aria-label="抽象地层图形，非历史现场复原"><ContourBackdrop/><span>ARCHIVE / {record.year}</span><strong>{record.posthumous?'留存':'求索'}</strong><small>抽象地层演绎，非历史现场复原</small></div>}
export default function LifeChronicle({data,active,desktop,reduced,onNext}){
 const records=useMemo(()=>chronicleRecords(data),[data]);
 const track=useRef(null),proxy=useRef(null),raf=useRef(0),step=useRef(600),position=useRef(0);
 const [progress,setProgress]=useState(0),[reading,setReading]=useState(false),[lite,setLite]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 const compact=!desktop;const textMode=reading||compact;const index=Math.max(0,Math.min(records.length-1,Math.round(progress))),record=records[index];
 const eligible=spatialEligible({desktop,reduced,memory:typeof navigator!=='undefined'?navigator.deviceMemory||8:8,cores:typeof navigator!=='undefined'?navigator.hardwareConcurrency||8:8,saveData:typeof navigator!=='undefined'&&navigator.connection?.saveData});
 const spatial=active&&!textMode&&eligible&&!lite&&!failed;
 const fail=useCallback(()=>{setFailed(true);setReady(false)},[]);
 useEffect(()=>{if(!spatial)setReady(false)},[spatial]);
 useEffect(()=>{
  const el=track.current;if(!el||textMode)return;let disposed=false;
  const sync=()=>{raf.current=0;if(disposed||document.hidden)return;const top=el.getBoundingClientRect().top;const p=Math.max(0,Math.min(records.length-1,-top/step.current));position.current=p;setProgress(p)};
  const scroll=()=>{if(!raf.current)raf.current=requestAnimationFrame(sync)};
  const resize=()=>{step.current=Math.max(420,innerHeight*.78);el.style.height=`${innerHeight+step.current*(records.length-1)}px`;sync()};
  resize();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',resize);document.addEventListener('visibilitychange',scroll);
  return()=>{disposed=true;window.removeEventListener('scroll',scroll);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',scroll);if(raf.current)cancelAnimationFrame(raf.current)};
 },[textMode,records.length]);
 const go=i=>{const target=Math.max(0,Math.min(records.length-1,i));if(textMode){document.getElementById(records[target].id)?.scrollIntoView({block:'start',behavior:'instant'});return}const top=track.current.getBoundingClientRect().top+scrollY;window.scrollTo({top:top+target*step.current,behavior:reduced?'instant':'smooth'})};
 const switchReading=()=>{setReading(v=>!v);requestAnimationFrame(()=>document.getElementById('life')?.scrollIntoView({behavior:'instant',block:'start'}))};
 return <div className={`life-chronicle ${textMode?'chronicle-text-mode':''} ${spatial&&ready?'chronicle-spatial-ready':''}`}>
 {textMode?<div className="chronicle-reading"><header><span>01 / 生平年谱</span><h2 id="life-title">从出生，读到一生。</h2><p>1899—1967 · 李承三<br/>按记载的年份展开求学、任教、调查、著述与育人；另列两条身后纪念。</p>{desktop&&<button onClick={switchReading}>返回空间年谱 ↗</button>}<label>年份直达 <select aria-label="年谱年份直达" onChange={e=>go(+e.target.value)} defaultValue="0">{records.map((r,i)=><option key={r.id} value={i}>{r.year} · {r.title}</option>)}</select></label></header><ol>{records.map(r=><li id={r.id} key={r.id}><time>{r.date}</time><article><span>{r.phase}</span><h3>{r.title}</h3><p>{r.text}</p><p>{r.detail}</p><Sources record={r} data={data}/>{r.media&&<Media record={r} data={data}/>}</article></li>)}</ol><p>年谱为本次提供的11页编纂资料，尚非全部独立史实核验。年份空缺不补造；身后纪念不记为本人经历。</p></div>:<div ref={track} className="chronicle-track"><div className="chronicle-stage" data-index={index} data-year={record.year} data-progress={progress.toFixed(3)}>
 <div className="chronicle-space" aria-hidden="true"/><div className="chronicle-proxy" ref={proxy} aria-hidden="true"/>
 {spatial&&<Suspense fallback={null}><SpatialJourney progress={progress} index={index} data={data} records={records} track={proxy} onReady={setReady} onFailure={fail}/></Suspense>}
 <header className="chronicle-heading"><div><span>01 / 生平年谱</span><h2 id="life-title">从出生，读到一生。</h2></div><div>{eligible&&!failed&&<button onClick={()=>setLite(v=>!v)} aria-pressed={lite}>{lite?'开启空间穿行':'切换轻量视图'}</button>}<button onClick={switchReading}>完整文字年谱 ↗</button></div></header>
 <div className="chronicle-year"><span>{record.phase}</span><b>{record.year}</b><time>{record.date}</time><p>{record.posthumous?'此后，是后人的纪念。':'向下滚动，岁月向前。'}</p></div>
 <article className="chronicle-copy" key={record.id} tabIndex={0} data-scroll-lock aria-label={`${record.year} ${record.title}`}><span>{String(index+1).padStart(2,'0')} / {records.length}</span><h3>{record.title}</h3><p className="chronicle-lead">{record.text}</p><p>{record.detail}</p>{record.imageNote&&<p className="chronicle-image-note">{record.imageNote}</p>}<Sources record={record} data={data}/>{record.media&&<details><summary>图像出处与使用说明</summary><p>{data.media[record.media].credit}</p>{data.media[record.media].sourceUrl?<a href={data.media[record.media].sourceUrl} target="_blank" rel="noreferrer">查看出处 ↗</a>:<p>原始出处待补充。</p>}<p>{data.media[record.media].rightsNote}</p></details>}</article>
 <div className="chronicle-flat-media"><Media record={record} data={data}/></div>
 <nav className="chronicle-years" aria-label="生平年谱年份直达">{records.map((r,i)=><button key={r.id} onClick={()=>go(i)} aria-label={`${r.year} ${r.title}`} aria-current={i===index?'step':undefined}><span>{r.year}</span><i/></button>)}</nav>
 <footer className="chronicle-controls" data-scroll-lock><button onClick={()=>go(index-1)} disabled={index===0} aria-label="上一年谱记录">↑</button><label><span>年份直达</span><select aria-label="年谱年份直达" value={index} onChange={e=>go(+e.target.value)}>{records.map((r,i)=><option key={r.id} value={i}>{r.year} · {r.title}</option>)}</select></label><button onClick={()=>index===records.length-1?onNext():go(index+1)} aria-label={index===records.length-1?'前往一纸山川':'下一年谱记录'}>↓</button><small>史料按年展开 · 空间为展陈，不是历史现场复原</small></footer>
 <span className="sr-only" role="status">{record.date}，{record.title}</span>
 </div></div>}
 </div>;
}
