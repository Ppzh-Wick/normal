import bpy, math, random, os, sys
from mathutils import Vector
random.seed(31)
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=256
scene.cycles.use_denoising=False;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.025;scene.cycles.adaptive_min_samples=64;scene.cycles.max_bounces=16;scene.cycles.transmission_bounces=12;scene.cycles.transparent_max_bounces=8
scene.render.film_transparent=True
scene.render.resolution_x=512;scene.render.resolution_y=1600;scene.render.resolution_percentage=50
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.world.color=(.19,.22,.25)
scene.view_settings.view_transform='AgX'
# Dim neutral studio world, strong shaped area reflections, never emissive plastic.
w=scene.world;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.27,.31,.35,1);w.node_tree.nodes['Background'].inputs['Strength'].default_value=.42

def material(name,metal,rough,trans,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Transmission Weight'].default_value=trans;p.inputs['IOR'].default_value=1.47;p.inputs['Coat Weight'].default_value=.4;p.inputs['Coat Roughness'].default_value=.055
 return m
silver=material('polished optical silver',.035,.055,.96,(.72,.87,.9))
glass=material('clear mineral glass',.0,.035,1.0,(.87,.94,.95))
lilac=material('trace iridescent mineral',.03,.05,.94,(.76,.71,.85))
root=bpy.data.objects.new('SCULPTURE',None);scene.collection.objects.link(root)
# A broken, sinuous core with broad polished surfaces instead of regular triangular collars.
z=-6.65;idx=0
while z<6.4:
 height=random.uniform(.75,1.8);rad=random.uniform(.23,.45);n=9;levels=7;verts=[]
 lean=random.uniform(-.24,.24);twist=random.uniform(.35,1.2);phase=random.random()*6.28
 for k in range(levels):
  t=k/(levels-1);zz=z+t*height
  width=rad*(.48+.55*math.sin(t*math.pi)**.8)*(1+.15*math.sin(t*5+phase))
  cx=.18*math.sin(zz*.64)+lean*(t-.5);cy=.11*math.sin(zz*1.1)
  for j in range(n):
   a=j*math.tau/n+twist*t+phase
   asym=1+.15*math.sin(j*2.7+idx)
   verts.append((cx+width*math.cos(a)*asym,cy+width*.66*math.sin(a),zz))
 faces=[]
 for k in range(levels-1):
  for j in range(n):faces.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
 faces.extend([tuple(reversed(range(n))),tuple((levels-1)*n+j for j in range(n))])
 me=bpy.data.meshes.new('fluid crystal mesh');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new('mineral fluid '+str(idx),me);scene.collection.objects.link(ob);ob.parent=root;ob.data.materials.append(glass if idx%3==0 else silver)
 for p in me.polygons:p.use_smooth=True
 bevel=ob.modifiers.new('soft optical edge','BEVEL');bevel.width=.025;bevel.segments=3
 z+=height+random.uniform(.1,.32);idx+=1
# A single continuous folded spinal surface, crossing the fragment gaps.
verts=[];faces=[];levels=180;n=8
for k in range(levels):
 t=k/(levels-1);zz=-6.8+t*13.6;angle=zz*.59+.3*math.sin(zz*1.7)
 radius=.26+.10*math.sin(zz*1.4)+.055*math.sin(zz*3.3)
 cx=.19*math.sin(zz*.64);cy=.08*math.cos(zz*.8)
 for j in range(n):
  a=j*math.tau/n+angle
  verts.append((cx+radius*math.cos(a),cy+radius*.45*math.sin(a),zz))
for k in range(levels-1):
 for j in range(n):faces.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
me=bpy.data.meshes.new('continuous fold');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new('continuous mineral spine',me);scene.collection.objects.link(ob);ob.parent=root;ob.data.materials.append(silver)
for p in me.polygons:p.use_smooth=True
# Large discontinuous optical ribbons: thin broad flowing folds catching long softbox highlights.
for i in range(6):
 z0=-5.9+i*2.05+random.uniform(-.3,.3);h=random.uniform(1.2,2.2);verts=[];rows=24
 phase=i*1.7
 for k in range(rows):
  t=k/(rows-1);z=z0+h*t;angle=phase+t*1.8
  center=Vector((.38*math.cos(angle)+.15*math.sin(z*.64),.36*math.sin(angle),z))
  wid=(.10+.35*math.sin(math.pi*t)**.6)*(1+.12*math.sin(t*7))
  side=Vector((math.cos(angle+.9),math.sin(angle+.9),.3*math.sin(t*3)))
  for v in [-1,-.45,.45,1]:verts.append(tuple(center+side*wid*v+Vector((0,.08*(v*v),0))))
 faces=[]
 for k in range(rows-1):
  for j in range(3):faces.append((k*4+j,k*4+j+1,(k+1)*4+j+1,(k+1)*4+j))
 me=bpy.data.meshes.new('fold surface');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new('flowing optical fold '+str(i),me);scene.collection.objects.link(ob);ob.parent=root;ob.data.materials.append(lilac if i==4 else silver)
 for p in me.polygons:p.use_smooth=True
 solid=ob.modifiers.new('optical depth','SOLIDIFY');solid.thickness=.16
 bevel=ob.modifiers.new('rolled edge','BEVEL');bevel.width=.018;bevel.segments=3
# A few peripheral detached fragments, differing scale, not an even particle field.
for i in range(14):
 z=random.uniform(-5.9,6.2);a=random.random()*math.tau;r=random.uniform(.48,.8)
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.03,.075),location=(r*math.cos(a),r*math.sin(a),z));o=bpy.context.object;o.scale=(1,.45,random.uniform(1.3,2.4));o.rotation_euler=(random.random(),random.random(),random.random());o.data.materials.append(silver);o.parent=root

