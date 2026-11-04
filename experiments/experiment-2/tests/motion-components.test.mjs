import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('V7 uses the actual upstream GSAP components without loading a second animation engine',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.dependencies.gsap,'3.15.0');assert.equal(pkg.dependencies['@gsap/react'],'2.1.2');assert.ok(!pkg.dependencies.motion);
 assert.match(read('src/vendor/SplitText.jsx'),/gsap\/SplitText/);
 assert.match(read('src/vendor/AnimatedContent.jsx'),/gsap\.context/);
 assert.match(read('src/vendor/StaggeredMenu.jsx'),/layerStates.*layers\.map/);
 assert.match(read('src/vendor/StaggeredMenu.jsx'),/panelInsertTime/);
});
test('new finite effects retain explicit reduced-motion and mobile branches',()=>{
 const app=read('src/App.jsx');
 assert.match(app,/nav\.reduced\|\|!nav\.desktop/);
 assert.match(app,/loop=\{false\}/);assert.match(app,/hoverEffect="none"/);
 assert.match(app,/disabled=\{nav\.reduced\|\|!nav\.desktop\}/);
 const menu=read('src/vendor/StaggeredMenu.jsx');assert.match(menu,/if\(reduced\)return/);assert.match(menu,/showModal\(\)/);assert.match(menu,/onCancel=/);assert.match(menu,/ctx\.revert\(\)/);
});
test('folio animation uses bounded transforms and leaves media transitions separate',()=>{
 const css=read('src/motion.css');
 assert.match(css,/animation-duration:\.56s/);assert.match(css,/translateY\(100%\)/);assert.match(css,/translateY\(-100%\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/data-transition-kind=media/);
 assert.doesNotMatch(css,/\binfinite\b|filter:\s*blur|will-change/);
});
test('component provenance and distinct licenses ship with the preview',()=>{
 const provenance=read('docs/V7-MOTION.md');for(const name of ['SplitText','AnimatedContent','StaggeredMenu'])assert.ok(provenance.includes(name));
 const notices=read('public/THIRD-PARTY-NOTICES.txt');assert.match(notices,/Commons Clause/);assert.match(notices,/Standard "No Charge" GSAP License/);
});
