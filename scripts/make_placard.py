#!/usr/bin/env python3
"""
Render crisp museum wall-label placards as transparent PNGs.

Image models garble small text, so the load-bearing labels (the *renaming* motif
— the painting carries a different title in each venue) are rendered here in code
and composited over the splat as a flat plane (see app/lib/worldplacard.ts),
exactly as the painting itself is (app/lib/worldpainting.ts).

Style: a small ENGRAVED BRASS NAMEPLATE — warm bronze plate, beveled edge, light
engraved lettering. It reads as part of the walnut-and-gilt room, not a stark
paper card pinned over it (the first ivory-card version fought the splat's own
baked brass plate). The title is the prominent line; the artist + date sit under.

Output: public/placards/<id>.png  (filename = the context id).

Usage:
    python3 scripts/make_placard.py            # render every placard below
    python3 scripts/make_placard.py wildenstein-1934   # just one
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "placards")

PALATINO = "/System/Library/Fonts/Palatino.ttc"  # .ttc: 0=Regular 1=Italic 2=Bold

# Per-world label copy. `title` is the load-bearing line — the name the painting
# wore in that room. `blank=True` renders an empty plate (the Met-1974 missing
# label: a nameplate with nothing engraved on it — the conspicuous absence).
PLACARDS = {
    "wildenstein-1934": {
        "title": "THE CUP OF COFFEE",
        "sub": "Pierre Bonnard · 1919",
    },
    "bordeaux-1981": {
        "title": "LE CORSAGE VERT",
        "sub": "Pierre Bonnard · 1919",
    },
    "met-impressionist-epoch-1974": {
        "blank": True,  # the missing label — a blank plate, conspicuously empty
    },
}

# --- plate geometry (rendered at SS× then downsampled for crisp edges) ---
SS = 3
W, H = 660, 220  # final px; a wide nameplate, ~3:1
PAD = 14

# warm bronze / brass palette
BRASS_HI = (150, 120, 74)    # plate top sheen
BRASS_LO = (92, 70, 40)      # plate bottom
EDGE_HI = (198, 168, 110)    # bevel highlight (top-left)
EDGE_LO = (54, 40, 22)       # bevel shadow (bottom-right)
GOLD = (236, 222, 186)       # engraved text fill (warm cream-gold)
GOLD_SOFT = (208, 188, 146)  # secondary text
INCISE = (40, 28, 14, 230)   # engraved shadow under the lettering


def _font(idx, size):
    return ImageFont.truetype(PALATINO, size * SS, index=idx)


def _engraved(draw, cx, y, text, font, fill, tracking=0):
    """Centered text with a 1px dark incision shadow above it (engraved look)."""
    if tracking:
        widths = [draw.textlength(ch, font=font) for ch in text]
        total = sum(widths) + tracking * SS * (len(text) - 1)
        start = cx - total / 2
        def stroke(dy, col):
            x = start
            for ch, w in zip(text, widths):
                draw.text((x, y + dy), ch, font=font, fill=col)
                x += w + tracking * SS
        stroke(-SS, INCISE)   # incision shadow
        stroke(0, fill)
    else:
        w = draw.textlength(text, font=font)
        x = cx - w / 2
        draw.text((x, y - SS), text, font=font, fill=INCISE)
        draw.text((x, y), text, font=font, fill=fill)
    bbox = font.getbbox(text)
    return bbox[3] - bbox[1]


def render(world_id, spec):
    w_ss, h_ss = W * SS, H * SS
    img = Image.new("RGBA", (w_ss, h_ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # brass plate with a top→bottom sheen gradient
    plate = Image.new("RGB", (w_ss, h_ss), BRASS_LO)
    pd = ImageDraw.Draw(plate)
    for yy in range(h_ss):
        t = yy / h_ss
        col = tuple(int(BRASS_HI[i] + (BRASS_LO[i] - BRASS_HI[i]) * t) for i in range(3))
        pd.line([(0, yy), (w_ss, yy)], fill=col)
    # rounded mask
    mask = Image.new("L", (w_ss, h_ss), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [PAD * SS, PAD * SS, w_ss - PAD * SS, h_ss - PAD * SS], radius=8 * SS, fill=255
    )
    img.paste(plate, (0, 0), mask)

    # beveled edge: bright top-left, dark bottom-right
    bx0, by0, bx1, by1 = PAD * SS, PAD * SS, w_ss - PAD * SS, h_ss - PAD * SS
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=8 * SS, outline=EDGE_HI, width=max(1, SS))
    d.line([bx0 + 4 * SS, by1 - SS, bx1 - 4 * SS, by1 - SS], fill=EDGE_LO, width=max(1, SS))
    d.line([bx1 - SS, by0 + 4 * SS, bx1 - SS, by1 - 4 * SS], fill=EDGE_LO, width=max(1, SS))

    cx = w_ss / 2
    if not spec.get("blank"):
        title = _font(2, 34)   # bold
        sub = _font(1, 20)     # italic

        th = title.getbbox(spec["title"])[3] - title.getbbox(spec["title"])[1]
        sh = sub.getbbox(spec["sub"])[3] - sub.getbbox(spec["sub"])[1]
        gap = 22 * SS
        block = th + gap + sh
        top = (h_ss - block) / 2 - 4 * SS

        _engraved(d, cx, top, spec["title"], title, GOLD, tracking=2.5)
        # hairline rule
        ry = top + th + 10 * SS
        rw = 70 * SS
        d.line([cx - rw / 2, ry, cx + rw / 2, ry], fill=EDGE_HI, width=max(1, SS))
        d.line([cx - rw / 2, ry + SS, cx + rw / 2, ry + SS], fill=EDGE_LO, width=max(1, SS))
        _engraved(d, cx, top + th + gap, spec["sub"], sub, GOLD_SOFT)

    out = img.resize((W, H), Image.LANCZOS)
    path = os.path.join(OUT_DIR, f"{world_id}.png")
    out.save(path)
    print(f"  wrote {path}  ({W}×{H})")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    targets = sys.argv[1:] or list(PLACARDS.keys())
    for world_id in targets:
        if world_id not in PLACARDS:
            print(f"  ! no spec for {world_id}", file=sys.stderr)
            continue
        render(world_id, PLACARDS[world_id])


if __name__ == "__main__":
    main()
