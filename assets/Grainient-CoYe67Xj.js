import{r as X,R as Ae}from"./index-13o8oeEj.js";import{c as et,a as tt}from"./renderBudget-DnUjQnA8.js";const Fe=8,J=24,oe=4,_e=1.3,nt=.06,Le=2.6,it=1.6,Pe=["#120f17","#2a0f0a","#9a3412","#f97316","#fed7aa"],rt={linear:0,radial:1},ae=.2,ot=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,at=`#version 300 es
precision highp float;
precision highp int;
uniform float uAspect;
uniform float uTime;
uniform vec3 uRamp[8];
uniform int uCount;
uniform int uType;
uniform vec2 uDir;
uniform float uExtent;
uniform float uBands;
uniform float uSoftness;
uniform float uFlow;
uniform float uScale;
uniform float uSilk;
uniform vec4 uStir[24];
uniform float uStirWeight[24];
uniform vec4 uTwirl[4];
uniform vec2 uSeed;
uniform float uContrast;
uniform float uSaturation;
uniform float uSettle;
uniform float uReveal;
in vec2 vUv;
out vec4 outColor;

vec2 hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash2(i), f);
  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec2 drift(vec2 p, float t) {
  vec2 w1 = vec2(
    noise(p * 0.85 + vec2(t * 0.11, t * 0.07)),
    noise(p * 0.85 + vec2(4.1, 1.7) - vec2(t * 0.08, t * 0.12))
  );
  vec2 w2 = vec2(
    noise(p * 1.55 + w1 * 1.8 + vec2(1.3, 7.1) + t * 0.05),
    noise(p * 1.55 + w1 * 1.8 + vec2(6.4, 2.2) - t * 0.06)
  );
  return (w1 - 0.5) * 1.1 + (w2 - 0.5) * 0.55;
}

vec2 warp(vec2 p) {
  vec2 q = p / uScale;
  if (uType == 1) {
    float turn = uTime * 0.35;
    q = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * q;
  } else {
    q += vec2(-uDir.y, uDir.x) * uTime * 0.45;
  }
  return p + drift(q + uSeed, uTime) * uFlow * uScale * uSettle;
}

float coord(vec2 p) {
  vec2 w = warp(p);
  return uType == 1 ? 1.0 - length(w) * 1.1 : dot(w, uDir) / uExtent + 0.5;
}

vec3 labToRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  for (int i = 0; i < 24; i++) {
    float w = uStirWeight[i];
    if (w <= 0.0) continue;
    vec2 d = p - uStir[i].xy;
    p -= uStir[i].zw * w * exp(-dot(d, d) / 0.045);
  }
  for (int i = 0; i < 4; i++) {
    float angle = uTwirl[i].z;
    if (angle == 0.0) continue;
    vec2 d = p - uTwirl[i].xy;
    float a = angle * exp(-dot(d, d) / (uTwirl[i].w * uTwirl[i].w));
    float c = cos(a);
    float s = sin(a);
    p = uTwirl[i].xy + mat2(c, -s, s, c) * d;
  }
  float raw = coord(p);
  float s = raw;
  if (uBands > 1.0) {
    s *= uBands;
    float cycle = floor(s);
    s = fract(s);
    if (mod(cycle, 2.0) > 0.5) s = 1.0 - s;
  }
  s = clamp(s, 0.0, 1.0);
  float scaled = s * float(uCount - 1);
  int index = int(min(floor(scaled), float(uCount - 2)));
  float f = scaled - float(index);
  float edge = max(uSoftness * 0.5, fwidth(scaled) * 0.75);
  float shaped = smoothstep(0.5 - edge, 0.5 + edge, f);
  vec3 from = uRamp[0];
  vec3 to = uRamp[1];
  for (int i = 0; i < 7; i++) {
    if (i == index) {
      from = uRamp[i];
      to = uRamp[i + 1];
    }
  }
  vec3 lab = mix(from, to, shaped);
  if (uSilk > 0.0) {
    vec2 grad = vec2(coord(p + vec2(0.004, 0.0)) - raw, coord(p + vec2(0.0, 0.004)) - raw) / 0.004;
    vec2 slope = grad * sin(3.14159265 * clamp(raw, 0.0, 1.0) * uBands) * uSilk * 4.0;
    vec3 normal = normalize(vec3(-slope, 1.0));
    vec3 light = normalize(vec3(-uDir.y, uDir.x, 1.2));
    float diffuse = dot(normal, light) - light.z;
    lab = uRamp[0] + (lab - uRamp[0]) * (1.0 + (diffuse * 0.35 + max(diffuse, 0.0) * diffuse * 0.6) * uSilk);
  }
  lab = mix(uRamp[0], lab, smoothstep(0.0, 1.0, uReveal * 1.5 - length(vUv - 0.5) * 0.6));
  lab.x = (lab.x - 0.55) * uContrast + 0.55;
  lab.yz *= uSaturation;
  outColor = vec4(encode(labToRgb(lab)), 1.0);
}`,st=`#version 300 es
precision highp float;
uniform sampler2D uField;
uniform float uGrain;
uniform float uGrainSize;
uniform float uFrame;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float clump(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec3 color = texture(uField, vUv).rgb;
  vec2 pixel = gl_FragCoord.xy + uFrame * vec2(17.0, 59.0);
  float fine = hash(pixel) + hash(pixel + 7.13) - 1.0;
  float coarse = (clump(pixel / max(uGrainSize, 1.0)) - 0.5) * 2.0;
  float grain = mix(fine, coarse, clamp(uGrainSize - 1.0, 0.0, 1.0) * 0.8);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color += grain * uGrain * (0.45 + 2.2 * luma * (1.0 - luma));
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`,g=(n,T,v)=>Math.min(v,Math.max(T,n)),se=n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4,ct=([n,T,v])=>{const u=se(n),f=se(T),y=se(v),A=Math.cbrt(.4122214708*u+.5363325363*f+.0514459929*y),R=Math.cbrt(.2119034982*u+.6806995451*f+.1073969566*y),S=Math.cbrt(.0883024619*u+.2817188376*f+.6299787005*y);return[.2104542553*A+.793617785*R-.0040720468*S,1.9779984951*A-2.428592205*R+.4505937099*S,.0259040371*A+.7827717662*R-.808675766*S]},Ue=(n,T,v)=>{const u=n.createShader(T);return u?(n.shaderSource(u,v),n.compileShader(u),n.getShaderParameter(u,n.COMPILE_STATUS)?u:(n.deleteShader(u),null)):null},De=(n,T)=>{const v=Ue(n,n.VERTEX_SHADER,ot),u=Ue(n,n.FRAGMENT_SHADER,T),f=n.createProgram();if(!v||!u||!f)return null;if(n.attachShader(f,v),n.attachShader(f,u),n.linkProgram(f),n.deleteShader(v),n.deleteShader(u),!n.getProgramParameter(f,n.LINK_STATUS))return n.deleteProgram(f),null;const y={},A=n.getProgramParameter(f,n.ACTIVE_UNIFORMS);for(let R=0;R<A;R++){const S=n.getActiveUniform(f,R);if(!S)continue;const N=S.name.replace(/\[0\]$/,"");y[N]=n.getUniformLocation(f,N)}return{program:f,uniforms:y}},ft=({colors:n=Pe,type:T="linear",angle:v=55,bands:u=1,speed:f=1,flow:y=.8,scale:A=1,softness:R=1,silk:S=.35,grainAmount:N=.08,grainSize:Ce=1.2,grainAnimated:Ie=!0,contrast:ze=1,saturation:qe=1,variation:Xe=0,interactive:Ge=!0,stir:ke=1,clickSwirl:Oe=!0,intro:Be=!0,lightMode:Ne=!1,paused:We=!1,dpr:Ve,maxFps:Ye=30,maxPixels:$e=15e5,className:ce="",style:He,...Ke})=>{const le=X.useRef(null),ue=X.useRef(null),Q=X.useRef(null),W=(Array.isArray(n)&&n.length?n:Pe).slice(0,Fe),fe={colors:W.length>1?W:[W[0],W[0]],type:rt[T]??0,angle:v,bands:g(u,1,8),speed:Math.max(0,f),flow:g(y,0,3),scale:g(A,.25,3),softness:g(R,0,1),silk:g(S,0,1),grainAmount:g(N,0,.5),grainSize:g(Ce,.5,4),grainAnimated:Ie,contrast:g(ze,.2,2),saturation:g(qe,0,2),variation:Math.max(0,Xe),interactive:Ge,stir:g(ke,0,2),clickSwirl:Oe,intro:Be,lightMode:Ne,paused:We,dpr:Ve,maxPixels:$e},m=X.useRef(fe);return m.current=fe,X.useEffect(()=>{const P=le.current,x=ue.current,e=x?.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1});if(!P||!x||!e)return;const V=De(e,at),Y=De(e,st);if(!V||!Y)return;const c=V.uniforms,$=Y.uniforms,me=e.createVertexArray(),G=e.createTexture();e.bindTexture(e.TEXTURE_2D,G),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const Z=e.createFramebuffer(),U={width:0,height:0},D=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),de=new Map,je=t=>{const i=String(t),r=de.get(i);if(r)return r;let s=[0,0,0];if(D){D.clearRect(0,0,1,1),D.fillStyle="#000000",D.fillStyle=i,D.fillRect(0,0,1,1);const[_,L,w]=D.getImageData(0,0,1,1).data;s=[_/255,L/255,w/255]}return de.set(i,s),s},ee=window.matchMedia("(prefers-reduced-motion: reduce)");let E=ee.matches;const h={width:1,height:1,ratio:1},te=new Float32Array(Fe*3),he=new Float32Array(J*4),H=new Float32Array(J),K=new Float32Array(oe*4),d=[],p=[],o={x:.5,y:.5,sx:.5,sy:.5,vx:0,inside:!1,fresh:!0};let ve="",pe=0,b=m.current.intro&&!E?0:1,ne=0,ie=0,M=0,C=0,I=!1;const ge=tt(Ye);let z=null;const Je=()=>{const t=m.current,i=`${t.colors.join(",")}|${t.lightMode}`;if(i===ve)return;ve=i;const r=t.colors.map(s=>ct(je(s)));if(!t.lightMode)r.forEach((s,_)=>te.set(s,_*3));else{const s=r.map(([L])=>Math.abs(L-r[0][0])<.1),_=r.filter((L,w)=>!s[w]).reverse();r.forEach((L,w)=>{const[O,q,a]=s[w]?[1,0,0]:_.shift();te.set([O+(1-O)*ae,q*(1-ae),a*(1-ae)],w*3)})}},Qe=()=>{const t=m.current,i=h.width/h.height;Je(),e.bindVertexArray(me),e.disable(e.BLEND),e.bindFramebuffer(e.FRAMEBUFFER,Z),e.viewport(0,0,U.width,U.height),e.useProgram(V.program),e.uniform1f(c.uAspect,i),e.uniform1f(c.uTime,pe),e.uniform3fv(c.uRamp,te),e.uniform1i(c.uCount,t.colors.length);const r=t.angle*Math.PI/180;e.uniform1i(c.uType,t.type),e.uniform2f(c.uDir,Math.sin(r),Math.cos(r)),e.uniform1f(c.uExtent,i*Math.abs(Math.sin(r))+Math.abs(Math.cos(r))),e.uniform1f(c.uBands,t.bands),e.uniform1f(c.uSoftness,t.softness),e.uniform1f(c.uFlow,t.flow),e.uniform1f(c.uScale,t.scale),e.uniform1f(c.uSilk,t.silk),e.uniform4fv(c.uStir,he),e.uniform1fv(c.uStirWeight,H),e.uniform4fv(c.uTwirl,K),e.uniform2f(c.uSeed,t.variation*3.17,t.variation*1.91),e.uniform1f(c.uContrast,t.contrast),e.uniform1f(c.uSaturation,t.saturation),e.uniform1f(c.uSettle,b*b*(3-2*b)),e.uniform1f(c.uReveal,b),e.drawArrays(e.TRIANGLES,0,3),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,x.width,x.height),e.useProgram(Y.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,G),e.uniform1i($.uField,0),e.uniform1f($.uGrain,t.grainAmount),e.uniform1f($.uGrainSize,t.grainSize*h.ratio),e.uniform1f($.uFrame,ne),e.drawArrays(e.TRIANGLES,0,3)},xe=()=>{const t=m.current;h.width=Math.max(1,P.clientWidth),h.height=Math.max(1,P.clientHeight);const i=et(h.width,h.height,t.dpr||window.devicePixelRatio||1,t.maxPixels);h.ratio=i.ratio,x.width!==i.width&&(x.width=i.width),x.height!==i.height&&(x.height=i.height);const r=Math.max(1,Math.round(x.width/2)),s=Math.max(1,Math.round(x.height/2));(r!==U.width||s!==U.height)&&(U.width=r,U.height=s,e.bindTexture(e.TEXTURE_2D,G),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,r,s,0,e.RGBA,e.UNSIGNED_BYTE,null),e.bindFramebuffer(e.FRAMEBUFFER,Z),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,G,0),e.bindFramebuffer(e.FRAMEBUFFER,null)),F()},Ze=(t,i)=>{const r=m.current,s=1-Math.exp(-t/.06),_=o.sx,L=o.sy;o.sx+=(o.x-o.sx)*s,o.sy+=(o.y-o.sy)*s;const w=(o.sx-_)/t*i,O=(o.sy-L)/t;o.vx=w;const q=d[0];if(d.forEach(a=>{a.done&&(a.age+=t)}),r.interactive&&o.inside&&Math.hypot(w,O)>.02&&!E){(!q||q.done)&&(d.unshift({x:0,y:0,vx:0,vy:0,age:0,grow:0,done:!1}),d.length>J&&d.pop());const a=d[0];a.x=(o.sx-.5)*i,a.y=o.sy-.5,a.vx=w,a.vy=O,a.grow=Math.min(1,a.grow+t/nt),a.done=a.grow>=1}else q&&(q.done=!0);for(;d.length&&d[d.length-1].age>_e;)d.pop();for(let a=0;a<J;a++){const l=d[a];if(!l){H[a]=0;continue}const B=1-l.age/_e,j=Math.min(1,2.2/Math.max(Math.hypot(l.vx,l.vy),.001));he.set([l.x,l.y,l.vx*j,l.vy*j],a*4),H[a]=B*B*l.grow*r.stir*.05}for(p.forEach(a=>{a.age+=t});p.length&&p[p.length-1].age>Le;)p.pop();for(let a=0;a<oe;a++){const l=p[a];if(!l){K[a*4+2]=0;continue}const B=l.age/Le,j=Math.min(1,l.age/.18)*(1-B)*(1-B);K.set([l.x,l.y,l.direction*2.4*j,.16+.1*Math.min(1,l.age/.5)],a*4)}},re=t=>{if(M=0,!I||document.hidden||m.current.paused){k();return}if(!ge.ready(t)){M=requestAnimationFrame(re);return}const i=m.current,r=C?g((t-C)/1e3,.001,.05):1/60;C=t,z&&(Ee(z),z=null),E||(pe+=r*i.speed*.16),b<1&&(b=Math.min(1,b+r/it)),ie+=r,i.grainAnimated&&!E&&ie>1/24&&(ie=0,ne=(ne+1)%97),Ze(r,h.width/h.height),Qe(),!E&&(i.speed>0||i.grainAnimated)||b<1||d.length>0||p.length>0?M=requestAnimationFrame(re):C=0};function F(){!M&&I&&!document.hidden&&!m.current.paused&&(M=requestAnimationFrame(re))}function k(){cancelAnimationFrame(M),M=0,C=0,ge.reset(),z=null,o.inside=!1}const Ee=t=>{const i=P.getBoundingClientRect(),r=(t.clientX-i.left)/Math.max(1,i.width),s=1-(t.clientY-i.top)/Math.max(1,i.height);o.inside=r>=0&&r<=1&&s>=0&&s<=1,o.x=r,o.y=s,(o.fresh||!o.inside)&&(o.sx=r,o.sy=s,o.fresh=!1)},we=t=>{!I||document.hidden||m.current.paused||E||t.target?.closest?.("[data-grainient-ignore]")||(z={clientX:t.clientX,clientY:t.clientY},F())},Te=t=>{if(!I||document.hidden||m.current.paused||E||t.button!==0||t.target?.closest?.('a, button, input, textarea, select, [role="button"], [contenteditable="true"], [data-grainient-ignore]'))return;Ee(t);const i=m.current;!o.inside||!i.clickSwirl||E||(p.unshift({x:(o.x-.5)*(h.width/h.height),y:o.y-.5,age:0,direction:o.vx<0?1:-1}),p.length>oe&&p.pop(),F())},Re=()=>{o.inside=!1,z=null},be=()=>{k(),document.hidden||F()},ye=t=>{E=t.matches,E&&(b=1,d.length=0,p.length=0,H.fill(0),K.fill(0)),k(),F()},Se=new ResizeObserver(xe);Se.observe(P);const Me=new IntersectionObserver(t=>{I=t.some(i=>i.isIntersecting&&i.intersectionRect.height>0&&i.intersectionRect.width>0),I?(C=0,F()):k()},{threshold:[0,.001]});return Me.observe(P),window.addEventListener("pointermove",we,{passive:!0}),window.addEventListener("pointerdown",Te,{passive:!0}),document.documentElement.addEventListener("pointerleave",Re),document.addEventListener("visibilitychange",be),ee.addEventListener("change",ye),xe(),Q.current=()=>{m.current.paused?k():F()},()=>{cancelAnimationFrame(M),Q.current=null,Se.disconnect(),Me.disconnect(),window.removeEventListener("pointermove",we),window.removeEventListener("pointerdown",Te),document.documentElement.removeEventListener("pointerleave",Re),document.removeEventListener("visibilitychange",be),ee.removeEventListener("change",ye),e.deleteTexture(G),e.deleteFramebuffer(Z),e.deleteVertexArray(me),e.deleteProgram(V.program),e.deleteProgram(Y.program),e.getExtension("WEBGL_lose_context")?.loseContext()}},[]),X.useEffect(()=>{Q.current?.()}),Ae.createElement("div",{ref:le,className:`grainient-container${ce?` ${ce}`:""}`,style:He,...Ke},Ae.createElement("canvas",{ref:ue,className:"grainient-canvas","aria-hidden":"true"}))};export{ft as default};
