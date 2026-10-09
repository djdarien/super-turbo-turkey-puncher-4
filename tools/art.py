# Procedural autumn pixel art for Super Turbo Turkey Puncher 4. Run from repo root: python3 tools/art.py
import math,random
from PIL import Image,ImageDraw,ImageFont
O='public/play/'
B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def dith(x,y,t,c1,c2): return c2 if t*16>B4[y%4][x%4]+.5 else c1
def ramp(stops,t,x,y):
    t=max(0,min(.9999,t))*(len(stops)-1);i=int(t);return dith(x,y,t-i,stops[i],stops[i+1])
def up(im,k): return im.resize((im.width*k,im.height*k),Image.NEAREST)
def outline(im,col=(28,14,10,255)):
    px=im.load();w,h=im.size;pts=[]
    for y in range(h):
        for x in range(w):
            if px[x,y][3]==0 and any(0<=x+dx<w and 0<=y+dy<h and px[x+dx,y+dy][3]>0 for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): pts.append((x,y))
    for p in pts: px[p]=col
def shade_ellipse(px,cx,cy,rx,ry,stops,w,h,light=(-.6,-.7)):
    for y in range(int(cy-ry),int(cy+ry)+1):
        for x in range(int(cx-rx),int(cx+rx)+1):
            nx,ny=(x-cx)/rx,(y-cy)/ry;d=nx*nx+ny*ny
            if d<=1 and 0<=x<w and 0<=y<h:
                nz=math.sqrt(1-d);l=max(0,-(nx*light[0]+ny*light[1])*.7+nz*.6)
                px[x,y]=ramp(stops,1-l,x,y)+(255,)
