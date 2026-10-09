import math,random
from PIL import Image,ImageDraw,ImageFilter,ImageFont
random.seed(42)
O='./'
def font(s):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
        try: return ImageFont.truetype(p,s)
        except: pass
    return ImageFont.load_default()
def grit(im,n,a=30):
    px=im.load();w,h=im.size
    for _ in range(n):
        x,y=random.randrange(w),random.randrange(h);p=px[x,y]
        d=random.randint(-a,a);px[x,y]=tuple(max(0,min(255,c+d)) for c in p[:3])+tuple(p[3:])
def scifi_bg(w,h):
    im=Image.new('RGB',(w,h));d=ImageDraw.Draw(im)
    for y in range(h):
        t=y/h;d.line([(0,y),(w,y)],fill=(int(10+20*t),int(14+10*t),int(30+25*(1-t))))
    # stars
    for _ in range(w*h//900):
        x,y=random.randrange(w),random.randrange(int(h*.55));c=random.randint(120,255);d.point((x,y),fill=(c,c,min(255,c+30)))
    # ringed planet
    cx,cy,r=int(w*.78),int(h*.22),int(h*.13)
    for i in range(r,0,-1):
        k=i/r;d.ellipse([cx-i,cy-i,cx+i,cy+i],fill=(int(160-90*k),int(60+40*(1-k)),int(150-30*k)))
    d.ellipse([cx-r*2.1,cy-r*.35,cx+r*2.1,cy+r*.35],outline=(220,170,90),width=max(2,r//10))
    # perspective grid floor
    hz=int(h*.58);d.rectangle([0,hz,w,h],fill=(12,6,22))
    for i in range(-20,21):
        d.line([(w/2+i*w*.02,hz),(w/2+i*w*.18,h)],fill=(0,200,190),width=1)
    y=hz;s=3
    while y<h: d.line([(0,y),(w,y)],fill=(0,170,160),width=1);s*=1.35;y+=s
    # skyline / station silhouettes
    x=0
    while x<w:
        bw=random.randint(w//30,w//12);bh=random.randint(h//14,h//4)
        d.rectangle([x,hz-bh,x+bw,hz],fill=(18,18,28))
        for wy in range(hz-bh+6,hz-4,9):
            for wx in range(x+4,x+bw-4,8):
                if random.random()<.3: d.rectangle([wx,wy,wx+3,wy+3],fill=random.choice([(255,140,40),(0,230,220),(255,60,90)]))
        x+=bw+random.randint(2,w//40)
    d.line([(0,hz),(w,hz)],fill=(255,80,140),width=2)
    grit(im,w*h//6,22)
    # scanlines
    sl=Image.new('RGBA',(w,h),(0,0,0,0));sd=ImageDraw.Draw(sl)
    for y in range(0,h,3): sd.line([(0,y),(w,y)],fill=(0,0,0,55))
    im=im.convert('RGBA');im.alpha_composite(sl);return im.convert('RGB')
scifi_bg(1024,800).save(O+'background.png')
t=scifi_bg(1914,664);t.save(O+'background_main.jpeg',quality=88)
# title logo
def logo(text1,text2,path):
    W,H=629,232;im=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(im)
    f1=font(64);f2=font(40)
    def ctext(y,s,f,fill):
        bw=d.textlength(s,font=f);x=(W-bw)/2
        for o in range(6,0,-1): d.text((x+o,y+o),s,font=f,fill=(60,0,40,255))
        d.text((x,y),s,font=f,fill=fill,stroke_width=3,stroke_fill=(10,10,20,255))
    d.polygon([(20,H-40),(W-20,H-40),(W-50,H-10),(50,H-10)],fill=(0,200,190,255))
    ctext(18,text1,f1,(255,150,30,255));ctext(110,text2,f2,(0,240,230,255))
    im.save(path)
logo('TURKEY PUNCH','T U R B O',O+'logo.png')
# turkey sprite 325x305: chunky robo-turkey
def turkey():
    W,H=325,305;S=2;im=Image.new('RGBA',(W*S,H*S),(0,0,0,0));d=ImageDraw.Draw(im)
    s=lambda b:[v*S for v in b]
    cols=[(200,60,40),(240,150,30),(0,200,190),(160,40,120),(240,200,60)]
    for i in range(9):
        a=math.radians(200+i*17.5);cx,cy=170,170
        x,y=cx+150*math.cos(a),cy+150*math.sin(a)
        d.polygon(s([cx-14,cy,x-18,y,x+18,y,cx+14,cy]),fill=cols[i%5]+(255,),outline=(20,10,20,255))
    d.ellipse(s([85,110,255,280]),fill=(110,70,50,255),outline=(20,10,20,255),width=6)
    d.ellipse(s([115,150,225,260]),fill=(150,100,70,255))
    d.rectangle(s([120,175,220,190]),fill=(90,90,110,255))  # metal belt
    for x in range(126,220,16): d.ellipse(s([x,178,x+8,186]),fill=(0,240,230,255))
    d.ellipse(s([128,40,212,124]),fill=(140,90,60,255),outline=(20,10,20,255),width=6)
    d.rectangle(s([138,62,202,82]),fill=(30,30,40,255))  # visor
    d.rectangle(s([142,66,198,78]),fill=(255,60,90,255))
    d.polygon(s([165,88,190,96,165,104]),fill=(250,190,40,255))
    d.ellipse(s([150,98,166,132]),fill=(220,30,40,255))
    for x in (130,190): d.line(s([x,275,x,298]),fill=(240,170,40,255),width=7*S)
    im=im.resize((W,H),Image.LANCZOS);im.save(O+'turkey.png')
turkey()
def orb(path,size,core,glyph):
    S=2;W=size*S;im=Image.new('RGBA',(W,W),(0,0,0,0));d=ImageDraw.Draw(im)
    c=W//2
    for i in range(c,0,-2):
        a=int(255*(1-i/c)**1.2);d.ellipse([c-i,c-i,c+i,c+i],fill=core+(a,))
    # hexagonal frame
    r=c*.86;pts=[(c+r*math.cos(math.radians(60*k+30)),c+r*math.sin(math.radians(60*k+30))) for k in range(6)]
    d.polygon(pts,outline=(230,230,240,255),width=8*S)
    r2=c*.62;pts=[(c+r2*math.cos(math.radians(60*k+30)),c+r2*math.sin(math.radians(60*k+30))) for k in range(6)]
    d.polygon(pts,fill=(20,20,30,230))
    f=font(int(W*.3));bw=d.textlength(glyph,font=f);d.text((c-bw/2,c-W*.18),glyph,font=f,fill=core+(255,),stroke_width=3,stroke_fill=(255,255,255,255))
    im.resize((size,size),Image.LANCZOS).save(path)
orb(O+'extrapoints.png',360,(255,170,20),'+$')
orb(O+'slowtime.png',512,(0,200,255),'<<')
orb(O+'fasttime.png',360,(255,50,90),'>>')
# fist: robotic gauntlet seen from behind/top, 802x1000 originally -> keep aspect, smaller file
def fist():
    W,H=401,500;S=2;im=Image.new('RGBA',(W*S,H*S),(0,0,0,0));d=ImageDraw.Draw(im)
    s=lambda b:[v*S for v in b]
    d.rounded_rectangle(s([130,300,280,495]),radius=20*S,fill=(70,75,90,255),outline=(15,15,20,255),width=6*S)
    for y in range(320,490,30): d.line(s([135,y,275,y]),fill=(40,40,50,255),width=4*S)
    d.rounded_rectangle(s([60,90,340,330]),radius=60*S,fill=(120,125,140,255),outline=(15,15,20,255),width=8*S)
    for i,x in enumerate(range(70,330,66)):
        d.rounded_rectangle(s([x,40,x+60,170]),radius=24*S,fill=(150,155,170,255),outline=(15,15,20,255),width=6*S)
        d.ellipse(s([x+18,70,x+42,94]),fill=(255,140,30,255))
    d.rounded_rectangle(s([20,170,110,290]),radius=30*S,fill=(140,145,160,255),outline=(15,15,20,255),width=6*S)
    d.rectangle(s([120,230,280,250]),fill=(0,230,220,255))
    im=im.resize((W,H),Image.LANCZOS);grit(im,4000,15);im.save(O+'fist.png')
fist()
