import{r as b,R as fe}from"./index-Ci4k60AC.js";import{a as de,c as me}from"./renderBudget-DnUjQnA8.js";const ze=`#version 300 es
precision highp float;
in vec2 aPoint;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uFrame;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;
uniform float uCount;
uniform float uThickness;
uniform float uSoftness;
uniform float uWaves;
uniform float uSplit;
uniform float uFray;
uniform float uSeed;
uniform vec2 uTurn;
uniform vec4 uPart;
uniform float uTaper;
out float vEdge;
out float vBand;
out float vDraw;
out float vAlpha;
out float vIndex;

float Perlin2D(vec2 P) {
  vec2 Pi = floor(P);
  vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
  vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
  Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
  Pt += vec2(26.0, 161.0).xyxy;
  Pt *= Pt;
  Pt = Pt.xzxz * Pt.yyww;
  vec4 hash_x = fract(Pt * (1.0 / 951.135664));
  vec4 hash_y = fract(Pt * (1.0 / 642.949883));
  vec4 grad_x = hash_x - 0.49999;
  vec4 grad_y = hash_y - 0.49999;
  vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y) * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
  grad_results *= 1.4142135623730950;
  vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
  vec4 blend2 = vec4(blend, vec2(1.0 - blend));
  return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

void main() {
  float perc = float(gl_InstanceID) / uCount;
  float x = aPoint.x;
  float pixel = 1.0 / max(uResolution.x, uResolution.y);
  float splitPoint = uSplit + perc * uFray;
  float amplitudeNormal = smoothstep(splitPoint, max(0.7, splitPoint + 0.2), x);
  float finalAmplitude = amplitudeNormal * 0.5 * uAmplitude * (1.0 + (uMouse.y - 0.5) * 0.2);
  float timeScaled = uTime / 10.0 + (uMouse.x - 0.5);
  float blur = smoothstep(splitPoint, splitPoint + 0.05, x) * perc;
  float xnoise = mix(
    Perlin2D(vec2(timeScaled * 2.5 + uSeed, (x * uWaves + perc) * 2.5)),
    Perlin2D(vec2(timeScaled * 3.5 + uSeed, (x * uWaves + timeScaled) * 3.5)) / 1.5,
    x * 0.3
  );
  float y = 0.5 + (perc - 0.5) * uDistance + xnoise / 2.0 * finalAmplitude;
  vec2 local = vec2((x - 0.5) * uFrame.x, (y - 0.5) * uFrame.y);
  if (uPart.z > 0.0) {
    vec2 delta = local - uPart.xy;
    float reach = uPart.w;
    float pull = exp(-dot(delta, delta) / (reach * reach));
    local.y += delta.y * pull * uPart.z;
  }
  float width = 7.0 * uThickness * pixel * (1.0 - perc);
  float band = (width / 2.0 + 10.0 * uSoftness * pixel * blur) * uFrame.y;
  float draw = max(band, 1.0);
  local.y += aPoint.y * draw;
  vec2 turned = vec2(local.x * uTurn.x - local.y * uTurn.y, local.x * uTurn.y + local.y * uTurn.x);
  gl_Position = vec4(turned / (uResolution * 0.5), 0.0, 1.0);
  vEdge = aPoint.y * draw;
  vBand = band;
  vDraw = draw;
  vAlpha = 1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3)) * uTaper;
  vIndex = perc;
}`,Ge=`#version 300 es
precision highp float;
in float vEdge;
in float vBand;
in float vDraw;
in float vAlpha;
in float vIndex;
uniform vec3 uColor;
uniform vec3 uAccent;
out vec4 outColor;
void main() {
  float coverage = (1.0 - smoothstep(0.0, vDraw, abs(vEdge))) * (vBand / vDraw) * vAlpha;
  outColor = vec4(mix(uColor, uAccent, vIndex) * coverage, coverage);
}`,We=`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,Ye=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uLines;
uniform vec2 uResolution;
uniform float uFade;
uniform float uOpacity;
uniform float uCurve;
out vec4 outColor;

float smootherstep(float edge, float x) {
  float t = clamp(x / edge, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec4 lines = texture(uLines, vUv);
  float alpha = lines.a;
  vec3 color = alpha > 0.0001 ? lines.rgb / alpha : vec3(0.0);
  float mask = uOpacity;
  if (uFade > 0.0) {
    vec2 px = vUv * uResolution;
    float edge = uFade * min(uResolution.x, uResolution.y) * 0.5;
    mask *= smootherstep(edge, px.x) * smootherstep(edge, uResolution.x - px.x);
    mask *= smootherstep(edge, px.y) * smootherstep(edge, uResolution.y - px.y);
  }
  outColor = vec4(color * pow(alpha, uCurve), alpha) * mask;
}`,l=(n,f,p)=>Math.min(p,Math.max(f,n)),he=(n,f,p)=>{const s=n.createShader(f);return s?(n.shaderSource(s,p),n.compileShader(s),n.getShaderParameter(s,n.COMPILE_STATUS)?s:(n.deleteShader(s),null)):null},ve=(n,f,p)=>{const s=he(n,n.VERTEX_SHADER,f),v=he(n,n.FRAGMENT_SHADER,p),m=n.createProgram();return!s||!v||!m?(s&&n.deleteShader(s),v&&n.deleteShader(v),m&&n.deleteProgram(m),null):(n.attachShader(m,s),n.attachShader(m,v),n.linkProgram(m),n.deleteShader(s),n.deleteShader(v),n.getProgramParameter(m,n.LINK_STATUS)?m:(n.deleteProgram(m),null))},pe=(n,f,p)=>{const s={};for(const v of p)s[v]=n.getUniformLocation(f,v);return s},He=({color:n=[1,1,1],accentColor:f,amplitude:p=1.7,distance:s=.4,enableMouseInteraction:v=!1,lineCount:m=90,thickness:xe=.6,softness:Ee=1.3,speed:Pe=.6,waves:Re=1.05,split:ge=.04,fray:ye=.5,angle:Ae=25,seed:Te=0,parting:be=0,taper:_e=.85,brightness:Fe=1.4,fade:we=0,opacity:Me=1,paused:Se=!1,dpr:Le=1,maxFps:Ce=30,maxPixels:De=1e6,...Ue})=>{const W=b.useRef(null),Y=b.useRef(null),D=b.useRef(null),Be=`${Array.isArray(n)?n.join(","):String(n)}|${Array.isArray(f)?f.join(","):String(f??"")}`,K={color:n,accentColor:f,colorKey:Be,amplitude:p,distance:s,enableMouseInteraction:v,lineCount:l(Math.round(m),1,400),thickness:Math.max(0,xe),softness:Math.max(0,Ee),speed:Pe,waves:Math.max(0,Re),split:l(ge,0,1),fray:l(ye,0,1),angle:Ae,seed:Te,parting:l(be,0,1),taper:l(_e,0,1),brightness:l(Fe,.25,2),fade:l(we,0,1),opacity:l(Me,0,1),paused:Se,dpr:l(Le,.1,2),maxFps:l(Ce,1,30),maxPixels:l(De,1,1e6)},x=b.useRef(K);x.current=K,b.useEffect(()=>{const g=W.current,d=Y.current,e=d?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!g||!d||!e)return;const P=ve(e,ze,Ge),R=ve(e,We,Ye);if(!P||!R){P&&e.deleteProgram(P),R&&e.deleteProgram(R);return}const i=pe(e,P,["uTime","uResolution","uFrame","uAmplitude","uDistance","uMouse","uCount","uThickness","uSoftness","uWaves","uSplit","uFray","uSeed","uTurn","uPart","uTaper","uColor","uAccent"]),_=pe(e,R,["uLines","uResolution","uFade","uOpacity","uCurve"]),U=e.createVertexArray(),B=e.createBuffer();e.bindVertexArray(U),e.bindBuffer(e.ARRAY_BUFFER,B);const H=e.getAttribLocation(P,"aPoint");e.enableVertexAttribArray(H),e.vertexAttribPointer(H,2,e.FLOAT,!1,0,0);const I=e.createVertexArray(),$=e.createBuffer();e.bindVertexArray(I),e.bindBuffer(e.ARRAY_BUFFER,$),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);const j=e.getAttribLocation(R,"aPosition");e.enableVertexAttribArray(j),e.vertexAttribPointer(j,2,e.FLOAT,!1,0,0),e.bindVertexArray(null);const F=e.createTexture(),N=e.createFramebuffer();e.bindTexture(e.TEXTURE_2D,F),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const O=document.createElement("canvas");O.width=1,O.height=1;const y=O.getContext("2d",{willReadFrequently:!0}),L=window.matchMedia("(prefers-reduced-motion: reduce)");let X=L.matches,V=de(x.current.maxFps),k=x.current.maxFps;const r={time:0,width:1,height:1,segments:0,colorKey:"",color:[1,1,1],accent:[1,1,1],mouse:[.5,.5],targetMouse:[.5,.5],pointer:[0,0],targetPointer:[0,0],presence:0,inside:!1};let E=0,w=0,A=!1,C=!0,M=!1;const Q=t=>{if(Array.isArray(t))return[0,1,2].map(c=>l(Number(t[c]??1),0,1));if(!y)return[1,1,1];y.clearRect(0,0,1,1),y.fillStyle="#ffffff",y.fillStyle=String(t),y.fillRect(0,0,1,1);const[o,a,u]=y.getImageData(0,0,1,1).data;return[o/255,a/255,u/255]},Ne=t=>{t.colorKey!==r.colorKey&&(r.colorKey=t.colorKey,r.color=Q(t.color),r.accent=t.accentColor===void 0||t.accentColor===null?r.color:Q(t.accentColor))},Oe=t=>{if(t===r.segments)return;r.segments=t;const o=new Float32Array((t+1)*4);for(let a=0;a<=t;a++){const u=a/t;o.set([u,-1,u,1],a*4)}e.bindBuffer(e.ARRAY_BUFFER,B),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW)},z=()=>{const t=g.clientWidth,o=g.clientHeight;if(!t||!o||M)return;const a=x.current,u=me(t,o,Math.min(window.devicePixelRatio||1,a.dpr),a.maxPixels);d.width=u.width,d.height=u.height,r.width=t,r.height=o,e.bindTexture(e.TEXTURE_2D,F),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,d.width,d.height,0,e.RGBA,e.UNSIGNED_BYTE,null),e.bindFramebuffer(e.FRAMEBUFFER,N),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,F,0),e.bindFramebuffer(e.FRAMEBUFFER,null),Oe(l(Math.round(t/3),96,640)),J()},J=()=>{if(!C||!A||document.hidden||M)return;const t=x.current;Ne(t);const o=d.width,a=d.height,u=t.angle*Math.PI/180,c=Math.cos(u),h=Math.sin(u),Xe=Math.abs(o*c)+Math.abs(a*h),Ve=Math.abs(o*h)+Math.abs(a*c),ie=o/r.width,se=t.enableMouseInteraction?r.mouse:[.5,.5],ke=t.parting*r.presence*2,ue=r.pointer[0]*ie,ce=r.pointer[1]*ie,le=[ue*c+ce*h,-ue*h+ce*c];e.bindFramebuffer(e.FRAMEBUFFER,N),e.viewport(0,0,o,a),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.useProgram(P),e.uniform1f(i.uTime,r.time),e.uniform2f(i.uResolution,o,a),e.uniform2f(i.uFrame,Xe,Ve),e.uniform1f(i.uAmplitude,t.amplitude),e.uniform1f(i.uDistance,t.distance),e.uniform2f(i.uMouse,se[0],se[1]),e.uniform1f(i.uCount,t.lineCount),e.uniform1f(i.uThickness,t.thickness),e.uniform1f(i.uSoftness,t.softness),e.uniform1f(i.uWaves,t.waves),e.uniform1f(i.uSplit,t.split),e.uniform1f(i.uFray,t.fray),e.uniform1f(i.uSeed,t.seed*13.37),e.uniform2f(i.uTurn,c,h),e.uniform4f(i.uPart,le[0],le[1],ke,Math.min(o,a)*.16),e.uniform1f(i.uTaper,t.taper),e.uniform3f(i.uColor,r.color[0],r.color[1],r.color[2]),e.uniform3f(i.uAccent,r.accent[0],r.accent[1],r.accent[2]),e.bindVertexArray(U),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,(r.segments+1)*2,t.lineCount),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,o,a),e.disable(e.BLEND),e.clear(e.COLOR_BUFFER_BIT),e.useProgram(R),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,F),e.uniform1i(_.uLines,0),e.uniform2f(_.uResolution,o,a),e.uniform1f(_.uFade,t.fade),e.uniform1f(_.uOpacity,t.opacity),e.uniform1f(_.uCurve,2/t.brightness),e.bindVertexArray(I),e.drawArrays(e.TRIANGLES,0,3),e.bindVertexArray(null)},G=t=>{if(E=0,!C||!A||document.hidden||M)return;const o=x.current;if(!V.ready(t)){E=requestAnimationFrame(G);return}const a=w?Math.min(.1,(t-w)/1e3):1/o.maxFps;w=t;const u=!o.paused&&!X;u&&(r.time+=a*o.speed);const c=1-Math.exp(-a*3);r.mouse[0]+=(r.targetMouse[0]-r.mouse[0])*c,r.mouse[1]+=(r.targetMouse[1]-r.mouse[1])*c;const h=1-Math.exp(-a*10);r.pointer[0]+=(r.targetPointer[0]-r.pointer[0])*h,r.pointer[1]+=(r.targetPointer[1]-r.pointer[1])*h,r.presence+=((r.inside&&o.parting>0?1:0)-r.presence)*(1-Math.exp(-a*4)),J(),u?E=requestAnimationFrame(G):w=0},T=()=>{!E&&C&&A&&!document.hidden&&!M&&(E=requestAnimationFrame(G))},Z=t=>{const o=x.current;if(!A||document.hidden||X||o.paused||!o.enableMouseInteraction&&o.parting===0)return;const a=g.getBoundingClientRect(),u=(t.clientX-a.left)/Math.max(1,a.width),c=(t.clientY-a.top)/Math.max(1,a.height),h=u>=0&&u<=1&&c>=0&&c<=1;h?(r.targetMouse=[u,1-c],r.targetPointer=[t.clientX-a.left-a.width/2,a.height/2-(t.clientY-a.top)],!r.inside&&r.presence<.01&&(r.pointer=[...r.targetPointer])):r.inside&&(r.targetMouse=[.5,.5]),r.inside=h,T()},ee=()=>{r.inside&&(r.inside=!1,r.targetMouse=[.5,.5],T())},S=()=>{cancelAnimationFrame(E),E=0,w=0,V.reset()},te=()=>{S(),document.hidden||T()},re=()=>{X=L.matches,S(),T()},ne=t=>{t.preventDefault(),M=!0,S()},oe=new ResizeObserver(z);oe.observe(g);const ae=new IntersectionObserver(t=>{A=t.some(o=>o.isIntersecting),S(),A&&T()});return ae.observe(g),window.addEventListener("pointermove",Z,{passive:!0}),document.documentElement.addEventListener("pointerleave",ee),document.addEventListener("visibilitychange",te),L.addEventListener("change",re),d.addEventListener("webglcontextlost",ne),z(),D.current=()=>{S();const t=x.current;k!==t.maxFps&&(k=t.maxFps,V=de(k));const o=me(r.width,r.height,Math.min(window.devicePixelRatio||1,t.dpr),t.maxPixels);(o.width!==d.width||o.height!==d.height)&&z(),T()},()=>{C=!1,cancelAnimationFrame(E),D.current=null,oe.disconnect(),ae.disconnect(),window.removeEventListener("pointermove",Z),document.documentElement.removeEventListener("pointerleave",ee),document.removeEventListener("visibilitychange",te),L.removeEventListener("change",re),d.removeEventListener("webglcontextlost",ne),e.deleteFramebuffer(N),e.deleteTexture(F),e.deleteBuffer(B),e.deleteBuffer($),e.deleteVertexArray(U),e.deleteVertexArray(I),e.deleteProgram(P),e.deleteProgram(R),e.getExtension("WEBGL_lose_context")?.loseContext()}},[]),b.useEffect(()=>{D.current?.()});const{className:q="",...Ie}=Ue;return fe.createElement("div",{ref:W,className:`threads-container${q?` ${q}`:""}`,...Ie},fe.createElement("canvas",{ref:Y,className:"threads-canvas","aria-hidden":"true"}))};export{He as default};
