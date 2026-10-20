/** Decorative backgrounds have a separate budget from foreground UI motion. */
export function canvasSize(width, height, dpr = 1, maxPixels = 1_500_000) {
  const ratio = Math.min(Math.max(dpr, 0.1), 2, Math.sqrt(maxPixels / (width * height)));
  return {
    width: Math.max(1, Math.floor(width * ratio)),
    height: Math.max(1, Math.floor(height * ratio)),
    ratio,
  };
}

// Keep elapsed time independent of monitor refresh rate. Discard missed ticks
// after a suspension instead of issuing a burst of catch-up renders.
export function createFrameGate(fps = 30) {
  const interval = 1000 / fps;
  let next = null;
  return {
    ready(now) {
      if (next === null) { next = now + interval; return true; }
      if (now + 0.1 < next) return false;
      next += (Math.floor(Math.max(0, now - next) / interval) + 1) * interval;
      return true;
    },
    reset() { next = null; },
  };
}
