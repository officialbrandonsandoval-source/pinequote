// PineQuote demo server: static files plus a quote API backed by the real
// Iron and Pine pricing engine. No dependencies. Run: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { quote } = require('./src/quote-engine');
const { writeQuoteCopy } = require('./src/copywriter');

const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/quote') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', async () => {
      try {
        const j = JSON.parse(body || '{}');
        const acres = Math.round(Number(j.acres) * 100) / 100;
        const grossAcres = Number(j.grossAcres) || acres;
        const canopyShare = Number(j.canopyShare) || 0;
        const density = ['light', 'moderate', 'heavy'].includes(j.density) ? j.density : 'light';
        const service = ['fall', 'snow', 'both'].includes(j.service) ? j.service : 'fall';
        const q = quote({ acres, density, service, snowPlan: j.snowPlan === 'per-push' ? 'per-push' : 'seasonal' });
        // Confidence gate: if canopy hides almost all of the ground, quote a
        // range and offer a free drive by instead of a firm number.
        const lowConfidence = canopyShare >= 0.85;
        const copy = await writeQuoteCopy({ acres, grossAcres, canopyShare, density, service, quote: q });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          quote: q, acres, grossAcres, canopyShare, density, service,
          confidence: lowConfidence ? 'range' : 'firm',
          note: lowConfidence
            ? 'Canopy hides most of the ground here, so this is a range and a free drive by is offered before a firm price.'
            : 'Firm quote from the satellite read. If the yard differs on the ground, the price is confirmed before work starts.',
          reasoning: copy.reasoning, customerCopy: copy.customerCopy, copyProvider: copy.provider,
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad quote request' }));
      }
    });
    return;
  }
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = path.join(PUBLIC, urlPath);
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const PORT = process.env.PORT || 4173;
server.listen(PORT, () => console.log(`PineQuote demo at http://localhost:${PORT}`));
