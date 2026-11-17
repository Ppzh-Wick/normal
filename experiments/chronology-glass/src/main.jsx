import React from 'react';
import {createRoot} from 'react-dom/client';
import GlassSurface from './vendor/GlassSurface.jsx';
import './scene-glass.css';

// A presentation-only island. Original chronology owns its content, controls,
// transforms and scrolling; this component never writes their state or styles.
const mounted=new Map();
function scan(){
 for(const [plate,{root,host}] of mounted)if(!plate.isConnected){root.unmount();host.remove();mounted.delete(plate);}
 for(const plate of document.querySelectorAll('.tl-plate')){
  if(mounted.has(plate))continue;
  const host=document.createElement('span');host.className='react-bits-glass-layer';host.setAttribute('aria-hidden','true');host.dataset.component='ReactBits/GlassSurface';
  plate.prepend(host);const root=createRoot(host);mounted.set(plate,{root,host});
  root.render(<GlassSurface width="100%" height="100%" borderRadius={26} borderWidth={0.14}
    brightness={50} opacity={0.94} blur={10} displace={0.65} backgroundOpacity={0.08}
    saturation={1.25} distortionScale={-92} redOffset={0} greenOffset={8} blueOffset={18}
    className="chronology-liquid-glass" />);
 }
}
let frame=0;
const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;scan()})};
const observer=new MutationObserver(schedule);observer.observe(document.getElementById('root'),{childList:true,subtree:true});scan();
