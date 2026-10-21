import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EASE = 'power3.out';
const CLEAR = 'transform,opacity,clipPath,willChange';

/**
 * One scoped lifecycle. Content is visible without JS animation setup.
 * Completed entrances do not restart on resize; no scroll replacement or pinning.
 */
export default function usePortfolioMotion(rootRef, active = true) {
  const completed = useRef(new Set());

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !active) return undefined;
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
          defaults: { duration: 1.05, ease: EASE },
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
          // Once a reveal has started, returning from a person keeps it settled.
          keys.forEach((item) => completed.current.add(item));
          const lead = after && after.progress() < 1 ? Math.max(0, .32 - after.time()) : 0;
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
        && hero && window.scrollY < hero.offsetHeight * .35;
      const curtain = q('.hero-opening')[0];

      if (openingAllowed) {
        // Do not replay an interrupted opening on a route return or breakpoint change.
        completed.current.add('opening');
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
        const openingTargets = q('.site-header, .hero-silk-visual, .hero-title-word, .hero-eyebrow, .hero-description, .hero-action-entry');
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
          .addLabel('unveil', .24)
          .from(q('.opening-rule'), { scaleX: 0, duration: .55, ease: 'power2.inOut' }, 0)
          .from(q('.opening-signature span'), { yPercent: 105, duration: .5 }, 0)
          .to(q('.opening-signature span'), { yPercent: -105, duration: .45, ease: 'power2.in' }, .45)
          .to(q('.opening-rule'), { opacity: 0, duration: .35 }, .5)
          .to(q('.opening-panel--top'), { yPercent: -101, duration: 1.15, ease: 'power3.inOut' }, 'unveil')
          .to(q('.opening-panel--bottom'), { yPercent: 101, duration: 1.15, ease: 'power3.inOut' }, 'unveil')
          .from(q('.hero-silk-visual'), { scale: 1.025, duration: 1.75 }, 'unveil')
          .from(q('.site-header'), { y: -24, opacity: 0, duration: .75 }, .68)
          .from(q('.hero-title-word'), {
            yPercent: 108, scaleY: .96, duration: 1.15, stagger: .06,
          }, .72)
          .from(q('.hero-eyebrow'), { y: 16, opacity: 0, duration: .8 }, .8)
          .from(q('.hero-description'), { y: 18, opacity: 0, duration: .9 }, 1.02)
          .from(q('.hero-action-entry'), { y: 20, opacity: 0, duration: .85 }, 1.12);
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
          // The h2 is a stationary mask; the complete line moves as one piece.
          from(heading.querySelector('.motion-title-mask'), {
            yPercent: 106, scaleY: .97, duration: 1.12,
          }, 0);
          from(heading.querySelector('.section-heading-rule'), { scaleX: 0, duration: .9 }, .05);
          from(heading.querySelector('.section-kicker'), { y: 14, opacity: 0, duration: .75 }, .12);
          from(heading.querySelector('.section-heading-main > p'), { y: 22, opacity: 0, duration: .85 }, .24);
        }));
      });

      entrance('people-stage', q('.people-explorer')[0], (from) => {
        from(q('.people-toolbar'), { y: 18, opacity: 0, duration: .8 }, 0);
        from(q('.people-wall-entry'), {
          y: desktop ? 36 : 22, scale: .985, opacity: 0,
          duration: 1.25, ease: EASE,
        }, .15);
        from(q('.people-wall-caption'), { y: 16, opacity: 0, duration: .8 }, .42);
      }, headings.get('scholars'));

      entrance('people-index', q('.people-directory')[0], (from) => {
        from(q('.people-directory > a'), { y: 16, opacity: 0, stagger: .025, duration: .7 }, 0);
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
            y: desktop ? 42 : 26, scale: .975, opacity: 0,
            duration: 1.1, stagger: .09,
          }, 0);
          const pictures = row.flatMap((card) => [...card.querySelectorAll('.project-image-reveal')]);
          if (pictures.length) from(pictures, { scale: 1.065, duration: 1.35, stagger: .09 }, .04);
        }, headings.get(id)));
      });

      entrance('closing', q('.closing-statement')[0], (from) => {
        from(q('.closing-line'), { yPercent: 105, duration: 1.1, stagger: .1 }, 0);
        from(q('.closing-statement > span, .closing-statement > a'), { y: 16, opacity: 0, duration: .8, stagger: .12 }, .26);
      });

      // Parent copy retreat is independent of the opening's child transforms.
      // Native scrolling remains untouched; no pin, snap or wheel interception.
      if (desktop && hero) {
        const heroCopy = q('.hero-copy')[0];
        if (heroCopy) gsap.fromTo(heroCopy, { y: 0, scale: 1, opacity: 1 }, {
          y: -36, scale: .985, opacity: .68, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top-=56', end: 'bottom 28%', scrub: .55 },
        });
      }

      // Image wrappers scrub independently; leave the photo wall's camera and tiles alone.
      if (desktop) {
        q('.project-art').forEach((art) => {
          gsap.fromTo(art.querySelector('.project-image-parallax'), { yPercent: -2.5 }, {
            yPercent: 2.5, ease: 'none',
            scrollTrigger: { trigger: art, start: 'top bottom', end: 'bottom top', scrub: .65 },
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

    // Group changes can alter the directory height.
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
    root.querySelectorAll('.people-explorer').forEach(element => profileObserver.observe(element));

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
  }, [rootRef, active]);
}
