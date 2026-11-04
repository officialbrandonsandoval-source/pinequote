# PineQuote

Instant satellite quotes for outdoor service work, by Iron & Pine Outdoor Co.
Built for the Meta Global AI Developer Hackathon (Startup track, theme: Build for Your World).

A homeowner enters an address and picks a service. PineQuote reads a satellite
tile of the parcel, segments it into lawn, evergreen canopy, and hardscape,
computes the serviceable area and an evergreen canopy score, runs the real
Iron and Pine pricing engine, and returns an instant quote with written
reasoning and customer ready copy.

The part nobody else does: the canopy score. Pine needle yards are the hardest
jobs in the Northwoods to price from the road, because a small yard under heavy
evergreen canopy is a heavier job than a big open lawn. PineQuote maps canopy
share of the serviceable area to the density multiplier in the price book:
under 25 percent is light (x1.0), 25 to 60 percent is moderate (x1.15), and
over 60 percent is heavy (x1.3).

## Run it

```bash
npm test     # test suite, including the end to end ground truth case
npm start    # demo at http://localhost:4173
```

No dependencies. Node 18 or newer.

## The ground truth test

The demo opens on a real client yard in Woodruff,
Wisconsin, measured by hand from satellite imagery on October 23, 2026.
Gross 0.29 acres, about 0.22 to 0.24 acres of net serviceable lawn, heavy pine
canopy, hand priced at $194 by the Iron and Pine formula.

`npm test` runs the bundled tile pixels through the same segmentation code the
browser uses, feeds the result to the pricing engine, and asserts the quote
comes out at exactly $194. It also asserts that no haul away charge can ever
appear (see the price book rule below).

## Architecture

- `server.js`: zero dependency Node server. Serves the demo page and a
  `POST /api/quote` endpoint.
- `src/quote-engine.js`: the pricing engine. Tiers, density multipliers, and
  snow pricing are Brandon's real, tested price book. This PineQuote edition
  removes the haul away add on entirely, per the standing business rule of
  October 30, 2026: every cleanup is blown to the tree line only, and Iron and
  Pine never hauls debris away.
- `public/segment.js`: classical color segmentation shared by the browser and
  the Node tests. Lawn and canopy split on the excess green index and crown
  brightness; hardscape is low saturation gray. Rules are documented in the
  file header.
- `src/meta-client.js` and `src/copywriter.js`: the quote reasoning and
  customer copy layer. It calls the Meta Model API when `META_API_KEY` and
  `META_MODEL` are configured, and otherwise falls back to local templates.
  The fallback labels itself in every output.
- Confidence gate: when canopy covers 85 percent or more of the serviceable
  area, the API returns a range with a free drive by offer instead of a firm
  number.

## What is real in this demo, and what is a stand in

Real:
- The pricing engine and every price it produces, including the $194 test case.
- The segmentation math, which runs on the tile pixels in the browser and in
  the test suite.
- A second bundled sample (`public/assets/woodruff-esri.png`) is genuine Esri
  World Imagery over Woodruff, Wisconsin, included to show the classifier on
  real satellite imagery.

Stand ins, labeled wherever they appear:
- The Client tile is a sample tile rendered to the hand measured proportions
  (`tools/make_client_tile.py` is deterministic and seeded). Address level
  imagery cropping for the exact parcel is not part of this demo build; the
  address field is a demo input and any address loads sample imagery.
- Quote copy is written by the local template fallback. The Meta Model API
  call in `src/meta-client.js` is an explicit, unimplemented hook rather than
  a faked response, and the production plan swaps segmentation to SAM 3.1
  through the same API. The $150 participant API credit claim and API key
  setup sit with the founder's hackathon account, so the demo ships key free
  and honest about it.

## Screenshots (described)

- Step 1 card: address field, service picker, parcel size, and the button that
  loads the the client test yard.
- Step 2: the sample tile beside its segmentation overlay (lawn bright green,
  canopy deep blue, hardscape gray) with the measured shares and the density
  band printed under it.
- Step 3: the quote card: line items, the $194 total with a Firm quote badge,
  the reasoning list, and the customer ready copy block with its provider
  label.
- The demo video frames in `demo/frames/` show the same screens as a narrated
  walkthrough.

## Demo video

`demo/pinequote-demo.mp4`: a narrated walkthrough of about 2 minutes covering
the problem, the ground truth yard, the segmentation, and the quote.
Rebuild it with `python3 demo/build_video.py` (needs Pillow, ffmpeg, and the
tts binary used by the author; narration text lives in that script).

## License

MIT. See `LICENSE`.

## Repository assets note

This repository snapshot carries the full source, tests, and tooling. Binary
assets are not in the snapshot: the two sample tile PNGs under
`public/assets/`, the raw test fixture `test/client-tile-rgb.bin`, the demo
frames, and the demo video. The Client tile and the test fixture regenerate
from the hand measured ground truth proportions by running
`python3 tools/make_client_tile.py`. The Woodruff sample is a mosaic of Esri
World Imagery tiles over Woodruff, Wisconsin. The narrated demo video ships
with the hackathon submission itself.
