import wave,struct,math,random
random.seed(7);R=22050;O='public/play/'
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
    # Original folksy waltz (3/4) in G major: 25% pulse lead, triangle bass, soft shaker.
    def hz(n): return 440*2**((n-69)/12)
    G,A,B,C,D,E,Fs=67,69,71,72,74,76,66
    mel=[[D,B,G],[A,B,C],[B,G,D-12+12],[E,D,0],[C,E,G+12-12],[Fs,A,D],[G,B,D],[D,0,0],
         [G,A,B],[C,B,A],[B,D,G],[E,C,A],[D,B,G],[A,Fs,D],[G,G,0],[0,0,0]]
    bass=[43,48,43,48,48,50,43,50,43,48,43,45,43,50,43,43]
    beat=60/112;out=[]
    for rep in range(2):
        for bar in range(16):
            for bt in range(3):
                n=int(R*beat);note=mel[bar][bt];bn=bass[bar] if bt==0 else bass[bar]+(7 if bt==1 else 12)
                fl=hz(note) if note else 0;fb=hz(bn)
                for i in range(n):
                    t=i/R;v=0
                    if fl: v+=.22*(1 if (t*fl)%1<.25 else -1)*math.exp(-t*2.2)*(1+.05*math.sin(2*math.pi*5*t))
                    ph=(t*fb)%1;v+=.3*(4*abs(ph-.5)-1)*(1 if bt==0 else .6)*math.exp(-t*1.5)
                    if t<.04: v+=.08*random.uniform(-1,1)*(1-t/.04)
                    out.append(v)
    return out
save('punch.wav',punch());save('gobble.wav',gobble())
save('powerup_spawn.wav',sweep(300,1200,.25,'sin'));save('powerup_pickup.wav',arp([523,659,784,1047],.06))
save('welcome_message.wav',welcome());save('background_music.wav',music())
