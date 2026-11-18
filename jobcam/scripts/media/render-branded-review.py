"""Render an editorial review clip around actual app footage; no fabricated UI.
Usage: python3 scripts/media/render-branded-review.py <recording-dir> <output.mp4>
Requires Pillow and FFmpeg. Retained field clip stays silent, with 0.8x B-roll.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, sys
work, output = Path(sys.argv[1]), Path(sys.argv[2])
root = Path(__file__).resolve().parents[2]
recording = json.loads((work/'recording.json').read_text())
phases, duration = recording['phases'], recording['duration']
fontroot = Path('/System/Library/Fonts/Supplemental')
def font(size, bold=False):
    return ImageFont.truetype(str(fontroot/('Arial Bold.ttf' if bold else 'Arial.ttf')), size)
def wrap(draw, text, f, width):
    lines, line = [], ''
    for word in text.split():
        test = f'{line} {word}'.strip()
        if draw.textlength(test, font=f) > width and line:
            lines.append(line); line=word
        else: line=test
    if line: lines.append(line)
    return lines
logo=Image.open(Path(__file__).parent/'brand/ironvale-mark.png').convert('RGBA').resize((64,64),Image.Resampling.LANCZOS)
for i, phase in enumerate(phases):
    im=Image.new('RGBA',(1280,720)); d=ImageDraw.Draw(im)
    # Original brand typography and one chapter idea per screen.
    im.alpha_composite(logo,(64,58))
    d.text((148,61),'Ironvale Outdoor Co.',font=font(30,True),fill='#ffffff')
    d.text((148,101),'LANDSCAPE / DRAINAGE / HARDSCAPE',font=font(14),fill='#dbe2e9')
    d.text((64,220),'ESTIMATE CAM  /  MAKE IT YOURS',font=font(16,True),fill='#f6a756')
    y=265
    for line in wrap(d,phase['title'],font(55,True),700):
        d.text((64,y),line,font=font(55,True),fill='#ffffff'); y+=66
    y=max(y+24,420)
    for line in wrap(d,phase['detail'],font(25),650):
        d.text((64,y),line,font=font(25),fill='#dbe2e9');y+=35
    d.text((64,568),f'{i+1:02d} / {len(phases):02d}',font=font(16,True),fill='#f6a756')
    for n in range(len(phases)):
        x=148+n*61
        d.rounded_rectangle((x,572,x+45,576),radius=2,fill='#f28c28' if n<=i else '#697480')
    d.text((64,630),'Fictional demonstration company. Sample quantities and prices.',font=font(17),fill='#c1cad3')
    d.text((64,657),'Confirm field measurements and review before sharing.',font=font(16),fill='#a8b4c1')
    # Device frame sits separately from the actual recording.
    d.rounded_rectangle((845,36,1177,684),radius=30,fill='#0d141d',outline='#73808b',width=2)
    im.save(work/f'chapter-{i+1}.png')
args=['ffmpeg','-nostdin','-y','-v','error','-stream_loop','-1','-i',str(root/'public/beta/hero-field.mp4'),'-i',str(root/'public/beta/hero-app.mp4')]
for i in range(len(phases)):args+=['-loop','1','-framerate','24','-i',str(work/f'chapter-{i+1}.png')]
graph=['[0:v]setpts=PTS/0.8,fps=24,scale=1280:720,boxblur=3:1,eq=brightness=-0.15:saturation=0.55,drawbox=color=0x101c29@0.75:t=fill[bg]']
last='bg'
for i, phase in enumerate(phases):
    end=phases[i+1]['at'] if i+1<len(phases) else duration
    start=0 if i==0 else phase['at']
    graph.append(f'[{last}][{i+2}:v]overlay=0:0:enable=\'gte(t,{start})*lt(t,{end})\'[p{i}]');last=f'p{i}'
graph+=['[1:v]fps=24,scale=312:624,setsar=1[app]',f'[{last}][app]overlay=855:48,format=yuv420p[out]']
args+=['-filter_complex',';'.join(graph),'-map','[out]','-t',str(duration),'-an','-map_metadata','-1','-c:v','libx264','-preset','slow','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(output)]
subprocess.run(args,check=True)
print(json.dumps({'duration':duration,'phases':phases,'output':str(output)},indent=2))
