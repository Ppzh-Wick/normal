import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { observeEntrance } from '../src/vendor/observeEntrance.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
function events(target = {}) {
  const handlers = new Map();
  return Object.assign(target, {
    handlers,
    addEventListener(type, callback) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(callback);
    },
    removeEventListener(type, callback) { handlers.get(type)?.delete(callback); },
    fire(type) { [...(handlers.get(type) || [])].forEach(callback => callback()); },
    count(type) { return handlers.get(type)?.size || 0; }
  });
}
function harness({ top = 1100, height = 1000, intersection = true } = {}) {
  const observers = [], resizers = [];
  const win = events({
    innerHeight: height,
    getComputedStyle: () => ({ fontSize: '20px' }),
    requestAnimationFrame() { throw Error('An entrance observer must not schedule frames'); },
    setInterval() { throw Error('An entrance observer must not poll'); }
  });
  if (intersection) win.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe(element) { this.element = element; }
    disconnect() { this.disconnected = true; }
    notify() { this.callback([]); }
  };
  win.ResizeObserver = class {
    constructor(callback) { this.callback = callback; resizers.push(this); }
    observe(root) { this.root = root; }
    disconnect() { this.disconnected = true; }
  };
  const doc = { defaultView: win, documentElement: { clientHeight: height } };
  const element = { ownerDocument: doc, isConnected: true, getBoundingClientRect: () => ({ top }) };
  return { win, element, observers, resizers, setTop(value) { top = value; } };
}

test('entrance waits without frames and preserves the viewport-height trigger line', () => {
  const h = harness(); let calls = 0;
  const stop = observeEntrance(h.element, { onEnter: () => calls++ });
  assert.equal(calls, 0);
  assert.equal(h.observers[0].options.rootMargin, '0px 0px -100px 0px');
  assert.equal(h.observers[0].options.threshold, 0);
  h.setTop(901); h.observers[0].notify(); assert.equal(calls, 0);
  h.setTop(900); h.observers[0].notify(); assert.equal(calls, 1);
  assert.equal(h.observers[0].disconnected, true);
  assert.equal(h.win.count('scroll'), 0);
  assert.equal(h.win.count('resize'), 0);
  h.observers[0].notify(); h.win.fire('scroll'); stop();
  assert.equal(calls, 1);
});

test('SplitText negative root margin retains its existing start position', () => {
  const h = harness(); let calls = 0;
  observeEntrance(h.element, { rootMargin: '-100px', onEnter: () => calls++ });
  assert.equal(h.observers[0].options.rootMargin, '0px 0px -200px 0px');
  h.setTop(801); h.win.fire('scroll'); assert.equal(calls, 0);
  h.setTop(800); h.win.fire('scroll'); assert.equal(calls, 1);
});

test('initial deep links and instant jumps cannot strand passed headings', () => {
  const first = harness({ top: -100 }); let calls = 0;
  observeEntrance(first.element, { onEnter: () => calls++ });
  assert.equal(calls, 1);
  assert.equal(first.win.count('scroll'), 0);
  const skipped = harness();
  observeEntrance(skipped.element, { onEnter: () => calls++ });
  skipped.setTop(-500); skipped.win.fire('scroll');
  assert.equal(calls, 2);
});

test('viewport resizing recalculates pixel margins before entering', () => {
  const h = harness(); let calls = 0;
  const stop = observeEntrance(h.element, { onEnter: () => calls++ });
  h.setTop(470); h.win.innerHeight = 500; h.win.fire('resize');
  assert.equal(h.observers[0].disconnected, true);
  assert.equal(h.observers[1].options.rootMargin, '0px 0px -50px 0px');
  assert.equal(calls, 0);
  h.setTop(450); h.observers[1].notify(); assert.equal(calls, 1);
  stop();
});

