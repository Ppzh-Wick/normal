/* Independently implemented screen-space glass. One shared scene texture,
   no framebuffer feedback, no image readback, DOM text remains readable. */
(function(){
 'use strict';
 const instances=new WeakMap();
 const lightCoord=(el,name)=>{const n=parseFloat(el?.style.getPropertyValue(name));return Number.isFinite(n)?n/100:.5;};
 const VS=`attribute vec4 aPosition;attribute vec2 aUV;varying vec2 vUV;void main(){vUV=aUV;gl_Position=aPosition;}`;
 const FS=`precision highp float;
 varying vec2 vUV;uniform sampler2D uScene;uniform sampler2D uImage;
 uniform vec2 uResolution,uImageScale,uImageOffset,uPointer;uniform vec4 uImageRect;uniform float uHover,uTime,uAspect,uHasImage;
 float roundBox(vec2 uv){vec2 p=abs((uv-.5)*vec2(uAspect,1.))-(vec2(uAspect,1.)*.5-.035);return length(max(p,0.))+min(max(p.x,p.y),0.)-.035;}
 void main(){float edge=roundBox(vUV);if(edge>0.)discard;
 vec2 uv=gl_FragCoord.xy/uResolution;
 vec2 d=(vUV-uPointer)*vec2(uAspect,1.);float hand=exp(-dot(d,d)*10.)*uHover;
 vec2 grain=vec2(sin(vUV.y*24.+uTime*.18)+sin(vUV.x*13.-uTime*.12),cos(vUV.x*21.-uTime*.15)+sin(vUV.y*11.+uTime*.09));
 float rim=1.-smoothstep(0.,.018,-edge);float broadRim=1.-smoothstep(0.,.085,-edge);
 vec2 outward=normalize((vUV-.5)*vec2(uAspect,1.)+vec2(.0001));
 vec2 refractUV=uv+grain*.0015+outward*broadRim*.009+d*hand*.017;
 vec2 pixel=1./uResolution;
 vec3 scene=texture2D(uScene,clamp(refractUV,vec2(.001),vec2(.999))).rgb*.52;
 scene+=texture2D(uScene,clamp(refractUV+pixel*vec2(2.,0.),vec2(.001),vec2(.999))).rgb*.16;
 scene+=texture2D(uScene,clamp(refractUV-pixel*vec2(2.,0.),vec2(.001),vec2(.999))).rgb*.16;
 scene+=texture2D(uScene,clamp(refractUV+pixel*vec2(0.,2.),vec2(.001),vec2(.999))).rgb*.16;
 vec2 frameUV=(vUV-uImageRect.xy)/uImageRect.zw;
 vec2 imageUV=frameUV*uImageScale+uImageOffset;
 float artMask=step(0.,frameUV.x)*step(0.,frameUV.y)*step(frameUV.x,1.)*step(frameUV.y,1.)*step(0.,imageUV.x)*step(0.,imageUV.y)*step(imageUV.x,1.)*step(imageUV.y,1.);
 vec3 art=texture2D(uImage,clamp(imageUV,0.,1.)).rgb;
 vec3 colour=mix(scene*.84+vec3(.025,.035,.04),art,.63*uHasImage*artMask);
 colour=mix(colour,scene,.18*hand);
 vec3 sheen=mix(vec3(.12,.30,.32),vec3(.35,.20,.32),smoothstep(.1,.9,vUV.x+grain.x*.1));
 colour+=sheen*(.035+hand*.18)+rim*vec3(.38,.44,.43)*(.42+.4*hand);
 colour+=broadRim*vec3(.045,.055,.065);
 gl_FragColor=vec4(colour,1.-smoothstep(-.002,0.,edge));
 }`;
 function makeProgram(gl){function shader(kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}const vs=shader(gl.VERTEX_SHADER,VS),fs=shader(gl.FRAGMENT_SHADER,FS),p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
 function mount(scene){if(instances.has(scene)||innerWidth<900)return;instances.set(scene,true);let renderer;
 try{renderer=window.LiveChronologyScene?.mount(scene);if(!renderer){scene.dataset.liveMaterial='fallback';return;}}catch(e){scene.dataset.liveMaterial='fallback';console.warn('Live scene unavailable:',e);return;}
 const gl=renderer.gl;let program;try{program=makeProgram(gl);}catch(e){renderer.destroy();scene.dataset.liveMaterial='fallback';console.warn('Glass shader unavailable:',e);return;}
 const buffer=gl.createBuffer(),attrib={position:gl.getAttribLocation(program,'aPosition'),uv:gl.getAttribLocation(program,'aUV')};
 const uniforms=Object.fromEntries(['uScene','uImage','uResolution','uImageScale','uImageOffset','uImageRect','uPointer','uHover','uTime','uAspect','uHasImage'].map(x=>[x,gl.getUniformLocation(program,x)]));
 const textures=new Map();let raf=0,visible=true,last=0,paintAt=0,lastCamera='',hover=0,dead=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const pointer={x:0,y:0,vx:0,vy:0},target={x:0,y:0},localPointer={x:.5,y:.5};let hot=null;
 const fallbackTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,fallbackTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([40,48,51,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 function textureFor(img){if(!img?.complete||!img.naturalWidth)return null;const key=img.currentSrc||img.src;if(textures.has(key))return textures.get(key);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);}catch{gl.deleteTexture(t);return null;}gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textures.set(key,t);return t;}
 function mouse(e){const r=scene.getBoundingClientRect();target.x=(e.clientX-r.left)/r.width*2-1;target.y=1-(e.clientY-r.top)/r.height*2;hot=scene.querySelector('.tl-plate[data-reflecting="true"]');if(hot){const glass=hot.querySelector('.tl-glass');localPointer.x=lightCoord(glass,'--light-x');localPointer.y=1-lightCoord(glass,'--light-y');}}
 function leave(){hot=null;pointer.vx=pointer.vy=0;}
 scene.addEventListener('pointermove',mouse,{passive:true});scene.addEventListener('pointerleave',leave,{passive:true});
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!raf&&!dead)raf=requestAnimationFrame(tick);},{threshold:.01});observer.observe(scene);
 function dispose(){if(dead)return;dead=true;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);scene.removeEventListener('pointermove',mouse);scene.removeEventListener('pointerleave',leave);textures.forEach(t=>gl.deleteTexture(t));gl.deleteTexture(fallbackTexture);gl.deleteBuffer(buffer);gl.deleteProgram(program);renderer.destroy();scene.dataset.liveMaterial='fallback';}
 function drawCards(camera,now){const w=scene.clientWidth,h=scene.clientHeight,f=h/(2*Math.tan(35*Math.PI/360)),unit=f/5.8;
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,renderer.width,renderer.height);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(attrib.position);gl.vertexAttribPointer(attrib.position,4,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(attrib.uv);gl.vertexAttribPointer(attrib.uv,2,gl.FLOAT,false,24,16);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,renderer.texture);gl.uniform1i(uniforms.uScene,0);gl.uniform2f(uniforms.uResolution,renderer.width,renderer.height);gl.uniform1f(uniforms.uTime,now/1000);
 const panels=[...scene.querySelectorAll('.tl-plate')].filter(p=>p.style.visibility!=='hidden').map(plate=>({plate,q:window.ChronologyCamera.project(Number(plate.dataset.index),camera,camera.n)})).sort((a,b)=>a.q.z-b.q.z);
 for(const {plate,q}of panels){const pw=plate.offsetWidth,ph=plate.offsetHeight,r=q.rotation,verts=[];
  for(const [u,v]of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){const x=(u-.5)*pw,y=(.5-v)*ph,X=q.x*unit+x*Math.cos(r),Y=q.y*unit+y,Z=(q.z+5.8)*unit-x*Math.sin(r);verts.push(2*X/w,-2*Y/h,0,1-Z/f,u,v);}
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
  const img=plate.querySelector('img'),tex=textureFor(img),ratio=pw/ph,ar=img?.naturalWidth/img?.naturalHeight;
  const iw=img?.offsetWidth||pw,ih=img?.offsetHeight||ph,boxRatio=iw/ih;let sx=1,sy=1;
  const contain=plate.dataset.portrait==='true'||plate.dataset.fit==='contain';
  if(contain){if(ar>boxRatio)sy=ar/boxRatio;else if(ar>0)sx=boxRatio/ar;}else{if(ar>boxRatio)sx=boxRatio/ar;else if(ar>0)sy=ar/boxRatio;}
  gl.uniform4f(uniforms.uImageRect,(img?.offsetLeft||0)/pw,1-((img?.offsetTop||0)+ih)/ph,iw/pw,ih/ph);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tex||fallbackTexture);gl.uniform1i(uniforms.uImage,1);gl.uniform2f(uniforms.uImageScale,sx,sy);gl.uniform2f(uniforms.uImageOffset,(1-sx)*.5,(1-sy)*.5);gl.uniform1f(uniforms.uHasImage,tex?1:0);gl.uniform1f(uniforms.uAspect,ratio);gl.uniform2f(uniforms.uPointer,localPointer.x,localPointer.y);gl.uniform1f(uniforms.uHover,hot===plate?hover:0);gl.drawArrays(gl.TRIANGLES,0,6);
 }
 }
 function tick(now){raf=0;if(dead)return;if(!scene.isConnected){dispose();return;}if(!visible||document.hidden){last=0;return;}const dt=last?Math.min(100,now-last):16.667;last=now;const a=1-Math.pow(.92,dt/16.667),dx=target.x-pointer.x,dy=target.y-pointer.y;pointer.vx=dx;pointer.vy=dy;pointer.x+=dx*a;pointer.y+=dy*a;hover+=(hot?1-hover:-hover)*a;
 hot=scene.querySelector('.tl-plate[data-reflecting="true"]');if(hot){const g=hot.querySelector('.tl-glass');localPointer.x=lightCoord(g,'--light-x');localPointer.y=1-lightCoord(g,'--light-y');}
 const camera=scene.__chronologyCamera;if(camera){const key=JSON.stringify(camera);const moving=key!==lastCamera;lastCamera=key;
  if(moving||now-paintAt>=(reduced.matches?160:33)){paintAt=now;try{if(renderer.render(camera,pointer,reduced.matches?0:now)===false)throw Error('Scene renderer unavailable');drawCards(camera,reduced.matches?0:now);scene.dataset.liveMaterial='ready';}catch(e){console.warn('Live material fallback:',e);dispose();return;}}
 }
 raf=requestAnimationFrame(tick);
 }
 const onVisibility=()=>{if(!document.hidden&&visible&&!raf&&!dead)raf=requestAnimationFrame(tick);};
 renderer.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();dispose();},{once:true});document.addEventListener('visibilitychange',onVisibility);raf=requestAnimationFrame(tick);
 }
 const scan=()=>document.querySelectorAll('.tl-scene').forEach(mount);new MutationObserver(scan).observe(document.getElementById('root'),{subtree:true,childList:true});scan();
})();
