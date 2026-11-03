import React, { useEffect, useId, useMemo, useState } from 'react';
import './ArchiveRoom.css';

const ERAS = [['all', '完整年谱', '1899—2002'], ['early', '求学与归国', '1899—1936'], ['field', '考察与研究', '1938—1948'], ['teaching', '教育与学科', '1949—1959'], ['legacy', '晚年与纪念', '1960—2002']];
const inEra = (year, era) => era === 'all' || (era === 'early' && +year <= 1936) || (era === 'field' && +year > 1936 && +year < 1949) || (era === 'teaching' && +year >= 1949 && +year < 1960) || (era === 'legacy' && +year >= 1960);

const BOOKMARK_KEY = 'chengsan-deepbook-bookmarked';
const VIEW_KEYS = ['biography', 'timeline', 'places', 'works', 'images', 'reports'];
function readArchiveState(data) {
  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  const params = new URLSearchParams(hash.split('?')[0] === '#archive' && hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '');
  const view = params.get('view');
  const rawPlace = Number(params.get('placeIndex') || 0);
  const type = params.get('type');
  return {
    tab: VIEW_KEYS.includes(view) ? view : 'biography',
    era: ERAS.some(([key]) => key === params.get('era')) ? params.get('era') : 'all',
    placeIndex: Number.isInteger(rawPlace) ? Math.max(0, Math.min(data.places.length - 1, rawPlace)) : 0,
    query: params.get('q') || '',
    type: data.works.some(work => work.category === type) ? type : 'all',
    sort: params.get('sort') === 'newest' ? 'newest' : 'oldest',
  };
}

function References({ item, sources }) {
  const refs = item.sources || (item.source ? [{source: item.source, page: item.page}] : []);
  const grouped = new Map();
  refs.forEach(ref => {
    if (!grouped.has(ref.source)) grouped.set(ref.source, []);
    if (ref.page && !grouped.get(ref.source).includes(ref.page)) grouped.get(ref.source).push(ref.page);
  });
  return <div className="archive-room-references">{[...grouped].map(([key, pages]) => {
    const source = sources[key];
    if (!source) return null;
    const label = source.title + (pages.length ? ` · 第${pages.join('、')}页` : '');
    const href = source.url + (pages.length && /\.pdf(?:$|\?)/i.test(source.url) ? `#page=${pages[0]}` : '');
    return <div key={key}>{(source.local || !source.url) ? <span>{label}（未公开原件）</span> : <a href={href} target="_blank" rel="noopener noreferrer">{label} ↗</a>}</div>;
  })}</div>;
}

