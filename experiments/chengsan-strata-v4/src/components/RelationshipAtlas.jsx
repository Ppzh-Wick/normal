import React, { useMemo, useRef, useState, useId, useEffect } from 'react';
import './RelationshipAtlas.css';

const CURATED = ['stille', 'berlin', 'chengdu', 'sichuan-map', 'jialing', 'guo-lingzhi', 'zhou-tingru', 'arnold-heim'];
const SLOTS = [[480,70],[750,105],[840,255],[740,400],[480,425],[220,400],[120,255],[210,105]];
const radialSlot = i => { const inner=i<8; const angle=-Math.PI/2+(inner?i*Math.PI/4:(i-8)*Math.PI/8+Math.PI/16); return [620+Math.cos(angle)*(inner?290:530),205+Math.sin(angle)*(inner?100:185)]; };
const CATEGORY_MARKS = {people:'人',institutions:'校',research:'野',works:'著'};
const HOME_VIEW = { x:0, y:0, scale:1 };

// Registration marks belong to the drawing, not the historical dataset.
// Only the existing graph nodes and their source-backed links represent records.
function SurveyPlate({ count }) {
  return <g className="atlas-survey-plate" aria-hidden="true" pointerEvents="none">
    <text className="atlas-scene-glyph" x="32" y="384">学</text>
    <text className="atlas-scene-glyph" x="848" y="384">脉</text>
    <path className="atlas-survey-axis" d="M22 205H1218 M620 5V457"/>
    <path className="atlas-survey-corners" d="M14 44V8H50 M1190 8H1226V44 M14 416V452H50 M1190 452H1226V416"/>
    <ellipse className="atlas-survey-rim" cx="620" cy="205" rx="580" ry="214"/>
    {Array.from({length:64},(_,i)=>{
      const a=i*Math.PI/32; const major=i%4===0;
      return <path key={i} className={major?'atlas-survey-tick is-major':'atlas-survey-tick'} d={`M${620+Math.cos(a)*580} ${205+Math.sin(a)*214} L${620+Math.cos(a)*(major?591:585)} ${205+Math.sin(a)*(major?224:219)}`}/>;
    })}
    <text className="atlas-survey-caption" x="24" y="481">学术关系 · {String(count).padStart(2,'0')} 条记录</text>
    <text className="atlas-survey-caption" x="1216" y="481" textAnchor="end">位置为阅读排布 / NOT A MEASURE OF INFLUENCE</text>
  </g>;
}


// Reserve portrait/name boxes before placing edge captions, so the optional
// full-caption view remains useful instead of covering another person's name.
function layoutEdgeLabels(nodes){
 const boxes=[{x:558,y:146,w:124,h:142}];
 nodes.forEach((n,i)=>{const[x,y]=radialSlot(i);boxes.push({x:x-30,y:y-30,w:60,h:60});const chars=n.id==='tectonics-textbook'?6:n.id==='chengdu'?4:Math.min(n.name.length,7);boxes.push({x:x-chars*9-5,y:y+25,w:chars*18+10,h:n.id==='chengdu'?42:24});});
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 return nodes.map((n,i)=>{const[x,y]=radialSlot(i),dx=x-620,dy=y-205,len=Math.hypot(dx,dy),w=n.relation.length*14+8;let best=null;
  for(const t of (i<8?[.57,.43,.7,.33,.8]:[.68,.78,.58,.87,.48,.38]))for(const shift of [-12,12,-24,24,-42,42,-60,60,-84,84,-108,108,0]){const px=620+dx*t-dy/len*shift,py=205+dy*t+dx/len*shift;const box={x:px-w/2,y:py-12,w,h:19};const score=boxes.reduce((s,b)=>s+overlap(box,b),0)*100+Math.abs(shift)*.15+Math.abs(t-(i<8?.57:.68))*10;if(!best||score<best.score)best={x:px,y:py,anchorX:620+dx*t,anchorY:205+dy*t,shift,box,score};}
  boxes.push(best.box);return best;
 });
}

