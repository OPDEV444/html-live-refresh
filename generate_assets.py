from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math, random, io, json
import cairosvg

ROOT=Path(__file__).parent
ASSETS=ROOT/'public'/'assets'
ASSETS.mkdir(parents=True, exist_ok=True)
random.seed(1108)

# Original character: Liora, a copper-haired woodland wayfinder. Vector source remains editable.
CHAR_W, CHAR_H=96,112


def leg(x, phase, side, facing, walk):
    s=math.sin(phase+(0 if side=='L' else math.pi)) if walk else 0
    bob=1.5*math.cos(phase*2) if walk else 0
    if facing in ('left','right'):
        swing = s*21 if walk else 0
        ox = 47 if side=='L' else 53
        boot_front = 'right' if facing=='right' else 'left'
        return f'''<g transform="translate({ox} {69+bob:.2f}) rotate({swing:.2f})">
        <path d="M-5 -1 L5 -1 L5 15 Q2 20 -4 18 Z" fill="#e5c4a0" stroke="#2c2a3b" stroke-width="2.5" />
        <path d="M-5 13 L5 13 L7 22 Q0 26 -8 22 L-8 17 Z" fill="#694651" stroke="#2c2a3b" stroke-width="2.5" />
        <path d="M-2 15 L4 16" stroke="#c49b8e" stroke-width="2" />
        </g>'''
    rise= s*3.2 if walk else 0
    hx=x + s*.9
    return f'''<g transform="translate({hx:.2f} {69+rise+bob:.2f})">
    <path d="M-5 0 L5 0 L5 15 Q0 18 -4 16 Z" fill="#e8c3a2" stroke="#2c2a3b" stroke-width="2.2" />
    <path d="M-5 13 L5 13 L6 21 Q0 25 -7 21 L-7 17 Z" fill="#62434c" stroke="#292738" stroke-width="2.4" />
    <path d="M-4 17 L4 17" stroke="#bc9291" stroke-width="1.7" />
    </g>'''


def arm(side, phase, facing, walk):
    s=math.sin(phase+(math.pi if side=='L' else 0)) if walk else 0
    swing=s*18
    if facing=='right':
        x,y=59,47;dx=1
    elif facing=='left':
        x,y=38,47;dx=-1
    else:
        x,y=(32 if side=='L' else 64),48;dx=(-1 if side=='L' else 1)
    return f'''<g transform="translate({x} {y}) rotate({-swing:.2f})">
    <path d="M-4 1 Q{dx*8} 4 {dx*7} 14 L{dx*5} 19 Q{dx*1} 21 -2 17 L-6 6 Z" fill="#e9cfb2" stroke="#2b2d3d" stroke-width="2.5" />
    <path d="M-5 1 L4 1 L{dx*8} 8 L-5 11 Z" fill="#2b7c80" stroke="#25384a" stroke-width="2.2" />
    <path d="M{dx*3} 10 L{dx*8} 10" stroke="#e9cb8f" stroke-width="2" />
    </g>'''


