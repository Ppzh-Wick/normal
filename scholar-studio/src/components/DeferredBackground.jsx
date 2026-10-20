import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';

const Grainient = lazy(() => import('./Grainient'));
const Lightfall = lazy(() => import('./Lightfall'));

// Decorative chunk failures must not take down navigation or the scholar data.
class BackgroundBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Keep shader compilation out of React's initial mount. Dimensions belong to
 * the existing ambient wrapper, so deferred decoration never shifts content. */
export default function DeferredBackground({ variant, ...props }) {
  const host = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    let idle = 0;
    let timer = 0;
    let deadline = 0;
    const enable = () => {
      window.clearTimeout(deadline);
      if (!disposed) setReady(true);
    };
    const schedule = () => {
      if (idle || timer || disposed) return;
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(enable, { timeout: 900 });
      else timer = window.setTimeout(enable, 80);
    };
    if (variant === 'grainient') {
      // The preload starts in HTML; let the hero decode before competing for
      // the main thread with shaders. A timeout keeps decoration resilient.
      const photo = document.querySelector('.hero-glacier');
      if (photo?.decode) photo.decode().catch(() => {}).then(schedule);
      else schedule();
      deadline = window.setTimeout(enable, 1500);
    }
    const observer = variant === 'lightfall' ? new IntersectionObserver(([entry]) => {
      // Edge-adjacent rectangles may be "intersecting" with zero visible pixels.
      if (entry.isIntersecting && entry.intersectionRect.height > 0) { schedule(); observer.disconnect(); }
    }, { threshold: [0, 0.001] }) : null;
    if (observer) observer.observe(host.current);
    return () => {
      disposed = true;
      observer?.disconnect();
      window.clearTimeout(timer);
      window.clearTimeout(deadline);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, [variant]);
  const Background = variant === 'lightfall' ? Lightfall : Grainient;
  return (
    <div ref={host} className="deferred-background">
      {ready && <BackgroundBoundary><Suspense fallback={null}><Background {...props} /></Suspense></BackgroundBoundary>}
    </div>
  );
}
