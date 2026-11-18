import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';

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
    handlers(type) { return [...listeners.get(type) || []]; },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
    get totalListeners() {
      return [...listeners.values()].reduce((sum, set) => sum + set.size, 0);
    },
  };
}

function mockGL(options = {}) {
  const calls = [], alive = new Set(), uniforms = [];
  let serial = 0, compileCount = 0, linkCount = 0, lost = 0;
  const resource = kind => { if (options.nullResource === kind) return null; const value = {kind, id: ++serial}; alive.add(value); return value; };
  const gl = {
    calls, alive,
    get lost() { return lost; },
    createShader: () => resource('shader'),
    createProgram: () => resource('program'),
    createBuffer: () => resource('buffer'),
    deleteBuffer: value => alive.delete(value),
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
      ? uniforms.length : linkCount !== options.failLink,
    getActiveUniform: (_program, index) => ({name: uniforms[index]}),
    getUniformLocation: (_program, name) => name,
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
    'COLOR_ATTACHMENT0', 'TRIANGLES', 'TEXTURE0', 'ARRAY_BUFFER', 'STATIC_DRAW', 'FLOAT']) gl[name] = name;
  for (const name of ['shaderSource', 'attachShader', 'bindTexture', 'texParameteri',
    'bindVertexArray', 'disable', 'bindFramebuffer', 'viewport', 'useProgram',
    'uniform1f', 'uniform3fv', 'uniform1i', 'uniform2f', 'uniform4fv', 'uniform1fv',
    'drawArrays', 'activeTexture', 'texImage2D', 'framebufferTexture2D', 'bindAttribLocation', 'bindBuffer', 'bufferData', 'enableVertexAttribArray', 'vertexAttribPointer']) {
    gl[name] = (...args) => {
      calls.push({name, args});
      if (name === 'shaderSource') for (const match of args[1].matchAll(/uniform \w+ (\w+)/g)) {
        if (!uniforms.includes(match[1])) uniforms.push(match[1]);
      }
      if (name === options.throwCall) throw new Error('Simulated GL call failure');
    };
  }
  return gl;
}

