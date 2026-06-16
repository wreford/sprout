#!/usr/bin/env python3
"""Convert an image file to JTM format (JSON pixel art)."""
import sys, json
from PIL import Image
from collections import Counter

def img_to_jtm(path, out_path, size=24):
    img = Image.open(path).convert('RGB')
    # crop to square center
    w, h = img.size
    s = min(w, h)
    left, top = (w - s) // 2, (h - s) // 2
    img = img.crop((left, top, left + s, top + s))
    img = img.resize((size, size), Image.LANCZOS)

    # quantize to palette
    pixels = list(img.getdata())
    # reduce colors: quantize
    qimg = img.quantize(colors=26, method=Image.Quantize.MEDIANCUT)
    qimg_rgb = qimg.convert('RGB')
    qpixels = list(qimg_rgb.getdata())

    # build palette from unique colors
    unique = []
    for c in qpixels:
        if c not in unique:
            unique.append(c)

    chars = 'abcdefghijklmnopqrstuvwxyz'
    palette = {}
    color_to_char = {}
    for i, c in enumerate(unique):
        if i >= len(chars):
            break
        ch = chars[i]
        palette[ch] = '#{:02x}{:02x}{:02x}'.format(c[0], c[1], c[2])
        color_to_char[c] = ch

    # build RLE rows
    rows = []
    for y in range(size):
        row_chars = []
        for x in range(size):
            c = qpixels[y * size + x]
            row_chars.append(color_to_char.get(c, 'a'))
        # RLE encode
        rle = ''
        i = 0
        while i < len(row_chars):
            ch = row_chars[i]
            count = 1
            while i + count < len(row_chars) and row_chars[i + count] == ch:
                count += 1
            if count == 1:
                rle += ch
            else:
                rle += str(count) + ch
            i += count
        rows.append(rle)

    jtm = {
        'w': size, 'h': size,
        'palette': palette,
        'ops': [],
        'cells': [{'x': 0, 'y': 0, 'w': size, 'h': size, 'px': rows}]
    }

    with open(out_path, 'w') as f:
        json.dump(jtm, f)
    print(f'Wrote {out_path} ({size}x{size}, {len(palette)} colors)')

if __name__ == '__main__':
    img_to_jtm(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 24)
