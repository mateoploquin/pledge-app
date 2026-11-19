# Makes the seal's resting loop, assets/video/seal-rest.mp4 (owner, 19 Nov 2026:
# the light alive at rest, the sun not travelling). From the owner's footage:
#   swiftc -O scripts/seal-rest-grab.swift -o /tmp/grab && mkdir -p /tmp/grab-out
#   /tmp/grab <footage.mp4> /tmp/grab-out 2.4 5.4          # 30 fps frames
#   mkdir -p /tmp/rest && python3 scripts/make-seal-rest.py /tmp/grab-out /tmp/rest
#   swiftc -O scripts/seal-rest-encode.swift -o /tmp/encode
#   /tmp/encode /tmp/rest assets/video/seal-rest.mp4 4
# Frames 3.4–5.4 s: each is shifted so the sun sits exactly where it is at
# 5.4 s (the held cut's first frame), its sky brightness matched (the sun's
# white left alone), and only the sun and its glow (a feathered disc) laid over
# the 5.4 s frame. 45 frames, crossfaded over 15 so the loop has no seam.
import sys, glob
from PIL import Image, ImageStat, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(src + "/g*.png"))[30:]
still = Image.open(fs[-1]).convert("RGB"); W, H = still.size

def center(im):
    b = im.convert("L").point(lambda v: 255 if v > 245 else 0).getbbox()
    return (b[0] + b[2]) / 2, (b[1] + b[3]) / 2

tx, ty = center(still)
R_in, R_out = 150, 320
mask = Image.new("L", (W, H), 0); d = ImageDraw.Draw(mask)
for k in range(40, -1, -1):
    r = R_in + (R_out - R_in) * k / 40
    d.ellipse((tx - r, ty - r, tx + r, ty + r), fill=int(255 * (1 - k / 40) ** 1.5))
mask = mask.filter(ImageFilter.GaussianBlur(6))
ring = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(ring)
dr.ellipse((tx - 300, ty - 300, tx + 300, ty + 300), fill=255)
dr.ellipse((tx - 200, ty - 200, tx + 200, ty + 200), fill=0)
ref = ImageStat.Stat(still, ring).mean
stab = []
for f in fs:
    im = Image.open(f).convert("RGB"); cx, cy = center(im)
    im = im.transform(im.size, Image.AFFINE, (1, 0, cx - tx, 0, 1, cy - ty), resample=Image.BILINEAR)
    m = ImageStat.Stat(im, ring).mean
    im = Image.merge("RGB", [ch.point(lambda v, g=ref[i] / max(m[i], 1): v if v > 232 else min(255, int(v * g)))
                             for i, ch in enumerate(im.split())])
    stab.append(Image.composite(im, still, mask))
N, F = 45, 15
for k in range(N):
    fr = stab[k] if k >= F else Image.blend(stab[N + k], stab[k], k / F)
    fr.save(f"{out}/r{k:03d}.png")