def area(name,loc,power,color,scale):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='RECTANGLE';o.data.size=scale[0];o.data.size_y=scale[1];o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
area('long silver key',(-3,-4,2),350,(.86,.95,1),(.4,11))
area('right cyan narrow',(3,-1,1),250,(.49,.79,.85),(.35,9))
area('back lilac',(1.8,2,2),350,(.62,.5,.79),(.5,11))
area('warm edge',(-2,1,-3),200,(1,.83,.68),(.3,7))
area('top white',(0,-1,8),120,(1,1,1),(2,2))
# Camera-invisible studio card: visible through glass and in reflections, not pasted background.
# Its restrained broad gradients make real internal refraction legible against transparency.
m=bpy.data.materials.new('refracted softbox gradient');m.use_nodes=True;nodes=m.node_tree.nodes;links=m.node_tree.links;nodes.clear()
out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs['Strength'].default_value=1.8
tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=2.8;tex.inputs['Detail'].default_value=1.6;tex.inputs['Roughness'].default_value=.45
coord=nodes.new('ShaderNodeTexCoord');links.new(coord.outputs['Generated'],tex.inputs['Vector'])
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.2;ramp.color_ramp.elements[0].color=(.08,.18,.21,1);ramp.color_ramp.elements[1].position=.8;ramp.color_ramp.elements[1].color=(.85,.95,1,1)
e=ramp.color_ramp.elements.new(.46);e.color=(.28,.5,.53,1);e=ramp.color_ramp.elements.new(.61);e.color=(.55,.46,.66,1)
links.new(tex.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs['Color'],em.inputs['Color']);links.new(em.outputs[0],out.inputs['Surface'])
bpy.ops.mesh.primitive_plane_add(size=2,location=(0,1.7,0),rotation=(math.pi/2,0,0));card=bpy.context.object;card.name='transmission-only gradient environment';card.scale=(2.5,8,1);card.data.materials.append(m);card.visible_camera=False;card.visible_shadow=False
bpy.ops.object.camera_add(location=(0,-18,0));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=14.7;scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'optical-sculpture.blend'))
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if 'final' in args:scene.render.resolution_percentage=100;scene.cycles.samples=512
for name,angle in [('front',0),('turn',.42),('reverse',-.38)] if 'all' in args else [('front',0)]:
 root.rotation_euler.z=angle;scene.render.filepath=os.path.join(OUT,'sculpture-'+name+'.png');bpy.ops.render.render(write_still=True)
