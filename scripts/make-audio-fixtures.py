"""Create original six-channel codec fixtures; requires FFmpeg with AC-3/E-AC-3/DCA encoders."""
from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]/'tests/fixtures'
for codec,frequency in [('ac3',440),('eac3',660),('dts',880)]:
    args=['ffmpeg','-y','-v','error','-i',str(root/'embedded.mp4'),'-f','lavfi','-i',f'sine=frequency={frequency}:sample_rate=48000:duration=1','-map','0:v','-map','1:a','-t','1','-c:v','copy','-c:a','dca' if codec=='dts' else codec,'-ac','6','-b:a','768k' if codec=='dts' else '192k']
    if codec=='dts':args+=['-strict','-2']
    subprocess.run(args+[str(root/f'audio-{codec}.mkv')],check=True)
