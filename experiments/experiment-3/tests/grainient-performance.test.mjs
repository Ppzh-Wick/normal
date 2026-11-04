import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

// Execute the production JSX with deterministic hooks, host nodes and browser
// scheduling. This exercises the actual effects and cleanup, not source matches.
const compile = async path => (await build({
  entryPoints: [new URL('../' + path, import.meta.url).pathname],
  bundle: true,
  jsx: 'automatic',
  platform: 'node',
  format: 'cjs',
  write: false,
  external: ['react', 'react/jsx-runtime'],
  plugins: [{name: 'ignore-style-imports', setup(b) {
    b.onLoad({filter: /\.css$/}, () => ({contents: '', loader: 'js'}));
  }}],
})).outputFiles[0].text;

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatch(type, event = {}) {
      for (const fn of [...listeners.get(type) || []]) fn(event);
    },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
    get totalListeners() {
      return [...listeners.values()].reduce((sum, set) => sum + set.size, 0);
    },
  };
}

function mockGL(options = {}) {
  const calls = [], alive = new Set();
  let serial = 0, compileCount = 0, linkCount = 0, lost = 0;
  const resource = kind => { const value = {kind, id: ++serial}; alive.add(value); return value; };
  const gl = {
    calls, alive,
    get lost() { return lost; },
    createShader: () => resource('shader'),
    createProgram: () => resource('program'),
    createVertexArray: () => resource('vertex-array'),
    createTexture: () => resource('texture'),
    createFramebuffer: () => resource('framebuffer'),
    deleteShader: value => alive.delete(value),
    deleteProgram: value => alive.delete(value),
    deleteVertexArray: value => alive.delete(value),
    deleteTexture: value => alive.delete(value),
    deleteFramebuffer: value => alive.delete(value),
    compileShader() { compileCount++; },
    linkProgram() { linkCount++; },
    getShaderParameter: () => compileCount !== options.failCompile,
    getProgramParameter: (_program, parameter) => parameter === 'ACTIVE_UNIFORMS'
      ? 0 : linkCount !== options.failLink,
    getShaderInfoLog: () => 'Simulated shader compile failure',
    getProgramInfoLog: () => 'Simulated program link failure',
    getExtension: name => name === 'WEBGL_lose_context'
      ? {loseContext() { lost++; }} : null,
    checkFramebufferStatus: () => 'FRAMEBUFFER_COMPLETE',
    isContextLost: () => false,
  };
  for (const name of ['VERTEX_SHADER', 'FRAGMENT_SHADER', 'COMPILE_STATUS', 'LINK_STATUS',
    'ACTIVE_UNIFORMS', 'TEXTURE_2D', 'TEXTURE_MIN_FILTER', 'TEXTURE_MAG_FILTER',
    'TEXTURE_WRAP_S', 'TEXTURE_WRAP_T', 'LINEAR', 'CLAMP_TO_EDGE', 'FRAMEBUFFER',
    'FRAMEBUFFER_COMPLETE', 'BLEND', 'RGBA8', 'RGBA', 'UNSIGNED_BYTE',
    'COLOR_ATTACHMENT0', 'TRIANGLES', 'TEXTURE0']) gl[name] = name;
  for (const name of ['shaderSource', 'attachShader', 'bindTexture', 'texParameteri',
    'bindVertexArray', 'disable', 'bindFramebuffer', 'viewport', 'useProgram',
    'uniform1f', 'uniform3fv', 'uniform1i', 'uniform2f', 'uniform4fv', 'uniform1fv',
    'drawArrays', 'activeTexture', 'texImage2D', 'framebufferTexture2D']) {
    gl[name] = (...args) => calls.push({name, args});
  }
  return gl;
}

