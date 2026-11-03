import {useEffect,useRef} from 'react';

// A mathematical landscape, not a reconstruction of any historical expedition.
// Canvas is decorative; the exhibition's meaning is provided in ordinary HTML.
export default function TerrainStage({active=true,reduced=false}) {
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current, ctx=canvas.getContext('2d');
    if(!ctx)return;
    let width=0,height=0,frame=0,start=performance.now(),pointer={x:0,y:0};
    const heightAt=(x,z)=> Math.exp(-((x+.34)**2*3.6+(z-.08)**2*5.1))*.93 + Math.exp(-((x-.52)**2*8+(z+.21)**2*7))*.64 + Math.sin(x*9+z*3)*.035 + Math.cos(z*11-x*4)*.025;
    const project=(x,y,z)=>{
      const turn=pointer.x*.035, xx=x*Math.cos(turn)-z*Math.sin(turn),zz=x*Math.sin(turn)+z*Math.cos(turn);
      return [width*.54+(xx+zz*.29)*width*.48, height*.76+zz*height*.28-y*height*.38+pointer.y*height*.012];
    };
    const draw=time=>{
      frame=0;ctx.clearRect(0,0,width,height);
      const elapsed=(time-start)/1000, arrival=reduced?1:Math.min(1,elapsed/3.8), light=active&&!reduced&&elapsed<4.6?Math.sin(elapsed*.75)*.06:0;
      const glow=ctx.createRadialGradient(width*.57,height*.64,0,width*.57,height*.64,width*.5);glow.addColorStop(0,'rgba(143,76,40,.16)');glow.addColorStop(.6,'rgba(117,75,51,.06)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
      for(let zi=0;zi<72;zi++){
        const z=-1+zi/71*2, reveal=Math.max(0,Math.min(1,arrival*2-zi/72)); if(!reveal)continue;
        ctx.beginPath();let first=true;
        for(let xi=0;xi<138;xi++){
          const x=-1.15+xi/137*2.3,y=heightAt(x,z),p=project(x,y,z);
          if(first){ctx.moveTo(...p);first=false}else ctx.lineTo(...p);
        }
        ctx.strokeStyle=`rgba(${185+Math.round(zi*.45)},${131+Math.round(zi*.33)},${89+Math.round(zi*.25)},${(.10+zi/72*.40+light)*reveal})`;ctx.lineWidth=zi%7===0?1.2:.65;ctx.stroke();
      }
      // Sparse vertical sections give the surface volume without simulating data.
      for(let xi=0;xi<18;xi++){
        const x=-1.15+xi/17*2.3;ctx.beginPath();
        for(let zi=0;zi<80;zi++){const z=-1+zi/79*2,p=project(x,heightAt(x,z),z);zi?ctx.lineTo(...p):ctx.moveTo(...p)}
        ctx.strokeStyle=`rgba(194,154,113,${.045*arrival})`;ctx.lineWidth=.6;ctx.stroke();
      }
      if(active&&!reduced&&elapsed<4.6)frame=requestAnimationFrame(draw);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw)};
    const resize=()=>{const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const ratio=Math.min(devicePixelRatio||1,1.7,Math.sqrt(1800000/Math.max(1,width*height)));canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);schedule()};
    const move=e=>{if(reduced||!active)return;const r=canvas.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5};schedule()};
    const observer=new ResizeObserver(resize);observer.observe(canvas);canvas.addEventListener('pointermove',move);resize();
    return()=>{observer.disconnect();canvas.removeEventListener('pointermove',move);cancelAnimationFrame(frame)};
  },[active,reduced]);
  return <canvas className="terrain-stage" ref={ref} aria-hidden="true"/>;
}
