import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Run from experiments/experiment-2 after npm run build.
// Playwright and its Chromium browser must already be installed by CI.
// This script only reads the built application. Reports stay in this workspace.
const origin = 'http://127.0.0.1:4173';
const output = path.resolve('review/pair-focus');
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
  const file = name + '.png';
  await page.screenshot({ path: path.join(output, file), fullPage: false, animations: 'disabled' });
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
      const safeName = 'failure-' + name.replace(/[^a-z0-9-]+/gi, '-').slice(0, 75);
      try { await screenshot(currentPage, safeName); } catch { /* Original failure remains primary. */ }
      try {
        await writeFile(path.join(output, safeName + '.json'), JSON.stringify(await graphState(currentPage), null, 2));
      } catch { /* The failed page may not have initialized. */ }
    }
  }
}

await mkdir(output, { recursive: true });
try {
  server = spawn('npm', ['run', 'preview', '--', '--port', '4173', '--strictPort'], {
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
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  desktop.setDefaultTimeout(10000);
  const page = await desktop.newPage();
  watchPage(page, 'desktop-1440');

  await check('desktop-overview-baseline', async () => {
    await openNetwork(page);
    const state = await assertRestored(page);
    assert.deepEqual(state.nodes.map(n => n.id).sort(), [...overviewIds].sort());
    closeTo(state.cameraScale, 1, 'initial camera');
    await screenshot(page, 'desktop-overview');
  });

  for (const id of overviewIds) {
    await check('overview-pair-' + id, async () => {
      // Recover a previous failed case without allowing it to mask this record.
      if ((await graphState(page)).hasFocus) await openNetwork(page);
      const opener = nodeById(page, id);
      const before = (await graphState(page)).cameraTransform;
      await keyboardChoose(page, opener);
      await assertSelection(page, { id }, { expectedCount: 24 });
      if (id === 'shi-yafeng') await screenshot(page, 'desktop-selected-person');
      if (id === 'chengdu') await screenshot(page, 'desktop-selected-school');
      if (id === 'sichuan-map') await screenshot(page, 'desktop-selected-project');
      await closeDetail(page, { escape: true, opener });
      await assertRestored(page, before);
    });
  }

  await check('repeat-click-and-pointer-switch', async () => {
    await openNetwork(page);
    await keyboardChoose(page, nodeById(page, 'shi-yafeng'));
    await assertSelection(page, { id: 'shi-yafeng' });
    for (let i = 0; i < 3; i++) {
      await pointerClickNode(page, 'shi-yafeng');
      await assertSelection(page, { id: 'shi-yafeng' });
    }
    const nextId = await pointerClickNode(page, null, 'shi-yafeng');
    await assertSelection(page, { id: nextId });
    await closeDetail(page, { opener: nodeById(page, nextId) });
  });

  await check('zoom-and-pan-restore-after-close', async () => {
    await openNetwork(page);
    await page.getByRole('button', { name: '放大全部关系图', exact: true }).click();
    await page.getByRole('button', { name: '放大全部关系图', exact: true }).click();
    const graph = page.locator('#network .atlas-complete-network');
    await graph.focus();
    await page.keyboard.press('ArrowRight');
    const before = await eventually('user view reaches 130%', async () => {
      const state = await graphState(page);
      closeTo(state.cameraScale, 1.3, 'user zoom');
      assert.ok(state.cameraTransform.startsWith('translate(-30 '), 'keyboard pan changes the camera');
      return state;
    });
    const opener = nodeById(page, 'shi-yafeng');
    await keyboardChoose(page, opener);
    await assertSelection(page, { id: 'shi-yafeng' });
    await closeDetail(page, { opener });
    await assertRestored(page, before.cameraTransform);
    await eventually('restored user zoom is rendered', async () =>
      closeTo((await graphState(page)).cameraScale, 1.3, 'restored camera zoom'));
  });

  for (const category of categories) {
    await check('category-' + category.label, async () => {
      await openNetwork(page);
      await page.getByRole('button', { name: category.label, exact: true }).click();
      const opener = page.locator('#network .atlas-network').getByRole('button', {
        name: new RegExp('^' + category.name + '，'),
      });
      await keyboardChoose(page, opener);
      await assertSelection(page, { name: category.name }, { expectedCount: category.count });
      await closeDetail(page, { escape: true, opener });
      await page.getByRole('button', { name: /^全部关系/ }).click();
      assert.equal((await assertRestored(page)).nodes.length, 24);
    });
  }

  await check('search-and-category-clear-selection', async () => {
    await openNetwork(page);
    await keyboardChoose(page, nodeById(page, 'shi-yafeng'));
    await assertSelection(page, { id: 'shi-yafeng' });
    await page.getByRole('textbox', { name: '搜索人物、机构或研究', exact: true }).fill('柏林大学');
    const filtered = await assertRestored(page);
    assert.ok(filtered.nodes.length > 0 && filtered.nodes.length < 24);
    assert.ok(filtered.nodes.some(n => n.id === 'berlin'));
    await page.getByRole('button', { name: '清除搜索', exact: true }).click();
    await eventually('clearing search restores all nodes', async () =>
      assert.equal((await graphState(page)).nodes.length, 24));
    await keyboardChoose(page, nodeById(page, 'berlin'));
    await assertSelection(page, { id: 'berlin' });
    await page.getByRole('button', { name: '成果与建设', exact: true }).click();
    assert.equal((await assertRestored(page)).nodes.length, 3);
    await page.getByRole('textbox', { name: '搜索人物、机构或研究', exact: true }).fill('__no_matching_archive_record__');
    await page.getByRole('button', { name: '重置筛选', exact: true }).click();
    assert.equal((await assertRestored(page)).nodes.length, 24);
  });

  await check('keyboard-focus-sharpness-and-escape', async () => {
    await openNetwork(page);
    await keyboardChoose(page, nodeById(page, 'shi-yafeng'));
    await assertSelection(page, { id: 'shi-yafeng' });
    const next = nodeById(page, 'berlin');
    await next.evaluate(el => el.focus({ preventScroll: true }));
    await eventually('unselected keyboard target becomes sharp without enlarging', async () => {
      const state = await graphState(page);
      const selected = state.nodes.find(n => n.id === 'shi-yafeng');
      const focused = state.nodes.find(n => n.id === 'berlin');
      assert.equal(selected.selected, true);
      assert.equal(focused.selected, false);
      assert.equal(focused.focusVisible, true);
      closeTo(focused.portraitScale, 1, 'keyboard target portrait stays normal');
      closeTo(focused.opacity, 1, 'keyboard target is readable');
      assert.ok(focused.filter === 'none' || focused.filter === 'blur(0px)');
    });
    await page.keyboard.press('Space');
    await assertSelection(page, { id: 'berlin' });
    await closeDetail(page, { escape: true, opener: next });
  });

  const reduced = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce',
  });
  reduced.setDefaultTimeout(10000);
  const reducedPage = await reduced.newPage();
  watchPage(reducedPage, 'desktop-reduced-motion');
  await check('reduced-motion-pair-and-no-galaxy-canvas', async () => {
    await openNetwork(reducedPage);
    await keyboardChoose(reducedPage, nodeById(reducedPage, 'sichuan-map'));
    const state = await assertSelection(reducedPage, { id: 'sichuan-map' });
    assert.equal(state.galaxyCanvases, 0);
    const motion = await reducedPage.locator('#network .atlas-atlas').evaluate(el =>
      [...el.querySelectorAll('.atlas-camera, .atlas-node-portrait, .atlas-core-portrait, .atlas-evidence')]
        .map(node => {
          const style = getComputedStyle(node);
          return { transition: style.transitionDuration, animation: style.animationName };
        }));
    assert.ok(motion.every(m => m.transition.split(',').every(t => parseFloat(t) === 0) && m.animation === 'none'),
      'reduced motion disables portrait, camera, and evidence animations');
    await screenshot(reducedPage, 'desktop-reduced-motion-selected');
    await closeDetail(reducedPage, { escape: true, opener: nodeById(reducedPage, 'sichuan-map') });
  });

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 1, reducedMotion: 'no-preference',
  });
  mobile.setDefaultTimeout(10000);
  const mobilePage = await mobile.newPage();
  watchPage(mobilePage, 'mobile-390');
  await check('mobile-overview-dialog-focus-and-no-overflow', async () => {
    await openNetwork(mobilePage);
    let state = await assertRestored(mobilePage);
    assert.equal(state.galaxyCanvases, 0);
    assert.ok(state.documentWidth <= state.width + 1, 'no horizontal document overflow');
    await screenshot(mobilePage, 'mobile-overview');
    const opener = nodeById(mobilePage, 'shi-yafeng');
    await keyboardChoose(mobilePage, opener);
    state = await assertSelection(mobilePage, { id: 'shi-yafeng' }, { mobile: true, expectedCount: 24 });
    assert.equal(state.galaxyCanvases, 0);
    assert.ok(state.documentWidth <= state.width + 1);
    assert.equal(state.focusInEvidence, true);
    const dialog = await mobilePage.locator('.atlas-evidence[open]').boundingBox();
    assert.ok(dialog && dialog.x >= 0 && dialog.x + dialog.width <= 391 &&
      dialog.y >= 0 && dialog.y + dialog.height <= 845, 'modal fits mobile viewport');
    await mobilePage.keyboard.press('Tab');
    assert.equal((await graphState(mobilePage)).focusInEvidence, true);
    await mobilePage.keyboard.press('Shift+Tab');
    assert.equal((await graphState(mobilePage)).focusInEvidence, true);
    await screenshot(mobilePage, 'mobile-selected-person');
    await closeDetail(mobilePage, { escape: true, opener });
    await keyboardChoose(mobilePage, nodeById(mobilePage, 'chengdu'));
    await assertSelection(mobilePage, { id: 'chengdu' }, { mobile: true });
    await closeDetail(mobilePage, { opener: nodeById(mobilePage, 'chengdu') });
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
  if (browser) await browser.close().catch(() => {});
  if (server?.pid) {
    try {
      if (process.platform === 'win32') server.kill('SIGTERM');
      else process.kill(-server.pid, 'SIGTERM');
    } catch { /* The preview process may already have exited. */ }
  }
  const failures = results.filter(result => result.status === 'failed');
  const report = {
    startedAt, finishedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    testedUrl: origin + '/#network',
    status: failures.length ? 'failed' : 'passed',
    passed: results.length - failures.length, failed: failures.length,
    screenshots, assertions: results,
  };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(path.join(output, 'browser-events.json'), JSON.stringify(browserEvents, null, 2) + '\n');
  await writeFile(path.join(output, 'preview.log'), serverOutput.join(''));
  console.log(JSON.stringify({
    status: report.status, passed: report.passed, failed: report.failed,
    failingCases: failures.map(result => ({ name: result.name, error: result.error.split('\n')[0] })),
    screenshots, report: 'review/pair-focus/report.json',
  }, null, 2));
  process.exitCode = failures.length ? 1 : 0;
}
