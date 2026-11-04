"""Render the bundled client sample tile (512x512) from the hand measured
proportions of a real client yard: 0.29 acres gross, about 20 percent hardscape (roof + driveway),
about 0.23 acres serviceable lawn, heavy pine canopy over the serviceable area.
Deterministic (seeded) so the demo and the tests always see the same tile."""
import random
from PIL import Image, ImageDraw, ImageFilter

random.seed(20261104)
W = H = 512
img = Image.new('RGB', (W, H), (96, 148, 62))  # lawn base
d = ImageDraw.Draw(img, 'RGBA')

# lawn texture patches (brighter and duller grass)
for _ in range(2600):
    x, y = random.randrange(W), random.randrange(H)
    r = random.randrange(6, 26)
    g = random.choice([(110, 165, 70), (84, 132, 54), (120, 172, 82), (74, 120, 48)])
    d.ellipse([x - r, y - r, x + r, y + r], fill=g + (70,))

# canopy: clustered pine crowns, dark green, heavier on the west and north
def crown(cx, cy, r):
    d.ellipse([cx - r, cy - r * 0.88, cx + r, cy + r * 0.88], fill=random.choice([(34, 70, 32), (28, 58, 27), (40, 80, 36)]) + (255,))
    for _ in range(46):
        a = random.uniform(0, 6.283); rr = random.uniform(0, r)
        x, y = cx + rr * 0.95 * random.choice([1, -1]) * abs(random.gauss(0.6, 0.4)), cy + rr * abs(random.gauss(0.5, 0.4)) * random.choice([1, -1])
        rad = random.uniform(3, 9)
        g = random.choice([(38, 74, 34), (30, 62, 28), (48, 88, 40), (26, 54, 26)])
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=g + (255,))
    d.ellipse([cx - r * 0.32, cy - r * 0.32, cx + r * 0.32, cy + r * 0.32], fill=(22, 46, 22, 255))

clusters = [(55, 65), (140, 48), (235, 62), (330, 50), (430, 70), (65, 175), (150, 205),
            (455, 175), (420, 295), (55, 315), (120, 415), (250, 455), (455, 425),
            (330, 150), (215, 295), (380, 385), (85, 480), (300, 330), (180, 360),
            (480, 330), (30, 250), (250, 180), (410, 480), (180, 90), (480, 60)]
for cx, cy in clusters:
    crown(cx + random.randrange(-12, 12), cy + random.randrange(-12, 12), random.randrange(52, 72))
# scattered single pines
for _ in range(10):
    crown(random.randrange(30, 490), random.randrange(30, 490), random.randrange(30, 44))

# house roof (top center left) and driveway (bottom right up to the house)
d.rectangle([140, 30, 350, 140], fill=(118, 110, 104))          # roof base, low saturation
for i in range(10):  # shingle lines
    y = 40 + i * 10
    d.line([144, y, 346, y], fill=(96, 88, 84), width=2)
d.rectangle([140, 30, 350, 140], outline=(70, 64, 60), width=3)
d.polygon([(248, 512), (348, 512), (330, 140), (272, 140)], fill=(168, 166, 160))  # driveway
for _ in range(300):  # driveway speckle
    x = random.randrange(255, 345); y = random.randrange(150, 508)
    d.point((x, y), fill=random.choice([(150, 148, 142), (186, 184, 178)]))
d.rectangle([225, 140, 275, 168], fill=(176, 172, 164))          # walkway pad

img = img.filter(ImageFilter.GaussianBlur(0.7))
img.save('/home/hatch/workspace/hackathons/meta-ai-2026/pinequote/public/assets/client-tile.png')

# verify with the same classical rules the browser uses
counts = {'lawn': 0, 'canopy': 0, 'hardscape': 0, 'other': 0}
px = img.load()
for yy in range(H):
    for xx in range(W):
        r, g, b = px[xx, yy]
        mx, mn = max(r, g, b), min(r, g, b)
        sat = (mx - mn) / mx if mx else 0
        exg = 2 * g - r - b
        if sat < 0.18 and 60 < mx < 235:
            counts['hardscape'] += 1
        elif exg > 12:
            counts['canopy' if g < 95 else 'lawn'] += 1
        elif r > g and r > b and sat >= 0.18:
            counts['canopy'] += 1
        else:
            counts['other'] += 1
tot = sum(counts.values())
serv = counts['lawn'] + counts['canopy']
print({k: f"{v/tot:.3f}" for k, v in counts.items()})
print('serviceable acres at 0.29 gross:', round(0.29 * serv / tot, 3))
print('canopy share of serviceable:', round(counts['canopy'] / serv, 3))
img.convert('RGB').save('/home/hatch/workspace/hackathons/meta-ai-2026/pinequote/test/client-tile-rgb.bin', format='RAW') if False else None
with open('/home/hatch/workspace/hackathons/meta-ai-2026/pinequote/test/client-tile-rgb.bin', 'wb') as f:
    f.write(img.tobytes())
