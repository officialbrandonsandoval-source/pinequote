const tileCanvas = document.getElementById('tileCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const segStats = document.getElementById('segStats');
const quoteOut = document.getElementById('quoteOut');
let lastSeg = null;
let quoteMode = true;

const CLASS_COLORS = [
  [110, 190, 80],   // lawn, bright green
  [30, 80, 120],    // canopy, deep blue so it reads against green
  [150, 148, 144],  // hardscape, gray
  [200, 60, 60],    // other, red (should be near zero)
];

function loadTile(src, note, canQuote) {
  const img = new Image();
  img.onload = () => {
    const ctx = tileCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 512, 512);
    document.getElementById('runSeg').disabled = false;
    quoteMode = canQuote;
    if (note) document.getElementById('imageryNote').textContent = note;
    segStats.innerHTML = '';
    quoteOut.innerHTML = '';
    document.getElementById('buildQuote').disabled = true;
  };
  img.src = src;
}

document.getElementById('loadClient').addEventListener('click', () => {
  document.getElementById('address').value = 'Client test yard, Woodruff, WI';
  document.getElementById('gross').value = '0.29';
  loadTile('assets/client-tile.png',
    'Sample tile drawn to a real client yard and its measurements: 0.29 acres gross, heavy pine canopy. The hand measured quote is the test this demo has to match.', true);
});

document.getElementById('loadEsri').addEventListener('click', () => {
  loadTile('assets/woodruff-esri.png',
    'Real Esri World Imagery over Woodruff, Wisconsin. Class shares only on this one, because it is a town view rather than one parcel.', false);
});

document.getElementById('runSeg').addEventListener('click', () => {
  const ctx = tileCanvas.getContext('2d');
  const data = ctx.getImageData(0, 0, 512, 512);
  const seg = window.PineSegment.segment(data.data, 512, 512);
  lastSeg = seg;
  const octx = overlayCanvas.getContext('2d');
  const out = octx.createImageData(512, 512);
  for (let p = 0; p < seg.classes.length; p++) {
    const c = CLASS_COLORS[seg.classes[p]];
    out.data[p * 4] = c[0]; out.data[p * 4 + 1] = c[1]; out.data[p * 4 + 2] = c[2]; out.data[p * 4 + 3] = 255;
  }
  octx.putImageData(out, 0, 0);
  const gross = parseFloat(document.getElementById('gross').value) || 0.29;
  const net = Math.round(gross * seg.serviceableShare * 100) / 100;
  const density = window.PineSegment.densityFor(seg.canopyShare);
  segStats.innerHTML =
    `Lawn ${(seg.fractions.lawn * 100).toFixed(1)} percent, canopy ${(seg.fractions.canopy * 100).toFixed(1)} percent, ` +
    `hardscape ${(seg.fractions.hardscape * 100).toFixed(1)} percent.<br>` +
    `Serviceable area: <strong>${net} acres</strong> of ${gross} gross. ` +
    `Canopy covers <strong>${Math.round(seg.canopyShare * 100)} percent</strong> of the serviceable area, which is the <strong>${density}</strong> density band.`;
  document.getElementById('buildQuote').disabled = !quoteMode;
  if (!quoteMode) segStats.innerHTML += '<br>This view is a classifier demonstration, so no quote is built from it.';
});

document.getElementById('buildQuote').addEventListener('click', async () => {
  const gross = parseFloat(document.getElementById('gross').value) || 0.29;
  const net = Math.round(gross * lastSeg.serviceableShare * 100) / 100;
  const density = window.PineSegment.densityFor(lastSeg.canopyShare);
  const res = await fetch('/api/quote', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acres: net, grossAcres: gross, canopyShare: lastSeg.canopyShare, density, service: document.getElementById('service').value, snowPlan: 'seasonal' }),
  });
  const j = await res.json();
  if (j.quote.custom) {
    quoteOut.innerHTML = `<p>${j.quote.summary}</p><p>${j.note}</p>`;
    return;
  }
  const rows = j.quote.lineItems.map(i => `<tr><td>${i.label}</td><td>$${i.amount}</td></tr>`).join('');
  quoteOut.innerHTML =
    `<p class="price">Total $${j.quote.total}<span class="badge">${j.confidence === 'firm' ? 'Firm quote' : 'Range, drive by offered'}</span></p>` +
    `<table>${rows}</table>` +
    `<p>${j.note}</p>` +
    `<h3>Why this price</h3><ul>${j.reasoning.map(r => `<li>${r}</li>`).join('')}</ul>` +
    `<h3>Customer ready copy</h3><pre class="copy">${j.customerCopy}</pre>` +
    `<p class="fine">Copy provider: ${j.copyProvider}. In production this copy is written by a Meta model through the Meta Model API.</p>`;
});

// Start on the test yard so the demo opens with the ground truth case loaded.
document.getElementById('loadClient').click();
