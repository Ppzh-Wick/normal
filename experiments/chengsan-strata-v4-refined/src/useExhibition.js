import {flushSync} from 'react-dom';
import {useCallback,useEffect,useRef,useState} from 'react';
export function useMedia(query){const [value,set]=useState(()=>matchMedia(query).matches);useEffect(()=>{const m=matchMedia(query),change=()=>set(m.matches);m.addEventListener('change',change);return()=>m.removeEventListener('change',change)},[query]);return value;}
export default function useExhibition(ids){
 const desktop=useMedia('(min-width:1000px)'), reduced=useMedia('(prefers-reduced-motion:reduce)');
 const [active,setActive]=useState(0),[guided,setGuided]=useState(true),[long,setLong]=useState(false);
 const index=useRef(0),locked=useRef(0),wheel=useRef({sum:0,last:0}),mode=useRef(true),transitionRef=useRef(null),navigationGeneration=useRef(0);
 mode.current=guided&&desktop;
 const derive=useCallback(()=>{const nodes=ids.map(id=>document.getElementById(id));let i=0;nodes.forEach((n,j)=>{if(n&&n.getBoundingClientRect().top<Math.min(innerHeight*.3,220))i=j});return i},[ids]);
 const go=useCallback((i,{historyMode='replace',instant=false}={})=>{
   i=Math.max(0,Math.min(ids.length-1,i));
   const el=document.getElementById(ids[i]);if(!el)return;
   const generation=++navigationGeneration.current;
   const previous=index.current;
   index.current=i;
   transitionRef.current?.skipTransition();
   locked.current=performance.now()+950;wheel.current.sum=0;
   const update=()=>{
     if(generation!==navigationGeneration.current)return;
     index.current=i;setActive(i);setLong(el.offsetHeight>innerHeight+100);
     if(historyMode&&location.hash.split('?')[0]!=='#'+ids[i])history[historyMode==='push'?'pushState':'replaceState'](null,'','#'+ids[i]);
     el.scrollIntoView({behavior:'instant',block:'start'});
   };
   if(!instant&&!reduced&&mode.current&&previous!==i&&document.startViewTransition){
     document.documentElement.dataset.transitionKind='chapter';
     document.documentElement.dataset.navDirection=i>previous?'forward':'back';
     try{const transition=document.startViewTransition(()=>flushSync(update));transitionRef.current=transition;transition.finished.catch(()=>{}).finally(()=>{if(transitionRef.current===transition)transitionRef.current=null});return transition.updateCallbackDone;}catch{update();}
   }else if(instant||reduced){update();}
   else{
     index.current=i;setActive(i);setLong(el.offsetHeight>innerHeight+100);
     if(historyMode&&location.hash.split('?')[0]!=='#'+ids[i])history[historyMode==='push'?'pushState':'replaceState'](null,'','#'+ids[i]);
     el.scrollIntoView({behavior:'smooth',block:'start'});
   }
 },[ids,reduced]);

 useEffect(()=>{const sync=()=>{if(performance.now()<locked.current)return;const i=derive();index.current=i;setActive(i);const e=document.getElementById(ids[i]);setLong(e?.offsetHeight>innerHeight+100)};const onWheel=e=>{if(!mode.current||e.ctrlKey||e.metaKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.target.closest('[data-scroll-lock],dialog,input,textarea,select')||document.querySelector('dialog:modal'))return;const now=performance.now();if(now<locked.current){e.preventDefault();locked.current=Math.max(locked.current,now+140);return;}const i=derive(),r=document.getElementById(ids[i]).getBoundingClientRect(),d=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);if(!d)return;if(r.height>innerHeight+100&&((d>0&&r.bottom>innerHeight+5)||(d<0&&r.top<-5))){e.preventDefault();window.scrollBy({top:d>0?Math.min(d,r.bottom-innerHeight):Math.max(d,r.top),behavior:'instant'});wheel.current.last=now;wheel.current.sum=0;wheel.current.reading=true;return;}if(wheel.current.reading&&now-wheel.current.last<220){e.preventDefault();wheel.current.last=now;return;}wheel.current.reading=false;if((d<0&&i===0)||(d>0&&i===ids.length-1))return;e.preventDefault();if(now-wheel.current.last>220||Math.sign(wheel.current.sum)!==Math.sign(d))wheel.current.sum=0;wheel.current.last=now;wheel.current.sum+=d;if(Math.abs(wheel.current.sum)>=35)go(i+Math.sign(d));};
 const key=e=>{if(!mode.current||document.querySelector('dialog:modal'))return;if(e.key==='Escape'){setGuided(false);return;}if(e.target.closest('dialog,input,textarea,select,button,a,svg,[data-scroll-lock]'))return;const direction={PageDown:1,ArrowDown:1,PageUp:-1,ArrowUp:-1}[e.key];if(direction){if(e.repeat||performance.now()<locked.current){e.preventDefault();return;}const i=derive(),r=document.getElementById(ids[i]).getBoundingClientRect();if(r.height>innerHeight+100&&((direction>0&&r.bottom>innerHeight+5)||(direction<0&&r.top<-5)))return;e.preventDefault();go(i+direction)}};
 const restore=()=>{const i=ids.indexOf(location.hash.slice(1).split('?')[0]);if(i>=0)go(i,{historyMode:false,instant:true});};
 const sizeObserver=new ResizeObserver(()=>{const el=document.getElementById(ids[index.current]);setLong(el?.offsetHeight>innerHeight+100)});ids.forEach(id=>{const el=document.getElementById(id);if(el)sizeObserver.observe(el)});window.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',sync);window.addEventListener('wheel',onWheel,{passive:false});window.addEventListener('keydown',key);window.addEventListener('popstate',restore);restore();document.fonts.ready.then(sync);return()=>{sizeObserver.disconnect();window.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);window.removeEventListener('wheel',onWheel);window.removeEventListener('keydown',key);window.removeEventListener('popstate',restore)};
 },[ids,derive,go]);
 return {active,guided:guided&&desktop,setGuided,go,reduced,desktop,long};
}
