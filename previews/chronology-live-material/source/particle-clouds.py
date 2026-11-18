"""Offline original particle assets, composition studied from user's AT recording.
No source pixels sampled; no historical imagery; no real-time particle draw cost.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math, random, json
W,H=1600,1000; S=2; root=Path(__file__).parent
palettes={
 'violet':[(106,65,240),(126,76,245),(90,92,224),(159,115,242),(173,128,231)],
 'blue':[(69,111,240),(82,122,238),(90,80,236),(144,94,239),(166,147,248)],
 'pink':[(226,49,151),(242,53,156),(209,63,187),(235,110,190),(252,156,215)]}
# Cluster bounds and rotated unequal volumes. Left lower violet; right upper blue/purple;
# lower-right rose. Centers preserve the black negative-space spine and upper-left.
clusters=[
 (.305,.745,.052,.075,-.25,'violet',4100),(.322,.88,.055,.093,.4,'violet',4500),
 (.286,.95,.039,.080,.5,'violet',2600),(.372,.94,.032,.056,-.6,'pink',1400),
 (.779,.259,.045,.059,.4,'violet',3600),(.754,.354,.057,.088,-.4,'blue',5300),
 (.723,.455,.042,.065,-.35,'blue',3300),(.700,.618,.034,.071,.6,'blue',2800),
 (.675,.789,.042,.098,.2,'pink',5200),(.709,.907,.056,.094,-.4,'pink',4300),
 (.774,.952,.044,.058,.5,'pink',1800)]
def point(rng,c):
 cx,cy,rx,ry,rot,pal,n=c
 # Nonuniform curling shell, clumpy cross-section, holes and rare wisps.
 t=rng.uniform(0,math.tau); z=rng.uniform(-1,1)
 tube=.50+.20*math.sin(3*t+.7)+.11*math.cos(5*t-1.2)
 rr=max(.10,rng.gauss(tube,.18))
 x=math.cos(t)*rr+.16*math.sin(t*4+z*2)
 y=math.sin(t)*rr+.13*math.cos(t*3-z)
 if rng.random()<.09:x*=rng.uniform(1.15,1.9);y*=rng.uniform(1.05,1.7)
 # Twist and stretch each clump, then rotate, never regular circular rings.
 x+=.30*y*y-.11; y+=.18*math.sin(x*4)
 a=x*math.cos(rot)-y*math.sin(rot);b=x*math.sin(rot)+y*math.cos(rot)
 return (cx+rx*a)*W,(cy+ry*b)*H,z
for layer in range(3):
 rng=random.Random(29415+layer*913);im=Image.new('RGBA',(W*S,H*S));d=ImageDraw.Draw(im)
 for c in clusters:
  n=int(c[-1]*[.34,.53,.13][layer])
  for i in range(n):
   x,y,z=point(rng,c);color=rng.choice(palettes[c[5]])
   # Far field slightly behind/outward; main shell center; near shards few and larger.
   if layer==0:x+=(x-W*.55)*.055;y+=(y-H*.5)*.035
   if layer==2:x+=(x-W*.55)*.025;y+=9
   r=rng.uniform(*[(.33,.80),(.45,1.15),(.8,1.8)][layer])
   if rng.random()<.025:r*=1.6
   a=int(rng.uniform(*[(32,100),(110,245),(130,245)][layer])*(.70+.30*(z+1)/2))
   if layer==0:color=tuple(int(v*.85) for v in color)
   if rng.random()<.085:color=tuple(int(v*.22+250*.78) for v in color);a=min(235,a+30)
   # Most are tiny soft grains, occasional edge-on flecks, no four-point stars.
   sx=r*rng.uniform(.7,1.3);sy=r*rng.uniform(.7,1.4)
   if layer==2 and rng.random()<.18:
    d.polygon([(x*S,(y-sy)*S),((x+sx)*S,(y+sy)*S),((x-sx)*S,(y+sy*.3)*S)],fill=(*color,a))
   else:d.ellipse(((x-sx)*S,(y-sy)*S,(x+sx)*S,(y+sy)*S),fill=(*color,a))
 im=im.resize((W,H),Image.Resampling.LANCZOS)
 if layer==0:im=im.filter(ImageFilter.GaussianBlur(.30))
 if layer==1:
  halo=im.filter(ImageFilter.GaussianBlur(2.0));halo.putalpha(halo.getchannel('A').point(lambda a: int(a*.6)));im=Image.alpha_composite(halo,im)
 name=['particles-far','particles-body','particles-near'][layer]
 im.save(root/(name+'.png'),optimize=True)
 im.save(root/(name+'.webp'),quality=89,method=6)
# Inspection composite only; do not use as transparent layer.
combined=Image.new('RGBA',(W,H),(0,0,0,0))
for name in ['particles-far','particles-body','particles-near']:
 combined=Image.alpha_composite(combined,Image.open(root/(name+'.png')))
combined.save(root/'particles-combined.png',optimize=True)
combined.save(root/'particles-combined.webp',quality=89,method=6)
bg=Image.new('RGBA',(W,H),(20,26,32,255))
for name in ['particles-far','particles-body','particles-near']:
 bg=Image.alpha_composite(bg,Image.open(root/(name+'.png')))
bg.convert('RGB').save(root/'preview-dark.jpg',quality=95)
print([(p.name,p.stat().st_size) for p in root.glob('*.webp')])
