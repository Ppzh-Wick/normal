import { centerPortraitScale } from './relationFocus.mjs';
// Display hierarchy only: sizes do not rank influence or historical importance.
export const HIERARCHY = Object.freeze({
 overview: {center:{radius:52,halo:62,aura:75},person:{radius:30,halo:36},entity:{radius:17,halo:23}},
 category: {center:{radius:64,halo:76},person:{radius:39,halo:47},entity:{radius:22,halo:30}},
});
export const nodeTier = node => node.visualTier ?? (node.category === 'people' ? 2 : 3);
export const nodeGeometry = (node, overview=true) => HIERARCHY[overview?'overview':'category'][nodeTier(node)===2?'person':'entity'];
// Match the actual visible center portrait, cancelling the orbital depth scale.
// Unselected records retain their tier and perspective size exactly.
export function nodeFocusScale(selectedId,node,index,compact=false,nodes,overview=true){
 if(!selectedId||selectedId!==node.id)return 1;
 const center=HIERARCHY[overview?'overview':'category'].center.radius;
 const depth=overview?nodeDepthScale(node,index,compact,nodes):1;
 return center*centerPortraitScale(selectedId)/(nodeGeometry(node,overview).radius*depth);
}
// Each display tier has one shared ellipse: people inside, non-people outside.
export const RINGS=Object.freeze({
 full:{people:{rx:330,ry:180},other:{rx:530,ry:280}},
 compact:{people:{rx:250,ry:190},other:{rx:420,ry:300}}
});
export const ORBIT_TILT=-8;
export function orbitCoordinates(x,y,inverse=false){
 const a=ORBIT_TILT*Math.PI/180*(inverse?-1:1),dx=x-620,dy=y-205;
 return[620+dx*Math.cos(a)-dy*Math.sin(a),205+dx*Math.sin(a)+dy*Math.cos(a)];
}
export function ringFor(node,compact=false){return RINGS[compact?'compact':'full'][nodeTier(node)===2?'people':'other'];}
export function radialSlot(i,compact=false,nodes){
 const person=nodes?nodeTier(nodes[i])===2:i<13;
 const peers=nodes?nodes.filter(n=>(nodeTier(n)===2)===person):Array(person?13:11);
 const slot=nodes?nodes.slice(0,i).filter(n=>(nodeTier(n)===2)===person).length:person?i:i-13;
 const angle=-Math.PI/2+slot*Math.PI*2/Math.max(1,peers.length)+(person?0:Math.PI/Math.max(1,peers.length));
 const ring=RINGS[compact?'compact':'full'][person?'people':'other'];
 return orbitCoordinates(620+Math.cos(angle)*ring.rx,205+Math.sin(angle)*ring.ry);
}
export function nodeDepthScale(node,index,compact=false,nodes){
 const[x,y]=radialSlot(index,compact,nodes),[,flatY]=orbitCoordinates(x,y,true),depth=(flatY-205)/ringFor(node,compact).ry;
 return nodeTier(node)===2?.97+.09*depth:.84+.06*depth;
}
export function overviewNameLines(node){
 const label=node.id==='tectonics-textbook'?'构造地质教材':node.name;
 if(node.id==='arnold-heim')return['阿诺德·','海姆'];
 if(node.id==='chengdu')return['成都地质','勘探学院'];
 const width=nodeTier(node)===2?7:4;
 return Array.from({length:Math.ceil(label.length/width)},(_,i)=>label.slice(i*width,(i+1)*width));
}
export function overviewNameLayout(node,index,compact,selected,nodes){
 const[x,y]=radialSlot(index,compact,nodes),lines=overviewNameLines(node),ring=ringFor(node,compact);
 const halo=nodeGeometry(node).halo*nodeDepthScale(node,index,compact,nodes)*nodeFocusScale(selected?node.id:null,node,index,compact,nodes),size=nodeTier(node)===2?20:17;
 if(Math.abs(x-620)>ring.rx*.8){const right=x>620;return{x:x+(right?1:-1)*(halo+12),y:y+size*.35-(lines.length-1)*10,anchor:right?'start':'end',lines,size};}
 if(y<205)return{x,y:y-halo-12-(lines.length-1)*20,anchor:'middle',lines,size};
 return{x,y:y+halo+18,anchor:'middle',lines,size};
}
export const overviewCoreNameY=scale=>205+HIERARCHY.overview.center.radius*scale+32;

