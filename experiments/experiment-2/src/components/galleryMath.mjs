export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
// One continuous, reversible scroll route: approach, read, withdraw, orbit.
export function galleryRoute(value,length){const v=clamp(value,0,length-.001),base=Math.floor(v),phase=v-base;const orbit=base+(base<length-1?smooth((phase-.72)/.28):0);const focus=smooth(phase/.18)*(1-smooth((phase-.55)/.17));return{base,phase,orbit,focus,index:Math.min(length-1,Math.round(orbit))}}
export function galleryPose(index,orbit,focus=0,radius=760){const d=index-orbit,a=d*.91;const near=1-clamp(Math.abs(d)/.7);return{x:Math.sin(a)*radius-45*focus*near,y:d*142,z:(Math.cos(a)-1)*radius+160*focus*near,ry:-a*180/Math.PI,rz:-Math.sin(a)*2.3,opacity:clamp(1-Math.abs(d)*.25,.08,1)}}
export function galleryVisible(orbit,count){const mid=Math.round(orbit);return[mid-2,mid-1,mid,mid+1,mid+2].filter(i=>i>=0&&i<count)}
