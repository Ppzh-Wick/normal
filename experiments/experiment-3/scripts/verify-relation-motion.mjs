import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Run from experiments/experiment-3 after npm run build.
// npm install --no-save --package-lock=false playwright && npx playwright install chromium
// node scripts/verify-relation-motion.mjs
// Keep verify-pair-focus.mjs as a separate, unchanged interaction regression suite.
// Playwright and its Chromium browser must already be installed by CI.
// This script only reads the built application. Reports stay in this workspace.
const origin = 'http://127.0.0.1:4174';
const output = path.resolve('review/relation-motion');
const results = [];
const screenshots = [];
const browserEvents = [];
const serverOutput = [];
const startedAt = new Date().toISOString();
let browser;
let server;
let serverFailure;
let currentPage;
let currentCase = 'startup';

const overviewIds = [
  'stille', 'chang-longqing', 'wu-yansheng', 'guo-lingzhi',
  'zhou-tingru', 'ye-lianjun', 'shi-yafeng', 'xu-kaili',
  'henan', 'berlin', 'chongqing', 'chengdu', 'jialing', 'longmen',
  'sichuan-map', 'tectonics-textbook', 'arnold-heim', 'yuan-jianqi',
  'li-siguang', 'li-yongzhao', 'lu-dengshi', 'central-university',
  'geography-institute', 'petroleum-geology',
];
const categories = [
  { label: '人物往来', name: '汉斯·施蒂勒', count: 8 },
  { label: '求学任教', name: '柏林大学', count: 6 },
  { label: '山川考察', name: '嘉陵江流域考察', count: 2 },
  { label: '成果与建设', name: '四川大地构造图', count: 3 },
];

async function eventually(description, operation, timeout = 10000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try { return await operation(); }
    catch (error) { lastError = error; }
    // Bounded condition polling, not a fixed sleep to hide rendering races.
    await delay(80);
  }
  throw new Error(description + ': ' + (lastError?.message || 'timed out'), { cause: lastError });
}

function watchPage(page, label) {
  page.on('pageerror', error => browserEvents.push({
    page: label, case: currentCase, kind: 'pageerror', message: error.message,
  }));
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') {
      browserEvents.push({
        page: label, case: currentCase, kind: 'console-' + message.type(),
        message: message.text(), location: message.location(),
      });
    }
  });
  page.on('requestfailed', request => browserEvents.push({
    page: label, case: currentCase, kind: 'requestfailed',
    url: request.url(), message: request.failure()?.errorText,
  }));
  page.on('response', response => {
    if (response.status() >= 400) browserEvents.push({
      page: label, case: currentCase, kind: 'http-error',
      status: response.status(), url: response.url(),
    });
  });
}

async function openNetwork(page) {
  currentPage = page;
  await page.goto(origin + '/#network', { waitUntil: 'domcontentloaded' });
  await page.locator('#network .atlas-complete-network').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const el = document.querySelector('#network .atlas-atlas');
    return el && el.getBoundingClientRect().width > 0 &&
      document.querySelectorAll('#network .atlas-complete-network .atlas-node').length === 24;
  });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.locator('#network .atlas-atlas').scrollIntoViewIfNeeded();
}

function nodeById(page, id) {
  return page.locator('#network .atlas-complete-network .atlas-node[data-relation-id="' + id + '"]');
}

async function keyboardChoose(page, locator) {
  // Some overview nodes are deliberately clipped while the graph is panned.
  // Focus the real accessible SVG button without scrolling the graph, then send
  // a real keyboard event. Do not call React handlers or fabricate selection.
  await locator.evaluate(el => el.focus({ preventScroll: true }));
  await page.keyboard.press('Enter');
}

async function graphState(page) {
  return page.locator('#network .atlas-atlas').evaluate(atlas => {
    const svg = atlas.querySelector('svg.atlas-complete-network, svg.atlas-network');
    function scale(el) {
      if (!el) return null;
      const transform = getComputedStyle(el).transform;
      if (transform === 'none') return 1;
      const m = new DOMMatrixReadOnly(transform);
      return Math.hypot(m.a, m.b);
    }
    const nodes = [...svg.querySelectorAll('g.atlas-node')].map(node => {
      const style = getComputedStyle(node);
      return {
        id: node.dataset.relationId || null,
        label: node.getAttribute('aria-label'),
        selected: node.getAttribute('aria-pressed') === 'true',
        defocused: node.classList.contains('is-defocused'),
        focused: node === document.activeElement,
        focusVisible: node.matches(':focus-visible'),
        scale: scale(node),
        portraitScale: scale(node.querySelector('g.atlas-node-portrait')),
        opacity: Number(style.opacity),
        filter: style.filter,
      };
    });
    const camera = svg.querySelector('.atlas-camera');
    const evidence = atlas.querySelector('.atlas-evidence');
    return {
      nodes,
      coreCount: svg.querySelectorAll('g.atlas-core-portrait').length,
      coreScale: scale(svg.querySelector('g.atlas-core-portrait')),
      cameraScale: scale(camera),
      cameraTransform: camera?.getAttribute('transform'),
      hasFocus: atlas.classList.contains('atlas-has-focus'),
      dialogOpen: evidence?.tagName === 'DIALOG' && evidence.open,
      dialogModal: !!evidence?.matches('dialog:modal'),
      dialogName: evidence?.getAttribute('aria-label'),
      focusInEvidence: evidence?.contains(document.activeElement),
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      galaxyCanvases: document.querySelectorAll('.galaxy-atmosphere canvas').length,
    };
  });
}