function harness(source, options = {}) {
  const scopes = new Map(), nodes = new Map(), frames = new Map(), observers = [], contexts = [];
  const win = eventTarget(), doc = eventTarget(), rootEvents = eventTarget();
  let current, effects = [], dirty = false, mounted = false, props, tree;
  let rafSerial = 0, now = 0, requestedFrames = 0, canceledFrames = 0, contextRequests = 0;
  const dimensions = {width: options.width ?? 1440, height: options.height ?? 900};
  const media = new Map();
  win.devicePixelRatio = options.dpr ?? 2;
  win.innerWidth = dimensions.width;
  win.innerHeight = dimensions.height;
  win.matchMedia = query => {
    if (!media.has(query)) media.set(query, {
      ...eventTarget(), media: query,
      matches: query.includes('prefers-reduced-motion') ? !!options.reduced
        : query.includes('min-width') ? dimensions.width >= 900 : false,
    });
    return media.get(query);
  };
  doc.hidden = !!options.hidden;
  doc.documentElement = rootEvents;
  doc.createElement = tag => {
    assert.equal(tag, 'canvas');
    return {getContext: () => ({
      clearRect() {}, fillRect() {}, fillStyle: '#000000',
      getImageData() { return {data: new Uint8ClampedArray([32, 48, 64, 255])}; },
    })};
  };

  function clean(scope) {
    for (const hook of scope.hooks) hook?.cleanup?.();
    scope.live = false;
  }
  const sameDeps = (a, b) => a !== undefined && b !== undefined
    && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const hooks = {
    useRef(initial) {
      const i = current.cursor++;
      return current.hooks[i] ??= {current: initial};
    },
    useState(initial) {
      const scope = current, i = scope.cursor++;
      if (!scope.hooks[i]) scope.hooks[i] = {value: typeof initial === 'function' ? initial() : initial};
      return [scope.hooks[i].value, value => {
        if (!scope.live) return;
        const next = typeof value === 'function' ? value(scope.hooks[i].value) : value;
        if (!Object.is(scope.hooks[i].value, next)) { scope.hooks[i].value = next; dirty = true; }
      }];
    },
    useEffect(fn, deps) {
      const scope = current, i = scope.cursor++, old = scope.hooks[i];
      if (!old || !sameDeps(old.deps, deps)) {
        const slot = {deps, cleanup: old?.cleanup};
        scope.hooks[i] = slot;
        effects.push(() => { slot.cleanup?.(); slot.cleanup = fn(); });
      }
    },
    useMemo(fn, deps) {
      const i = current.cursor++, old = current.hooks[i];
      if (!old || !sameDeps(old.deps, deps)) current.hooks[i] = {deps, value: fn()};
      return current.hooks[i].value;
    },
  };
  hooks.useLayoutEffect = hooks.useEffect;
  hooks.useCallback = (fn, deps) => hooks.useMemo(() => fn, deps);

  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.kind = 'resize'; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  class IntersectionObserver extends ResizeObserver {
    constructor(callback) { super(callback); this.kind = 'intersection'; }
  }
  const requestAnimationFrame = fn => {
    requestedFrames++;
    frames.set(++rafSerial, fn);
    return rafSerial;
  };
  const cancelAnimationFrame = id => {
    if (frames.delete(id)) canceledFrames++;
  };
  const module = {exports: {}};
  new Function('require', 'module', 'exports', 'window', 'document',
    'ResizeObserver', 'IntersectionObserver', 'requestAnimationFrame', 'cancelAnimationFrame',
    'devicePixelRatio', 'performance', source)(
    id => id === 'react' ? hooks : require(id), module, module.exports, win, doc,
    ResizeObserver, IntersectionObserver, requestAnimationFrame, cancelAnimationFrame,
    win.devicePixelRatio, {now: () => now},
  );
  const Component = module.exports.default;

  function visit(element, path, seenScopes, seenNodes) {
    if (element == null || typeof element === 'boolean') return;
    if (Array.isArray(element)) {
      element.forEach((child, i) => visit(child, path + '.' + (child?.key ?? i), seenScopes, seenNodes));
      return;
    }
    if (typeof element !== 'object') return;
    const {type, props: childProps} = element;
    if (typeof type === 'function') {
      let scope = scopes.get(path);
      if (scope && scope.type !== type) { clean(scope); scope = null; }
      if (!scope) { scope = {type, hooks: [], live: true}; scopes.set(path, scope); }
      seenScopes.add(path);
      scope.cursor = 0;
      current = scope;
      const output = type(childProps);
      if (path === 'root') tree = output;
      visit(output, path + '.out', seenScopes, seenNodes);
      return;
    }
    if (typeof type === 'string') {
      let node = nodes.get(path);
      if (!node || node.tagName !== type) {
        node = {
          ...eventTarget(), tagName: type, width: 0, height: 0, dataset: {},
          style: {setProperty() {}, removeProperty() {}},
          get clientWidth() { return dimensions.width; },
          get clientHeight() { return dimensions.height; },
          getBoundingClientRect: () => ({left: 0, top: 0, width: dimensions.width, height: dimensions.height}),
          getContext(kind) {
            assert.equal(kind, 'webgl2');
            contextRequests++;
            if (options.throwWebGL) throw new Error('Simulated WebGL context creation exception');
            if (options.noWebGL) return null;
            if (!this.gl) { this.gl = mockGL(options); contexts.push(this.gl); }
            return this.gl;
          },
          setAttribute(name, value) { this[name] = value; },
          removeAttribute(name) { delete this[name]; },
        };
        nodes.set(path, node);
      }
      for (const [name, value] of Object.entries(childProps || {})) {
        if (name.startsWith('data-') && !Object.is(node.props?.[name], value)) {
          node.dataset[name.slice(5).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())] = String(value);
        }
      }
      node.props = childProps;
      seenNodes.add(path);
      const ref = childProps?.ref;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }
    visit(childProps?.children, path + '.children', seenScopes, seenNodes);
  }
  function flush() {
    for (let pass = 0; dirty && mounted; pass++) {
      assert.ok(pass < 30, 'component must settle without an effect/render loop');
      dirty = false;
      const seenScopes = new Set(), seenNodes = new Set();
      visit({type: Component, props}, 'root', seenScopes, seenNodes);
      for (const [path, scope] of scopes) if (!seenScopes.has(path)) { clean(scope); scopes.delete(path); }
      for (const path of nodes.keys()) if (!seenNodes.has(path)) nodes.delete(path);
      effects.splice(0).forEach(fn => fn());
    }
  }
  return {
    render(next = props) { props = next; mounted = true; dirty = true; flush(); },
    tick(time = now + 1000 / 60) {
      now = time;
      const batch = [...frames.entries()];
      for (const [id, fn] of batch) if (frames.delete(id)) fn(now);
      flush();
    },
    resize(width = dimensions.width, height = dimensions.height) {
      Object.assign(dimensions, {width, height});
      for (const o of observers) if (o.kind === 'resize' && !o.disconnected) o.callback([{target: o.target}]);
      flush();
    },
    intersect(visible) {
      for (const o of observers) if (o.kind === 'intersection' && !o.disconnected) {
        o.callback([{target: o.target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0}]);
      }
      flush();
    },
    hide(hidden) { doc.hidden = hidden; doc.dispatch('visibilitychange'); flush(); },
    loseContext() {
      for (const node of nodes.values()) if (node.tagName === 'canvas') node.dispatch('webglcontextlost');
      flush();
    },
    pointer(type = 'pointermove') {
      const event = {clientX: dimensions.width / 2, clientY: dimensions.height / 2, pointerType: 'mouse'};
      win.dispatch(type, event);
      for (const node of nodes.values()) node.dispatch(type, event);
      flush();
    },
    unmount() {
      mounted = false;
      for (const scope of scopes.values()) clean(scope);
      scopes.clear(); nodes.clear();
    },
    contexts, observers, win, doc,
    get tree() { return tree; },
    get frames() { return frames.size; },
    get requestedFrames() { return requestedFrames; },
    get canceledFrames() { return canceledFrames; },
    get contextRequests() { return contextRequests; },
    get canvases() { return [...nodes.values()].filter(node => node.tagName === 'canvas'); },
    get hostNodes() { return [...nodes.values()]; },
    get draws() { return contexts.reduce((sum, gl) => sum + gl.calls.filter(call => call.name === 'drawArrays').length, 0); },
    get allocationCount() { return contexts.reduce((sum, gl) => sum + gl.calls.filter(call => call.name === 'texImage2D').length, 0); },
  };
}

