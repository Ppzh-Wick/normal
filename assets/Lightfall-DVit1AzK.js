import{r as y,R as Xe}from"./index-CEXZ_azA.js";import{c as lt,a as ct}from"./renderBudget-DnUjQnA8.js";const ce=8,De=4,ft=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,mt=`#version 300 es
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
}`,dt=`#version 300 es
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
}`,ht=`#version 300 es
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
}`,pt=`#version 300 es
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
}`,xt=2.6,gt=9,fe=Math.PI*2,D=(n,R,x)=>Math.min(x,Math.max(R,n)),Ge=(n,R,x)=>{const p=n.createShader(R);return p?(n.shaderSource(p,x),n.compileShader(p),n.getShaderParameter(p,n.COMPILE_STATUS)?p:(n.deleteShader(p),null)):null},K=(n,R)=>{const x=Ge(n,n.VERTEX_SHADER,ft),p=Ge(n,n.FRAGMENT_SHADER,R),d=n.createProgram();if(!x||!p||!d)return null;if(n.attachShader(d,x),n.attachShader(d,p),n.bindAttribLocation(d,0,"aPosition"),n.linkProgram(d),n.deleteShader(x),n.deleteShader(p),!n.getProgramParameter(d,n.LINK_STATUS))return n.deleteProgram(d),null;const V={},Z=n.getProgramParameter(d,n.ACTIVE_UNIFORMS);for(let G=0;G<Z;G++){const I=n.getActiveUniform(d,G);I&&(V[I.name.replace(/\[0\]$/,"")]=n.getUniformLocation(d,I.name))}return{program:d,uniforms:V}},Et=({colors:n=["#ffffff"],backgroundColor:R="#94a3b8",speed:x=.3,streakCount:p=2,streakWidth:d=.8,streakLength:V=1,glow:Z=1,density:G=.6,twinkle:I=.3,zoom:Ie=3,backgroundGlow:Ue=.1,headGlow:Be=.6,depth:Oe=.5,bloom:Ne=.35,opacity:ze=1,mouseInteraction:Ye=!0,mouseStrength:Ve=.4,mouseRadius:We=.45,mouseDampening:qe=.15,lens:He=.5,holdToWarp:$e=!0,intro:je=!0,fade:Ke=0,lightMode:Ze=!1,mixBlendMode:me,paused:Je=!1,dpr:Qe,maxFps:et=30,maxPixels:tt=15e5,className:de="",style:ot})=>{const he=y.useRef(null),pe=y.useRef(null),J=y.useRef(null),c=y.useRef(null),[rt,nt]=y.useState(0);return c.current={colors:(Array.isArray(n)&&n.length?n:["#ffffff"]).slice(0,ce).map(String),backgroundColor:String(R),speed:x,streakCount:Math.round(D(p,1,16)),streakWidth:Math.max(.05,d),streakLength:Math.max(.05,V),glow:Math.max(0,Z),density:G,twinkle:D(I,0,1),zoom:Math.max(.1,Ie),backgroundGlow:Math.max(0,Ue),headGlow:D(Be,0,1),depth:Math.max(0,Oe),bloom:Math.max(0,Ne),opacity:D(ze,0,1),mouseInteraction:Ye,mouseStrength:Math.max(0,Ve),mouseRadius:Math.max(.01,We),mouseDampening:Math.max(0,qe),lens:D(He,0,1),holdToWarp:$e,intro:je,fade:D(Ke,0,1),lightMode:Ze,paused:Je,dpr:Qe,maxPixels:tt},y.useEffect(()=>{const L=he.current,l=pe.current,e=l?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"default"});if(!L||!l||!e)return;const xe=!!e.getExtension("EXT_color_buffer_float"),Q=K(e,mt),ee=K(e,dt),W=K(e,ht),te=K(e,pt);if(!Q||!ee||!W||!te)return;const ge=t=>{t.preventDefault()},ve=()=>nt(t=>t+1);l.addEventListener("webglcontextlost",ge),l.addEventListener("webglcontextrestored",ve);const we=e.createBuffer(),oe=e.createVertexArray();e.bindVertexArray(oe),e.bindBuffer(e.ARRAY_BUFFER,we),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);const at=xe?e.RGBA16F:e.RGBA8,re=xe?1:.25,ne=()=>({texture:null,framebuffer:e.createFramebuffer(),width:0,height:0}),U=ne(),q=Array.from({length:De},()=>[ne(),ne()]),ae=(t,o,a)=>{t.texture&&t.width===o&&t.height===a||(t.texture&&e.deleteTexture(t.texture),t.texture=e.createTexture(),t.width=o,t.height=a,e.bindTexture(e.TEXTURE_2D,t.texture),e.texStorage2D(e.TEXTURE_2D,1,at,o,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,t.framebuffer),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t.texture,0))},B=(t,o)=>(e.bindFramebuffer(e.FRAMEBUFFER,t?t.framebuffer:null),e.viewport(0,0,t?t.width:l.width,t?t.height:l.height),e.useProgram(o.program),o.uniforms),P=(t,o)=>{e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,o)},k=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),ie=new Map,it=t=>{if(ie.has(t))return ie.get(t);let o=[1,1,1];if(k){k.clearRect(0,0,1,1),k.fillStyle="#ffffff",k.fillStyle=t,k.fillRect(0,0,1,1);const[a,i,b]=k.getImageData(0,0,1,1).data;o=[a/255,i/255,b/255]}return ie.set(t,o),o},Ee=t=>it(t).map(o=>o*o),ue=window.matchMedia("(prefers-reduced-motion: reduce)");let g=ue.matches;const be=new Float32Array(ce*3),Te=new Float32Array(3);let Re="",Ae=1;const ut=()=>{const t=c.current,o=`${t.colors.join(",")}|${t.backgroundColor}`;if(o===Re)return;Re=o;const a=t.colors.map(Ee);Ae=a.length;for(let i=0;i<ce;i++)be.set(a[Math.min(i,a.length-1)],i*3);Te.set(Ee(t.backgroundColor))},O={width:1,height:1,ratio:1},Se=ct(et);let _=null;const s={x:0,y:0,inside:!1,held:!1},r={travel:0,intro:c.current.intro&&!g?0:1,mouseX:0,mouseY:0,lensX:0,lensY:0,touch:0,warp:0};let E=0,F=0,X=!1;const st=()=>{const t=c.current,o=l.width,a=l.height;e.bindVertexArray(oe);const i=r.intro,b=Math.min(1,i*2.2),A=1+5*Math.pow(1-i,2)+2.5*r.warp,T=Math.max(1,Math.floor(fe*Math.max(t.density,.05)+.5)),w=fe/T,S=9+r.travel;ut();const C=m=>(2*m-o)/o,z=m=>(2*m-a)/o,u=B(U,Q);if(e.uniform2f(u.uView,o,a),e.uniform1f(u.uZoom,t.zoom),e.uniform1f(u.uPhase,S%(16*w)),e.uniform1f(u.uTwinkleClock,S%fe),e.uniform1f(u.uRings,T),e.uniform3fv(u.uColors,be),e.uniform1i(u.uColorCount,Ae),e.uniform1i(u.uStreakCount,t.streakCount),e.uniform1i(u.uColumns,t.streakWidth>1?2:1),e.uniform1f(u.uWidth,5e-4*t.streakWidth),e.uniform1f(u.uTail,19/(t.streakLength*A)),e.uniform1f(u.uTwinkle,t.twinkle),e.uniform1f(u.uHead,t.headGlow),e.uniform1f(u.uDepth,t.depth),e.uniform4f(u.uMouse,C(r.mouseX),z(r.mouseY),t.mouseInteraction?t.mouseStrength*r.touch:0,t.mouseRadius),e.uniform3f(u.uLens,C(r.lensX),z(r.lensY),t.mouseInteraction?.5*t.lens*r.touch:0),e.uniform1f(u.uLightMode,t.lightMode?1:0),e.uniform1f(u.uEncode,re),e.drawArrays(e.TRIANGLES,0,3),t.bloom>0){let m=U;q.forEach(([h,Y])=>{const j=B(h,ee);P(0,m.texture),e.uniform1i(j.uSource,0),e.uniform2f(j.uTarget,h.width,h.height),e.uniform2f(j.uTexel,1/m.width,1/m.height),e.uniform1f(j.uLimit,4*re),e.drawArrays(e.TRIANGLES,0,3);let M=B(Y,W);P(0,h.texture),e.uniform1i(M.uSource,0),e.uniform2f(M.uTarget,Y.width,Y.height),e.uniform2f(M.uStep,1/h.width,0),e.drawArrays(e.TRIANGLES,0,3),M=B(h,W),P(0,Y.texture),e.uniform1i(M.uSource,0),e.uniform2f(M.uTarget,h.width,h.height),e.uniform2f(M.uStep,0,1/Y.height),e.drawArrays(e.TRIANGLES,0,3),m=h})}const f=B(null,te);P(0,U.texture),e.uniform1i(f.uScene,0),q.forEach(([m],h)=>{P(h+1,m.texture),e.uniform1i(f[`uBloom${h}`],h+1)}),e.uniform2f(f.uView,o,a),e.uniform1f(f.uDecode,1/re),e.uniform1f(f.uGlow,t.glow),e.uniform1f(f.uBloom,t.bloom),e.uniform1f(f.uPresence,b),e.uniform1f(f.uOpacity,t.opacity),e.uniform1f(f.uFade,t.fade),e.uniform1f(f.uLightMode,t.lightMode?1:0),e.uniform3fv(f.uTopColor,Te),e.uniform1f(f.uTopGlow,t.backgroundGlow),e.drawArrays(e.TRIANGLES,0,3);for(let m=De;m>=0;m--)P(m,null)},se=t=>{if(E=0,!X||document.hidden||c.current.paused){N();return}if(!Se.ready(t)){E=requestAnimationFrame(se);return}const o=c.current,a=F?Math.min(.05,(t-F)/1e3):1/60;F=t,_&&(Object.assign(s,Ce(_)),_=null),!o.intro||g?r.intro=1:r.intro<1&&(r.intro=Math.min(1,r.intro+a/xt));const i=o.holdToWarp&&s.held&&s.inside&&!g;r.warp+=((i?1:0)-r.warp)*(1-Math.exp(-a*(i?2.2:1.6)));const b=gt*Math.pow(1-r.intro,2)+6*r.warp,A=!o.paused&&!g;A&&(r.travel+=a*.1*o.speed*(1+b));const T=O.ratio,w=s.x*T,S=(O.height-s.y)*T,C=o.mouseInteraction&&s.inside&&!g;C&&r.touch<.01&&(r.mouseX=w,r.mouseY=S,r.lensX=w,r.lensY=S);const z=o.mouseDampening>0?1-Math.exp(-a/o.mouseDampening):1;r.mouseX+=(w-r.mouseX)*z,r.mouseY+=(S-r.mouseY)*z;const u=1-Math.exp(-a*6);r.lensX+=(w-r.lensX)*u,r.lensY+=(S-r.lensY)*u,r.touch+=((C?1:0)-r.touch)*(1-Math.exp(-a*(C?4:2))),st();const f=r.intro<1||r.warp>.001||Math.abs((C?1:0)-r.touch)>.002;A&&o.speed!==0||f?E=requestAnimationFrame(se):F=0},v=()=>{!E&&X&&!document.hidden&&!c.current.paused&&(E=requestAnimationFrame(se))};function N(){cancelAnimationFrame(E),E=0,F=0,Se.reset(),_=null,s.inside=!1,s.held=!1}const le=()=>{const t=c.current,o=Math.max(1,L.clientWidth),a=Math.max(1,L.clientHeight),i=lt(o,a,t.dpr||window.devicePixelRatio||1,t.maxPixels);O.width=o,O.height=a,O.ratio=i.width/o,l.width!==i.width&&(l.width=i.width),l.height!==i.height&&(l.height=i.height),ae(U,l.width,l.height),q.forEach((b,A)=>{const T=Math.max(1,Math.round(l.width/2**(A+1))),w=Math.max(1,Math.round(l.height/2**(A+1)));ae(b[0],T,w),ae(b[1],T,w)}),v()},Ce=t=>{const o=L.getBoundingClientRect(),a=t.clientX-o.left,i=t.clientY-o.top;return{x:a,y:i,inside:a>=0&&i>=0&&a<=o.width&&i<=o.height}},Me=t=>{!X||document.hidden||g||c.current.paused||!c.current.mouseInteraction||(_={clientX:t.clientX,clientY:t.clientY},v())},ye=t=>{if(!X||document.hidden||g||c.current.paused||!c.current.holdToWarp||t.button!==0||t.target?.closest?.('a, button, input, textarea, select, [role="button"], [contenteditable="true"], [data-lightfall-ignore]'))return;const o=Ce(t);o.inside&&(s.x=o.x,s.y=o.y,s.inside=!0,s.held=!0,v())},H=()=>{s.held&&(s.held=!1,v())},$=()=>{_=null,!(!s.inside&&!s.held)&&(s.inside=!1,s.held=!1,v())},Le=()=>{N(),document.hidden||v()},Pe=t=>{g=t.matches,g&&(r.intro=1,r.warp=0,r.touch=0,s.held=!1),N(),v()},ke=new ResizeObserver(le);ke.observe(L);const _e=new IntersectionObserver(t=>{X=t.some(o=>o.isIntersecting&&o.intersectionRect.height>0&&o.intersectionRect.width>0),X?(F=0,v()):N()},{threshold:[0,.001]});_e.observe(L),window.addEventListener("pointermove",Me,{passive:!0}),window.addEventListener("pointerdown",ye,{passive:!0}),window.addEventListener("pointerup",H,{passive:!0}),window.addEventListener("pointercancel",H,{passive:!0}),document.documentElement.addEventListener("pointerleave",$),document.addEventListener("visibilitychange",Le),window.addEventListener("blur",$),ue.addEventListener("change",Pe),le();let Fe=`${c.current.dpr}|${c.current.maxPixels}`;return J.current=()=>{const t=c.current;if(t.paused){N();return}const o=`${t.dpr}|${t.maxPixels}`;if(o!==Fe){Fe=o,le();return}v()},()=>{cancelAnimationFrame(E),J.current=null,l.removeEventListener("webglcontextlost",ge),l.removeEventListener("webglcontextrestored",ve),ke.disconnect(),_e.disconnect(),window.removeEventListener("pointermove",Me),window.removeEventListener("pointerdown",ye),window.removeEventListener("pointerup",H),window.removeEventListener("pointercancel",H),document.documentElement.removeEventListener("pointerleave",$),document.removeEventListener("visibilitychange",Le),window.removeEventListener("blur",$),ue.removeEventListener("change",Pe),[U,...q.flat()].forEach(t=>{t.texture&&e.deleteTexture(t.texture),e.deleteFramebuffer(t.framebuffer)}),[Q,ee,W,te].forEach(t=>e.deleteProgram(t.program)),e.deleteBuffer(we),e.deleteVertexArray(oe),e.isContextLost()||e.getExtension("WEBGL_lose_context")?.loseContext()}},[rt]),y.useEffect(()=>{J.current?.()}),Xe.createElement("div",{ref:he,className:`lightfall-container${de?` ${de}`:""}`,style:{...me?{mixBlendMode:me}:null,...ot}},Xe.createElement("canvas",{ref:pe,className:"lightfall-canvas","aria-hidden":"true"}))};export{Et as default};
