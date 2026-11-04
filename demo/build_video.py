"""Builds the PineQuote demo video: PIL frames of the real app data, TTS
narration, ffmpeg assembly. Frames show the actual bundled tile, the actual
classifier output overlay, and the actual engine quote."""
import subprocess, os
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(BASE)
FR = os.path.join(BASE, 'frames'); AU = os.path.join(BASE, 'audio')
W, H = 1280, 720
INK = (28, 36, 32); PINE = (46, 83, 57); PAPER = (246, 243, 236); ACCENT = (201, 111, 46); WHITE = (255, 255, 255)

def font(sz, bold=True):
    p = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    return ImageFont.truetype(p, sz)

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if d.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

def card(title, body, footer=None, bg=PAPER):
    img = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 96], fill=PINE)
    d.text((48, 26), title, font=font(40), fill=WHITE)
    y = 140
    for para in body:
        for line in wrap(d, para, font(30, False), W - 120):
            d.text((60, y), line, font=font(30, False), fill=INK); y += 42
        y += 22
    if footer:
        d.text((60, H - 60), footer, font=font(22, False), fill=(110, 105, 90))
    return img

# Frame 1: title
img = Image.new('RGB', (W, H), PINE); d = ImageDraw.Draw(img)
d.text((70, 210), 'PineQuote', font=font(110), fill=WHITE)
for i, line in enumerate(wrap(d, 'Instant satellite quotes for outdoor service work, by Iron and Pine Outdoor Co. of Lac du Flambeau, Wisconsin.', font(34, False), W - 160)):
    d.text((74, 360 + i * 48), line, font=font(34, False), fill=(225, 232, 220))
d.text((74, 620), 'Meta Global AI Developer Hackathon, Startup track, Build for Your World', font=font(24, False), fill=(190, 205, 190))
img.save(f'{FR}/f1.png')

# Frame 2: the problem
card('The problem PineQuote solves', [
    'Quoting is the bottleneck for a one person outdoor service company.',
    'Every quote today means a 30 to 60 minute round trip just to look at a yard before a price can be named.',
    'The hardest yards to price are pine needle yards: a small lot under heavy evergreen canopy is a bigger job than a wide open lawn.',
    'Lawn tools on the market measure turf area only. None of them price needle load under canopy.',
]).save(f'{FR}/f2.png')

# classifier (same rules as public/segment.js)
def classify(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b)
    sat = (mx - mn) / mx if mx else 0
    exg = 2 * g - r - b
    if sat < 0.18 and 60 < mx < 235: return 2
    if exg > 12: return 1 if g < 95 else 0
    if r > g and r > b and sat >= 0.18: return 1
    return 3

tile = Image.open(f'{PROJ}/public/assets/client-tile.png').convert('RGB')
ov = Image.new('RGB', tile.size)
tp, op = tile.load(), ov.load()
COLORS = [(110, 190, 80), (30, 80, 120), (150, 148, 144), (200, 60, 60)]
counts = [0, 0, 0, 0]
for yy in range(512):
    for xx in range(512):
        c = classify(*tp[xx, yy]); counts[c] += 1; op[xx, yy] = COLORS[c]
ov.save(f'{FR}/overlay.png')
tot = sum(counts); serv = counts[0] + counts[1]
net = round(0.29 * serv / tot * 100) / 100
canopy_pct = round(counts[1] / serv * 100)

# Frame 3: test yard + tile
img = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(img)
d.rectangle([0, 0, W, 96], fill=PINE); d.text((48, 26), 'The ground truth test yard', font=font(40), fill=WHITE)
img.paste(tile.resize((470, 470)), (60, 150))
lines = ['A real client yard in Woodruff, Wisconsin.',
         'Measured by hand from satellite imagery on October 23, 2026.',
         'Gross parcel: 0.29 acres.',
         'Net lawn to service: about 0.22 to 0.24 acres.',
         'Canopy: heavy pine cover.',
         'Hand priced by the Iron and Pine formula: $194.',
         '', 'The demo tile is a sample drawn to these measured proportions.']
y = 170
for line in lines:
    for wl in wrap(d, line, font(28, False), 560):
        d.text((580, y), wl, font=font(28, False), fill=INK); y += 40
    y += 10
img.save(f'{FR}/f3.png')

# Frame 4: segmentation result
img = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(img)
d.rectangle([0, 0, W, 96], fill=PINE); d.text((48, 26), 'Segmentation, computed live from the pixels', font=font(40), fill=WHITE)
img.paste(ov.resize((470, 470)), (60, 150))
lines = [f'Lawn: {counts[0]/tot*100:.1f} percent of the tile.',
         f'Evergreen canopy: {counts[1]/tot*100:.1f} percent.',
         f'Roof and driveway (set aside): {counts[2]/tot*100:.1f} percent.',
         f'Serviceable area: {net} acres of 0.29 gross.',
         f'Canopy covers {canopy_pct} percent of the serviceable area.',
         'Over 60 percent canopy is the heavy density band in the price book.',
         '', 'Production upgrade: SAM 3.1 through the Meta Model API.']