const closeTo = (actual, expected, label, tolerance = 0.018) =>
  assert.ok(actual !== null && Math.abs(actual - expected) < tolerance,
    label + ': expected ' + expected + ', received ' + actual);

async function assertSelection(page, expected, { mobile = false, expectedCount } = {}) {
  return eventually('selected pair renders correctly', async () => {
    const state = await graphState(page);
    if (expectedCount !== undefined) assert.equal(state.nodes.length, expectedCount);
    const selected = state.nodes.filter(n => n.selected);
    assert.equal(selected.length, 1, 'exactly one selected graph node');
    assert.ok(expected.id ? selected[0].id === expected.id : selected[0].label.startsWith(expected.name + '，'),
      'the intended record is selected');
    assert.equal(state.hasFocus, true);
    assert.equal(state.coreCount, 1, 'one central portrait wrapper');
    closeTo(state.coreScale, 1.22, 'central portrait scale');
    closeTo(state.cameraScale, 1, 'selection must not magnify the whole graph');
    assert.equal(state.dialogOpen, true);
    assert.equal(state.dialogModal, mobile, 'modal only below desktop breakpoint');
    for (const node of state.nodes) {
      closeTo(node.scale, 1, 'whole node must not grow: ' + node.label);
      closeTo(node.portraitScale, node.selected ? 1.55 : 1, 'portrait: ' + node.label);
      assert.equal(node.defocused, !node.selected, 'selection-only defocus class: ' + node.label);
      if (node.selected) {
        closeTo(node.opacity, 1, 'selected opacity');
        assert.ok(!/blur\((?!0(?:px)?\))/.test(node.filter), 'selected record remains sharp');
      } else if (!node.focusVisible) {
        assert.ok(node.opacity >= 0.25 && node.opacity <= 0.4,
          'unselected node is visibly dimmed: ' + node.opacity);
        if (mobile) assert.ok(node.filter === 'none' || node.filter === 'blur(0px)',
          'mobile uses opacity rather than a blur filter');
        else assert.ok(/blur\(/.test(node.filter) && parseFloat(node.filter.match(/blur\(([\d.]+)/)?.[1]) >= 0.65,
          'unselected desktop node is blurred: ' + node.filter);
      }
    }
    return state;
  });
}

async function assertRestored(page, cameraTransform) {
  return eventually('closing restores graph', async () => {
    const state = await graphState(page);
    assert.equal(state.hasFocus, false);
    assert.equal(state.dialogOpen, false);
    assert.equal(state.nodes.filter(n => n.selected).length, 0);
    assert.equal(state.nodes.filter(n => n.defocused).length, 0);
    closeTo(state.coreScale, 1, 'restored central portrait');
    for (const node of state.nodes) {
      closeTo(node.portraitScale, 1, 'restored portrait: ' + node.label);
      assert.ok(node.filter === 'none' || node.filter === 'blur(0px)', 'restored node sharpness');
    }
    if (cameraTransform !== undefined) assert.equal(state.cameraTransform, cameraTransform);
    return state;
  });
}

async function closeDetail(page, { escape = false, opener } = {}) {
  if (escape) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: '关闭关系详情', exact: true }).click();
  await assertRestored(page);
  if (opener) await eventually('focus returns to opener', async () =>
    assert.equal(await opener.evaluate(el => el === document.activeElement), true));
}

async function screenshot(page, name) {
  const file = name + '.jpg';
  await page.screenshot({ path: path.join(output, file), fullPage: false, type: 'jpeg', quality: 65, animations: 'allow' });
  screenshots.push(file);
}

async function pointerClickNode(page, id, otherThan) {
  // Find a genuine hit-testable portrait center. This neither scrolls clipped
  // nodes into view nor bypasses overlays/visibility with a forced click.
  const point = await page.locator('#network .atlas-complete-network').evaluate((svg, args) => {
    const canvas = svg.closest('.atlas-canvas').getBoundingClientRect();
    for (const node of svg.querySelectorAll('.atlas-node')) {
      if (args.id && node.dataset.relationId !== args.id) continue;
      if (args.otherThan && node.dataset.relationId === args.otherThan) continue;
      const portrait = node.querySelector('.atlas-node-portrait');
      const r = portrait?.getBoundingClientRect();
      if (!r) continue;
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      if (x < canvas.left + 6 || x > canvas.right - 6 || y < canvas.top + 6 ||
          y > canvas.bottom - 6 || x < 0 || x >= innerWidth || y < 80 || y >= innerHeight - 75) continue;
      if (document.elementFromPoint(x, y)?.closest('.atlas-node') === node) {
        return { x, y, id: node.dataset.relationId };
      }
    }
    return null;
  }, { id, otherThan });
  assert.ok(point, 'a visible portrait must be pointer-accessible');
  await page.mouse.click(point.x, point.y);
  return point.id;
}

async function check(name, operation) {
  currentCase = name;
  const begin = Date.now();
  try {
    await operation();
    results.push({ name, status: 'passed', durationMs: Date.now() - begin });
  } catch (error) {
    results.push({ name, status: 'failed', durationMs: Date.now() - begin, error: error.stack || String(error) });
    if (currentPage && !currentPage.isClosed()) {
      try { motionSamples.push({ case: name, label: 'failure-native-state', ...await motionState(currentPage) }); } catch { /* Keep the original failure. */ }
    }
    if (currentPage && !currentPage.isClosed()) {
      const safeName = 'failure-' + name.replace(/[^a-z0-9-]+/gi, '-').slice(0, 75);
      try { await screenshot(currentPage, safeName); } catch { /* Original failure remains primary. */ }
      try {
        await writeFile(path.join(output, safeName + '.json'), JSON.stringify(await graphState(currentPage), null, 2));
      } catch { /* The failed page may not have initialized. */ }
    }
  }
}


