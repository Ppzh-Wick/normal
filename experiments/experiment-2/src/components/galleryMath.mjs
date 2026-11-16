export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
// Main exhibition is continuous: a year occupies a full orbital step, not a forced reading stop.
export function galleryRoute(value,length,focus=0){const orbit=clamp(value,0,length-1);return{base:Math.floor(orbit),phase:orbit%1,orbit,focus:clamp(focus),index:Math.min(length-1,Math.round(orbit))}}
export function galleryPose(index,orbit,focus=0,radius=760,height=900){
 const d=index-orbit,a=d*1.08,near=1-clamp(Math.abs(d)/.72),front=Math.cos(a);
 return{x:Math.sin(a)*radius+Math.max(0,-d)*radius*.12-focus*near*radius*.03,y:d*height*(d<0?.14:.255)*(1-focus*near*.8),z:(front-1)*radius*.88+focus*near*radius*.46,ry:-a*180/Math.PI*(d<0?1.25:1)*(1-focus*near),rz:-Math.sin(a)*2.2,opacity:clamp(1-Math.abs(d)*.14,.18,1)};
}
// Seven real year plates, including the rear surfaces, remain in the orbit.
export function galleryVisible(orbit,count){const mid=Math.round(orbit);return Array.from({length:7},(_,i)=>mid+i-3).filter(i=>i>=0&&i<count)}
