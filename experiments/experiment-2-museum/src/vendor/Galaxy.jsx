/* React Bits Galaxy by David Haz, MIT + Commons Clause.
   Original shaders retained. V9 bounds pixels and renders only on visible demand. */
'use client';

import { useEffect, useRef } from 'react';
import './Galaxy.css';

const MAX_LAYERS = 8;
const MAX_COLORS = 4;
const INTRO_SECONDS = 2.2;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uGloss;
uniform float uDepth;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uStarGlow;
uniform float uFlareGain;
uniform float uSquash;
uniform float uSaturation;
uniform float uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationAngle;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform int uLayers;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform float uWarp;
uniform float uReveal;
uniform float uMode;
uniform vec3 uBackground;
uniform float uOpacity;
out vec4 outColor;

#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare, vec2 radial, float invReach) {
#ifdef WARP
  float along = dot(uv, radial);
  float d = sqrt(max(dot(uv, uv) - uSquash * along * along, 0.0));
#else
  float d = length(uv);
#endif
  float m = uStarGlow / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uFlareGain;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uFlareGain;
  m *= smoothstep(1.0, 0.2, d * invReach);
#ifdef WARP
  m *= mix(1.0, smoothstep(1.0, 0.55, length(uv) * invReach), min(uWarp * 4.0, 1.0));
#endif
  return m;
}

vec3 StarLayer(vec2 uv, vec2 radial, vec2 repelAt, float pushCells, float spread) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + offset;
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uGloss / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

#ifdef PALETTE
      float pick = Hash21(si + 7.0) * float(uColorCount);
      vec3 base = uColors[int(min(floor(pick), float(uColorCount - 1)))];
#else
      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));
#endif

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;
      vec2 shift = vec2(0.0);
      float invReach = 1.0;
#ifdef REPEL
      vec2 away = si + 0.5 + pad - repelAt;
      float dist = length(away);
      float q = dist * spread;
      float cells = pushCells * exp(-q * q);
      float moved = cells * inversesqrt(1.0 + cells * cells * 2.78);
      shift = away * (moved / max(dist, 0.0001));
      invReach = 1.0 / (1.0 - moved);
