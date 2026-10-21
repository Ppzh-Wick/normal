import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EASE = 'power4.out';
const CLEAR = 'transform,opacity,clipPath,willChange';

/**
 * One scoped lifecycle. Content is visible without JS animation setup.
 * Completed entrances do not restart on resize; no scroll replacement or pinning.
 */
export default function usePortfolioMotion(rootRef) {
  const completed = useRef(new Set());

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const media = gsap.matchMedia();
    let disposed = false;

    media.add({
      desktop: '(min-width: 900px)',
      compact: '(max-width: 899px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      const { desktop, reduced } = context.conditions;
      const q = gsap.utils.selector(root);
      const entrances = [];
      const cleanups = [];
      root.dataset.motion = reduced ? 'reduced' : 'full';

      if (reduced) {
        root.dataset.opening = 'complete';
        completed.current.add('opening');
        return () => { delete root.dataset.motion; };
      }

      // Reveal helpers also handle fast anchor jumps and keyboard access.
      const entrance = (key, trigger, build, after) => {
        const keys = Array.isArray(key) ? key : [key];
        if (!trigger || keys.every((item) => completed.current.has(item))) return null;
        if (trigger.getBoundingClientRect().bottom <= 0) {
          keys.forEach((item) => completed.current.add(item));
          return null;
        }
        const targets = new Set();
        const timeline = gsap.timeline({
          paused: true,
          defaults: { duration: 1.4, ease: EASE },
          onComplete: () => {
            keys.forEach((item) => completed.current.add(item));
            gsap.set([...targets], { clearProps: CLEAR });
          },
        });
        const from = (nodes, vars, position) => {
          const elements = gsap.utils.toArray(nodes);
          elements.forEach((element) => targets.add(element));
          if (elements.length) timeline.from(elements, vars, position);
          return timeline;
        };
        build(from, timeline);
        const play = () => {
          if (timeline.progress() === 1) return;
          const lead = after && after.progress() < 1 ? Math.max(0, .52 - after.time()) : 0;
          timeline.delay(lead).play();
        };
        const finish = () => timeline.progress(1);
        const observer = ScrollTrigger.create({
          trigger,
          start: 'top 87%',
          end: 'bottom top',
          once: true,
          onEnter: play,
          onEnterBack: play,
          onLeave: finish,
        });
        // Scroll restoration or loading directly at a hash can start past a trigger.
        if (window.scrollY >= observer.start) play();
        entrances.push({ trigger, finish, timeline });
        return timeline;
      };

      const hero = q('.hero')[0];
      const openingAllowed = !completed.current.has('opening')
        && (!location.hash || location.hash === '#home')
        && window.scrollY < hero.offsetHeight * .35;
      const curtain = q('.hero-opening')[0];

      if (openingAllowed) {
        root.dataset.opening = 'playing';
        gsap.set(curtain, { display: 'block' });
        let opening;
        const skip = () => { if (opening?.progress() < 1) opening.progress(1); };
        const skipKey = (event) => {
          if (['Tab', 'Escape', 'PageDown', 'End', 'ArrowDown', ' '].includes(event.key)) skip();
        };
        const removeOpeningListeners = () => {
          window.removeEventListener('wheel', skip);
          window.removeEventListener('touchmove', skip);
          root.removeEventListener('click', skip, true);
          root.removeEventListener('keydown', skipKey, true);
        };
        const openingTargets = q('.site-header, .hero-visual, .hero-image-reveal, .hero-title-word, .hero-eyebrow, .hero-action-entry');
        opening = gsap.timeline({
          defaults: { ease: EASE },
          onComplete: () => {
            completed.current.add('opening');
            root.dataset.opening = 'complete';
            curtain.style.display = 'none';
            gsap.set(openingTargets, { clearProps: CLEAR });
            removeOpeningListeners();
          },
        });
        opening
          .from(q('.opening-rule'), { scaleX: 0, duration: .85, ease: 'power3.inOut' }, 0)
          .from(q('.opening-signature span'), { yPercent: 110, duration: .8 }, 0)
          .to(q('.opening-signature span'), { yPercent: -115, duration: .65, ease: 'power3.in' }, .65)
          .to(q('.opening-rule'), { opacity: 0, duration: .5 }, .75)
          .to(q('.opening-panel--top'), { yPercent: -101, duration: 1.4, ease: 'power4.inOut' }, .45)
          .to(q('.opening-panel--bottom'), { yPercent: 101, duration: 1.4, ease: 'power4.inOut' }, .45)
          .from(q('.hero-visual'), { clipPath: 'inset(48% 4% 48% 4%)', duration: 1.9, ease: 'power3.inOut' }, .45)
          .from(q('.hero-image-reveal'), { scale: 1.22, yPercent: 8, duration: 2.65 }, .55)
          .from(q('.site-header'), { yPercent: -110, duration: 1.2 }, .95)
          .from(q('.hero-title-word'), {
            yPercent: 125, x: desktop ? 45 : 20, rotation: 5, skewY: 6,
            scaleY: .58, scaleX: .9, duration: 1.75, stagger: .18,
          }, 1.5)
          .from(q('.hero-eyebrow'), { y: 28, clipPath: 'inset(0 0 100% 0)', duration: 1.2 }, 1.6)
          .from(q('.hero-action-entry'), { y: 58, scale: .94, opacity: 0, duration: 1.4 }, 2);
        window.addEventListener('wheel', skip, { passive: true });
        window.addEventListener('touchmove', skip, { passive: true });
        // Complete after a pointer click has been dispatched. Moving a target
        // between pointerdown and pointerup can cancel its native click.
        root.addEventListener('click', skip, true);
        root.addEventListener('keydown', skipKey, true);
        cleanups.push(removeOpeningListeners);
      } else {
        root.dataset.opening = 'complete';
        completed.current.add('opening');
      }

      const headings = new Map();
      q('section > .page-container > .section-heading').forEach((heading) => {
        const id = heading.closest('section').id;
        headings.set(id, entrance(`${id}-title`, heading, (from) => {
          from(heading.querySelector('.section-heading-rule'), { scaleX: 0, duration: 1.6 }, 0);
          from(heading.querySelectorAll('.motion-char'), {
            yPercent: 130, x: desktop ? 55 : 22, rotation: 5, skewY: 7, scaleY: .62,
            duration: 1.55, stagger: .075,
          }, .05);
          from(heading.querySelector('.section-kicker'), { x: -34, clipPath: 'inset(0 100% 0 0)', duration: 1.35 }, .18);
          from(heading.querySelector('.section-heading-main > p'), { y: 45, clipPath: 'inset(0 0 100% 0)', duration: 1.35 }, .4);
        }));
      });

      entrance('people-stage', q('.people-explorer')[0], (from) => {
        from(q('.people-toolbar'), { y: 32, opacity: 0, duration: 1.1 }, 0);
        from(q('.people-wall-entry'), {
          y: desktop ? 90 : 40, clipPath: 'inset(32% 0 32% 0)',
          duration: 1.8, ease: 'power3.inOut',
        }, .15);
        from(q('.people-wall-caption'), { y: 26, opacity: 0, duration: 1.2 }, .8);
      }, headings.get('scholars'));

      entrance('people-index', q('.people-directory')[0], (from) => {
        from(q('.people-directory > button'), { y: 30, opacity: 0, stagger: .045, duration: 1 }, 0);
      });

      entrance('scholar-archive', q('.scholar-archive')[0], (from) => {
        from(q('.scholar-archive-intro h3'), { yPercent: 115, x: 35, skewY: 5, scaleY: .7, duration: 1.55 }, 0);
        from(q('.archive-kicker, .archive-summary, .archive-data > div, .archive-source'), {
          y: 38, clipPath: 'inset(0 0 100% 0)', duration: 1.25, stagger: .09,
        }, .3);
        from(q('.archive-achievements-heading, .archive-achievement'), {
          x: desktop ? 75 : 28, clipPath: 'inset(0 100% 0 0)', duration: 1.45, stagger: .14,
        }, .45);
      });

      const cardGroups = [
        ['projects', '.project-grid', '.project-entry'],
        ['strengths', '.strength-grid', '.strength-entry'],
      ];
      cardGroups.forEach(([id, gridSelector, cardSelector]) => {
        const cards = q(cardSelector);
        const remaining = cards.filter((card, index) => !completed.current.has(`${id}-card-${index}`));
        const rows = desktop ? [remaining] : remaining.map((card) => [card]);
        rows.filter((row) => row.length).forEach((row) => entrance(row.map((card) => `${id}-card-${cards.indexOf(card)}`), desktop ? q(gridSelector)[0] : row[0], (from) => {
          from(row, {
            y: desktop ? 120 : 65, rotation: desktop ? 2.5 : 1, scale: .94,
            clipPath: 'inset(100% 0% 0% 0% round 32px)',
            duration: 1.65, stagger: .2,
          }, 0);
          const pictures = row.flatMap((card) => [...card.querySelectorAll('.project-image-reveal')]);
          if (pictures.length) from(pictures, { scale: 1.2, duration: 2, stagger: .2 }, .12);
        }, headings.get(id)));
      });

      entrance('closing', q('.closing-statement')[0], (from) => {
        from(q('.closing-line'), { yPercent: 115, x: 40, skewY: 5, scaleY: .72, duration: 1.6, stagger: .16 }, 0);
        from(q('.closing-statement > span, .closing-statement > a'), { y: 30, opacity: 0, duration: 1.2, stagger: .25 }, .5);
      });

      // Image wrappers scrub independently; leave the photo wall's camera and tiles alone.
      if (desktop) {
        gsap.fromTo(q('.hero-image-parallax'), { yPercent: -3 }, {
          yPercent: 9, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.1 },
        });
        q('.project-art').forEach((art) => {
          gsap.fromTo(art.querySelector('.project-image-parallax'), { yPercent: -5 }, {
            yPercent: 5, ease: 'none',
            scrollTrigger: { trigger: art, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
          });
        });
      }

      const showFocused = (event) => {
        if (!event.target.matches(':focus-visible')) return;
        entrances.forEach(({ trigger, finish }) => {
          if (trigger.contains(event.target)) finish();
        });
      };
      root.addEventListener('focusin', showFocused);
      cleanups.push(() => root.removeEventListener('focusin', showFocused));
      return () => {
        cleanups.forEach((cleanup) => cleanup());
        delete root.dataset.motion;
      };
    }, root);

    // A selected biography or an expanded life story can change section height.
    // Refresh only after that layout change, never from a scroll or animation tick.
    let refreshFrame = 0;
    const measuredHeights = new Map();
    const profileObserver = new ResizeObserver(entries => {
      let changed = false;
      entries.forEach(entry => {
        const height = Math.round(entry.contentRect.height);
        if (measuredHeights.has(entry.target) && height !== measuredHeights.get(entry.target)) changed = true;
        measuredHeights.set(entry.target, height);
      });
      if (!changed) return;
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
    });
    root.querySelectorAll('.scholar-archive, .people-explorer').forEach(element => profileObserver.observe(element));

    // System fonts are already available here. Only repeat the expensive
    // layout measurement if fonts really are still loading.
    if (document.fonts?.status === 'loading') {
      document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    }
    return () => {
      disposed = true;
      profileObserver.disconnect();
      cancelAnimationFrame(refreshFrame);
      media.revert();
      delete root.dataset.opening;
    };
  }, [rootRef]);
}
