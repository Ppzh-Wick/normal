"""Crop generated RGBA assets to exact non-transparent bbox, preserving all pixels.
Reproduce with: python render.py && python package.py
"""
from PIL import Image
from pathlib import Path
import json
root=Path(__file__).parent
manifest={'canvas':{'width':1600,'height':1000},'coordinateSystem':'normalized from top-left, relative to original canvas','layers':[]}
for name in ['particles-far','particles-body','particles-near']:
 src=root/(name+'.png');im=Image.open(src).convert('RGBA');w,h=im.size
 bbox=im.getchannel('A').getbbox()
 if bbox is None:raise ValueError('empty asset '+name)
 l,t,r,b=bbox;crop=im.crop(bbox);file=name+'-cropped.webp';crop.save(root/file,format='WEBP',quality=89,method=6)
 # Verify alpha coverage and reversible exact source crop; WebP RGB itself is lossy.
 restored=Image.new('RGBA',im.size);restored.paste(crop,(l,t));assert restored.getchannel('A').tobytes()==im.getchannel('A').tobytes()
 layer={'name':name,'file':file,'source':src.name,'bboxPixels':{'left':l,'top':t,'width':r-l,'height':b-t},'normalized':{'left':l/w,'top':t/h,'width':(r-l)/w,'height':(b-t)/h},'cssPercent':{'left':f'{l/w*100:.6f}%','top':f'{t/h*100:.6f}%','width':f'{(r-l)/w*100:.6f}%','height':f'{(b-t)/h*100:.6f}%'},'encodedBytes':(root/file).stat().st_size,'sourceArea':w*h,'croppedArea':(r-l)*(b-t)}
 manifest['layers'].append(layer);print(name,bbox,layer['normalized'],layer['encodedBytes'],flush=True)
(root/'cropped-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('TOTAL',sum(x['encodedBytes'] for x in manifest['layers']),flush=True)
rows=[{'file':x['file'],**x['normalized'],'depth':depth} for x,depth in zip(manifest['layers'],[.35,.65,1])]
(root/'layers.json').write_text(json.dumps(rows,indent=2)+'\n')
