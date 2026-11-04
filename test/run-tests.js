// PineQuote test suite. Run: npm test
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../src/quote-engine');
const seg = require('../public/segment');
const { writeQuoteCopy } = require('../src/copywriter');

(async () => {
  // 1) Ground truth: the client, 0.23 acres net, heavy density, fall cleanup.
  const client = engine.quote({ acres: 0.23, density: 'heavy', service: 'fall' });
  assert.strictEqual(client.total, 194, `Client ground truth must be $194, got $${client.total}`);
  console.log('PASS Client ground truth: 0.23 ac, heavy density, fall cleanup = $194');

  // 2) No haul away exists anywhere in this price book.
  assert.strictEqual(engine.HAUL_AWAY, undefined, 'PineQuote edition must not export a haul away price');
  const anyQuote = engine.quote({ acres: 0.4, density: 'moderate', service: 'fall', haulAway: true });
  assert.ok(!anyQuote.lineItems.some(i => /haul/i.test(i.label)), 'No haul away line item may ever appear');
  console.log('PASS no haul away: the add on does not exist in the PineQuote price book');

  // 3) Tier and multiplier sanity from Brandon's price book.
  assert.strictEqual(engine.quote({ acres: 0.2, density: 'light', service: 'fall' }).total, 149);
  assert.strictEqual(engine.quote({ acres: 0.4, density: 'moderate', service: 'fall' }).total, Math.round(249 * 1.15));
  assert.strictEqual(engine.quote({ acres: 0.9, density: 'light', service: 'fall' }).total, 349);
  assert.strictEqual(engine.quote({ acres: 1.4, density: 'light', service: 'fall' }).custom, true);
  console.log('PASS price book tiers and multipliers, XL goes custom');

  // 4) Snow paths.
  assert.strictEqual(engine.quote({ acres: 0.3, service: 'snow', snowPlan: 'per-push' }).total, 45);
  assert.strictEqual(engine.quote({ acres: 0.3, service: 'snow', snowPlan: 'seasonal' }).total, 499);
  console.log('PASS snow per push $45 and season contract path');

  // 5) Segmentation on the actual bundled Client tile pixels.
  const W = 512, H = 512;
  const rgb = fs.readFileSync(path.join(__dirname, 'client-tile-rgb.bin'));
  assert.strictEqual(rgb.length, W * H * 3);
  const rgba = new Uint8ClampedArray(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    rgba[p * 4] = rgb[p * 3]; rgba[p * 4 + 1] = rgb[p * 3 + 1]; rgba[p * 4 + 2] = rgb[p * 3 + 2]; rgba[p * 4 + 3] = 255;
  }
  const s = seg.segment(rgba, W, H);
  const net = Math.round(0.29 * s.serviceableShare * 100) / 100;
  const density = seg.densityFor(s.canopyShare);
  console.log(`  tile read: serviceable ${net} ac, canopy share ${(s.canopyShare * 100).toFixed(1)} percent, density ${density}`);
  assert.ok(net >= 0.22 && net <= 0.24, `Net serviceable must land at 0.22 to 0.24 ac, got ${net}`);
  assert.strictEqual(density, 'heavy', 'Client canopy must read heavy');
  const endToEnd = engine.quote({ acres: net, density, service: 'fall' });
  assert.strictEqual(endToEnd.total, 194, `End to end tile to quote must be $194, got $${endToEnd.total}`);
  console.log('PASS end to end: tile pixels to segmentation to engine = $194');

  // 6) Copywriter: honest provider label and the tree line rule in the copy.
  const copy = await writeQuoteCopy({ acres: net, grossAcres: 0.29, canopyShare: s.canopyShare, density, service: 'fall', quote: endToEnd });
  assert.strictEqual(copy.provider, 'local-template-fallback');
  assert.ok(/tree line/.test(copy.customerCopy), 'Customer copy must state the tree line rule');
  assert.ok(/\$194/.test(copy.customerCopy), 'Customer copy must carry the total');
  console.log('PASS copywriter: labeled fallback, tree line rule stated, total present');

  console.log('\nAll PineQuote tests passed.');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
