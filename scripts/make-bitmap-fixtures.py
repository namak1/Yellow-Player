"""Generate original, redistributable PGS/VobSub test subtitles (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import struct
root=Path(__file__).resolve().parents[1]/'tests/fixtures'
w,h=480,60
im=Image.new('L',(w,h),0)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',27)
ImageDraw.Draw(im).text((12,10),'Bitmap subtitles work.',font=f,fill=2,stroke_width=2,stroke_fill=1)
rows=[list(im.crop((0,y,w,y+1)).getdata()) for y in range(h)]
def runs(row):
 p=0
 while p<len(row):
  c=row[p];e=p+1
  while e<len(row) and row[e]==c:e+=1
  yield e-p,c;p=e
rle=bytearray()
for row in rows:
 for n,c in runs(row):
  flag=(0x80 if c else 0)|(0x40 if n>=64 else 0)|(n>>8 if n>=64 else n)
  rle+=bytes((0,flag))
  if n>=64:rle.append(n&255)
  if c:rle.append(c)
 rle+=b'\0\0'
def seg(kind,b,t=1):return b'PG'+struct.pack('>II',int(t*90000),0)+bytes((kind,))+struct.pack('>H',len(b))+b
def pcs(refs,state=0):return struct.pack('>HHBHBBBB',1920,1080,0x10,0,state,0,0,len(refs))+b''.join(struct.pack('>HBBHH',0,0,0,720,940) for _ in refs)
ods=struct.pack('>HBB',0,0,0xc0)+(len(rle)+4).to_bytes(3,'big')+struct.pack('>HH',w,h)+rle
palette=bytes([0,0,0,16,128,128,0,1,16,128,128,255,2,235,128,128,255])
sup=seg(0x16,pcs([0],128))+seg(0x14,palette)+seg(0x15,ods)+seg(0x80,b'')+seg(0x16,pcs([]),6)+seg(0x80,b'',6)
(root/'bitmap.sup').write_bytes(sup)
def dvd_field(rows):
 out=bytearray()
 for row in rows:
  ns=[]
  for n,c in runs(row):
   while n:
    take=min(n,255);code=(take<<2)|c
    size=1 if code>=4 and code<16 else 2 if code<64 else 3 if code<256 else 4
    ns.extend(int(v,16) for v in f'{code:0{size}x}');n-=take
  if len(ns)%2:ns.append(0)
  out+=bytes(ns[i]*16+ns[i+1] for i in range(0,len(ns),2))
 return out
# DVD version uses the same raster on a 720x576 screen.
even=dvd_field(rows[::2]);odd=dvd_field(rows[1::2]);ctrl=4+len(even)+len(odd)
x,y=120,480;x2=x+w-1;y2=y+h-1
area=bytes([x>>4,((x&15)<<4)|(x2>>8),x2&255,y>>4,((y&15)<<4)|(y2>>8),y2&255])
cmd=bytes([3,0x32,0x10,4,0xff,0xf0,5])+area+bytes([6])+struct.pack('>HH',4,4+len(even))+bytes([1,255])
stop=ctrl+4+len(cmd)
spu=bytearray(4)+even+odd+struct.pack('>HH',0,stop)+cmd+struct.pack('>HH',round(5*90000/1024),stop)+bytes([2,255])
spu[:4]=struct.pack('>HH',len(spu),ctrl)
# MPEG-2 private stream, split across PES packets to exercise reassembly.
sub=bytearray()
for offset in range(0,len(spu),1000):
 payload=bytes([0x80,0,0,0x20])+spu[offset:offset+1000]
 sub+=b'\0\0\1\xbd'+struct.pack('>H',len(payload))+payload
(root/'bitmap.sub').write_bytes(sub)
(root/'bitmap.idx').write_text('# VobSub index file, v7\nsize: 720x576\npalette: 000000,000000,ffffff,808080,'+','.join(['000000']*12)+'\nid: en, index: 0\ntimestamp: 00:00:01:000, filepos: 000000000\n')
print('Generated original bitmap subtitle fixtures')

# Build the embedded variant without re-encoding the original synthetic video.
import subprocess
subprocess.run(['ffmpeg','-y','-v','error','-i',str(root/'embedded.mp4'),'-i',str(root/'bitmap.sup'),'-i',str(root/'bitmap.idx'),'-map','0:v','-map','1:s','-map','2:s','-c','copy',str(root/'bitmap.mkv')],check=True)
