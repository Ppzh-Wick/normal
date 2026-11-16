/* Genuine r3f-scroll-rig integration. The native modal owns scrolling; it does
 * not use SmoothScrollbar, whose window-level controller would change the site.
 * useTracker provides the DOM artboard size; one shared GlobalCanvas renders a
 * real perspective camera path. Text, controls, and sources stay in HTML. */
import React,{Component,Suspense,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {GlobalCanvas,useScrollRig,useTracker} from '@14islands/r3f-scroll-rig';
import {useFrame,useThree} from '@react-three/fiber';
import {BufferGeometry,Float32BufferAttribute,SRGBColorSpace,TextureLoader} from 'three';
import {cameraPath,platePosition,visiblePlates,spatialEligible} from './spatialJourneyMath.mjs';

export {spatialEligible};
class SceneBoundary extends Component{
 state={failed:false};static getDerivedStateFromError(){return{failed:true}}
 componentDidCatch(){this.props.onFailure()}
 render(){return this.state.failed?null:this.props.children}
}
function geometry(points){const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points,3));return g}
function Terrain(){
 const lines=useMemo(()=>{const points=[];for(let row=0;row<13;row++){const z=-row*5;for(let col=0;col<40;col++){const x=(col-20)*.7;const y=-3.8+Math.sin(col*.23+row*.42)*.15;points.push(x,y,z,x+.7,-3.8+Math.sin((col+1)*.23+row*.42)*.15,z)}}return geometry(points)},[]);
 useEffect(()=>()=>lines.dispose(),[lines]);
 return <lineSegments geometry={lines}><lineBasicMaterial color="#3c6675" transparent opacity={.28}/></lineSegments>;
}
function RecordPlate({index,data,records,width,height}){
 const stop=records[index],media=data.media[stop.media],group=useRef(null);
 const [texture,setTexture]=useState(null);const {requestRender}=useScrollRig();const invalidate=useThree(s=>s.invalidate);
 useEffect(()=>{if(!media)return;let alive=true,loaded;const t=new TextureLoader().load(media.path,tex=>{loaded=tex;if(!alive){tex.dispose();return}tex.colorSpace=SRGBColorSpace;tex.anisotropy=1;setTexture(tex);requestRender();invalidate()},undefined,()=>{});return()=>{alive=false;setTexture(null);(loaded||t).dispose()}},[media,requestRender,invalidate]);
 useLayoutEffect(()=>{if(texture){requestRender();invalidate()}},[texture,requestRender,invalidate]);
 const frame=useMemo(()=>geometry([-width/2,-height/2,0,width/2,-height/2,0,width/2,height/2,0,-width/2,height/2,0,-width/2,-height/2,0]),[width,height]);
 const strata=useMemo(()=>{const points=[];for(let row=0;row<14;row++)for(let j=0;j<48;j++){const x=(j/48-.5)*width*.94,x2=((j+1)/48-.5)*width*.94;const wave=x=>height*(Math.sin(x*.9+row*.23)*.06+Math.sin(x*2.5+row*.25)*.012+(row/14-.5)*.8);points.push(x,wave(x),.025,x2,wave(x2),.025)}return geometry(points)},[width,height]);
 useEffect(()=>()=>{frame.dispose();strata.dispose()},[frame,strata]);
 const p=platePosition(index),ratio=media?(media.width||106)/(media.height||176):1;
 let w=width*.93,h=w/ratio;if(h>height*.89){h=height*.89;w=h*ratio}
 return <group ref={group} position={p.position} rotation={p.rotation}>
  <mesh position={[0,0,-.045]}><boxGeometry args={[width+.055,height+.055,.09]}/><meshBasicMaterial color="#0e1c2a"/></mesh>
  <line geometry={frame} position={[0,0,.012]}><lineBasicMaterial color="#9babb3" transparent opacity={.65}/></line>
  {texture?<mesh position={[0,0,.018]}><planeGeometry args={[w,h]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>:<lineSegments geometry={strata}><lineBasicMaterial color={index%2?'#82a6b4':'#a399af'} transparent opacity={.5}/></lineSegments>}
  <mesh position={[-width/2-.15,0,-.02]}><boxGeometry args={[.014,height*.9,.03]}/><meshBasicMaterial color="#b3b5b0"/></mesh>
  <mesh position={[0,-height/2-.2,0]}><boxGeometry args={[width*.82,.006,.02]}/><meshBasicMaterial color="#587584" transparent opacity={.5}/></mesh>
 </group>;
}
function Scene({progress,index,data,records,track,host,onReady}){
 const {scale}=useTracker(track,{autoUpdate:false,wrapper:track.current?.closest('.chronicle-stage')});
 const {requestRender}=useScrollRig(),invalidate=useThree(s=>s.invalidate),size=useThree(s=>s.size);
 const ready=useRef(false),renders=useRef(0);
 const plates=visiblePlates(progress,records.length);const width=Math.min(7.2,Math.max(4,scale.x||6.4)),height=width*.61;
 useLayoutEffect(()=>{if(document.hidden)return;requestRender();invalidate()},[progress,index,scale.x,size.width,size.height,requestRender,invalidate]);
 useFrame(({camera,gl})=>{
  if(document.hidden)return;
  const distance=size.height*.01/(2*Math.tan(25*Math.PI/180));const p=cameraPath(progress,distance);
  camera.position.set(...p);camera.rotation.set(0,0,0);camera.far=220;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  if(host.current){host.current.dataset.cameraZ=p[2].toFixed(3);host.current.dataset.renderCount=String(++renders.current);host.current.dataset.livePlates=String(plates.length);host.current.dataset.drawCalls=String(gl.info.render.calls)}
  if(!ready.current){ready.current=true;onReady(true)}
 });
 return <><fog attach="fog" args={['#091321',15,45]}/><group position={[0,0,-Math.floor(progress/6)*48]}><Terrain/></group>{plates.map(i=><RecordPlate key={i} index={i} data={data} records={records} width={width} height={height}/>)}</>;
}
export default function SpatialJourney({progress,index,data,records,track,onReady,onFailure}){
 const host=useRef(null),[visible,setVisible]=useState(!document.hidden);
 useEffect(()=>{const change=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',change);return()=>{document.removeEventListener('visibilitychange',change);document.documentElement.classList.remove('js-has-global-canvas','js-global-canvas-error')}},[]);
 return <div className="journey-webgl" ref={host} aria-hidden="true" data-renderer="r3f-scroll-rig" data-active={visible}>
 <SceneBoundary onFailure={onFailure}><GlobalCanvas frameloop={visible?'demand':'never'} dpr={1} scaleMultiplier={.01} camera={{fov:50,far:220}} gl={{antialias:true,alpha:true,powerPreference:'low-power'}} style={{position:'absolute',height:'100%',pointerEvents:'none'}} onError={onFailure} onCreated={({gl})=>{gl.setClearColor('#091321',0);gl.domElement.addEventListener('webglcontextlost',onFailure,{once:true})}}><Suspense fallback={null}><Scene progress={progress} index={index} data={data} records={records} track={track} host={host} onReady={onReady}/></Suspense></GlobalCanvas></SceneBoundary>
 </div>;
}
