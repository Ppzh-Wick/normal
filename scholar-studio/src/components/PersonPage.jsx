import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { people, portrait } from '../data/people';
import { isPlainClick, personHref } from '../utils/personRoutes';
import './PersonPage.css';
import useSectionNavigation from '../hooks/useSectionNavigation';

gsap.registerPlugin(ScrollTrigger);

function usePersonMotion(rootRef, enabled, playOpening) {
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const root = rootRef.current;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      const opening = gsap.timeline({ defaults: { ease: 'power4.out' } });
      if (playOpening) opening.from(q('.person-name span'), { yPercent: 100, duration: 1.15 }, 0)
        .from(q('.person-portrait-frame'), { y: 24, scale: .97, opacity: 0, duration: 1.2 }, .08)
        .from(q('.person-hero-copy > p, .person-hero-copy > button'), { y: 24, opacity: 0, stagger: .07, duration: .9 }, .2)
        .from(q('.person-hero-foot'), { y: 24, opacity: 0, duration: 1 }, .4);
      const skipOpening = () => opening.progress(1);
      root.addEventListener('click', skipOpening, true);
      root.addEventListener('keydown', skipOpening, true);
      const reveals = [];
      q('[data-person-reveal]').forEach(section => {
        const targets = section.querySelectorAll('.person-reveal-item');
        const reveal = gsap.from(targets, {
          y: 44, opacity: 0, duration: 1.1, stagger: .1, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 88%', once: true, onLeave: self => self.animation?.progress(1) },
        });
        reveals.push({ section, reveal });
      });
      const showFocused = event => reveals.forEach(({ section, reveal }) => {
        if (section.contains(event.target)) reveal.progress(1);
      });
      root.addEventListener('focusin', showFocused);
      return () => {
        root.removeEventListener('click', skipOpening, true);
        root.removeEventListener('keydown', skipOpening, true);
        root.removeEventListener('focusin', showFocused);
      };
    }, root);
    return () => media.revert();
  }, [rootRef, enabled, playOpening]);
}

export default function PersonPage({ person, onBack, onOpenPerson, motionEnabled = true, playOpening = true }) {
  const rootRef = useRef(null);
  usePersonMotion(rootRef, Boolean(person) && motionEnabled, playOpening);
  const scrollToSection = useSectionNavigation(rootRef, motionEnabled);
  const jump = id => {
    scrollToSection(id);
  };
  if (!person) return <main className="person-page person-missing" ref={rootRef}>
    <p>学脉相承 · 人物档案</p><h1 tabIndex={-1}>这份档案暂未收录。</h1>
    <button className="person-primary" onClick={onBack}>返回人物墙</button>
  </main>;
  const index = people.findIndex(item => item.id === person.id);
  const next = people[(index + 1) % people.length];
  const number = String(index + 1).padStart(2, '0');

  return <div className="person-page" ref={rootRef}>
    <a className="person-skip" href="#person-main" onClick={event => { event.preventDefault(); document.getElementById('person-name')?.focus(); }}>跳到人物介绍</a>
    <header className="person-nav">
      <button className="person-back" onClick={onBack}><span aria-hidden="true">←</span> 返回人物墙</button>
      <span className="person-nav-name">{person.name}<span>人物专题</span></span>
      <nav aria-label="人物专题章节">
        <button onClick={() => jump('person-contributions')}>学术贡献</button>
        <button onClick={() => jump('person-life')}>生平足迹</button>
        <button onClick={() => jump('person-sources')}>史料</button>
      </nav>
    </header>

    <main id="person-main">
      <section className="person-hero person-container" aria-labelledby="person-name">
        <div className="person-hero-grid">
          <div className="person-hero-copy">
            <p className="person-eyebrow">成都理工大学 <span>／</span> <b>{person.groupTitle}</b></p>
            <h1 className="person-name" id="person-name" tabIndex={-1}><span>{person.name}</span></h1>
            <p className="person-roman">{person.roman}</p>
            <p className="person-tagline">{person.tagline}</p>
            <button className="person-primary" onClick={() => jump('person-contributions')}>走近他的学问 <span aria-hidden="true">↓</span></button>
          </div>
          <figure className="person-portrait">
            <div className="person-portrait-frame"><img src={portrait(person)} alt={`${person.name}的历史肖像`} width="260" height="340" fetchPriority="high" decoding="async" /></div>
            <figcaption><span>校史人物档案</span><span>{number} / 13</span></figcaption>
          </figure>
        </div>
        <div className="person-hero-foot"><p>{person.field}</p>{person.years && <p>{person.years}</p>}<span>一段人生，一脉相承。</span></div>
      </section>

      <section className="person-contributions" id="person-contributions" aria-labelledby="person-contributions-title">
        <div className="person-container">
          <div className="person-section-heading" data-person-reveal>
            <p className="person-eyebrow person-reveal-item">留下的学问</p>
            <h2 id="person-contributions-title" tabIndex={-1} className="person-reveal-item">探索的价值，<br />在此延续。</h2>
            <p className="person-introduction person-reveal-item">{person.summary}</p>
          </div>
          <div className="person-contribution-grid" data-person-reveal>
            {person.contributions.map((item, i) => <article className={`person-contribution person-reveal-item${i === 0 ? ' person-contribution-lead' : ''}`} key={item.title}>
              <span className="person-contribution-number">{String(i + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3><p>{item.text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="person-life person-container" id="person-life" aria-labelledby="person-life-title">
        <div className="person-section-heading" data-person-reveal>
          <p className="person-eyebrow person-reveal-item">生平足迹</p>
          <h2 id="person-life-title" tabIndex={-1} className="person-reveal-item">把一生，<br />写进求索。</h2>
        </div>
        <ol className="person-chronology">
          {person.timeline.map((item, i) => <li key={`${item.year}-${i}`} data-person-reveal>
            <span className="person-year person-reveal-item">{item.year}</span>
            <div className="person-reveal-item"><h3>{item.title}</h3><p>{item.text}</p></div>
          </li>)}
        </ol>
        <div className="person-biography" data-person-reveal><p className="person-eyebrow person-reveal-item">人物生平</p>
          <div className="person-reveal-item">{person.biography.split('\n').filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
        </div>
      </section>

      <section className="person-sources" id="person-sources" aria-labelledby="person-sources-title">
        <div className="person-container person-sources-inner">
          <div><p className="person-eyebrow">有据可循</p><h2 id="person-sources-title" tabIndex={-1}>回到史料。</h2></div>
          <ol>{person.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span aria-hidden="true">↗</span></a></li>)}</ol>
        </div>
      </section>

      <section className="person-next person-container" aria-label="继续阅读">
        <div><p className="person-eyebrow">下一位 · {next.groupTitle}</p>
          <a className="person-next-link" href={personHref(next.id)} onClick={event => { if (isPlainClick(event)) { event.preventDefault(); onOpenPerson(next.id); } }}><span>{next.name}</span><span aria-hidden="true">↗</span></a>
          <p>{next.field}</p>
        </div>
        <img src={portrait(next)} alt={`${next.name}的历史肖像`} width="108" height="142" loading="lazy" />
      </section>
    </main>
    <footer className="person-footer person-container"><span>学脉相承 · 成都理工大学校史人物专题</span><button onClick={onBack}>返回人物墙 ↑</button></footer>
  </div>;
}
