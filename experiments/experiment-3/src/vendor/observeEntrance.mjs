// Event-driven entrance trigger. The React Bits GSAP timelines stay unchanged.
// No ticker, animation frame, interval, or polling while waiting for a chapter.
export function observeEntrance(element, {
  root = null,
  threshold = 0.1,
  rootMargin = '0px',
  once = true,
  onEnter,
  onLeaveBack
} = {}) {
  const doc = element?.ownerDocument;
  const win = doc?.defaultView;
  if (!element || !win) return () => {};
  root = root?.nodeType === 1 ? root : null;
  const scrollTarget = root || win;
  let observer = null;
  let resizeObserver = null;
  let stopped = false;
  let entered = false;
  const ratio = Math.max(0, Math.min(1, Number(threshold) || 0));

  const bounds = () => root
    ? { top: root.getBoundingClientRect().top + (root.clientTop || 0), height: root.clientHeight }
    : { top: 0, height: win.innerHeight || doc.documentElement.clientHeight };

  const offset = height => {
    const match = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(String(rootMargin).trim());
    if (!match) return 0;
    const value = Number(match[1]);
    if (match[2] === '%') return value * height / 100;
    if (match[2] === 'em') return value * (parseFloat(win.getComputedStyle(element).fontSize) || 16);
    if (match[2] === 'rem') return value * (parseFloat(win.getComputedStyle(doc.documentElement).fontSize) || 16);
    return value;
  };
  const line = height => Math.max(0, height * (1 - ratio) + offset(height));

  const stop = () => {
    if (stopped) return;
    stopped = true;
    observer?.disconnect();
    resizeObserver?.disconnect();
    scrollTarget.removeEventListener('scroll', check);
    win.removeEventListener('resize', reconnect);
  };
  const check = () => {
    if (stopped || element.isConnected === false) return;
    const box = bounds();
    if (!box.height) return;
    const passed = element.getBoundingClientRect().top <= box.top + line(box.height);
    if (passed && !entered) {
      entered = true;
      if (once) stop();
      onEnter?.();
    } else if (!passed && entered && !once) {
      entered = false;
      onLeaveBack?.();
    }
  };
  const reconnect = () => {
    if (stopped) return;
    observer?.disconnect();
    const { height } = bounds();
    if (typeof win.IntersectionObserver === 'function' && height > 0) {
      // Pixel margins matter: IntersectionObserver resolves percentage margins
      // against width, while this component's threshold is viewport height.
      observer = new win.IntersectionObserver(check, {
        root,
        rootMargin: `0px 0px ${line(height) - height}px 0px`,
        threshold: 0
      });
      observer.observe(element);
    }
    check();
  };
  // An instant chapter jump can skip the intersection completely. This event
  // also handles that case, including initial/deep-linked positions above it.
  scrollTarget.addEventListener('scroll', check, { passive: true });
  win.addEventListener('resize', reconnect);
  if (root && typeof win.ResizeObserver === 'function') {
    resizeObserver = new win.ResizeObserver(reconnect);
    resizeObserver.observe(root);
  }
  reconnect();
  return stop;
}
