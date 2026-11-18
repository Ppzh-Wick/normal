// Deferred native snapshots exercise real ownership semantics. This is not a
// substitute for browser layout, touch, or visual snapshot checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createTransitionCoordinator} from '../src/transitionCoordinator.js';
const require = createRequire(import.meta.url);
const {build} = require('esbuild');
const bundled = await build({entryPoints: [new URL('../src/useExhibition.js', import.meta.url).pathname], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react', 'react-dom']});
const flushMicrotasks = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

function deferredTransition(update) {
  let readyResolve, readyReject, updateResolve, updateReject, finishedResolve, finishedReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const updateCallbackDone = new Promise((resolve, reject) => { updateResolve = resolve; updateReject = reject; });
  const finished = new Promise((resolve, reject) => { finishedResolve = resolve; finishedReject = reject; });
  let ran = false;
  return {
    ready, updateCallbackDone, finished, skipped: 0,
    skipTransition() { this.skipped++; readyReject(new Error('Transition skipped')); },
    commit() { if (ran) return; ran = true; try { update(); updateResolve(); } catch (error) { updateReject(error); finishedReject(error); } },
    finish() { readyResolve(); finishedResolve(); },
    rejectReady() { readyReject(new Error('Snapshot unavailable')); },
    rejectUpdate() { const error = new Error('Update failed'); updateReject(error); finishedReject(error); }
  };
}

function harness({desktop = true, reduced = false, native = true} = {}) {
  const names = ['window', 'document', 'location', 'history', 'matchMedia', 'ResizeObserver', 'innerHeight', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const saved = names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  const ids = ['opening', 'life', 'field', 'network'];
  const slots = [], effects = [], listeners = new Map(), frames = new Map(), media = new Map();
  const scrolls = [], focused = [], historyCalls = [], transitions = [];
  let cursor = 0, clock = 1000, scrollIndex = 0, serial = 0, modal = false, mounted = true, nav;
  const nodes = ids.map((id, i) => {
    const heading = {isConnected: true, focus: options => focused.push({id, ...options})};
    return {isConnected: true, offsetHeight: 800,
      getBoundingClientRect: () => ({top: (i - scrollIndex) * 800, bottom: (i - scrollIndex + 1) * 800, height: 800}),
      scrollIntoView(options) { scrollIndex = i; scrolls.push({id, ...options}); },
      querySelector: () => heading};
  });
  const doc = {getElementById: id => nodes[ids.indexOf(id)], querySelector: () => modal || null,
    documentElement: {dataset: {}}, fonts: {ready: Promise.resolve()}};
  if (native) doc.startViewTransition = update => { const transition = deferredTransition(update); transitions.push(transition); return transition; };
  const location = {hash: ''};
  const globals = {
    window: {addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name), scrollBy() {}},
    document: doc, location,
    history: Object.fromEntries(['pushState', 'replaceState'].map(method => [method, (_, unused, hash) => { location.hash = hash; historyCalls.push({method, hash}); }])),
    matchMedia(query) {
      if (!media.has(query)) {
        const callbacks = new Set();
        media.set(query, {matches: query.includes('min-width') ? desktop : reduced, addEventListener: (_, callback) => callbacks.add(callback), removeEventListener: (_, callback) => callbacks.delete(callback), callbacks});
      }
      return media.get(query);
    },
    ResizeObserver: class {observe() {} disconnect() {}}, innerHeight: 800, performance: {now: () => clock},
    requestAnimationFrame: callback => { frames.set(++serial, callback); return serial; }, cancelAnimationFrame: id => frames.delete(id)
  };
  for (const [name, value] of Object.entries(globals)) Object.defineProperty(globalThis, name, {configurable: true, writable: true, value});
  const changed = (old, deps) => !old || !deps || deps.some((value, i) => value !== old.deps[i]);
  const react = {
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = {value: typeof initial === 'function' ? initial() : initial}; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ??= {current: initial}; },
    useCallback(callback, deps) { const i = cursor++; if (changed(slots[i], deps)) slots[i] = {deps, callback}; return slots[i].callback; },
    useEffect(callback, deps) { const i = cursor++; if (changed(slots[i], deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = {deps, cleanup: callback()}; }); }
  };
  const module = {exports: {}};
  new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(name => name === 'react' ? react : {flushSync: callback => callback()}, module, module.exports);
  const render = () => { cursor = 0; nav = module.exports.default(ids); effects.splice(0).forEach(effect => effect()); return nav; };
  const unmount = () => { if (!mounted) return; mounted = false; slots.forEach(slot => slot?.cleanup?.()); };
  render();
  return {get nav() { return nav; }, render, nodes, doc, frames, scrolls, focused, historyCalls, transitions,
    advance: amount => { clock += amount; },
    flushFrames() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(clock)); },
    setModal: value => { modal = value; },
    restoreHash(hash) { location.hash = hash; listeners.get('popstate')?.(); },
    setMedia(type, value) { const item = [...media].find(([query]) => query.includes(type))[1]; item.matches = value; item.callbacks.forEach(callback => callback()); render(); },
    wheel(overrides = {}) { const event = {deltaX: 0, deltaY: 100, deltaMode: 0, ctrlKey: false, metaKey: false, target: {closest: () => null}, prevented: false, preventDefault() { this.prevented = true; }, ...overrides}; listeners.get('wheel')?.(event); return event; },
    key(key) { listeners.get('keydown')?.({key, repeat: false, target: {closest: () => null}, preventDefault() {}}); },
    unmount,
    dispose() { unmount(); for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } }
  };
}
async function withHarness(options, run) {
  const h = harness(options);
  try { await run(h); await flushMicrotasks(); } finally { h.dispose(); }
}

