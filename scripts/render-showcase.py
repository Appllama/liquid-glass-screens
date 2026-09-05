#!/usr/bin/env python3
"""Compose the README showcase panels from exact simulator captures.

    python3 scripts/render-showcase.py docs/images/liquid-glass-showcase-01.png gate.png mid.png open.png

Every 1206×2622 capture is uniformly scaled to the same height and clipped
only by the device corner mask, then laid on a plain dark ground. No
perspective, no independent scaling, no generated pixels.
"""
import sys
from PIL import Image, ImageDraw

W, H = 1536, 1024
PAD, GAP, RADIUS = 72, 56, 64

def main(out, *captures):
    panel = Image.new('RGB', (W, H), (6, 7, 11))
    h = H - 2 * PAD
    scaled = []
    for path in captures:
        im = Image.open(path).convert('RGBA')
        w = round(im.width * h / im.height)
        im = im.resize((w, h), Image.LANCZOS)
        mask = Image.new('L', (w, h), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=round(RADIUS * h / 2622 * 2.2), fill=255)
        im.putalpha(mask)
        scaled.append(im)
    total = sum(im.width for im in scaled) + GAP * (len(scaled) - 1)
    x = (W - total) // 2
    for im in scaled:
        panel.paste(im, (x, PAD), im)
        x += im.width + GAP
    panel.save(out, optimize=True)
    print('wrote', out, panel.size)

if __name__ == '__main__':
    main(*sys.argv[1:])