export default function RelationshipAtlas({ data, onOpenImage, selectedId, initialSelectedId, selectionNonce, onNavigateWithin }) {
  const graph = data?.graph || {};
  const nodes = graph.nodes || [];
  const categories = graph.categories || [];
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => nodes.find(n => n.id === (selectedId || initialSelectedId)) || null);
  const [hovered, setHovered] = useState(null);
  const [view, setView] = useState(HOME_VIEW);
  const [isDragging, setIsDragging] = useState(false);
  const [list, setList] = useState(false);
  const [showLabels,setShowLabels]=useState(false);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const returnViewRef = useRef(HOME_VIEW);
  const detailRef = useRef(null);
  const openerRef = useRef(null);
  const focusEvidence=()=>requestAnimationFrame(()=>{const el=detailRef.current;if(!el)return;el.focus({preventScroll:true});if(!el.closest('.atlas-all-view')&&matchMedia('(max-width:999px)').matches)el.scrollIntoView({block:'start',behavior:'instant'});});
  const uid = useId().replace(/:/g, '');
  const filtered = useMemo(() => {
    const ordered = [...nodes].sort((a,b) => {
      const ai=CURATED.indexOf(a.id), bi=CURATED.indexOf(b.id);
      return (ai<0 ? 100 : ai) - (bi<0 ? 100 : bi);
    });
    const q=search.trim().toLocaleLowerCase();
    return ordered.filter(n => (category==='all'||n.category===category) && (!q||[n.name,n.relation,n.subtitle,n.evidence,n.context,n.date].join(' ').toLocaleLowerCase().includes(q)));
  }, [nodes, category, search]);
  useEffect(() => {
    const requestedId = selectedId || initialSelectedId;
    if (!requestedId) return;
    const node = nodes.find(n => n.id === requestedId);
    if (!node) return;
    setSelected(node); setCategory('all'); setSearch('');
    setPage(0);
    returnViewRef.current = HOME_VIEW;
    setView(HOME_VIEW);
    if(detailRef.current) detailRef.current.scrollTop=0;
    focusEvidence();
  }, [selectedId, initialSelectedId, selectionNonce, nodes]);
  const isOverview = category === 'all';
  const pages = isOverview ? 1 : Math.max(1, Math.ceil(filtered.length/8));
  const shown = isOverview ? filtered : filtered.slice(Math.min(page,pages-1)*8,Math.min(page,pages-1)*8+8);
  const overviewNodes = useMemo(() => [...filtered].sort((a,b) => categories.findIndex(c=>c.id===a.category)-categories.findIndex(c=>c.id===b.category)), [filtered,categories]);
  const edgeLabels=useMemo(()=>layoutEdgeLabels(overviewNodes),[overviewNodes]);
  const EvidencePanel = isOverview ? 'dialog' : 'aside';
  useEffect(() => {
    // A deliberate selection makes one finite move. Nothing drifts or orbits.
    if(!selected || list || !matchMedia('(min-width:1000px)').matches)return;
    const index=(isOverview?overviewNodes:shown).findIndex(n=>n.id===selected.id);
    if(index<0)return;
    const [x,y]=isOverview?radialSlot(index):SLOTS[index];
    const cx=isOverview?620:480, cy=isOverview?205:260;
    const scale=isOverview?1.12:1.06;
    const targetX=isOverview?390:480, targetY=isOverview?205:260;
    setView({x:Math.max(-820,Math.min(500,targetX-cx-(x-cx)*scale)),y:Math.max(-140,Math.min(140,targetY-cy-(y-cy)*scale)),scale});
  }, [selected?.id, isOverview, list]);

  useEffect(() => {
    const panel=detailRef.current;
    if(!isOverview || !panel)return;
    if(selected && !panel.open)panel.showModal();
    else if(!selected && panel.open)panel.close();
  }, [isOverview,selected]);
  const active = hovered || selected?.id;
  const portrait = data?.media?.['li-chengsan'];
  const reset = () => {returnViewRef.current=HOME_VIEW;setView(HOME_VIEW);};
  const zoom = delta => setView(v => ({...v,scale:Math.max(.7,Math.min(1.8,+(v.scale+delta).toFixed(2)))}));
  const choose = (n, event) => {
    if(!n)return;
    openerRef.current = event?.currentTarget || document.activeElement;
    if(!selected)returnViewRef.current={...view};
    setSelected(n);
    onNavigateWithin?.();
    if(detailRef.current) detailRef.current.scrollTop=0;
    if(isOverview || event?.type==='keydown' || event?.detail===0 || matchMedia('(max-width:999px)').matches) focusEvidence();
  };
  const closeDetail = () => {
    setSelected(null);setHovered(null);
    setView(returnViewRef.current);
    const opener = openerRef.current;
    requestAnimationFrame(()=>{
      if(opener?.isConnected && opener.getClientRects().length){opener.focus({preventScroll:true});if(matchMedia('(max-width:999px)').matches)opener.scrollIntoView({block:'nearest',behavior:'instant'});}
      else if(svgRef.current?.getClientRects().length) svgRef.current.focus({preventScroll:true});
      else detailRef.current?.closest('.atlas-atlas')?.querySelector('.atlas-filters button')?.focus({preventScroll:true});
      onNavigateWithin?.();
    });
  };
  const changeCategory = id => {setCategory(id);setPage(0);setSelected(null);setHovered(null);reset();requestAnimationFrame(()=>onNavigateWithin?.());};
  const startDrag = e => {
    if(e.button!==0 || e.target.closest('[data-node]')) return;
    setIsDragging(true);
    drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const endDrag = () => {drag.current=null;setIsDragging(false);};
  const moveDrag = e => {
    if(!drag.current || drag.current.id!==e.pointerId) return;
    const rect=svgRef.current.getBoundingClientRect(); const ratio=(isOverview?1240:960)/rect.width;
    setView(v=>({...v,x:Math.max(-350,Math.min(350,drag.current.vx+(e.clientX-drag.current.x)*ratio)),y:Math.max(-250,Math.min(250,drag.current.vy+(e.clientY-drag.current.y)*ratio))}));
  };
  const keyGraph = e => {
    if(e.target!==e.currentTarget) return;
    const shifts={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};
    if(shifts[e.key]) {e.preventDefault();e.stopPropagation();const [x,y]=shifts[e.key];setView(v=>({...v,x:Math.max(-350,Math.min(350,v.x+x)),y:Math.max(-250,Math.min(250,v.y+y))}));}
    if(e.key==='+'||e.key==='='){e.preventDefault();zoom(.15);}
    if(e.key==='-'){e.preventDefault();zoom(-.15);}
    if(e.key==='0'){e.preventDefault();reset();}
  };
  const sourceLink = ref => {
    const source=graph.sources?.[ref.source];
    const pages=ref.pages||(ref.page?[ref.page]:[]);
    const label=(source?.title||ref.source)+(pages.length?' · 第'+pages.join('、')+'页':'');
    if(!source||source.local||!source.url)return <span>{label}<small className="atlas-source-unpublished">未公开原件</small></span>;
    return <a href={source.url+(pages.length&&/\.pdf(?:$|\?)/i.test(source.url)?'#page='+pages[0]:'')} target="_blank" rel="noreferrer">{label} ↗</a>;
  };
  const groupedSources=selected?Object.entries((selected.sources||[]).reduce((all,ref)=>{(all[ref.source]??=[]);if(ref.page&&!all[ref.source].includes(ref.page))all[ref.source].push(ref.page);return all;},{})).map(([source,pages])=>({source,pages})):[];
  const chooseGuide=(id,event)=>{
    const n=nodes.find(n=>n.id===id);if(!n)return;
    setCategory('all');setSearch('');
    setPage(0);reset();choose(n,event);returnViewRef.current=HOME_VIEW;focusEvidence();
  };

  return <div className={`atlas-atlas atlas-observatory ${isOverview?'atlas-all-view':''} ${selected?'atlas-has-focus':''} ${isDragging?'atlas-is-dragging':''}`} onKeyDown={e=>{if(e.key==='Escape'&&selected){e.preventDefault();e.stopPropagation();closeDetail();}}}>
    <div className="atlas-toolbar" data-scroll-lock>
      <div className="atlas-filters" role="group" aria-label="筛选关系类型">
        <button className={category==='all'?'is-active':''} aria-pressed={category==='all'} onClick={()=>changeCategory('all')}>全部关系 <span>{nodes.length}</span></button>
        {categories.map(c=><button key={c.id} className={category===c.id?'is-active':''} aria-pressed={category===c.id} onClick={()=>changeCategory(c.id)}>{c.label}</button>)}
      </div>
      <label className="atlas-search"><span aria-hidden="true">⌕</span><input aria-label="搜索人物、机构或研究" placeholder="搜索人物、机构、研究" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setSelected(null);setHovered(null);reset();requestAnimationFrame(()=>onNavigateWithin?.());}}/>{search&&<button aria-label="清除搜索" onClick={()=>{setSearch('');setPage(0);requestAnimationFrame(()=>onNavigateWithin?.());}}>×</button>}</label>
    </div>
    <div className="atlas-workspace">
      <div className="atlas-map-column">
        {isOverview ? <div className="atlas-map-top atlas-overview-heading"><span className="atlas-observatory-label"><b>{String(nodes.length).padStart(2,'0')}</b> 段联系 <i>RELATIONSHIP OBSERVATORY</i></span><div className="atlas-overview-core">{portrait?.path&&<img src={portrait.path} alt=""/>}<strong>李承三</strong><small>1899 — 1967</small></div><div className="atlas-overview-tools"><button aria-pressed={showLabels} onClick={()=>{setShowLabels(!showLabels);requestAnimationFrame(()=>onNavigateWithin?.());}}>{showLabels?'隐藏关系词':'显示全部关系词'}</button><button aria-pressed={list} onClick={()=>{setList(!list);requestAnimationFrame(()=>onNavigateWithin?.());}}>{list?'切换图谱':'列表阅读'}</button></div></div> : <div className="atlas-map-top"><span className="atlas-observatory-label"><b>{String(filtered.length).padStart(2,'0')}</b> {categories.find(c=>c.id===category)?.label||'学术关系'} <i>RELATIONSHIP OBSERVATORY</i></span><button onClick={()=>{setList(!list);requestAnimationFrame(()=>onNavigateWithin?.());}} aria-pressed={list}>{list?'切换图谱':'列表阅读'} <span aria-hidden="true">↗</span></button></div>}
        <div className={`atlas-canvas ${isOverview?`atlas-overview-canvas ${list?'atlas-complete-list-view':''}`:list?'atlas-show-list':''}`} data-scroll-lock={list||undefined}>
          {isOverview ? <>
            <svg ref={isOverview?svgRef:undefined} className={`atlas-complete-network ${showLabels?'show-all-labels':''}`} tabIndex="0" onKeyDown={keyGraph} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} viewBox="0 0 1240 490" role="group" aria-label={`李承三与全部${overviewNodes.length}条关系，圆形节点和连线，Tab选择节点查看史料`}>
              <SurveyPlate count={overviewNodes.length}/>
              <g className="atlas-arrival"><g className="atlas-camera" transform={`translate(${view.x} ${view.y}) translate(620 205) scale(${view.scale}) translate(-620 -205)`}>
              <defs><clipPath id={`${uid}-all-portrait`}><circle cx="620" cy="205" r="45"/></clipPath>{overviewNodes.map((n,i)=>{const[x,y]=radialSlot(i);return <clipPath key={n.id} id={`${uid}-all-${n.id}`}><circle cx={x} cy={y} r="22"/></clipPath>;})}</defs>
              <ellipse className="atlas-orbit" cx="620" cy="205" rx="530" ry="185"/><ellipse className="atlas-orbit" cx="620" cy="205" rx="290" ry="100"/>
              {overviewNodes.map((n,i)=>{const[x,y]=radialSlot(i);const caption=edgeLabels[i];return <g key={'edge-'+n.id} className={`atlas-radial-link ${active===n.id?'is-active':''} ${active&&active!==n.id?'is-muted':''}`}><path className="atlas-complete-edge" d={`M620 205 L${x} ${y}`}/><path className="atlas-caption-leader" d={Math.abs(caption.shift)>40?`M${caption.anchorX} ${caption.anchorY}L${caption.x} ${caption.y-9}`:undefined}/><text className="atlas-radial-relation" x={caption.x} y={caption.y} aria-hidden="true" textAnchor="middle">{n.relation}</text></g>;})}
              <circle cx="620" cy="205" r="66" className="atlas-core-aura"/><circle cx="620" cy="205" r="54" className="atlas-core-ring"/><circle cx="620" cy="205" r="46" fill="#292824"/>
              {portrait?.path&&<image href={portrait.path} x="575" y="160" width="90" height="90" clipPath={`url(#${uid}-all-portrait)`} preserveAspectRatio="xMidYMin slice"/>}
              <text className="atlas-core-name" x="620" y="275" textAnchor="middle">李承三</text>
              {overviewNodes.map((n,i)=>{const [x,y]=radialSlot(i);const media=n.media||data?.media?.[n.id];const label=n.id==='tectonics-textbook'?'构造地质教材':n.name;const lines=n.id==='chengdu'?['成都地质','勘探学院']:label.length>7?[label.slice(0,7),label.slice(7)]:[label];return <g key={n.id} data-node="true" data-relation-id={n.id} role="button" tabIndex="0" aria-label={`${n.name}，${n.relation}，查看史料`} aria-pressed={selected?.id===n.id} className={`atlas-node atlas-complete-node ${active===n.id?'is-active':''} ${active&&active!==n.id?'is-muted':''}`} onClick={e=>choose(n,e)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();choose(n,e);}}} onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(n.id)} onBlur={()=>setHovered(null)}>
                <circle className="atlas-node-halo" cx={x} cy={y} r="28"/><circle className="atlas-node-disc" cx={x} cy={y} r="23"/>
                {media?.path?<image href={media.path} x={x-22} y={y-22} width="44" height="44" preserveAspectRatio={media.fit||'xMidYMin slice'} clipPath={`url(#${uid}-all-${n.id})`}/>:<text className="atlas-node-symbol" x={x} y={y+8} textAnchor="middle">{CATEGORY_MARKS[n.category]}</text>}
                {lines.map((line,j)=><text key={j} className="atlas-complete-name" x={x} y={y+39+j*17} textAnchor="middle">{line}</text>)}
                <title>{`${n.name} · ${n.relation}`}</title>
              </g>;})}
              </g></g>
            </svg>
            <div className="atlas-complete-list" aria-label="全部学术关系列表">{overviewNodes.map(n=><button key={n.id} onClick={e=>choose(n,e)}><span><strong>{n.name}</strong><small>{n.relation} · {n.date}</small></span><i aria-hidden="true">↗</i></button>)}</div>
            <div className="atlas-complete-controls"><div className="atlas-curated-entries" aria-label="从三段关系开始读">{[['stille','师从施蒂勒'],['guo-lingzhi','与郭令智同行'],['xu-kaili','指导徐开礼']].map(([id,label])=><button key={id} onClick={e=>choose(nodes.find(n=>n.id===id),e)}>{label}<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" stroke="currentColor"/></svg></button>)}</div><div><button aria-label="缩小全部关系图" onClick={()=>zoom(-.15)}>−</button><output>{Math.round(view.scale*100)}%</output><button aria-label="放大全部关系图" onClick={()=>zoom(.15)}>+</button><button aria-label="复位全部关系图" onClick={reset}>复位</button></div></div>

          </> : <>
          <svg ref={svgRef} className="atlas-network" viewBox="0 15 960 505" role="group" aria-label="以李承三为中心的关系图。拖动平移，方向键平移，加减缩放，0复位。Tab键选择关系节点。" tabIndex="0" onKeyDown={keyGraph} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
            <defs>
              <radialGradient id={`${uid}-glow`}><stop offset="0" stopColor="#ae9161" stopOpacity=".12"/><stop offset="1" stopColor="#ae9161" stopOpacity="0"/></radialGradient>
              <clipPath id={`${uid}-portrait`}><circle cx="480" cy="250" r="64"/></clipPath>
              {shown.map((n,i)=><clipPath key={n.id} id={`${uid}-${n.id}`}><circle cx={SLOTS[i][0]} cy={SLOTS[i][1]} r="39"/></clipPath>)}
            </defs>
            <g className="atlas-camera" transform={`translate(${view.x} ${view.y}) translate(480 260) scale(${view.scale}) translate(-480 -260)`}>
              <circle cx="480" cy="260" r="360" fill={`url(#${uid}-glow)`}/>
              <circle className="atlas-orbit" cx="480" cy="260" r="142"/><ellipse className="atlas-orbit" cx="480" cy="260" rx="340" ry="187"/>
              <path className="atlas-crosshair" d="M480 18V525 M22 260H938"/>
              {shown.map((n,i)=>{const[x,y]=SLOTS[i]; const lit=active===n.id;return <g key={`edge-${n.id}`} className={`atlas-edge ${lit?'is-active':''} ${active&&!lit?'is-muted':''}`}><path d={`M480 260 Q${(480+x)/2 + (y>260?24:-24)} ${(260+y)/2} ${x} ${y}`}/><text x={i===0?(n.name.length>10?565:425):i===1?630:i===7?330:i===4?620:480+(x-480)*.61} y={i===0?170:(i===1||i===7)?220:i===4?390:260+(y-260)*.61-9} textAnchor="middle">{n.relation}</text></g>;})}
              <circle className="atlas-core-ring" cx="480" cy="250" r="76"/>
              <circle cx="480" cy="250" r="65" fill="#292824"/>
              {portrait?.path&&<image href={portrait.path} x="416" y="186" width="128" height="128" preserveAspectRatio="xMidYMin slice" clipPath={`url(#${uid}-portrait)`}/>}
              <rect x="416" y="304" width="128" height="70" rx="2" fill="#191a1b"/>
              <text className="atlas-core-name" x="480" y="333" textAnchor="middle">李承三</text><text className="atlas-core-date" x="480" y="359" textAnchor="middle">1899 — 1967</text>
              {shown.map((n,i)=>{const[x,y]=SLOTS[i];const media=n.media||data?.media?.[n.id]; const lines=n.name.length>10?(n.lines||[n.name.slice(0,8),n.name.slice(8)]):[n.name];return <g key={n.id} data-node="true" role="button" tabIndex="0" aria-label={`${n.name}，${n.relation}，查看史料`} aria-pressed={selected?.id===n.id} className={`atlas-node ${active===n.id?'is-active':''} ${active&&active!==n.id?'is-muted':''}`} onClick={e=>choose(n,e)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();choose(n,e);}}} onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(n.id)} onBlur={()=>setHovered(null)}>
                <circle className="atlas-node-halo" cx={x} cy={y} r="47"/><circle className="atlas-node-disc" cx={x} cy={y} r="40"/>
                {media?.path?<image href={media.path} x={x-39} y={y-39} width="78" height="78" preserveAspectRatio={media.fit||'xMidYMin slice'} clipPath={`url(#${uid}-${n.id})`}/>:<text className="atlas-node-symbol" x={x} y={y+8} textAnchor="middle">{CATEGORY_MARKS[n.category]||'录'}</text>}
                {lines.map((line,j)=><text key={j} className="atlas-node-name" x={x} y={y+64+j*25} textAnchor="middle">{line}</text>)}
              </g>;})}
            </g>
          </svg>
          <div className="atlas-list" aria-label="关系节点列表">{shown.map(n=><button key={n.id} onClick={e=>choose(n,e)} className={selected?.id===n.id?'is-active':''}><span className="atlas-list-mark">{CATEGORY_MARKS[n.category]}</span><span><strong>{n.name}</strong><small>{n.relation} · {n.subtitle}</small></span><span aria-hidden="true">↗</span></button>)}</div>
          <div className="atlas-map-controls"><span>拖动探索 · 选择节点读史料</span><div><button aria-label="缩小关系图" onClick={()=>zoom(-.15)}>−</button><output aria-live="polite">{Math.round(view.scale*100)}%</output><button aria-label="放大关系图" onClick={()=>zoom(.15)}>+</button><button aria-label="复位关系图" onClick={reset}>复位</button></div></div>
          </>}
          {!shown.length&&<div className="atlas-empty">未找到相关记录。<button onClick={()=>{setSearch('');changeCategory('all');}}>重置筛选</button></div>}
        </div>
        {isOverview ? <div className="atlas-map-bottom atlas-overview-bottom"><span aria-live="polite">{search.trim()?`找到 ${filtered.length} / ${nodes.length} 条关系`:`全部 ${nodes.length} 条关系 · 已完整展开`}</span><span>位置只作阅读排布，不表示亲疏或影响</span></div> : <div className="atlas-map-bottom"><span aria-live="polite">{filtered.length?`${Math.min(page,pages-1)*8+1} — ${Math.min((page+1)*8,filtered.length)}`:'0'} / {filtered.length} 条关系</span><div><button disabled={page===0} aria-label="上一组关系" onClick={()=>{setPage(p=>p-1);setSelected(null);setHovered(null);reset();requestAnimationFrame(()=>onNavigateWithin?.());}}>←</button><span>{page+1} / {pages}</span><button disabled={page>=pages-1} aria-label="下一组关系" onClick={()=>{setPage(p=>p+1);setSelected(null);setHovered(null);reset();requestAnimationFrame(()=>onNavigateWithin?.());}}>→</button></div></div>}
      </div>
      <EvidencePanel className={`atlas-evidence ${selected?'has-selection':''}`} hidden={isOverview&&!selected} ref={detailRef} tabIndex="-1" data-scroll-lock aria-label={selected?`${selected.name}的关系史料`:'关系史料'} onWheel={e=>e.stopPropagation()} onCancel={e=>{e.preventDefault();closeDetail();}} onClick={e=>{if(isOverview&&e.target===e.currentTarget){const rect=e.currentTarget.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDetail();}}}>
        <div className="atlas-evidence-eyebrow"><span>关系档案 / EVIDENCE</span>{selected&&<button aria-label="关闭关系详情" onClick={closeDetail}>×</button>}</div>
        {selected?<>
          <div className="atlas-sheet-index" aria-hidden="true"><span>关系索引</span>{String(nodes.findIndex(n=>n.id===selected.id)+1).padStart(2,'0')}</div>
          <p className="atlas-source-status">{selected.status || '依据所列资料整理'}<br/><span>{selected.sources?.filter(r=>r.source==='enhancedChronology').length ? '本次年谱 · 第'+[...new Set(selected.sources.filter(r=>r.source==='enhancedChronology').map(r=>r.page))].join('、')+'页' : '详见下方文字依据'}</span></p>
          <span className="atlas-relation">{selected.relation}</span><h3>{selected.name}</h3><p className="atlas-subtitle">{selected.subtitle}</p><p className="atlas-date">{selected.date}</p>
          <h4>关系记述</h4><p className="atlas-prose">{selected.evidence}</p>
          {selected.context&&<details className="atlas-context"><summary>延伸阅读</summary><p className="atlas-prose">{selected.context}</p></details>}
          <div className="atlas-citations"><h4>文字依据</h4><ol>{groupedSources.map(ref=><li key={ref.source}>{sourceLink(ref)}</li>)}</ol></div>
          {(selected.media||data?.media?.[selected.id])&&(()=>{const media=selected.media||data.media[selected.id];return <figure className="atlas-document"><button className="atlas-document-image" onClick={()=>onOpenImage?.(media)} disabled={!onOpenImage} aria-label={`查看图片与出处：${media.caption||selected.name}`}><img src={media.path} alt={media.alt||selected.name} loading="lazy"/>{onOpenImage&&<span>查看原图 ↗</span>}</button><figcaption>{media.caption}<p>{media.credit}</p><p>{media.rightsNote}</p>{media.verificationNote&&<p>{media.verificationNote}</p>}{media.sourceUrl&&<a href={media.sourceUrl} target="_blank" rel="noreferrer">图像来源：{media.sourceTitle||'原始页面'} ↗</a>}{media.licenseUrl&&<a href={media.licenseUrl} target="_blank" rel="noreferrer">许可：{media.license||'查看许可'} ↗</a>}</figcaption></figure>;})()}
        </>:<div className="atlas-invitation"><span className="atlas-invitation-index">以人为轴，以史为据</span><h3>一段关系，<br/>一条学脉。</h3><div className="atlas-guides">{[['stille','他向谁求学？'],['guo-lingzhi','谁与他共同考察？'],['xu-kaili','学问怎样传向后来？']].map(([id,label],i)=><button key={id} onClick={e=>chooseGuide(id,e)}><span>0{i+1}</span>{label}<i aria-hidden="true">→</i></button>)}</div><div className="atlas-reading-note"><span>阅读说明</span><p>节点位置只作阅读排布，不表示亲疏或影响。文字依据与图像出处分别标注。</p></div>{graph.sources?.[graph.primarySource]&&<div className="atlas-primary-source">{sourceLink({source:graph.primarySource})}</div>}</div>}
      </EvidencePanel>
    </div>
  </div>;
}