test('deferred A→B commits, URL, direction, and focus belong only to the latest chapter', async () => {
  await withHarness({}, async h => {
    const a = h.nav.go(3, {historyMode: 'push', focus: true});
    const b = h.nav.go(1, {historyMode: 'push', focus: true});
    assert.equal(h.transitions[0].skipped, 1);
    assert.equal(h.doc.documentElement.dataset.navDirection, 'forward', 'direction compares with committed opening, not pending chapter 3');
    h.transitions[0].commit();
    assert.deepEqual(h.scrolls, []);
    h.transitions[1].commit();
    assert.equal(await a, false); assert.equal(await b, true);
    h.flushFrames();
    assert.deepEqual(h.scrolls.map(item => item.id), ['life']);
    assert.deepEqual(h.historyCalls, [{method: 'pushState', hash: '#life'}]);
    assert.deepEqual(h.focused, [{id: 'life', preventScroll: true}]);
    h.transitions[0].finish(); await flushMicrotasks();
    assert.equal(h.doc.documentElement.dataset.transitionKind, 'chapter', 'old cleanup cannot remove the current owner metadata');
    h.transitions[1].finish(); await flushMicrotasks();
    assert.deepEqual(h.doc.documentElement.dataset, {});
  });
});

test('a newer navigation cancels heading focus already queued by a completed commit', async () => {
  await withHarness({}, async h => {
    const first = h.nav.go(1, {focus: true}); h.transitions[0].commit();
    assert.equal(await first, true); assert.equal(h.frames.size, 1);
    const next = h.nav.go(2, {focus: true});
    h.flushFrames(); assert.deepEqual(h.focused, []);
    h.transitions[1].commit(); assert.equal(await next, true);
    h.flushFrames(); assert.deepEqual(h.focused.map(item => item.id), ['field']);
    h.transitions.forEach(transition => transition.finish());
  });
});

test('ready rejection does not lose a valid update and update rejection returns a safe false', async () => {
  await withHarness({}, async h => {
    const result = h.nav.go(1);
    h.transitions[0].rejectReady(); h.transitions[0].commit(); h.transitions[0].finish();
    assert.equal(await result, true);
    const failed = h.nav.go(2); h.transitions[1].rejectUpdate();
    assert.equal(await failed, false); await flushMicrotasks();
    assert.deepEqual(h.doc.documentElement.dataset, {});
    assert.deepEqual(h.scrolls.map(item => item.id), ['life']);
  });
});

