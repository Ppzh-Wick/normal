import{r as T,R as Ae}from"./index-13o8oeEj.js";import{a as Ce,c as ot}from"./renderBudget-DnUjQnA8.js";const nt=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,Ie=`
uniform vec2 uView;
uniform float uScale;
uniform float uRotation;
uniform float uTime;
uniform float uWave;
uniform float uRipple;
uniform float uFold;
uniform vec2 uShift;
uniform vec4 uPointer;
uniform vec2 uDrag;
uniform vec4 uWaves[4];

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2 r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c, -s, s, c);
  return rot * uv;
}

vec2 bend(vec2 uv) {
  vec2 aspect = vec2(uView.x / uView.y, 1.0);
  vec2 offset = (uv - uPointer.xy) * aspect;
  float touch = uPointer.z * exp(-dot(offset, offset) / (uPointer.w * uPointer.w));
  uv -= uDrag * touch;
  for (int i = 0; i < 4; i++) {
    vec4 wave = uWaves[i];
    if (wave.w <= 0.0) continue;
    vec2 q = (uv - wave.xy) * aspect;
    float dist = length(q);
    float front = dist - wave.z;
    float ring = exp(-front * front * 60.0) * wave.w;
    uv += q / max(dist, 0.0001) / aspect * ring * 0.034 * sin(front * 34.0);
  }
  return uv;
}

float silk(vec2 vUv) {
  vec2 uv = rotateUvs(vUv * uScale, uRotation);
  vec2 tex = uv * uScale + uShift;
  float tOffset = uTime;
  tex.y += 0.03 * uWave * sin(8.0 * tex.x - tOffset);
  return 0.6 + 0.4 * uFold * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * tOffset) + uRipple * sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));
}
`,it=`#version 300 es
precision highp float;
${Ie}
out vec4 outColor;

void main() {
  vec2 vUv = gl_FragCoord.xy / uView;
  float pattern = silk(bend(vUv));
  float n = clamp((pattern - 0.2) / 0.8, 0.0, 1.0);
  outColor = vec4(pow(n, 6.0), 0.0, 0.0, 1.0);
}`,at=`#version 300 es
precision highp float;
${Ie}
uniform sampler2D uBloom;
uniform vec3 uColor;
uniform vec3 uSheenColor;
uniform float uNoiseIntensity;
uniform float uDepth;
uniform float uSheen;
uniform float uGlow;
uniform float uLightMode;
uniform vec3 uLight;
uniform vec2 uStep;
uniform float uPresence;
uniform float uFade;
out vec4 outColor;

float smootherstep01(float t) {
  t = clamp(t, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

vec3 softClip(vec3 c) {
  vec3 over = max(c - 0.75, 0.0);
  return min(c, 0.75) + 0.25 * (1.0 - exp(-over * 4.0));
}

void main() {
  vec2 vUv = gl_FragCoord.xy / uView;
  vec2 coord = bend(vUv);
  float pattern = silk(coord);
  float rnd = noise(gl_FragCoord.xy);
  float n = clamp((pattern - 0.2) / 0.8, 0.0, 1.0);

  float gx = silk(coord + vec2(uStep.x, 0.0)) - pattern;
  float gy = silk(coord + vec2(0.0, uStep.y)) - pattern;
  vec3 normal = normalize(vec3(-gx * 26.0, -gy * 26.0, 1.0));
  vec3 toLight = normalize(vec3(uLight.xy, 0.85));
  float relief = 1.0 + (dot(normal, toLight) - toLight.z) * 1.8 * uDepth;
  vec3 halfway = normalize(toLight + vec3(0.0, 0.0, 1.0));
  float gloss = pow(max(dot(normal, halfway), 0.0), 48.0) * smoothstep(0.25, 0.85, n);
  float crest = pow(n, 5.0);
  float shine = (gloss * 0.85 + crest * 0.4) * uSheen * (1.0 + uLight.z * 0.6);

  float bloom = 0.0;
  if (uGlow > 0.0) {
    bloom += textureLod(uBloom, vUv, 1.0).r * 0.35;
    bloom += textureLod(uBloom, vUv, 2.0).r * 0.3;
    bloom += textureLod(uBloom, vUv, 3.0).r * 0.2;
    bloom += textureLod(uBloom, vUv, 4.0).r * 0.15;
  }

  vec3 result;
  if (uLightMode > 0.5) {
    float fold = smoothstep(0.28, 0.9, pattern);
    float specular = smoothstep(0.72, 0.98, pattern);
    vec3 shadowColor = uColor * (0.72 - 0.12 * uDepth);
    vec3 bodyColor = min(uColor * 1.18, vec3(1.0));
    vec3 lightBase = mix(shadowColor, bodyColor, fold) * mix(1.0, relief, 0.6);
    lightBase = mix(lightBase, vec3(1.0), clamp(specular * 0.92 + shine * 0.22 + bloom * uGlow * 0.2, 0.0, 1.0));
    float fineNoise = noise(gl_FragCoord.xy * 0.63 + vec2(17.0, 41.0));
    float grainSignal = (rnd + fineNoise - 1.0);
    float grainStrength = clamp(uNoiseIntensity * 0.038, 0.0, 0.16);
    result = clamp(lightBase + grainSignal * grainStrength, 0.0, 1.0);
  } else {
    float grain = rnd / 15.0 * uNoiseIntensity;
    float floorValue = mix(0.2, 0.03, uDepth);
    float curve = uDepth > 0.0 ? pow(n, 1.0 + 1.4 * uDepth) : n;
    float shade = uDepth > 0.0 ? floorValue + (1.0 - floorValue) * curve : pattern;
    vec3 tone = mix(uColor, pow(uColor, vec3(1.45)), (1.0 - n) * uDepth);
    vec3 lit = tone * shade * relief - vec3(grain);
    vec3 tint = mix(uColor, uSheenColor, 0.8);
    vec3 extra = tint * (shine + bloom * uGlow * 0.55);
    float blend = clamp((uSheen + uGlow) * 4.0, 0.0, 1.0);
    result = mix(clamp(lit, 0.0, 1.0), clamp(softClip(lit + extra), 0.0, 1.0), blend);
  }

  float edge = uFade * 0.5;
  float mask = 1.0;
  if (edge > 0.0) {
    mask = smootherstep01(vUv.x / edge) * smootherstep01((1.0 - vUv.x) / edge);
    mask *= smootherstep01(vUv.y / edge) * smootherstep01((1.0 - vUv.y) / edge);
  }
  float alpha = uPresence * mask;
  outColor = vec4(result * alpha, alpha);
}`,st=2.2,lt=1.6,Ue=1.6,y=[-.55,.7],_e=Math.hypot(y[0],y[1]),V=(o,p,h)=>Math.min(h,Math.max(p,o)),ct=o=>o*o*o*(o*(o*6-15)+10),ut=o=>{const p=Number(o)||0;if(!p)return[0,0];const h=c=>{const s=Math.sin(p*12.9898+c*78.233)*43758.5453;return s-Math.floor(s)-.5};return[h(1)*6,h(2)*6]},De=(o,p,h)=>{const c=o.createShader(p);return c?(o.shaderSource(c,h),o.compileShader(c),o.getShaderParameter(c,o.COMPILE_STATUS)?c:(o.deleteShader(c),null)):null},Xe=(o,p)=>{const h=De(o,o.VERTEX_SHADER,nt),c=De(o,o.FRAGMENT_SHADER,p),s=o.createProgram();if(!h||!c||!s)return h&&o.deleteShader(h),c&&o.deleteShader(c),s&&o.deleteProgram(s),null;if(o.attachShader(s,h),o.attachShader(s,c),o.bindAttribLocation(s,0,"aPosition"),o.linkProgram(s),o.deleteShader(h),o.deleteShader(c),!o.getProgramParameter(s,o.LINK_STATUS))return o.deleteProgram(s),null;const k={},H=o.getProgramParameter(s,o.ACTIVE_UNIFORMS);for(let N=0;N<H;N++){const B=o.getActiveUniform(s,N);B&&(k[B.name.replace(/\[0\]$/,"")]=o.getUniformLocation(s,B.name))}return{program:s,uniforms:k}},ht=({speed:o=5,scale:p=1,color:h="#7B7481",sheenColor:c="#ffffff",noiseIntensity:s=1.5,rotation:k=0,sheen:H=.5,depth:N=.5,glow:B=.3,ripple:Ne=1,wave:Be=1,variation:Ge=0,mouseInteraction:Ye=!0,interactionStrength:Oe=1,clickRipple:Ve=!0,intro:ke=!0,fade:ze=0,lightMode:We=!1,paused:$e=!1,dpr:qe=1,maxFps:He=30,maxPixels:Ke=1e6,onReady:se,className:le="",style:Je})=>{const ce=T.useRef(null),ue=T.useRef(null),K=T.useRef(null),u=T.useRef(null),fe=T.useRef(se),[je,Qe]=T.useState(0);return fe.current=se,u.current={speed:o,scale:p,color:String(h),sheenColor:String(c),noiseIntensity:Math.max(0,s),rotation:k,sheen:Math.max(0,H),depth:V(N,0,1),glow:Math.max(0,B),ripple:Math.max(0,Ne),wave:Math.max(0,Be),variation:Ge,mouseInteraction:Ye,interactionStrength:Math.max(0,Oe),clickRipple:Ve,intro:ke,fade:V(ze,0,1),lightMode:We,paused:$e,dpr:Math.max(.1,Number(qe)||1),maxFps:V(Number(He)||30,1,60),maxPixels:Math.max(1,Number(Ke)||1e6)},T.useEffect(()=>{const w=ce.current,l=ue.current;if(!w||!l)return;let C=!1,S=!1,J=!1;const L=t=>{w.dataset.renderState=t},j=t=>{J===t&&w.dataset.ready===String(t)||(J=t,w.dataset.ready=String(t),fe.current?.(t))};j(!1);const e=l?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"default"});if(!e){L("unsupported");return}const M=Xe(e,it),F=Xe(e,at);if(!M||!F){M&&e.deleteProgram(M.program),F&&e.deleteProgram(F.program),L("unsupported");return}const z=e.createBuffer(),G=e.createVertexArray();e.bindVertexArray(G),e.bindBuffer(e.ARRAY_BUFFER,z),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);const P=e.createTexture(),Y=e.createFramebuffer();if(!z||!G||!P||!Y){e.deleteTexture(P),e.deleteFramebuffer(Y),e.deleteBuffer(z),e.deleteVertexArray(G),e.deleteProgram(M.program),e.deleteProgram(F.program),L("unsupported");return}const E={width:0,height:0},de=(t,n)=>{E.width===t&&E.height===n||(E.width=t,E.height=n,e.bindTexture(e.TEXTURE_2D,P),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,t,n,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.generateMipmap(e.TEXTURE_2D),e.bindFramebuffer(e.FRAMEBUFFER,Y),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,P,0))},U=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),Q=new Map,he=t=>{if(Q.has(t))return Q.get(t);let n=[1,1,1];if(U){U.clearRect(0,0,1,1),U.fillStyle="#ffffff",U.fillStyle=t,U.fillRect(0,0,1,1);const[a,i,d]=U.getImageData(0,0,1,1).data;n=[a/255,i/255,d/255]}return Q.set(t,n),n},Z=window.matchMedia("(prefers-reduced-motion: reduce)");let v=Z.matches;const f={width:1,height:1,ratio:1},m={x:0,y:0,inside:!1},x=[],ee=new Float32Array(16),r={flow:0,intro:u.current.intro&&!v?0:1,touch:0,x:0,y:0,dragX:0,dragY:0,lightX:y[0],lightY:y[1]};let A=0,_=0,D=!1,O=!0,X=null,te=Ce(u.current.maxFps);const me=t=>{t.preventDefault(),j(!1),g()},ve=()=>{S=!0,g(),C||Qe(t=>t+1)};l.addEventListener("webglcontextlost",me),l.addEventListener("webglcontextrestored",ve);const ge=(t,n,a,i,d)=>{const[I,ie]=ut(i.variation);e.uniform2f(t.uView,n,a),e.uniform1f(t.uScale,i.scale),e.uniform1f(t.uRotation,i.rotation),e.uniform1f(t.uTime,r.flow-lt*(1-d)),e.uniform1f(t.uWave,i.wave),e.uniform1f(t.uRipple,i.ripple),e.uniform1f(t.uFold,.25+.75*d),e.uniform2f(t.uShift,I,ie),e.uniform4f(t.uPointer,r.x/f.width,1-r.y/f.height,r.touch*i.interactionStrength,.32),e.uniform2f(t.uDrag,r.dragX,r.dragY),e.uniform4fv(t.uWaves,ee)},pe=()=>{if(C||S||e.isContextLost())return;const t=u.current,n=ct(r.intro),a=1-Math.pow(1-r.intro,3);e.bindVertexArray(G),E.width||de(1,1),ee.fill(0),x.slice(-4).forEach((d,I)=>{ee.set([d.x,d.y,d.age*.6,Math.exp(-d.age/(Ue*.45))],I*4)}),t.glow>0&&(de(Math.max(1,Math.round(l.width/4)),Math.max(1,Math.round(l.height/4))),e.bindFramebuffer(e.FRAMEBUFFER,Y),e.viewport(0,0,E.width,E.height),e.useProgram(M.program),ge(M.uniforms,E.width,E.height,t,n),e.drawArrays(e.TRIANGLES,0,3),e.bindTexture(e.TEXTURE_2D,P),e.generateMipmap(e.TEXTURE_2D));const i=F.uniforms;e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,l.width,l.height),e.useProgram(F.program),ge(i,l.width,l.height,t,n),e.uniform3fv(i.uColor,he(t.color)),e.uniform3fv(i.uSheenColor,he(t.sheenColor)),e.uniform1f(i.uNoiseIntensity,t.noiseIntensity),e.uniform1f(i.uDepth,t.depth),e.uniform1f(i.uSheen,t.sheen),e.uniform1f(i.uGlow,t.glow),e.uniform1f(i.uLightMode,t.lightMode?1:0),e.uniform3f(i.uLight,r.lightX,r.lightY,r.touch*t.interactionStrength),e.uniform2f(i.uStep,f.ratio/l.width,f.ratio/l.height),e.uniform1f(i.uPresence,a),e.uniform1f(i.uFade,t.fade),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,P),e.uniform1i(i.uBloom,0),e.drawArrays(e.TRIANGLES,0,3),O=!1,r.intro>=1&&j(!0)},re=t=>{if(A=0,C||S||e.isContextLost()||!D||document.hidden||u.current.paused||v){g();return}if(!te.ready(t)){A=requestAnimationFrame(re);return}const n=u.current,a=_?Math.min(.05,(t-_)/1e3):1/60;_=t,X&&(Object.assign(m,xe(X)),X=null);const i=!n.paused&&!v&&n.speed!==0;i&&(r.flow+=a*.1*n.speed),!n.intro||v?r.intro=1:r.intro<1&&(r.intro=Math.min(1,r.intro+a/st));const d=n.mouseInteraction&&m.inside&&!v;d&&r.touch<.01&&(r.x=m.x,r.y=m.y);const I=1-Math.exp(-a*10),ie=r.x,Ze=r.y;r.x+=(m.x-r.x)*I,r.y+=(m.y-r.y)*I;const et=(r.x-ie)/Math.max(a,.001)/f.height,tt=(r.y-Ze)/Math.max(a,.001)/f.height,Me=1-Math.exp(-a*4);r.dragX+=(V(et*.03,-.06,.06)-r.dragX)*Me,r.dragY+=(V(-tt*.03,-.06,.06)-r.dragY)*Me,r.touch+=((d?1:0)-r.touch)*(1-Math.exp(-a*(d?3.5:1.4)));let $=y[0],q=y[1];if(d){const b=(m.x/f.width-.5)*(f.width/f.height),Pe=.5-m.y/f.height,ae=Math.hypot(b,Pe);ae>.04?($=b/ae*_e,q=Pe/ae*_e):($=r.lightX,q=r.lightY)}const Fe=1-Math.exp(-a*3);r.lightX+=($-r.lightX)*Fe,r.lightY+=(q-r.lightY)*Fe;for(let b=x.length-1;b>=0;b--)x[b].age+=a,x[b].age>Ue*2.5&&x.splice(b,1);pe();const rt=r.intro<1||x.length>0||Math.abs((d?1:0)-r.touch)>.002||Math.abs(r.dragX)+Math.abs(r.dragY)>2e-4||Math.abs(m.x-r.x)+Math.abs(m.y-r.y)>.3||Math.abs($-r.lightX)+Math.abs(q-r.lightY)>.001;i||rt?A=requestAnimationFrame(re):(_=0,L("static"))},R=()=>{if(C||S||e.isContextLost()||!D||document.hidden){g();return}if(u.current.paused||v){g(),(O||!J)&&(r.intro=1,pe()),L(v?"reduced":"paused");return}A||(L("running"),A=requestAnimationFrame(re))};function g(){cancelAnimationFrame(A),A=0,_=0,te.reset(),X=null,m.inside=!1,L(S||e.isContextLost()?"context-lost":"paused")}const oe=()=>{if(C||S||e.isContextLost()){g();return}const t=u.current,n=w.clientWidth,a=w.clientHeight;if(n<1||a<1){g();return}const i=ot(n,a,t.dpr,t.maxPixels);f.width=n,f.height=a,f.ratio=i.width/n,l.width!==i.width&&(l.width=i.width),l.height!==i.height&&(l.height=i.height),O=!0,R()},xe=t=>{const n=w.getBoundingClientRect(),a=t.clientX-n.left,i=t.clientY-n.top;return{x:a,y:i,inside:a>=0&&i>=0&&a<=n.width&&i<=n.height}},we=t=>{!D||document.hidden||v||u.current.paused||!u.current.mouseInteraction||(X={clientX:t.clientX,clientY:t.clientY},R())},Ee=t=>{const n=u.current;if(!D||document.hidden||n.paused||!n.clickRipple||v||t.button!==0||t.target?.closest?.('a, button, input, textarea, select, [role="button"], [contenteditable="true"], [data-silk-ignore]'))return;const a=xe(t);a.inside&&(x.push({x:a.x/f.width,y:1-a.y/f.height,age:0}),x.length>4&&x.shift(),R())},W=()=>{X=null,m.inside&&(m.inside=!1,R())},Re=()=>{g(),document.hidden||R()},be=t=>{v=t.matches,g(),v&&(r.intro=1,r.touch=0,r.dragX=0,r.dragY=0,r.lightX=y[0],r.lightY=y[1],x.length=0,O=!0),R()},Te=new ResizeObserver(oe);Te.observe(w);const ye=new IntersectionObserver(t=>{D=t.some(n=>n.isIntersecting&&n.intersectionRect.width>0&&n.intersectionRect.height>0),D?(_=0,R()):g()},{threshold:[0,.001]});ye.observe(w),window.addEventListener("pointermove",we,{passive:!0}),window.addEventListener("pointerdown",Ee,{passive:!0}),document.documentElement.addEventListener("pointerleave",W),document.addEventListener("visibilitychange",Re),window.addEventListener("blur",W),Z.addEventListener("change",be),oe();let Se=JSON.stringify(u.current),Le=`${u.current.dpr}|${u.current.maxPixels}`,ne=u.current.maxFps;return K.current=()=>{const t=u.current,n=JSON.stringify(t);if(n===Se)return;Se=n,O=!0,t.maxFps!==ne&&(ne=t.maxFps,te=Ce(ne));const a=`${t.dpr}|${t.maxPixels}`;if(a!==Le){Le=a,oe();return}R()},()=>{C=!0,g(),K.current=null,l.removeEventListener("webglcontextlost",me),l.removeEventListener("webglcontextrestored",ve),Te.disconnect(),ye.disconnect(),window.removeEventListener("pointermove",we),window.removeEventListener("pointerdown",Ee),document.documentElement.removeEventListener("pointerleave",W),document.removeEventListener("visibilitychange",Re),window.removeEventListener("blur",W),Z.removeEventListener("change",be),!S&&!e.isContextLost()&&(e.deleteTexture(P),e.deleteFramebuffer(Y),e.deleteProgram(M.program),e.deleteProgram(F.program),e.deleteBuffer(z),e.deleteVertexArray(G))}},[je]),T.useEffect(()=>{K.current?.()}),Ae.createElement("div",{ref:ce,className:`silk-container${le?` ${le}`:""}`,style:Je},Ae.createElement("canvas",{ref:ue,className:"silk-canvas","aria-hidden":"true"}))};export{ht as default};
