// Display hierarchy only: sizes do not rank influence or historical importance.
export const HIERARCHY = Object.freeze({
 overview: {center:{radius:52,halo:62,aura:75},person:{radius:30,halo:36},entity:{radius:17,halo:23}},
 category: {center:{radius:64,halo:76},person:{radius:39,halo:47},entity:{radius:22,halo:30}},
});
export const nodeTier = node => node.category === 'people' ? 2 : 3;
export const nodeGeometry = (node, overview=true) => HIERARCHY[overview?'overview':'category'][nodeTier(node)===2?'person':'entity'];
// Interleave the five outer people with smaller records to avoid crowded faces.
const OUTER_SLOTS=[0,3,6,9,12,1,2,4,5,7,8,10,11,13,14,15];
export function radialSlot(i, compact=false){
 const inner=i<8,slot=inner?i:OUTER_SLOTS[i-8];
 const angle=-Math.PI/2+(inner?slot*Math.PI/4:slot*Math.PI/8+Math.PI/16);
 return [620+Math.cos(angle)*(compact?(inner?180:360):(inner?290:500)),205+Math.sin(angle)*(compact?(inner?156:220):(inner?154:185))];
}
export function overviewNameLines(node,index){
 const label=node.id==='tectonics-textbook'?'构造地质教材':node.name;
 if(node.id==='chengdu')return ['成都地质','勘探学院'];
 const width=index>=8?4:7;
 return Array.from({length:Math.ceil(label.length/width)},(_,i)=>label.slice(i*width,(i+1)*width));
}
export function overviewNameLayout(node,index,compact,selected){
 const[x,y]=radialSlot(index,compact),lines=overviewNameLines(node,index);
 const halo=nodeGeometry(node).halo*(selected?1.55:1),size=nodeTier(node)===2?20:17;
 if(selected&&compact&&Math.abs(x-620)<120&&y>0&&y<205)return{x,y:y-halo-12-(lines.length-1)*20,anchor:'middle',lines,size};
 if(index<8&&y>205&&Math.abs(x-620)>100)return{x,y:y-halo-12-(lines.length-1)*20,anchor:'middle',lines,size};
 if(index>=8&&Math.abs(x-620)>(compact?360:500)*.68){
  const right=x>620;return{x:x+(right?1:-1)*(halo+12),y:y+size*.35-(lines.length-1)*10,anchor:right?'start':'end',lines,size};
 }
 return{x,y:y+halo+18,anchor:'middle',lines,size};
}
export const overviewCoreNameY = scale => 205+HIERARCHY.overview.center.radius*scale+32;
