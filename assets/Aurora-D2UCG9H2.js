import{r as P,R as ce}from"./index-DYqqSlB7.js";import{a as le,c as Me}from"./renderBudget-DnUjQnA8.js";const H=5,fe=3,Pe=2.4,Le=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,Fe=`#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uStops[${H}];
uniform int uStopCount;
uniform float uAmplitude;
uniform float uBlend;
uniform float uHeight;
uniform float uScale;
uniform float uGlow;
uniform float uBrightness;
uniform int uLayers;
uniform float uFlip;
uniform vec3 uPointer;
uniform float uReveal;
uniform float uOpacity;
uniform float uLightMode;
out vec4 outColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float smootherstep(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * float(uStopCount - 1);
  int i = int(min(floor(x), float(uStopCount - 2)));
  float f = x - float(i);
  f = f * f * (3.0 - 2.0 * f);
  vec3 lch = mix(uStops[i], uStops[i + 1], f);
  lch.x = mix(lch.x, min(lch.x, 0.7), uLightMode);
  return toSrgb(oklabToLinear(vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z))));
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float y = 1.0 - frag.y / uResolution.y;
  y = mix(y, 1.0 - y, uFlip);
  float u = frag.x / uResolution.x;
  float X = (frag.x - uResolution.x * 0.5) / uResolution.y;
  float t = uTime;
  float reach = uPointer.z * exp(-pow((X - uPointer.x) / 0.38, 2.0));

  vec3 glow = vec3(0.0);
  float cover = 0.0;
  for (int k = 0; k < ${fe}; k++) {
    if (k >= uLayers) break;
    float layer = float(k);
    float seed = layer * 13.7;
    float pace = t * (1.0 - layer * 0.18);
    float warp = snoise(vec2(X * 0.45 * uScale + pace * 0.02 + seed, pace * 0.05 + seed));
    float wave = snoise(vec2(X * 0.75 * uScale + warp * 0.35 - pace * 0.03 + seed, pace * 0.07 - seed)) * 0.72
      + snoise(vec2(X * 1.6 * uScale + warp * 0.5 + pace * 0.04 - seed, pace * 0.1 + seed * 0.5)) * 0.28;
    float hem = uHeight + layer * 0.07 + wave * 0.15 * uAmplitude;
    hem += reach * 0.08 * (layer < 0.5 ? 1.0 : 0.4);
    hem = mix(-0.25, hem, uReveal);

    float soft = (0.04 + uBlend * 0.16) * (1.0 + layer * 0.9);
    float rise = hem - y;
    float low = -soft - uGlow * 0.14;
    float high = 0.26 + soft * 0.6;
    float body = pow(smootherstep(low, high, rise), 1.5 + uGlow * 0.6);
    float lobes = 0.86 + 0.14 * snoise(vec2(X * 0.9 * uScale - pace * 0.025 + seed, y * 0.3 + pace * 0.04));
    float alpha = body * lobes * (layer < 0.5 ? 1.0 : 0.32 / layer);
    alpha = clamp(alpha * (1.0 + reach * 0.25 * smootherstep(0.9, 0.0, abs(y - hem))), 0.0, 1.0);

    vec3 tint = ramp(u + 0.05 * sin(pace * 0.08 + layer * 2.3) + layer * 0.1 + max(rise, 0.0) * 0.05);
    glow = 1.0 - (1.0 - glow) * (1.0 - tint * alpha);
    cover = 1.0 - (1.0 - cover) * (1.0 - alpha);
  }

  float fade = smootherstep(0.0, 0.7, uReveal) * uOpacity;
  float strength = clamp(uBrightness, 0.0, 2.0);
  glow *= fade * min(strength, 1.0);
  cover *= fade * min(strength, 1.0);
  glow = 1.0 - pow(1.0 - glow, vec3(max(strength, 1.0)));
  float dither = (hash(frag) - 0.5) / 255.0;

  if (uLightMode > 0.5) {
    vec3 tint = cover > 0.0001 ? glow / cover : vec3(0.0);
    cover *= smootherstep(0.0, 0.25, cover);
    float alpha = cover * 0.7;
    outColor = vec4(tint * alpha + dither, clamp(alpha + dither, 0.0, 1.0));
    return;
  }
  outColor = vec4(glow + dither, clamp(cover + dither, 0.0, 1.0));
}`,w=(t,i,c)=>Math.min(c,Math.max(i,t)),Ce=t=>{const[i,c,o]=t.map(L=>L<=.04045?L/12.92:Math.pow((L+.055)/1.055,2.4)),f=Math.cbrt(.4122214708*i+.5363325363*c+.0514459929*o),m=Math.cbrt(.2119034982*i+.6806995451*c+.1073969566*o),x=Math.cbrt(.0883024619*i+.2817188376*c+.6299787005*o),d=[.2104542553*f+.793617785*m-.0040720468*x,1.9779984951*f-2.428592205*m+.4505937099*x,.0259040371*f+.7827717662*m-.808675766*x];return[d[0],Math.hypot(d[1],d[2]),Math.atan2(d[2],d[1])]},Te=t=>{const i=t.findIndex(f=>f[1]>.02);let o=i===-1?0:t[i][2];return t.map(f=>{let m=f[1]>.02?f[2]:o;for(;m-o>Math.PI;)m-=Math.PI*2;for(;m-o<-Math.PI;)m+=Math.PI*2;return o=m,[f[0],f[1],m]})},ue=(t,i,c)=>{const o=t.createShader(i);return o?(t.shaderSource(o,c),t.compileShader(o),t.getShaderParameter(o,t.COMPILE_STATUS)?o:(t.deleteShader(o),null)):null},ze=t=>{const i=ue(t,t.VERTEX_SHADER,Le),c=ue(t,t.FRAGMENT_SHADER,Fe),o=t.createProgram();if(!i||!c||!o)return i&&t.deleteShader(i),c&&t.deleteShader(c),o&&t.deleteProgram(o),null;if(t.attachShader(o,i),t.attachShader(o,c),t.bindAttribLocation(o,0,"aPosition"),t.linkProgram(o),t.deleteShader(i),t.deleteShader(c),!t.getProgramParameter(o,t.LINK_STATUS))return t.deleteProgram(o),null;const f={},m=t.getProgramParameter(o,t.ACTIVE_UNIFORMS);for(let x=0;x<m;x++){const d=t.getActiveUniform(o,x);d&&(f[d.name.replace("[0]","")]=t.getUniformLocation(o,d.name))}return{program:o,uniforms:f}},_e=({colorStops:t=["#5227FF","#7cff67","#5227FF"],amplitude:i=1,blend:c=.5,speed:o=1,time:f,height:m=.45,scale:x=1,glow:d=.6,brightness:L=1,layers:me=1,direction:he="top",mouseInteraction:de=!0,intro:pe=!0,opacity:ve=1,lightMode:xe=!1,paused:ge=!1,dpr:ye=1,maxFps:we=30,maxPixels:be=1e6,className:q="",style:Se})=>{const Y=P.useRef(null),$=P.useRef(null),G=P.useRef(null),F=(Array.isArray(t)?t:[]).filter(Boolean).map(String).slice(0,H),W={stops:F.length>=2?F:F.length===1?[F[0],F[0]]:["#5227FF","#7cff67"],amplitude:Math.max(0,i),blend:w(c,0,1),speed:o,time:f,height:w(m,0,1),scale:Math.max(.1,x),glow:Math.max(0,d),brightness:Math.max(0,L),layers:w(Math.round(me),1,fe),flip:he==="bottom"?1:0,mouseInteraction:de,intro:pe,opacity:w(ve,0,1),lightMode:xe,paused:ge,dpr:ye,maxFps:w(we,1,30),maxPixels:w(be,1e4,1e6)},h=P.useRef(W);return h.current=W,P.useEffect(()=>{const b=Y.current,p=$.current,r=p?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!b||!p||!r)return;const I=ze(r);if(!I)return;const l=I.uniforms,K=r.createBuffer(),V=r.createVertexArray();r.bindVertexArray(V),r.bindBuffer(r.ARRAY_BUFFER,K),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW),r.enableVertexAttribArray(0),r.vertexAttribPointer(0,2,r.FLOAT,!1,0,0);const S=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),k=window.matchMedia?.("(prefers-reduced-motion: reduce)");let g=k?.matches??!1;const N=new Map,Re=e=>{if(N.has(e))return N.get(e);let n=[1,1,1];if(S){S.clearRect(0,0,1,1),S.fillStyle="#ffffff",S.fillStyle=e,S.fillRect(0,0,1,1);const[u,v,z]=S.getImageData(0,0,1,1).data;n=[u/255,v/255,z/255]}return N.set(e,n),n},j=new Float32Array(H*3),R={width:1,height:1},s={x:0,y:0,inside:!1},a={clock:0,px:0,py:.5,reach:0,reveal:h.current.intro&&!g?0:1};let y=0,C=0,E=!1,_=!0,A=!1,B=le(h.current.maxFps);const J=()=>{if(!_||!E||document.hidden||A)return;const e=h.current;Te(e.stops.map(u=>Ce(Re(u)))).forEach((u,v)=>j.set(u,v*3));const n=a.reveal;r.viewport(0,0,p.width,p.height),r.useProgram(I.program),r.bindVertexArray(V),r.uniform2f(l.uResolution,p.width,p.height),r.uniform1f(l.uTime,e.time!==void 0?e.time*e.speed*.1:a.clock),r.uniform3fv(l.uStops,j),r.uniform1i(l.uStopCount,e.stops.length),r.uniform1f(l.uAmplitude,e.amplitude),r.uniform1f(l.uBlend,e.blend),r.uniform1f(l.uHeight,e.height),r.uniform1f(l.uScale,e.scale),r.uniform1f(l.uGlow,e.glow),r.uniform1f(l.uBrightness,e.brightness),r.uniform1i(l.uLayers,e.layers),r.uniform1f(l.uFlip,e.flip),r.uniform3f(l.uPointer,a.px,a.py,a.reach),r.uniform1f(l.uReveal,1-Math.pow(1-n,3)),r.uniform1f(l.uOpacity,e.opacity),r.uniform1f(l.uLightMode,e.lightMode?1:0),r.drawArrays(r.TRIANGLES,0,3)},U=e=>{if(y=0,!_||!E||document.hidden||A)return;if(!B.ready(e)){y=requestAnimationFrame(U);return}const n=h.current,u=C?w((e-C)/1e3,5e-4,.05):1/60;if(C=e,n.paused||g){a.reveal=1,J(),C=0;return}const v=g?0:1;a.clock+=u*n.speed*v;const z=n.mouseInteraction&&s.inside&&!g,se=1-Math.exp(-u/.6);if(z){const Ee=(s.x-R.width/2)/R.height,Ae=n.flip?1-s.y/R.height:s.y/R.height;a.px+=(Ee-a.px)*se,a.py+=(Ae-a.py)*se}a.reach+=((z?1:0)-a.reach)*(1-Math.exp(-u/(z?.9:1.4))),!n.intro||g?a.reveal=1:a.reveal<1&&(a.reveal=Math.min(1,a.reveal+u/Pe)),J(),y=requestAnimationFrame(U)},M=()=>{!y&&_&&E&&!document.hidden&&!A&&(y=requestAnimationFrame(U))},D=()=>{const e=h.current,n=b.clientWidth,u=b.clientHeight;if(!n||!u||A)return;const v=Me(n,u,e.dpr,e.maxPixels);R.width=n,R.height=u,p.width=v.width,p.height=v.height,B.reset(),M()},O=e=>{if(!E||A||g||h.current.paused||!h.current.mouseInteraction)return;const n=b.getBoundingClientRect();s.x=e.clientX-n.left,s.y=e.clientY-n.top;const u=s.inside;if(s.inside=s.x>=0&&s.y>=0&&s.x<=n.width&&s.y<=n.height,s.inside&&!u){const v=h.current;a.px=(s.x-n.width/2)/Math.max(1,n.height),a.py=v.flip?1-s.y/Math.max(1,n.height):s.y/Math.max(1,n.height)}h.current.paused||M()},X=e=>{e.pointerType!=="mouse"&&(s.inside=!1)},Q=()=>{s.inside=!1},T=()=>{cancelAnimationFrame(y),y=0,C=0,B.reset()},Z=()=>{A=!0,p.style.visibility="hidden",T()},ee=()=>{T(),document.hidden||M()},te=()=>{g=k?.matches??!1,T(),M()},re=new ResizeObserver(D);re.observe(b);const oe=new IntersectionObserver(e=>{E=e.some(n=>n.isIntersecting&&n.intersectionRect.height>0),T(),E&&M()});oe.observe(b),window.addEventListener("pointermove",O,{passive:!0}),window.addEventListener("pointerdown",O,{passive:!0}),window.addEventListener("pointerup",X,{passive:!0}),window.addEventListener("pointercancel",X,{passive:!0}),document.documentElement.addEventListener("pointerleave",Q),document.addEventListener("visibilitychange",ee),k?.addEventListener("change",te),p.addEventListener("webglcontextlost",Z),D();let ne=h.current.dpr,ae=h.current.maxPixels,ie=h.current.maxFps;return G.current=()=>{const e=h.current;if(e.maxFps!==ie&&(ie=e.maxFps,B=le(e.maxFps)),e.dpr!==ne||e.maxPixels!==ae){ne=e.dpr,ae=e.maxPixels,D();return}M()},()=>{_=!1,T(),G.current=null,re.disconnect(),oe.disconnect(),window.removeEventListener("pointermove",O),window.removeEventListener("pointerdown",O),window.removeEventListener("pointerup",X),window.removeEventListener("pointercancel",X),document.documentElement.removeEventListener("pointerleave",Q),document.removeEventListener("visibilitychange",ee),k?.removeEventListener("change",te),p.removeEventListener("webglcontextlost",Z),r.deleteProgram(I.program),r.deleteBuffer(K),r.deleteVertexArray(V),r.getExtension("WEBGL_lose_context")?.loseContext()}},[]),P.useEffect(()=>{G.current?.()}),ce.createElement("div",{ref:Y,className:`aurora-container${q?` ${q}`:""}`,style:Se},ce.createElement("canvas",{ref:$,className:"aurora-canvas","aria-hidden":"true"}))};export{_e as default};