def body_svg(facing, frame, walk=False, idle=False):
    n=8 if walk else 4
    phase=(frame/n)*math.tau
    bob=(1.4*abs(math.sin(phase))) if walk else (0.55*math.sin(phase) if idle else 0)
    sway=(1.3*math.sin(phase)) if walk else 0
    hair_sway=(1.5*math.sin(phase-0.7) if walk else .25*math.sin(phase))
    side=facing in ('left','right')
    center=48
    leg_back=leg(43,phase,'L',facing,walk)
    leg_front=leg(54,phase,'R',facing,walk)
    arms_back=arm('L',phase,facing,walk)
    arms_front=arm('R',phase,facing,walk)
    if side:
        head=f'''<ellipse cx="48" cy="27" rx="21.5" ry="24" fill="#a95442" stroke="#2e2938" stroke-width="3" />
            <path d="M29 22 Q27 42 36 48 L39 39 Q42 51 50 49 Q59 46 63 38 L63 21Z" fill="#8b423b" stroke="#2d2938" stroke-width="2" />
            <ellipse cx="{49 if facing=='right' else 47}" cy="31" rx="18" ry="17.5" fill="#f6d5b9" stroke="#382e3e" stroke-width="2.3" />
            <ellipse cx="{58 if facing=='right' else 38}" cy="30" rx="3.5" ry="4.3" fill="#325f69" />
            <circle cx="{59 if facing=='right' else 37}" cy="28.4" r="1.25" fill="#fff5d8" />
            <path d="M38 12 Q44 6 55 13 Q69 15 67 31 Q63 23 58 19 Q52 17 47 24 Q42 27 32 30 L30 23Z" fill="#bd6950" stroke="#2b2938" stroke-width="2.4" />
            <path d="M36 19 Q44 11 54 14" stroke="#ed9f70" stroke-width="2.4" fill="none" />
            <path d="M{64 if facing=='right' else 32} 38 L{66 if facing=='right' else 30} 39" stroke="#a75961" stroke-width="1.5" />
            <path d="M48 5 L52 11 L45 13 Z" fill="#ffe6aa" stroke="#765242" stroke-width="1.4" />
            <path d="M35 13 Q40 7 44 7" fill="none" stroke="#faac79" stroke-width="2.1" />'''
    elif facing=='up':
        head=f'''<ellipse cx="48" cy="27" rx="23" ry="26" fill="#ac5744" stroke="#2f2838" stroke-width="3" />
            <path d="M27 21 Q22 40 34 49 Q40 47 43 51 Q49 55 54 50 Q68 54 70 39 L70 23 Q65 39 55 42 Q46 43 36 38Z" fill="#8e453e" stroke="#2f2838" stroke-width="2.3" />
            <path d="M29 19 Q39 7 47 10 Q56 10 67 19" stroke="#e48e6a" stroke-width="3" fill="none" />
            <path d="M39 8 Q46 -1 51 8" fill="#bc7055" stroke="#2f2838" stroke-width="1.8" />
            <path d="M41 43 L48 49 L55 43" fill="none" stroke="#f5b58b" stroke-width="1.5" />'''
    else:
        head=f'''<path d="M26 27 Q20 46 31 51 L36 44 Q43 54 48 49 Q58 55 64 46 L67 50 Q77 37 70 23Z" fill="#934c40" stroke="#2f293b" stroke-width="2.5" />
            <ellipse cx="48" cy="29" rx="20.5" ry="23" fill="#f8d7b9" stroke="#332c3b" stroke-width="2.5" />
            <ellipse cx="40.5" cy="34.7" rx="3.9" ry="5.2" fill="#346d78" stroke="#26384a" stroke-width="1" />
            <ellipse cx="55.5" cy="34.7" rx="3.9" ry="5.2" fill="#346d78" stroke="#26384a" stroke-width="1" />
            <circle cx="42" cy="32.5" r="1.25" fill="#fff9e8" /><circle cx="57" cy="32.5" r="1.25" fill="#fff9e8" />
            <path d="M44 42 Q48 45 52 42" fill="none" stroke="#b46a71" stroke-width="1.7" stroke-linecap="round" />
            <path d="M33 42 L37 44 M59 44 L63 42" stroke="#e99b92" stroke-width="1.8" />
            <path d="M28 22 Q25 6 42 7 Q49 1 58 7 Q73 7 69 23 L63 22 Q58 24 58 17 Q50 23 40 20 Q34 25 28 28Z" fill="#b45f4a" stroke="#2d2838" stroke-width="2.6" />
            <path d="M30 18 Q35 11 44 10 Q51 9 58 12" stroke="#eb9670" fill="none" stroke-width="2.3" stroke-linecap="round" />'''
    # shoulder cloak and hem are stable identities in each direction
    if facing=='up':
        torso=f'''<path d="M34 45 L62 45 L68 76 Q50 85 28 76Z" fill="#225d67" stroke="#2a2b3d" stroke-width="2.8" />
        <path d="M40 47 Q47 52 56 47 L63 72 Q48 78 33 72Z" fill="#39878b" />
        <path d="M34 74 Q48 81 63 73" stroke="#dbb16f" stroke-width="3" fill="none" />
        <path d="M44 50 L48 55 L52 50" fill="none" stroke="#e7c792" stroke-width="2.4" />'''
    else:
        torso=f'''<path d="M33 48 Q47 42 63 48 L66 72 L69 79 Q47 86 28 78 L31 67Z" fill="#f2d5a8" stroke="#2d293d" stroke-width="2.8" />
        <path d="M30 49 Q45 43 64 48 L62 59 Q48 64 34 58Z" fill="#338487" stroke="#29394b" stroke-width="2.5" />
        <path d="M31 64 Q48 68 65 64 L65 75 Q49 82 30 75Z" fill="#28757d" />
        <path d="M33 69 L63 69" stroke="#d3aa67" stroke-width="4.1" />
        <rect x="44.5" y="66.3" width="8" height="5.2" rx="1" fill="#f8d998" stroke="#705644" stroke-width="1.2" />
        <path d="M34 77 Q48 83 63 77" fill="none" stroke="#d5b075" stroke-width="3" />
        <path d="M49 53 L49 65" stroke="#f4e6bf" stroke-width="2" />'''
    scarf=f'''<path d="M33 46 Q47 51 61 45 L59 51 Q48 57 35 51Z" fill="#edb864" stroke="#5a4145" stroke-width="2" />
        <path d="M59 48 Q70 48 {66+hair_sway:.2f} 56 L60 63 L56 53Z" fill="#f2c57d" stroke="#5a4145" stroke-width="1.5" />'''
    satchel='' if facing=='up' else '<path d="M62 62 L72 61 L72 75 L62 76 Z" fill="#845544" stroke="#2e2b38" stroke-width="2"/><path d="M62 65 L72 65" stroke="#ebc67c" stroke-width="1.6" />'
    headband=f'''<path d="M31 16 Q48 6 66 16" stroke="#19494e" stroke-width="4.6" fill="none" />
        <path d="M45 6 L48 1 L51 6 L55 9 L48 13 L41 9 Z" fill="#e7bd6e" stroke="#504151" stroke-width="1.5" />'''
    if facing=='up':
        headband='<path d="M40 10 L48 5 L56 10" fill="none" stroke="#c79a5c" stroke-width="2" />'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="112" viewBox="0 0 96 112">
    <g transform="translate({sway:.2f} {-bob:.2f})">
      {leg_back}{leg_front}
      <path d="M34 53 Q27 69 27 75 Q48 89 69 75 Q67 63 61 52" fill="#306e73" stroke="#2c2a3b" stroke-width="2.3" opacity=".94" />
      {arms_back}{arms_front}
      {torso}
      {satchel}
      {scarf}
      <g transform="translate({hair_sway:.2f} 0)">{head}{headband}</g>
    </g>
    </svg>'''

order=['down','left','right','up']
walk=Image.new('RGBA',(CHAR_W*8,CHAR_H*4))
idle=Image.new('RGBA',(CHAR_W*4,CHAR_H*4))
for row,d in enumerate(order):
    for i in range(8):
        svg=body_svg(d,i,walk=True)
        if i==0:
            (ASSETS/f'liora-{d}-source.svg').write_text(svg)
        raw=cairosvg.svg2png(bytestring=svg.encode(),output_width=CHAR_W*2,output_height=CHAR_H*2)
        im=Image.open(io.BytesIO(raw)).convert('RGBA').resize((CHAR_W,CHAR_H),Image.Resampling.LANCZOS)
        walk.paste(im,(CHAR_W*i,CHAR_H*row))
    for i in range(4):
        svg=body_svg(d,i,idle=True)
        raw=cairosvg.svg2png(bytestring=svg.encode(),output_width=CHAR_W*2,output_height=CHAR_H*2)
        im=Image.open(io.BytesIO(raw)).convert('RGBA').resize((CHAR_W,CHAR_H),Image.Resampling.LANCZOS)
        idle.paste(im,(CHAR_W*i,CHAR_H*row))
walk.save(ASSETS/'liora-walk.png',optimize=True)
idle.save(ASSETS/'liora-idle.png',optimize=True)

# Tile textures: every tile is saved as real PNG; patterns are seeded and deterministic.
T=64
colors={
 'grass':(72,147,95),'dirt':(188,153,107),'stone':(135,137,151)
}
def light(c,k):return tuple(max(0,min(255,int(x+k))) for x in c)

def grass_tile(seed):
    r=random.Random(seed)
    im=Image.new('RGBA',(T,T),(*colors['grass'],255)); d=ImageDraw.Draw(im)
    for i in range(210):
        x,y=r.randrange(T),r.randrange(T)
        if i%3==0:
            col=r.choice([(58,125,76),(93,165,104),(110,176,105)])
            d.line((x,y,x+r.randint(-3,3),y-r.randint(1,4)),fill=col,width=1)
        else:
            col=r.choice([(66,137,87),(76,153,95),(86,157,100)])
            d.point((x,y),fill=col)
    for _ in range(4):
        x,y=r.randrange(4,58),r.randrange(4,58)
        d.line((x-2,y+3,x,y,x+2,y+3),fill=(40,115,68),width=1)
    return im

def dirt_tile(seed):
    r=random.Random(seed);im=Image.new('RGBA',(T,T),(*colors['dirt'],255));d=ImageDraw.Draw(im)
    for _ in range(220):
        x,y=r.randrange(T),r.randrange(T)
        col=r.choice([(169,132,91),(197,164,116),(211,176,122),(183,146,98)])
        d.point((x,y),fill=col)
    for i in range(18):
        x,y=r.randrange(6,58),r.randrange(4,60)
        d.ellipse((x,y,x+r.randrange(1,4),y+r.randrange(1,3)),fill=r.choice([(134,127,112),(218,187,141)]))
    return im

for i in range(4):
    grass_tile(177+i).save(ASSETS/f'grass-{i}.png')
    dirt_tile(404+i).save(ASSETS/f'path-{i}.png')

# Trees from individual layered natural shapes, transparent roots and readable foot anchor.
# 120x156 tall; ground collision at (60,147)
def tree_png():
    W,H=140,168; im=Image.new('RGBA',(W,H));d=ImageDraw.Draw(im)
    # Trunk behind canopy
    d.polygon([(61,101),(77,100),(82,150),(68,159),(57,151)],fill=(111,74,55,255))
    d.line((68,108,68,155),fill=(180,121,68),width=5)
    d.line((76,120,81,144),fill=(78,62,55),width=3)
    # layered dark outline foliage lobes
    lobes=[(35,76,26),(59,49,30),(88,65,29),(108,89,26),(46,105,31),(74,94,41),(101,108,27)]
    for x,y,rad in lobes:
        d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=(30,75,56,255))
    for x,y,rad in lobes:
        d.ellipse((x-rad+4,y-rad+3,x+rad-4,y+rad-5),fill=(41+rad//4,119+rad//3,72+rad//5,255))
    for x,y,rad in lobes[:6]:
        d.arc((x-rad+9,y-rad+8,x+rad-9,y+rad-13),200,319,fill=(118,181,106),width=3)
    for i in range(43):
        rnd=random.Random(401+i);x=rnd.randint(23,116);y=rnd.randint(23,118)
        if im.getpixel((x,y))[3]>0:
            d.ellipse((x,y,x+2,y+2),fill=rnd.choice([(118,174,102),(73,142,86),(177,195,119)]))
    return im

tree_png().save(ASSETS/'oak-tree.png',optimize=True)

def bush_png():
    im=Image.new('RGBA',(80,53));d=ImageDraw.Draw(im)
    d.ellipse((7,21,73,48),fill=(27,72,60))
    for x,y,r in [(20,26,17),(40,15,19),(60,26,16),(40,29,20)]:
        d.ellipse((x-r,y-r,x+r,y+r),fill=(38,110,70),outline=(31,80,65),width=2)
        d.arc((x-r+4,y-r+3,x+r-7,y+r-9),185,315,fill=(116,171,97),width=3)
    return im
bush_png().save(ASSETS/'bush.png')

def flower_png():
    im=Image.new('RGBA',(32,32)); d=ImageDraw.Draw(im)
    for x,y,color in [(10,14,'#f5c1d7'),(22,10,'#f9dba3'),(19,24,'#d9bfed')]:
        d.line((x,y+10,x,y+3),fill=(35,105,62),width=2)
        for a in range(4):
            t=a*math.pi/2
            px=x+math.cos(t)*3;py=y+math.sin(t)*3
            d.ellipse((px-2.3,py-2.3,px+2.3,py+2.3),fill=color)
        d.ellipse((x-1.5,y-1.5,x+1.5,y+1.5),fill='#f0ab52')
    return im
flower_png().save(ASSETS/'wildflowers.png')

def rock_png():
    im=Image.new('RGBA',(62,42));d=ImageDraw.Draw(im)
    d.ellipse((8,29,56,40),fill=(50,81,74,130))
    d.polygon([(8,31),(13,16),(30,6),(48,11),(56,29),(44,35),(18,34)],fill=(110,135,142),outline=(58,77,86))
    d.polygon([(13,17),(30,7),(37,16),(26,22),(12,29)],fill=(173,184,182))
    d.polygon([(37,16),(48,11),(56,29),(45,33),(28,23)],fill=(81,105,123))
    d.line((18,13,25,10),fill=(229,218,200),width=2)
    return im
rock_png().save(ASSETS/'stone.png')

metadata={
 'schemaVersion':1,
 'character':{'id':'liora-001','name':'Liora','description':'Original woodland wayfinder with copper bob, teal cloak, amber head ornament, cream tunic and boots','directions':order,'frame':{'width':96,'height':112,'pivot':[48,92]},'clips':{'idle':{'file':'liora-idle.png','frames':4,'fps':4},'walk':{'file':'liora-walk.png','frames':8,'fps':10}},'animationType':'independent vector-layer authored frames'},
 'world':{'tileSize':64,'width':38,'height':30,'seed':1108,'ground':['grass-0.png','grass-1.png','grass-2.png','grass-3.png'],'path':['path-0.png','path-1.png','path-2.png','path-3.png'],'props':['oak-tree.png','bush.png','wildflowers.png','stone.png']}
}
(ASSETS/'manifest.json').write_text(json.dumps(metadata,indent=2))
print('Assets:')
for p in ASSETS.glob('*'):
 print(p.name,p.stat().st_size)
