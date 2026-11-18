/* Original procedural scenery for the chronology experiment. No reference-site
 * geometry, shader source, point cloud, matcap, or environment map is embedded.
 * Two-pass scene: environment/particles -> glass-spine composite -> public RT.
 * Caller owns animation timing and may draw refractive cards on the same GL. */
(function(global){
'use strict';
const fullscreenVS=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const backgroundFS=`precision mediump float;varying vec2 vUv;uniform float uTime;uniform vec2 uPointer;
float fog(vec2 p,vec2 c,vec2 r){vec2 q=(p-c)/r;return exp(-dot(q,q)*2.);}
void main(){vec2 p=vUv;vec3 c=mix(vec3(.027,.041,.049),vec3(.072,.103,.105),p.y);
c+=vec3(.10,.025,.085)*fog(p,vec2(.17,.18),vec2(.64,.62));
c+=vec3(.019,.083,.066)*fog(p,vec2(.85,.8),vec2(.66,.68));
c+=vec3(.086,.025,.049)*fog(p,vec2(.73,.13),vec2(.4,.55));
float grain=fract(sin(dot(mod(gl_FragCoord.xy,128.),vec2(12.9898,78.233)))*4375.85453)-.5;
c+=grain*.008;c*=1.-.18*length((p-.5)*1.2);gl_FragColor=vec4(c,1.);}`;
const projection=`uniform vec4 uCamera;uniform float uAngle;uniform vec2 uViewport;
vec3 eye(vec3 p){vec3 d=p-uCamera.xyz;return vec3(sin(uAngle)*d.x-cos(uAngle)*d.z,d.y,cos(uAngle)*d.x+sin(uAngle)*d.z-2.);}
vec4 project(vec3 e){float f=3.1715948;return vec4(e.x*f/(uViewport.x/uViewport.y),e.y*f,-1.002002*e.z-.2002002,-e.z);}`;
const particleVS=`precision highp float;attribute vec3 aPosition;attribute vec4 aColor;attribute float aSize;${projection}
uniform float uTime;uniform vec4 uPointer;uniform float uDpr;varying vec4 vColor;
void main(){vec3 p=aPosition;p.y=uCamera.y+mod(p.y-uCamera.y+5.,10.)-5.;float t=uTime*.00012;
p.x+=.035*sin(t+p.y*1.7+p.z);p.z+=.035*cos(t*.8+p.y*1.3+p.x);
vec3 e=eye(p);vec4 clip=project(e);vec2 ndc=clip.xy/max(.1,clip.w);vec2 d=ndc-uPointer.xy;
float influence=exp(-dot(d,d)*9.);e.xy+=uPointer.zw*influence*.24;
gl_Position=project(e);float distance=-e.z;gl_PointSize=clamp(aSize*uDpr*9./max(2.,distance),.85,5.);
float fog=exp(-max(0.,distance-7.)*.055);vColor=vec4(aColor.rgb*mix(1.2,1.65,sin(p.y*3.+t)*.5+.5),aColor.a*fog);if(distance<.2)gl_PointSize=0.;}`;
const particleFS=`precision mediump float;varying vec4 vColor;void main(){vec2 q=gl_PointCoord-.5;float d=dot(q,q);if(d>.25)discard;float a=exp(-d*18.)*(1.-smoothstep(.13,.25,d));gl_FragColor=vec4(vColor.rgb,vColor.a*a);}`;
const glassVS=`precision highp float;attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aTint;attribute float aEdge;${projection}
uniform float uTime;varying vec3 vNormal;varying vec3 vEye;varying vec3 vTint;varying float vEdge;
void main(){vec3 p=aPosition;p.x+=.012*sin(p.y*1.9+uTime*.0001);vec3 e=eye(p);vEye=e;vNormal=normalize(vec3(sin(uAngle)*aNormal.x-cos(uAngle)*aNormal.z,aNormal.y,cos(uAngle)*aNormal.x+sin(uAngle)*aNormal.z));vTint=aTint;vEdge=aEdge;gl_Position=project(e);}`;
const glassFS=`precision highp float;uniform sampler2D uEnvironment;uniform vec2 uResolution;uniform vec4 uPointer;varying vec3 vNormal;varying vec3 vEye;varying vec3 vTint;varying float vEdge;
void main(){vec3 n=normalize(vNormal),view=normalize(-vEye);float fres=pow(1.-abs(dot(n,view)),2.4);vec2 uv=gl_FragCoord.xy/uResolution;
vec2 warp=n.xy*(.006+.019*fres);vec2 m=uv-(uPointer.xy*.5+.5);warp+=uPointer.zw*.0018*exp(-dot(m,m)*14.);
vec3 transmitted=vec3(texture2D(uEnvironment,clamp(uv+warp*1.08,0.,1.)).r,texture2D(uEnvironment,clamp(uv+warp,0.,1.)).g,texture2D(uEnvironment,clamp(uv+warp*.91,0.,1.)).b);
vec3 light=normalize(vec3(-.6,.85,1.));float spec=pow(max(dot(reflect(-light,n),view),0.),28.);float line=pow(max(0.,1.-abs(dot(n,view))),8.);float edge=pow(abs(vEdge*2.-1.),9.);
vec3 color=transmitted*.92+(vec3(.34,.39,.40)+vTint*.42)*(.025+.10*fres+.57*edge)+vec3(.88,.96,.94)*spec*.5+vec3(.5,.6,.62)*line*edge*.35;
gl_FragColor=vec4(color,.33+.53*fres+spec*.11);}`;
const copyFS=`precision mediump float;varying vec2 vUv;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUv);}`;
function mount(scene){
 const canvas=document.createElement('canvas');canvas.className='tl-live-scene';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
 let gl;try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:true,powerPreference:'low-power',preserveDrawingBuffer:false});}catch{return null;}if(!gl)return null;
 const resources={programs:[],buffers:[],textures:[],fbos:[]};let dead=false,lost=false,width=0,height=0,lastCamera={x:7.6,y:0,z:0,angle:0,p:0},phase=0,canvasRect={width:1280,height:720};
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const err=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(err);}return s;}
 function program(vs,fs){const p=gl.createProgram();let v,f;try{v=shader(gl.VERTEX_SHADER,vs);f=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));resources.programs.push(p);return p;}catch(e){gl.deleteProgram(p);throw e;}finally{if(v)gl.deleteShader(v);if(f)gl.deleteShader(f);}}
 function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);resources.buffers.push(b);return b;}
 function target(){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const fbo=gl.createFramebuffer();resources.textures.push(texture);resources.fbos.push(fbo);return{texture,fbo};}
 let bg,points,glass,copy,quad,particleBuffer,glassBuffer,environment,output,pointCount=7600,triangleCount=0;
 let seed=72891;function rnd(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}function gauss(){return(Math.sqrt(-2*Math.log(Math.max(.00001,rnd())))*Math.cos(6.2831853*rnd()));}
 const palette=[[.33,.64,.59],[.63,.33,.63],[.77,.43,.51],[.43,.47,.73],[.71,.66,.50]];
 function particles(){const data=[];for(let i=0;i<pointCount;i++){const cluster=Math.floor(rnd()*42),a=cluster*2.39996,level=2-cluster*.69,r=1.6+(cluster%4)*.37;
 const petal=rnd()*6.2831853,stretch=.2+.6*rnd(),radial=gauss()*.2;
 const x=Math.cos(a)*r+Math.cos(a+petal)*stretch+Math.cos(a)*radial;
 const z=Math.sin(a)*r+Math.sin(a+petal)*stretch+Math.sin(a)*radial;
 const y=level+Math.sin(petal*2)*.24+gauss()*.17;
 const col=palette[cluster%palette.length],lum=.65+rnd()*.5;data.push(x,y,z,col[0]*lum,col[1]*lum,col[2]*lum,.35+rnd()*.49,1.5+rnd()*1.9);
 }return data;}
 function sculpture(){const data=[];function tri(a,b,c,tint,edges=[1,1,1]){const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1;n=n.map(x=>x/len);let vi=0;for(const p of[a,b,c]){let nn=Math.abs(n[1])>.5?[p[0]*.34,Math.sign(n[1]),p[2]*.34]:[n[0]+p[0]*.3,n[1],n[2]+p[2]*.3],nl=Math.hypot(...nn)||1;data.push(...p,...nn.map(v=>v/nl),...tint,edges[vi++]);}triangleCount+=3;}
 for(let band=0;band<43;band++){const cy=2-band*.69,rot=band*.59;
 for(let petal=0;petal<5;petal++){if(rnd()<.18)continue;const angle=rot+petal*Math.PI*2/5,span=.73+rnd()*.38,ri=.38+rnd()*.25,ro=ri+.34+rnd()*.48,tilt=(rnd()-.5)*.32,tint=palette[(band+petal)%palette.length];
 function point(t,outer){const a=angle+t*span,r=outer?ro*(.91+.09*Math.sin(Math.PI*t)):ri;return[Math.cos(a)*r,cy+Math.sin(t*Math.PI)*.16+t*tilt+(outer?.06:0),Math.sin(a)*r];}
 for(let j=0;j<8;j++){const a=j/8,b=(j+1)/8,p0=point(a,false),p1=point(a,true),p2=point(b,true),p3=point(b,false);tri(p0,p1,p2,tint,[0,1,1]);tri(p0,p2,p3,tint,[0,1,0]);
 const q1=[p1[0],p1[1]-.035,p1[2]],q2=[p2[0],p2[1]-.035,p2[2]];tri(p1,q1,q2,tint);tri(p1,q2,p2,tint);
 }}}
 return data;}
 function cleanup(){if(dead)return;dead=true;observer?.disconnect();canvas.remove();resources.programs.forEach(x=>gl.deleteProgram(x));resources.buffers.forEach(x=>gl.deleteBuffer(x));resources.textures.forEach(x=>gl.deleteTexture(x));resources.fbos.forEach(x=>gl.deleteFramebuffer(x));}
 let observer;
 try{bg=program(fullscreenVS,backgroundFS);points=program(particleVS,particleFS);glass=program(glassVS,glassFS);copy=program(fullscreenVS,copyFS);quad=buffer([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);particleBuffer=buffer(particles());glassBuffer=buffer(sculpture());environment=target();output=target();}catch(e){cleanup();console.warn('Chronology live scenery unavailable:',e.message);return null;}
 function location(p,name){return gl.getUniformLocation(p,name);}const cached=new Map();function uniforms(p){if(cached.has(p))return cached.get(p);const u={};for(const n of['uCamera','uAngle','uViewport','uDpr','uPointer','uTime','uResolution','uEnvironment','uTexture'])u[n]=location(p,n);cached.set(p,u);return u;}
 function resetAttributes(){for(let i=0;i<8;i++)gl.disableVertexAttribArray(i);}
 function attr(p,name,size,stride,offset){const n=gl.getAttribLocation(p,name);if(n<0)return;gl.enableVertexAttribArray(n);gl.vertexAttribPointer(n,size,gl.FLOAT,false,stride,offset);}
 function resize(){const dpr=Math.min(1.25,global.devicePixelRatio||1,Math.sqrt(1800000/Math.max(1,canvasRect.width*canvasRect.height))),w=Math.max(1,Math.round(canvasRect.width*dpr)),h=Math.max(1,Math.round(canvasRect.height*dpr));if(w===width&&h===height)return;width=w;height=h;canvas.width=w;canvas.height=h;for(const t of[environment,output]){gl.bindTexture(gl.TEXTURE_2D,t.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t.texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Scene framebuffer unavailable');}}
 function common(p,c,m,time){const u=uniforms(p);gl.uniform4f(u.uCamera,c.x,c.y,c.z,c.p||0);gl.uniform1f(u.uAngle,c.angle);gl.uniform2f(u.uViewport,width,height);gl.uniform1f(u.uDpr,width/Math.max(1,canvasRect.width));gl.uniform1f(u.uTime,time);gl.uniform4f(u.uPointer,m.x||0,m.y||0,m.vx||0,m.vy||0);gl.uniform2f(u.uResolution,width,height);}
 function fullscreen(p,texture){resetAttributes();gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,quad);attr(p,'aPosition',2,8,0);if(texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(uniforms(p).uTexture,0);}gl.drawArrays(gl.TRIANGLES,0,6);}
 function render(camera,pointer,time){if(dead||lost)return false;const c=camera||lastCamera,m=pointer||{};lastCamera=c;phase=time||0;try{resize();}catch(e){cleanup();return false;}gl.viewport(0,0,width,height);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.BLEND);gl.bindFramebuffer(gl.FRAMEBUFFER,environment.fbo);gl.useProgram(bg);gl.uniform1f(uniforms(bg).uTime,phase);gl.uniform2f(uniforms(bg).uPointer,m.x||0,m.y||0);fullscreen(bg);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);resetAttributes();gl.useProgram(points);common(points,c,m,phase);gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);attr(points,'aPosition',3,32,0);attr(points,'aColor',4,32,12);attr(points,'aSize',1,32,28);gl.drawArrays(gl.POINTS,0,pointCount);
 gl.bindFramebuffer(gl.FRAMEBUFFER,output.fbo);gl.disable(gl.BLEND);fullscreen(copy,environment.texture);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);resetAttributes();gl.useProgram(glass);common(glass,c,m,phase);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,environment.texture);gl.uniform1i(uniforms(glass).uEnvironment,0);gl.bindBuffer(gl.ARRAY_BUFFER,glassBuffer);attr(glass,'aPosition',3,40,0);attr(glass,'aNormal',3,40,12);attr(glass,'aTint',3,40,24);attr(glass,'aEdge',1,40,36);gl.drawArrays(gl.TRIANGLES,0,triangleCount);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);fullscreen(copy,output.texture);return true;}
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;scene.dataset.liveScene='lost';});canvas.addEventListener('webglcontextrestored',()=>{scene.dataset.liveScene='reload-required';});
 canvasRect=scene.getBoundingClientRect();observer=new ResizeObserver(entries=>{const r=entries[0]?.contentRect;if(r)canvasRect=r;});observer.observe(scene);scene.insertBefore(canvas,scene.firstChild);scene.dataset.liveScene='ready';
 return{gl,canvas,get texture(){return output.texture;},get width(){return width;},get height(){return height;},render,destroy:cleanup,particleCount:pointCount};
}
global.LiveChronologyScene={mount};
})(window);
