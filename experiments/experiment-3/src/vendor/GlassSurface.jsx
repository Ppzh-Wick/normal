/* React Bits GlassSurface by David Haz, MIT + Commons Clause.
   Frosted-only specialization of the official refraction=false render branch.
   The upstream container styles, sheen, rim and content markup are retained.
   SVG/WebGL refraction, image tracing and their effects are intentionally omitted.
   Original source revision/hash and adaptations: docs/V8-MATERIALS.md. */
import './GlassSurface.css';
const GlassSurface=({children,width=200,height=80,borderRadius=20,backgroundOpacity=0,saturation=1,className='',style={}})=>{
 const containerStyle={...style,width:typeof width==='number'?`${width}px`:width,height:typeof height==='number'?`${height}px`:height,borderRadius:`${borderRadius}px`,'--glass-frost':backgroundOpacity,'--glass-saturation':saturation};
 return <div className={`glass-surface glass-surface--fallback ${className}`} style={containerStyle}>
  <span className="glass-surface__sheen" aria-hidden="true"/>
  <span className="glass-surface__rim" aria-hidden="true"/>
  <div className="glass-surface__content">{children}</div>
 </div>;
};
export default GlassSurface;