const grainientSource = await compile('src/vendor/Grainient.jsx');
const atmosphereSource = await compile('src/components/MineralAtmosphere.jsx');
const staticProps = {
  speed: 0, grainAnimated: false, interactive: false, clickSwirl: false, intro: false,
  maxPixels: 960000, active: true,
};

test('static Grainient draws one two-pass frame then stays idle', () => {
  const h = harness(grainientSource);
  let ready = 0;
  h.render({...staticProps, onReady: () => ready++});
  assert.equal(h.frames, 0, 'initial render waits for actual intersection visibility');
  assert.equal(h.draws, 0);
  h.intersect(true); h.tick();
  assert.equal(h.draws, 2, 'one frame consists of field and composite passes');
  assert.equal(h.frames, 0, 'no perpetual RAF for an inert decorative background');
  const allocations = h.allocationCount;
  for (let i = 0; i < 12; i++) h.tick();
  assert.equal(h.draws, 2);
  assert.equal(h.allocationCount, allocations);
  assert.equal(ready, 1, 'ready is emitted only after the first successful frame');
  h.unmount();
});

test('disabled pointer interaction never installs or schedules pointer work', () => {
  const h = harness(grainientSource);
  h.render(staticProps); h.intersect(true); h.tick();
  const requests = h.requestedFrames;
  assert.equal(h.win.listenerCount('pointermove'), 0);
  assert.equal(h.win.listenerCount('pointerdown'), 0);
  for (let i = 0; i < 20; i++) { h.pointer(); h.pointer('pointerdown'); }
  assert.equal(h.requestedFrames, requests);
  assert.equal(h.frames, 0);
  assert.equal(h.draws, 2);
  h.unmount();
});

