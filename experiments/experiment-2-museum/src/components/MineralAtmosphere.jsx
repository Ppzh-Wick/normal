import {useRef} from 'react';
import Grainient from '../vendor/Grainient.jsx';
// Mineral colors frame the archive; this is an abstract material, not a map.
export const MINERAL_COLORS=['#080f25','#132e58','#3e617d','#75463d','#ca9876'];
export default function MineralAtmosphere({active,desktop,reduced}){
 const ref=useRef(null);
 const eligible=desktop&&!reduced;
 const ready=()=>{if(ref.current)ref.current.dataset.engine='webgl'};
 const failed=()=>{if(ref.current)ref.current.dataset.engine='static'};
 return <div className="mineral-atmosphere" aria-hidden="true" ref={ref} data-engine="static">
  <div className="mineral-atmosphere-fallback"/>
  {eligible&&<Grainient className="mineral-grainient" colors={MINERAL_COLORS} type="linear" angle={118} bands={1} flow={1.15} scale={1.35} softness={1} silk={.14} grainAmount={.045} grainSize={1.2} contrast={1.03} saturation={.86} variation={3} speed={0} grainAnimated={false} interactive={false} clickSwirl={false} intro={false} active={active} dpr={1} maxPixels={600000} onReady={ready} onError={failed}/>}
  <div className="mineral-atmosphere-veil"/>
 </div>;
}
