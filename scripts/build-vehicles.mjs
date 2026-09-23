// Builds the canonical data/vehicles.json from the raw source snapshots:
//   data/sources/autotrader/listings.json   (current dealer inventory — status authority)
//   data/sources/lussoauto-site/parsed.json (Lusso's own site: vehicle pages + Sold portfolio)
//   data/instagram-posts.json               (optional — linked when a post clearly matches)
//
// Rules (see PROJECT_CONTEXT.md → "Status methodology"):
//   • A vehicle is AVAILABLE only if its AutoTrader listing was fetched live under dealer 113036.
//   • SOLD only when Lusso's own Sold portfolio lists it.
//   • Anything else is UNKNOWN and never shown as current stock.
//   • Specs are copied only when the dealer wrote them; AutoTrader's model-level
//     reference database is deliberately NOT used for vehicle facts.
// Existing media assignments (written by process-media.mjs) are preserved.
import { readJSON, writeJSON, slugify, parseRand, parseKm, today } from './lib/util.mjs';

const at = await readJSON('data/sources/autotrader/listings.json');
const site = await readJSON('data/sources/lussoauto-site/parsed.json');
const ig = await readJSON('data/instagram-posts.json', { posts: [] });
const previous = await readJSON('data/vehicles.json', { vehicles: [] });
const prevById = new Map(previous.vehicles.map((v) => [v.id, v]));

const conflicts = [];
const warnings = [];

// ---------------------------------------------------------------- description parsing
const BOILERPLATE = [
  /^BY APPOINTMENT ONLY:?$/i,
  /^viewing (is )?strictly by appointment/i,
  /^finance (is )?available/i,
  /^contact (arno|us)/i,
  /^(selected )?trade-ins (are )?welcome/i,
];
const SPEC_MARKER = /^(SPECIFICATION|SPECIFICATIONS|Features include|Key features|Highlights|Features):?$/i;

function parseDescription(raw) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  let headline = null;
  if (/^BY APPOINTMENT ONLY:\s*\S/i.test(lines[0] || '')) headline = lines[0].replace(/^BY APPOINTMENT ONLY:\s*/i, '');
  const services = {
    byAppointment: /by appointment/i.test(raw),
    financeViaBanks: /finance (is )?available through all major banks/i.test(raw),
    tradeInsWelcome: /trade-ins (are )?welcome/i.test(raw),
  };
  const intro = [], features = [], closing = [];
  let mode = 'intro';
  for (const l of lines.slice(headline || /^BY APPOINTMENT ONLY:?$/i.test(lines[0]) ? 1 : 0)) {
    // Boilerplate sentences may be joined on one line; drop them sentence by sentence.
    const kept = l.split(/(?<=\.)\s+/).filter((s) => !BOILERPLATE.some((re) => re.test(s))).join(' ').trim();
    if (!kept) continue;
    if (SPEC_MARKER.test(kept)) { mode = 'features'; continue; }
    const bullet = /^[•\-–*]\s*/.test(kept);
    const text = kept.replace(/^[•\-–*]\s*/, '');
    if (mode === 'intro') intro.push(text);
    else if (mode === 'features' && (bullet || (text.length <= 70 && !/[.!]$/.test(text)))) features.push(text);
    else { mode = 'closing'; closing.push(text); }
  }
  return { headline, intro, features, closing, services };
}

const firstMatch = (list, re) => list.find((l) => re.test(l)) ?? null;

