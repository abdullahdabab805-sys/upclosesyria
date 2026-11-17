import math
G="#0B4836"; C="#B5713A"
def svg(w,h,body): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none">{body}</svg>'
def star(cx,cy,R,r,n,rot=0):
    pts=[]
    for i in range(2*n):
        a=math.radians(rot)+i*math.pi/n; rr=R if i%2==0 else r
        pts.append(f"{cx+rr*math.sin(a):.2f},{cy-rr*math.cos(a):.2f}")
    return " ".join(pts)
def w(name,s): open(f"assets/{name}.svg","w").write(s)
# khatam: star and cross
def khatam(col):
    T=96;R=T/2;r=R*0.7654;b=""
    b+=f'<polygon points="{star(48,48,R,r,8)}" stroke="{col}" stroke-width="1.6"/>'
    b+=f'<polygon points="{star(48,48,R*0.56,R*0.56*0.7654,8,22.5)}" stroke="{col}" stroke-width="1.2"/>'
    b+=f'<circle cx="48" cy="48" r="5" stroke="{col}" stroke-width="1.2"/><circle cx="48" cy="48" r="1.6" fill="{col}"/>'
    for x,y in [(0,0),(96,0),(0,96),(96,96)]:
        b+=f'<rect x="{x-7}" y="{y-7}" width="14" height="14" transform="rotate(45 {x} {y})" stroke="{col}" stroke-width="1.2"/>'
    return svg(T,T,b)
w("khatam-g",khatam(G)); w("khatam-c",khatam(C))
# sadaf: kagome marquetry
a=20; W=2*a; H=round(2*a*math.sqrt(3),2); b=""
d0=math.sqrt(3)*a/2
for th in (0,60,120):
    t=math.radians(th); nx,ny=-math.sin(t),math.cos(t); dx,dy=math.cos(t),math.sin(t)
    for k in range(-6,6):
        d=d0*(2*k+1); px,py=W/2+nx*d,H/2+ny*d
        b+=f'<line x1="{px-dx*200:.2f}" y1="{py-dy*200:.2f}" x2="{px+dx*200:.2f}" y2="{py+dy*200:.2f}" stroke="{G}" stroke-width="1.1"/>'
b+=f'<circle cx="{W/2}" cy="{H/2}" r="4" fill="{C}"/><circle cx="0" cy="0" r="4" fill="{C}"/><circle cx="{W}" cy="0" r="4" fill="{C}"/><circle cx="0" cy="{H}" r="4" fill="{C}"/><circle cx="{W}" cy="{H}" r="4" fill="{C}"/>'
w("sadaf",svg(W,H,b))
# mashrabiya
b=""
for x,y in [(20,20),(0,0),(40,0),(0,40),(40,40)]:
    b+=f'<circle cx="{x}" cy="{y}" r="5.5" stroke="{G}" stroke-width="1.4"/><circle cx="{x}" cy="{y}" r="1.8" fill="{G}"/>'
for x1,y1,x2,y2 in [(4,4,16,16),(36,4,24,16),(4,36,16,24),(36,36,24,24)]:
    b+=f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{G}" stroke-width="2.2"/>'
for x,y in [(20,0),(0,20),(40,20),(20,40)]:
    b+=f'<circle cx="{x}" cy="{y}" r="2.4" stroke="{G}" stroke-width="1.1"/>'
w("mashrabiya",svg(40,40,b))
# brocade ogee
b=f'<path d="M32 0C56 16 64 32 64 48C64 64 56 80 32 96C8 80 0 64 0 48C0 32 8 16 32 0Z" stroke="{C}" stroke-width="1.4"/>'
b+=f'<path d="M32 14C48 26 54 36 54 48C54 60 48 70 32 82C16 70 10 60 10 48C10 36 16 26 32 14Z" stroke="{C}" stroke-width=".8"/>'
for i in range(8):
    b+=f'<ellipse cx="32" cy="38" rx="3.2" ry="9" transform="rotate({i*45} 32 48)" stroke="{C}" stroke-width="1.1"/>'
b+=f'<circle cx="32" cy="48" r="3" fill="{C}"/>'
for x,y in [(0,0),(64,0),(0,96),(64,96)]:
    b+=f'<circle cx="{x}" cy="{y}" r="4" stroke="{C}" stroke-width="1.1"/><circle cx="{x}" cy="{y}" r="1.3" fill="{C}"/>'
