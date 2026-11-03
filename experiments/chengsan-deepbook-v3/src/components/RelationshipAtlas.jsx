import React, { useMemo, useRef, useState, useId, useEffect } from 'react';
import './RelationshipAtlas.css';

const CURATED = ['stille', 'berlin', 'chengdu', 'sichuan-map', 'jialing', 'guo-lingzhi', 'zhou-tingru', 'arnold-heim'];
const SLOTS = [[480,70],[750,105],[840,255],[740,400],[480,425],[220,400],[120,255],[210,105]];
const CATEGORY_MARKS = {people:'人',institutions:'校',research:'野',works:'著'};

export default function RelationshipAtlas({ data, onOpenImage, selectedId, initialSelectedId, selectionNonce, onNavigateWithin }) {
  const graph = data?.graph || {};
  const nodes = graph.nodes || [];
  const categories = graph.categories || [];
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => nodes.find(n => n.id === (selectedId || initialSelectedId)) || null);
  const [hovered, setHovered] = useState(null);
  const [view, setView] = useState({ x:0, y:0, scale:1 });
  const [list, setList] = useState(false);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const detailRef = useRef(null);
  const openerRef = useRef(null);
  const focusEvidence=()=>requestAnimationFrame(()=>{const el=detailRef.current;if(!el)return;el.focus({preventScroll:true});if(matchMedia('(max-width:999px)').matches)el.scrollIntoView({block:'start',behavior:'instant'});});
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
    const ordered = [...nodes].sort((a,b) => {
      const ai=CURATED.indexOf(a.id), bi=CURATED.indexOf(b.id);
      return (ai<0?100:ai)-(bi<0?100:bi);
    });
    setPage(Math.floor(ordered.findIndex(n => n.id === requestedId)/8));
    setView({x:0,y:0,scale:1});
    if(detailRef.current) detailRef.current.scrollTop=0;
    focusEvidence();
  }, [selectedId, initialSelectedId, selectionNonce, nodes]);
  const pages = Math.max(1, Math.ceil(filtered.length/8));
  const shown = filtered.slice(Math.min(page,pages-1)*8,Math.min(page,pages-1)*8+8);
  const active = hovered || selected?.id;
  const portrait = data?.media?.['li-chengsan'];
  const reset = () => setView({x:0,y:0,scale:1});
  const zoom = delta => setView(v => ({...v,scale:Math.max(.7,Math.min(1.8,+(v.scale+delta).toFixed(2)))}));
  const choose = (n, event) => {
    openerRef.current = event?.currentTarget || document.activeElement;
    setSelected(n);
    onNavigateWithin?.();
    if(detailRef.current) detailRef.current.scrollTop=0;
    if(event?.type==='keydown' || event?.detail===0 || matchMedia('(max-width:999px)').matches) focusEvidence();
  };
  const closeDetail = () => {
    setSelected(null);setHovered(null);
    const opener = openerRef.current;
    requestAnimationFrame(()=>{
      if(opener?.isConnected && opener.getClientRects().length){opener.focus({preventScroll:true});if(matchMedia('(max-width:999px)').matches)opener.scrollIntoView({block:'nearest',behavior:'instant'});}
      else if(svgRef.current?.getClientRects().length) svgRef.current.focus({preventScroll:true});
      else detailRef.current?.closest('.atlas-atlas')?.querySelector('.atlas-filters button')?.focus({preventScroll:true});
      onNavigateWithin?.();
    });
  };
  const changeCategory = id => {setCategory(id);setPage(0);setSelected(null);setHovered(null);reset();};
  const startDrag = e => {
    if(e.button!==0 || e.target.closest('[data-node]')) return;
    drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = e => {
    if(!drag.current || drag.current.id!==e.pointerId) return;
    const rect=svgRef.current.getBoundingClientRect(); const ratio=960/rect.width;
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
    const ordered=[...nodes].sort((a,b)=>{const ai=CURATED.indexOf(a.id),bi=CURATED.indexOf(b.id);return(ai<0?100:ai)-(bi<0?100:bi)});
    setPage(Math.floor(ordered.findIndex(n=>n.id===id)/8));reset();choose(n,event);focusEvidence();
  };

  return <div className="atlas-atlas" onKeyDown={e=>{if(e.key==='Escape'&&selected){e.preventDefault();e.stopPropagation();closeDetail();}}}>
    <div className="atlas-toolbar" data-scroll-lock>
      <div className="atlas-filters" role="group" aria-label="筛选关系类型">
        <button className={category==='all'?'is-active':''} aria-pressed={category==='all'} onClick={()=>changeCategory('all')}>全部关系 <span>{nodes.length}</span></button>
        {categories.map(c=><button key={c.id} className={category===c.id?'is-active':''} aria-pressed={category===c.id} onClick={()=>changeCategory(c.id)}>{c.label}</button>)}
      </div>
      <label className="atlas-search"><span aria-hidden="true">⌕</span><input aria-label="搜索人物、机构或研究" placeholder="搜索人物、机构、研究" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setSelected(null);setHovered(null);reset();}}/>{search&&<button aria-label="清除搜索" onClick={()=>{setSearch('');setPage(0);}}>×</button>}</label>
    </div>
    <div className="atlas-workspace">
      <div className="atlas-map-column">
        <div className="atlas-map-top"><span>学术关系图谱 <i>RELATIONSHIP ATLAS</i></span><button onClick={()=>{setList(!list);onNavigateWithin?.();}} aria-pressed={list}>{list?'切换图谱':'列表阅读'} <span aria-hidden="true">↗</span></button></div>
        <div className={`atlas-canvas ${list?'atlas-show-list':''}`} data-scroll-lock={list||undefined}>
          <svg ref={svgRef} className="atlas-network" viewBox="0 15 960 505" role="group" aria-label="以李承三为中心的关系图。拖动平移，方向键平移，加减缩放，0复位。Tab键选择关系节点。" tabIndex="0" onKeyDown={keyGraph} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
            <defs>
              <radialGradient id={`${uid}-glow`}><stop offset="0" stopColor="#ae9161" stopOpacity=".12"/><stop offset="1" stopColor="#ae9161" stopOpacity="0"/></radialGradient>
              <clipPath id={`${uid}-portrait`}><circle cx="480" cy="250" r="64"/></clipPath>
              {shown.map((n,i)=><clipPath key={n.id} id={`${uid}-${n.id}`}><circle cx={SLOTS[i][0]} cy={SLOTS[i][1]} r="39"/></clipPath>)}
            </defs>
            <g transform={`translate(${view.x} ${view.y}) translate(480 260) scale(${view.scale}) translate(-480 -260)`}>
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
          {!shown.length&&<div className="atlas-empty">未找到相关记录。<button onClick={()=>{setSearch('');changeCategory('all');}}>重置筛选</button></div>}
          <div className="atlas-map-controls"><span>拖动探索 · 选择节点读史料</span><div><button aria-label="缩小关系图" onClick={()=>zoom(-.15)}>−</button><output aria-live="polite">{Math.round(view.scale*100)}%</output><button aria-label="放大关系图" onClick={()=>zoom(.15)}>+</button><button aria-label="复位关系图" onClick={reset}>复位</button></div></div>
        </div>
        <div className="atlas-map-bottom"><span aria-live="polite">{filtered.length?`${Math.min(page,pages-1)*8+1} — ${Math.min((page+1)*8,filtered.length)}`:'0'} / {filtered.length} 条关系</span><div><button disabled={page===0} aria-label="上一组关系" onClick={()=>{setPage(p=>p-1);setSelected(null);setHovered(null);reset();}}>←</button><span>{page+1} / {pages}</span><button disabled={page>=pages-1} aria-label="下一组关系" onClick={()=>{setPage(p=>p+1);setSelected(null);setHovered(null);reset();}}>→</button></div></div>
      </div>
      <aside className={`atlas-evidence ${selected?'has-selection':''}`} ref={detailRef} tabIndex="-1" data-scroll-lock aria-label="关系史料" onWheel={e=>e.stopPropagation()}>
        <div className="atlas-evidence-eyebrow"><span>档案注释 / EVIDENCE</span>{selected&&<button aria-label="关闭关系详情" onClick={closeDetail}>×</button>}</div>
        {selected?<>
          <p className="atlas-source-status">{selected.status || '依据所列资料整理'}<br/><span>{selected.sources?.filter(r=>r.source==='enhancedChronology').length ? '本次年谱 · 第'+[...new Set(selected.sources.filter(r=>r.source==='enhancedChronology').map(r=>r.page))].join('、')+'页' : '详见下方文字依据'}</span></p>
          <span className="atlas-relation">{selected.relation}</span><h3>{selected.name}</h3><p className="atlas-subtitle">{selected.subtitle}</p><p className="atlas-date">{selected.date}</p>
          <h4>关系记述</h4><p className="atlas-prose">{selected.evidence}</p>
          {selected.context&&<details className="atlas-context"><summary>延伸阅读</summary><p className="atlas-prose">{selected.context}</p></details>}
          <div className="atlas-citations"><h4>文字依据</h4><ol>{groupedSources.map(ref=><li key={ref.source}>{sourceLink(ref)}</li>)}</ol></div>
          {(selected.media||data?.media?.[selected.id])&&(()=>{const media=selected.media||data.media[selected.id];return <figure className="atlas-document"><button className="atlas-document-image" onClick={()=>onOpenImage?.(media)} disabled={!onOpenImage} aria-label={`查看图片与出处：${media.caption||selected.name}`}><img src={media.path} alt={media.alt||selected.name} loading="lazy"/>{onOpenImage&&<span>查看原图 ↗</span>}</button><figcaption>{media.caption}<p>{media.credit}</p><p>{media.rightsNote}</p>{media.verificationNote&&<p>{media.verificationNote}</p>}{media.sourceUrl&&<a href={media.sourceUrl} target="_blank" rel="noreferrer">图像来源：{media.sourceTitle||'原始页面'} ↗</a>}{media.licenseUrl&&<a href={media.licenseUrl} target="_blank" rel="noreferrer">许可：{media.license||'查看许可'} ↗</a>}</figcaption></figure>;})()}
        </>:<div className="atlas-invitation"><span className="atlas-invitation-index">以人为轴，以史为据</span><h3>一段关系，<br/>一条学脉。</h3><div className="atlas-guides">{[['stille','他向谁求学？'],['guo-lingzhi','谁与他共同考察？'],['xu-kaili','学问怎样传向后来？']].map(([id,label],i)=><button key={id} onClick={e=>chooseGuide(id,e)}><span>0{i+1}</span>{label}<i aria-hidden="true">→</i></button>)}</div><div className="atlas-reading-note"><span>阅读说明</span><p>节点位置只作阅读排布，不表示亲疏或影响。文字依据与图像出处分别标注。</p></div>{graph.sources?.[graph.primarySource]&&<div className="atlas-primary-source">{sourceLink({source:graph.primarySource})}</div>}</div>}
      </aside>
    </div>
  </div>;
}
