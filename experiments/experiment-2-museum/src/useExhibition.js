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
  const wheel = useRef({sum: 0, last: 0, gesture: null});
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
    wheel.current = {sum: 0, last: 0, gesture: null};
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
      if (node && node.getBoundingClientRect().top < (mode.current ? 2 : Math.min(innerHeight * .3, 220))) current = i;
    });
    return current;
  }, [ids]);

  const go = useCallback((requested, {historyMode = 'replace', instant = false, focus = false, pageTop = null, pageDirection = 0} = {}) => {
    if (!Number.isFinite(requested) || !ids.length) return Promise.resolve(false);
    const i = Math.max(0, Math.min(ids.length - 1, Math.trunc(requested)));
    const el = document.getElementById(ids[i]);
    if (!el) return Promise.resolve(false);
    const sourceModal = focus ? document.querySelector('dialog:modal') : null;
    cancelPending();
    const generation = ++navigationGeneration.current;
    const previous = index.current; // The last committed chapter, never an uncommitted target.
    const animate = !instant && !preferences.current.reduced && mode.current && (previous !== i || pageTop !== null);
    const behavior = instant || preferences.current.reduced || mode.current ? 'instant' : 'smooth';
    locked.current = performance.now() + (instant ? 100 : 380);

    const session = runTransition({
      kind: 'chapter',
      direction: (pageDirection || i - previous) > 0 ? 'forward' : 'back',
      animate,
      onCancel() {
        if (generation !== navigationGeneration.current) return;
        navigationGeneration.current += 1;
        clearPendingFocus();
        locked.current = 0;
        wheel.current = {sum: 0, last: 0, gesture: null};
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
        if (pageTop !== null) window.scrollTo({top:pageTop, behavior});
        else el.scrollIntoView({behavior, block: 'start'});
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
      if (!mode.current || e.defaultPrevented || e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) ||
          e.target.closest('dialog,input,textarea,select,[contenteditable="true"]') || document.querySelector('dialog:modal')) return;
      const i = index.current, el = document.getElementById(ids[i]);
      if (!el) return;
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      if (!d) return;
      const direction = Math.sign(d), now = performance.now();
      const input = wheel.current, magnitude = Math.abs(d), gap = now - input.last;
      const sameGesture = gap < 160;
      // A continuing series of mouse notches is not a single touchpad tail.
      // Use the fixed chapter-turn timestamp and pulse spacing/strength so
      // rolling continuously can never renew the latch for distinct pulses.
      const turnAge = now - input.turnedAt, steady = magnitude >= (input.lastMagnitude || 0) * .98;
      const renewedPulse = turnAge >= 460 &&
        ((gap >= 45 && magnitude >= 8 && steady) ||
         (turnAge >= 850 && magnitude >= 12 && steady) ||
         (direction === -input.direction && magnitude >= 24) ||
         (magnitude >= Math.max(24, (input.lastMagnitude || 0) * 1.8)));
      if (now < locked.current || (input.gesture === 'chapter' && sameGesture && !renewedPulse)) {
        e.preventDefault();
        if (input.gesture) { input.last = now; input.lastMagnitude = magnitude; }
        return;
      }
      if (input.gesture === 'chapter') wheel.current = {sum: 0, last: input.last, gesture: null};
      // Contain genuine vertical reading panels; a purely horizontal or
      // non-overflowing widget must not trap the chapter wheel.
      for (let node = e.target; node && node !== el && node !== document.body && node !== document.documentElement; node = node.parentElement) {
        if (!/^(auto|scroll|overlay)$/.test(getComputedStyle(node).overflowY)) continue;
        const remaining = direction > 0 ? node.scrollHeight - node.clientHeight - node.scrollTop : node.scrollTop;
        if (remaining <= 1) continue;
        e.preventDefault();
        node.scrollBy({top: direction * Math.min(Math.abs(d), remaining), behavior: 'instant'});
        wheel.current = {sum: 0, last: now, gesture: 'panel'};
        return;
      }
      // Do not chain the same movement from a panel into a chapter turn.
      if (wheel.current.gesture === 'panel' && sameGesture) {
        e.preventDefault(); wheel.current.last = now; return;
      }
      e.preventDefault();
      if (!sameGesture || Math.sign(wheel.current.sum) !== direction) wheel.current.sum = 0;
      wheel.current.last = now;
      wheel.current.sum += d;
      if (e.deltaMode !== 0 || Math.abs(wheel.current.sum) >= 18 || (gap >= 45 && magnitude >= 12)) {
        // Read fresh geometry after layout changes so opening a disclosure or
        // resizing does not leave a gap or trap a reading stop.
        const top = window.scrollY, height = innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const max = Math.max(0, documentHeight - height);
        const header = document.querySelector('.masthead')?.getBoundingClientRect().height || 0;
        const stride = Math.max(1, height - Math.ceil(header) - 12);
        const sections = ids.flatMap((id, chapter) => {
          const node = document.getElementById(id);
          return node ? [{chapter, top:Math.round(node.getBoundingClientRect().top + top)}] : [];
        });
        const stops = [];
        const addStop = (chapter, y) => {
          const at = Math.min(max, Math.max(0, Math.round(y)));
          if (!stops.length || at > stops.at(-1).top + 2) stops.push({chapter, top:at});
          else if (chapter !== stops.at(-1).chapter) stops[stops.length-1] = {chapter, top:at};
        };
        sections.forEach((section, j) => {
          const end = sections[j+1]?.top ?? documentHeight;
          const start = section.top;
          addStop(section.chapter, start);
          if (end - start <= height + 2) return;
          const tail = Math.min(max, end - stride);
          if (tail <= start + 2) return;
          for (let y = start + stride; y < tail - 2; y += stride) addStop(section.chapter, y);
          addStop(section.chapter, tail);
        });
        const target = direction > 0
          ? stops.find(stop => stop.top > top + 2)
          : stops.findLast(stop => stop.top < top - 2);
        if (target) go(target.chapter, {pageTop: target.top, pageDirection: direction});
        wheel.current = {sum: 0, last: now, gesture: 'chapter', turnedAt: now, direction, lastMagnitude: magnitude};
      }
    };
    const key = e => {
      if (!mode.current || document.querySelector('dialog:modal')) return;
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
