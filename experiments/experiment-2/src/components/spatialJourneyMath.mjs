export const SPATIAL_SPACING=8;
export function cameraPath(progress,distance=10){return[Math.sin(progress*.9)*3.5,Math.sin(progress*.7)*.3,distance-progress*SPATIAL_SPACING]}
export function platePosition(index){return{position:[2.2+Math.sin(index*.9)*3.5,.35+Math.sin(index*.7)*.3,-index*SPATIAL_SPACING],rotation:[0,-.085,Math.sin(index*.7)*.012]}}
export function visiblePlates(progress,length=20){const current=Math.round(progress);return[current-1,current,current+1,current+2].filter(i=>i>=0&&i<length&&i-progress>-.52)}
export function spatialEligible({desktop,reduced,memory=8,cores=8,saveData=false}){return Boolean(desktop&&!reduced&&!saveData&&memory>=4&&cores>=4)}
