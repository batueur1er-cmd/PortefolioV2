"""Images d'aperçu (1200 × 630) des pages projet, pour LinkedIn, Discord et les moteurs de recherche.

Les textes viennent du site lui-même (node scripts/seo.mjs --dump) ; la capture, si elle existe,
de public/projects/<id>-1.png. À relancer après avoir ajouté ou renommé un projet :

    node scripts/seo.mjs --dump | python scripts/og-images.py

Demande Pillow (pip install pillow) et les polices Windows Georgia, Segoe UI et Consolas.
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'og'
FONTS = Path('C:/Windows/Fonts')
# Les couleurs du thème clair (src/styles/themes/_clair.scss).
ACCENT = (0x4F, 0x46, 0xE5)
ACCENT_2 = (0x93, 0x33, 0xEA)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def background() -> Image.Image:
    img = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(img)
    for x in range(W):
        t = x / W
        d.line([(x, 0), (x, H)], fill=tuple(int(ACCENT[i] + (ACCENT_2[i] - ACCENT[i]) * t) for i in range(3)))
    for x in range(0, W, 40):
        d.line([(x, 0), (x, H)], fill=(98, 90, 235))
    for y in range(0, H, 40):
        d.line([(0, y), (W, y)], fill=(98, 90, 235))
    return img


def wrap(d: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int, max_lines: int) -> list[str]:
    words, lines, line = text.split(), [], ''
    for word in words:
        test = f'{line} {word}'.strip()
        if d.textlength(test, font=f) <= width:
            line = test
        else:
            lines.append(line)
            line = word
    lines.append(line)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip('.,;:') + '…'
    return lines


def card(page: dict) -> Image.Image:
    img = background()
    d = ImageDraw.Draw(img)
    project_id = page['path'].rsplit('/', 1)[-1]
    title = page['title'].split(' — ')[0]
    context, _, summary = page['description'].partition('. ')
    shot = ROOT / 'public' / 'projects' / f'{project_id}-1.png'
    text_w = 560 if shot.exists() else 1040

    if shot.exists():
        # La capture, dans un cadre de navigateur, à droite.
        frame_x, frame_y, frame_w, frame_h = 660, 110, 500, 410
        d.rounded_rectangle((frame_x, frame_y, frame_x + frame_w, frame_y + frame_h), 14, fill='#ffffff')
        for i, c in enumerate(['#f87171', '#fbbf24', '#34d399']):
            d.ellipse((frame_x + 18 + i * 20, frame_y + 14, frame_x + 30 + i * 20, frame_y + 26), fill=c)
        pic = Image.open(shot).convert('RGB')
        inner_w, inner_h = frame_w - 20, frame_h - 50
        scale = max(inner_w / pic.width, inner_h / pic.height)
        pic = pic.resize((int(pic.width * scale), int(pic.height * scale)))
        pic = pic.crop((0, 0, inner_w, inner_h))
        img.paste(pic, (frame_x + 10, frame_y + 40))

    d.text((80, 96), 'PROJET · BAPTISTE NODON', font=font('consola.ttf', 24), fill='#e0e7ff')
    size = 84 if d.textlength(title, font=font('georgiab.ttf', 84)) <= text_w else 64
    y = 150
    for line in wrap(d, title, font('georgiab.ttf', size), text_w, 2):
        d.text((80, y), line, font=font('georgiab.ttf', size), fill='#ffffff')
        y += int(size * 1.1)
    y += 18
    d.text((80, y), context, font=font('segoeuib.ttf', 30), fill='#eef2ff')
    y += 56
    for line in wrap(d, summary, font('segoeui.ttf', 27), text_w, 4):
        d.text((80, y), line, font=font('segoeui.ttf', 27), fill='#e0e7ff')
        y += 38
    return img


def main() -> None:
    pages = json.load(sys.stdin)
    OUT.mkdir(parents=True, exist_ok=True)
    for page in pages:
        if page['path'] == '/':
            continue
        target = ROOT / 'public' / page['image'].lstrip('/')
        card(page).save(target, optimize=True)
        print(f'  {target.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