test('offscreen and hidden transitions immediately cancel animation and suppress resize drawing', () => {
  const h = harness(grainientSource);
  h.render({...staticProps, speed: 1, grainAnimated: true}); h.intersect(true); h.tick();
  assert.equal(h.frames, 1);
  h.intersect(false);
  assert.equal(h.frames, 0, 'intersection exit cancels a queued frame immediately');
  let previous = h.draws;
  h.resize(1600, 1000); h.pointer(); h.tick();
  assert.equal(h.draws, previous, 'offscreen resize cannot invoke draw directly');
  h.intersect(true); h.tick();
  assert.equal(h.frames, 1);
  assert.equal(h.draws, previous + 2);
  h.hide(true);
  assert.equal(h.frames, 0, 'hidden page cancels a queued frame immediately');
  previous = h.draws;
  h.resize(1800, 1100); h.intersect(true); h.pointer(); h.tick();
  assert.equal(h.draws, previous);
  h.hide(false); h.tick();
  assert.equal(h.draws, previous + 2);
  h.unmount();
  assert.equal(h.frames, 0);
});

test('an initially hidden page does not draw until visible', () => {
  const h = harness(grainientSource, {hidden: true});
  h.render(staticProps); h.intersect(true); h.resize(); h.tick();
  assert.equal(h.draws, 0);
  assert.equal(h.frames, 0);
  h.hide(false); h.tick();
  assert.equal(h.draws, 2);
  assert.equal(h.frames, 0);
  h.unmount();
});

test('canvas and field allocations honor the pixel budget on high-DPR oversized displays', () => {
  const h = harness(grainientSource, {width: 7680, height: 4320, dpr: 3});
  h.render(staticProps); h.intersect(true); h.tick();
  const canvas = h.canvases[0];
  assert.ok(canvas.width > 0 && canvas.height > 0);
  assert.ok(canvas.width * canvas.height <= staticProps.maxPixels,
    `backing canvas exceeds ${staticProps.maxPixels}: ${canvas.width} × ${canvas.height}`);
  assert.ok(Math.abs(canvas.width / canvas.height - 7680 / 4320) < .01);
  const allocations = h.contexts[0].calls.filter(call => call.name === 'texImage2D');
  for (const {args} of allocations) assert.ok(args[3] * args[4] <= staticProps.maxPixels / 4 + 2000);
  const before = h.allocationCount;
  h.resize(); h.resize(); h.tick();
  assert.equal(h.allocationCount, before, 'unchanged dimensions do not reallocate GPU texture storage');
  assert.equal(h.frames, 0);
  h.unmount();
});

