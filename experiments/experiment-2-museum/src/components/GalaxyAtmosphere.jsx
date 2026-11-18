import {useRef} from 'react';
import Galaxy from '../vendor/Galaxy.jsx';
// A commemorative star field, not astronomical or historical coordinates.
export const MEMORIAL_STARS=['#bfd0e8','#8eabd5','#d8cbb2'];
export default function GalaxyAtmosphere({active,desktop,reduced}){
 const ref=useRef(null);
 const ready=()=>{if(ref.current)ref.current.dataset.engine='webgl'};
 const failed=()=>{if(ref.current)ref.current.dataset.engine='static'};
 return <div className="galaxy-atmosphere" ref={ref} data-engine="static" aria-hidden="true">
  <div className="galaxy-nebula"/>
  <div className="galaxy-static"/>
  {desktop&&!reduced&&<Galaxy className="memorial-galaxy" focal={[.5,.46]} rotation={[1,0]} starColors={MEMORIAL_STARS} layers={2} density={.7} glowIntensity={.2} starSize={.75} flareIntensity={.12} saturation={.4} starSpeed={0} speed={0} rotationSpeed={0} twinkleIntensity={0} mouseInteraction={false} mouseRepulsion={false} clickWarp={false} intro={false} disableAnimation={true} transparent={false} backgroundColor="#000000" opacity={1} active={active} dpr={1} maxPixels={600000} onReady={ready} onError={failed}/>}
  <div className="galaxy-reading-shade"/>
 </div>;
}
