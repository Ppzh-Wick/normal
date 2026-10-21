import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './hero.css';
import PeopleExplorer from './components/PeopleExplorer';
import DeferredBackground from './components/DeferredBackground';
import BorderGlow from './components/BorderGlow';
import './scholar-carousel.css';
import './grainient-theme.css';
import './border-glow-theme.css';
import './motion.css';
import usePortfolioMotion from './hooks/usePortfolioMotion';
import ScholarSite from './components/ScholarSite';
import './hero-silk.css';

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

const heroBorderGlow = {
  ...borderGlow,
  glowColor: '14 32 74',
  colors: ['#a75960', '#c9a394', '#ead8ce'],
};

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
      {(number || eyebrow) && <div className="section-kicker"><span>{number}</span><i />{eyebrow}</div>}
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

function App({ active = true, onOpenPerson, initialGallery }) {
  const siteRef = useRef(null);
  usePortfolioMotion(siteRef, active);
  const peopleRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [grainientVisible, setGrainientVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [peoplePaused, setPeoplePaused] = useState(initialGallery?.paused || false);

  useEffect(() => {
    if (!active) return undefined;
    // Give each visible section its own rendering budget. The light backdrop
    // is not loaded behind the opaque Silk hero or the scholar gallery.
    const visibility = new Map();
    const sections = document.querySelectorAll('#home, #projects, #strengths, .site-footer');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const visible = entry.isIntersecting && entry.intersectionRect.height > 0;
        if (entry.target.id === 'home') setHeroVisible(visible);
        else visibility.set(entry.target, visible);
      });
      setGrainientVisible([...visibility.values()].some(Boolean));
    }, { threshold: [0, 0.001] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    const hero = document.getElementById('home');
    if (!hero) return;
    let threshold = 0;
    let frame = 0;
    let previous;
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
  }, [active]);

  const openProjectScholar = id => peopleRef.current?.openProfile(id);

  return (
    <div className="site-shell grainient-theme silk-hero-theme" ref={siteRef}>
      <div className="site-ambient" aria-hidden="true" data-active={grainientVisible}>
        <DeferredBackground
          variant="grainient"
          colors={['#bac7ca', '#00afe2', '#2dd4bf', '#ccfbf1']}
          angle={20}
          flow={0.9}
          silk={0.35}
          grainAmount={0.08}
          dpr={1}
          paused={!active || !grainientVisible}
        />
      </div>
      <a className="skip-link" href="#main">跳到正文</a>
      <BorderGlow {...borderGlow} as="header" disabled={!scrolled} borderRadius={scrolled ? 32 : 0} className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <span className="header-glass-layer" aria-hidden="true" />
        <div className="header-inner page-container">
          <a className="brand" href="#home" aria-label="返回首页" onClick={() => setMenuOpen(false)}>
            <span className="brand-text"><strong>学脉相承</strong><small>CDUT · SCHOLAR ARCHIVE</small></span>
          </a>
          <BorderGlow {...(scrolled ? borderGlow : heroBorderGlow)} as="nav" disabled={!menuOpen} lightSurface={!scrolled} id="main-nav" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="主导航">
            <a href="#home" onClick={() => setMenuOpen(false)}>首页</a>
            <a href="#scholars" onClick={() => setMenuOpen(false)}>人物长廊</a>
            <a href="#projects" onClick={() => setMenuOpen(false)}>精选项目</a>
            <a href="#strengths" onClick={() => setMenuOpen(false)}>学者优势</a>
          </BorderGlow>
          <div className="header-end"><span>始于 1956</span><BorderGlow {...(scrolled ? borderGlow : heroBorderGlow)} lightSurface={!scrolled} as="a" href="#scholars">人物档案</BorderGlow></div>
          <BorderGlow {...(scrolled ? borderGlow : heroBorderGlow)} lightSurface={!scrolled} as="button" className="menu-toggle" type="button" aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? '关闭' : '菜单'}</BorderGlow>
        </div>
      </BorderGlow>

      <main id="main">
        <section className="hero hero-silk" id="home" aria-labelledby="hero-title">
          <div className="hero-silk-visual" aria-hidden="true">
            <DeferredBackground variant="silk"
              color="#853039" sheenColor="#c9a394"
              speed={2.4} scale={1.2} rotation={0.25}
              noiseIntensity={0.3} sheen={0.42} depth={0.62}
              glow={0.01} ripple={1.1} wave={0.8} variation={0}
              mouseInteraction={false} clickRipple={false} intro={false}
              paused={!active || !heroVisible}
              dpr={1} maxFps={30} maxPixels={1_000_000} />
          </div>
          <div className="hero-opening" aria-hidden="true">
            <span className="opening-panel opening-panel--top" />
            <span className="opening-panel opening-panel--bottom" />
            <span className="opening-rule" />
            <span className="opening-signature"><span>学脉相承</span></span>
          </div>
          <div className="hero-content page-container">
            <div className="hero-bottom">
              <div className="hero-copy">
                <p className="hero-eyebrow">成都理工大学 · 八大学者与五大奠基人</p>
                <h1 id="hero-title" aria-label="探索，从未止步。">
                  <span className="hero-title-mask" aria-hidden="true"><span className="hero-title-word">探索，</span></span>
                  <span className="hero-title-mask" aria-hidden="true"><span className="hero-title-word">从未止步。</span></span>
                </h1>
                <p className="hero-description">十三位先贤，留下不息的学脉。<span>走近他们的研究与人生。</span></p>
              </div>
              <div className="hero-action-entry">
                <a className="hero-cta silk-hero-cta" href="#scholars">开始探索<ArrowIcon /></a>
              </div>
            </div>
          </div>
        </section>

        <section className="scholars-section people-section section-pad" id="scholars" aria-labelledby="scholars-title" data-grainient-ignore>
          <div className="people-lightfall" aria-hidden="true">
            <DeferredBackground variant="lightfall"
              colors={['#d8b882', '#ae8459']} backgroundColor="#171114"
              speed={0.26} streakCount={2} streakWidth={0.6} streakLength={1.35}
              density={0.4} zoom={2.9} twinkle={0.08} backgroundGlow={0.06}
              headGlow={0.45} bloom={0.24} opacity={0.9}
              mouseInteraction={false} holdToWarp={false} intro={false}
              paused={!active || peoplePaused} dpr={1} maxFps={30} maxPixels={1_000_000} />
          </div>
          <div className="page-container">
            <SectionHeading id="scholars-title" title="十三位先贤。" description="八大学者与五大奠基人。他们留下的学问、学科与育人精神，至今仍在这所大学生长。" />
            <PeopleExplorer ref={peopleRef} active={active} onPauseChange={setPeoplePaused} onOpenPerson={onOpenPerson} initialGallery={initialGallery} />
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
                    <div className="project-bottom"><span>关联学者 / {project.scholar}</span><BorderGlow {...borderGlow} as="button" id={`project-person-${project.number}`} lightSurface type="button" onClick={() => openProjectScholar(project.scholarId)} aria-label={`查看${project.scholar}的人物档案`}><ArrowIcon diagonal /></BorderGlow></div>
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
          <div><strong>学脉相承</strong><span>成都理工大学八大学者与五大奠基人人物专题 · 设计原型</span></div>
          <p>人物内容依据学校官方宣传册及公开人物史料整理；项目图像为专题示意，不代表历史现场。本页为设计展示原型，非学校官方发布网站。<br />首屏动态背景：<a href="https://reactbits.dev/backgrounds/silk" target="_blank" rel="noreferrer">React Bits · Silk</a>，经调色与性能适配。</p>
          <span>© 2026 SCHOLAR ARCHIVE</span>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<ScholarSite Home={App} />);