test('unmount releases observers, event listeners, pending RAF and every GPU resource', () => {
  const h = harness(grainientSource);
  h.render({...staticProps, speed: 1, interactive: true, clickSwirl: true}); h.intersect(true); h.tick();
  assert.equal(h.frames, 1);
  assert.ok(h.contexts[0].alive.size > 0);
  const canvas = h.canvases[0];
  h.unmount();
  assert.equal(h.frames, 0);
  assert.ok(h.observers.every(observer => observer.disconnected));
  assert.equal(h.win.totalListeners, 0);
  assert.equal(h.doc.totalListeners, 0);
  assert.equal(h.doc.documentElement.totalListeners, 0);
  assert.equal(canvas.totalListeners, 0);
  assert.equal(h.contexts[0].alive.size, 0);
  assert.equal(h.contexts[0].lost, 1);
  const previous = h.draws;
  h.resize(); h.intersect(true); h.hide(false); h.tick();
  assert.equal(h.draws, previous, 'disconnected observers and removed events cannot draw after cleanup');
});

test('inactive chapters cancel and defer resize allocations until reactivated', () => {
  const h = harness(grainientSource);
  const animated = {...staticProps, speed: 1};
  h.render({...animated, active: false}); h.intersect(true); h.resize(); h.tick();
  assert.equal(h.frames, 0);
  assert.equal(h.draws, 0);
  assert.equal(h.allocationCount, 0);
  h.render(animated); h.tick();
  assert.equal(h.draws, 2);
  assert.equal(h.frames, 1);
  h.render({...animated, active: false});
  assert.equal(h.frames, 0);
  const allocations = h.allocationCount;
  h.resize(2000, 1200); h.tick();
  assert.equal(h.allocationCount, allocations);
  assert.equal(h.draws, 2);
  h.render(staticProps); h.tick();
  assert.equal(h.draws, 4);
  assert.equal(h.frames, 0);
  h.unmount();
});

test('unchanged props and new callback identities do not wake an idle background', () => {
  const h = harness(grainientSource);
  h.render({...staticProps, colors: ['#17283f', '#deb394']}); h.intersect(true); h.tick();
  const requests = h.requestedFrames;
  for (let i = 0; i < 8; i++) {
    h.render({...staticProps, colors: ['#17283f', '#deb394'], onReady() {}, onError() {}});
    h.tick();
  }
  assert.equal(h.requestedFrames, requests);
  assert.equal(h.draws, 2);
  h.render({...staticProps, colors: ['#101b2b', '#d6a078']}); h.tick();
  assert.equal(h.draws, 4, 'a real palette change draws once');
  assert.equal(h.frames, 0);
  assert.equal(h.contextRequests, 1, 'palette changes do not recreate the WebGL context');
  h.unmount();
});

test('WebGL creation failures produce a static fallback without scheduling', () => {
  for (const options of [{noWebGL: true}, {throwWebGL: true}]) {
    const h = harness(grainientSource, options);
    const errors = []; let ready = 0;
    h.render({...staticProps, onError: reason => errors.push(reason), onReady: () => ready++});
    h.intersect(true); h.tick();
    assert.deepEqual(errors, ['webgl-unavailable']);
    assert.equal(ready, 0);
    assert.equal(h.frames, 0);
    assert.equal(h.draws, 0);
    assert.equal(h.observers.length, 0);
    h.unmount();
  }
});

test('every shader compile and program link failure cleans up partial GPU allocations', () => {
  for (const options of [
    {failCompile: 1}, {failCompile: 2}, {failCompile: 3}, {failCompile: 4},
    {failLink: 1}, {failLink: 2},
  ]) {
    const h = harness(grainientSource, options);
    const errors = []; let ready = 0;
    h.render({...staticProps, onError: reason => errors.push(reason), onReady: () => ready++});
    h.intersect(true); h.tick();
    assert.deepEqual(errors, ['shader-unavailable'], JSON.stringify(options));
    assert.equal(h.contexts[0].alive.size, 0, 'all partially created resources must be deleted');
    assert.equal(h.contexts[0].lost, 1);
    assert.equal(ready, 0);
    assert.equal(h.frames, 0);
    assert.equal(h.draws, 0);
    assert.equal(h.observers.length, 0);
    h.unmount();
  }
});

