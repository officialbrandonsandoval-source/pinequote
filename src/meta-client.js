// Meta Model API client for PineQuote.
//
// Intended production wiring: the quote reasoning and the customer facing
// copy are written by a Meta model (Llama family) through the Meta Model API,
// and parcel segmentation upgrades from the classical classifier in
// public/segment.js to SAM 3.1 through the same API.
//
// Demo reality, stated plainly: this build ships WITHOUT a Meta Model API key
// configured, so generateCopy() returns null here and the copywriter falls
// back to local templates. Set META_API_KEY and META_MODEL in the environment
// and implement the HTTPS call below to go live. Nothing in the demo pretends
// a Meta model wrote copy that a template wrote.

async function generateCopy(/* payload */) {
  const key = process.env.META_API_KEY;
  const model = process.env.META_MODEL;
  if (!key || !model) return null; // caller falls back to local templates
  // TODO (production): POST the quote payload to the Meta Model API with a
  // structured output prompt and return { reasoning, customerCopy }.
  // Left unimplemented in the demo on purpose rather than faked.
  return null;
}

module.exports = { generateCopy };
