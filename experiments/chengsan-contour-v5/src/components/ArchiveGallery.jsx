import React, { useId, useRef, useState } from 'react';
import './ArchiveGallery.css';

const number = value => String(value).padStart(2, '0');

/** A finite, keyboard-operable image index. Images and descriptions are source data. */
export default function ArchiveGallery({ media, onOpenImage }) {
  const items = Object.entries(media);
  const [selected, setSelected] = useState(() => Math.max(0, items.findIndex(([key]) => key === 'jialing')));
  const buttons = useRef([]);
  const id = useId();
  if (!items.length) return <p className="archive-room-note">暂无影像文献。</p>;
  const current = Math.min(selected, items.length - 1);
  const [key, item] = items[current];
  const title = item.caption || item.alt;
  const choose = (index, focus = false) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    setSelected(next);
    if (focus) {
      const button = buttons.current[next];
      button?.focus({ preventScroll: true });
      // Only move the index rail, never the page or the parent exhibition.
      const rail = button?.parentElement?.parentElement;
      if (rail && button) {
        const r = rail.getBoundingClientRect(), b = button.getBoundingClientRect();
        if (b.top < r.top) rail.scrollTop -= r.top - b.top + 8;
        else if (b.bottom > r.bottom) rail.scrollTop += b.bottom - r.bottom + 8;
      }
    }
  };
  const navigateIndex = (event, index) => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = index + 1;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = index - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next !== undefined) { event.preventDefault(); event.stopPropagation(); choose(next, true); }
  };
  return <div className="archive-gallery">
    <header className="archive-gallery-heading">
      <div><p className="archive-gallery-eyebrow">IMAGE INDEX / 影像文献</p><h3>留在纸上的，<br /><span>不止山川。</span></h3></div>
      <p>逐件翻阅 {number(items.length)} 项影像文献。<br />保留原图、原有标记与来源说明。</p>
    </header>
    <div className="archive-gallery-layout">
      <nav className="archive-gallery-index" aria-label="影像文献索引">
        <div className="archive-gallery-index-heading"><span>目录 / INDEX</span><span>{number(items.length)} 项</span></div>
        <ol className="archive-gallery-index-list" data-scroll-lock="true">{items.map(([itemKey, entry], index) => <li key={itemKey}><button
          ref={node => { buttons.current[index] = node; }}
          type="button" aria-current={current === index ? 'true' : undefined}
          aria-controls={`${id}-exhibit`} title={entry.alt}
          tabIndex={current === index ? 0 : -1}
          onClick={() => choose(index)} onKeyDown={event => navigateIndex(event, index)}
        ><span className="archive-gallery-index-number">{number(index + 1)}</span><span>{entry.caption || entry.alt}</span><svg className="archive-gallery-index-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" stroke="currentColor"/></svg></button></li>)}</ol>
        <p className="archive-gallery-index-help">滚动目录 · 使用方向键逐件切换</p>
      </nav>
      <div className="archive-gallery-exhibit" id={`${id}-exhibit`}>
        <div className="archive-gallery-exhibit-bar"><span>展阅 / ON VIEW</span><span role="status" aria-live="polite">{number(current + 1)} / {number(items.length)}</span></div>
        <div className="archive-gallery-stage">
          {[2, 1].map(offset => {
            const adjacent = items[(current + offset) % items.length][1];
            return <div key={offset} className={`archive-gallery-leaf archive-gallery-leaf-${offset}`} aria-hidden="true"><img src={adjacent.path} alt="" loading="lazy" /></div>;
          })}
          <figure className="archive-gallery-object" key={key}>
            <button type="button" className="archive-gallery-image-open" onClick={() => onOpenImage?.(item)} aria-label={`查看完整图像：${title}`}>
              <img src={item.path} alt={item.alt || title} decoding="async" />
              <span className="archive-gallery-open-label">查看完整图像 <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9" stroke="currentColor"/></svg></span>
            </button>
            <figcaption><span className="archive-gallery-object-number" aria-hidden="true">{number(current + 1)}</span><h4>{title}</h4></figcaption>
          </figure>
        </div>
        <div className="archive-gallery-controls"><span>图像保持原貌；放大不增加原图细节。</span><div><button type="button" disabled={current === 0} onClick={() => choose(current - 1)} aria-label="上一件影像">←</button><button type="button" disabled={current === items.length - 1} onClick={() => choose(current + 1)} aria-label="下一件影像">→</button></div></div>
        <section className="archive-gallery-provenance" aria-label="当前影像的来源与权利说明">
          <div className="archive-gallery-provenance-heading"><span>来源与权利 / SOURCE RECORD</span>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">原始出处 ↗</a>}</div>
          <dl>
            {item.sourceTitle && <div><dt>来源</dt><dd>{item.sourceTitle}</dd></div>}
            {item.credit && <div><dt>署名</dt><dd>{item.credit}</dd></div>}
            {(item.rightsNote || item.license) && <div><dt>权利</dt><dd>{item.rightsNote || item.license}{item.licenseUrl && <a className="archive-gallery-license" href={item.licenseUrl} target="_blank" rel="noopener noreferrer">{item.license || '查看许可'} ↗</a>}</dd></div>}
            {item.verificationNote && <div><dt>核对</dt><dd>{item.verificationNote}</dd></div>}
          </dl>
          <p>公开展示不等于开放授权。</p>
        </section>
      </div>
    </div>
  </div>;
}