test('context loss cancels queued work and does not resume on resize, visibility or input', () => {
  const h = harness(grainientSource);
  const errors = [];
  h.render({...staticProps, speed: 1, onError: reason => errors.push(reason)});
  h.intersect(true); h.tick();
  assert.equal(h.frames, 1);
  h.loseContext();
  assert.deepEqual(errors, ['context-lost']);
  assert.equal(h.frames, 0);
  const before = h.draws, allocations = h.allocationCount;
  h.resize(1800, 1200); h.intersect(false); h.intersect(true);
  h.hide(true); h.hide(false); h.pointer(); h.tick();
  assert.equal(h.draws, before);
  assert.equal(h.allocationCount, allocations);
  assert.equal(h.frames, 0);
  h.unmount();
  assert.equal(h.contexts[0].alive.size, 0);
});

test('the atmosphere wrapper never creates WebGL on mobile or reduced-motion paths', () => {
  for (const props of [
    {active: true, desktop: false, reduced: false},
    {active: true, desktop: true, reduced: true},
    {active: true, desktop: false, reduced: true},
  ]) {
    const h = harness(atmosphereSource);
    h.render(props); h.intersect(true); h.resize(); h.tick();
    assert.equal(h.canvases.length, 0);
    assert.equal(h.contextRequests, 0);
    assert.equal(h.frames, 0);
    assert.equal(h.hostNodes.find(node => node.props.className === 'mineral-atmosphere').dataset.engine, 'static');
    assert.ok(h.hostNodes.some(node => node.props.className === 'mineral-atmosphere-fallback'));
    assert.equal(h.tree.props['aria-hidden'], 'true');
    h.unmount();
  }
});

test('desktop atmosphere draws exactly once within its 600k budget, retaining a CSS fallback', () => {
  const h = harness(atmosphereSource, {width: 3840, height: 2160, dpr: 3});
  const props = {active: true, desktop: true, reduced: false};
  h.render(props); h.intersect(true); h.tick();
  assert.equal(h.contextRequests, 1);
  assert.equal(h.draws, 2);
  assert.equal(h.frames, 0);
  assert.ok(h.canvases[0].width * h.canvases[0].height <= 600000);
  const wrapper = h.hostNodes.find(node => node.props.className === 'mineral-atmosphere');
  assert.equal(wrapper.dataset.engine, 'webgl');
  assert.ok(h.hostNodes.some(node => node.props.className === 'mineral-atmosphere-fallback'));
  for (let i = 0; i < 8; i++) { h.render({...props}); h.pointer(); h.tick(); }
  assert.equal(h.draws, 2, 'ready and unrelated parent renders do not redraw the static material');
  assert.equal(h.frames, 0);
  h.loseContext();
  assert.equal(wrapper.dataset.engine, 'static');
  h.unmount();
});

test('changing desktop or reduced-motion eligibility tears down WebGL and can mount it afresh', () => {
  const h = harness(atmosphereSource);
  const desktop = {active: true, desktop: true, reduced: false};
  h.render(desktop); h.intersect(true); h.tick();
  h.render({...desktop, reduced: true});
  assert.equal(h.canvases.length, 0);
  assert.equal(h.frames, 0);
  assert.equal(h.contexts[0].alive.size, 0);
  assert.equal(h.contexts[0].lost, 1);
  assert.ok(h.observers.every(o => o.disconnected));
  assert.equal(h.win.totalListeners + h.doc.totalListeners, 0);
  h.render(desktop); h.intersect(true); h.tick();
  assert.equal(h.contextRequests, 2);
  assert.equal(h.draws, 4);
  assert.equal(h.frames, 0);
  h.render({...desktop, desktop: false});
  assert.equal(h.canvases.length, 0);
  assert.equal(h.contexts[1].alive.size, 0);
  assert.equal(h.contexts[1].lost, 1);
  h.unmount();
});

test('unsupported WebGL and shader failures leave the atmosphere wrapper in static mode', () => {
  for (const options of [{noWebGL: true}, {failCompile: 2}]) {
    const h = harness(atmosphereSource, options);
    h.render({active: true, desktop: true, reduced: false}); h.intersect(true); h.tick();
    const wrapper = h.hostNodes.find(node => node.props.className === 'mineral-atmosphere');
    assert.equal(wrapper.dataset.engine, 'static');
    assert.ok(h.hostNodes.some(node => node.props.className === 'mineral-atmosphere-fallback'));
    assert.equal(h.draws, 0);
    assert.equal(h.frames, 0);
    h.unmount();
  }
});

