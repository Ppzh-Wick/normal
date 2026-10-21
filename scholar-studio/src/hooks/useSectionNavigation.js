import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const SECTION_IDS = new Set(['home', 'scholars', 'projects', 'strengths', 'main']);

function findTarget(root, target) {
  if (!root || !target) return null;
  let element = target;
  if (typeof target === 'string') {
    let id = target.replace(/^#/, '');
    try { id = decodeURIComponent(id); } catch { return null; }
    element = root.ownerDocument.getElementById(id);
  }
  return element?.nodeType === 1 && (root === element || root.contains(element)) ? element : null;
}

/**
 * Smooth only deliberate chapter jumps; ordinary wheel/touch scrolling stays native.
 * Person-page chapter IDs are local jumps and never replace the #/people route.
 */
export default function useSectionNavigation(rootRef, active = true) {
  const enabledRef = useRef(active);
  const runRef = useRef(null);
  const inputRef = useRef('pointer');
  const focusCleanupRef = useRef(null);
  enabledRef.current = active;

  const cancel = useCallback(() => runRef.current?.cancel(), []);

  const scrollToSection = useCallback((target, options = {}) => {
    if (!enabledRef.current || typeof window === 'undefined') return false;
    const root = rootRef.current;
    const element = findTarget(root, target);
    if (!element?.isConnected || !element.getClientRects().length) return false;

    cancel();
    const html = document.documentElement;
    const top = window.scrollY;
    const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
    const padding = parseFloat(getComputedStyle(html).scrollPaddingTop) || 0;
    const offset = Number.isFinite(options.offsetY) ? options.offsetY : margin + padding;
    const max = Math.max(0, html.scrollHeight - window.innerHeight);
    const destination = Math.min(max, Math.max(0, element.getBoundingClientRect().top + top - offset));
    const distance = Math.abs(destination - top);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldFocus = options.focus ?? inputRef.current === 'keyboard';
    const duration = Number.isFinite(options.duration)
      ? Math.min(1.15, Math.max(0, options.duration))
      : Math.min(1.15, .75 + distance / Math.max(1, window.innerHeight * 5));

    const previousBehavior = html.style.getPropertyValue('scroll-behavior');
    const previousPriority = html.style.getPropertyPriority('scroll-behavior');
    html.style.setProperty('scroll-behavior', 'auto', 'important');

    const run = { tween: null, done: false, cancel: null };
    const finish = (completed, kill = false) => {
      if (run.done) return;
      run.done = true;
      if (runRef.current === run) runRef.current = null;
      if (kill) run.tween?.kill();
      if (previousBehavior) html.style.setProperty('scroll-behavior', previousBehavior, previousPriority);
      else html.style.removeProperty('scroll-behavior');
      if (!completed || !shouldFocus || !enabledRef.current || !element.isConnected) return;

      const heading = element.matches('h1, h2, h3, h4, h5, h6')
        ? element : element.querySelector('h1, h2, h3, h4, h5, h6');
      if (!heading) return;
      focusCleanupRef.current?.();
      if (!heading.hasAttribute('tabindex')) {
        heading.setAttribute('tabindex', '-1');
        const restoreFocus = () => {
          heading.removeEventListener('blur', restoreFocus);
          if (heading.getAttribute('tabindex') === '-1') heading.removeAttribute('tabindex');
          if (focusCleanupRef.current === restoreFocus) focusCleanupRef.current = null;
        };
        focusCleanupRef.current = restoreFocus;
        heading.addEventListener('blur', restoreFocus, { once: true });
      }
      heading.focus({ preventScroll: true });
    };
    run.cancel = () => finish(false, true);
    runRef.current = run;

    // pushState avoids the browser's immediate anchor scroll. The router only
    // synchronizes its location state when it receives this dedicated event.
    if (options.updateHash !== false && SECTION_IDS.has(element.id)) {
      const hash = `#${element.id}`;
      if (window.location.hash !== hash) window.history.pushState(window.history.state, '', hash);
      window.dispatchEvent(new CustomEvent('scholar:section-navigation', { detail: { id: element.id, hash } }));
    }
    if (run.done || !enabledRef.current) {
      run.cancel();
      return false;
    }

    if (reduced || duration === 0 || distance < 2) {
      window.scrollTo({ top: destination, left: window.scrollX, behavior: 'instant' });
      finish(true);
      return true;
    }

    run.tween = gsap.to(window, {
      duration,
      ease: 'power3.inOut',
      overwrite: false,
      scrollTo: { y: destination, autoKill: true, onAutoKill: () => finish(false, true) },
      onComplete: () => finish(true),
      onInterrupt: () => finish(false),
    });
    return true;
  }, [rootRef, cancel]);

  useEffect(() => {
    const root = rootRef.current;
    if (!active || !root) {
      cancel();
      focusCleanupRef.current?.();
      return undefined;
    }

    const onClick = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || !root.contains(link) || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const href = link.getAttribute('href');
      if (!href?.startsWith('#') || !SECTION_IDS.has(href.slice(1))) return;
      if (!findTarget(root, href)) return;
      if (scrollToSection(href, { focus: event.detail === 0 })) event.preventDefault();
    };
    const onKey = () => {
      inputRef.current = 'keyboard';
      cancel();
    };
    const onPointer = () => {
      inputRef.current = 'pointer';
      cancel();
    };
    const onHidden = () => { if (document.hidden) cancel(); };
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => cancel();

    root.addEventListener('click', onClick);
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('popstate', cancel);
    window.addEventListener('hashchange', cancel);
    document.addEventListener('visibilitychange', onHidden);
    motion.addEventListener('change', onMotionChange);
    return () => {
      cancel();
      focusCleanupRef.current?.();
      root.removeEventListener('click', onClick);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('popstate', cancel);
      window.removeEventListener('hashchange', cancel);
      document.removeEventListener('visibilitychange', onHidden);
      motion.removeEventListener('change', onMotionChange);
    };
  }, [rootRef, active, scrollToSection, cancel]);

  return scrollToSection;
}
