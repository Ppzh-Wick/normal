/* Original geological sculpture, not an Active Theory asset or historical reconstruction.
 * Genuine r3f-scroll-rig GlobalCanvas; demand-rendered only on scroll and resize. */
import React,{Component,useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {GlobalCanvas,useScrollRig} from '@14islands/r3f-scroll-rig';
import {useThree,useFrame} from '@react-three/fiber';
import {BufferGeometry,Float32BufferAttribute} from 'three';
class Boundary extends Component{state={failed:false};static getDerivedStateFromError(){return{failed:true}}componentDidCatch(){this.props.onFailure()}render(){return this.state.failed?null:this.props.children}}
function Sculpture({orbit,focus,host}){
 const {requestRender}=useScrollRig(),invalidate=useThree(s=>s.invalidate),size=useThree(s=>s.size),frames=useRef(0);
 const points=useMemo(()=>{let a=[];for(let i=0;i<1300;i++){const t=i*.17,r=.7+1.6*((i*73%313)/313),y=((i*127%701)/701-.5)*18;a.push(Math.sin(t)*r,y,Math.cos(t)*r)}const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(a,3));return g},[]);
 useEffect(()=>()=>points.dispose(),[points]);
 useLayoutEffect(()=>{requestRender();invalidate()},[orbit,focus,size.width,size.height,requestRender,invalidate]);
 useFrame(({gl})=>{if(host.current){host.current.dataset.renderCount=String(++frames.current);host.current.dataset.drawCalls=String(gl.info.render.calls)}});
 const turn=orbit*.22,offset=(orbit%1)*.65;
 return <group position={[.65,offset,-3]} rotation={[.07,turn,-.16]} scale={1-focus*.12}>
 <ambientLight intensity={2.2}/><directionalLight position={[5,4,5]} intensity={3.5} color="#b7d9e8"/><directionalLight position={[-3,-2,3]} intensity={2} color="#dba7bc"/>
 {Array.from({length:24},(_,i)=><group key={i} position={[Math.sin(i*.36)*.36,(i-11.5)*.47,Math.cos(i*.36)*.23]} rotation={[.12, i*.29,.16*Math.sin(i)]}><mesh><cylinderGeometry args={[.7+(i%3)*.06,.96,.18,5,1]}/><meshStandardMaterial color={i%4===0?'#d5af9b':i%3===0?'#69a5bb':'#aca3cf'} roughness={.2} metalness={.3} transparent opacity={.8-focus*.25}/></mesh><mesh rotation={[0,0,.23]} scale={[1.025,1.05,1.025]}><cylinderGeometry args={[.7+(i%3)*.06,.96,.18,5,1]}/><meshBasicMaterial color={i%5===0?'#c17f66':'#718fa2'} wireframe transparent opacity={.32}/></mesh></group>)}
 <points geometry={points} rotation={[0,orbit*.15,0]}><pointsMaterial color="#99b0c3" size={.015} transparent opacity={.34*(1-focus*.6)} depthWrite={false}/></points>
 </group>;
}
export default function ChronicleMineral({orbit,focus,onFailure}){const host=useRef(null),canvas=useRef(null);useEffect(()=>()=>{canvas.current?.removeEventListener('webglcontextlost',onFailure);document.documentElement.classList.remove('js-has-global-canvas','js-global-canvas-error')},[]);return <div className="gallery-mineral" ref={host} aria-hidden="true" data-renderer="r3f-scroll-rig"><Boundary onFailure={onFailure}><GlobalCanvas frameloop="demand" dpr={1} scaleMultiplier={.01} camera={{fov:45}} gl={{antialias:true,alpha:true,powerPreference:'low-power'}} style={{position:'absolute',height:'100%',pointerEvents:'none'}} onError={onFailure} onCreated={({gl})=>{canvas.current=gl.domElement;gl.domElement.addEventListener('webglcontextlost',onFailure,{once:true})}}><Sculpture orbit={orbit} focus={focus} host={host}/></GlobalCanvas></Boundary></div>}