#endif
      float star = Star(gv - offset - pad - shift, flareSize, radial, invReach);
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      col += star * twinkle * size * base;
    }
  }
  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution;
  vec2 uv = (gl_FragCoord.xy - focalPx) / uResolution.y;
  vec2 mouseNorm = uMouse - vec2(0.5);

  vec2 repelAt = vec2(0.0);
  float strength = 0.0;
  float push = 0.0;
  if (uAutoCenterRepulsion > 0.0) {
    strength = uAutoCenterRepulsion;
    push = strength * 0.05;
  } else if (uMouseRepulsion > 0.5) {
    repelAt = (uMouse * uResolution - focalPx) / uResolution.y;
    strength = max(uRepulsionStrength, 0.0);
    push = strength * 0.05 * uMouseActiveFactor;
  } else {
    uv += mouseNorm * 0.1 * uMouseActiveFactor;
  }
  float radius = 0.16 + 0.04 * strength;

  vec2 radial = length(uv) > 0.0001 ? normalize(uv) : vec2(1.0, 0.0);
  float angle = uRotationAngle;
  uv = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * uv;
  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;
  radial = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * radial;
  radial = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * radial;
  repelAt = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * repelAt;
  repelAt = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * repelAt;

  vec3 col = vec3(0.0);
  float layers = float(uLayers);
  for (int k = 0; k < ${MAX_LAYERS}; k++) {
    if (k >= uLayers) break;
    float i = float(k) / layers;
    float depth = fract(i + uDepth);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    vec2 offset = vec2(i * 453.32);
    col += StarLayer(uv * scale + offset, radial, repelAt * scale + offset, push * scale, 1.0 / (scale * radius)) * fade;
  }
  col *= uReveal;

  if (uMode > 1.5) {
    vec3 lit = col * smoothstep(0.0, 0.3, length(col));
    float energy = max(max(lit.r, lit.g), lit.b);
    vec3 tint = lit / max(energy, 0.0001);
    vec3 ink = tint * (0.16 / max(dot(tint, vec3(0.2126, 0.7152, 0.0722)), 0.16));
    float coverage = pow(min(energy * 1.3, 1.0), 1.3) * 0.92 * uOpacity;
    outColor = uMode > 2.5 ? vec4(ink * coverage, coverage) : vec4(mix(uBackground, ink, coverage), 1.0);
  } else if (uMode > 0.5) {
    float alpha = min(smoothstep(0.0, 0.3, length(col)), 1.0) * uOpacity;
    outColor = vec4(col * alpha, alpha);
  } else {
    outColor = vec4(mix(uBackground, col, uOpacity), 1.0);
  }
}`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const keyOf = (palette, repel, warp) => (palette ? 4 : 0) + (repel ? 2 : 0) + (warp ? 1 : 0);

// Compile only variants that are actually drawn. Every partial allocation is
// owned here, including failures before linking and null resource returns.
const link = (gl, palette, repel, warp) => {
  const defines = `${palette ? '#define PALETTE\n' : ''}${repel ? '#define REPEL\n' : ''}${warp ? '#define WARP\n' : ''}`;
  let vertex, fragment, program, linked = false;
  try {
    vertex = gl.createShader(gl.VERTEX_SHADER);
    if (!vertex) return null;
    gl.shaderSource(vertex, VERTEX);
    gl.compileShader(vertex);
    if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) return null;
    fragment = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragment) return null;
    gl.shaderSource(fragment, FRAGMENT.replace('\n', `\n${defines}`));
    gl.compileShader(fragment);
    if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) return null;
    program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(program, info.name);
    }
    linked = true;
    return {program, uniforms};
  } catch {
    return null;
  } finally {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program && !linked) gl.deleteProgram(program);
  }
};

const Galaxy = ({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  lightMode = false,
  starColors,
  starSize = 1,
  flareIntensity = 1,
  layers = 4,
  direction = 'forward',
  clickWarp = true,
  intro = true,
  backgroundColor,
  opacity = 1,
  dpr,
  active = true,
  maxPixels = 600000,
  onReady,
  onError,
  className = '',
  style,
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const palette = Array.isArray(starColors) ? starColors.filter(Boolean).slice(0, MAX_COLORS) : [];
  const settings = {
    focal: Array.isArray(focal) ? focal : [0.5, 0.5],
    rotation: Array.isArray(rotation) ? rotation : [1, 0],
    starSpeed,
    density: Math.max(0.01, density),
    hueShift,
    disableAnimation,
    speed,
    mouseInteraction,
    glowIntensity: Math.max(0, glowIntensity),
    saturation: Math.max(0, saturation),
    mouseRepulsion,
    repulsionStrength,
    twinkleIntensity: clamp(twinkleIntensity, 0, 1),
    rotationSpeed,
    autoCenterRepulsion: Math.max(0, autoCenterRepulsion),
    transparent,
    lightMode,
    palette,
    starSize: Math.max(0, starSize),
    flareIntensity: Math.max(0, flareIntensity),
    layers: clamp(Math.round(layers), 2, MAX_LAYERS),
    reverse: direction === 'backward',
    clickWarp,
    intro,
    backgroundColor,
    opacity: clamp(opacity, 0, 1),
    dpr, active,
    maxPixels: Number.isFinite(maxPixels) ? Math.max(1, Math.floor(maxPixels)) : 600000,
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const callbacksRef = useRef({onReady, onError});
  callbacksRef.current = {onReady, onError};
  // Equivalent array values and changing callback identities must not wake an
  // inert background when its parent rerenders or receives the ready callback.
  const settingsKey = JSON.stringify(settings);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    let gl;
    try {
      gl = canvas?.getContext('webgl2', {
        alpha: true, premultipliedAlpha: true, antialias: false,
        depth: false, stencil: false, powerPreference: 'low-power',
      });
    } catch {}
    if (!container || !canvas || !gl) {
      callbacksRef.current.onError?.('webgl-unavailable');
      return undefined;
    }

    const programs = new Map();
    let buffer, vao, raf = 0, last = 0;
    let visible = false, needsResize = true, didReady = false;
    let failed = false, disposed = false, released = false;
    let detach = () => {};
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };
    const releaseGPU = () => {
      if (released) return;
      released = true;
      programs.forEach(found => gl.deleteProgram(found.program));
      programs.clear();
      if (buffer) gl.deleteBuffer(buffer);
      if (vao) gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    const fail = reason => {
      if (failed || disposed) return;
      failed = true;
      stop();
      wakeRef.current = null;
      detach();
      releaseGPU();
      callbacksRef.current.onError?.(reason);
    };
    const variant = (palette, repel, warp) => {
      const key = keyOf(palette, repel, warp);
      if (programs.has(key)) return programs.get(key);
      const found = link(gl, palette, repel, warp);
      if (!found) { fail('shader-unavailable'); return null; }
      programs.set(key, found);
      return found;
    };
    if (!variant(settingsRef.current.palette.length > 0, false, false)) return undefined;
    try {
      buffer = gl.createBuffer();
      vao = gl.createVertexArray();
      if (!buffer || !vao) throw new Error('WebGL geometry allocation failed');
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    } catch {
      fail('resource-unavailable');
      return undefined;
    }

    let probe;
    try { probe = document.createElement('canvas').getContext('2d', {willReadFrequently: true}); } catch {}
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const cache = new Map();
    const parse = (value, fallback) => {
      if (!value) return fallback;
      const key = String(value);
      if (cache.has(key)) return cache.get(key);
      let rgb = fallback;
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = key;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      cache.set(key, rgb);
      return rgb;
    };
    const colors = new Float32Array(MAX_COLORS * 3);
    const pointer = {x: 0.5, y: 0.5, inside: false};
    const state = {
      time: 0, gloss: 0, depth: 0, angle: 0,
      mx: 0.5, my: 0.5, active: 0, boost: 0,
      reveal: settingsRef.current.intro && !reduce ? 0 : 1,
    };
    const canRun = () => visible && !document.hidden && settingsRef.current.active && !failed && !disposed;

    const resizeBuffer = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(Math.max(0.01, s.dpr || window.devicePixelRatio || 1), 2,
        Math.sqrt(s.maxPixels / (width * height)));
      let w = Math.max(1, Math.floor(width * ratio));
      let h = Math.max(1, Math.floor(height * ratio));
      // Rounding a very thin dimension up to 1 must still obey the budget.
      if (w * h > s.maxPixels) {
        if (w >= h) w = Math.max(1, Math.floor(s.maxPixels / h));
        else h = Math.max(1, Math.floor(s.maxPixels / w));
      }
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      needsResize = false;
    };

    const render = () => {
      const s = settingsRef.current;
      s.palette.forEach((value, index) => colors.set(parse(value, [1, 1, 1]), index * 3));
      const mode = s.lightMode ? (s.transparent ? 3 : 2) : s.transparent ? 1 : 0;
      const background = parse(s.backgroundColor, s.lightMode ? [1, 1, 1] : [0, 0, 0]);
      const repel = s.autoCenterRepulsion > 0 || (s.mouseRepulsion && s.repulsionStrength > 0 && state.active > 0);
      const program = variant(s.palette.length > 0, repel, state.boost > 0);
      if (!program) return false;
      const u = program.uniforms;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program.program);
      gl.bindVertexArray(vao);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform2f(u.uFocal, s.focal[0], s.focal[1]);
      gl.uniform2f(u.uRotation, s.rotation[0], s.rotation[1]);
      gl.uniform1f(u.uGloss, state.gloss);
      gl.uniform1f(u.uDepth, state.depth);
      gl.uniform1f(u.uDensity, s.density);
      gl.uniform1f(u.uHueShift, s.hueShift);
      gl.uniform1f(u.uSpeed, s.speed);
      gl.uniform2f(u.uMouse, state.mx, state.my);
      const stretch = 1 + state.boost * 5;
      gl.uniform1f(u.uStarGlow, (0.05 * s.glowIntensity * s.starSize) / Math.pow(stretch, 0.6));
      gl.uniform1f(u.uFlareGain, s.glowIntensity * s.flareIntensity);
      gl.uniform1f(u.uSquash, 1 - 1 / (stretch * stretch));
      gl.uniform1f(u.uSaturation, s.saturation);
      gl.uniform1f(u.uMouseRepulsion, s.mouseRepulsion ? 1 : 0);
      gl.uniform1f(u.uTwinkleIntensity, s.twinkleIntensity);
      gl.uniform1f(u.uRotationAngle, state.angle);
      gl.uniform1f(u.uRepulsionStrength, s.repulsionStrength);
      gl.uniform1f(u.uMouseActiveFactor, state.active);
      gl.uniform1f(u.uAutoCenterRepulsion, s.autoCenterRepulsion);
      gl.uniform1i(u.uLayers, s.layers);
      gl.uniform3fv(u.uColors, colors);
      gl.uniform1i(u.uColorCount, s.palette.length);
      gl.uniform1f(u.uWarp, state.boost);
      const fade = Math.min(1, state.reveal / 0.35);
      gl.uniform1f(u.uReveal, fade * fade * (3 - 2 * fade));
      gl.uniform1f(u.uMode, mode);
      gl.uniform3fv(u.uBackground, background);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!didReady) { didReady = true; callbacksRef.current.onReady?.(); }
      return true;
    };

    const frame = now => {
      raf = 0;
      if (!canRun()) { last = 0; return; }
      const s = settingsRef.current;
      try {
        if (needsResize) resizeBuffer();
        const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
        last = now;
        const motion = s.disableAnimation || reduce ? 0 : 1;
        if (s.intro && !reduce && state.reveal < 1) {
          state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);
          state.boost = Math.max(state.boost, Math.pow(1 - state.reveal, 2) * 1.4);
        } else if (!s.intro || reduce) state.reveal = 1;
        const flight = (s.starSpeed / 10) * (s.reverse ? -1 : 1);
        state.time += dt * motion;
        state.gloss += dt * flight * motion;
        state.depth += dt * flight * s.speed * motion * (1 + state.boost * 14);
        state.angle += dt * s.rotationSpeed * motion;
        state.boost *= Math.exp(-dt * 1.3);
        if (state.boost < 0.001) state.boost = 0;
        const follow = 1 - Math.exp(-dt / 0.325);
        const engaged = s.mouseInteraction && pointer.inside && !reduce;
        if (engaged) {
          state.mx += (pointer.x - state.mx) * follow;
          state.my += (pointer.y - state.my) * follow;
          if (Math.abs(pointer.x - state.mx) < 0.001) state.mx = pointer.x;
          if (Math.abs(pointer.y - state.my) < 0.001) state.my = pointer.y;
        }
        const target = engaged ? 1 : 0;
        state.active += (target - state.active) * follow;
        if (Math.abs(target - state.active) < 0.001) state.active = target;
        if (!render()) return;
        const moving = motion > 0 && (s.speed !== 0 || s.starSpeed !== 0 || s.rotationSpeed !== 0);
        const following = engaged && (state.mx !== pointer.x || state.my !== pointer.y);
        const busy = moving || state.boost > 0 || state.active !== target || following || state.reveal < 1;
        if (busy) wake();
        else last = 0;
      } catch {
        fail('render-unavailable');
      }
    };
    function wake() {
      if (!canRun()) { stop(); return; }
      if (!raf) raf = requestAnimationFrame(frame);
    }
    // ResizeObserver never touches the drawing buffer or draws synchronously.
    const resize = () => { needsResize = true; wake(); };
    const locate = event => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      pointer.x = x / Math.max(1, rect.width);
      pointer.y = 1 - y / Math.max(1, rect.height);
    };
    const onPointerMove = event => {
      if (!settingsRef.current.mouseInteraction || reduce || !canRun()) return;
      locate(event);
      if (pointer.inside || state.active > 0) wake();
    };
    const onPointerDown = event => {
      if (!settingsRef.current.clickWarp || reduce || !canRun()) return;
      locate(event);
      if (!pointer.inside) return;
      state.boost = Math.min(1.6, state.boost + 1);
      wake();
    };
    const onPointerUp = event => {
      if (!settingsRef.current.mouseInteraction || reduce || !canRun()) return;
      if (event.pointerType !== 'mouse') { pointer.inside = false; wake(); }
    };
    const onPointerLeave = () => {
      if (!settingsRef.current.mouseInteraction || reduce || !canRun()) return;
      pointer.inside = false;
      wake();
    };
    const removePointers = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
    let pointerKey;
    const syncPointers = () => {
      const s = settingsRef.current;
      const key = `${s.mouseInteraction}|${s.clickWarp}`;
      if (key === pointerKey) return;
      pointerKey = key;
      removePointers();
      if (s.mouseInteraction && !reduce) {
        window.addEventListener('pointermove', onPointerMove, {passive: true});
        window.addEventListener('pointerup', onPointerUp, {passive: true});
        window.addEventListener('pointercancel', onPointerUp, {passive: true});
        document.documentElement.addEventListener('pointerleave', onPointerLeave);
      } else {
        pointer.inside = false;
        state.active = 0;
        state.mx = state.my = 0.5;
      }
      if (s.clickWarp && !reduce) window.addEventListener('pointerdown', onPointerDown, {passive: true});
      else if (!s.intro || state.reveal >= 1) state.boost = 0;
    };
    const onVisibility = () => { last = 0; wake(); };
    const onContextLost = () => fail('context-lost');
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      last = 0;
      wake();
    });
    detach = () => {
      resizeObserver.disconnect();
      intersection.disconnect();
      removePointers();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
    };
    resizeObserver.observe(container);
    intersection.observe(container);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onContextLost);
    syncPointers();
    let lastDpr = settingsRef.current.dpr;
    let lastBudget = settingsRef.current.maxPixels;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.dpr !== lastDpr || s.maxPixels !== lastBudget) {
        lastDpr = s.dpr;
        lastBudget = s.maxPixels;
        needsResize = true;
      }
      syncPointers();
      wake();
    };

    return () => {
      disposed = true;
      stop();
      wakeRef.current = null;
      detach();
      releaseGPU();
    };
  }, []);

  useEffect(() => { wakeRef.current?.(); }, [settingsKey]);

  return (
    <div ref={containerRef} className={`galaxy-container${className ? ` ${className}` : ''}`} style={style} {...rest}>
      <canvas ref={canvasRef} className="galaxy-canvas" aria-hidden="true" />
    </div>
  );
};

export default Galaxy;