test('repeat entrances reverse only after crossing back below the trigger', () => {
  const h = harness(); const log = [];
  const stop = observeEntrance(h.element, {
    once: false, onEnter: () => log.push('play'), onLeaveBack: () => log.push('reverse')
  });
  h.setTop(800); h.win.fire('scroll');
  h.setTop(-400); h.win.fire('scroll');
  h.setTop(1100); h.win.fire('scroll');
  h.setTop(700); h.win.fire('scroll');
  assert.deepEqual(log, ['play', 'reverse', 'play']);
  stop(); h.observers[0].notify();
  assert.equal(h.win.count('scroll'), 0);
});

test('custom scroll roots use their content box and remove root observers', () => {
  const h = harness(); let calls = 0;
  const root = events({ nodeType: 1, clientHeight: 500, clientTop: 2, getBoundingClientRect: () => ({ top: 100 }) });
  const stop = observeEntrance(h.element, { root, onEnter: () => calls++ });
  assert.equal(h.observers[0].options.root, root);
  assert.equal(h.observers[0].options.rootMargin, '0px 0px -50px 0px');
  assert.equal(h.win.count('scroll'), 0);
  h.setTop(553); root.fire('scroll'); assert.equal(calls, 0);
  h.setTop(552); root.fire('scroll'); assert.equal(calls, 1);
  assert.equal(root.count('scroll'), 0);
  assert.equal(h.resizers[0].disconnected, true);
  stop();
});

test('custom root resizing does not keep a stale start line', () => {
  const h = harness(); let calls = 0;
  const root = events({ nodeType: 1, clientHeight: 500, getBoundingClientRect: () => ({ top: 100 }) });
  observeEntrance(h.element, { root, onEnter: () => calls++ });
  root.clientHeight = 900; h.setTop(905); h.resizers[0].callback();
  assert.equal(calls, 1);
  assert.equal(root.count('scroll'), 0);
});

test('missing IntersectionObserver uses event-driven fallback without a poll', () => {
  const h = harness({ intersection: false }); let calls = 0;
  observeEntrance(h.element, { onEnter: () => calls++ });
  assert.equal(h.observers.length, 0);
  h.setTop(800); h.win.fire('scroll'); assert.equal(calls, 1);
  assert.equal(h.win.count('scroll'), 0);
});

test('cancelled or detached observers cannot replay an unmounted entrance', () => {
  const h = harness(); let calls = 0;
  const stop = observeEntrance(h.element, { onEnter: () => calls++ });
  h.element.isConnected = false; h.setTop(200); h.observers[0].notify();
  assert.equal(calls, 0);
  stop(); h.element.isConnected = true; h.observers[0].notify(); h.win.fire('resize');
  assert.equal(calls, 0);
  assert.equal(h.observers.length, 1);
  assert.equal(h.win.count('scroll') + h.win.count('resize'), 0);
});

test('relative margin units are resolved before passing pixel values to the observer', () => {
  for (const [rootMargin, expected] of [['-10%', '-200px'], ['-2em', '-140px'], ['-2rem', '-140px']]) {
    const h = harness();
    const stop = observeEntrance(h.element, { rootMargin });
    assert.equal(h.observers[0].options.rootMargin, '0px 0px ' + expected + ' 0px');
    stop();
  }
});

test('React Bits animations remain real GSAP components without ScrollTrigger side effects', () => {
  const animated = read('src/vendor/AnimatedContent.jsx');
  const split = read('src/vendor/SplitText.jsx');
  const menu = read('src/vendor/StaggeredMenu.jsx');
  for (const code of [animated, split]) {
    assert.doesNotMatch(code, /ScrollTrigger|scrollTrigger|ticker\.(sleep|remove)/);
    assert.match(code, /observeEntrance/);
    assert.match(code, /stopEntrance\(\)/);
  }
  assert.match(animated, /gsap\.context/);
  assert.match(animated, /tl\.fromTo\(targets, from, to/);
  assert.match(split, /new GSAPSplitText/);
  assert.match(split, /paused: trigger !== 'load'/);
  assert.match(split, /onEnter: \(\) => animation\.play\(\)/);
  assert.match(menu, /layerStates.*layers\.map/);
  assert.match(menu, /panelInsertTime/);
  assert.doesNotMatch(read('src/vendor/observeEntrance.mjs'), /\b(requestAnimationFrame|setInterval|setTimeout)\s*\(/);
});
