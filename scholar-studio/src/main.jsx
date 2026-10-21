import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { scholars } from './data/scholars';
import './styles.css';
import './hero.css';
import CircularCarousel from './components/CircularCarousel';
import DeferredBackground from './components/DeferredBackground';
import BorderGlow from './components/BorderGlow';
import './scholar-carousel.css';
import './grainient-theme.css';
import './border-glow-theme.css';
import './motion.css';
import usePortfolioMotion from './hooks/usePortfolioMotion';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

const borderGlow = {
  edgeSensitivity: 30,
  glowColor: '40 80 80',
  backgroundColor: '#120F17',
  borderRadius: 32,
  glowRadius: 44,
  glowIntensity: 1.3,
  coneSpread: 25,
  animated: false,
  colors: ['#c084fc', '#f472b6', '#38bdf8'],
  preserveSurface: true,
  fillOpacity: 0.12,
};

const carouselItems = scholars.map((scholar) => ({
  src: asset(`images/portraits/${scholar.id}.jpg`),
  title: scholar.name,
  subtitle: scholar.field,
  alt: `${scholar.name}的历史肖像`,
}));

const projects = [
  {
    number: '01',
    category: '矿产地质 / FIELD SURVEY',
    title: '攀枝花矿产调查',
    description: '常隆庆是攀枝花钒钛磁铁矿的发现者之一。西南地区长期的野外调查，成为后来认识矿产资源的重要基础。',
    image: 'images/projects/mineral-survey.svg',
    scholarId: 'chang-longqing',
    scholar: '常隆庆',
  },
  {
    number: '02',
    category: '区域地质 / MAPPING',
    title: '四川大地构造图',
    description: '李承三与常隆庆共同主持编制四川第一幅 1∶100 万大地构造图，以系统编图回应复杂的区域地质问题。',
    image: 'images/projects/tectonic-map.svg',
    scholarId: 'li-chengsan',
    scholar: '李承三 · 常隆庆',
  },
  {
    number: '03',
    category: '古生物学 / PALEONTOLOGY',
    title: '化石与地史研究',
    description: '李之常长期承担化石鉴定，并编写古生物学讲义教材，将地层中的生命证据带入研究和课堂。',
    image: 'images/projects/paleontology.svg',
    scholarId: 'li-zhichang',
    scholar: '李之常',
  },
];

const strengths = [
  {
    number: '01',
    title: '深入现场',
    english: 'FIELDWORK',
    text: '从河流地貌到西南矿藏，以实地踏勘建立对山川与地层的第一手认识。',
    evidence: '李承三 · 常隆庆 · 刘祖彝',
  },
  {
    number: '02',
    title: '建系立科',
    english: 'FOUNDATION',
    text: '参与建校与教研室建设，为早期地学教育和专业人才培养搭起基础框架。',
    evidence: '李唐泌 · 常隆庆 · 李之常',
  },
  {
    number: '03',
    title: '著述成章',
    english: 'KNOWLEDGE',
    text: '从《矿床学》到古生物学讲义，把长期研究积累整理成可传授的知识。',
    evidence: '李唐泌 · 李之常',
  },
  {
    number: '04',
    title: '以学育人',
    english: 'LEGACY',
    text: '把野外经验、学术方法和求实精神带进课堂，让一代人的探索成为后来者的起点。',
    evidence: '建校初期八大教授',
  },
];

function ArrowIcon({ diagonal = false }) {
  return diagonal ? (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 16 16 4M6 4h10v10" stroke="currentColor" strokeWidth="1.4"/></svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2 10h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4"/></svg>
  );
}