w("brocade",svg(64,96,b))
# vine band
b=f'<path d="M0 22C20 2 40 2 60 22S100 42 120 22" stroke="{C}" stroke-width="1.6"/>'
b+=f'<path d="M30 8C22 -2 10 4 14 12C17 18 26 16 25 10" stroke="{C}" stroke-width="1.2"/>'
b+=f'<path d="M90 36C98 46 110 40 106 32C103 26 94 28 95 34" stroke="{C}" stroke-width="1.2"/>'
b+=f'<path d="M44 9C52 6 58 10 58 18C50 20 45 16 44 9Z" fill="{C}"/><path d="M76 35C68 38 62 34 62 26C70 24 75 28 76 35Z" fill="{C}"/>'
for x,y in [(8,30),(13,33),(10,37),(112,14),(107,11),(110,7)]:
    b+=f'<circle cx="{x}" cy="{y}" r="2.6" stroke="{C}" stroke-width="1.1"/>'
w("vine",svg(120,44,b))
# aghabani stitched swirls
p="M36 6C54 6 62 24 52 36C44 46 28 42 28 32C28 25 37 23 40 29"
b=""
for r in (0,180):
    b+=f'<path d="{p}" transform="rotate({r} 36 36)" stroke="{C}" stroke-width="1.8" stroke-dasharray="4 2.5" stroke-linecap="round"/>'
for x,y in [(0,0),(72,0),(0,72),(72,72)]:
    for i in range(6):
        b+=f'<ellipse cx="{x}" cy="{y-8}" rx="2" ry="5" transform="rotate({i*60} {x} {y})" stroke="{C}" stroke-width="1.1" stroke-dasharray="2.5 1.5"/>'
w("aghabani",svg(72,72,b))
# qishani tile
b=f'<rect x="1" y="1" width="78" height="78" stroke="{G}" stroke-width="1"/>'
for i in range(8):
    b+=f'<path d="M40 40C35 30 36 22 40 16C44 22 45 30 40 40Z" transform="rotate({i*45} 40 40)" stroke="{G}" stroke-width="1.2"/>'
b+=f'<circle cx="40" cy="40" r="4.5" fill="{C}"/>'
for x,y,r in [(1,1,0),(79,1,90),(79,79,180),(1,79,270)]:
    b+=f'<g transform="translate({x} {y}) rotate({r})"><path d="M0 22A22 22 0 0 0 22 0" stroke="{G}" stroke-width="1.2"/><path d="M0 13A13 13 0 0 0 13 0" stroke="{C}" stroke-width="1.2"/><path d="M9 9C16 10 20 14 20 20C14 20 10 16 9 9Z" fill="{G}"/></g>'
w("qishani",svg(80,80,b))
# muqarnas band
b=""
for x in (0,30):
    b+=f'<path d="M{x} 44V28Q{x+15} 4 {x+30} 28V44" stroke="{G}" stroke-width="1.4"/>'
    b+=f'<path d="M{x+7} 44V32Q{x+15} 20 {x+23} 32V44" stroke="{G}" stroke-width="1"/>'
b+=f'<path d="M15 14Q30 -6 45 14" stroke="{G}" stroke-width="1"/><path d="M-15 14Q0 -6 15 14M45 14Q60 -6 75 14" stroke="{G}" stroke-width="1"/>'
w("muqarnas",svg(60,44,b))
# rosette (lens ring + damascene shamsa)
def rosette(col):
    b=""
    for i in range(72):
        a=i*math.pi/36; r1=188; r2=198 if i%6 else 200
        sw=2.4 if i%6==0 else 1.2
        b+=f'<line x1="{200+r1*math.sin(a):.1f}" y1="{200-r1*math.cos(a):.1f}" x2="{200+r2*math.sin(a):.1f}" y2="{200-r2*math.cos(a):.1f}" stroke="{col}" stroke-width="{sw}"/>'
    b+=f'<circle cx="200" cy="200" r="182" stroke="{col}" stroke-width="2"/>'
    b+=f'<polygon points="{star(200,200,176,138,16)}" stroke="{col}" stroke-width="1.6"/>'
    b+=f'<polygon points="{star(200,200,150,116,16,11.25)}" stroke="{col}" stroke-width="1.2"/>'
    for i in range(16):
        b+=f'<path d="M200 142C190 124 190 104 200 86C210 104 210 124 200 142Z" transform="rotate({i*22.5} 200 200)" stroke="{col}" stroke-width="1.2"/>'
    b+=f'<circle cx="200" cy="200" r="62" stroke="{col}" stroke-width="1.4"/>'
    b+=f'<polygon points="{star(200,200,58,58*0.7654,8)}" stroke="{col}" stroke-width="1.6"/>'
    b+=f'<polygon points="{star(200,200,34,34*0.7654,8,22.5)}" stroke="{col}" stroke-width="1.2"/>'
    b+=f'<circle cx="200" cy="200" r="7" fill="{C}"/>'
    return svg(400,400,b)
w("rosette-g",rosette(G)); w("rosette-c",rosette(C))
