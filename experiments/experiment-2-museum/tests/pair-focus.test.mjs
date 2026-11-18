import test from 'node:test';
import assert from 'node:assert/strict';
import {portraitScale,centerPortraitScale,portraitTransform,pairCamera,overviewLabelY} from '../src/components/relationFocus.mjs';
test('pair focus enlarges only the selected portrait across all record types',()=>{
 const ids=['shi-yafeng','berlin','jialing','sichuan-map','tectonics-textbook'];
 for(const selected of ids)for(const id of ids)assert.equal(portraitScale(selected,id),selected===id?1.55:1);
 for(const id of ids)assert.equal(portraitScale(null,id),1);
 assert.equal(centerPortraitScale('berlin'),1.22);assert.equal(centerPortraitScale(null),1);
});
test('automatic pair camera pans but never zooms the world',()=>{
 for(const overview of [true,false])for(const[x,y]of [[620,80],[620,330],[110,205],[480,70],[750,105]]){
  const c=pairCamera(x,y,overview);assert.equal(c.scale,1);assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y));
 }
});
test('local avatar transform keeps its own center fixed',()=>{
 assert.equal(portraitTransform(620,205,1.22),'translate(620 205) scale(1.22) translate(-620 -205)');
 assert.equal(portraitTransform(80,40,1),'translate(80 40) scale(1) translate(-80 -40)');
});
test('compact top multiline labels stay above the enlarged portrait and bottom labels clear the core',()=>{
 const top=overviewLabelY(620,80,2,true,true);
 assert.ok(top-17>=-10);assert.ok(top+17<80-22*1.55);
 assert.equal(overviewLabelY(620,330,1,true,true),387);
 assert.ok(330-22*1.55>285);
 assert.equal(overviewLabelY(620,80,1,false,true),119);
});