function SectionHeading({ number, eyebrow, title, id, description }) {
  return (
    <div className="section-heading">
      <span className="section-heading-rule" aria-hidden="true" />
      <div className="section-kicker"><span>{number}</span><i />{eyebrow}</div>
      <div className="section-heading-main">
        <h2 id={id} aria-label={title}>
          <span className="motion-title-mask" aria-hidden="true">
            {[...title].map((character, index) => <span className={`motion-char${character === '.' ? ' heading-period' : ''}`} key={index}>{character}</span>)}
          </span>
        </h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function App() {
  const siteRef = useRef(null);
  usePortfolioMotion(siteRef);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [grainientVisible, setGrainientVisible] = useState(true);
  const activeScholar = scholars[activeIndex];

  useEffect(() => {
    // One shared backdrop for the light sections; stop it when the scholar
    // section covers the viewport so only Lightfall needs to keep rendering.
    const visibility = new Map();
    const sections = document.querySelectorAll('#home, #projects, #strengths, .site-footer');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibility.set(entry.target, entry.isIntersecting && entry.intersectionRect.height > 0));
      setGrainientVisible([...visibility.values()].some(Boolean));
    }, { threshold: [0, 0.001] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hero = document.getElementById('home');
    if (!hero) return;
    let threshold = 0;
    let frame = 0;
    let previous = false;
    const update = () => {
      frame = 0;
      const next = window.scrollY >= threshold;
      if (next !== previous) { previous = next; setScrolled(next); }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      cancelAnimationFrame(frame);
      const anchorOffset = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-anchor-offset')
      );
      threshold = Math.max(1, hero.offsetTop + hero.offsetHeight - anchorOffset - 1);
      update();
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(hero);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const chooseScholar = (index, scroll = false) => {
    setAutoRotate(false);
    setActiveIndex(index);
    carouselRef.current?.focusIndex(index);
    if (scroll) document.getElementById('scholars')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openProjectScholar = (id) => {
    const index = scholars.findIndex((item) => item.id === id);
    if (index >= 0) chooseScholar(index, true);
  };

  return (
    <div className="site-shell grainient-theme" ref={siteRef}>
      <div className="site-ambient" aria-hidden="true" data-active={grainientVisible}>
        <DeferredBackground
          variant="grainient"
          colors={['#bac7ca', '#00afe2', '#2dd4bf', '#ccfbf1']}
          angle={20}
          flow={0.9}
          silk={0.35}
          grainAmount={0.08}
          dpr={1}
          paused={!grainientVisible}
        />
      </div>
      <a className="skip-link" href="#main">跳到正文</a>
      <BorderGlow {...borderGlow} as="header" disabled={!scrolled} borderRadius={scrolled ? 32 : 0} className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <span className="header-glass-layer" aria-hidden="true" />
        <div className="header-inner page-container">
          <a className="brand" href="#home" aria-label="返回首页" onClick={() => setMenuOpen(false)}>
            <span className="brand-text"><strong>学脉相承</strong><small>CDUT · SCHOLAR ARCHIVE</small></span>
          </a>
          <BorderGlow {...borderGlow} as="nav" disabled={!menuOpen} lightSurface={!scrolled} id="main-nav" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="主导航">
            <a href="#home" onClick={() => setMenuOpen(false)}>首页</a>
            <a href="#scholars" onClick={() => setMenuOpen(false)}>八大学者</a>
            <a href="#projects" onClick={() => setMenuOpen(false)}>精选项目</a>
            <a href="#strengths" onClick={() => setMenuOpen(false)}>学者优势</a>
          </BorderGlow>
          <div className="header-end"><span>始于 1956</span><BorderGlow {...borderGlow} lightSurface={!scrolled} as="a" href="#scholars">人物档案</BorderGlow></div>
          <BorderGlow {...borderGlow} lightSurface={!scrolled} as="button" className="menu-toggle" type="button" aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? '关闭' : '菜单'}</BorderGlow>
        </div>
      </BorderGlow>

      <main id="main">
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-opening" aria-hidden="true">
            <span className="opening-panel opening-panel--top" />
            <span className="opening-panel opening-panel--bottom" />
            <span className="opening-rule" />
            <span className="opening-signature"><span>学脉相承</span></span>
          </div>
          <div className="hero-content page-container">
            <figure className="hero-visual">
              <div className="hero-image-parallax"><div className="hero-image-reveal">
              <img
                className="hero-glacier"
                src={asset('images/hero-glacier-1600.webp')}
                srcSet={`${asset('images/hero-glacier-800.webp')} 800w, ${asset('images/hero-glacier-1600.webp')} 1600w, ${asset('images/hero-glacier-1920.webp')} 1920w, ${asset('images/hero-glacier-2560.webp')} 2560w`}
                sizes="(max-width: 600px) 100vw, (max-width: 1800px) calc(100vw - 72px), 1700px"
                alt="冰岛杰古沙龙冰河湖的浮冰与远处冰川"
                width="2560"
                height="1707"
                fetchPriority="high"
                decoding="async"
              />
              <img
                className="hero-glacier hero-glacier-edge"
                src={asset('images/hero-glacier-edge.webp')}
                alt=""
                aria-hidden="true"
                width="400"
                height="267"
                decoding="async"
                fetchPriority="low"
              />
              </div></div>
            </figure>
            <div className="hero-bottom">
              <div className="hero-copy">
                <p className="hero-eyebrow">成都理工大学 · 八大学者</p>
                <h1 id="hero-title" aria-label="探索，从未止步。">
                  <span className="hero-title-mask" aria-hidden="true"><span className="hero-title-word">探索，</span></span>
                  <span className="hero-title-mask" aria-hidden="true"><span className="hero-title-word">从未止步。</span></span>
                </h1>
              </div>
              <div className="hero-action-entry">
              <BorderGlow {...borderGlow} lightSurface className="hero-action">
                <span className="hero-glass-layer" aria-hidden="true" />
                <p>八位学者，一所大学的起点。<span>走近他们的研究与人生。</span></p>
                <BorderGlow {...borderGlow} as="a" className="hero-cta" href="#scholars">开始探索</BorderGlow>
              </BorderGlow>
              </div>
            </div>
          </div>
        </section>

        <section className="scholars-section section-pad" id="scholars" aria-labelledby="scholars-title" data-grainient-ignore>
          <div className="scholars-ambient" aria-hidden="true">
            <DeferredBackground
              variant="lightfall"
              colors={['#3b82f6']}
              backgroundColor="#94a3b8"
              speed={0.4}
              streakCount={2}
              streakWidth={0.7}
              twinkle={0.25}
              backgroundGlow={0.12}
              headGlow={0.6}
              bloom={0.55}
              mouseInteraction
              holdToWarp
              intro
              streakLength={1.2}
              density={0.7}
              zoom={2.9}
              mouseRadius={0.55}
              dpr={1}
            />
          </div>
          <div className="page-container">
            <SectionHeading number="01 / 04" eyebrow="PEOPLE &amp; LEGACY" id="scholars-title" title="八大学者." description="从第一代讲台到今日的学术版图，他们的名字与学校的起点相连。转动人物长廊，走近八位学者的研究与人生。" />
            <div className="scholar-showcase">
              <div className="scholar-feature-entry">
              <div className="scholar-feature" key={activeScholar.id}>
                <div className="scholar-feature-identity">
                  <div className="scholar-feature-kicker"><span>建校初期八大教授</span><span>{String(activeIndex + 1).padStart(2, '0')} / 08</span></div>
                  <div className="scholar-feature-title">
                    <h3>{activeScholar.name}</h3>
                    <p className="scholar-feature-years">{activeScholar.years || '生卒年待核实'}</p>
                  </div>
                  <p className="scholar-feature-roman">{activeScholar.roman}</p>
                </div>
                <div className="scholar-feature-intro">
                  <p className="scholar-feature-tagline">{activeScholar.tagline}</p>
                  <p className="scholar-feature-field">{activeScholar.field}</p>
                </div>
                <BorderGlow {...borderGlow} as="a" className="scholar-read-link" href="#scholar-profile" onClick={() => setAutoRotate(false)}>阅读人物档案 <ArrowIcon diagonal /></BorderGlow>
              </div>
              </div>
              <div className="scholar-carousel-column">
                <div className="scholar-carousel-stage" data-lightfall-ignore onPointerDownCapture={() => setAutoRotate(false)} onKeyDownCapture={() => setAutoRotate(false)}>
                  <CircularCarousel
                    ref={carouselRef}
                    items={carouselItems}
                    preset="cylinder"
                    intro="none"
                    cardWidth={460}
                    aspectRatio={1.2}
                    gap={40}
                    curve={1}
                    tilt={-3}
                    perspective={12000}
                    autoplay={autoRotate ? 'drift' : 'off'}
                    pauseOnHover={false}
                    speed={8}
                    momentum={0.35}
                    parallax={0.18}
                    stretch={0.18}
                    fadeColor="#0b1219"
                    depthFade={0.65}
                    innerShade={0.4}
                    cornerRadius={8}
                    onChange={setActiveIndex}
                  />
                </div>
                <div className="scholar-carousel-controls">
                  <p id="scholar-carousel-help">拖动旋转 · 点击肖像聚焦<span>键盘 ← → 切换人物</span></p>
                  <div className="scholar-carousel-actions">
                    <BorderGlow {...borderGlow} as="button" className="rotation-toggle" type="button" aria-pressed={autoRotate} onClick={() => setAutoRotate((value) => !value)}>{autoRotate ? '暂停旋转' : '自动旋转'}</BorderGlow>
                    <BorderGlow {...borderGlow} as="button" className="carousel-arrow" type="button" aria-label="上一位学者" onClick={() => { setAutoRotate(false); carouselRef.current?.stepBy(-1); }}><span aria-hidden="true">←</span></BorderGlow>
                    <BorderGlow {...borderGlow} as="button" className="carousel-arrow" type="button" aria-label="下一位学者" onClick={() => { setAutoRotate(false); carouselRef.current?.stepBy(1); }}><span aria-hidden="true">→</span></BorderGlow>
                  </div>
                </div>
              </div>
            </div>
            <div className="scholar-name-index" role="group" aria-label="按姓名选择学者">
              {scholars.map((scholar, index) => (
                <BorderGlow {...borderGlow} as="button" type="button" key={scholar.id} className={activeIndex === index ? 'is-active' : ''} aria-pressed={activeIndex === index} aria-controls="scholar-profile" onClick={() => chooseScholar(index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>{scholar.name}
                </BorderGlow>
              ))}
            </div>
            <article className="scholar-archive" id="scholar-profile" aria-labelledby="scholar-profile-title" onFocusCapture={() => setAutoRotate(false)}>
              <div className="scholar-archive-intro">
                <div className="archive-kicker">人物档案 / {String(activeIndex + 1).padStart(2, '0')}</div>
                <div className="archive-title-mask"><h3 id="scholar-profile-title">{activeScholar.name}<span>的研究与人生</span></h3></div>
                <p className="archive-summary">{activeScholar.summary}</p>
                <dl className="archive-data">
                  <div><dt>研究领域</dt><dd>{activeScholar.field}</dd></div>
                  <div><dt>代表工作</dt><dd>{activeScholar.highlights[0].title}</dd></div>
                  <div><dt>本页史料</dt><dd>{String(activeScholar.sources.length).padStart(2, '0')} 条来源</dd></div>
                </dl>
                <a className="archive-source" href={activeScholar.sources[0].url} target="_blank" rel="noreferrer noopener">查看原始史料 <ArrowIcon diagonal /></a>
              </div>
              <div className="scholar-archive-achievements">
                <div className="archive-achievements-heading"><h4>过往成就</h4><span>SELECTED CONTRIBUTIONS</span></div>
                {activeScholar.contributions.map((item, index) => (
                  <div className="archive-achievement" key={item.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><h5>{item.title}</h5><p>{item.text}</p></div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="projects-section section-pad" id="projects" aria-labelledby="projects-title">
          <div className="page-container">
            <SectionHeading number="02 / 04" eyebrow="SELECTED RESEARCH" id="projects-title" title="精选项目." description="把分散在史料中的研究成果整理为三个可阅读的专题。图像为当代信息可视化示意，文字依据公开史料。" />
            <div className="project-grid">
              {projects.map((project) => (
                <div className="project-entry" key={project.number}>
                <BorderGlow {...borderGlow} as="article" lightSurface className="project-card">
                  <div className="project-art"><div className="project-image-parallax"><div className="project-image-reveal"><img src={asset(project.image)} alt={`${project.title}主题示意图`} loading="lazy" /></div></div><span className="project-art-index">RESEARCH FILE / {project.number}</span></div>
                  <div className="project-body">
                    <div className="project-meta"><span>{project.category}</span><span>{project.number} / 03</span></div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="project-bottom"><span>关联学者 / {project.scholar}</span><BorderGlow {...borderGlow} as="button" lightSurface type="button" onClick={() => openProjectScholar(project.scholarId)} aria-label={`查看${project.scholar}的人物档案`}><ArrowIcon diagonal /></BorderGlow></div>
                  </div>
                </BorderGlow>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="strengths-section section-pad" id="strengths" aria-labelledby="strengths-title">
          <div className="page-container">
            <SectionHeading number="03 / 04" eyebrow="WAYS OF WORKING" id="strengths-title" title="学者优势." description="他们的建树不止于某一项成果。现场、学科、著述与育人，构成了一所地学大学最初的工作方法。" />
            <div className="strength-grid">
              {strengths.map((item) => (
                <div className="strength-entry" key={item.number}>
                <BorderGlow {...borderGlow} as="article" lightSurface className="strength-card">
                  <div className="strength-top"><span>{item.number} / 04</span><span className="strength-cross" aria-hidden="true">＋</span></div>
                  <div className="strength-copy"><span className="strength-en">{item.english}</span><h3>{item.title}</h3><p>{item.text}</p></div>
                  <div className="strength-evidence">关联 / {item.evidence}</div>
                </BorderGlow>
                </div>
              ))}
            </div>
            <div className="closing-statement"><span>学脉相承 · 仍在继续</span><p><span className="closing-line-mask"><span className="closing-line">研究一方土地，</span></span><span className="closing-line-mask"><span className="closing-line">也在开拓一代人的视野。</span></span></p><BorderGlow {...borderGlow} as="a" lightSurface href="#home">回到首页 ↑</BorderGlow></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-container footer-inner">
          <div><strong>学脉相承</strong><span>成都理工大学建校初期八大教授人物专题 · 设计原型</span></div>
          <p>人物内容依据学校官方宣传册及公开人物史料整理；项目图像为专题示意，不代表历史现场。本页为设计展示原型，非学校官方发布网站。<br />首屏摄影：<a href="https://unsplash.com/photos/icebergs-floating-in-a-glacial-lagoon-with-mountains-behind-9v9uIJKEhDY" target="_blank" rel="noreferrer">Danny Rienecker / Unsplash</a>，冰岛冰川景观。</p>
          <span>© 2026 SCHOLAR ARCHIVE</span>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
