"""Extract real PNG game assets from the approved 2D sprite and tile references.

No generated pose is advertised as an independent rig: the output contains four
artist-provided walk frames per direction and one idle pose per direction.
Crop/alpha cleanup and tile seam blending are deterministic and reproducible.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'source-art'
OUT = ROOT / 'public' / 'assets'
OUT.mkdir(parents=True, exist_ok=True)

char = Image.open(SRC / 'chibi-character-sheet.webp').convert('RGBA')
world = Image.open(SRC / 'woodland-tileset-sheet.webp').convert('RGBA')


def keep_largest_component(img: Image.Image, minimum=40, dilation=3) -> Image.Image:
    """Drop disconnected compression halos outside one sprite, preserve AA."""
    arr=np.array(img)
    strong=(arr[:,:,3]>minimum).astype('uint8')
    count, lbl, stats, _ = cv2.connectedComponentsWithStats(strong,8)
    if count < 2:
        return img
    main=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]); mask=np.uint8(lbl==main)*255
    if dilation:
        mask=cv2.dilate(mask,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(dilation*2+1,dilation*2+1)))
    arr[:,:,3]=np.minimum(arr[:,:,3],mask)
    # Very dim single-pixel outliers are not useful runtime image pixels.
    arr[arr[:,:,3]<18,3]=0
    return Image.fromarray(arr,'RGBA')


def crop_character(row:int, col:int) -> tuple[Image.Image,tuple[int,int,int,int]]:
    # Source grid 4 x 4 with actual frame space wider than silhouette.
    unit=char.width/4
    x0=round(col*unit);y0=round(row*(char.height/4))
    x1=round((col+1)*unit);y1=round((row+1)*(char.height/4))
    piece=char.crop((x0,y0,x1,y1))
    piece=keep_largest_component(piece,minimum=55,dilation=2)
    a=np.asarray(piece)[:,:,3]
    ys,xs=np.where(a>35)
    b=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))
    return piece.crop(b),b

CELL=(256,320)
rows=['down','left','right','up']
walk=Image.new('RGBA',(CELL[0]*4,CELL[1]*4))
idle=Image.new('RGBA',(CELL[0],CELL[1]*4))
for r,face in enumerate(rows):
    for col in range(4):
        sprite,bbox=crop_character(r,col)
        if sprite.width > 243 or sprite.height>307:
            raise ValueError(f'Character crop too large for frame: {face} {col} {sprite.size}')
        # Equal ground-line at y=296; torso stays anchored without per-frame sprite wobble.
        px=(CELL[0]-sprite.width)//2
        py=296-sprite.height
        walk.alpha_composite(sprite,(col*CELL[0]+px,r*CELL[1]+py))
        if col == 0:
            idle.alpha_composite(sprite,(px,r*CELL[1]+py))
walk.save(OUT/'liora-walk.png', optimize=True)
idle.save(OUT/'liora-idle.png', optimize=True)
# Portrait is the canonical idle sprite, kept at its true original resolution.
portrait, _=crop_character(0,0)
portrait.save(OUT/'liora-portrait.png', optimize=True)

# Derived from the accepted painting's terrain panels. These are seamless
# texture patches, not AI gameplay screenshots or unedited sheet thumbnails.
raw=np.asarray(world.convert('RGB'))

def seamless_texture(box:tuple[int,int,int,int],out_size:int=128,edge=18,variant=0):
    tile=Image.fromarray(raw[box[1]:box[3],box[0]:box[2]],'RGB')
    tile=ImageOps.fit(tile,(out_size,out_size),Image.Resampling.LANCZOS)
    a=np.asarray(tile).astype('float32').copy()
    # Symmetric blending forces matching pixels at opposing edges.
    for offset in range(edge):
        weight=((edge-offset)/edge)**2 * .90
        l=a[:,offset,:].copy();rr=a[:,out_size-1-offset,:].copy()
        mid=(l+rr)/2
        a[:,offset,:]=l*(1-weight)+mid*weight
        a[:,out_size-1-offset,:]=rr*(1-weight)+mid*weight
    for offset in range(edge):
        weight=((edge-offset)/edge)**2 * .90
        top=a[offset,:,:].copy();bottom=a[out_size-1-offset,:,:].copy()
        mid=(top+bottom)/2
        a[offset,:,:]=top*(1-weight)+mid*weight
        a[out_size-1-offset,:,:]=bottom*(1-weight)+mid*weight
    # Exact matching first/last rows/columns is critical for repeating at 64px.
    avg=((a[:,0,:]+a[:,-1,:])/2)
    a[:,0,:]=avg;a[:,-1,:]=avg
    avg=((a[0,:,:]+a[-1,:,:])/2)
    a[0,:,:]=avg;a[-1,:,:]=avg
    return Image.fromarray(np.uint8(np.clip(a,0,255)),'RGB')

grass_boxes=[(64,60,225,221),(81,77,242,238),(282,57,444,219),(289,67,451,229)]
path_boxes=[(756,62,886,192),(760,80,890,210),(762,65,892,195),(758,74,888,204)]
def unify_border(variant: Image.Image, base: Image.Image, strength=.82) -> Image.Image:
    a=np.asarray(variant).astype('float32')
    b=np.asarray(base).astype('float32')
    x=np.sin(np.linspace(0,np.pi,a.shape[1]))**1.25
    y=np.sin(np.linspace(0,np.pi,a.shape[0]))**1.25
    w=(y[:,None]*x[None,:]*strength)[:,:,None]
    return Image.fromarray(np.uint8(np.clip(b*(1-w)+a*w,0,255)),'RGB')

grassbase=seamless_texture(grass_boxes[0])
pathbase=seamless_texture(path_boxes[0])
for i,b in enumerate(grass_boxes):
    im=grassbase if i==0 else unify_border(seamless_texture(b),grassbase,strength=.66 if i>1 else .78)
    im.save(OUT/f'grass-{i}.png',optimize=True)
for i,b in enumerate(path_boxes):
    im=pathbase if i==0 else unify_border(seamless_texture(b),pathbase,strength=.72)
    im.save(OUT/f'path-{i}.png',optimize=True)

# Organic source-based terrain transitions, authored as separate transparent
# ground-edge tiles. The underlying world collision and path layout stay fixed.
ground_rgb=np.asarray(grassbase.convert('RGB'))
N=128
for side in ['top','bottom','left','right']:
    yy,xx=np.mgrid[:N,:N]
    dist={'top':yy,'bottom':N-1-yy,'left':xx,'right':N-1-xx}[side].astype('float32')
    along=xx if side in ('top','bottom') else yy
    wave=2.6*np.sin((along+11)*.16)+2.3*np.sin((along+29)*.37)+1.4*np.sin((along+83)*.61)
    reach=10+wave
    alpha=np.clip((reach-dist)/4.0,0,1)**1.1
    rgba=np.dstack([ground_rgb,np.uint8(alpha*255)]).astype('uint8')
    Image.fromarray(rgba,'RGBA').save(OUT/f'path-edge-{side}.png',optimize=True)

# Separate props from the almost-white sheet using color-distance/brightness.
# No background rectangles: prop files are transparent RGBA with true silhouettes.
def prop(box, output_size=None, blur=.75, trim=True):
    im=world.crop(box).convert('RGBA')
    rgb=np.asarray(im.convert('RGB')).astype('float32')
    # Background is near-white/offwhite; darks and saturated hues are foreground.
    light=np.min(rgb,axis=2)
    chroma=np.max(rgb,axis=2)-np.min(rgb,axis=2)
    dist=np.sqrt(((255-rgb)**2).sum(axis=2))
    # High color difference for dark leaves, blue rocks, pink blossoms etc.
    signal=np.maximum(dist-42,chroma*1.2-35)
    signal=(signal/49).clip(0,1)
    mask=(signal>0.18).astype('uint8')
    count,labels,stats,_=cv2.connectedComponentsWithStats(mask,8)
    if count>1:
        big=np.uint8(np.zeros_like(mask))
        for comp in range(1,count):
            if stats[comp,cv2.CC_STAT_AREA]>160:
                big[labels==comp]=255
        mask=cv2.morphologyEx(big,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
        # Fill small interior holes from the generated background texture.
        n,_lab,_stats,_=cv2.connectedComponentsWithStats(np.uint8(mask==0),8)
        cv2.floodFill(mask,np.zeros((mask.shape[0]+2,mask.shape[1]+2),np.uint8),(0,0),77)
        # original connected foreground remains 255; inverse boundaries <=77.
        mask=np.uint8(mask>200)*255
    if blur:
        mask=cv2.GaussianBlur(mask,(3,3),blur)
    orig_alpha=np.asarray(im)[:,:,3].astype('float32')
    aa=np.minimum(mask.astype('float32'),orig_alpha/249*255)
    # Edges from background are blended using estimated coverage.
    signal_cov=np.clip(signal*1.8,0,1)
    aa=aa * np.maximum(signal_cov,.20)
    arr=np.asarray(im).copy();arr[:,:,3]=np.uint8(aa)
    res=Image.fromarray(arr,'RGBA')
    if trim:
        bbox=res.getbbox()
        if bbox:res=res.crop(bbox)
    if output_size:
        res.thumbnail(output_size,Image.Resampling.LANCZOS)
    return res

# These boxes intentionally avoid neighboring panels and prop silhouettes.
canopy=prop((491,539,722,778),output_size=(222,206))
stump=prop((983,620,1168,761),output_size=(146,147))
# Compose a full tree; the trunk is deliberately partly hidden behind foliage.
tree=Image.new('RGBA',(260,320))
tree.alpha_composite(stump,((260-stump.width)//2,320-stump.height-1))
tree.alpha_composite(canopy,((260-canopy.width)//2,24))
tree.save(OUT/'oak-tree.png',optimize=True)

bush=prop((950,300,1166,516),output_size=(168,158))
bush.save(OUT/'bush.png',optimize=True)
flowers=prop((720,305,927,514),output_size=(134,117))
flowers.save(OUT/'wildflowers.png',optimize=True)
stone=prop((260,549,479,756),output_size=(168,144))
stone.save(OUT/'stone.png',optimize=True)

# Extras for future map decoration; intentionally not spawned until approved.
for box,filename,size in [
    ((31,812,245,1022),'fence.png',(180,160)),
    ((735,774,949,1035),'moon-lantern.png',(154,188)),
    ((1180,792,1387,1032),'signpost.png',(162,168)),
    ((692,548,938,785),'cherry-canopy.png',(204,184))
]:
    prop(box,output_size=size).save(OUT/filename,optimize=True)

manifest={
    'schemaVersion':2,
    'character':{
        'id':'liora-001','name':'Liora',
        'description':'Moonlit wayfinder: dark violet hair, golden crescent ornament, white flower, lilac-and-gold travel outfit',
        'directions':rows,'frame':{'width':CELL[0],'height':CELL[1],'pivot':[128,296]},
        'clips':{'idle':{'file':'liora-idle.png','frames':1,'fps':1},'walk':{'file':'liora-walk.png','frames':4,'fps':8}},
        'animationType':'authored four-frame sprite sequence extracted from approved character sheet',
        'status':'asset-replacement-for-review',
        'source':'source-art/chibi-character-sheet.png'
    },
    'world':{
        'tileSize':64,'width':38,'height':30,'seed':1108,
        'ground':[f'grass-{i}.png' for i in range(4)],
        'path':[f'path-{i}.png' for i in range(4)],
        'edges':[f'path-edge-{direction}.png' for direction in ['top','bottom','left','right']],
        'props':['oak-tree.png','bush.png','wildflowers.png','stone.png'],
        'source':'source-art/woodland-tileset-sheet.png'
    }
}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Created:',[(p.name,round(p.stat().st_size/1024)) for p in sorted(OUT.glob('*.png'))])