export default function ArchiveRoom({ data, onOpenImage, onOpenRelation, active = true }) {
  const [initial] = useState(() => readArchiveState(data));
  const [tab, setTab] = useState(initial.tab);
  const [era, setEra] = useState(initial.era);
  const [placeIndex, setPlaceIndex] = useState(initial.placeIndex);
  const [query, setQuery] = useState(initial.query);
  const [type, setType] = useState(initial.type);
  const [sort, setSort] = useState(initial.sort);
  const [status, setStatus] = useState('');
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return window.localStorage.getItem(BOOKMARK_KEY) === 'true'; } catch { return false; }
  });
  useEffect(() => {
    const restore = () => {
      if (window.location.hash.split('?')[0] !== '#archive') return;
      const state = readArchiveState(data);
      setTab(state.tab); setEra(state.era); setPlaceIndex(state.placeIndex);
      setQuery(state.query); setType(state.type); setSort(state.sort);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [data]);
  useEffect(() => {
    if (window.location.hash.split('?')[0] !== '#archive') return;
    const params = new URLSearchParams({ view: tab });
    if (query) params.set('q', query);
    if (type !== 'all') params.set('type', type);
    if (sort !== 'oldest') params.set('sort', sort);
    if (era !== 'all') params.set('era', era);
    if (placeIndex) params.set('placeIndex', String(placeIndex));
    const next = '#archive?' + params.toString();
    if (window.location.hash !== next) window.history.replaceState(window.history.state, '', next);
  }, [active, tab, query, type, sort, era, placeIndex]);
  const toggleBookmark = () => {
    if (typeof window === 'undefined') return;
    try {
      const next = !bookmarked;
      window.localStorage.setItem(BOOKMARK_KEY, String(next));
      setBookmarked(next);
      setStatus(next ? '已收藏到此浏览器。' : '已取消此浏览器中的收藏。');
    } catch { setStatus('浏览器未允许本地存储，未能保存收藏。'); }
  };
  const downloadData = () => {
    if (typeof window === 'undefined') return;
    let url;
    let link;
    try {
      url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }));
      link = document.createElement('a');
      link.href = url;
      link.download = 'li-chengsan-archive.json';
      document.body.appendChild(link);
      link.click();
      setStatus('已发起档案 JSON 下载，请查看浏览器下载列表。');
    } catch { setStatus('未能创建下载文件，请稍后重试。'); }
    finally {
      link?.remove();
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };
  const id = useId();
  const sources = data.graph.sources;
  const timeline = data.graph.milestones || data.graph.timeline || [];
  const media = Object.values(data.media);
  const tabs = [['biography', '人物生平', '04'], ['timeline', '生平年谱', String(timeline.length)], ['places', '山川足迹', String(data.places.length)], ['works', '学术著述', String(data.works.length)], ['images', '影像文献', String(media.length)], ['reports', '纪念与报道', String(data.reports.length).padStart(2, '0')]];
  const works = useMemo(() => data.works.filter(work => (type === 'all' || work.category === type) && [work.title, work.year, work.note, work.category].join(' ').toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === 'oldest' ? parseInt(a.year) - parseInt(b.year) : parseInt(b.year) - parseInt(a.year)), [data.works, type, query, sort]);
  const place = data.places[placeIndex];
  const references = item => <References item={item} sources={sources} />;
  return <section className="archive-room" aria-labelledby={`${id}-title`}>
    <header className="archive-room-heading">
      <div><p className="archive-room-kicker">THE READING ROOM / 文献阅览</p><h2 id={`${id}-title`}>循着文字，走近一生。</h2></div>
      <p>把一段生平，放回它的时间、地点与文献中。<br />从这里继续阅读，或回到关系图谱。</p>
    </header>

    <div className="archive-room-tabs" role="tablist" aria-label="档案栏目" data-scroll-lock="true">{tabs.map(([key, label, count], index) => <button key={key} id={`${id}-tab-${key}`} role="tab" aria-selected={tab === key} aria-controls={`${id}-panel-${key}`} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={event => {
      let next;
      if(event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if(event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if(event.key === 'Home') next = 0;
      else if(event.key === 'End') next = tabs.length - 1;
      if(next !== undefined) { event.preventDefault(); setTab(tabs[next][0]); const target=document.getElementById(`${id}-tab-${tabs[next][0]}`);target?.focus({preventScroll: true});if(target){const rail=target.parentElement,r=rail.getBoundingClientRect(),t=target.getBoundingClientRect();if(t.right>r.right)rail.scrollLeft+=t.right-r.right+12;else if(t.left<r.left)rail.scrollLeft-=r.left-t.left+12;} }
    }}>{label}<span>{count}</span></button>)}</div>
    <div className="archive-room-panel" role="tabpanel" id={`${id}-panel-${tab}`} aria-labelledby={`${id}-tab-${tab}`} tabIndex={0}>
      {tab === 'biography' && <div className="archive-room-biography"><aside><span className="archive-room-kicker">BIOGRAPHICAL NOTES</span><h3>李承三</h3><p className="archive-room-dates">1899—1967</p><dl>{[['号', '继五'], ['籍贯', '河北涉县郭口村'], ['研究领域', '地质学 · 地貌学'], ['求学', '河南大学、柏林大学'], ['主要职务', '成都地质勘探学院教务长、教授；曾任重庆大学地质系主任']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></aside><div>{data.extendedBiography.map((chapter, index) => <article className="archive-room-chapter" key={chapter.title}><span className="archive-room-number">{String(index + 1).padStart(2, '0')}</span><h3>{chapter.title}</h3><p>{chapter.text}</p>{references(chapter)}</article>)}</div></div>}
      {tab === 'timeline' && <div className="archive-room-timeline"><div className="archive-room-eras" role="group" aria-label="筛选人生阶段">{ERAS.map(([key, label, years]) => <button key={key} onClick={() => setEra(key)} aria-pressed={era === key}><span>{label}</span><small>{years}</small></button>)}</div><div className="archive-room-events">{timeline.filter(event => inEra(event.year, era)).map(event => <article key={event.year}><time>{event.year}</time><div><h3>{event.title}</h3><p>{event.text}</p><details><summary>阅读档案详情 <span aria-hidden="true">＋</span></summary><div className="archive-room-event-detail"><p>{event.detail}</p>{references(event)}{event.nodeId && <button className="archive-room-text-button" onClick={() => onOpenRelation?.(event.nodeId)}>在图谱中查看这段关系 ↗</button>}</div></details></div></article>)}</div></div>}
      {tab === 'places' && <div className="archive-room-places"><article className="archive-room-place-feature"><p className="archive-room-kicker">FIELD NOTES / {String(placeIndex + 1).padStart(2,'0')} OF {data.places.length}</p><time>{place.year}</time><h3>{place.place}</h3><h4>{place.title}</h4><p>{place.text}</p>{references(place)}<div className="archive-room-place-controls"><button disabled={placeIndex === 0} onClick={() => setPlaceIndex(i => i - 1)} aria-label="上一个地点">←</button><span>{placeIndex + 1} / {data.places.length}</span><button disabled={placeIndex === data.places.length - 1} onClick={() => setPlaceIndex(i => i + 1)} aria-label="下一个地点">→</button></div><p className="archive-room-note">地点按年谱整理。这里是阅读序列，不是未经证实的旅行路线。</p></article><div className="archive-room-place-index" aria-label="地点索引">{data.places.map((item, index) => <button key={index} onClick={() => setPlaceIndex(index)} aria-current={index === placeIndex ? 'step' : undefined}><span>{String(index + 1).padStart(2,'0')}</span><time>{item.year}</time><strong>{item.place}</strong><span aria-hidden="true">↗</span></button>)}</div></div>}
      {tab === 'works' && <><div className="archive-room-toolbar"><label className="archive-room-search"><span>检索著述</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="输入题名、年份或内容…" /></label><label><span>内容类型</span><select value={type} onChange={event => setType(event.target.value)}><option value="all">全部类型</option>{[...new Set(data.works.map(work => work.category))].map(category => <option key={category}>{category}</option>)}</select></label><label><span>排序</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="oldest">年代从早到晚</option><option value="newest">年代从晚到早</option></select></label></div><p className="archive-room-results" role="status">找到 {works.length} 项 / 共 {data.works.length} 项著述</p><div className="archive-room-work-list">{works.map(work => <article key={work.title + work.year}><time>{work.year}</time><div><span className="archive-room-category">{work.category}</span><h3>{work.title}</h3><p>{work.note}</p>{references(work)}</div></article>)}</div>{!works.length && <div className="archive-room-empty"><h3>没有找到相关著述</h3><p>试试其他题名、年份，或清除类型筛选。</p><button className="archive-room-text-button" onClick={() => {setQuery(''); setType('all');}}>显示全部著述 ↗</button></div>}</>}
      {tab === 'images' && <><p className="archive-room-note">历史影像与文献图像，均保留来源说明。点击图片查看完整图像及权利信息；公开展示不等于开放授权。</p><div className="archive-room-gallery">{media.map((item, index) => <figure key={item.path}><button onClick={() => onOpenImage?.(item)} aria-label={`查看完整图像：${item.caption || item.alt}`}><div className="archive-room-image"><img src={item.path} alt={item.alt} loading="lazy" /><span aria-hidden="true">↗</span></div><figcaption><span className="archive-room-number">{String(index + 1).padStart(2,'0')}</span><h3>{item.caption || item.alt}</h3><p>{item.credit || item.sourceTitle}</p></figcaption></button></figure>)}</div></>}
      {tab === 'reports' && <><p className="archive-room-note">从校史档案与纪念文章继续阅读。以下公开链接沿用原人物档案，未在本轮逐条重新核验。</p><div className="archive-room-report-list">{data.reports.map((report, index) => <article key={report.title}><span className="archive-room-number">{String(index + 1).padStart(2,'0')}</span><div><p className="archive-room-category">{report.category}{report.year ? ` · ${report.year}` : ''}</p><h3>{report.title}</h3>{references(report)}</div><span aria-hidden="true">↗</span></article>)}</div></>}
    </div>
    <div className="archive-room-actions"><button type="button" aria-pressed={bookmarked} onClick={toggleBookmark}>{bookmarked ? '已收藏档案' : '收藏档案'} <span aria-hidden="true">{bookmarked ? '✓' : '＋'}</span></button><button type="button" onClick={downloadData}>下载档案 JSON <span aria-hidden="true">↓</span></button><span className="archive-room-action-status" role="status" aria-live="polite">{status || '收藏仅保存在此浏览器；下载包含资料及来源说明。'}</span></div>
    <footer className="archive-room-source-notes"><div><p className="archive-room-kicker">A NOTE ON SOURCES</p><h3>让依据与疑问，一同留下。</h3></div><div><p>{data.sourceNote}</p><details><summary>查看整理说明与来源目录 <span aria-hidden="true">＋</span></summary><p>{data.provenance?.verification}</p><ul>{data.provenance?.editorialChanges?.map(note => <li key={note}>{note}</li>)}</ul><div className="archive-room-source-directory">{Object.entries(sources).map(([key]) => <References key={key} item={{source:key}} sources={sources}/>)}</div><p className="archive-room-note">本次提供的年谱未公开原件；页码供核对材料使用。原档案公开链接未在本轮逐条重新核验。</p></details></div></footer>
  </section>;
}