test('explicit cancellation settles pending callers and cannot later scroll or focus', async () => {
  await withHarness({}, async h => {
    const result = h.nav.go(1, {focus: true});
    h.nav.cancelPending(); assert.equal(await result, false);
    h.transitions[0].commit(); h.transitions[0].finish();
    await flushMicrotasks(); h.flushFrames();
    assert.deepEqual(h.scrolls, []); assert.deepEqual(h.focused, []);
    h.wheel(); assert.equal(h.transitions.length, 2, 'cancellation releases the lock immediately');
    h.transitions[1].commit(); h.transitions[1].finish();
  });
});

for (const change of ['free', 'Escape', 'mobile', 'reduced', 'unmount']) {
  test(`${change} cancels a captured but uncommitted chapter`, async () => {
    await withHarness({}, async h => {
      const result = h.nav.go(1, {focus: true});
      if (change === 'free') { h.nav.setGuided(false); h.render(); }
      if (change === 'Escape') { h.key('Escape'); h.render(); }
      if (change === 'mobile') h.setMedia('min-width', false);
      if (change === 'reduced') h.setMedia('prefers-reduced-motion', true);
      if (change === 'unmount') h.unmount();
      assert.equal(await result, false);
      h.transitions[0].commit(); h.transitions[0].finish();
      await flushMicrotasks(); h.flushFrames();
      assert.deepEqual(h.scrolls, []); assert.deepEqual(h.focused, []);
      assert.deepEqual(h.doc.documentElement.dataset, {});
    });
  });
}

test('wheel lock remains fixed at 380ms despite repeated momentum events', async () => {
  await withHarness({}, async h => {
    h.wheel(); h.transitions[0].commit();
    for (let i = 0; i < 3; i++) { h.advance(100); assert.equal(h.wheel().prevented, true); assert.equal(h.transitions.length, 1); }
    h.advance(90); h.wheel(); assert.equal(h.transitions.length, 2);
    h.transitions[1].commit(); h.transitions.forEach(transition => transition.finish());
    assert.deepEqual(h.scrolls.map(item => item.id), ['life', 'field']);
    await flushMicrotasks(); h.flushFrames(); assert.deepEqual(h.focused, [], 'wheel navigation never steals focus');
  });
});

test('modal opened before the focus frame retains focus and reduced/fallback navigation remains usable', async () => {
  await withHarness({}, async h => {
    const result = h.nav.go(1, {focus: true}); h.transitions[0].commit(); await result;
    h.setModal(true); h.flushFrames(); assert.deepEqual(h.focused, []); h.transitions[0].finish();
  });
  for (const options of [{reduced: true}, {native: false}]) {
    await withHarness(options, async h => {
      assert.equal(await h.nav.go(1, {focus: true}), true);
      h.flushFrames(); assert.deepEqual(h.focused.map(item => item.id), ['life']);
      assert.equal(h.transitions.length, 0); assert.equal(h.scrolls[0].behavior, 'instant');
    });
  }
});

test('shared coordinator invalidates foreign work and owns metadata without touching a newer owner', async () => {
  const jobs = [], doc = {documentElement: {dataset: {}}, startViewTransition(update) { const job = deferredTransition(update); jobs.push(job); return job; }};
  const coordinator = createTransitionCoordinator(() => doc);
  const updates = []; let cancelled = 0;
  const chapter = coordinator.runTransition({kind: 'chapter', direction: 'forward', update: () => updates.push('chapter'), onCancel: () => cancelled++});
  const artifact = coordinator.runTransition({kind: 'artifact', update: () => updates.push('artifact')});
  assert.equal(cancelled, 1); assert.equal(await chapter.committed, false);
  jobs[0].commit(); jobs[0].finish(); jobs[1].commit();
  assert.equal(await artifact.committed, true); assert.deepEqual(updates, ['artifact']);
  await flushMicrotasks(); assert.deepEqual(doc.documentElement.dataset, {transitionKind: 'artifact'});
  jobs[1].finish(); await artifact.finished;
  assert.equal(artifact.isCurrent(), true);
  coordinator.cancelPendingTransition(); assert.equal(artifact.isCurrent(), false, 'global interruption also invalidates post-finish focus');
});