// Observe native browser work without scheduling a monitor RAF or changing app code.
const motionSamples = [];
const idleSamples = [];
const auditExports = [];
const trackedPages = [];
function installMotionAudit() {
  const nativeRAF = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const pending = new Map();
  const raf = { requested: 0, fired: 0, cancelled: 0, sources: [] };
  const created = [];
  const transitions = [];
  window.requestAnimationFrame = function (callback) {
    raf.requested += 1;
    let source = null;
    if (raf.sources.length < 18) {
      source = String(new Error().stack || '').split('\n').slice(2, 6).join('\n');
      if (!raf.sources.includes(source)) raf.sources.push(source);
    }
    let id;
    id = nativeRAF(time => {
      pending.delete(id);
      raf.fired += 1;
      callback.call(window, time);
    });
    pending.set(id, source);
    return id;
  };
  window.cancelAnimationFrame = function (id) {
    if (pending.delete(id)) raf.cancelled += 1;
    return nativeCancel(id);
  };
  const nativeAnimate = Element.prototype.animate;
  Element.prototype.animate = function (frames, timing) {
    const animation = nativeAnimate.call(this, frames, timing);
    const record = {
      part: this.dataset.echoPart || null,
      selected: document.querySelector('.atlas-node[aria-pressed="true"]')?.dataset.relationId || null,
      started: performance.now(), finished: null, cancelled: null,
      frames: animation.effect.getKeyframes(),
      timing: animation.effect.getTiming(),
      animation,
    };
    created.push(record);
    animation.addEventListener('finish', () => { record.finished = performance.now(); }, { once: true });
    animation.addEventListener('cancel', () => { record.cancelled = performance.now(); }, { once: true });
    return animation;
  };
  if (typeof document.startViewTransition === 'function') {
    const nativeStart = document.startViewTransition.bind(document);
    document.startViewTransition = function (...args) {
      const native = nativeStart(...args);
      const entry = {
        kind: document.documentElement.dataset.transitionKind || null,
        started: performance.now(), ready: null, committed: null, finished: null,
        readyError: null, finishedError: null,
      };
      transitions.push(entry);
      native.ready.then(() => { entry.ready = performance.now(); },
        error => { entry.readyError = error.name; });
      native.updateCallbackDone.then(() => { entry.committed = performance.now(); }, () => {});
      native.finished.then(() => { entry.finished = performance.now(); },
        error => { entry.finished = performance.now(); entry.finishedError = error.name; });
      return native;
    };
  }
  window.__relationMotionAudit = {
    snapshot() {
      return {
        now: performance.now(),
        raf: { ...raf, pending: pending.size, pendingSources: [...pending.values()].filter(Boolean) },
        created: created.map(({ animation, ...record }) => ({
          ...record, state: animation.playState, pending: animation.pending,
          currentTime: typeof animation.currentTime === 'number' ? animation.currentTime : null,
        })),
        transitions: transitions.map(record => ({ ...record })),
      };
    },
  };
}

async function motionState(page) {
  return page.evaluate(() => {
    const atlas = document.querySelector('#network .atlas-atlas');
    const panel = atlas?.querySelector('.atlas-evidence');
    const nodes = [...(atlas?.querySelectorAll('[data-echo-part]') || [])];
    const animations = document.getAnimations().map(animation => {
      const target = animation.effect?.target;
      const timing = animation.effect?.getComputedTiming();
      return {
        part: target?.dataset?.echoPart || null,
        target: target?.tagName + '.' + (target?.getAttribute?.('class') || ''),
        name: animation.animationName || animation.transitionProperty || '',
        pseudo: animation.effect?.pseudoElement || null,
        state: animation.playState, pending: animation.pending,
        currentTime: typeof animation.currentTime === 'number' ? animation.currentTime : null,
        duration: Number.isFinite(timing?.duration) ? timing.duration : String(timing?.duration),
        progress: timing?.progress, iterations: timing?.iterations === Infinity ? 'Infinity' : timing?.iterations,
      };
    });
    const parts = nodes.map(node => {
      const style = getComputedStyle(node), r = node.getBoundingClientRect();
      return {
        part: node.dataset.echoPart, opacity: Number(style.opacity),
        transform: style.transform, dash: parseFloat(style.strokeDashoffset),
        display: style.display, visibility: style.visibility,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        pointerEvents: style.pointerEvents,
      };
    });
    return {
      ...window.__relationMotionAudit.snapshot(),
      marker: atlas?.getAttribute('data-relation-echo') || null,
      parts, animations,
      transitionKind: document.documentElement.dataset.transitionKind || null,
      direction: document.documentElement.dataset.navDirection || null,
      currentChapter: document.querySelector('section.chapter.is-current')?.id || null,
      hash: location.hash,
      documentHidden: document.hidden,
      focused: document.activeElement?.getAttribute('aria-label') || document.activeElement?.id || null,
      focusInEvidence: !!panel?.contains(document.activeElement),
      dialogOpen: !!panel?.open,
      dialogModal: !!panel?.matches('dialog:modal'),
      width: innerWidth, documentWidth: document.documentElement.scrollWidth,
    };
  });
}

const echoRecords = state => state.created.filter(record => record.part);
const live = state => state.animations.filter(animation =>
  animation.state === 'running' || animation.state === 'paused' || animation.pending);
const activeEcho = state => live(state).filter(animation => animation.part);
const part = (state, name) => state.parts.find(item => item.part === name);
const noTransform = transform => transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)';

