import React, { useId, useState } from 'react';
import './EvidenceTrail.css';

const STEPS = [
  { name: '原图', prompt: '这张图，属于怎样的一次考察？', next: '走近考察与同行者' },
  { name: '考察关系', prompt: '从一次考察，找到成果的书目。', next: '查阅成果书目' },
  { name: '成果书目', prompt: '图像与文字，分别依据什么？', next: '核对资料出处' },
  { name: '出处', prompt: '回到出处，也保留尚待核实之处。', next: '完成这条线索' },
];

/** Optional, controlled reading path. onStep owns navigation and target focus. */
export default function EvidenceTrail({ step = null, onStep, onClose, media }) {
  const id = useId();
  const [mobileExpanded, setMobileExpanded] = useState(false);
  if (!Number.isInteger(step) || step < 0 || step >= STEPS.length) return null;
  const current = STEPS[step];
  const finish = () => { setMobileExpanded(false); onClose?.(); };
  const advance = () => {
    setMobileExpanded(false);
    if (step === STEPS.length - 1) finish();
    else onStep?.(step + 1);
  };

  return (
    <aside className={`evidence-trail${mobileExpanded ? ' evidence-trail-expanded' : ''}`}
      aria-label="第24号图的阅读线索" data-scroll-lock>
      <div className="evidence-trail-stem" aria-hidden="true" />
      <div className="evidence-trail-top">
        <button className="evidence-trail-image" type="button"
          aria-label="返回第24号图的原图章节" onClick={() => { setMobileExpanded(false); onStep?.(0); }}>
          {media?.path ? <img src={media.path} alt="" /> : <span>24</span>}
        </button>
        <div className="evidence-trail-identification">
          <span className="evidence-trail-label">正在跟随</span>
          <strong>第24号图</strong>
        </div>
        <button className="evidence-trail-expand" type="button"
          aria-expanded={mobileExpanded} aria-controls={`${id}-body`}
          aria-label={mobileExpanded ? '收起阅读线索' : '展开阅读线索'}
          onClick={() => setMobileExpanded(value => !value)}>{mobileExpanded ? '−' : '＋'}</button>
        <button className="evidence-trail-close" type="button" onClick={finish}
          aria-label="结束第24号图的阅读线索，继续阅读">×</button>
      </div>
      <div className="evidence-trail-body" id={`${id}-body`}>
        <div className="evidence-trail-status" role="status" aria-live="polite" aria-atomic="true">
          <span className="evidence-trail-position"><span>{String(step + 1).padStart(2, '0')} / 04</span>{current.name}</span>
          <p>{current.prompt}</p>
        </div>
        <button className="evidence-trail-next" type="button" onClick={advance}>
          <span>{current.next}</span><svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d={step===3?'M2 8l4 4L14 3':'M3 13 13 3M4 3h9v9'} stroke="currentColor" strokeWidth="1.3"/></svg>
        </button>
      </div>
    </aside>
  );
}