function harness(source, options = {}) {
  const scopes = new Map(), nodes = new Map(), frames = new Map(), observers = [], contexts = [];
  const win = eventTarget(), doc = eventTarget(), rootEvents = eventTarget();
  let current, effects = [], dirty = false, mounted = false, props, tree;
  let rafSerial = 0, now = 0, requestedFrames = 0, canceledFrames = 0, contextRequests = 0, bufferWrites = 0;
  const contextAttributes = [];
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
          ...eventTarget(), tagName: type, _width: 0, _height: 0, dataset: {},
          get width() { return this._width; },
          set width(value) { bufferWrites++; this._width = value; },
          get height() { return this._height; },
          set height(value) { bufferWrites++; this._height = value; },
          style: {setProperty() {}, removeProperty() {}},
          get clientWidth() { return dimensions.width; },
          get clientHeight() { return dimensions.height; },
          getBoundingClientRect: () => ({left: 0, top: 0, width: dimensions.width, height: dimensions.height}),
          getContext(kind, attributes) {
            contextAttributes.push(attributes);
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
    contexts, observers, win, doc, contextAttributes,
    get bufferWrites() { return bufferWrites; },
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


const galaxySource = await compile('src/vendor/Galaxy.jsx');
const staticProps = {
  disableAnimation: true, intro: false, mouseInteraction: false,
  mouseRepulsion: false, clickWarp: false, rotationSpeed: 0,
  twinkleIntensity: 0, starSpeed: 0, speed: 0, layers: 2, dpr: 1,
  maxPixels: 600000, active: true,
};
const animatedProps = {...staticProps, disableAnimation: false, speed: 1, starSpeed: 0.3};
const lastUniform = (h, name) => h.contexts[0].calls.filter(c => c.name.startsWith('uniform') && c.args[0] === name).at(-1)?.args.slice(1);

// Shader parity supplements the executing lifecycle tests; the source is passed
// through production JSX and into the actual component's GL calls first.
test('production Galaxy compiles both unchanged upstream shaders', async () => {
  const reference = await readFile(new URL('../reference/Galaxy.jsx', import.meta.url), 'utf8');
  const original = name => reference.match(new RegExp('const ' + name + ' = `([\\s\\S]*?)`;'))[1]
    .replaceAll('${MAX_COLORS}', '4').replaceAll('${MAX_LAYERS}', '8');
  const h = harness(galaxySource);
  h.render(staticProps);
  const sources = h.contexts[0].calls.filter(c => c.name === 'shaderSource').map(c => c.args[1]);
  assert.deepEqual(sources, [original('VERTEX'), original('FRAGMENT')]);
  h.unmount();
});

test('static Galaxy waits for visibility, draws one frame, and stays idle', () => {
  const h = harness(galaxySource);
  let ready = 0;
  h.render({...staticProps, onReady: () => ready++});
  assert.equal(h.frames, 0);
  assert.equal(h.draws, 0);
  assert.equal(h.bufferWrites, 0);
  h.intersect(true); h.tick();
  assert.equal(h.draws, 1);
  assert.equal(h.frames, 0);
  assert.equal(ready, 1);
  for (let i = 0; i < 50; i++) h.tick();
  assert.equal(h.draws, 1);
  assert.equal(h.frames, 0);
  assert.equal(h.contextAttributes[0].powerPreference, 'low-power');
  h.unmount();
});

test('static first-frame uniforms fully reveal two layers, including depth 0.5', () => {
  const h = harness(galaxySource);
  h.render(staticProps); h.intersect(true); h.tick();
  assert.deepEqual(lastUniform(h, 'uDepth'), [0]);
  assert.deepEqual(lastUniform(h, 'uLayers'), [2]);
  assert.deepEqual(lastUniform(h, 'uReveal'), [1]);
  assert.deepEqual(lastUniform(h, 'uWarp'), [0]);
  assert.deepEqual(lastUniform(h, 'uTime'), [0]);
  assert.deepEqual(lastUniform(h, 'uRotationAngle'), [0]);
  assert.ok(lastUniform(h, 'uStarGlow')[0] > 0);
  // Original shader uses fract(k / layers + depth): first layer can fade out,
  // but the second remains at 0.5. Do not accidentally collapse to one layer.
  const depth = lastUniform(h, 'uDepth')[0], layers = lastUniform(h, 'uLayers')[0];
  assert.equal((1 / layers + depth) % 1, 0.5);
  h.unmount();
});

test('disabled interaction has no global pointer listeners or pointer-triggered work', () => {
  const h = harness(galaxySource);
  h.render(staticProps); h.intersect(true); h.tick();
  const requests = h.requestedFrames;
  for (const name of ['pointermove', 'pointerdown', 'pointerup', 'pointercancel']) {
    assert.equal(h.win.listenerCount(name), 0);
    h.pointer(name);
  }
  assert.equal(h.doc.documentElement.listenerCount('pointerleave'), 0);
  for (let i = 0; i < 20; i++) { h.pointer(); h.pointer('pointerdown'); h.tick(); }
  assert.equal(h.requestedFrames, requests);
  assert.equal(h.draws, 1);
  assert.equal(h.frames, 0);
  h.unmount();
});

test('offscreen and hidden transitions immediately cancel queued animation', () => {
  const h = harness(galaxySource);
  h.render(animatedProps); h.intersect(true); h.tick();
  assert.equal(h.frames, 1);
  h.intersect(false);
  assert.equal(h.frames, 0);
  let before = h.draws, writes = h.bufferWrites;
  h.resize(2000, 1200); h.pointer(); h.tick();
  assert.equal(h.draws, before);
  assert.equal(h.bufferWrites, writes);
  h.intersect(true); h.tick();
  assert.equal(h.draws, before + 1);
  assert.equal(h.frames, 1);
  h.hide(true);
  assert.equal(h.frames, 0);
  before = h.draws; writes = h.bufferWrites;
  h.resize(2400, 1600); h.intersect(true); h.tick();
  assert.equal(h.draws, before);
  assert.equal(h.bufferWrites, writes);
  h.hide(false); h.tick();
  assert.equal(h.draws, before + 1);
  h.unmount();
});

test('initial hidden or inactive state allocates no drawing buffer and draws nothing', () => {
  for (const hidden of [false, true]) {
    const h = harness(galaxySource, {hidden});
    h.render({...staticProps, active: !hidden ? false : true});
    h.intersect(true); h.resize(1200, 800); h.tick();
    assert.equal(h.frames, 0);
    assert.equal(h.draws, 0);
    assert.equal(h.bufferWrites, 0);
    if (hidden) h.hide(false); else h.render(staticProps);
    h.tick();
    assert.equal(h.draws, 1);
    assert.equal(h.frames, 0);
    h.unmount();
  }
});

test('active chapter changes cancel immediately and defer resize until reactivated', () => {
  const h = harness(galaxySource);
  h.render(animatedProps); h.intersect(true); h.tick();
  assert.equal(h.frames, 1);
  h.render({...animatedProps, active: false});
  assert.equal(h.frames, 0);
  const before = h.draws, writes = h.bufferWrites;
  h.resize(2000, 1400); h.hide(true); h.hide(false); h.tick();
  assert.equal(h.draws, before);
  assert.equal(h.bufferWrites, writes);
  h.render(staticProps); h.tick();
  assert.equal(h.draws, before + 1);
  assert.equal(h.frames, 0);
  h.unmount();
});

test('pixel budgets hold on oversized, high-DPR and extremely thin displays', () => {
  for (const dimensions of [
    {width: 7680, height: 4320, dpr: 3},
    {width: 4096, height: 2160, dpr: 2},
    {width: 10000000, height: 1, dpr: 3},
    {width: 1, height: 10000000, dpr: 3},
  ]) {
    const h = harness(galaxySource, dimensions);
    h.render({...staticProps, dpr: undefined}); h.intersect(true); h.tick();
    const canvas = h.canvases[0];
    assert.ok(canvas.width > 0 && canvas.height > 0);
    assert.ok(canvas.width * canvas.height <= staticProps.maxPixels,
      `Exceeded budget: ${canvas.width} × ${canvas.height}`);
    if (dimensions.height > 1 && dimensions.width > 1) {
      assert.ok(Math.abs(canvas.width / canvas.height - dimensions.width / dimensions.height) < .01);
    }
    h.unmount();
  }
});

test('resize coalesces into one visible frame and unchanged size never reallocates', () => {
  const h = harness(galaxySource, {width: 500, height: 300});
  h.render(staticProps); h.intersect(true); h.tick();
  const writes = h.bufferWrites;
  h.resize(); h.resize(); h.resize();
  assert.equal(h.draws, 1, 'resize callbacks must not render synchronously');
  assert.equal(h.bufferWrites, writes);
  assert.equal(h.frames, 1);
  h.tick();
  assert.equal(h.draws, 2);
  assert.equal(h.bufferWrites, writes);
  assert.equal(h.frames, 0);
  h.resize(600, 400); h.resize(720, 480);
  assert.equal(h.bufferWrites, writes);
  h.tick();
  assert.equal(h.draws, 3);
  assert.deepEqual([h.canvases[0].width, h.canvases[0].height], [720, 480]);
  assert.equal(h.frames, 0);
  h.unmount();
});

test('DPR and budget changes resize on the next visible frame without a new context', () => {
  const h = harness(galaxySource, {width: 600, height: 400});
  h.render(staticProps); h.intersect(true); h.tick();
  h.render({...staticProps, dpr: 2, maxPixels: 120000});
  assert.equal(h.draws, 1);
  h.tick();
  assert.ok(h.canvases[0].width * h.canvases[0].height <= 120000);
  h.intersect(false);
  const writes = h.bufferWrites;
  h.render({...staticProps, dpr: .5, maxPixels: 60000}); h.tick();
  assert.equal(h.bufferWrites, writes);
  h.intersect(true); h.tick();
  assert.ok(h.canvases[0].width * h.canvases[0].height <= 60000);
  assert.equal(h.contextRequests, 1);
  h.unmount();
});

test('equivalent arrays, callback identities and unrelated parent props cannot wake static Galaxy', () => {
  const h = harness(galaxySource);
  const palette = ['#d5cbb2', '#899bc5'];
  h.render({...staticProps, starColors: palette}); h.intersect(true); h.tick();
  const requests = h.requestedFrames;
  for (let i = 0; i < 10; i++) {
    h.render({...staticProps, starColors: [...palette], focal: [.5, .5], rotation: [1, 0],
      className: 'changed-' + i, style: {opacity: .5}, onReady() {}, onError() {}});
    h.tick();
  }
  assert.equal(h.requestedFrames, requests);
  assert.equal(h.draws, 1);
  h.render({...staticProps, starColors: ['#b4a171', '#708ab6']}); h.tick();
  assert.equal(h.draws, 2);
  assert.equal(h.frames, 0);
  assert.equal(h.contextRequests, 1);
  h.unmount();
});

test('pointer listeners follow changing settings and stale handlers are guarded', () => {
  const h = harness(galaxySource);
  h.render({...staticProps, mouseInteraction: true, clickWarp: true});
  h.intersect(true); h.tick();
  assert.equal(h.win.listenerCount('pointermove'), 1);
  assert.equal(h.win.listenerCount('pointerdown'), 1);
  const staleMove = h.win.handlers('pointermove')[0];
  const staleDown = h.win.handlers('pointerdown')[0];
  h.render(staticProps); h.tick();
  const requests = h.requestedFrames;
  staleMove({clientX: 400, clientY: 300});
  staleDown({clientX: 400, clientY: 300});
  assert.equal(h.requestedFrames, requests);
  assert.equal(h.win.totalListeners, 0);
  assert.equal(h.doc.documentElement.totalListeners, 0);
  h.render({...staticProps, mouseInteraction: true}); h.tick();
  assert.equal(h.win.listenerCount('pointermove'), 1);
  assert.equal(h.win.listenerCount('pointerdown'), 0);
  h.intersect(false);
  const hiddenRequests = h.requestedFrames;
  h.pointer();
  assert.equal(h.requestedFrames, hiddenRequests);
  h.unmount();
});

test('reduced-motion mode never animates or installs pointer listeners', () => {
  const h = harness(galaxySource, {reduced: true});
  h.render({...animatedProps, intro: true, clickWarp: true, mouseInteraction: true});
  h.intersect(true); h.tick();
  assert.equal(h.draws, 1);
  assert.equal(h.frames, 0);
  assert.equal(h.win.totalListeners, 0);
  assert.deepEqual(lastUniform(h, 'uReveal'), [1]);
  h.unmount();
});

test('WebGL context failures report fallback without listeners, observers or frames', () => {
  for (const options of [{noWebGL: true}, {throwWebGL: true}]) {
    const h = harness(galaxySource, options), errors = [];
    let ready = 0;
    h.render({...staticProps, onError: reason => errors.push(reason), onReady: () => ready++});
    h.intersect(true); h.tick();
    assert.deepEqual(errors, ['webgl-unavailable']);
    assert.equal(ready, 0);
    assert.equal(h.draws, 0);
    assert.equal(h.frames, 0);
    assert.equal(h.observers.length, 0);
    assert.equal(h.win.totalListeners + h.doc.totalListeners, 0);
    h.unmount();
  }
});

test('every shader compile/link failure and null allocation releases all partial GPU resources', () => {
  for (const options of [{failCompile: 1}, {failCompile: 2}, {failLink: 1},
    {nullResource: 'shader'}, {nullResource: 'program'},
    {nullResource: 'buffer'}, {nullResource: 'vertex-array'}, {throwCall: 'bufferData'}]) {
    const h = harness(galaxySource, options), errors = [];
    let ready = 0;
    h.render({...staticProps, onError: reason => errors.push(reason), onReady: () => ready++});
    h.intersect(true); h.tick();
    assert.equal(errors.length, 1, JSON.stringify(options));
    assert.match(errors[0], /^(shader|resource)-unavailable$/);
    assert.equal(h.contexts[0].alive.size, 0, JSON.stringify(options));
    assert.equal(h.contexts[0].lost, 1);
    assert.equal(ready, 0);
    assert.equal(h.frames, 0);
    assert.equal(h.draws, 0);
    assert.equal(h.observers.length, 0);
    h.unmount();
    assert.equal(h.contexts[0].lost, 1, 'cleanup is idempotent');
  }
});

test('a later shader variant failure also cleans existing programs and attached observers', () => {
  const h = harness(galaxySource, {failCompile: 3}), errors = [];
  h.render({...staticProps, clickWarp: true, onError: reason => errors.push(reason)});
  h.intersect(true); h.tick();
  assert.equal(h.draws, 1);
  h.pointer('pointerdown'); h.tick();
  assert.deepEqual(errors, ['shader-unavailable']);
  assert.equal(h.contexts[0].alive.size, 0);
  assert.equal(h.frames, 0);
  assert.ok(h.observers.every(o => o.disconnected));
  assert.equal(h.win.totalListeners + h.doc.totalListeners, 0);
  h.unmount();
});

test('context loss releases resources, cancels work and permanently falls back', () => {
  const h = harness(galaxySource), errors = [];
  h.render({...animatedProps, onError: reason => errors.push(reason)});
  h.intersect(true); h.tick();
  assert.equal(h.frames, 1);
  h.loseContext();
  assert.deepEqual(errors, ['context-lost']);
  assert.equal(h.frames, 0);
  assert.equal(h.contexts[0].alive.size, 0);
  assert.ok(h.observers.every(o => o.disconnected));
  const before = h.draws, writes = h.bufferWrites;
  h.resize(2000, 1400); h.intersect(false); h.intersect(true);
  h.hide(true); h.hide(false); h.pointer(); h.render(staticProps); h.tick();
  assert.equal(h.draws, before);
  assert.equal(h.bufferWrites, writes);
  assert.equal(h.frames, 0);
  h.unmount();
});

test('unmount removes all listeners, observers, RAF and GL allocations exactly once', () => {
  const h = harness(galaxySource);
  h.render({...animatedProps, mouseInteraction: true, clickWarp: true});
  h.intersect(true); h.tick();
  assert.equal(h.frames, 1);
  const canvas = h.canvases[0];
  h.unmount();
  assert.equal(h.frames, 0);
  assert.ok(h.observers.every(o => o.disconnected));
  assert.equal(h.win.totalListeners + h.doc.totalListeners + h.doc.documentElement.totalListeners, 0);
  assert.equal(canvas.totalListeners, 0);
  assert.equal(h.contexts[0].alive.size, 0);
  assert.equal(h.contexts[0].lost, 1);
  const before = h.draws;
  h.resize(); h.intersect(true); h.hide(false); h.pointer(); h.tick();
  assert.equal(h.draws, before);
});
