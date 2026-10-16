#!/usr/bin/env python3
"""Procedural tree, 1-bit Floyd-Steinberg dither. Output: public/tpl/tree-dither.png (862x1080, ink on transparent).
Made by slopgang for the About page; no source photo."""
import math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

W, H = 862, 1080
random.seed(7)
img = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(img)
# sky: soft vertical light
for y in range(H):
    d.line([(0, y), (W, y)], fill=int(8 + 34 * (y / H)))
# ground
d.ellipse([-200, H - 170, W + 200, H + 260], fill=150)

leaves = []
def branch(x, y, ang, length, width, depth):
    x2 = x + math.cos(ang) * length
    y2 = y - math.sin(ang) * length
    d.line([(x, y), (x2, y2)], fill=235, width=max(1, int(width)))
    if depth == 0 or length < 10:
        leaves.append((x2, y2))
        return
    for _ in range(2 if depth > 6 else 3):
        branch(x2, y2, ang + random.uniform(-0.55, 0.55), length * random.uniform(0.66, 0.8), width * 0.68, depth - 1)

branch(W * 0.5, H - 110, math.pi / 2, 210, 30, 10)
canopy = Image.new('L', (W, H), 0)
cd = ImageDraw.Draw(canopy)
for (x, y) in leaves:
    r = random.uniform(8, 22)
    cd.ellipse([x - r, y - r, x + r, y + r], fill=random.randint(90, 255))
canopy = canopy.filter(ImageFilter.GaussianBlur(2.5))
img = Image.composite(canopy, img, canopy.point(lambda v: 255 if v > 40 else 0))
d = ImageDraw.Draw(img)
# redraw trunk over canopy lower part for contrast
img = img.filter(ImageFilter.GaussianBlur(1.2))
bw = img.convert('1', dither=Image.Dither.FLOYDSTEINBERG)  # 1-bit, Floyd-Steinberg
ink = Image.new('RGBA', (W, H), (10, 10, 10, 0))
alpha = bw.convert('L')  # white (bright) pixels become ink
ink.putalpha(alpha)
out = Path(__file__).resolve().parent.parent / 'public' / 'tpl' / 'tree-dither.png'
ink.save(out, optimize=True)
print(out)
