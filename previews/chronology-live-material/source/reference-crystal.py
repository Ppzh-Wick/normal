import bpy, math, random, os, sys
from mathutils import Vector
random.seed(31)
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=128
scene.cycles.use_denoising=False;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.025;scene.cycles.adaptive_min_samples=32;scene.cycles.max_bounces=16;scene.cycles.transmission_bounces=12;scene.cycles.transparent_max_bounces=8
scene.render.film_transparent=True
scene.render.resolution_x=512;scene.render.resolution_y=1600;scene.render.resolution_percentage=32
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.world.color=(.19,.22,.25)
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.25
# Dim neutral studio world, strong shaped area reflections, never emissive plastic.
w=scene.world;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.27,.31,.35,1);w.node_tree.nodes['Background'].inputs['Strength'].default_value=.12

def material(name,metal,rough,trans,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Transmission Weight'].default_value=trans;p.inputs['IOR'].default_value=1.47;p.inputs['Coat Weight'].default_value=.12;p.inputs['Coat Roughness'].default_value=.055
 return m
silver=material('polished optical silver',.035,.055,.96,(.88,.94,.98))
glass=material('clear mineral glass',.0,.035,1.0,(.87,.94,.95))
lilac=material('trace iridescent mineral',.03,.05,.94,(.89,.86,.96))
pink_glass=material('internal rose refractor',.015,.04,.98,(.95,.14,.42))
cyan_glass=material('internal blue refractor',.015,.035,.98,(.15,.82,.95))
violet_glass=material('internal violet refractor',.015,.045,.98,(.78,.26,.8))
root=bpy.data.objects.new('SCULPTURE',None);scene.collection.objects.link(root)
# Nine individual thick irregular glass bodies. No continuous ribbon or axial rod.
heights=[1.0,1.25,.9,1.35,1.0,1.4,.95,1.0]
radii=[1.1,1.55,1.25,1.4,1.62,1.25,1.5,1.0]
z=-6.55
for idx,(height,radius) in enumerate(zip(heights,radii)):
 n=random.choice([8,9,11,12]);levels=5;phase=random.uniform(0,6.28);ringnoise=[random.uniform(.72,1.22) for j in range(n)];hollow=idx in [2,5]
 vs=[];fs=[];sides=2 if hollow else 1
 for side in range(sides):
  for k in range(levels):
   t=k/(levels-1);profile=[.83+.15*math.sin(idx*2.1),1.015,.98+.09*math.sin(idx*1.4),.98,.81+.18*math.cos(idx*1.7)][k]
   for j in range(n):
    a=j*math.tau/n+phase+.08*t
    r=radius*ringnoise[j]*profile*(.43 if side else 1)
    zz=(t-.5)*height+.21*math.sin(a*2+idx)+.045*math.sin(a*5)*(abs(t-.5)*2)**2
    vs.append((r*math.cos(a),r*.75*math.sin(a),zz))
  offset=side*levels*n
  for k in range(levels-1):
   for j in range(n):
    face=(offset+k*n+j,offset+k*n+(j+1)%n,offset+(k+1)*n+(j+1)%n,offset+(k+1)*n+j)
    fs.append(face if side==0 else tuple(reversed(face)))
 if hollow:
  for end in [0,levels-1]:
   for j in range(n):fs.append((end*n+j,end*n+(j+1)%n,levels*n+end*n+(j+1)%n,levels*n+end*n+j))
 else:fs.extend([tuple(reversed(range(n))),tuple((levels-1)*n+j for j in range(n))])
 me=bpy.data.meshes.new('irregular glass solid');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('fractured body '+str(idx),me);scene.collection.objects.link(o);o.parent=root
 o.location=(random.uniform(-.27,.27),random.uniform(-.1,.1),z+height*.5)
 o.rotation_euler=(random.uniform(-.28,.28),random.uniform(-.23,.23),random.uniform(-.3,.3))
 o.data.materials.append(pink_glass if idx in [1,6] else cyan_glass if idx==3 else violet_glass if idx==5 else glass)
 for poly in me.polygons:poly.use_smooth=True
 be=o.modifiers.new('rounded broken edge','BEVEL');be.width=.055;be.segments=3
 z+=height+[.08,.38,.12,.22,.07,.42,.12,.25][idx]
# Sparse displaced fragments above and beside the main column; random sizes and angles.
for i in range(9):
 zz=(5.5+random.random()*1.2) if i<5 else random.uniform(-4.8,4.8)
 x=random.uniform(-.8,.8) if i<5 else random.choice([-1,1])*random.uniform(1.1,1.65)
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.14,.36),location=(x,random.uniform(-.15,.3),zz));o=bpy.context.object;o.scale=(random.uniform(1,1.8),random.uniform(.6,1.1),random.uniform(.5,1.3));o.rotation_euler=(random.random(),random.random(),random.random());o.data.materials.append(glass);o.parent=root
 be=o.modifiers.new('polished fragment edge','BEVEL');be.width=.04;be.segments=3

def area(name,loc,power,color,scale):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='RECTANGLE';o.data.size=scale[0];o.data.size_y=scale[1];o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
area('long silver key',(-3,-4,2),160,(.86,.95,1),(.4,11))
area('right cyan narrow',(3,-1,1),420,(.15,.72,1),(.65,9))
area('back lilac',(1.8,2,2),620,(.63,.12,.72),(1.4,11))
area('warm edge',(-2,1,-3),330,(1,.25,.53),(.7,7))
area('top white',(0,-1,8),120,(1,1,1),(2,2))
# Camera-invisible studio card: visible through glass and in reflections, not pasted background.
# Its restrained broad gradients make real internal refraction legible against transparency.
m=bpy.data.materials.new('refracted softbox gradient');m.use_nodes=True;nodes=m.node_tree.nodes;links=m.node_tree.links;nodes.clear()
out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs['Strength'].default_value=1.4
tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=2.8;tex.inputs['Detail'].default_value=1.6;tex.inputs['Roughness'].default_value=.45
coord=nodes.new('ShaderNodeTexCoord');links.new(coord.outputs['Generated'],tex.inputs['Vector'])
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.2;ramp.color_ramp.elements[0].color=(.035,.16,.22,1);ramp.color_ramp.elements[1].position=.8;ramp.color_ramp.elements[1].color=(.82,.94,1,1)
e=ramp.color_ramp.elements.new(.46);e.color=(.035,.7,.95,1);e=ramp.color_ramp.elements.new(.61);e.color=(.72,.035,.28,1);e=ramp.color_ramp.elements.new(.72);e.color=(.48,.15,.65,1)
links.new(tex.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs['Color'],em.inputs['Color']);links.new(em.outputs[0],out.inputs['Surface'])
bpy.ops.mesh.primitive_plane_add(size=2,location=(0,1.7,0),rotation=(math.pi/2,0,0));card=bpy.context.object;card.name='transmission-only gradient environment';card.scale=(2.5,8,1);card.data.materials.append(m);card.visible_camera=False;card.visible_shadow=False
bpy.ops.object.camera_add(location=(0,-18,0));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=14.7;scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'optical-sculpture.blend'))
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if 'final' in args:scene.render.resolution_percentage=100;scene.cycles.samples=384;scene.cycles.adaptive_min_samples=64
for name,angle in [('front',0),('turn',.30)] if 'all' in args else [('front',0)]:
 root.rotation_euler.z=angle;scene.render.filepath=os.path.join(OUT,'sculpture-'+name+'.png');bpy.ops.render.render(write_still=True)
