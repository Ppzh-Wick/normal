import {flushSync} from 'react-dom';
import {useCallback, useEffect, useRef, useState} from 'react';
import {runTransition} from './transitionCoordinator.js';

export function useMedia(query) {
  const [value, set] = useState(() => typeof matchMedia === 'function' && matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const change = () => set(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, [query]);
  return value;
}

export default function useExhibition(ids) {
  const desktop = useMedia('(min-width:1000px)');
  const reduced = useMedia('(prefers-reduced-motion:reduce)');
  const [active, setActive] = useState(0);
  const [guided, setGuidedState] = useState(true);
  const [long, setLong] = useState(false);
  const index = useRef(0), locked = useRef(0);
  const wheel = useRef({sum: 0, last: 0, reading: false});
  const mode = useRef(true), preferences = useRef({desktop, reduced, guided});
  const transitionRef = useRef(null), navigationGeneration = useRef(0), focusFrame = useRef(0);
  const focusWaitCleanup = useRef(null);
  mode.current = guided && desktop;
  preferences.current = {desktop, reduced, guided};

  const clearPendingFocus = useCallback(() => {
    if (focusFrame.current) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = 0;
    focusWaitCleanup.current?.();
    focusWaitCleanup.current = null;
  }, []);

  const cancelPending = useCallback(() => {
    navigationGeneration.current += 1;
    transitionRef.current?.cancel();
    transitionRef.current = null;
    clearPendingFocus();
    locked.current = 0;
    wheel.current = {sum: 0, last: 0, reading: false};
  }, [clearPendingFocus]);

  const setGuided = useCallback(value => {
    const next = typeof value === 'function' ? value(preferences.current.guided) : value;
    if (!next) cancelPending();
    preferences.current.guided = next;
    mode.current = next && preferences.current.desktop;
    setGuidedState(next);
  }, [cancelPending]);

  const derive = useCallback(() => {
    let current = 0;
    ids.forEach((id, i) => {
      const node = document.getElementById(id);
      if (node && node.getBoundingClientRect().top < Math.min(innerHeight * .3, 220)) current = i;
    });
    return current;
  }, [ids]);

  const go = useCallback((requested, {historyMode = 'replace', instant = false, focus = false} = {}) => {
    if (!Number.isFinite(requested) || !ids.length) return Promise.resolve(false);
    const i = Math.max(0, Math.min(ids.length - 1, Math.trunc(requested)));
    const el = document.getElementById(ids[i]);
    if (!el) return Promise.resolve(false);
    const sourceModal = focus ? document.querySelector('dialog:modal') : null;
    cancelPending();
    const generation = ++navigationGeneration.current;
    const previous = index.current; // The last committed chapter, never an uncommitted target.
    const animate = !instant && !preferences.current.reduced && mode.current && previous !== i;
    const behavior = instant || preferences.current.reduced || mode.current ? 'instant' : 'smooth';
    locked.current = performance.now() + (instant ? 100 : 380);

    const session = runTransition({
      kind: 'chapter',
      direction: i > previous ? 'forward' : 'back',
      animate,
      onCancel() {
        if (generation !== navigationGeneration.current) return;
        navigationGeneration.current += 1;
        clearPendingFocus();
        locked.current = 0;
        wheel.current = {sum: 0, last: 0, reading: false};
      },
      update() {
        if (generation !== navigationGeneration.current || el.isConnected === false) return false;
        flushSync(() => {
          index.current = i;
          setActive(i);
          setLong(el.offsetHeight > innerHeight + 100);
        });
        if (generation !== navigationGeneration.current) return false;
        if (historyMode && location.hash.split('?')[0] !== '#' + ids[i]) {
          history[historyMode === 'push' ? 'pushState' : 'replaceState'](null, '', '#' + ids[i]);
        }
        el.scrollIntoView({behavior, block: 'start'});
        return true;
      }
    });
    transitionRef.current = session;
    const isLatest = () => generation === navigationGeneration.current && session.isCurrent();
    return session.committed.then(committed => {
      if (!committed) {
        if (isLatest()) cancelPending();
        return false;
      }
      if (!isLatest()) return false;
      if (focus) {
        // A menu may still be closing when the snapshot commit settles. Wait
        // only for the modal that initiated this navigation, never a new one.
        let sourceClosed = !sourceModal;
        const queueFocus = () => {
          if (!isLatest()) return;
          const modal = document.querySelector('dialog:modal');
          if (modal) {
            if (modal !== sourceModal || sourceClosed || !modal.addEventListener) return;
            if (focusWaitCleanup.current) return;
            const afterClose = () => {
              focusWaitCleanup.current?.();
              focusWaitCleanup.current = null;
              sourceClosed = true;
              // Reopening the same dialog must also retain its own focus.
              if (isLatest() && !document.querySelector('dialog:modal')) queueFocus();
            };
            modal.addEventListener('close', afterClose, {once: true});
            focusWaitCleanup.current = () => modal.removeEventListener('close', afterClose);
            return;
          }
          sourceClosed = true;
          focusFrame.current = requestAnimationFrame(() => {
            focusFrame.current = 0;
            if (!isLatest() || document.querySelector('dialog:modal')) return;
            const heading = el.querySelector('h1,h2');
            if (heading && heading.isConnected !== false) {
              heading.tabIndex = -1;
              heading.focus({preventScroll: true});
            }
          });
        };
        queueFocus();
      }
      return true;
    }).catch(() => false);
  }, [ids, cancelPending, clearPendingFocus]);

  useEffect(() => {
    if (!guided || !desktop || reduced) cancelPending();
  }, [guided, desktop, reduced, cancelPending]);

  useEffect(() => {
    let scrollFrame = 0, disposed = false;
    const sync = () => {
      if (disposed || performance.now() < locked.current) return;
      const i = derive();
      index.current = i;
      setActive(i);
      const el = document.getElementById(ids[i]);
      setLong(el?.offsetHeight > innerHeight + 100);
    };
    const scheduleSync = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; sync(); });
    };
    const onWheel = e => {
      if (!mode.current || e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) ||
          e.target.closest('[data-scroll-lock],dialog,input,textarea,select') || document.querySelector('dialog:modal')) return;
      const now = performance.now();
      if (now < locked.current) { e.preventDefault(); return; }
      const i = index.current, el = document.getElementById(ids[i]);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      if (!d) return;
      if (r.height > innerHeight + 100 && ((d > 0 && r.bottom > innerHeight + 5) || (d < 0 && r.top < -5))) {
        e.preventDefault();
        window.scrollBy({top: d > 0 ? Math.min(d, r.bottom - innerHeight) : Math.max(d, r.top), behavior: 'instant'});
        wheel.current.last = now;
        wheel.current.sum = 0;
        wheel.current.reading = true;
        return;
      }
      if (wheel.current.reading && now - wheel.current.last < 220) {
        e.preventDefault(); wheel.current.last = now; return;
      }
      wheel.current.reading = false;
      if ((d < 0 && i === 0) || (d > 0 && i === ids.length - 1)) return;
      e.preventDefault();
      if (now - wheel.current.last > 220 || Math.sign(wheel.current.sum) !== Math.sign(d)) wheel.current.sum = 0;
      wheel.current.last = now;
      wheel.current.sum += d;
      if (Math.abs(wheel.current.sum) >= 35) go(i + Math.sign(d));
    };
    const key = e => {
      if (!mode.current || document.querySelector('dialog:modal')) return;
      if (e.key === 'Escape') { setGuided(false); return; }
      if (e.target.closest('dialog,input,textarea,select,button,a,svg,[data-scroll-lock]')) return;
      const direction = {PageDown: 1, ArrowDown: 1, PageUp: -1, ArrowUp: -1}[e.key];
      if (!direction) return;
      if (e.repeat || performance.now() < locked.current) { e.preventDefault(); return; }
      const i = derive(), el = document.getElementById(ids[i]);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.height > innerHeight + 100 && ((direction > 0 && r.bottom > innerHeight + 5) || (direction < 0 && r.top < -5))) return;
      e.preventDefault();
      go(i + direction, {focus: true});
    };
    const restore = () => {
      const i = ids.indexOf(location.hash.slice(1).split('?')[0]);
      if (i >= 0) go(i, {historyMode: false, instant: true});
      else cancelPending();
    };
    const sizeObserver = new ResizeObserver(() => {
      const el = document.getElementById(ids[index.current]);
      setLong(el?.offsetHeight > innerHeight + 100);
    });
    ids.forEach(id => { const el = document.getElementById(id); if (el) sizeObserver.observe(el); });
    window.addEventListener('scroll', scheduleSync, {passive: true});
    window.addEventListener('resize', sync);
    window.addEventListener('wheel', onWheel, {passive: false});
    window.addEventListener('keydown', key);
    window.addEventListener('popstate', restore);
    restore();
    document.fonts?.ready.then(sync)?.catch?.(() => {});
    return () => {
      disposed = true;
      cancelPending();
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      sizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', key);
      window.removeEventListener('popstate', restore);
    };
  }, [ids, derive, go, setGuided, cancelPending]);

  return {active, guided: guided && desktop, setGuided, go, cancelPending, reduced, desktop, long};
}