function explicitSpecs(features, prose) {
  const all = [...features, ...prose];
  const engine = firstMatch(features, /\b\d\.\d\s?-?L(itre)?\b/i) ?? firstMatch(features, /\b(V6|V8|V10|V12|W12|flat-six|inline-six|straight-six|four-cylinder|turbocharged)\b.*\b(engine|petrol|diesel)?/i);
  const kwLine = firstMatch(all, /\b\d{2,4}\s?kW\b/);
  const nmLine = firstMatch(all, /\b\d{3,4}\s?Nm\b/);
  const drive = firstMatch(features, /\b(rear|all|four)[- ]wheel drive\b|\bquattro\b|\bxDrive\b|\b4MATIC\b|\bAWD\b|\bRWD\b|\b4x4\b/i);
  const gearbox = firstMatch(features.filter((f) => !/light|wiper|climate|mirror|seat/i.test(f)), /\b\d-speed\b|\bPDK\b|\bDCT\b|dual-clutch|S tronic|tiptronic|steptronic|gated manual|(manual|automatic) (transmission|gearbox)/i);
  const interior = firstMatch(features, /^interior (in|finished in)\b.*(leather|alcantara|cloth|nappa|merino|vinyl)|(leather|alcantara|cloth|nappa|merino|vinyl)[^,]*\binterior$/i);
  return {
    engine,
    powerKw: kwLine ? Number(kwLine.match(/(\d{2,4})\s?kW/)[1]) : null,
    powerSource: kwLine,
    torqueNm: nmLine ? Number(nmLine.match(/(\d{3,4})\s?Nm/)[1]) : null,
    torqueSource: nmLine,
    drivetrain: drive,
    transmissionDetail: gearbox,
    interior: interior ? interior.replace(/^interior (in|finished in)\s+/i, '').replace(/\s*interior$/i, '').trim() : null,
    keys: firstMatch(features, /\bkeys?\b/i),
    books: firstMatch(features, /\bbooks?\b|owner'?s manual|handbook/i),
  };
}

const HIGHLIGHT = /accident free|service history|original|virgin paint|books|keys|one owner|1 owner|low mileage|carbon|ceramic|sport chrono|warranty|major service|collector|limited edition|gated manual|manual transmission|suspension lift|ppf|battery/i;

// ---------------------------------------------------------------- make/model helpers
const MAKES = ['Harley-Davidson', 'Mercedes-Maybach', 'Mercedes-AMG', 'Mercedes-Benz', 'Mercedes Benz', 'Mercedes', 'Merc', 'Alfa Romeo', 'Aston Martin', 'Land Rover', 'Range Rover', 'Rolls-Royce', 'Rolls Royce', 'Ferrari', 'Porsche', 'Lamborghini', 'McLaren', 'Mclaren', 'Bentley', 'BMW', 'Bmw', 'Audi', 'Jaguar', 'MINI', 'Mini', 'Fiat', 'Abarth', 'Volkswagen', 'VW', 'Ford', 'Dodge', 'Toyota', 'Lotus', 'Jeep', 'Nissan', 'Lexus', 'Maserati', 'Chevrolet', 'Mazda', 'Lambo', 'Boxter'];
const CANON = { 'Mercedes Benz': 'Mercedes-Benz', Mercedes: 'Mercedes-Benz', Merc: 'Mercedes-Benz', 'Rolls Royce': 'Rolls-Royce', Mclaren: 'McLaren', Bmw: 'BMW', Mini: 'MINI', VW: 'Volkswagen', Lambo: 'Lamborghini' };

function splitTitle(title) {
  const m = title.match(/^(\d{4})\s+(.*)$/);
  const year = m ? Number(m[1]) : null;
  let rest = (m ? m[2] : title).trim();
  let make = MAKES.find((mk) => rest.toLowerCase().startsWith(mk.toLowerCase() + ' ') || rest.toLowerCase() === mk.toLowerCase()) ?? null;
  let model = make ? rest.slice(make.length).trim() : rest;
  if (make === 'Range Rover') { model = `Range Rover ${model}`.trim(); make = 'Land Rover'; }
  if (make === 'Mercedes' && /^AMG\b/.test(model)) { make = 'Mercedes-AMG'; model = model.replace(/^AMG\s*/, ''); }
  if (make === 'Boxter') { make = 'Porsche'; model = `Boxster ${model}`.trim(); } // title typo on the Sold page
  make = CANON[make] ?? make;
  return { year, make, model };
}

// Sold archive tiering — which past cars best demonstrate calibre. Presentation-only.
const COLLECTOR_MAKES = /^(Ferrari|Lamborghini|McLaren|Aston Martin|Bentley|Rolls-Royce|Mercedes-Maybach)$/;
const COLLECTOR_MODELS = /\bGT3\b|GT3 RS|Turbo S|\bGTS\b|AMG GT|SL ?65|SL ?63|G ?63|S ?63|C ?63|Carrera 4S|\bM[34]\b|R8|Raptor|Mustang|Restomod|Esprit|GTA|F-Type|XKR/i;

// ---------------------------------------------------------------- current inventory
const sitePages = site.vehiclePages;
const siteByListing = new Map();
for (const p of sitePages) for (const u of p.autotraderUrls) {
  const id = Number(u.match(/(\d+)$/)?.[1]);
  if (!siteByListing.has(id)) siteByListing.set(id, []);
  siteByListing.get(id).push(p);
}

const vehicles = [];
const usedSlugs = new Set();
const uniqueSlug = (base, suffix) => {
  let s = base;
  if (usedSlugs.has(s)) s = `${base}-${suffix}`;
  usedSlugs.add(s);
  return s;
};

for (const l of at.listings) {
  const listingId = Number(l.listingId ?? l.url.match(/(\d+)$/)[1]);
  const pages = siteByListing.get(listingId) ?? [];
  if (l.error) {
    // Not live on AutoTrader. Handled below with the unmatched site pages.
    for (const p of pages) p._atError = l.error;
    continue;
  }
  const d = parseDescription(l.dealerDescription);
  const spec = explicitSpecs(d.features, [...d.intro, ...d.closing]);
  const year = Number(l.registrationYear) || null;
  const id = `at-${listingId}`;
  const name = `${l.make} ${l.model}`;
  const variantRaw = (l.variant ?? '').trim();
  // AutoTrader repeats the model in some variants ("718 Cayman 718 Cayman S Auto", "GTC4Lusso GTC4Lusso").
  let variant = variantRaw.replace(new RegExp(`^${l.model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
  if (variant.toLowerCase() === l.model.toLowerCase()) variant = '';
  const slug = uniqueSlug(slugify([year, l.make, l.model, variant].filter(Boolean).join(' ')), listingId);

  // ---- conflicts between sources (flagged, never merged)
  const headYear = d.headline?.match(/\b(19|20)\d{2}\b/)?.[0];
  if (headYear && Number(headYear) !== year) conflicts.push({ vehicle: id, field: 'year', values: [{ source: 'AutoTrader registration year', value: year }, { source: 'Dealer description headline', value: Number(headYear) }], resolution: `Displayed ${year} (structured registration-year field${pages.some((p) => p.title.startsWith(String(year))) ? ', matches Lusso site page title' : ''}). Needs client confirmation.` });
  for (const p of pages) {
    const siteKm = parseKm(p.attributes.MILEAGE);
    const atKm = parseKm(l.mileage);
    if (siteKm && atKm && siteKm !== atKm) conflicts.push({ vehicle: id, field: 'mileageKm', values: [{ source: `AutoTrader (last updated ${l.additionalInformation['Last Updated']})`, value: atKm }, { source: `Lusso site ${p.url} (modified ${p.modified.slice(0, 10)})`, value: siteKm }], resolution: 'Displayed AutoTrader value — the more recently updated listing.' });
    const sitePrice = parseRand(p.priceText);
    const atPrice = parseRand(l.priceText);
    if (sitePrice && atPrice && sitePrice !== atPrice) conflicts.push({ vehicle: id, field: 'priceZAR', values: [{ source: 'AutoTrader', value: atPrice }, { source: `Lusso site ${p.url} (modified ${p.modified.slice(0, 10)})`, value: sitePrice }], resolution: 'Displayed AutoTrader price — the more recently updated listing.' });
  }

  const soldFlag = /\b(SOLD|RESERVED|DEPOSIT (TAKEN|RECEIVED))\b/.test(l.dealerDescription);
  if (soldFlag) warnings.push(`${id}: description mentions SOLD/RESERVED — review manually`);
  const info = l.additionalInformation;
  const prev = prevById.get(id);
  const owners = /^\d+$/.test(info['Previous Owners'] ?? '') ? Number(info['Previous Owners']) : null;
  const igMatch = ig.posts.filter((p) => year && p.caption && new RegExp(`\\b${year}\\b`).test(p.caption) && p.caption.toLowerCase().includes(l.model.toLowerCase()));

  vehicles.push({
    id,
    slug,
    status: soldFlag ? 'unknown' : 'available',
    year,
    make: l.make,
    model: l.model,
    variant,
    title: [year, l.make, l.model, variant].filter(Boolean).join(' '),
    priceZAR: parseRand(l.priceText),
    priceOnApplication: l.priceOnApplication,
    mileageKm: parseKm(l.mileage),
    engine: spec.engine ?? '',
    transmission: l.transmission ?? '',
    transmissionDetail: spec.transmissionDetail ?? '',
    fuelType: l.fuelType ?? '',
    drivetrain: spec.drivetrain ?? '',
    powerKw: spec.powerKw,
    torqueNm: spec.torqueNm,
    bodyType: info['Body Type'] ?? '',
    exteriorColour: info['Manufacturers Colour'] ?? info.Colour ?? '',
    interiorColour: spec.interior ?? '',
    serviceHistory: info['Service History'] ?? '',
    owners,
    ownersText: info['Previous Owners'] ?? '',
    warranty: info.Warranty ?? null,
    keys: spec.keys,
    books: spec.books,
    headline: d.headline,
    description: [...d.intro, ...d.closing].join('\n\n'),
    highlights: d.features.filter((f) => HIGHLIGHT.test(f)).slice(0, 6),
    features: d.features,
    dealerServices: d.services,
    images: prev?.images ?? [],
    imageSource: prev?.imageSource ?? null,
    video: prev?.video ?? null,
    instagramUrl: igMatch.length === 1 ? igMatch[0].url : '',
    dealerListingUrl: l.url,
    lussoSiteUrl: pages[0]?.url ?? '',
    mediaSources: {
      autotrader: l.images.map((i) => ({ order: i.order, url: i.originalUrl, imageId: i.imageId })),
      lussoSite: pages.flatMap((p) => p.gallery.map((g) => g.src)),
    },
    sourceUrls: [l.url, ...pages.map((p) => p.url)],
    listingLastUpdated: info['Last Updated'] ?? null,
    lastVerifiedAt: l.retrievedAt,
    confidence: pages.length ? 'high — live AutoTrader listing, corroborated by Lusso site page' : 'high — live AutoTrader listing',
    fieldProvenance: {
      status: 'Live AutoTrader dealer listing (dealer 113036) fetched ' + l.retrievedAt,
      'year/make/model/variant/price/mileage/transmission/fuelType': 'AutoTrader structured listing fields (dealer-entered)',
      'exteriorColour/serviceHistory/owners/bodyType/warranty': 'AutoTrader "additional information" (dealer-entered)',
      'engine/power/torque/drivetrain/interior/features/description': 'Dealer seller-comments text, copied only where explicitly stated',
      ...(spec.powerSource ? { powerKw: `"${spec.powerSource}"` } : {}),
      ...(spec.torqueSource ? { torqueNm: `"${spec.torqueSource}"` } : {}),
    },
  });
}

// ---------------------------------------------------------------- Lusso site pages without a live listing
const liveIds = new Set(vehicles.map((v) => Number(v.id.slice(3))));
for (const p of sitePages) {
  const linked = p.autotraderUrls.map((u) => Number(u.match(/(\d+)$/)?.[1]));
  if (linked.some((id) => liveIds.has(id))) continue;
  const { year, make, model } = splitTitle(p.title);
  const id = `site-${p.slug}`;
  const reason = p._atError ? `linked AutoTrader listing returned ${p._atError.split(' ')[0]}` : 'linked AutoTrader listing is not in the current dealer inventory';
  warnings.push(`${id}: status unknown — ${reason}${p.listedOnBuyingPage ? ' (still linked from lussoauto.co.za/buying)' : ''}`);
  if (p.listedOnBuyingPage) conflicts.push({ vehicle: id, field: 'status', values: [{ source: 'lussoauto.co.za/buying (lists as stock)', value: 'available' }, { source: 'AutoTrader', value: reason }], resolution: 'Marked UNKNOWN; excluded from current collection until the client confirms.' });
  vehicles.push({
    id, slug: uniqueSlug(slugify(p.title), p.slug), status: 'unknown', year, make, model, variant: '', title: p.title,
    priceZAR: parseRand(p.priceText), priceOnApplication: false, mileageKm: parseKm(p.attributes.MILEAGE),
    exteriorColour: p.attributes['MANUFACTURERS COLOUR'] ?? '', serviceHistory: p.attributes['Service History'] ?? '',
    images: prevById.get(id)?.images ?? [], mediaSources: { lussoSite: p.gallery.map((g) => g.src) },
    lussoSiteUrl: p.url, dealerListingUrl: p.autotraderUrls[0] ?? '', sourceUrls: [p.url, ...p.autotraderUrls],
    lastVerifiedAt: site.retrievedAt, confidence: 'low — current status cannot be established',
  });
}

// ---------------------------------------------------------------- Sold portfolio
const seenSold = new Set();
for (const s of site.sold) {
  if (seenSold.has(s.image.src)) continue; // the page repeats blocks per breakpoint
  seenSold.add(s.image.src);
  const { year, make, model } = splitTitle(s.title);
  if (!make) warnings.push(`sold "${s.title}": make not recognised`);
  const id = `sold-${s.image.wpId}`;
  const tier = COLLECTOR_MAKES.test(make ?? '') || COLLECTOR_MODELS.test(s.title) ? 'collector' : 'register';
  vehicles.push({
    id, slug: uniqueSlug(`sold-${slugify(s.title)}`, s.image.wpId), status: 'sold', year, make: make ?? '', model, variant: '', title: s.title,
    archiveTier: tier, archiveOrder: s.order,
    images: prevById.get(id)?.images ?? [],
    mediaSources: { lussoSite: [s.image.src] }, sourceImage: s.image,
    sourceUrls: ['https://lussoauto.co.za/sold/'], lastVerifiedAt: site.retrievedAt,
    confidence: 'high — listed in Lusso Auto’s own “Our Sold Portfolio”',
  });
}

await writeJSON('data/vehicles.json', {
  generatedAt: today(),
  statusRules: 'available = live AutoTrader listing under dealer 113036; sold = listed on lussoauto.co.za/sold; unknown = everything else (never shown as current stock).',
  counts: {
    available: vehicles.filter((v) => v.status === 'available').length,
    sold: vehicles.filter((v) => v.status === 'sold').length,
    unknown: vehicles.filter((v) => v.status === 'unknown').length,
  },
  vehicles,
});
await writeJSON('data/sources/reconciliation.json', { generatedAt: today(), conflicts, warnings });
console.log(vehicles.reduce((a, v) => ({ ...a, [v.status]: (a[v.status] ?? 0) + 1 }), {}), `conflicts: ${conflicts.length}, warnings: ${warnings.length}`);
