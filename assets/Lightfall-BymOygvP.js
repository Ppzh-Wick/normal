import{r as P,R as Ie}from"./index-CyJD2t6x.js";import{c as mt,a as dt}from"./renderBudget-DnUjQnA8.js";const me=8,Ue=4,ht=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,pt=`#version 300 es
precision highp float;
uniform vec2 uView;
uniform float uZoom;
uniform float uPhase;
uniform float uTwinkleClock;
uniform float uRings;
uniform vec3 uColors[8];
uniform int uColorCount;
uniform int uStreakCount;
uniform int uColumns;
uniform float uWidth;
uniform float uTail;
uniform float uTwinkle;
uniform float uHead;
uniform float uDepth;
uniform vec4 uMouse;
uniform vec3 uLens;
uniform float uLightMode;
uniform float uEncode;
out vec4 outColor;

const vec3 CAMERA = vec3(0.0, -0.8888889, -0.2222222);
const float TAU = 6.28318530718;
const float SPACING = 0.005;
const float REACH = 0.32;

uint scramble(uint x) {
  x ^= x >> 16;
  x *= 0x7feb352du;
  x ^= x >> 15;
  x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}

float unit(uint x) {
  return float(x & 0xffffu) / 65535.0;
}

float stroke(float d, float w) {
  float s = max(0.75 * w, 0.55);
  return 0.75 * w / s * exp(-0.5 * d * d / (s * s));
}

float orb(float d, float r) {
  float s = max(0.6 * r, 0.7);
  float e = 0.6 * r / s;
  return e * e * exp(-0.5 * d * d / (s * s));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 screen = (2.0 * frag - uView) / uView.x;
  vec2 p = screen;
  mat2 warp = mat2(1.0);
  if (uLens.z > 0.0) {
    vec2 o = p - uLens.xy;
    float e = uLens.z * exp(-dot(o, o) / (REACH * REACH));
    p -= o * e;
    warp = mat2(1.0 - e) + outerProduct(o, o) * (2.0 * e / (REACH * REACH));
  }

  vec3 dir = vec3(p, uZoom);
  vec3 exits = (1.0 - CAMERA * sign(dir)) / max(abs(dir), vec3(1e-6));
  float u = min(exits.x, min(exits.y, exits.z));
  for (int i = 0; i < 5; i++) {
    vec3 h = CAMERA + u * dir;
    vec3 h2 = h * h;
    u -= (dot(h2, h2) - 1.0) / (4.0 * dot(dir, h2 * h));
  }
  vec3 hit = CAMERA + u * dir;
  vec3 normal = hit * hit * hit;
  float facing = dot(normal, dir);
  vec3 stepX = u * (vec3(1.0, 0.0, 0.0) - dir * (normal.x / facing));
  vec3 stepY = u * (vec3(0.0, 1.0, 0.0) - dir * (normal.y / facing));
  float ring = hit.y * hit.y + hit.z * hit.z;
  float theta = atan(hit.z, hit.y);
  mat2 jacobian = mat2(
    stepX.x,
    (hit.y * stepX.z - hit.z * stepX.y) / ring,
    stepY.x,
    (hit.y * stepY.z - hit.z * stepY.y) / ring
  ) * warp * (2.0 / uView.x);

  vec2 gradX = vec2(jacobian[0][0], jacobian[1][0]);
  vec2 gradTheta = vec2(jacobian[0][1], jacobian[1][1]);
  float scale = max(length(gradX), 1e-8);
  float det = max(abs(gradX.x * gradTheta.y - gradX.y * gradTheta.x), 1e-12);
  float along = scale / det;
  float skew = dot(gradX, gradTheta) / det;
  float spacing = SPACING / scale;
  float detail = smoothstep(1.6, 3.2, spacing);
  if (detail <= 0.0) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float halfWidth = min(uWidth / scale, 0.2 * spacing);
  float headRadius = min(2.0 * uWidth / scale, 0.35 * spacing);
  float headReach = 4.0 * max(0.6 * headRadius, 0.7);
  float edge = uColumns > 1 ? 1.0 : 0.5;
  float period = TAU / uRings;
  float fog = exp(-max(u * length(dir) - 0.6, 0.0) * 1.6 * uDepth);

  float boost = 1.0;
  if (uMouse.z > 0.0) {
    vec2 m = screen - uMouse.xy;
    boost += 2.0 * uMouse.z * exp(-dot(m, m) / max(uMouse.w * uMouse.w, 1e-4));
  }

  int count = max(uColorCount, 1);
  vec3 total = vec3(0.0);
  for (int layer = 0; layer < 16; layer++) {
    if (layer >= uStreakCount) break;
    float x = hit.x + float(layer) * SPACING / 8.0;
    float nearest = floor(x / SPACING + 0.5);
    float side = x >= nearest * SPACING ? 1.0 : -1.0;
    for (int k = 0; k < 2; k++) {
      if (k >= uColumns) break;
      float column = nearest + side * float(k);
      float across = (x - column * SPACING) / scale;
      uint seed = scramble(uint(int(column) + 65536) + uint(layer) * 0x9e3779b9u);
      uint next = scramble(seed);
      float hue = unit(seed >> 16);
      float delta = theta - uPhase * (1.0 + floor(unit(seed) * 16.0) / 16.0) - unit(next) * period;
      delta -= period * floor(delta / period + 0.5);
      float ahead = delta * along - across * skew;
      if (abs(ahead) > headReach && (delta > 0.0 || -delta * uTail > 3.2)) continue;
      float behind = max(-delta, 0.0);
      float fall = exp(-uTail * behind) * (1.0 - smoothstep(0.5, 0.95, behind / (0.5 * period)));
      fall *= 1.0 - smoothstep(1.2, 3.2, uTail * behind);
      float reach = length(vec2(across, ahead));
      float trail = stroke(ahead > 0.0 ? reach : abs(across), halfWidth * mix(0.4, 1.0, fall)) * fall;
      float glint = orb(reach, headRadius) * mix(3.0, 1.8, uLightMode);
      float weight = mix(1.5, 1.0 + sin(uTwinkleClock + 7.0 * hue + 4.0), uTwinkle);
      weight *= 1.0 - smoothstep(0.72 * edge, edge, abs(across) / spacing);
      vec3 color = uColors[min(int(hue * float(count)), count - 1)];
      vec3 hot = mix(color, vec3(1.0), uHead * (1.0 - uLightMode));
      total += (trail * color + glint * hot) * weight;
    }
  }

  outColor = vec4(total * fog * boost * detail * uEncode, 1.0);
}`,xt=`#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uTexel;
uniform float uLimit;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec3 color = texture(uSource, uv - uTexel).rgb;
  color += texture(uSource, uv + uTexel).rgb;
  color += texture(uSource, uv + vec2(uTexel.x, -uTexel.y)).rgb;
  color += texture(uSource, uv + vec2(-uTexel.x, uTexel.y)).rgb;
  outColor = vec4(min(color * 0.25, vec3(uLimit)), 1.0);
}`,gt=`#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uStep;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec3 color = texture(uSource, uv).rgb * 0.181862;
  color += (texture(uSource, uv + uStep * 1.423135).rgb + texture(uSource, uv - uStep * 1.423135).rgb) * 0.284316;
  color += (texture(uSource, uv + uStep * 3.326702).rgb + texture(uSource, uv - uStep * 3.326702).rgb) * 0.106598;
  color += (texture(uSource, uv + uStep * 5.242989).rgb + texture(uSource, uv - uStep * 5.242989).rgb) * 0.018156;
  outColor = vec4(color, 1.0);
}`,vt=`#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform sampler2D uBloom3;
uniform vec2 uView;
uniform float uDecode;
uniform float uGlow;
uniform float uBloom;
uniform float uPresence;
uniform float uOpacity;
uniform float uFade;
uniform float uLightMode;
uniform vec3 uTopColor;
uniform float uTopGlow;
out vec4 outColor;

float smootherstep01(float t) {
  t = clamp(t, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uView;
  vec3 light = texelFetch(uScene, ivec2(gl_FragCoord.xy), 0).rgb;
  if (uBloom > 0.0) {
    vec3 halo = texture(uBloom0, uv).rgb * 0.42;
    halo += texture(uBloom1, uv).rgb * 0.3;
    halo += texture(uBloom2, uv).rgb * 0.18;
    halo += texture(uBloom3, uv).rgb * 0.1;
    light += halo * uBloom * (uLightMode > 0.5 ? 0.2 : 1.0);
  }
  light *= uDecode * uGlow * uPresence;

  if (uLightMode < 0.5 && uTopGlow > 0.0) {
    float aspect = uView.x / uView.y;
    vec2 q = vec2((uv.x - 0.5) * aspect, 1.04 - uv.y);
    float spread = 0.34 * max(aspect, 0.75);
    float core = exp(-q.x * q.x / (spread * spread) - q.y * q.y / 0.06);
    float halo = exp(-q.x * q.x / (3.6 * spread * spread) - q.y * q.y / 0.18);
    light += uTopColor * uTopGlow * (core * 0.85 + halo * 0.3) * uPresence;
  }

  vec3 lit = max(light, 0.0);
  vec3 mapped = sqrt(1.0 - exp(-1.3 * lit * lit / (lit + 0.025)));
  float peak = max(mapped.r, max(mapped.g, mapped.b));

  float mask = uOpacity;
  float edge = uFade * 0.5;
  if (edge > 0.0) {
    mask *= smootherstep01(uv.x / edge) * smootherstep01((1.0 - uv.x) / edge);
    mask *= smootherstep01(uv.y / edge) * smootherstep01((1.0 - uv.y) / edge);
  }
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;

  if (uLightMode > 0.5) {
    float coverage = clamp(smoothstep(0.0, 0.5, peak) * mask * 0.94 + grain, 0.0, 1.0);
    vec3 chroma = sqrt(clamp(lit / max(max(lit.r, max(lit.g, lit.b)), 1e-6), 0.0, 1.0));
    chroma = pow(chroma, vec3(1.35));
    chroma /= max(max(chroma.r, max(chroma.g, chroma.b)), 1e-4);
    float saturation = 1.0 - min(chroma.r, min(chroma.g, chroma.b));
    chroma = mix(vec3(0.3), chroma, smoothstep(0.08, 0.35, saturation));
    outColor = vec4(chroma * coverage, coverage);
  } else {
    vec3 color = clamp(mapped + grain, 0.0, 1.0) * mask;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`,wt=2.6,Et=9,de=Math.PI*2,I=(n,A,g)=>Math.min(g,Math.max(A,n)),Be=(n,A,g)=>{const p=n.createShader(A);return p?(n.shaderSource(p,g),n.compileShader(p),n.getShaderParameter(p,n.COMPILE_STATUS)?p:(n.deleteShader(p),null)):null},J=(n,A)=>{const g=Be(n,n.VERTEX_SHADER,ht),p=Be(n,n.FRAGMENT_SHADER,A),d=n.createProgram();if(!g||!p||!d)return null;if(n.attachShader(d,g),n.attachShader(d,p),n.bindAttribLocation(d,0,"aPosition"),n.linkProgram(d),n.deleteShader(g),n.deleteShader(p),!n.getProgramParameter(d,n.LINK_STATUS))return n.deleteProgram(d),null;const q={},Q=n.getProgramParameter(d,n.ACTIVE_UNIFORMS);for(let U=0;U<Q;U++){const B=n.getActiveUniform(d,U);B&&(q[B.name.replace(/\[0\]$/,"")]=n.getUniformLocation(d,B.name))}return{program:d,uniforms:q}},Rt=({colors:n=["#ffffff"],backgroundColor:A="#94a3b8",speed:g=.3,streakCount:p=2,streakWidth:d=.8,streakLength:q=1,glow:Q=1,density:U=.6,twinkle:B=.3,zoom:Oe=3,backgroundGlow:Ne=.1,headGlow:ze=.6,depth:Ye=.5,bloom:Ve=.35,opacity:We=1,mouseInteraction:qe=!0,mouseStrength:He=.4,mouseRadius:$e=.45,mouseDampening:je=.15,lens:Ke=.5,holdToWarp:Ze=!0,intro:Je=!0,fade:Qe=0,lightMode:et=!1,mixBlendMode:he,paused:tt=!1,dpr:ot,maxFps:rt=30,maxPixels:nt=15e5,className:pe="",style:at})=>{const xe=P.useRef(null),ge=P.useRef(null),ee=P.useRef(null),c=P.useRef(null),[it,ut]=P.useState(0);return c.current={colors:(Array.isArray(n)&&n.length?n:["#ffffff"]).slice(0,me).map(String),backgroundColor:String(A),speed:g,streakCount:Math.round(I(p,1,16)),streakWidth:Math.max(.05,d),streakLength:Math.max(.05,q),glow:Math.max(0,Q),density:U,twinkle:I(B,0,1),zoom:Math.max(.1,Oe),backgroundGlow:Math.max(0,Ne),headGlow:I(ze,0,1),depth:Math.max(0,Ye),bloom:Math.max(0,Ve),opacity:I(We,0,1),mouseInteraction:qe,mouseStrength:Math.max(0,He),mouseRadius:Math.max(.01,$e),mouseDampening:Math.max(0,je),lens:I(Ke,0,1),holdToWarp:Ze,intro:Je,fade:I(Qe,0,1),lightMode:et,paused:tt,dpr:ot,maxPixels:nt},P.useEffect(()=>{const S=xe.current,l=ge.current;if(!S||!l)return;let ve="";const O=t=>{ve!==t&&(ve=t,S.dataset.renderState=t)},e=l?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"default"});if(!e){O("unsupported");return}const we=!!e.getExtension("EXT_color_buffer_float"),te=J(e,pt),oe=J(e,xt),H=J(e,gt),re=J(e,vt);if(!te||!oe||!H||!re){O("unsupported");return}let k=!1;const Ee=t=>{t.preventDefault(),w()},be=()=>{k=!0,w(),ut(t=>t+1)};l.addEventListener("webglcontextlost",Ee),l.addEventListener("webglcontextrestored",be);const Te=e.createBuffer(),ne=e.createVertexArray();e.bindVertexArray(ne),e.bindBuffer(e.ARRAY_BUFFER,Te),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);const st=we?e.RGBA16F:e.RGBA8,ae=we?1:.25,ie=()=>({texture:null,framebuffer:e.createFramebuffer(),width:0,height:0}),N=ie(),$=Array.from({length:Ue},()=>[ie(),ie()]),ue=(t,o,a)=>{t.texture&&t.width===o&&t.height===a||(t.texture&&e.deleteTexture(t.texture),t.texture=e.createTexture(),t.width=o,t.height=a,e.bindTexture(e.TEXTURE_2D,t.texture),e.texStorage2D(e.TEXTURE_2D,1,st,o,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,t.framebuffer),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t.texture,0))},z=(t,o)=>(e.bindFramebuffer(e.FRAMEBUFFER,t?t.framebuffer:null),e.viewport(0,0,t?t.width:l.width,t?t.height:l.height),e.useProgram(o.program),o.uniforms),_=(t,o)=>{e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,o)},F=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),se=new Map,lt=t=>{if(se.has(t))return se.get(t);let o=[1,1,1];if(F){F.clearRect(0,0,1,1),F.fillStyle="#ffffff",F.fillStyle=t,F.fillRect(0,0,1,1);const[a,i,T]=F.getImageData(0,0,1,1).data;o=[a/255,i/255,T/255]}return se.set(t,o),o},Re=t=>lt(t).map(o=>o*o),le=window.matchMedia("(prefers-reduced-motion: reduce)");let x=le.matches;const Ae=new Float32Array(me*3),Se=new Float32Array(3);let Ce="",Me=1;const ct=()=>{const t=c.current,o=`${t.colors.join(",")}|${t.backgroundColor}`;if(o===Ce)return;Ce=o;const a=t.colors.map(Re);Me=a.length;for(let i=0;i<me;i++)Ae.set(a[Math.min(i,a.length-1)],i*3);Se.set(Re(t.backgroundColor))},Y={width:1,height:1,ratio:1},ye=dt(rt);let X=null;const s={x:0,y:0,inside:!1,held:!1},r={travel:0,intro:c.current.intro&&!x?0:1,mouseX:0,mouseY:0,lensX:0,lensY:0,touch:0,warp:0};let b=0,D=0,G=!1;const ft=()=>{const t=c.current,o=l.width,a=l.height;e.bindVertexArray(ne);const i=r.intro,T=Math.min(1,i*2.2),C=1+5*Math.pow(1-i,2)+2.5*r.warp,R=Math.max(1,Math.floor(de*Math.max(t.density,.05)+.5)),E=de/R,M=9+r.travel;ct();const y=m=>(2*m-o)/o,V=m=>(2*m-a)/o,u=z(N,te);if(e.uniform2f(u.uView,o,a),e.uniform1f(u.uZoom,t.zoom),e.uniform1f(u.uPhase,M%(16*E)),e.uniform1f(u.uTwinkleClock,M%de),e.uniform1f(u.uRings,R),e.uniform3fv(u.uColors,Ae),e.uniform1i(u.uColorCount,Me),e.uniform1i(u.uStreakCount,t.streakCount),e.uniform1i(u.uColumns,t.streakWidth>1?2:1),e.uniform1f(u.uWidth,5e-4*t.streakWidth),e.uniform1f(u.uTail,19/(t.streakLength*C)),e.uniform1f(u.uTwinkle,t.twinkle),e.uniform1f(u.uHead,t.headGlow),e.uniform1f(u.uDepth,t.depth),e.uniform4f(u.uMouse,y(r.mouseX),V(r.mouseY),t.mouseInteraction?t.mouseStrength*r.touch:0,t.mouseRadius),e.uniform3f(u.uLens,y(r.lensX),V(r.lensY),t.mouseInteraction?.5*t.lens*r.touch:0),e.uniform1f(u.uLightMode,t.lightMode?1:0),e.uniform1f(u.uEncode,ae),e.drawArrays(e.TRIANGLES,0,3),t.bloom>0){let m=N;$.forEach(([h,W])=>{const Z=z(h,oe);_(0,m.texture),e.uniform1i(Z.uSource,0),e.uniform2f(Z.uTarget,h.width,h.height),e.uniform2f(Z.uTexel,1/m.width,1/m.height),e.uniform1f(Z.uLimit,4*ae),e.drawArrays(e.TRIANGLES,0,3);let L=z(W,H);_(0,h.texture),e.uniform1i(L.uSource,0),e.uniform2f(L.uTarget,W.width,W.height),e.uniform2f(L.uStep,1/h.width,0),e.drawArrays(e.TRIANGLES,0,3),L=z(h,H),_(0,W.texture),e.uniform1i(L.uSource,0),e.uniform2f(L.uTarget,h.width,h.height),e.uniform2f(L.uStep,0,1/W.height),e.drawArrays(e.TRIANGLES,0,3),m=h})}const f=z(null,re);_(0,N.texture),e.uniform1i(f.uScene,0),$.forEach(([m],h)=>{_(h+1,m.texture),e.uniform1i(f[`uBloom${h}`],h+1)}),e.uniform2f(f.uView,o,a),e.uniform1f(f.uDecode,1/ae),e.uniform1f(f.uGlow,t.glow),e.uniform1f(f.uBloom,t.bloom),e.uniform1f(f.uPresence,T),e.uniform1f(f.uOpacity,t.opacity),e.uniform1f(f.uFade,t.fade),e.uniform1f(f.uLightMode,t.lightMode?1:0),e.uniform3fv(f.uTopColor,Se),e.uniform1f(f.uTopGlow,t.backgroundGlow),e.drawArrays(e.TRIANGLES,0,3);for(let m=Ue;m>=0;m--)_(m,null)},ce=t=>{if(b=0,k||e.isContextLost()||!G||document.hidden||c.current.paused){w();return}if(!ye.ready(t)){b=requestAnimationFrame(ce);return}const o=c.current,a=D?Math.min(.05,(t-D)/1e3):1/60;D=t,X&&(Object.assign(s,Le(X)),X=null),!o.intro||x?r.intro=1:r.intro<1&&(r.intro=Math.min(1,r.intro+a/wt));const i=o.holdToWarp&&s.held&&s.inside&&!x;r.warp+=((i?1:0)-r.warp)*(1-Math.exp(-a*(i?2.2:1.6)));const T=Et*Math.pow(1-r.intro,2)+6*r.warp,C=!o.paused&&!x;C&&(r.travel+=a*.1*o.speed*(1+T));const R=Y.ratio,E=s.x*R,M=(Y.height-s.y)*R,y=o.mouseInteraction&&s.inside&&!x;y&&r.touch<.01&&(r.mouseX=E,r.mouseY=M,r.lensX=E,r.lensY=M);const V=o.mouseDampening>0?1-Math.exp(-a/o.mouseDampening):1;r.mouseX+=(E-r.mouseX)*V,r.mouseY+=(M-r.mouseY)*V;const u=1-Math.exp(-a*6);r.lensX+=(E-r.lensX)*u,r.lensY+=(M-r.lensY)*u,r.touch+=((y?1:0)-r.touch)*(1-Math.exp(-a*(y?4:2))),ft();const f=r.intro<1||r.warp>.001||Math.abs((y?1:0)-r.touch)>.002;C&&o.speed!==0||f?b=requestAnimationFrame(ce):(D=0,O(x?"reduced":"paused"))},v=()=>{if(k||e.isContextLost()||!G||document.hidden||c.current.paused){w();return}b||(O(x?"reduced":"running"),b=requestAnimationFrame(ce))};function w(){cancelAnimationFrame(b),b=0,D=0,ye.reset(),X=null,s.inside=!1,s.held=!1,O(k||e.isContextLost()?"context-lost":"paused")}const fe=()=>{if(k||e.isContextLost()){w();return}const t=c.current,o=Math.max(1,S.clientWidth),a=Math.max(1,S.clientHeight),i=mt(o,a,t.dpr||window.devicePixelRatio||1,t.maxPixels);Y.width=o,Y.height=a,Y.ratio=i.width/o,l.width!==i.width&&(l.width=i.width),l.height!==i.height&&(l.height=i.height),ue(N,l.width,l.height),$.forEach((T,C)=>{const R=Math.max(1,Math.round(l.width/2**(C+1))),E=Math.max(1,Math.round(l.height/2**(C+1)));ue(T[0],R,E),ue(T[1],R,E)}),v()},Le=t=>{const o=S.getBoundingClientRect(),a=t.clientX-o.left,i=t.clientY-o.top;return{x:a,y:i,inside:a>=0&&i>=0&&a<=o.width&&i<=o.height}},Pe=t=>{!G||document.hidden||x||c.current.paused||!c.current.mouseInteraction||(X={clientX:t.clientX,clientY:t.clientY},v())},ke=t=>{if(!G||document.hidden||x||c.current.paused||!c.current.holdToWarp||t.button!==0||t.target?.closest?.('a, button, input, textarea, select, [role="button"], [contenteditable="true"], [data-lightfall-ignore]'))return;const o=Le(t);o.inside&&(s.x=o.x,s.y=o.y,s.inside=!0,s.held=!0,v())},j=()=>{s.held&&(s.held=!1,v())},K=()=>{X=null,!(!s.inside&&!s.held)&&(s.inside=!1,s.held=!1,v())},_e=()=>{w(),document.hidden||v()},Fe=t=>{x=t.matches,x&&(r.intro=1,r.warp=0,r.touch=0,s.held=!1),w(),v()},Xe=new ResizeObserver(fe);Xe.observe(S);const De=new IntersectionObserver(t=>{G=t.some(o=>o.isIntersecting&&o.intersectionRect.height>0&&o.intersectionRect.width>0),G?(D=0,v()):w()},{threshold:[0,.001]});De.observe(S),window.addEventListener("pointermove",Pe,{passive:!0}),window.addEventListener("pointerdown",ke,{passive:!0}),window.addEventListener("pointerup",j,{passive:!0}),window.addEventListener("pointercancel",j,{passive:!0}),document.documentElement.addEventListener("pointerleave",K),document.addEventListener("visibilitychange",_e),window.addEventListener("blur",K),le.addEventListener("change",Fe),fe();let Ge=`${c.current.dpr}|${c.current.maxPixels}`;return ee.current=()=>{const t=c.current;if(t.paused){w();return}const o=`${t.dpr}|${t.maxPixels}`;if(o!==Ge){Ge=o,fe();return}v()},()=>{cancelAnimationFrame(b),ee.current=null,l.removeEventListener("webglcontextlost",Ee),l.removeEventListener("webglcontextrestored",be),Xe.disconnect(),De.disconnect(),window.removeEventListener("pointermove",Pe),window.removeEventListener("pointerdown",ke),window.removeEventListener("pointerup",j),window.removeEventListener("pointercancel",j),document.documentElement.removeEventListener("pointerleave",K),document.removeEventListener("visibilitychange",_e),window.removeEventListener("blur",K),le.removeEventListener("change",Fe),!k&&!e.isContextLost()&&([N,...$.flat()].forEach(t=>{t.texture&&e.deleteTexture(t.texture),e.deleteFramebuffer(t.framebuffer)}),[te,oe,H,re].forEach(t=>e.deleteProgram(t.program)),e.deleteBuffer(Te),e.deleteVertexArray(ne),e.getExtension("WEBGL_lose_context")?.loseContext())}},[it]),P.useEffect(()=>{ee.current?.()}),Ie.createElement("div",{ref:xe,className:`lightfall-container${pe?` ${pe}`:""}`,style:{...he?{mixBlendMode:he}:null,...at}},Ie.createElement("canvas",{ref:ge,className:"lightfall-canvas","aria-hidden":"true"}))};export{Rt as default};
