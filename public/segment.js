// Classical color segmentation for a satellite tile, shared by the browser
// demo and the Node test suite. Classes: lawn, canopy, hardscape, other.
// Rules (documented, intentionally simple and honest):
//   hardscape: low saturation gray (roof, concrete, asphalt) at mid brightness
//   vegetation: excess green index ExG = 2G - R - B above 12
//   canopy: vegetation that is dark (deep shade crowns) ; lawn: brighter turf
//   warm bare crowns (red dominant) also count as canopy
// Production upgrade path: SAM 3.1 through the Meta Model API. The demo ships
// this fallback because no Meta API key is configured, and says so.
(function (global) {
  function classifyPixel(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx ? (mx - mn) / mx : 0;
    const exg = 2 * g - r - b;
    if (sat < 0.18 && mx > 60 && mx < 235) return 'hardscape';
    if (exg > 12) return g < 95 ? 'canopy' : 'lawn';
    if (r > g && r > b && sat >= 0.18) return 'canopy';
    return 'other';
  }

  function segment(rgba, width, height) {
    const counts = { lawn: 0, canopy: 0, hardscape: 0, other: 0 };
    const classes = new Uint8Array(width * height);
    const NAMES = ['lawn', 'canopy', 'hardscape', 'other'];
    for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
      const c = classifyPixel(rgba[i], rgba[i + 1], rgba[i + 2]);
      counts[c]++; classes[p] = NAMES.indexOf(c);
    }
    const total = width * height;
    const serviceable = counts.lawn + counts.canopy;
    return {
      counts, classes, total,
      fractions: {
        lawn: counts.lawn / total,
        canopy: counts.canopy / total,
        hardscape: counts.hardscape / total,
        other: counts.other / total,
      },
      canopyShare: serviceable ? counts.canopy / serviceable : 0,
      serviceableShare: serviceable / total,
    };
  }

  function densityFor(canopyShare) {
    if (canopyShare > 0.60) return 'heavy';
    if (canopyShare >= 0.25) return 'moderate';
    return 'light';
  }

  const api = { classifyPixel, segment, densityFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.PineSegment = api;
})(typeof window !== 'undefined' ? window : globalThis);
