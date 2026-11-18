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
uniform float uTime;uniform float uScroll;varying vec3 vNormal;varying vec3 vEye;varying vec3 vTint;varying vec3 vWorld;varying float vEdge;
void main(){vec3 p=aPosition,n=aNormal;
if(aEdge>1.5){float a=-uScroll*25.1327412;mat2 r=mat2(cos(a),sin(a),-sin(a),cos(a));p.xz=r*p.xz;n.xz=r*n.xz;p.y-=17.*uScroll;float bend=-p.y*.4;p.x-=cos(bend)*1.1;p.z-=sin(bend)*1.1;p.y+=3.;}
vec3 e=eye(p);vEye=e;vWorld=p;vNormal=normalize(vec3(sin(uAngle)*n.x-cos(uAngle)*n.z,n.y,cos(uAngle)*n.x+sin(uAngle)*n.z));vTint=aTint;vEdge=aEdge;gl_Position=project(e);}`;
const glassFS=`precision highp float;uniform sampler2D uEnvironment;uniform vec2 uResolution;uniform vec4 uPointer;varying vec3 vNormal;varying vec3 vEye;varying vec3 vTint;varying vec3 vWorld;varying float vEdge;
float band(float x,float c,float w){float d=(x-c)/w;return exp(-d*d);}
vec3 studio(vec3 r){vec3 base=vec3(.18,.205,.22);
float silver=band(r.x,.28,.60)*band(r.y,.3,1.1);float edge=band(r.x,-.7,.22);
base+=vec3(.88,.99,.98)*silver*1.3+vec3(.58,.82,.94)*edge*.65;
base+=vec3(.19,.7,.83)*band(r.y,.64,.28)*.50;
base+=vec3(.92,.18,.51)*band(r.y,-.34,.35)*band(r.x,-.05,.9)*.44;
base+=vec3(.40,.28,.80)*band(r.x,.63,.2)*.62;
return base;}
void main(){vec3 n=normalize(vNormal),view=normalize(-vEye);n=normalize(n+vec3(sin(vWorld.y*14.+vWorld.z*11.),sin(vWorld.x*9.-vWorld.y*13.),cos(vWorld.z*16.+vWorld.x*9.))*.014);
if(dot(n,view)<0.)n=-n;vec3 reflection=reflect(-view,n);float fres=pow(1.-max(dot(n,view),0.),3.);
vec2 uv=gl_FragCoord.xy/uResolution;vec2 warp=n.xy*.16;vec2 m=uv-(uPointer.xy*.5+.5);warp+=uPointer.zw*.002*exp(-dot(m,m)*14.);
vec3 scene=texture2D(uEnvironment,clamp(uv+warp,.001,.999)).rgb;
float spec=pow(max(dot(reflect(-normalize(vec3(-.5,.8,1.)),n),view),0.),44.);
vec3 color=studio(reflection)*(.76+.22*fres)+scene*.85+vec3(.78,.9,.88)*spec*.7;
color*=mix(vec3(1.),vTint,.2);if(vEdge>1.5)color*=.78;color=color/(vec3(1.)+color*.38);
gl_FragColor=vec4(color,1.);}`;
const copyFS=`precision mediump float;varying vec2 vUv;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUv);}`;
function mount(scene){
 const canvas=document.createElement('canvas');canvas.className='tl-live-scene';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
 let gl;try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:true,powerPreference:'low-power',preserveDrawingBuffer:false});}catch{return null;}if(!gl)return null;
 const resources={programs:[],buffers:[],textures:[],fbos:[],renderbuffers:[]};let dead=false,lost=false,width=0,height=0,lastCamera={x:7.6,y:0,z:0,angle:0,p:0},phase=0,canvasRect={width:1280,height:720};
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const err=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(err);}return s;}
 function program(vs,fs){const p=gl.createProgram();let v,f;try{v=shader(gl.VERTEX_SHADER,vs);f=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));resources.programs.push(p);return p;}catch(e){gl.deleteProgram(p);throw e;}finally{if(v)gl.deleteShader(v);if(f)gl.deleteShader(f);}}
 function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);resources.buffers.push(b);return b;}
 function target(withDepth=false){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const fbo=gl.createFramebuffer(),depth=withDepth?gl.createRenderbuffer():null;resources.textures.push(texture);resources.fbos.push(fbo);if(depth)resources.renderbuffers.push(depth);return{texture,fbo,depth};}
 let bg,points,glass,copy,quad,particleBuffer,glassBuffer,glassIndexBuffer,environment,output,pointCount=7600,triangleCount=0;
 let seed=72891;function rnd(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}function gauss(){return(Math.sqrt(-2*Math.log(Math.max(.00001,rnd())))*Math.cos(6.2831853*rnd()));}
 const palette=[[.33,.64,.59],[.63,.33,.63],[.77,.43,.51],[.43,.47,.73],[.71,.66,.50]];
 function particles(){const data=[];for(let i=0;i<pointCount;i++){const main=i<pointCount*.8,cluster=Math.floor(rnd()*(main?6:42)),a=cluster*2.39996,level=main?2-cluster*1.65:2-cluster*.69,r=1.65+(cluster%3)*.46;
 const petal=rnd()*6.2831853,stretch=main?.67*Math.sqrt(rnd()):.2+.6*rnd(),radial=gauss()*(main?.07:.25);
 const x=Math.cos(a)*r+Math.cos(a+petal)*stretch+Math.cos(a)*radial;
 const z=Math.sin(a)*r+Math.sin(a+petal)*stretch+Math.sin(a)*radial;
 const y=level+Math.sin(petal*2)*(main?.29:.24)+gauss()*(main?.09:.23);
 const col=palette[cluster%palette.length],lum=.65+rnd()*.5;data.push(x,y,z,col[0]*lum,col[1]*lum,col[2]*lum,.35+rnd()*.49,1.5+rnd()*1.9);
 }return data;}
 function sculpture(){const data=[],indices=[];
 function normalized(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l);}
 function surface(fn,nu,nv,transform,tint,kind){function vertex(u,v){let p=fn(u,v),a=fn(u+.0001,v),b=fn(u,v+.0001),du=a.map((x,i)=>x-p[i]),dv=b.map((x,i)=>x-p[i]);let n=normalized([du[1]*dv[2]-du[2]*dv[1],du[2]*dv[0]-du[0]*dv[2],du[0]*dv[1]-du[1]*dv[0]]);return transform(p,n);}
 const offset=data.length/10;for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){const v=vertex(i/nu,j/nv);data.push(...v.p,...v.n,...tint,kind);}
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=offset+i*(nv+1)+j,b=a+nv+1;indices.push(a,b,b+1,a,b+1,a+1);triangleCount+=6;}}
 const angleDistance=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 // Independent closed vertebral form: central foramen, thick body and three
 // tapered processes. Parametric topology is not the source mesh's vertices.
 function vertebra(u,v){const a=u*Math.PI*2,b=v*Math.PI*2;
 const posterior=Math.exp(-Math.pow(angleDistance(a,Math.PI)/.19,2));
 const wings=Math.exp(-Math.pow(angleDistance(a,2.08)/.24,2))+Math.exp(-Math.pow(angleDistance(a,-2.08)/.24,2));
 const core=.37+.09*Math.cos(a),tube=.20+.13*Math.cos(a),outer=Math.pow(Math.max(0,Math.cos(b)),2),rounded=(t)=>Math.sign(t)*Math.pow(Math.abs(t),.50);
 const r=core+tube*rounded(Math.cos(b))+(.50*posterior+.34*wings+.18*Math.pow(Math.max(0,Math.cos(a)),4))*outer;
 const y=(.18+.07*Math.cos(a))*rounded(Math.sin(b))-.74*posterior*outer+.18+.055*Math.cos(a);
 return[Math.cos(a)*r-.15,y,Math.sin(a)*r];}
 for(let i=0;i<54;i++){const a=.4*i+.035*Math.sin(i*1.7),ca=Math.cos(a),sa=Math.sin(a),cy=7.446-.65*i,sx=1+.055*Math.sin(i*1.13),sy=1+.045*Math.cos(i*1.71),sz=1+.06*Math.sin(i*.91);
 const transform=(p,n)=>({p:[ca*p[0]*sx+sa*p[2]*sz,p[1]*sy+cy,-sa*p[0]*sx+ca*p[2]*sz],n:normalized([ca*n[0]/sx+sa*n[2]/sz,n[1]/sy,-sa*n[0]/sx+ca*n[2]/sz])});
 surface(vertebra,32,12,transform,[.82,1.,.96],0);}
 // Capsule-section chain links. They orbit/bend in the vertex shader with
 // source-observed motion parameters, not with copied asset geometry.
 function link(u,v){const a=u*Math.PI*2,b=v*Math.PI*2,x=.095*Math.cos(a),y=.18*Math.sin(a);
 const outward=normalized([Math.cos(a),Math.sin(a),0]);const t=.025;
 return[x+t*Math.cos(b)*outward[0],y+t*Math.cos(b)*outward[1],t*Math.sin(b)];}
 for(let i=0;i<80;i++){const a=i*Math.PI/2,ca=Math.cos(a),sa=Math.sin(a),cy=-.22*i;
 surface(link,20,6,(p,n)=>({p:[ca*p[0]+sa*p[2],p[1]+cy,-sa*p[0]+ca*p[2]],n:[ca*n[0]+sa*n[2],n[1],-sa*n[0]+ca*n[2]]}),[.73,.85,.89],2);}
 return{vertices:data,indices};}
 function cleanup(){if(dead)return;dead=true;observer?.disconnect();canvas.remove();resources.programs.forEach(x=>gl.deleteProgram(x));resources.buffers.forEach(x=>gl.deleteBuffer(x));resources.textures.forEach(x=>gl.deleteTexture(x));resources.fbos.forEach(x=>gl.deleteFramebuffer(x));resources.renderbuffers.forEach(x=>gl.deleteRenderbuffer(x));}
 let observer;
 try{bg=program(fullscreenVS,backgroundFS);points=program(particleVS,particleFS);glass=program(glassVS,glassFS);copy=program(fullscreenVS,copyFS);quad=buffer([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);particleBuffer=buffer(particles());const mesh=sculpture();glassBuffer=buffer(mesh.vertices);glassIndexBuffer=gl.createBuffer();resources.buffers.push(glassIndexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,glassIndexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(mesh.indices),gl.STATIC_DRAW);environment=target();output=target(true);}catch(e){cleanup();console.warn('Chronology live scenery unavailable:',e.message);return null;}
 function location(p,name){return gl.getUniformLocation(p,name);}const cached=new Map();function uniforms(p){if(cached.has(p))return cached.get(p);const u={};for(const n of['uCamera','uAngle','uViewport','uDpr','uPointer','uTime','uResolution','uEnvironment','uTexture','uScroll'])u[n]=location(p,n);cached.set(p,u);return u;}
 function resetAttributes(){for(let i=0;i<8;i++)gl.disableVertexAttribArray(i);}
 function attr(p,name,size,stride,offset){const n=gl.getAttribLocation(p,name);if(n<0)return;gl.enableVertexAttribArray(n);gl.vertexAttribPointer(n,size,gl.FLOAT,false,stride,offset);}
 function resize(){const dpr=Math.min(1,global.devicePixelRatio||1,Math.sqrt(1800000/Math.max(1,canvasRect.width*canvasRect.height))),w=Math.max(1,Math.round(canvasRect.width*dpr)),h=Math.max(1,Math.round(canvasRect.height*dpr));if(w===width&&h===height)return;width=w;height=h;canvas.width=w;canvas.height=h;for(const t of[environment,output]){gl.bindTexture(gl.TEXTURE_2D,t.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t.texture,0);if(t.depth){gl.bindRenderbuffer(gl.RENDERBUFFER,t.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,t.depth);}if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Scene framebuffer unavailable');}}
 function common(p,c,m,time){const u=uniforms(p);gl.uniform4f(u.uCamera,c.x,c.y,c.z,c.p||0);gl.uniform1f(u.uAngle,c.angle);gl.uniform2f(u.uViewport,width,height);gl.uniform1f(u.uDpr,width/Math.max(1,canvasRect.width));gl.uniform1f(u.uTime,time);gl.uniform1f(u.uScroll,Math.max(0,Math.min(1,Number.isFinite(c.normalized)?c.normalized:(c.p||0)/Math.max(1,(c.n||25)-1))));gl.uniform4f(u.uPointer,m.x||0,m.y||0,m.vx||0,m.vy||0);gl.uniform2f(u.uResolution,width,height);}
 function fullscreen(p,texture){resetAttributes();gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,quad);attr(p,'aPosition',2,8,0);if(texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(uniforms(p).uTexture,0);}gl.drawArrays(gl.TRIANGLES,0,6);}
 function render(camera,pointer,time){if(dead||lost)return false;const c=camera||lastCamera,m=pointer||{};lastCamera=c;phase=time||0;try{resize();}catch(e){cleanup();return false;}gl.viewport(0,0,width,height);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.BLEND);gl.bindFramebuffer(gl.FRAMEBUFFER,environment.fbo);gl.useProgram(bg);gl.uniform1f(uniforms(bg).uTime,phase);gl.uniform2f(uniforms(bg).uPointer,m.x||0,m.y||0);fullscreen(bg);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);resetAttributes();gl.useProgram(points);common(points,c,m,phase);gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);attr(points,'aPosition',3,32,0);attr(points,'aColor',4,32,12);attr(points,'aSize',1,32,28);gl.drawArrays(gl.POINTS,0,pointCount);
 gl.bindFramebuffer(gl.FRAMEBUFFER,output.fbo);gl.disable(gl.BLEND);fullscreen(copy,environment.texture);
 gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);resetAttributes();gl.useProgram(glass);common(glass,c,m,phase);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,environment.texture);gl.uniform1i(uniforms(glass).uEnvironment,0);gl.bindBuffer(gl.ARRAY_BUFFER,glassBuffer);attr(glass,'aPosition',3,40,0);attr(glass,'aNormal',3,40,12);attr(glass,'aTint',3,40,24);attr(glass,'aEdge',1,40,36);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,glassIndexBuffer);gl.drawElements(gl.TRIANGLES,triangleCount,gl.UNSIGNED_SHORT,0);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.BLEND);fullscreen(copy,output.texture);return true;}
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;scene.dataset.liveScene='lost';});canvas.addEventListener('webglcontextrestored',()=>{scene.dataset.liveScene='reload-required';});
 canvasRect=scene.getBoundingClientRect();observer=new ResizeObserver(entries=>{const r=entries[0]?.contentRect;if(r)canvasRect=r;});observer.observe(scene);scene.insertBefore(canvas,scene.firstChild);scene.dataset.liveScene='ready';
 return{gl,canvas,get texture(){return output.texture;},get width(){return width;},get height(){return height;},render,destroy:cleanup,particleCount:pointCount};
}
global.LiveChronologyScene={mount};
})(window);