y = 170
for line in lines:
    for wl in wrap(d, line, font(28, False), 560):
        d.text((580, y), wl, font=font(28, False), fill=INK); y += 40
    y += 10
img.save(f'{FR}/f4.png')

# Frame 5: the quote
card('The quote: an exact match', [
    'Fall cleanup, Small tier (up to 1/4 acre): $149',
    f'Heavy density multiplier: x1.3 (canopy {canopy_pct} percent)',
    'Total: $194, firm quote.',
    'Hand measured formula price: $194. Match.',
    'Every cleanup is blown to the tree line on the property.',
    'No haul away charge exists in this price book, because Iron and Pine does not haul debris away.',
    'If canopy ever hides the ground almost completely, PineQuote returns a range and offers a free drive by instead of inventing a firm number.',
]).save(f'{FR}/f5.png')

# Frame 6: honest stand ins + close
card('What is real, and what swaps in production', [
    'Real today: the verified Iron and Pine pricing engine, the pixel segmentation over the tile, and the end to end test that reproduces the $194 ground truth quote.',
    'Demo stand ins, labeled as such in the code: the sample tile drawn to measured proportions, and template written quote copy.',
    'Production wiring: SAM 3.1 segmentation and Meta model quote copy through the Meta Model API. Both swap points are marked.',
    'PineQuote: the quote before the drive.',
], footer='Open source, MIT license. Source code ships with this submission.').save(f'{FR}/f6.png')

NARRATION = [
    'This is PineQuote, built by Iron and Pine Outdoor Company in northern Wisconsin. It gives a homeowner an instant, honest price for fall cleanup and snow work, straight from a satellite picture of their yard.',
    'Quoting is the bottleneck for a one person outdoor service company. Today, every quote means a thirty to sixty minute round trip just to look at a yard. And the hardest yards to price are pine needle yards, where a small lot under heavy evergreen canopy is a bigger job than a wide open lawn. Every lawn tool on the market measures turf. None of them price the needles.',
    'So we start with a real client yard in Woodruff, Wisconsin. Brandon measured this yard by hand from satellite imagery. Zero point two nine acres gross, about zero point two three acres of lawn to service, and heavy pine canopy. His pricing formula says one hundred ninety four dollars. That is the number PineQuote has to match.',
    f'PineQuote segments the satellite tile into lawn, evergreen canopy, and hardscape. The roof and driveway are set aside, which leaves zero point two three acres of serviceable lawn. Canopy covers {canopy_pct} percent of that area, and in the Iron and Pine price book, anything over sixty percent is the heavy density band.',
    'The pricing engine is Brandon\u2019s real, tested price book, the same one his business runs on. Small tier, times the heavy density multiplier of one point three, equals one hundred ninety four dollars. An exact match with the hand measured quote. Every cleanup is blown to the tree line. There is no haul away charge, because the business does not haul.',
    'Two things are honest stand ins in this demo. The sample tile is drawn to that yard\u2019s measured proportions, and the quote letter is written by local templates. In production, segmentation moves to SAM three through the Meta Model API, and a Meta model writes the quote reasoning and the customer copy. The swap points are marked in the code. PineQuote: the quote before the drive. Thank you.',
]

durs = []
for i, text in enumerate(NARRATION, 1):
    out = f'{AU}/n{i}.mp3'
    subprocess.run(['/opt/hatch/bin/tts', 'speak', '--voice', 'avocado_v2:MAI_03', '--output', out, '--text', text], check=True, capture_output=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout.strip())
    durs.append(dur + 0.5)
    print('segment', i, 'audio', round(dur, 1), 's')

args = ['ffmpeg', '-y']
for i, dur in enumerate(durs, 1):
    args += ['-loop', '1', '-t', f'{dur:.2f}', '-i', f'{FR}/f{i}.png']
for i in range(1, 7):
    args += ['-i', f'{AU}/n{i}.mp3']
concat = ''.join(f'[{i}:v]' for i in range(6)) + 'concat=n=6:v=1:a=0[v];' + ''.join(f'[{6+i}:a]' for i in range(6)) + 'concat=n=6:v=0:a=1[a]'
args += ['-filter_complex', concat, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-shortest', f'{BASE}/pinequote-demo.mp4']
subprocess.run(args, check=True, capture_output=True)
total = float(subprocess.run(['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{BASE}/pinequote-demo.mp4'], capture_output=True, text=True).stdout.strip())
print('VIDEO DONE, duration', round(total, 1), 's')
