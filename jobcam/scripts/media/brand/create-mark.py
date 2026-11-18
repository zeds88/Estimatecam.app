# Original vector-like fictional demo mark; no stock or third-party artwork.
from PIL import Image, ImageDraw
from pathlib import Path
p=Path(__file__).parent
scale=4
im=Image.new('RGBA',(256*scale,256*scale))
d=ImageDraw.Draw(im)
d.rounded_rectangle((0,0,256*scale-1,256*scale-1),radius=32*scale,fill='#18212b')
for box,color in [((40,56,216,84),'#f28c28'),((56,108,200,136),'#ffffff'),((72,160,184,188),'#f28c28')]:d.rectangle(tuple(n*scale for n in box),fill=color)
d.line((88*scale,212*scale,168*scale,212*scale),fill='#ffffff',width=8*scale)
im.resize((256,256),Image.Resampling.LANCZOS).save(p/'ironvale-mark.png')
