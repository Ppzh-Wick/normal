import React, { useMemo, useRef, useState, useId, useEffect } from 'react';
import './RelationshipAtlas.css';
import {OrbitTheatre,OrbitLightDefs} from './OrbitTheatre.jsx';
import { centerPortraitScale, portraitTransform, pairCamera } from './relationFocus.mjs';

const CURATED = ['stille', 'berlin', 'chengdu', 'sichuan-map', 'jialing', 'guo-lingzhi', 'zhou-tingru', 'arnold-heim'];
const SLOTS = [[480,70],[750,105],[840,255],[740,400],[480,425],[220,400],[120,255],[210,105]];
import { HIERARCHY, RINGS, orbitCoordinates, nodeTier, nodeGeometry, radialSlot, overviewNameLayout, overviewCoreNameY, nodeDepthScale, nodeFocusScale } from './relationHierarchy.mjs';
const CATEGORY_MARKS = {people:'人',institutions:'校',research:'野',works:'著'};
const HOME_VIEW = { x:0, y:0, scale:1 };

// Registration marks belong to the drawing, not the historical dataset.
// Only the existing graph nodes and their source-backed links represent records.
const SurveyPlate = React.memo(function SurveyPlate() {
  return <g className="atlas-survey-plate" aria-hidden="true" pointerEvents="none">
    <text className="atlas-scene-glyph" x="32" y="384">学</text>
    <text className="atlas-scene-glyph" x="848" y="384">脉</text>
    <path className="atlas-survey-axis" d="M22 205H1218 M620 5V457"/>
    <ellipse className="atlas-survey-rim" cx="620" cy="205" rx="580" ry="214"/>
    {Array.from({length:64},(_,i)=>{
      const a=i*Math.PI/32; const major=i%4===0;
      return <path key={i} className={major?'atlas-survey-tick is-major':'atlas-survey-tick'} d={`M${620+Math.cos(a)*580} ${205+Math.sin(a)*214} L${620+Math.cos(a)*(major?591:585)} ${205+Math.sin(a)*(major?224:219)}`}/>;
    })}
  </g>;
});


// Reserve portrait/name boxes before placing edge captions, so the optional
// full-caption view remains useful instead of covering another person's name.
function layoutEdgeLabels(nodes, compact=false, selectedId=null){
 const centerScale=centerPortraitScale(selectedId),centerRadius=HIERARCHY.overview.center.halo*centerScale+3;
 const protectedPortrait={x:620,y:205,r:HIERARCHY.overview.center.radius*centerScale+2};
 const circles=[{x:620,y:205,r:centerRadius}];
 const coreNameY=205+HIERARCHY.overview.center.radius*centerScale+32;
 const boxes=[{x:579,y:coreNameY-26,w:82,h:32}];
 nodes.forEach((n,i)=>{const[x,y]=radialSlot(i,compact,nodes),radius=nodeGeometry(n).halo*nodeDepthScale(n,i,compact,nodes)*nodeFocusScale(selectedId,n,i,compact,nodes)+3;circles.push({x,y,r:radius});const label=overviewNameLayout(n,i,compact,selectedId===n.id,nodes),w=Math.max(...label.lines.map(l=>l.length))*label.size+10;boxes.push({x:label.anchor==='start'?label.x-5:label.anchor==='end'?label.x-w+5:label.x-w/2,y:label.y-label.size,w,h:label.lines.length*20+5});});
 const {rx,ry}=RINGS[compact?'compact':'full'].people;
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 const ellipse=(x,y)=>{const [u,v]=orbitCoordinates(x,y,true);return ((u-620)/rx)**2+((v-205)/ry)**2;};
 const circleOverlap=(b,c)=>{const x=Math.max(b.x-c.x,0,c.x-b.x-b.w),y=Math.max(b.y-c.y,0,c.y-b.y-b.h);return Math.max(0,c.r-Math.hypot(x,y))**2;};
 const labels=[],placed=[];
 const order=nodes.map((_,i)=>i).sort((a,b)=>Number(nodes[b].id===selectedId)-Number(nodes[a].id===selectedId)||nodes[b].relation.length-nodes[a].relation.length);
 for(const i of order){
  const n=nodes[i],[x,y]=radialSlot(i,compact,nodes),dx=x-620,dy=y-205,reach=1/Math.sqrt(ellipse(x,y)),width=[...n.relation].length*19+8;
  const preferred=nodeTier(n)===2?.57:.74;
  let best=null;
  for(let p=25;p<=95;p++){
   const fraction=p/100,t=fraction*reach,px=620+dx*t,py=205+dy*t;
   const box={x:px-width/2,y:py-15,w:width,h:30};
   if(Math.max(ellipse(box.x,box.y),ellipse(box.x+box.w,box.y),ellipse(box.x,box.y+box.h),ellipse(box.x+box.w,box.y+box.h))>.965)continue;
   if(circleOverlap(box,protectedPortrait)>0)continue;
   const score=boxes.reduce((s,b)=>s+overlap(box,b),0)*130+circles.reduce((s,c)=>s+circleOverlap(box,c),0)*130+placed.reduce((s,b)=>s+overlap(box,b),0)*65+Math.abs(fraction-preferred)*56;
   if(!best||score<best.score)best={x:px,y:py,box,score};
  }
  // For compact layouts the graph center itself always lies within the people ring.
  // This defensive fallback is only for unexpected, much longer data labels.
  if(!best)best={x:620+dx*reach*.5,y:205+dy*reach*.5,box:{x:620+dx*reach*.5-width/2,y:190+dy*reach*.5,w:width,h:30},score:Infinity};
  labels[i]=best;placed.push(best.box);
 }
 return labels;

}

