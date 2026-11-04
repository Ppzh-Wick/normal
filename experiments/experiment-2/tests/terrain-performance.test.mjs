import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const output=await build({entryPoints:[new URL('../src/components/TerrainStage.jsx',import.meta.url).pathname],bundle:true,jsx:'automatic',platform:'node',format:'cjs',write:false,external:['react','react/jsx-runtime']});
function harness(){
 const slots=[],pending=[],frames=new Map(),events=new Map(),pointerEvents=new Map();let cursor=0,serial=0,expCalls=0,draws=0,points=[],styles=[];
 const ctx={clearRect(){draws++;points=[];styles=[]},fillRect(){},setTransform(){},beginPath(){},moveTo(x,y){points.push([x,y])},lineTo(x,y){points.push([x,y])},stroke(){styles.push(this.strokeStyle)},createRadialGradient(){return{addColorStop(){}}}};
 const canvas={width:0,height:0,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1400,height:900}),addEventListener:(k,v)=>pointerEvents.set(k,v),removeEventListener:k=>pointerEvents.delete(k)};
 const hooks={useRef(value){const i=cursor++;return slots[i]??=( {current:i===0?canvas:value})},useEffect(fn,deps){const i=cursor++,old=slots[i];if(!old||deps.some((v,j)=>v!==old.deps[j]))pending.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()}})}};
 const math=Object.create(Math);math.exp=x=>{expCalls++;return Math.exp(x)};
 const doc={hidden:false,addEventListener:(k,v)=>events.set(k,v),removeEventListener:k=>events.delete(k)};
 let observer;
 class ResizeObserver{constructor(fn){this.fn=fn;observer=this}observe(){}disconnect(){this.disconnected=true}}
 const mod={exports:{}};
 new Function('require','module','exports','Math','document','ResizeObserver','requestAnimationFrame','cancelAnimationFrame','devicePixelRatio',output.outputFiles[0].text)(id=>id==='react'?hooks:require(id),mod,mod.exports,math,doc,ResizeObserver,fn=>{frames.set(++serial,fn);return serial},id=>frames.delete(id),2);
 return {render(props){cursor=0;mod.exports.default(props);pending.splice(0).forEach(fn=>fn())},tick(time){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(time))},hide(hidden){doc.hidden=hidden;events.get('visibilitychange')?.()},resize(){observer.fn()},move(){pointerEvents.get('pointermove')?.({clientX:700,clientY:450})},unmount(){slots.forEach(s=>s?.cleanup?.())},get frames(){return frames.size},get draws(){return draws},get expCalls(){return expCalls},get points(){return points},get styles(){return styles},canvas};
}
test('terrain caches all height samples and preserves final projection / canvas budget',()=>{
 const h=harness();h.render({active:true,reduced:true});h.tick(0);
 assert.equal(h.expCalls,2*(72*138+18*80));assert.equal(h.points.length,72*138+18*80);assert.equal(h.styles.length,90);
 const x=-1.15,z=-1,y=Math.exp(-((x+.34)**2*3.6+(z-.08)**2*5.1))*.93+Math.exp(-((x-.52)**2*8+(z+.21)**2*7))*.64+Math.sin(x*9+z*3)*.035+Math.cos(z*11-x*4)*.025;
 assert.deepEqual(h.points[0],[1400*.54+(x+z*.29)*1400*.48,900*.76+z*900*.28-y*900*.38]);
 assert.ok(h.canvas.width*h.canvas.height<1803000,'rounding retains original 1.8M-pixel budget');
 h.resize();h.tick(100);assert.equal(h.expCalls,22752);assert.equal(h.frames,0);h.unmount();
});
test('inactive and hidden terrain pause, resume once, and never restart a completed reveal',()=>{
 const h=harness();h.render({active:true,reduced:false});h.tick(0);h.tick(1000);const partial=h.styles.length;
 h.render({active:false,reduced:false});assert.equal(h.frames,0);const before=h.draws;h.resize();h.move();h.tick(2000);assert.equal(h.draws,before);
 h.render({active:true,reduced:false});h.tick(9000);assert.equal(h.styles.length,partial,'inactive time does not advance reveal');
 h.hide(true);assert.equal(h.frames,0);h.resize();h.tick(10000);assert.equal(h.draws,before+1);
 h.hide(false);h.tick(11000);h.tick(16000);assert.equal(h.styles.length,90);assert.equal(h.frames,0);
 const finalStyles=[...h.styles];h.render({active:false,reduced:false});h.render({active:true,reduced:false});h.tick(17000);assert.deepEqual(h.styles,finalStyles);assert.equal(h.frames,0);
 const cached=h.expCalls;h.move();h.move();assert.equal(h.frames,1);h.tick(18000);assert.equal(h.expCalls,cached);h.unmount();assert.equal(h.frames,0);
});