SKY=[(24,12,30),(52,20,40),(110,34,40),(170,62,36),(222,120,48),(246,180,80)]
LEAF=[(70,18,14),(130,34,18),(186,70,22),(228,124,32),(246,184,64)]
WOOD=[(30,16,12),(58,30,18),(88,46,24),(120,66,34)]
RED=[(40,10,12),(84,20,20),(128,34,26),(160,52,34)]
HAY=[(70,46,16),(130,92,30),(190,146,54),(232,196,96)]
PUMP=[(70,22,8),(150,56,14),(214,102,22),(244,156,44),(252,206,110)]
def feast(im,px,d,W,H,title):
    # harvest table with cornucopia, pie and drumsticks (bottom right)
    tw=int(W*(.34 if title else .42));tx=W-tw-int(W*.03);ty=H-int(H*(.16 if not title else .2))
    for y in range(ty,H):
        for x in range(tx,tx+tw):
            px[x,y]=ramp(WOOD,.75-(y-ty)/(H-ty)*.6+((x-tx)%12==0)*-.3,x,y)+(255,)
    for x in range(tx,tx+tw):
        for y in range(ty,ty+3): px[x,y]=(214,190,150,255) if (x//3+y)%2 else (190,60,40,255)  # checked cloth edge
    r=max(4,int(H*.05));cx=tx+int(tw*.28);cy=ty-r+1
    # cornucopia horn: tapering curved cone
    for i in range(40):
        t=i/39;hx=cx-int(r*2.2*t);hy=cy-int(r*1.0*math.sin(t*2.6));rr=max(1,int(r*(1-t*.85)))
        shade_ellipse(px,hx,hy,rr,rr,[(70,40,14),(130,84,30),(190,136,60),(230,186,110)],W,H)
    for (ox,oy,c) in [(r*.9,-r*.2,PUMP),(r*1.6,r*.25,[(60,10,30),(120,20,60),(170,50,100)]),(r*.7,r*.5,[(90,10,10),(170,30,24),(220,70,50)]),(r*1.9,-r*.4,[(60,80,10),(110,140,30),(170,190,70)])]:
        shade_ellipse(px,cx+ox,cy+oy,r*.45,r*.4,c,W,H)
    # pie
    px_=tx+int(tw*.62);shade_ellipse(px,px_,ty-1,r*.9,r*.35,[(120,60,20),(190,110,40),(236,170,80)],W,H)
    shade_ellipse(px,px_,ty-2,r*.75,r*.25,[(150,70,20),(200,104,30)],W,H)
    # drumsticks
    for k in range(2):
        dx_=tx+int(tw*(.82+k*.08));shade_ellipse(px,dx_,ty-2,r*.35,r*.5,[(80,36,14),(150,80,30),(200,130,60)],W,H)
        d.line([dx_,ty-2-int(r*.5),dx_+1,ty-2-int(r*.9)],fill=(240,230,210,255))
def scene(W,H,seed,title=False):
    random.seed(seed);im=Image.new('RGBA',(W,H));px=im.load();d=ImageDraw.Draw(im)
    hz=int(H*.62)
    for y in range(hz):
        for x in range(W): px[x,y]=ramp(SKY,y/hz*1.05,x,y)+(255,)
    for _ in range(W//6):
        x,y=random.randrange(W),random.randrange(int(hz*.3));px[x,y]=(250,220,170,255)
    mx,my,mr=int(W*.74),int(hz*.32),int(H*.11)
    for y in range(my-mr*2,my+mr*2+1):
        for x in range(mx-mr*2,mx+mr*2+1):
            if not(0<=x<W and 0<=y<H): continue
            dd=((x-mx)**2+(y-my)**2)**.5
            if dd<=mr: px[x,y]=ramp([(255,232,160),(250,196,96),(220,140,60)],(dd/mr)**2*.9+((x*7+y*13)%11==0)*.2,x,y)+(255,)
            elif dd<=mr*1.5 and B4[y%4][x%4]<int(6*(1-(dd-mr)/(mr*.5))): px[x,y]=lerp(px[x,y],(255,200,110),.35)+(255,)
    for _ in range(5):
        cx,cy,cw=random.randrange(W),random.randrange(int(hz*.2),int(hz*.7)),random.randint(W//8,W//4)
        for x in range(cx-cw,cx+cw):
            for t in range(3):
                y=cy+t+int(2*math.sin(x*.1))
                if 0<=x<W and B4[y%4][x%4]<10-t*3: px[x,y]=lerp(px[x,y][:3],(90,30,50),.6)+(255,)
    for col,amp,base in [((60,22,36),H*.05,hz-H*.08),((40,16,26),H*.04,hz-H*.03)]:
        ph=random.random()*9
        for x in range(W):
            top=int(base-amp*(math.sin(x*.03+ph)*.6+math.sin(x*.011+ph*2)*.4))
            for y in range(top,hz+2): px[x,y]=col+(255,)
    bx,bw,bh=int(W*(.16 if not title else .08)),int(W*.12),int(H*.15);by=hz-bh
    for y in range(by,hz):
        for x in range(bx,bx+bw): px[x,y]=ramp(RED,.45+((x-bx)%5==0)*.5-.3*(x-bx)/bw,x,y)+(255,)
    roof=[(bx-3,by),(bx+bw//2,by-int(bh*.55)),(bx+bw+3,by)]
    d.polygon(roof,fill=(48,22,20,255));d.line(roof,fill=(160,150,130,255),width=1)
    dx0,dw=bx+bw//3,bw//3
    d.rectangle([dx0,by+bh//3,dx0+dw,hz],outline=(230,210,170,255),fill=RED[1]+(255,));d.line([dx0,by+bh//3,dx0+dw,hz],fill=(230,210,170,255));d.line([dx0+dw,by+bh//3,dx0,hz],fill=(230,210,170,255))
    d.rectangle([bx+bw//2-2,by-int(bh*.3),bx+bw//2+2,by-int(bh*.18)],fill=(240,190,90,255))
    sx=bx+bw+2;d.rectangle([sx,by-bh//3,sx+bw//4,hz],fill=(90,80,76,255));d.ellipse([sx,by-bh//3-4,sx+bw//4,by-bh//3+4],fill=(120,110,100,255))
    def tree(tx,base,s):
        for y in range(base-int(s*.9),base):
            for x in range(tx-1,tx+2):
                if 0<=x<W: px[x,y]=WOOD[1+(x==tx+1)]+(255,)
        d.line([tx,base-int(s*.6),tx-s//3,base-int(s*.85)],fill=WOOD[1]);d.line([tx,base-int(s*.55),tx+s//3,base-int(s*.8)],fill=WOOD[1])
        for _ in range(int(s*1.5)):
            a=random.random()*6.28;r=random.random()**.5*s*.55
            cx,cy=int(tx+math.cos(a)*r),int(base-s*.95+math.sin(a)*r*.75)
            shade_ellipse(px,cx,cy,max(2,s//8),max(2,s//10),LEAF,W,H)
    for i in range(7 if not title else 10):
        tx=random.randrange(W)
        if abs(tx-(bx+bw//2))<bw: continue
        tree(tx,hz+random.randint(0,3),random.randint(int(H*.12),int(H*.2)))
    for y in range(hz,H):
        t=(y-hz)/(H-hz)
        for x in range(W):
            row=int((y-hz)**1.2)%6<2
            px[x,y]=ramp([(34,18,12),(64,36,18),(96,58,26),(120,76,32)],.25+t*.5+(.25 if row else 0)-(.2 if (x+y*3)%17==0 else 0),x,y)+(255,)
    for x in range(0,W,3):
        h=random.randint(4,max(5,int(H*.06)));y0=hz+random.randint(0,4)
        for y in range(y0-h,y0): px[x,y]=random.choice(HAY[:3])+(255,)
        px[min(x+1,W-1),y0-h//2]=HAY[3]+(255,)
    for _ in range(4 if not title else 6):
        cx,cy=random.randrange(W),random.randint(int(hz+(H-hz)*.3),H-6);r=random.randint(int(H*.04),int(H*.06))
        shade_ellipse(px,cx,cy,r*1.3,r,HAY,W,H)
        for k in range(-r,r,3):
            for yy in range(cy-r+2,cy+r-2,4):
                if 0<=cx+k<W and 0<=yy<H: px[cx+k,yy]=HAY[0]+(255,)
    for _ in range(9 if not title else 12):
        cx,cy=random.randrange(W),random.randint(int(hz+(H-hz)*.2),H-3);r=max(3,random.randint(int(H*.015),int(H*.03)))
        for k in (-1,1,0): shade_ellipse(px,cx+k*r*.55,cy,r*.6,r*.8,PUMP,W,H)
        d.line([cx,cy-r,cx+1,cy-r-2],fill=(60,80,20,255),width=1)
    for _ in range(W//5):
        x,y=random.randrange(W-1),random.randrange(H);px[x,y]=random.choice(LEAF[1:])+(255,);px[x+1,y]=LEAF[0]+(255,)
    feast(im,px,d,W,H,title)
    for y in range(H):
        for x in range(W):
            v=((x/W-.5)**2+(y/H-.5)**2)*2.2
            if B4[y%4][x%4]<v*16-5: px[x,y]=lerp(px[x,y][:3],(14,6,8),.45)+(255,)
    return im.convert('RGB')
up(scene(256,200,11),4).save(O+'background.png')
up(scene(320,111,23,True),6).crop((3,0,1917,664)).save(O+'background_main.jpeg',quality=92)
def turkey():
    W,H=65,61;im=Image.new('RGBA',(W,H),(0,0,0,0));px=im.load();d=ImageDraw.Draw(im)
    TAIL=[[(60,24,14),(120,52,22),(176,96,40),(220,150,70)],[(48,30,20),(90,58,34),(140,96,56),(196,150,96)]]
    cx,cy=28,34
    for i in range(13):
        a=math.radians(198+i*12)
        for rr in range(6,27):
            for wv in range(-3,4):
                x=int(cx+rr*math.cos(a)+wv*-math.sin(a)*(rr/26));y=int(cy+rr*math.sin(a)*.95+wv*math.cos(a)*(rr/26))
                if 0<=x<W and 0<=y<H:
                    col=(240,220,180) if rr>23 else ramp(TAIL[(rr//4)%2],(rr/26)*.8+abs(wv)*.06,x,y)
                    px[x,y]=col+(255,)
    BODY=[(28,16,12),(56,32,20),(92,56,30),(130,84,44),(170,118,66)]
    shade_ellipse(px,30,42,15,13,BODY,W,H)
    for y in range(32,54,3):
        for x in range(18+(y%2)*2,44,4):
            if ((x-30)/15)**2+((y-42)/13)**2<.8: px[x,y]=BODY[0]+(255,);px[x+1,y]=BODY[1]+(255,)
    shade_ellipse(px,35,42,8,6,[(40,24,14),(80,48,26),(120,76,40),(176,130,80)],W,H)
    for k in range(4): d.line([30+k*3,46,33+k*3,48],fill=(30,18,12,255))
    shade_ellipse(px,45,30,4,8,BODY,W,H)
    shade_ellipse(px,48,21,6,6,[(70,90,120),(110,130,160),(160,176,196),(200,210,220)],W,H)
    px[50,19]=(255,255,255,255);px[51,19]=(10,10,10,255);px[50,20]=(10,10,10,255)
    d.polygon([(53,21),(58,23),(53,24)],fill=(232,170,50,255))
    for y in range(24,32): px[52+(y>27),y]=(200,30,30,255) if y%3 else (130,16,20,255)
    for lx in (25,34):
        for y in range(54,60): px[lx,y]=(214,140,40,255)
        d.line([lx-2,60,lx+2,60],fill=(214,140,40,255))
    # pilgrim hat
    d.rectangle([40,14,56,15],fill=(24,20,22,255))
    for y in range(3,14):
        for x in range(43+(y<6),54-(y<6)): px[x,y]=ramp([(20,18,20),(44,40,44),(70,64,70)],.2+(x-43)/22+(y<5)*.2,x,y)+(255,)
    d.rectangle([43,10,53,12],fill=(110,70,40,255))
    d.rectangle([46,9,50,13],outline=(240,200,80,255))
    outline(im);up(im,5).save(O+'turkey.png')
turkey()
def fist():
    W,H=80,100;im=Image.new('RGBA',(W,H),(0,0,0,0));px=im.load()
    GL=[(40,18,12),(84,40,22),(126,66,34),(168,100,52),(206,146,86)]
    CUF=[(30,30,34),(60,58,60),(96,90,86),(140,132,120)]
    def box(x0,y0,x1,y1,stops,r=4):
        for y in range(y0,y1):
            for x in range(x0,x1):
                ex=max(0,abs(x-(x0+x1)/2)-((x1-x0)/2-r));ey=max(0,abs(y-(y0+y1)/2)-((y1-y0)/2-r))
                if ex*ex+ey*ey<=r*r: px[x,y]=ramp(stops,.15+((x-x0)/(x1-x0)*.7+(y-y0)/(y1-y0)*.3)*.75,x,y)+(255,)
    box(22,66,58,99,CUF,3)
    for y in range(70,98,6):
        for x in range(23,57): px[x,y]=CUF[0]+(255,)
    box(14,30,64,72,GL,10)
    for i in range(4):
        box(14+i*12,14,27+i*12,40,GL,6)
        for x in range(16+i*12,25+i*12): px[x,22]=GL[4]+(255,)
        px[20+i*12,30]=GL[0]+(255,)
    box(4,40,22,62,GL,7)
    for y in range(44,60,2): px[13,y]=(230,210,170,255)
    for x in range(26,56,3): px[x,50]=(230,210,170,255)
    outline(im);up(im,5).save(O+'fist.png')
fist()
def chip(path,N,k,kind):
    im=Image.new('RGBA',(N,N),(0,0,0,0));px=im.load();d=ImageDraw.Draw(im);c=N/2;s=N/36
    ring={'stuffing':[(50,30,10),(150,110,50),(230,200,130)],'cranberry':[(50,10,20),(170,30,60),(255,140,160)],'gravy':[(40,24,10),(160,120,60),(250,230,170)],'acorn':[(60,40,10),(170,130,40),(250,220,120)],'pumpkin':[(70,20,10),(200,90,20),(255,190,90)],'pie':[(40,30,60),(110,140,200),(220,240,255)]}[kind]
    for y in range(N):
        for x in range(N):
            dd=((x-c+.5)**2+(y-c+.5)**2)**.5
            if dd<c-1: px[x,y]=(ramp(ring,1-((x+y)/(2*N)),x,y) if dd>c-4 else ramp([(30,16,10),(60,32,18)],dd/c,x,y))+(255,)
    if kind=='acorn':
        shade_ellipse(px,c,c+3*s,7*s,9*s,[(70,36,14),(140,80,30),(200,130,60),(240,190,110)],N,N)
        shade_ellipse(px,c,c-5*s,9*s,5*s,[(40,24,10),(90,60,30),(140,100,50)],N,N)
        for y in range(int(c-9*s),int(c-1*s),2):
            for x in range(int(c-8*s),int(c+8*s),3):
                if ((x-c)/(9*s))**2+((y-c+5*s)/(5*s))**2<1: px[x,y]=(40,24,10,255)
        d.line([c,c-10*s,c+2*s,c-13*s],fill=(70,40,16,255),width=max(1,int(s)))
    elif kind=='pumpkin':
        for kx in (-1,1,0): shade_ellipse(px,c+kx*5*s,c+2*s,6*s,9*s,PUMP,N,N)
        d.rectangle([c-1,c-10*s,c+1,c-6*s],fill=(60,90,20,255))
    elif kind=='stuffing':
        shade_ellipse(px,c,c+4*s,11*s,6*s,[(40,40,60),(90,100,130),(170,180,200),(230,235,240)],N,N)
        for _ in range(int(40*s*s)):
            x=int(c+random.uniform(-9,9)*s);y=int(c+random.uniform(-6,2)*s)
            px[x,y]=random.choice([(120,76,30),(176,120,50),(220,170,90),(80,120,30)])+(255,)
    elif kind=='cranberry':
        for (ox,oy) in [(-4,2),(4,2),(0,-4),(-1,5),(5,-3),(-5,-3)]:
            shade_ellipse(px,c+ox*s,c+oy*s,4*s,4*s,[(60,4,20),(150,16,40),(220,50,80),(255,170,180)],N,N)
        d.line([c,c-8*s,c+3*s,c-12*s],fill=(70,100,30,255));px[int(c+3*s),int(c-12*s)]=(110,160,50,255)
    elif kind=='gravy':
        shade_ellipse(px,c,c+3*s,10*s,6*s,[(60,60,70),(140,140,150),(210,210,220),(250,250,255)],N,N)
        shade_ellipse(px,c,c,9*s,2.5*s,[(90,50,20),(140,84,36),(170,110,50)],N,N)
        d.polygon([(c+9*s,c),(c+14*s,c-3*s),(c+9*s,c+3*s)],fill=(200,200,210,255))
        d.arc([c-14*s,c-3*s,c-6*s,c+7*s],90,270,fill=(200,200,210,255),width=max(1,int(s*1.5)))
    else:
        for y in range(N):
            for x in range(N):
                X,Y=x-c,y-c
                if abs(X)<=10*s and Y<=8*s and Y>=-4*s+abs(X)*0 and Y>=X*.6-4*s:
                    px[x,y]=ramp([(140,70,20),(200,120,40),(240,180,90)],1-(Y+4*s)/(12*s),x,y)+(255,)
        shade_ellipse(px,c-3*s,c-5*s,4*s,2.5*s,[(220,220,210),(255,250,240)],N,N)
    outline(im);up(im,k).save(path)
chip(O+'extrapoints.png',36,10,'pie')        # Pumpkin Pie: bonus points
chip(O+'slowtime.png',32,16,'stuffing')      # Stuffing: slow time
chip(O+'fasttime.png',36,10,'cranberry')     # Cranberry: fast time
chip(O+'gravy.png',36,10,'gravy')            # Gravy Boat: extra life
def logo():
    W,H=158,58;im=Image.new('RGBA',(W,H),(0,0,0,0));px=im.load()
    F=lambda sz:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',sz)
    def txt(y,s,sz,stops):
        f=F(sz);m=Image.new('L',(W,H),0);md=ImageDraw.Draw(m);md.fontmode='1'
        x=int((W-md.textlength(s,font=f))/2);md.text((x,y),s,font=f,fill=255);mp=m.load();bb=m.getbbox()
        for yy in range(H-1):
            for xx in range(W-1):
                if mp[xx,yy] and not mp[xx+1,yy+1]: px[xx+1,yy+1]=(50,16,10,255)
        for yy in range(H):
            for xx in range(W):
                if mp[xx,yy]: px[xx,yy]=ramp(stops,(yy-bb[1])/(bb[3]-bb[1]+1),xx,yy)+(255,)
    txt(3,'SUPER TURBO TURKEY',11,[(255,240,190),(240,190,70),(170,100,30)])
    txt(20,'PUNCHER 4',22,[(252,220,120),(244,160,50),(200,80,24),(130,36,18)])
    for (x,y) in [(4,50),(153,50),(79,54)]:
        for dx in range(-2,3):
            for dy in range(-2,3):
                if abs(dx)+abs(dy)<=2: px[x+dx,y+dy]=LEAF[2+((dx+dy)%2)]+(255,)
    outline(im,(24,10,8,255));up(im,4).crop((0,0,629,232)).save(O+'logo.png')
logo()

def banner():
    W,H=170,26;im=Image.new('RGBA',(W,H),(0,0,0,0));px=im.load();d=ImageDraw.Draw(im)
    d.polygon([(0,6),(14,6),(14,22),(0,22),(6,14)],fill=(120,30,20,255));d.polygon([(W-1,6),(W-15,6),(W-15,22),(W-1,22),(W-7,14)],fill=(120,30,20,255))
    for y in range(3,20):
        for x in range(10,W-10): px[x,y]=ramp([(120,30,20),(170,52,26),(210,84,34)],1-(y-3)/17,x,y)+(255,)
    for x in range(10,W-10): px[x,3]=(240,190,90,255);px[x,19]=(240,190,90,255)
    m=Image.new('L',(W,H),0);md=ImageDraw.Draw(m);md.fontmode='1';f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',11)
    t='HAPPY THANKSGIVING';x=int((W-md.textlength(t,font=f))/2);md.text((x,4),t,font=f,fill=255);mp=m.load()
    for y in range(H):
        for x in range(W):
            if mp[x,y]:
                if y+1<H and not mp[x,y+1]: px[x,y+1]=(60,14,8,255)
                px[x,y]=(255,236,170,255)
    outline(im,(30,10,6,255));up(im,4).save(O+'banner.png')
banner()