test('synchronous native failure falls back once and no-animation update exceptions resolve safely', async () => {
  const doc = {documentElement: {dataset: {}}, startViewTransition() { throw new Error('Unsupported'); }};
  const coordinator = createTransitionCoordinator(() => doc);
  let updates = 0;
  const fallback = coordinator.runTransition({kind: 'chapter', update: () => updates++});
  assert.equal(await fallback.committed, true); assert.equal(await fallback.finished, true); assert.equal(updates, 1);
  const failed = coordinator.runTransition({kind: 'artifact', animate: false, update() { throw new Error('Commit failed'); }});
  assert.equal(await failed.committed, false); assert.equal(await failed.finished, false);
  assert.deepEqual(doc.documentElement.dataset, {});
});


test('Back/Forward restoration immediately supersedes a pending visual navigation', async () => {
  await withHarness({}, async h => {
    const pending = h.nav.go(3, {historyMode: 'push', focus: true});
    h.restoreHash('#field');
    assert.equal(await pending, false);
    h.transitions[0].commit(); h.transitions[0].finish();
    await flushMicrotasks(); h.flushFrames();
    assert.deepEqual(h.scrolls, [{id: 'field', behavior: 'instant', block: 'start'}]);
    assert.deepEqual(h.historyCalls, [], 'restoration does not write another history entry');
    assert.deepEqual(h.focused, [], 'restoration does not steal focus');
  });
});

test('mode cancellation after commit stops remaining decoration/focus without rolling back content', async () => {
  await withHarness({}, async h => {
    const result = h.nav.go(1, {focus: true}); h.transitions[0].commit();
    assert.equal(await result, true);
    h.nav.setGuided(false); h.render();
    h.transitions[0].finish(); await flushMicrotasks(); h.flushFrames();
    assert.equal(h.transitions[0].skipped, 1);
    assert.deepEqual(h.scrolls.map(item => item.id), ['life']);
    assert.deepEqual(h.focused, []);
    assert.equal(h.wheel().prevented, false, 'free reading immediately restores native wheel scrolling');
    assert.deepEqual(h.doc.documentElement.dataset, {});
  });
  await withHarness({desktop: false}, async h => {
    assert.equal(h.wheel().prevented, false);
    assert.equal(h.transitions.length, 0);
    assert.deepEqual(h.scrolls, []);
  });
});


function modalFixture() {
  const callbacks = new Set();
  return {addEventListener: (_, callback) => callbacks.add(callback), removeEventListener: (_, callback) => callbacks.delete(callback),
    close() { [...callbacks].forEach(callback => callback()); }, get listeners() { return callbacks.size; }};
}

test('chapter-menu closure after commit still delivers requested heading focus', async () => {
  await withHarness({}, async h => {
    const menu = modalFixture(); h.setModal(menu);
    const result = h.nav.go(1, {focus: true}); h.transitions[0].commit();
    assert.equal(await result, true);
    assert.equal(h.frames.size, 0); assert.equal(menu.listeners, 1);
    h.setModal(false); menu.close(); h.flushFrames();
    assert.deepEqual(h.focused, [{id: 'life', preventScroll: true}]);
    assert.equal(menu.listeners, 0); h.transitions[0].finish();
  });
});

test('a new or reopened modal never loses focus to a closing menu navigation', async () => {
  for (const reopened of [false, true]) {
    await withHarness({}, async h => {
      const menu = modalFixture(); h.setModal(menu);
      const result = h.nav.go(1, {focus: true}); h.transitions[0].commit(); await result;
      h.setModal(reopened ? menu : modalFixture()); menu.close(); h.flushFrames();
      assert.deepEqual(h.focused, []); assert.equal(menu.listeners, 0);
      h.transitions[0].finish();
    });
  }
});

test('newer navigation removes a pending menu-close focus listener', async () => {
  await withHarness({}, async h => {
    const menu = modalFixture(); h.setModal(menu);
    const first = h.nav.go(1, {focus: true}); h.transitions[0].commit(); await first;
    assert.equal(menu.listeners, 1);
    h.setModal(false);
    const next = h.nav.go(2, {focus: true});
    assert.equal(menu.listeners, 0); menu.close();
    h.transitions[1].commit(); await next; h.flushFrames();
    assert.deepEqual(h.focused.map(item => item.id), ['field']);
    h.transitions.forEach(transition => transition.finish());
  });
});