async function recordState(page, label) {
  const state = await motionState(page);
  motionSamples.push({ case: currentCase, label, ...state });
  return state;
}
async function expectEchoStarted(page, expected = 4) {
  return eventually('finite selection effect actually starts', async () => {
    const state = await motionState(page);
    assert.equal(state.marker, 'running');
    assert.equal(activeEcho(state).length, expected);
    return state;
  }, 1800);
}
async function expectEchoReleased(page, timeout = 1800) {
  return eventually('selection score releases every native effect', async () => {
    const state = await motionState(page);
    assert.equal(state.marker, null);
    assert.deepEqual(state.animations.filter(animation => animation.part), []);
    assert.ok(echoRecords(state).every(record => record.state === 'idle'),
      'completed/cancelled animation handles are idle, not retained in a fill state');
    for (const name of ['line', 'halo']) {
      const accent = part(state, name);
      if (accent && accent.display !== 'none') assert.equal(accent.opacity, 0,
        name + ' is invisible when the finite score is over');
    }
    const sheet = part(state, 'sheet');
    if (sheet) {
      assert.equal(sheet.opacity, 1, 'evidence remains fully readable');
      assert.ok(noTransform(sheet.transform), 'paper returns to its static transform');
    }
    return state;
  }, timeout);
}
async function expectIdle(page, label) {
  // A long startup wait is bounded by the requirement to establish true rest.
  // Polling is in Node. No page RAF, screenshot fast-forward, or animation mocking.
  await eventually('all browser animation work reaches idle: ' + label, async () => {
    const state = await motionState(page);
    assert.equal(state.documentHidden, false, 'idle budget must be measured in a visible foreground page');
    assert.equal(state.raf.pending, 0, 'pending RAF: ' + JSON.stringify(state.raf));
    assert.deepEqual(live(state), [], 'no running/paused/infinite native animation');
    assert.equal(state.marker, null);
    assert.equal(state.transitionKind, null);
    assert.equal(state.direction, null);
  }, 10000);
  const before = await motionState(page);
  await delay(900);
  const after = await motionState(page);
  idleSamples.push({ case: currentCase, label, windowMs: after.now - before.now,
    before: before.raf, after: after.raf, activeAnimations: live(after) });
  assert.equal(after.documentHidden, false, 'a background-throttled page is not valid idle evidence');
  assert.equal(after.raf.requested, before.raf.requested, 'no new RAF requests during idle window');
  assert.equal(after.raf.fired, before.raf.fired, 'zero RAF callbacks during idle window');
  assert.equal(after.raf.pending, 0, 'no scheduled RAF retained after idle window');
  assert.deepEqual(live(after), [], 'no animations restart during idle window');
}
function assertFinite(records, { mobile = false } = {}) {
  assert.deepEqual(records.map(record => record.part).sort(),
    mobile ? ['sheet'] : ['halo', 'line', 'sheet', 'thread']);
  for (const record of records) {
    assert.equal(record.timing.iterations, 1);
    assert.equal(record.timing.fill, 'backwards', 'only delay fill is allowed');
    const end = Number(record.timing.duration) + Number(record.timing.delay);
    assert.ok(end > 0 && end <= (mobile ? 160 : 750), 'bounded duration: ' + end);
    assert.ok(!record.frames.some(frame => 'filter' in frame), 'do not animate expensive blur');
  }
}
async function openFresh(page, hash = 'network') {
  currentPage = page;
  await page.bringToFront();
  if (hash === 'network') await openNetwork(page);
  else {
    await page.goto(origin + '/#' + hash, { waitUntil: 'domcontentloaded' });
    await page.locator('.relation-echo-experiment #' + hash).waitFor({ state: 'visible' });
    await eventually('requested chapter restored', async () =>
      assert.equal((await motionState(page)).currentChapter, hash));
    await page.evaluate(async () => { await document.fonts.ready; });
  }
  assert.equal(await page.locator('.relation-echo-experiment').count(), 1,
    'test the intended experiment, not a stale experiment-2 build');
  await expectEchoReleased(page);
}
async function chooseAndStart(page, id, expected = 4) {
  const before = echoRecords(await motionState(page)).length;
  await keyboardChoose(page, nodeById(page, id));
  const state = await expectEchoStarted(page, expected);
  return { before, state, records: echoRecords(state).slice(before) };
}
async function expectChapterDone(page, chapter) {
  return eventually('chapter settles without stale metadata', async () => {
    const state = await motionState(page);
    assert.equal(state.currentChapter, chapter);
    assert.equal(state.hash.split('?')[0], '#' + chapter);
    assert.equal(state.transitionKind, null);
    assert.equal(state.direction, null);
    assert.ok(!live(state).some(animation =>
      animation.pseudo?.includes('view-transition') || animation.name.startsWith('echo-room')));
    return state;
  }, 3000);
}
async function beginChapter(page, chapter, direction = 'forward') {
  await page.locator('.contour-wayfinder a[href="#' + chapter + '"]').click();
  return eventually('chapter depth transition is visible', async () => {
    const state = await motionState(page);
    assert.equal(state.transitionKind, 'chapter');
    assert.equal(state.direction, direction);
    const rootMotion = live(state).filter(animation => animation.name.startsWith('echo-room'));
    assert.equal(rootMotion.length, 2, 'old and new root snapshots animate');
    assert.ok(rootMotion.every(animation => animation.iterations === 1 &&
      animation.duration > 0 && animation.duration <= 520));
    return state;
  }, 2000);
}
async function makePage(label, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference', ...options,
  });
  context.setDefaultTimeout(10000);
  await context.addInitScript(installMotionAudit);
  const page = await context.newPage();
  trackedPages.push({ label, page, context });
  watchPage(page, label);
  return page;
}

