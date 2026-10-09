import wave,struct,math,random
random.seed(7);R=22050;O='./'
def save(n,s):
    w=wave.open(O+n,'w');w.setnchannels(1);w.setsampwidth(2);w.setframerate(R)
    w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*30000)) for v in s));w.close()
def env(i,n,a=.01,r=.5): t=i/R;return min(1,t/a)*max(0,1-i/n)**(1/r if r else 1)
def punch():
    n=int(R*.25);out=[];lp=0
    for i in range(n):
        t=i/R;f=120*math.exp(-t*18)+40;lp=lp*.7+random.uniform(-1,1)*.3
        out.append((.8*math.sin(2*math.pi*f*t)+.6*lp*math.exp(-t*30))*math.exp(-t*12))
    return out
def gobble():
    out=[]
    for k in range(6):
        n=int(R*.07);f0=random.uniform(500,700)
        for i in range(n):
            t=i/R;f=f0+250*math.sin(2*math.pi*35*t)
            v=math.sin(2*math.pi*f*t)+.4*math.sin(4*math.pi*f*t)
            out.append(.5*v*math.sin(math.pi*i/n))
        out+= [0]*int(R*.015)
    return out
def sweep(f1,f2,d,wave_='sq'):
    n=int(R*d);out=[];ph=0
    for i in range(n):
        f=f1*(f2/f1)**(i/n);ph+=f/R
        v=(1 if (ph%1)<.5 else -1) if wave_=='sq' else math.sin(2*math.pi*ph)
        out.append(.35*v*(1-i/n))
    return out
def arp(notes,d):
    out=[]
    for f in notes:
        n=int(R*d);out+=[.35*(1 if (i*f/R)%1<.5 else -1)*(1-i/n) for i in range(n)]
    return out
def welcome():
    # robotic 3-note fanfare + "power-up" chord
    return arp([262,330,392,523],.09)+[ .3*(math.sin(2*math.pi*523*i/R)+math.sin(2*math.pi*659*i/R)+math.sin(2*math.pi*784*i/R))/3*(1-i/(R*.6)) for i in range(int(R*.6))]
def music():
    bpm=132;b=60/bpm/2;out=[]
    bass=[55,55,65.4,49]*2;mel=[440,523,587,659,587,523,440,392]
    random.seed(3)
    for bar in range(16):
        root=bass[bar%8]
        for st in range(8):
            n=int(R*b)
            for i in range(n):
                t=i/R;e=math.exp(-t*8)
                v=.35*((t*root*2)%1*2-1)*.8
                if st%2==0: v+=.5*math.sin(2*math.pi*(60*math.exp(-t*30))*t)*math.exp(-t*20)  # kick
                if st%4==2: v+=.25*random.uniform(-1,1)*math.exp(-t*25)  # snare
                if bar>=4: v+=.15*(1 if (t*mel[(st+bar)%8])%1<.25 else -1)*e
                out.append(v*.6)
    return out
save('punch.wav',punch());save('gobble.wav',gobble())
save('powerup_spawn.wav',sweep(300,1200,.25,'sin'));save('powerup_pickup.wav',arp([523,659,784,1047],.06))
save('welcome_message.wav',welcome());save('background_music.wav',music())
