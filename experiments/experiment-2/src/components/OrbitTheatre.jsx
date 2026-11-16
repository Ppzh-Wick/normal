import React from 'react';
import {RINGS,ORBIT_TILT} from './relationHierarchy.mjs';

// Static SVG lighting, not a simulated solar system or a claim about influence.
// No canvas, frame loop, pointer tracker or additional animation dependency.
export function OrbitLightDefs({uid}){
 return <defs>
  <radialGradient id={`${uid}-star-light`}><stop stopColor="#f7dfb7" stopOpacity=".22"/><stop offset=".42" stopColor="#e6c69b" stopOpacity=".09"/><stop offset="1" stopColor="#a4badc" stopOpacity="0"/></radialGradient>
  <radialGradient id={`${uid}-star-corona`}><stop offset=".55" stopColor="#fff1d1" stopOpacity="0"/><stop offset=".73" stopColor="#eed6b0" stopOpacity=".26"/><stop offset=".88" stopColor="#c5d8ef" stopOpacity=".06"/><stop offset="1" stopColor="#c5d8ef" stopOpacity="0"/></radialGradient>
  <radialGradient id={`${uid}-sphere-light`} cx="28%" cy="20%" r="86%"><stop stopColor="#ffffff" stopOpacity=".2"/><stop offset=".36" stopColor="#ffffff" stopOpacity="0"/><stop offset=".7" stopColor="#071021" stopOpacity=".02"/><stop offset="1" stopColor="#020614" stopOpacity=".35"/></radialGradient>
  <radialGradient id={`${uid}-planet-shadow`}><stop stopColor="#010510" stopOpacity=".65"/><stop offset="1" stopColor="#010510" stopOpacity="0"/></radialGradient>
  <linearGradient id={`${uid}-orbit-near`} x1="0%" y1="0%" x2="100%" y2="0%"><stop stopColor="#71829f" stopOpacity=".16"/><stop offset=".35" stopColor="#bccfe5" stopOpacity=".7"/><stop offset=".65" stopColor="#ead7b5" stopOpacity=".82"/><stop offset="1" stopColor="#71829f" stopOpacity=".14"/></linearGradient>
  <linearGradient id={`${uid}-orbit-far`} x1="0%" y1="0%" x2="100%" y2="0%"><stop stopColor="#8aa2c5" stopOpacity=".22"/><stop offset=".5" stopColor="#718bb4" stopOpacity=".28"/><stop offset="1" stopColor="#8aa2c5" stopOpacity=".18"/></linearGradient>
 </defs>;
}
export const OrbitTheatre=React.memo(function OrbitTheatre({uid,compact}){
 const rings=RINGS[compact?'compact':'full'];
 return <g className="atlas-orbit-theatre" aria-hidden="true" pointerEvents="none">
  <ellipse className="atlas-star-ground" cx="620" cy="257" rx="144" ry="38" fill={`url(#${uid}-planet-shadow)`}/>
  <ellipse cx="620" cy="205" rx="190" ry="132" fill={`url(#${uid}-star-light)`}/>
  {[['2',rings.people],['3',rings.other]].map(([tier,{rx,ry}])=><g key={tier} className={`atlas-orbit-plane tier-${tier}`} transform={`rotate(${ORBIT_TILT} 620 205)`}>
   <ellipse className="atlas-orbit-measure" data-tier-ring={tier} data-orbit-angle={ORBIT_TILT} cx="620" cy="205" rx={rx} ry={ry}/>
   <path className="atlas-orbit-back" d={`M${620-rx} 205 A${rx} ${ry} 0 0 1 ${620+rx} 205`} stroke={`url(#${uid}-orbit-far)`}/>
   <path className="atlas-orbit-front-bed" d={`M${620-rx} 207 A${rx} ${ry} 0 0 0 ${620+rx} 207`}/>
   <path className="atlas-orbit-front" d={`M${620-rx} 205 A${rx} ${ry} 0 0 0 ${620+rx} 205`} stroke={`url(#${uid}-orbit-near)`}/>
   <path className="atlas-orbit-front-rim" d={`M${620-rx} 204 A${rx} ${ry-3} 0 0 0 ${620+rx} 204`} stroke={`url(#${uid}-orbit-near)`}/>
  </g>)}
 </g>;
});
