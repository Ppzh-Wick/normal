import {useEffect,useRef} from 'react';

// The surface is invariant. Share its samples instead of evaluating exponentials
// and trigonometry for every point on every animation/pointer frame.
let terrainGeometry;
function getTerrainGeometry(){
  if(terrainGeometry)return terrainGeometry;
  const heightAt=(x,z)=>Math.exp(-((x+.34)**2*3.6+(z-.08)**2*5.1))*.93+Math.exp(-((x-.52)**2*8+(z+.21)**2*7))*.64+Math.sin(x*9+z*3)*.035+Math.cos(z*11-x*4)*.025;
  const sample=(count,point)=>{const values=new Float64Array(count*3);for(let i=0;i<count;i++){const[x,z]=point(i);values.set([x,heightAt(x,z),z],i*3)}return values};
  terrainGeometry={
    rows:Array.from({length:72},(_,zi)=>sample(138,xi=>[-1.15+xi/137*2.3,-1+zi/71*2])),
    columns:Array.from({length:18},(_,xi)=>sample(80,zi=>[-1.15+xi/17*2.3,-1+zi/79*2]))
  };
  return terrainGeometry;
}

// A mathematical landscape, not a reconstruction of any historical expedition.
// Canvas is decorative; the exhibition's meaning is provided in ordinary HTML.
export default function TerrainStage({active=true,reduced=false}) {
  const ref=useRef(null),controller=useRef(null);
  useEffect(()=>{
    const canvas=ref.current,ctx=canvas.getContext('2d');
    if(!ctx)return;
    const geometry=getTerrainGeometry();
    let width=0,height=0,frame=0,elapsed=0,lastTick=null,visible=active,motionReduced=reduced;
    let pointer={x:0,y:0},needsResize=true,glow;
    const canDraw=()=>visible&&!document.hidden;
    const schedule=()=>{if(canDraw()&&!frame)frame=requestAnimationFrame(draw)};
    const pause=()=>{cancelAnimationFrame(frame);frame=0;lastTick=null};
    const draw=time=>{
      frame=0;
      if(!canDraw())return;
      if(needsResize){
        const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
        if(!width||!height)return;
        const ratio=Math.min(devicePixelRatio||1,1.7,Math.sqrt(1800000/Math.max(1,width*height)));
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
        glow=ctx.createRadialGradient(width*.57,height*.64,0,width*.57,height*.64,width*.5);
        glow.addColorStop(0,'rgba(143,76,40,.16)');glow.addColorStop(.6,'rgba(117,75,51,.06)');glow.addColorStop(1,'rgba(0,0,0,0)');
        needsResize=false;
      }
      if(motionReduced)elapsed=4.6;
      else if(lastTick!==null)elapsed=Math.min(4.6,elapsed+Math.max(0,time-lastTick)/1000);
      lastTick=time;
      const arrival=motionReduced?1:Math.min(1,elapsed/3.8),light=!motionReduced&&elapsed<4.6?Math.sin(elapsed*.75)*.06:0;
      const turn=pointer.x*.035,cos=Math.cos(turn),sin=Math.sin(turn);
      // Only two rotation trig calls per frame; no per-point temporary arrays.
      const strokePoints=points=>{
        ctx.beginPath();
        for(let i=0;i<points.length;i+=3){
          const x=points[i],y=points[i+1],z=points[i+2],xx=x*cos-z*sin,zz=x*sin+z*cos;
          const px=width*.54+(xx+zz*.29)*width*.48,py=height*.76+zz*height*.28-y*height*.38+pointer.y*height*.012;
          if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
      };
      ctx.clearRect(0,0,width,height);ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
      geometry.rows.forEach((points,zi)=>{
        const reveal=Math.max(0,Math.min(1,arrival*2-zi/72));if(!reveal)return;
        strokePoints(points);
        ctx.strokeStyle=`rgba(${185+Math.round(zi*.45)},${131+Math.round(zi*.33)},${89+Math.round(zi*.25)},${(.10+zi/72*.40+light)*reveal})`;ctx.lineWidth=zi%7===0?1.2:.65;ctx.stroke();
      });
      // Sparse vertical sections give the surface volume without simulating data.
      geometry.columns.forEach(points=>{strokePoints(points);ctx.strokeStyle=`rgba(194,154,113,${.045*arrival})`;ctx.lineWidth=.6;ctx.stroke()});
      if(!motionReduced&&elapsed<4.6)schedule();
    };
    const resize=()=>{needsResize=true;schedule()};
    const move=e=>{if(motionReduced||!canDraw())return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;pointer={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5};schedule()};
    const visibility=()=>{if(document.hidden)pause();else schedule()};
    controller.current={update(nextActive,nextReduced){visible=nextActive;motionReduced=nextReduced;if(!canDraw())pause();else schedule()}};
    const observer=new ResizeObserver(resize);observer.observe(canvas);canvas.addEventListener('pointermove',move);document.addEventListener('visibilitychange',visibility);schedule();
    return()=>{controller.current=null;observer.disconnect();canvas.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',visibility);pause()};
  },[]);
  useEffect(()=>{controller.current?.update(active,reduced)},[active,reduced]);
  return <canvas className="terrain-stage" ref={ref} aria-hidden="true"/>;
}
