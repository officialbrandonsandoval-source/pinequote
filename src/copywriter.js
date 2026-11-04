// Writes the quote reasoning and the customer facing copy.
// Tries the Meta Model API first (see meta-client.js). In the demo there is
// no API key configured, so this local template writer does the job and the
// result is labeled with provider "local-template-fallback" everywhere it is
// shown. No silent theater.
const meta = require('./meta-client');

const DENSITY_WORDS = {
  light: 'light leaf and needle cover',
  moderate: 'a moderate blanket of leaves and needles',
  heavy: 'heavy pine needle cover under dense evergreen canopy',
};

async function writeQuoteCopy(ctx) {
  const fromMeta = await meta.generateCopy(ctx);
  if (fromMeta) return { ...fromMeta, provider: 'meta-model-api' };

  const { acres, grossAcres, canopyShare, density, service, quote } = ctx;
  const reasoning = [];
  if (service === 'fall' || service === 'both') {
    reasoning.push(`Satellite read: ${grossAcres} acres gross, ${acres} acres of serviceable lawn after roof and driveway are set aside.`);
    reasoning.push(`Evergreen canopy covers about ${Math.round(canopyShare * 100)} percent of the serviceable area, which maps to the ${density} density band in the Iron and Pine price book.`);
    reasoning.push(`The yard shows ${DENSITY_WORDS[density]}, so the tier price is adjusted by the x${density === 'light' ? '1.0' : density === 'moderate' ? '1.15' : '1.3'} density multiplier.`);
    reasoning.push('All leaves and needles are blown to the tree line on the property. Iron and Pine does not haul debris away, and no haul away charge is included.');
  }
  if (service === 'snow' || service === 'both') {
    reasoning.push('Snow pricing comes straight from the price book: per push billing or a season contract that books a route slot.');
  }
  if (quote.custom) {
    reasoning.push('This yard is over the one acre tier limit, so the owner confirms a custom price instead of the tool guessing.');
  }

  const lines = quote.lineItems ? quote.lineItems.map(i => `${i.label}: $${i.amount}`) : [];
  const customerCopy = quote.custom
    ? `Thanks for asking Iron and Pine Outdoor Co. for a quote. Your yard is larger than our standard tiers, so Brandon will confirm a custom price personally rather than have a tool guess at it.`
    : [
        'Thanks for asking Iron and Pine Outdoor Co. for a quote.',
        `From satellite imagery we measured about ${acres} acres to service, with ${DENSITY_WORDS[density]}.`,
        ...lines,
        `Total: $${quote.total}.`,
        'Every cleanup is blown to the tree line on your property. Reply here and we will book your day.',
      ].join('\n');

  return { reasoning, customerCopy, provider: 'local-template-fallback' };
}

module.exports = { writeQuoteCopy };