export function RelationshipAtlas({ data, onOpenImage, selectedId, initialSelectedId, selectionNonce, onNavigateWithin }) {
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
  const [desktop,setDesktop]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(min-width:1000px)').matches);
  useEffect(()=>{const query=window.matchMedia('(min-width:1000px)');const update=()=>setDesktop(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  const compact=desktop&&!!selected;
  const [focusedRelation,setFocusedRelation]=useState(false);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const dragFrame = useRef(0), pendingView = useRef(null);
  useEffect(()=>()=>{if(dragFrame.current)cancelAnimationFrame(dragFrame.current)},[]);
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
  // The filters only choose records; all of them use the shared radial atlas.
  const isOverview = true;
  useEffect(()=>{
    if(desktop||!isOverview||list)return;
    const frame=requestAnimationFrame(()=>{const canvas=canvasRef.current;if(canvas)canvas.scrollLeft=(canvas.scrollWidth-canvas.clientWidth)/2;});
    return()=>cancelAnimationFrame(frame);
  },[desktop,isOverview,list]);
  const pages = isOverview ? 1 : Math.max(1, Math.ceil(filtered.length/8));
  const shown = isOverview ? filtered : filtered.slice(Math.min(page,pages-1)*8,Math.min(page,pages-1)*8+8);
  const twoTiers = category !== "all";
  const overviewNodes = useMemo(() => [...filtered].sort((a,b) => categories.findIndex(c=>c.id===a.category)-categories.findIndex(c=>c.id===b.category)).map(node=>twoTiers?{...node,visualTier:2}:node), [filtered,categories,twoTiers]);
  const edgeLabels=useMemo(()=>layoutEdgeLabels(overviewNodes,compact,selected?.id),[overviewNodes,compact,selected?.id]);
  const focusRelation = (node=selected) => {
    if(!desktop||!node)return;
    const index=(isOverview?overviewNodes:shown).findIndex(n=>n.id===node.id);
    if(index<0)return;
    const [x,y]=isOverview?radialSlot(index,true,overviewNodes):SLOTS[index];
    // Pan the pair into view without enlarging the rest of the graph.
    // Only the selected portrait and the central portrait scale locally.
    setView(pairCamera(x,y,isOverview));
    setFocusedRelation(true);
  };
  useEffect(()=>{if(selected&&desktop)focusRelation();},[selected?.id,desktop,isOverview,selectionNonce]);
  const EvidencePanel = isOverview || selected ? 'dialog' : 'aside';
  useEffect(() => {
    const panel=detailRef.current;
    if(!panel || panel.tagName!=='DIALOG')return;
    // A desktop folio is nonmodal: the graph, filters and zoom remain usable.
    // Reopen when crossing the breakpoint to enter/leave the native top layer.
    if(panel.open)panel.close();
    if(selected){if(desktop)panel.show();else panel.showModal();}
  }, [desktop,isOverview,!!selected]);
  const active = selected?.id || hovered;
  const portrait = data?.media?.['li-chengsan'];
  const reset = () => {if(!selected)returnViewRef.current=HOME_VIEW;setView(HOME_VIEW);setFocusedRelation(false);};
  const choose = (n, event) => {
    if(!n)return;
    openerRef.current = event?.currentTarget || document.activeElement;
    if(!selected){returnViewRef.current={...view};if(desktop)setView(HOME_VIEW);}
    setSelected(n);
    if(desktop)focusRelation(n);
    onNavigateWithin?.();
    if(detailRef.current) detailRef.current.scrollTop=0;
    if(isOverview || event?.type==='keydown' || event?.detail===0 || matchMedia('(max-width:999px)').matches) focusEvidence();
  };
  const closeDetail = () => {
    setSelected(null);setHovered(null);setFocusedRelation(false);
    setView(returnViewRef.current);
    const opener = openerRef.current;
    requestAnimationFrame(()=>{
      if(opener?.isConnected && opener.getClientRects().length){opener.focus({preventScroll:true});if(matchMedia('(max-width:999px)').matches)opener.scrollIntoView({block:'nearest',behavior:'instant'});}
      else if(svgRef.current?.getClientRects().length) svgRef.current.focus({preventScroll:true});
      else detailRef.current?.closest('.atlas-atlas')?.querySelector('.atlas-filters button')?.focus({preventScroll:true});
      onNavigateWithin?.();
    });
  };
  const trapEvidenceFocus = e => {
    if(e.key!=='Tab'||desktop||!selected)return;
    const panel=e.currentTarget;
    if(!panel.matches('dialog:modal'))return;
    const controls=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length&&!el.closest('[inert]'));
    const first=controls[0],last=controls.at(-1),current=document.activeElement;
    if(!first){e.preventDefault();panel.focus({preventScroll:true});return;}
    if(e.shiftKey&&(current===first||current===panel||!panel.contains(current))){
      e.preventDefault();last.focus({preventScroll:true});
    }else if(!e.shiftKey&&(current===last||!panel.contains(current))){
      e.preventDefault();first.focus({preventScroll:true});
    }
  };
  const changeCategory = id => {setCategory(id);setPage(0);setSelected(null);setHovered(null);reset();requestAnimationFrame(()=>onNavigateWithin?.());};
  const startDrag = e => {
    if(e.button!==0 || e.target.closest('[data-node]')) return;
    setIsDragging(true);setFocusedRelation(false);
    const rect=e.currentTarget.getBoundingClientRect();
    drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,scale:view.scale,ratio:(isOverview?(compact?960:1300):960)/Math.max(1,rect.width)};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const endDrag = () => {
    if(dragFrame.current){cancelAnimationFrame(dragFrame.current);dragFrame.current=0;}
    if(pendingView.current){setView(pendingView.current);pendingView.current=null;}
    drag.current=null;setIsDragging(false);
  };
  const moveDrag = e => {
    if(!drag.current || drag.current.id!==e.pointerId) return;
    const {ratio,scale,vx,vy,x,y}=drag.current;
    pendingView.current={scale,x:Math.max(-350,Math.min(350,vx+(e.clientX-x)*ratio)),y:Math.max(-250,Math.min(250,vy+(e.clientY-y)*ratio))};
    if(!dragFrame.current)dragFrame.current=requestAnimationFrame(()=>{dragFrame.current=0;if(pendingView.current){setView(pendingView.current);pendingView.current=null;}});
  };
  const keyGraph = e => {
    if(e.target!==e.currentTarget) return;
    const shifts={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};
    if(shifts[e.key]) {e.preventDefault();e.stopPropagation();setFocusedRelation(false);const [x,y]=shifts[e.key];setView(v=>({...v,x:Math.max(-350,Math.min(350,v.x+x)),y:Math.max(-250,Math.min(250,v.y+y))}));}
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

  return <div className={`atlas-atlas atlas-observatory atlas-spatial-reader ${isOverview?'atlas-all-view':''} ${selected?'atlas-has-focus':''} ${isDragging?'atlas-is-dragging':''}`} onKeyDown={e=>{if(e.key==='Escape'&&selected){e.preventDefault();e.stopPropagation();closeDetail();}}}>
    <div className="atlas-toolbar" data-scroll-lock>
      <div className="atlas-filters" role="group" aria-label="筛选关系类型">
        <button className={category==='all'?'is-active':''} aria-pressed={category==='all'} onClick={()=>changeCategory('all')}>全部关系 <span>{nodes.length}</span></button>
        {categories.map(c=><button key={c.id} className={category===c.id?'is-active':''} aria-pressed={category===c.id} onClick={()=>changeCategory(c.id)}>{c.label}</button>)}
      </div>
      <label className="atlas-search"><span aria-hidden="true">⌕</span><input aria-label="搜索人物、机构或研究" placeholder="搜索人物、机构、研究" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setSelected(null);setHovered(null);reset();requestAnimationFrame(()=>onNavigateWithin?.());}}/>{search&&<button aria-label="清除搜索" onClick={()=>{setSearch('');setPage(0);requestAnimationFrame(()=>onNavigateWithin?.());}}>×</button>}</label>
    </div>
    <div className="atlas-hierarchy-key" role="list" aria-label={twoTiers?"图谱视觉层级：一级李承三，二级本类关系":"图谱视觉层级：一级李承三，二级人物，三级机构、研究和成果"}>
      <span role="listitem"><i className="tier-one" aria-hidden="true"/>一级 · 李承三</span><span role="listitem"><i className="tier-two" aria-hidden="true"/>{twoTiers?'二级 · 本类关系':'二级 · 人物内圈'}</span>{!twoTiers&&<span role="listitem"><i className="tier-three" aria-hidden="true"/>三级 · 机构 / 研究 / 成果外圈</span>}
    </div>
    <p className="atlas-mobile-pan-hint">左右滑动查看图谱</p>
    <div className="atlas-workspace">
      <div className="atlas-map-column">
        {isOverview ? <div className="atlas-map-top atlas-overview-heading"><div className="atlas-overview-core">{portrait?.path&&<img src={portrait.path} alt=""/>}<strong>李承三</strong><small>1899 — 1967</small></div><div className="atlas-overview-tools"><button aria-pressed={showLabels} onClick={()=>{setShowLabels(!showLabels);requestAnimationFrame(()=>onNavigateWithin?.());}}>{showLabels?'隐藏关系词':'显示全部关系词'}</button></div></div> : null}
        {compact&&<div className="atlas-focus-navigation"><span>{focusedRelation?'聚焦关系 · 拖动继续探索':'自由视图 · 拖动继续探索'}</span><button onClick={()=>{if(focusedRelation)reset();else{setList(false);focusRelation();}}}>{focusedRelation?'查看全图 ↗':'聚焦当前关系 ↗'}</button></div>}
        <div ref={canvasRef} className={`atlas-canvas ${isOverview?`atlas-overview-canvas ${list?'atlas-complete-list-view':''}`:list?'atlas-show-list':''}`} data-scroll-lock={list||undefined}>
          {isOverview ? <>
            <svg ref={isOverview?svgRef:undefined} className={`atlas-complete-network ${showLabels?'show-all-labels':''}`} tabIndex="0" onKeyDown={keyGraph} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} viewBox={compact?"140 -155 960 760":"-30 -135 1300 720"} role="group" aria-label={`李承三与${overviewNodes.length}条${category==='all'?'':'筛选后'}关系，圆形节点和连线，Tab选择节点查看史料`}>
              <SurveyPlate/>
              <g className="atlas-arrival"><g className="atlas-camera" transform={`translate(${view.x} ${view.y}) translate(620 205) scale(${view.scale}) translate(-620 -205)`}>
              <OrbitLightDefs uid={uid}/><defs><clipPath id={`${uid}-all-portrait`}><circle cx="620" cy="205" r={HIERARCHY.overview.center.radius}/></clipPath>{overviewNodes.map((n,i)=>{const[x,y]=radialSlot(i,compact,overviewNodes);return <clipPath key={n.id} id={`${uid}-all-${n.id}`}><circle cx={x} cy={y} r={nodeGeometry(n).radius}/></clipPath>;})}</defs>
              <OrbitTheatre uid={uid} compact={compact} twoTiers={twoTiers}/>
              {overviewNodes.map((n,i)=>{const[x,y]=radialSlot(i,compact,overviewNodes);const caption=edgeLabels[i];return <g key={'edge-'+n.id} className={`atlas-radial-link ${active===n.id?'is-active':''} ${active&&active!==n.id?'is-muted':''}`}><path className="atlas-complete-edge" d={`M620 205 L${x} ${y}`}/><text className="atlas-radial-relation" dominantBaseline="central" x={caption.x} y={caption.y} aria-hidden="true" textAnchor="middle">{n.relation}</text></g>;})}
              <g className="atlas-core-portrait atlas-orbit-star" data-node-tier="1" transform={portraitTransform(620,205,centerPortraitScale(selected?.id))}>
              <circle cx="620" cy="205" r="96" fill={`url(#${uid}-star-corona)`}/><circle className="atlas-star-limb" cx="620" cy="205" r="54"/>
              <circle cx="620" cy="205" r={HIERARCHY.overview.center.aura} className="atlas-core-aura"/><circle cx="620" cy="205" r={HIERARCHY.overview.center.halo} className="atlas-core-ring"/><circle cx="620" cy="205" r={HIERARCHY.overview.center.radius+1} fill="#172657"/>
              {portrait?.path&&<image href={portrait.path} x={620-HIERARCHY.overview.center.radius} y={205-HIERARCHY.overview.center.radius} width={HIERARCHY.overview.center.radius*2} height={HIERARCHY.overview.center.radius*2} clipPath={`url(#${uid}-all-portrait)`} preserveAspectRatio="xMidYMin slice"/>}
              </g>
              <text className="atlas-core-name" x="620" y={overviewCoreNameY(centerPortraitScale(selected?.id))} textAnchor="middle">李承三</text>
              {overviewNodes.map((n,i)=>({n,i})).sort((a,b)=>Number(a.n.id===selected?.id)-Number(b.n.id===selected?.id)).map(({n,i})=>{const [x,y]=radialSlot(i,compact,overviewNodes);const media=n.media||data?.media?.[n.id];const geometry=nodeGeometry(n),depth=nodeDepthScale(n,i,compact,overviewNodes),label=overviewNameLayout(n,i,compact,selected?.id===n.id,overviewNodes);return <g key={n.id} data-node="true" data-relation-id={n.id} data-node-tier={nodeTier(n)} data-depth-scale={depth.toFixed(4)} data-orbit-side={y<205?'far':'near'} role="button" tabIndex="0" aria-label={`${n.name}，${n.relation}，查看史料`} aria-pressed={selected?.id===n.id} className={`atlas-node atlas-complete-node ${active===n.id?'is-active':''} ${active&&active!==n.id?'is-muted':''} ${selected&&selected.id!==n.id?'is-defocused':''}`} onClick={e=>choose(n,e)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();choose(n,e);}}} onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>{setHovered(n.id);if(compact){focusRelation(n);onNavigateWithin?.();}}} onBlur={()=>setHovered(null)}>
                <circle className="atlas-node-hit" cx={x} cy={y} r="32" fill="transparent" pointerEvents="all"/>
                <g className="atlas-node-portrait" transform={portraitTransform(x,y,nodeFocusScale(selected?.id,n,i,compact,overviewNodes))}>
                <g className="atlas-node-depth" transform={portraitTransform(x,y,depth)}>
                <ellipse className="atlas-planet-shadow" cx={x+3} cy={y+geometry.radius*.8} rx={geometry.radius*1.45} ry={geometry.radius*.48} fill={`url(#${uid}-planet-shadow)`}/>
                <circle className="atlas-node-halo" cx={x} cy={y} r={geometry.halo}/><circle className="atlas-node-disc" cx={x} cy={y} r={geometry.radius+1}/>
                {media?.path?<image href={media.path} x={x-geometry.radius} y={y-geometry.radius} width={geometry.radius*2} height={geometry.radius*2} preserveAspectRatio={media.fit||'xMidYMin slice'} clipPath={`url(#${uid}-all-${n.id})`}/>:<text className="atlas-node-symbol" x={x} y={y+8} textAnchor="middle">{CATEGORY_MARKS[n.category]}</text>}
                <circle className="atlas-planet-light" cx={x} cy={y} r={geometry.radius} fill={`url(#${uid}-sphere-light)`}/><path className="atlas-planet-limb" d={`M${x-geometry.radius*.76} ${y-geometry.radius*.64} A${geometry.radius} ${geometry.radius} 0 0 1 ${x+geometry.radius*.58} ${y-geometry.radius*.82}`}/>
                </g></g>
                {label.lines.map((line,j)=><text key={j} className="atlas-complete-name" x={label.x} y={label.y+j*20} textAnchor={label.anchor}>{line}</text>)}
                <title>{`${n.name} · ${n.relation}`}</title>
              </g>;})}
              </g></g>
              {compact&&!list&&(()=>{const index=overviewNodes.findIndex(n=>n.id===selected.id);if(index<0)return null;const[x,y]=radialSlot(index,true,overviewNodes);const px=620+(x-620)*view.scale+view.x,py=205+(y-205)*view.scale+view.y,focusNode=overviewNodes[index],radius=(nodeGeometry(focusNode).halo*nodeDepthScale(focusNode,index,true,overviewNodes)*nodeFocusScale(selected.id,focusNode,index,true,overviewNodes)+3)*view.scale;return <g key={selected.id} className="atlas-folio-thread" aria-hidden="true" pointerEvents="none"><circle cx={px} cy={py} r={radius}/></g>;})()}
            </svg>
            <div className="atlas-complete-list" aria-label="全部学术关系列表">{overviewNodes.map(n=><button key={n.id} aria-pressed={selected?.id===n.id} onClick={e=>choose(n,e)}><span><strong>{n.name}</strong><small>{n.relation} · {n.date}</small></span><i aria-hidden="true">↗</i></button>)}</div>

          </> : <>
          <svg ref={svgRef} className="atlas-network" viewBox="0 15 960 505" role="group" aria-label="以李承三为中心的关系图。拖动平移，方向键平移，Tab键选择关系节点。" tabIndex="0" onKeyDown={keyGraph} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
            <defs>
              <radialGradient id={`${uid}-glow`}><stop offset="0" stopColor="#7598f0" stopOpacity=".12"/><stop offset="1" stopColor="#7598f0" stopOpacity="0"/></radialGradient>
              <clipPath id={`${uid}-portrait`}><circle cx="480" cy="250" r="64"/></clipPath>
              {shown.map((n,i)=><clipPath key={n.id} id={`${uid}-${n.id}`}><circle cx={SLOTS[i][0]} cy={SLOTS[i][1]} r={nodeGeometry(n,false).radius}/></clipPath>)}
            </defs>
            <g className="atlas-camera" transform={`translate(${view.x} ${view.y}) translate(480 260) scale(${view.scale}) translate(-480 -260)`}>
              <circle cx="480" cy="260" r="360" fill={`url(#${uid}-glow)`}/>
              <path className="atlas-crosshair" d="M480 18V525 M22 260H938"/>
              {shown.map((n,i)=>{const[x,y]=SLOTS[i]; const lit=active===n.id;return <g key={`edge-${n.id}`} className={`atlas-edge ${lit?'is-active':''} ${active&&!lit?'is-muted':''}`}><path d={`M480 260 Q${(480+x)/2 + (y>260?24:-24)} ${(260+y)/2} ${x} ${y}`}/><text x={i===0?(n.name.length>10?565:425):i===1?630:i===7?330:i===4?620:480+(x-480)*.61} y={i===0?170:(i===1||i===7)?220:i===4?390:260+(y-260)*.61-9} textAnchor="middle">{n.relation}</text></g>;})}
              <g className="atlas-core-portrait" data-node-tier="1" transform={portraitTransform(480,250,centerPortraitScale(selected?.id))}>
              <circle className="atlas-core-ring" cx="480" cy="250" r="76"/>
              <circle cx="480" cy="250" r="65" fill="#172657"/>
              {portrait?.path&&<image href={portrait.path} x="416" y="186" width="128" height="128" preserveAspectRatio="xMidYMin slice" clipPath={`url(#${uid}-portrait)`}/>}
              </g>
              <rect x="416" y={304+(selected?14:0)} width="128" height="70" rx="2" fill="#111b42"/>
              <text className="atlas-core-name" x="480" y={333+(selected?14:0)} textAnchor="middle">李承三</text><text className="atlas-core-date" x="480" y={359+(selected?14:0)} textAnchor="middle">1899 — 1967</text>
              {shown.map((n,i)=>({n,i})).sort((a,b)=>Number(a.n.id===selected?.id)-Number(b.n.id===selected?.id)).map(({n,i})=>{const[x,y]=SLOTS[i];const media=n.media||data?.media?.[n.id],geometry=nodeGeometry(n,false); const lines=n.name.length>10?(n.lines||[n.name.slice(0,8),n.name.slice(8)]):[n.name];return <g key={n.id} data-node="true" data-relation-id={n.id} data-node-tier={nodeTier(n)} role="button" tabIndex="0" aria-label={`${n.name}，${n.relation}，查看史料`} aria-pressed={selected?.id===n.id} className={`atlas-node ${active===n.id?'is-active':''} ${active&&active!==n.id?'is-muted':''} ${selected&&selected.id!==n.id?'is-defocused':''}`} onClick={e=>choose(n,e)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();choose(n,e);}}} onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>{setHovered(n.id);if(compact){focusRelation(n);onNavigateWithin?.();}}} onBlur={()=>setHovered(null)}>
                <circle className="atlas-node-hit" cx={x} cy={y} r="64" fill="transparent" pointerEvents="all"/>
                <g className="atlas-node-portrait" transform={portraitTransform(x,y,nodeFocusScale(selected?.id,n,i,false,shown,false))}>
                <circle className="atlas-node-halo" cx={x} cy={y} r={geometry.halo}/><circle className="atlas-node-disc" cx={x} cy={y} r={geometry.radius+1}/>
                {media?.path?<image href={media.path} x={x-geometry.radius} y={y-geometry.radius} width={geometry.radius*2} height={geometry.radius*2} preserveAspectRatio={media.fit||'xMidYMin slice'} clipPath={`url(#${uid}-${n.id})`}/>:<text className="atlas-node-symbol" x={x} y={y+8} textAnchor="middle">{CATEGORY_MARKS[n.category]||'录'}</text>}
                </g>
                {lines.map((line,j)=><text key={j} className="atlas-node-name" x={x} y={y+geometry.halo*nodeFocusScale(selected?.id,n,i,false,shown,false)+17+j*25} textAnchor="middle">{line}</text>)}
              </g>;})}
            </g>
          </svg>
          <div className="atlas-list" aria-label="关系节点列表">{shown.map(n=><button key={n.id} onClick={e=>choose(n,e)} className={selected?.id===n.id?'is-active':''}><span className="atlas-list-mark">{CATEGORY_MARKS[n.category]}</span><span><strong>{n.name}</strong><small>{n.relation} · {n.subtitle}</small></span><span aria-hidden="true">↗</span></button>)}</div>
          <div className="atlas-map-controls"><span>拖动探索 · 选择节点读史料</span></div>
          </>}
          {!shown.length&&<div className="atlas-empty">未找到相关记录。<button onClick={()=>{setSearch('');changeCategory('all');}}>重置筛选</button></div>}
        </div>
        {isOverview ? <span aria-live="polite" style={{position:'absolute',width:1,height:1,padding:0,margin:-1,overflow:'hidden',clipPath:'inset(50%)',whiteSpace:'nowrap',border:0}}>{search.trim()?`找到 ${filtered.length} 条关系`:compact&&focusedRelation?`共 ${filtered.length} 条关系 · 正在聚焦当前联系`:`${category==='all'?'全部':'当前分类'} ${filtered.length} 条关系 · 已完整展开`}</span> : <div className="atlas-map-bottom"><span aria-live="polite">{filtered.length?`${Math.min(page,pages-1)*8+1} — ${Math.min((page+1)*8,filtered.length)}`:'0'} / {filtered.length} 条关系</span><div><button disabled={page===0} aria-label="上一组关系" onClick={()=>{setPage(p=>p-1);setSelected(null);setHovered(null);reset();requestAnimationFrame(()=>onNavigateWithin?.());}}>←</button><span>{page+1} / {pages}</span><button disabled={page>=pages-1} aria-label="下一组关系" onClick={()=>{setPage(p=>p+1);setSelected(null);setHovered(null);reset();requestAnimationFrame(()=>onNavigateWithin?.());}}>→</button></div></div>}
      </div>
      <EvidencePanel aria-modal={selected&&!desktop?true:undefined} className={`atlas-evidence ${selected?'has-selection':''}`} hidden={isOverview&&!selected} ref={detailRef} tabIndex="-1" data-scroll-lock aria-label={selected?`${selected.name}的关系史料`:'关系史料'} onWheel={e=>e.stopPropagation()} onKeyDown={trapEvidenceFocus} onCancel={e=>{e.preventDefault();closeDetail();}} onClick={e=>{if(isOverview&&e.target===e.currentTarget){const rect=e.currentTarget.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDetail();}}}>
        <div className="atlas-evidence-eyebrow"><span>关系档案 / EVIDENCE</span>{selected&&<button aria-label="关闭关系详情" onClick={closeDetail}>×</button>}</div>
        {selected?<>
          <p className="atlas-folio-note">图谱仍在左侧 · 可继续选择其他关系</p>
          <div className="atlas-sheet-index" aria-hidden="true"><span>关系索引</span>{String(nodes.findIndex(n=>n.id===selected.id)+1).padStart(2,'0')}</div>
          {selected.status&&<p className="atlas-source-status">{selected.status}</p>}
          <span className="atlas-relation">{selected.relation}</span><h3>{selected.name}</h3><p className="atlas-subtitle">{selected.subtitle}</p><p className="atlas-date">{selected.date}</p>
          <h4>关系记述</h4><p className="atlas-prose">{selected.evidence}</p>
          {selected.context&&<details className="atlas-context"><summary>延伸阅读</summary><p className="atlas-prose">{selected.context}</p></details>}
          {groupedSources.length>0&&<div className="atlas-citations"><h4>文字依据</h4><ol>{groupedSources.map(ref=><li key={ref.source}>{sourceLink(ref)}</li>)}</ol></div>}
          {(selected.media||data?.media?.[selected.id])&&(()=>{const media=selected.media||data.media[selected.id];return <figure className="atlas-document"><button className="atlas-document-image" onClick={()=>onOpenImage?.(media)} disabled={!onOpenImage} aria-label={`查看图片与出处：${media.caption||selected.name}`}><img src={media.path} alt={media.alt||selected.name} loading="lazy"/>{onOpenImage&&<span>查看原图 ↗</span>}</button><figcaption>{media.caption}<p>{media.credit}</p><p>{media.rightsNote}</p>{media.verificationNote&&<p>{media.verificationNote}</p>}{media.sourceUrl&&<a href={media.sourceUrl} target="_blank" rel="noreferrer">图像来源：{media.sourceTitle||'原始页面'} ↗</a>}{media.licenseUrl&&<a href={media.licenseUrl} target="_blank" rel="noreferrer">许可：{media.license||'查看许可'} ↗</a>}</figcaption></figure>;})()}
        </>:<div className="atlas-invitation"><span className="atlas-invitation-index">以人为轴，以史为据</span><h3>一段关系，<br/>一条学脉。</h3><div className="atlas-guides">{[['stille','他向谁求学？'],['guo-lingzhi','谁与他共同考察？'],['xu-kaili','学问怎样传向后来？']].map(([id,label],i)=><button key={id} onClick={e=>chooseGuide(id,e)}><span>0{i+1}</span>{label}<i aria-hidden="true">→</i></button>)}</div><div className="atlas-reading-note"><span>阅读说明</span><p>节点大小用于内容分层，不表示亲疏或影响。文字依据与图像出处分别标注。</p></div>{graph.sources?.[graph.primarySource]&&<div className="atlas-primary-source">{sourceLink({source:graph.primarySource})}</div>}</div>}
      </EvidencePanel>
    </div>
  </div>;
}

export default React.memo(RelationshipAtlas);

