/* Independent camera implementation. Mathematical reference: WorkItems in
   Abdulhadi446/activetheory.net, blob 1d5400fe9069db12190154e7c04c002cb32bbbd1.
   No original runtime, shaders, geometry, media or fonts are copied here. */
(function(global){
 'use strict';
 const R=3.8, STEP=50*Math.PI/180;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
 function raw(t){if(t<=0)return 0;if(t>=1)return 1;let a=0,b=1;for(let k=0;k<40;k++){const m=(a+b)/2;if(smooth(0,1,m)<t)a=m;else b=m;}return .06+.88*(a+b)/2;}
 function target(p,n,sourceRaw){const i=Math.min(n-1,Math.floor(p)),j=Math.min(n-1,i+1),t=p-i,a=-i*STEP,b=-j*STEP,dy=.12*Math.min(7,n),u=Number.isFinite(sourceRaw)?sourceRaw:raw(p/Math.max(1,n-1));return {x:2*R*((1-t)*Math.cos(a)+t*Math.cos(b)),z:2*R*((1-t)*Math.sin(a)+t*Math.sin(b)),y:-dy*p-smooth(0,.15,u)+smooth(1,.85,u),angle:(1-t)*a+t*b};}
 // All target quaternions are yaw-only. Linear interpolation of their unwrapped
 // angle is exactly shortest-arc quaternion SLERP between adjacent 50° targets.
 function project(i,c,n){const a=-i*STEP,dx=R*Math.cos(a)-c.x,dz=R*Math.sin(a)-c.z;return {x:Math.sin(c.angle)*dx-Math.cos(c.angle)*dz,y:-(-.12*Math.min(7,n)*i-c.y),z:Math.cos(c.angle)*dx+Math.sin(c.angle)*dz-2,rotation:c.angle-a};}
 const states=new WeakMap();
 function render(scene,plates,p,n,w,h,reduced){const next=target(p,n,global.ChronologyCamera.rawProgress);let s=states.get(scene);if(!s){s={camera:{...next},last:0,frame:0};states.set(scene,s);}Object.assign(s,{scene,plates,p,n,w,h,reduced,target:next});
  if(reduced){s.camera={...s.target};paint(s);return;}
  if(!s.frame)s.frame=requestAnimationFrame(now=>tick(s,now));
 }
 function paint(s){const {scene,plates,camera:c,n,w,h,p}=s;
  // Recovered Work UIL: vertical FOV 35deg, local camera Z +2,
  // pane scale 4 x 2.6. Original binary mesh bounds are unavailable.
  // Our independent plane uses recording-calibrated .78-unit extents.
  const focal=h/(2*Math.tan(35*Math.PI/360)),unit=focal/(R+2);
  const bounds=.78*Math.min(1,(w/h)/(16/9));
  scene.style.setProperty('--tl-perspective',focal+'px');
  scene.style.setProperty('--tl-plate-width',(4*bounds*unit)+'px');
  scene.style.setProperty('--tl-plate-height',(2.6*bounds*unit)+'px');
  scene.__chronologyCamera={...c,p,n,w,h};
  scene.dataset.camera=JSON.stringify({p:+p.toFixed(4),...c});
  for(const [i,plate] of plates){const q=project(i,c,n),distance=Math.abs(i-p),facing=Math.cos(q.rotation);
   const visible=distance<2.6&&facing>-.12&&q.z<-.3;
   plate.style.visibility=visible?'visible':'hidden';if(!visible)continue;
   plate.style.transform=`translate3d(${q.x*unit}px,${q.y*unit}px,${(q.z+R+2)*unit}px) rotateY(${q.rotation*180/Math.PI}deg)`;
   plate.style.opacity='1';plate.style.pointerEvents=distance<1.35?'auto':'none';
  }
 }
 function tick(s,now){s.frame=0;if(!s.scene.isConnected||document.hidden)return;const dt=s.last?Math.min(64,now-s.last):1000/60;s.last=now;const a=1-Math.pow(.8,dt/(1000/60));let error=0;for(const k of ['x','y','z','angle']){let d=s.target[k]-s.camera[k];if(k==='angle')d=Math.atan2(Math.sin(d),Math.cos(d));error+=Math.abs(d);s.camera[k]+=d*a;}if(error<.00003){s.camera={...s.target};s.last=0;}paint(s);if(error>=.00003)s.frame=requestAnimationFrame(t=>tick(s,t));}
 global.ChronologyCamera={render,smooth,raw,target,project,mapScroll(v,n){this.rawProgress=v;return n*smooth(.06,.94,v)},selectRaw(v){return this.rawProgress=raw(v)},constants:{radius:R,step:STEP}};
 if(typeof module!=='undefined')module.exports=global.ChronologyCamera;
})(typeof window==='undefined'?globalThis:window);
