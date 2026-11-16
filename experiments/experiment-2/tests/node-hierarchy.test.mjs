import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync}from'node:fs';
import{HIERARCHY,nodeTier,nodeGeometry,radialSlot,overviewNameLayout,overviewCoreNameY}from'../src/components/relationHierarchy.mjs';
const data=JSON.parse(readFileSync(new URL('../src/data.json',import.meta.url))),curated=['stille','berlin','chengdu','sichuan-map','jialing','guo-lingzhi','zhou-tingru','arnold-heim'];
const nodes=[...data.graph.nodes].sort((a,b)=>(curated.includes(a.id)?curated.indexOf(a.id):100)-(curated.includes(b.id)?curated.indexOf(b.id):100)).sort((a,b)=>data.graph.categories.findIndex(c=>c.id===a.category)-data.graph.categories.findIndex(c=>c.id===b.category));
test('all 24 records use category-based display tiers, including people without photographs',()=>{
 assert.equal(nodes.length,24);assert.equal(nodes.filter(n=>nodeTier(n)===2).length,13);assert.equal(nodes.filter(n=>nodeTier(n)===3).length,11);
 for(const id of['xu-kaili','lu-dengshi','wu-yansheng'])assert.equal(nodeTier(nodes.find(n=>n.id===id)),2);
 for(const id of['berlin','jialing','sichuan-map','petroleum-geology'])assert.equal(nodeTier(nodes.find(n=>n.id===id)),3);
});
test('three portrait sizes remain ordered before and during pair focus in both modes',()=>{
 for(const mode of['overview','category']){const g=HIERARCHY[mode];assert.ok(g.center.radius>g.person.radius*1.55);assert.ok(g.person.radius>g.entity.radius*1.55);assert.ok(g.center.radius*1.22>g.person.radius*1.55);}
});
test('every overview avatar pair clears for every selection in full and compact layouts',()=>{
 for(const compact of[false,true])for(const selected of[null,...nodes.map(n=>n.id)])for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
  const a=radialSlot(i,compact),b=radialSlot(j,compact),space=Math.hypot(a[0]-b[0],a[1]-b[1]);
  const radius=nodeGeometry(nodes[i]).radius*(selected===nodes[i].id?1.55:1)+nodeGeometry(nodes[j]).radius*(selected===nodes[j].id?1.55:1);
  assert.ok(space>=radius+1,`${compact}/${selected}/${nodes[i].id}/${nodes[j].id}: ${space-radius}`);
 }
});
test('bottom inner portrait clears the central name even when selected',()=>{
 for(const compact of[false,true])for(const selected of[false,true]){
  const y=radialSlot(4,compact)[1],top=y-HIERARCHY.overview.person.radius*(selected?1.55:1),nameBottom=overviewCoreNameY(selected?1.22:1)+5;
  assert.ok(top>nameBottom,`${compact}/${selected}: ${top-nameBottom}`);
 }
});
test('ordinary overview labels do not cover another record portrait',()=>{
 for(const compact of[false,true])for(let i=0;i<nodes.length;i++){
  const l=overviewNameLayout(nodes[i],i,compact,false),w=Math.max(...l.lines.map(s=>s.length))*l.size,r={x:l.x-(l.anchor==='middle'?w/2:l.anchor==='end'?w:0),y:l.y-l.size,w,h:l.lines.length*20};
  for(let j=0;j<nodes.length;j++)if(i!==j){const[x,y]=radialSlot(j,compact),radius=nodeGeometry(nodes[j]).radius;const dx=x-Math.max(r.x,Math.min(x,r.x+r.w)),dy=y-Math.max(r.y,Math.min(y,r.y+r.h));assert.ok(Math.hypot(dx,dy)>=radius,`${compact}/${nodes[i].id} label on ${nodes[j].id}`);}
 }
});
