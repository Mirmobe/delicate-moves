#!/usr/bin/env python3
"""Editorial night-desk share card at 2× (2400×1260), exact brand hexes."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path("/workspace/.grok/og-render.png")
W, H = 2400, 1260  # 2× of 1200×630

INK = (0x14, 0x12, 0x0E)
CREAM = (0xF4, 0xEF, 0xE6)
AMBER = (0xE4, 0xA0, 0x4A)
RUST = (0xD0, 0x6A, 0x52)

FONT_DIR = Path("/usr/share/fonts/truetype/liberation")
SERIF_BOLD = str(FONT_DIR / "LiberationSerif-Bold.ttf")
SERIF_ITALIC = str(FONT_DIR / "LiberationSerif-BoldItalic.ttf")
SERIF_REG = str(FONT_DIR / "LiberationSerif-Regular.ttf")


def radial(w, h, cx, cy, rx, ry, color, strength):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    a = np.clip(1.0 - d, 0.0, 1.0) ** 1.7
    return a * strength, np.array(color, dtype=np.float32)


def tracked_width(text, font, tracking):
    return sum(font.getlength(ch) for ch in text) + tracking * max(0, len(text) - 1)


def draw_tracked(draw, x, y, text, font, fill, tracking):
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + tracking
    return x


def main():
    ink = np.array(INK, dtype=np.float32)
    desk = np.empty((H, W, 3), dtype=np.float32)
    desk[:] = ink

    a1, c1 = radial(W, H, 820, 80, 1100, 820, AMBER, 0.62)
    a2, c2 = radial(W, H, 1960, 1180, 900, 640, RUST, 0.28)
    a3, c3 = radial(W, H, 1200, 620, 1600, 900, (0x3A, 0x2A, 0x18), 0.35)
    for a, c in ((a3, c3), (a1, c1), (a2, c2)):
        desk = desk * (1.0 - a[..., None]) + c * a[..., None]

    rng = np.random.default_rng(12)
    grain = rng.normal(0, 3.2, (H, W, 1))
    desk = np.clip(desk + grain, 0, 255).astype(np.uint8)
    img = Image.fromarray(desk, "RGB")

    # Soft drop shadow under the sheet.
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sheet = (210, 150, 2190, 1110)
    sd.rounded_rectangle(
        (sheet[0] + 18, sheet[1] + 36, sheet[2] + 18, sheet[3] + 48),
        radius=18,
        fill=(0, 0, 0, 150),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    img = Image.alpha_composite(img.convert("RGBA"), shadow)

    paper = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(paper)
    pd.rounded_rectangle(sheet, radius=10, fill=CREAM + (255,))
    # Quiet fiber so the sheet is paper, not a flat UI panel.
    fiber = rng.normal(0, 2.4, (H, W)).astype(np.float32)
    parr = np.array(paper).astype(np.float32)
    mask = parr[..., 3] > 0
    parr[..., :3][mask] = np.clip(parr[..., :3][mask] + fiber[mask, None], 0, 255)
    paper = Image.fromarray(parr.astype(np.uint8), "RGBA")
    pd = ImageDraw.Draw(paper)

    inset = 46
    inner = (sheet[0] + inset, sheet[1] + inset, sheet[2] - inset, sheet[3] - inset)
    pd.rounded_rectangle(inner, radius=4, outline=AMBER + (255,), width=3)

    # Rust research ribbon, clear of the centered lockup.
    rib_w = 36
    rib_x = sheet[2] - 150
    pd.rectangle((rib_x, sheet[1], rib_x + rib_w, sheet[1] + 250), fill=RUST + (255,))
    pd.polygon(
        [
            (rib_x, sheet[1] + 250),
            (rib_x + rib_w, sheet[1] + 250),
            (rib_x + rib_w / 2, sheet[1] + 278),
        ],
        fill=RUST + (255,),
    )

    img = Image.alpha_composite(img, paper)
    draw = ImageDraw.Draw(img)

    font_line1 = ImageFont.truetype(SERIF_BOLD, 214)
    font_line2 = ImageFont.truetype(SERIF_ITALIC, 236)
    font_tag = ImageFont.truetype(SERIF_REG, 36)

    line1 = "Meme Master"
    line2 = "Checklist"
    tag = "NIGHT-DESK RESEARCH"
    tracking = 10

    w1 = font_line1.getlength(line1)
    w2 = font_line2.getlength(line2)
    wt = tracked_width(tag, font_tag, tracking)

    frame_limit = W * 0.66
    assert W * 0.50 <= w1 <= frame_limit, (w1, w1 / W)
    assert w2 <= frame_limit and wt <= frame_limit

    b1 = font_line1.getbbox(line1)
    b2 = font_line2.getbbox(line2)
    h1 = b1[3] - b1[1]
    h2 = b2[3] - b2[1]
    tag_h = font_tag.getbbox(tag)[3] - font_tag.getbbox(tag)[1]
    box = 40
    # gaps: after line1, after line2, rule, after rule, after tag, checks
    gaps = (18, 28, 28, 36, 48)
    rule_h = 7
    block_h = h1 + gaps[0] + h2 + gaps[1] + rule_h + gaps[2] + tag_h + gaps[3] + box
    # Optical center of the sheet, a touch high so the ribbon doesn't crowd the lockup.
    top = (sheet[1] + sheet[3]) / 2 - block_h / 2 - 8
    y1 = top - b1[1]
    y2 = y1 + h1 + gaps[0] + (b1[1] - b2[1])
    # Simpler: place by baseline-independent tops.
    y1 = top - b1[1]
    y2 = top + h1 + gaps[0] - b2[1]
    rule_y = top + h1 + gaps[0] + h2 + gaps[1]
    y_tag = rule_y + rule_h + gaps[2] - font_tag.getbbox(tag)[1]
    row_y = y_tag + font_tag.getbbox(tag)[3] + gaps[3]

    cx = (sheet[0] + sheet[2]) / 2
    draw.text((cx - w1 / 2, y1), line1, font=font_line1, fill=INK)
    draw.text((cx - w2 / 2, y2), line2, font=font_line2, fill=INK)

    rule_w = 320
    draw.rectangle((cx - rule_w / 2, rule_y, cx + rule_w / 2, rule_y + rule_h), fill=AMBER)
    draw_tracked(draw, cx - wt / 2, y_tag, tag, font_tag, RUST, tracking)

    marks = (AMBER, RUST, None)
    gap_x = 88
    total = 3 * box + 2 * gap_x
    x0 = cx - total / 2
    # Stay inside the inner rule and clear of the ribbon.
    assert x0 > inner[0] + 24
    assert x0 + total < rib_x - 24
    assert top > inner[1] + 20
    assert row_y + box < inner[3] - 20
    for i, color in enumerate(marks):
        x = x0 + i * (box + gap_x)
        if color is None:
            draw.rounded_rectangle((x, row_y, x + box, row_y + box), radius=5, outline=INK, width=4)
            continue
        draw.rounded_rectangle((x, row_y, x + box, row_y + box), radius=5, fill=color)
        draw.line(
            [(x + 9, row_y + 21), (x + 17, row_y + 30), (x + 31, row_y + 12)],
            fill=CREAM,
            width=5,
            joint="curve",
        )

    print(
        f"lockup w1={w1/W:.3f} w2={w2/W:.3f} wt={wt/W:.3f} "
        f"top={top:.0f} bottom={row_y+box:.0f} inner={inner}"
    )

    # Confirm nothing important kisses the outer frame.
    # Title band is the vertical middle; ribbon stays on the sheet.
    rgb = img.convert("RGB")
    rgb.save(OUT, "PNG")
    print(f"wrote {OUT} {rgb.size}")


if __name__ == "__main__":
    main()
