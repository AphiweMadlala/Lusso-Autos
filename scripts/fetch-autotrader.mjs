// Fetches every Lusso Auto listing from AutoTrader and stores the raw,
// dealer-entered data with provenance. No interpretation happens here —
// scripts/build-vehicles.mjs turns this into the canonical dataset.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const OUT_DIR = new URL('data/sources/autotrader/', ROOT);
const DEALER_ID = 113036;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const today = new Date().toISOString().slice(0, 10);

const { urls } = JSON.parse(await readFile(new URL('listing-urls.json', OUT_DIR)));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// AutoTrader rate-limits bursts with 503s; back off and retry. 404 = listing removed.
async function get(url, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-ZA,en' } });
    if (res.ok) return res.text();
    if (res.status !== 503 || attempt >= tries) throw new Error(`${res.status} ${url}`);
    await sleep(15000 * attempt);
  }
}

// Re-running keeps previously fetched listings and only retries missing/failed ones.
const previous = await readFile(new URL('listings.json', OUT_DIR), 'utf8').then(JSON.parse).catch(() => ({ listings: [] }));
const done = new Map(previous.listings.filter((l) => !l.error).map((l) => [l.url, l]));
const refresh = process.argv.includes('--refresh');

// AutoTrader server-renders each page's React props as a JSON literal.
function extractProps(html, component) {
  const marker = `Components.${component}(), `;
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const src = html.slice(i + marker.length);
  // Walk the JSON literal to find its end (strings may contain braces).
  let depth = 0, inStr = false, esc = false;
  for (let j = 0; j < src.length; j++) {
    const c = src[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(src.slice(0, j + 1));
  }
  throw new Error('Unterminated props JSON');
}

const nbsp = (s) => (typeof s === 'string' ? s.replace(/ /g, ' ').trim() : s);

// Dealer profile (address, hours, reps, rating)
try {
  const dealerHtml = await get(`https://www.autotrader.co.za/dealer/lusso-auto/${DEALER_ID}`);
  const dealer = extractProps(dealerHtml, 'Desktop_Views_Dealer_DealerProfile');
  await writeFile(new URL('dealer-profile.raw.json', OUT_DIR), JSON.stringify({ retrievedAt: today, ...dealer }, null, 1));
} catch (e) {
  console.warn(`! dealer profile not refreshed (${e.message}); keeping previous copy`);
}

const listings = [];
for (const path of urls) {
  const url = `https://www.autotrader.co.za${path}`;
  if (!refresh && done.has(url)) { listings.push(done.get(url)); continue; }
  let props;
  try {
    props = extractProps(await get(url), 'Desktop_Views_Listing_Listing');
  } catch (e) {
    console.warn(`! ${path}: ${e.message}`);
    listings.push({ url, error: e.message, retrievedAt: today });
    continue;
  }
  if (!props) { console.warn(`! ${path}: no listing props (listing removed?)`); listings.push({ url, error: 'no-props', retrievedAt: today }); continue; }
  if (props.listingDealer?.id !== DEALER_ID) { console.warn(`! ${path}: dealer ${props.listingDealer?.id} is not Lusso — skipped`); continue; }

  const icons = Object.fromEntries((props.summaryIcons || []).map((i) => [i.title, nbsp(i.text)]));
  const info = Object.fromEntries((props.additionalInformation || []).map((i) => [i.label, nbsp(i.text)]));
  const specs = {};
  for (const cat of props.listingSpecifications?.specificationCategories || [])
    for (const it of cat.categoryItems || []) specs[it.name] = nbsp(it.value);
  const price = props.priceInformation?.retailPrice || {};

  listings.push({
    listingId: props.listingId,
    url,
    retrievedAt: today,
    title: nbsp(props.header?.registrationYearMakeModelVariant),
    make: specs.Make ?? null,
    model: specs.Model ?? null,
    variant: specs.Variant ?? nbsp(props.header?.variant) ?? null,
    registrationYear: icons['Registration Year'] ?? null,
    mileage: icons.Mileage ?? null,
    transmission: icons.Transmission ?? null,
    fuelType: icons['Fuel Type'] ?? null,
    priceText: nbsp(price.price ?? props.header?.listingPrice),
    priceOnApplication: Boolean(price.priceOnApplication) || /POA/i.test(props.header?.listingPrice || ''),
    dealerDescription: props.description ?? '',
    additionalInformation: info,
    optionalExtras: props.optionalExtras ?? [],
    // Model-level reference data from AutoTrader's spec database (NOT dealer-stated).
    referenceSpecifications: specs,
    salesRepresentatives: (props.listingDealer?.salesRepresentatives || []).map(({ id, name, imageUrl }) => ({ id, name, imageUrl })),
    images: (props.gallery?.galleryImages || []).map((g, i) => ({ order: i + 1, imageId: g.imageId, originalUrl: g.originalImageUrl, alt: g.altTag })),
  });
  console.log(`✓ ${props.header?.registrationYearMakeModelVariant} — ${props.gallery?.galleryImages?.length ?? 0} images`);
  await sleep(6000);
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL('listings.json', OUT_DIR), JSON.stringify({ source: `https://www.autotrader.co.za/dealer/lusso-auto/${DEALER_ID}`, retrievedAt: today, count: listings.length, listings }, null, 2));
console.log(`\n${listings.length} listings written to data/sources/autotrader/listings.json`);
