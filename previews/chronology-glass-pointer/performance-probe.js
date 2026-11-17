// Opt-in deterministic viewport benchmark. Absent unless ?bench=1.
if(new URLSearchParams(location.search).get('bench')==='1'){
 const box=document.createElement('aside');box.style.cssText='position:fixed;z-index:99999;bottom:12px;left:12px;padding:12px;background:#08121ff2;color:white;font:13px/1.6 monospace;border:1px solid #8ab9c9;max-width:430px';
 const btn=document.createElement('button');btn.textContent='开始 8 秒滚动性能测试';btn.style.cssText='background:#d3e8ef;color:#10232a;padding:8px;border:0;cursor:pointer';
 const out=document.createElement('pre');out.style.whiteSpace='pre-wrap';out.textContent='同视口、同年份比较；测试会往返滚动。';box.append(btn,out);document.body.append(box);
 btn.onclick=()=>{if(btn.disabled)return;btn.disabled=true;const samples=[],startY=scrollY,distance=innerHeight*.65;let started=0,prev=0,long=0;let obs;try{obs=new PerformanceObserver(list=>{long+=list.getEntries().length});obs.observe({type:'longtask',buffered:false})}catch{}
 function tick(now){if(!started){started=now;prev=now;}else samples.push(now-prev);prev=now;const elapsed=now-started;if(elapsed<8000){scrollTo(0,startY+distance*(1-Math.cos(elapsed/8000*Math.PI*2))*.5);out.textContent='运行中 '+(elapsed/1000).toFixed(1)+' 秒';requestAnimationFrame(tick);return;}
 scrollTo(0,startY);obs?.disconnect();samples.sort((a,b)=>a-b);const total=samples.reduce((a,b)=>a+b,0),result={frames:samples.length,meanFrameMs:+(total/samples.length).toFixed(2),p95FrameMs:+samples[Math.floor(samples.length*.95)].toFixed(2),over33ms:samples.filter(v=>v>33.4).length,longTasks:long,viewport:innerWidth+'x'+innerHeight,dpr:devicePixelRatio,svgGlass:document.querySelectorAll('.glass-surface--svg').length};out.textContent=JSON.stringify(result,null,2);out.dataset.benchmark=JSON.stringify(result);btn.disabled=false;}
 requestAnimationFrame(tick);
 };
}