await mkdir(output, { recursive: true });
try {
  server = spawn('npm', ['run', 'preview', '--', '--port', '4174', '--strictPort'], {
    cwd: process.cwd(), detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, BROWSER: 'none' },
  });
  server.on('error', error => { serverFailure = error; });
  server.on('exit', (code, signal) => {
    serverFailure = new Error('Preview exited: ' + code + ' / ' + signal);
  });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on('data', chunk => { serverOutput.push(String(chunk)); });
  }
  await eventually('Vite preview is ready', async () => {
    if (serverFailure) throw serverFailure;
    const response = await fetch(origin, { signal: AbortSignal.timeout(1200) });
    assert.equal(response.status, 200);
  }, 20000);
  browser = await chromium.launch({ headless: true });
  const page = await makePage('desktop-1440');

  await check('desktop-baseline-has-no-continuous-raf', async () => {
    await openFresh(page);
    await assertRestored(page);
    await expectIdle(page, 'network baseline');
    await screenshot(page, 'desktop-overview');
  });

  await check('desktop-selection-paints-and-releases-four-finite-effects', async () => {
    await openFresh(page);
    const { records } = await chooseAndStart(page, 'shi-yafeng');
    assertFinite(records);
    const first = await eventually('line and halo become genuinely visible', async () => {
      const state = await motionState(page);
      assert.ok(part(state, 'line').opacity > .03, 'line must actually paint');
      assert.ok(part(state, 'halo').opacity > .03, 'halo must actually paint');
      for (const name of ['line', 'halo']) {
        const accent = part(state, name), r = accent.rect;
        assert.notEqual(accent.display, 'none');
        assert.notEqual(accent.visibility, 'hidden');
        assert.ok(r.width > 0 && r.height > 0 && r.x < 1440 && r.y < 1000 &&
          r.x + r.width > 0 && r.y + r.height > 0, name + ' is inside the visible viewport');
      }
      assert.ok(part(state, 'sheet').opacity >= .67, 'paper stays readable throughout');
      assert.ok(!noTransform(part(state, 'sheet').transform), 'paper has an actual depth transform');
      return state;
    }, 700);
    motionSamples.push({ case: currentCase, label: 'first-painted-frame', ...first });
    await delay(100);
    const second = await recordState(page, 'later-painted-frame');
    assert.ok(part(second, 'line').dash < part(first, 'line').dash,
      'rendered line advances; a running marker alone is insufficient');
    assert.notEqual(part(second, 'halo').transform, part(first, 'halo').transform,
      'rendered halo expands rather than only reporting a nominal animation');
    assert.ok(part(second, 'sheet').opacity >= part(first, 'sheet').opacity);
    assert.notEqual(part(second, 'sheet').transform, part(first, 'sheet').transform);
    assert.equal(second.dialogOpen, true);
    assert.equal(second.dialogModal, false);
    assert.equal(second.focusInEvidence, true, 'reading focus is available during animation');
    const retainedLink = await page.locator('.atlas-radial-link.is-active .atlas-complete-edge').evaluate(el => {
      const s = getComputedStyle(el);
      return { opacity: Number(s.opacity), dash: s.strokeDasharray, visibility: s.visibility, length: el.getTotalLength() };
    });
    assert.ok(retainedLink.opacity > 0 && retainedLink.length > 0 && retainedLink.visibility !== 'hidden',
      'source-backed relation remains present under the decorative drawing');
    const threadFrame = await eventually('evidence thread actually draws after its delay', async () => {
      const state = await motionState(page);
      assert.ok(activeEcho(state).some(animation => animation.part === 'thread'));
      assert.ok(part(state, 'thread').dash < .95 && part(state, 'thread').opacity > .15);
      return state;
    }, 450);
    motionSamples.push({ case: currentCase, label: 'thread-painted-frame', ...threadFrame });
    await screenshot(page, 'desktop-relation-motion-running');
    await expectEchoReleased(page);
    await assertSelection(page, { id: 'shi-yafeng' }, { expectedCount: 24 });
    await screenshot(page, 'desktop-relation-motion-settled');
    await expectIdle(page, 'selected relation settled');
    await recordState(page, 'settled');
  });

  await check('same-selection-hover-zoom-and-resize-do-not-replay', async () => {
    await openFresh(page);
    await chooseAndStart(page, 'shi-yafeng');
    await expectEchoReleased(page);
    const count = echoRecords(await motionState(page)).length;
    await keyboardChoose(page, nodeById(page, 'shi-yafeng'));
    await assertSelection(page, { id: 'shi-yafeng' });
    await pointerClickNode(page, 'shi-yafeng');
    await page.getByRole('button', { name: '放大全部关系图', exact: true }).click();
    await page.setViewportSize({ width: 1420, height: 1000 });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expectEchoReleased(page);
    assert.equal(echoRecords(await motionState(page)).length, count);
    await expectIdle(page, 'repeat/hover/zoom/resize');
  });

  await check('rapid-selections-cancel-old-owner-and-escape-cleans-up', async () => {
    await openFresh(page);
    let current;
    for (const id of ['shi-yafeng', 'berlin', 'sichuan-map', 'chengdu']) {
      current = await chooseAndStart(page, id);
      assertFinite(current.records);
      const state = await motionState(page);
      assert.ok(echoRecords(state).slice(0, current.before).every(record => record.state === 'idle'),
        'previous selection cannot keep a native animation alive');
      assert.equal(await nodeById(page, id).getAttribute('aria-pressed'), 'true');
      assert.equal(activeEcho(state).length, 4, 'scores never accumulate');
    }
    await page.keyboard.press('Escape');
    await expectEchoReleased(page, 400);
    await assertRestored(page);
    await eventually('Escape restores opener focus', async () =>
      assert.equal(await nodeById(page, 'chengdu').evaluate(el => el === document.activeElement), true));
    await expectIdle(page, 'rapid switching and Escape');
    await recordState(page, 'cancelled');
  });

  await check('keyboard-reading-focus-cancels-motion-without-changing-selection', async () => {
    await openFresh(page);
    await chooseAndStart(page, 'shi-yafeng');
    await page.keyboard.press('Tab');
    await expectEchoReleased(page, 350);
    const state = await graphState(page);
    assert.equal(state.dialogOpen, true);
    assert.equal(state.nodes.find(node => node.id === 'shi-yafeng').selected, true);
    const target = nodeById(page, 'berlin');
    await target.evaluate(el => el.focus({ preventScroll: true }));
    await eventually('keyboard target is sharp but not selected', async () => {
      const targetState = (await graphState(page)).nodes.find(node => node.id === 'berlin');
      assert.equal(targetState.focusVisible, true);
      assert.equal(targetState.selected, false);
      closeTo(targetState.opacity, 1, 'keyboard focus opacity');
      closeTo(targetState.portraitScale, 1, 'keyboard focus does not select/enlarge');
      assert.ok(targetState.filter === 'none' || targetState.filter === 'blur(0px)');
    });
    await page.keyboard.press('Space');
    await expectEchoStarted(page);
    await assertSelection(page, { id: 'berlin' });
    await closeDetail(page, { escape: true, opener: target });
    await expectEchoReleased(page);
    await expectIdle(page, 'keyboard selection and return');
  });

  await check('wheel-interaction-cancels-decoration-but-not-readable-evidence', async () => {
    await openFresh(page);
    await chooseAndStart(page, 'shi-yafeng');
    const bounds = await page.locator('.atlas-evidence').boundingBox();
    assert.ok(bounds);
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + Math.min(120, bounds.height / 2));
    await page.mouse.wheel(0, 60);
    await expectEchoReleased(page, 400);
    assert.equal((await graphState(page)).dialogOpen, true);
    assert.equal(await nodeById(page, 'shi-yafeng').getAttribute('aria-pressed'), 'true');
    await expectIdle(page, 'wheel interruption');
  });

  await check('search-and-category-interruption-release-effects', async () => {
    await openFresh(page);
    await chooseAndStart(page, 'shi-yafeng');
    await page.getByRole('textbox', { name: '搜索人物、机构或研究', exact: true }).fill('柏林大学');
    await expectEchoReleased(page, 400);
    await assertRestored(page);
    await page.getByRole('button', { name: '清除搜索', exact: true }).click();
    await chooseAndStart(page, 'berlin');
    await page.getByRole('button', { name: '人物往来', exact: true }).click();
    await expectEchoReleased(page, 400);
    await assertRestored(page);
    await expectIdle(page, 'search and category interruption');
  });

  await check('category-graph-uses-the-same-bounded-score', async () => {
    await openFresh(page);
    await page.getByRole('button', { name: '人物往来', exact: true }).click();
    const target = page.locator('.atlas-network').getByRole('button', { name: /^汉斯·施蒂勒，/ });
    const before = echoRecords(await motionState(page)).length;
    await keyboardChoose(page, target);
    const state = await expectEchoStarted(page);
    assertFinite(echoRecords(state).slice(before));
    await assertSelection(page, { name: '汉斯·施蒂勒' }, { expectedCount: 8 });
    await expectEchoReleased(page);
    await closeDetail(page, { escape: true, opener: target });
    await expectIdle(page, 'category graph');
  });

  await check('leaving-network-cancels-and-return-does-not-replay', async () => {
    await openFresh(page);
    await chooseAndStart(page, 'shi-yafeng');
    const count = echoRecords(await motionState(page)).length;
    await beginChapter(page, 'legacy');
    await expectEchoReleased(page, 400);
    await expectChapterDone(page, 'legacy');
    await beginChapter(page, 'network', 'back');
    await expectChapterDone(page, 'network');
    await expectEchoReleased(page);
    assert.equal(echoRecords(await motionState(page)).length, count);
    assert.equal(await nodeById(page, 'shi-yafeng').getAttribute('aria-pressed'), 'true');
    await expectIdle(page, 'leave and return');
  });

  await check('preference-change-cancels-live-score-and-does-not-replay', async () => {
    await openFresh(page);
    await chooseAndStart(page, 'shi-yafeng');
    const count = echoRecords(await motionState(page)).length;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expectEchoReleased(page, 400);
    await assertSelection(page, { id: 'shi-yafeng' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expectEchoReleased(page);
    assert.equal(echoRecords(await motionState(page)).length, count);
    await expectIdle(page, 'live reduced-motion toggle');
  });

  const reduced = await makePage('desktop-reduced-motion', { reducedMotion: 'reduce' });
  await check('reduced-motion-is-static-from-first-selection', async () => {
    await openFresh(reduced);
    const before = echoRecords(await motionState(reduced)).length;
    await keyboardChoose(reduced, nodeById(reduced, 'sichuan-map'));
    const immediate = await recordState(reduced, 'first-selection-observation');
    assert.equal(immediate.marker, null);
    assert.equal(echoRecords(immediate).length, before, 'no WAAPI score is created at all');
    assert.deepEqual(activeEcho(immediate), []);
    await assertSelection(reduced, { id: 'sichuan-map' });
    await expectEchoReleased(reduced, 300);
    const durations = await reduced.locator('.atlas-atlas').evaluate(el =>
      [...el.querySelectorAll('*')].map(node => {
        const s = getComputedStyle(node);
        return { transition: s.transitionDuration, animation: s.animationName };
      }));
    assert.ok(durations.every(value => value.animation === 'none' &&
      value.transition.split(',').every(t => parseFloat(t) === 0)));
    await screenshot(reduced, 'desktop-reduced-motion');
    await expectIdle(reduced, 'reduced desktop');
  });

  await check('reduced-motion-chapter-navigation-has-no-snapshot-animation', async () => {
    await openFresh(reduced, 'field');
    const count = (await motionState(reduced)).transitions.length;
    await reduced.locator('.contour-wayfinder a[href="#network"]').click();
    await expectChapterDone(reduced, 'network');
    const state = await recordState(reduced, 'reduced-chapter');
    assert.equal(state.transitions.length, count, 'no native snapshot transition requested');
    await expectIdle(reduced, 'reduced chapter');
  });

  await check('chapter-depth-forward-and-back-actually-render-and-finish', async () => {
    await openFresh(page, 'field');
    const first = await beginChapter(page, 'network');
    motionSamples.push({ case: currentCase, label: 'chapter-forward-start', ...first });
    await delay(90);
    const second = await recordState(page, 'chapter-forward-progress');
    const old = first.animations.find(animation => animation.name === 'echo-room-in');
    const newer = second.animations.find(animation => animation.name === 'echo-room-in');
    assert.ok(old && newer && newer.currentTime > old.currentTime,
      'native snapshot animation really progresses');
    await screenshot(page, 'desktop-chapter-depth');
    await expectChapterDone(page, 'network');
    await beginChapter(page, 'field', 'back');
    await expectChapterDone(page, 'field');
    await expectIdle(page, 'both chapter directions');
  });

  await check('chapter-new-navigation-supersedes-old-destination', async () => {
    await openFresh(page, 'field');
    await beginChapter(page, 'network');
    await page.locator('.contour-wayfinder a[href="#sources"]').click();
    await expectChapterDone(page, 'sources');
    await expectIdle(page, 'superseding chapter navigation');
    const state = await recordState(page, 'latest-destination');
    assert.equal(state.currentChapter, 'sources');
    assert.equal(state.hash, '#sources');
  });

  await check('chapter-escape-cancels-before-natural-end-without-stale-state', async () => {
    await openFresh(page, 'field');
    const state = await beginChapter(page, 'network');
    assert.ok(state.animations.some(animation => animation.name === 'echo-room-in'));
    await page.keyboard.press('Escape');
    await eventually('Escape exits guided mode and releases snapshots promptly', async () => {
      const stopped = await motionState(page);
      assert.equal(stopped.transitionKind, null);
      assert.equal(stopped.direction, null);
      assert.equal(await page.locator('.strata-app.free').count(), 1);
      assert.ok(!live(stopped).some(animation => animation.name.startsWith('echo-room')));
    }, 300);
    await expectIdle(page, 'chapter Escape');
  });

  await check('chapter-menu-opening-cancels-snapshot-and-keeps-modal-focus', async () => {
    await openFresh(page, 'field');
    await beginChapter(page, 'network');
    await page.locator('.menu-toggle').click();
    await eventually('opening the menu takes over from the chapter transition', async () => {
      const state = await motionState(page);
      assert.equal(state.transitionKind, null);
      assert.equal(state.direction, null);
      assert.ok(!live(state).some(animation => animation.name.startsWith('echo-room')));
      assert.equal(await page.locator('dialog:modal').count(), 1);
    }, 700);
    await eventually('menu retains focus', async () => assert.equal(await page.evaluate(() =>
      !!document.querySelector('dialog:modal')?.contains(document.activeElement)), true));
    await page.keyboard.press('Escape');
    await eventually('menu closes', async () => assert.equal(await page.locator('dialog:modal').count(), 0));
    await expectIdle(page, 'chapter menu interruption');
  });

  await check('chapter-reduced-motion-change-cancels-snapshot', async () => {
    await openFresh(page, 'field');
    await beginChapter(page, 'network');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await eventually('reduced motion releases chapter transition', async () => {
      const state = await motionState(page);
      assert.equal(state.transitionKind, null);
      assert.equal(state.direction, null);
      assert.ok(!live(state).some(animation => animation.name.startsWith('echo-room')));
    }, 400);
    await expectIdle(page, 'chapter preference interruption');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  const mobile = await makePage('mobile-390', {
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
  });
  await check('mobile-overview-centers-core-and-has-no-overflow', async () => {
    await openFresh(mobile);
    const layout = await mobile.locator('.atlas-overview-canvas').evaluate(canvas => {
      const center = canvas.querySelector('.atlas-core-portrait').getBoundingClientRect();
      const r = canvas.getBoundingClientRect();
      return { scrollLeft: canvas.scrollLeft, maxScroll: canvas.scrollWidth - canvas.clientWidth,
        coreX: center.x + center.width / 2, canvasX: r.x + r.width / 2 };
    });
    assert.ok(Math.abs(layout.coreX - layout.canvasX) < 12, 'central portrait begins in the mobile viewport');
    const state = await graphState(mobile);
    assert.equal(state.galaxyCanvases, 0);
    assert.ok(state.documentWidth <= state.width + 1);
    await screenshot(mobile, 'mobile-overview');
    await expectIdle(mobile, 'mobile overview');
  });

  await check('mobile-selection-uses-only-short-opacity-and-native-modal', async () => {
    await openFresh(mobile);
    const { records } = await chooseAndStart(mobile, 'stille', 1);
    assertFinite(records, { mobile: true });
    assert.ok(records[0].frames.every(frame => !('transform' in frame)), 'no mobile paper tilt or movement');
    const first = await recordState(mobile, 'mobile-first-frame');
    assert.ok(part(first, 'sheet').opacity >= .81 && part(first, 'sheet').opacity <= 1);
    assert.ok(noTransform(part(first, 'sheet').transform));
    assert.equal(first.dialogModal, true);
    assert.equal(first.focusInEvidence, true);
    await expectEchoReleased(mobile, 500);
    await assertSelection(mobile, { id: 'stille' }, { expectedCount: 24, mobile: true });
    await mobile.keyboard.press('Tab');
    assert.equal((await motionState(mobile)).focusInEvidence, true);
    await mobile.keyboard.press('Shift+Tab');
    assert.equal((await motionState(mobile)).focusInEvidence, true);
    const r = await mobile.locator('.atlas-evidence').boundingBox();
    assert.ok(r && r.x >= 0 && r.y >= 0 && r.x + r.width <= 391 && r.y + r.height <= 845);
    await screenshot(mobile, 'mobile-selected');
    await closeDetail(mobile, { escape: true, opener: nodeById(mobile, 'stille') });
    await expectEchoReleased(mobile);
    await expectIdle(mobile, 'mobile selection and Escape');
  });

  await check('mobile-touch-selection-and-early-close-leave-no-effects', async () => {
    await openFresh(mobile);
    const target = nodeById(mobile, 'stille');
    const before = echoRecords(await motionState(mobile)).length;
    await target.tap();
    const created = echoRecords(await motionState(mobile)).slice(before);
    assertFinite(created, { mobile: true });
    await mobile.getByRole('button', { name: '关闭关系详情', exact: true }).tap();
    await expectEchoReleased(mobile, 400);
    await assertRestored(mobile);
    await expectIdle(mobile, 'touch open and close');
  });

  await check('mobile-chapter-navigation-skips-depth-snapshots', async () => {
    await openFresh(mobile, 'field');
    const before = (await motionState(mobile)).transitions.length;
    await mobile.getByRole('button', { name: '下一屏', exact: true }).click();
    await expectChapterDone(mobile, 'network');
    assert.equal((await motionState(mobile)).transitions.length, before);
    await expectIdle(mobile, 'mobile chapter navigation');
  });

  const mobileReduced = await makePage('mobile-reduced-motion', {
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 1, reducedMotion: 'reduce',
  });
  await check('mobile-reduced-motion-is-immediately-static', async () => {
    await openFresh(mobileReduced);
    await keyboardChoose(mobileReduced, nodeById(mobileReduced, 'stille'));
    const state = await recordState(mobileReduced, 'mobile-reduced-first-frame');
    assert.equal(echoRecords(state).length, 0);
    assert.equal(state.marker, null);
    assert.deepEqual(activeEcho(state), []);
    await assertSelection(mobileReduced, { id: 'stille' }, { mobile: true });
    await screenshot(mobileReduced, 'mobile-reduced-motion');
    await closeDetail(mobileReduced, { escape: true, opener: nodeById(mobileReduced, 'stille') });
    await expectIdle(mobileReduced, 'mobile reduced');
  });

  await check('browser-runtime-and-resource-errors', async () => {
    const errors = browserEvents.filter(event =>
      event.kind === 'pageerror' || event.kind === 'console-error' ||
      (event.kind === 'http-error' && event.url.startsWith(origin)) ||
      (event.kind === 'requestfailed' && event.url.startsWith(origin) &&
        !/ERR_ABORTED/.test(event.message || '')));
    assert.deepEqual(errors, [], 'actual browser errors are recorded in browser-events.json');
  });
} catch (error) {
  results.push({ name: 'startup-or-harness', status: 'failed', error: error.stack || String(error) });
} finally {
  for (const { label, page } of trackedPages) {
    if (!page.isClosed()) {
      try { auditExports.push({ label, ...await motionState(page) }); }
      catch (error) { auditExports.push({ label, error: String(error) }); }
    }
  }
  if (browser) await browser.close().catch(() => {});
  if (server?.pid) {
    try {
      if (process.platform === 'win32') server.kill('SIGTERM');
      else process.kill(-server.pid, 'SIGTERM');
    } catch { /* Preview may already be stopped. */ }
  }
  const failures = results.filter(result => result.status === 'failed');
  const report = {
    startedAt, finishedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    testedUrl: origin + '/#network',
    status: failures.length ? 'failed' : 'passed',
    passed: results.length - failures.length, failed: failures.length,
    screenshots, assertions: results,
    methodology: {
      instrumentation: 'Native RAF counters, WAAPI records, computed style samples and document.getAnimations; no animation mocks',
      idleWindowMs: 900, idleWaitBudgetMs: 10000,
      screenshots: 'animations allow; screenshots never finish/cancel motion for the test',
      existingRegression: 'Run scripts/verify-pair-focus.mjs separately and unchanged',
    },
  };
  for (const [file, value] of [
    ['report.json', report], ['browser-events.json', browserEvents],
    ['motion-samples.json', motionSamples], ['idle-samples.json', idleSamples],
    ['audit-traces.json', auditExports],
  ]) await writeFile(path.join(output, file), JSON.stringify(value, null, 2) + '\n');
  await writeFile(path.join(output, 'preview.log'), serverOutput.join(''));
  console.log(JSON.stringify({
    status: report.status, passed: report.passed, failed: report.failed,
    failingCases: failures.map(result => ({ name: result.name, error: result.error.split('\n')[0] })),
    screenshots, report: 'review/relation-motion/report.json',
  }, null, 2));
  process.exitCode = failures.length ? 1 : 0;
}
