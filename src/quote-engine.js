// Iron & Pine price book, PineQuote edition.
// Pricing math, tiers, and multipliers are Brandon's verified price book
// (set 2026-10-08), reused from the Quote to Paid engine.
// PineQuote change, per Brandon's standing rule of 2026-10-30: there is NO
// haul away add on. Every cleanup is blown to the tree line only, so the
// haul away line item and its price constant are removed in this edition.
// Label punctuation uses colons and commas instead of dashes.
// quote(job) -> { lineItems: [{label, amount}], total, summary } or { custom: true, summary }
const FALL_TIERS = [
  { maxAcres: 0.25, label: 'Fall cleanup, Small (up to 1/4 acre)', price: 149 },
  { maxAcres: 0.50, label: 'Fall cleanup, Medium (1/4 to 1/2 acre)', price: 249 },
  { maxAcres: 1.00, label: 'Fall cleanup, Large (1/2 to 1 acre)', price: 349 },
];
const DENSITY = { light: 1.0, moderate: 1.15, heavy: 1.3 };
const SNOW_SEASONAL = { min: 499, max: 749 };
const SNOW_PER_PUSH = 45;

function quote(job) {
  const items = [];
  if (job.service === 'fall' || job.service === 'both') {
    const tier = FALL_TIERS.find(t => job.acres <= t.maxAcres);
    if (!tier) return { custom: true, summary: 'Yard over 1 acre: custom quote, owner will confirm pricing.' };
    const mult = DENSITY[job.density || 'light'];
    const base = Math.round(tier.price * mult);
    items.push({ label: tier.label + (mult > 1 ? ` (leaf density x${mult})` : ''), amount: base });
  }
  if (job.service === 'snow' || job.service === 'both') {
    if (job.snowPlan === 'per-push') items.push({ label: 'Snow removal, per push (billed per visit)', amount: SNOW_PER_PUSH });
    else items.push({ label: 'Snow season contract (typical range $499 to $749; deposit books the route slot)', amount: SNOW_SEASONAL.min });
  }
  const total = items.reduce((s, i) => s + i.amount, 0);
  return { lineItems: items, total, summary: items.map(i => `${i.label}: $${i.amount}`).join(' | ') + ` => Total $${total}` };
}
module.exports = { quote, FALL_TIERS, DENSITY, SNOW_SEASONAL, SNOW_PER_PUSH };
