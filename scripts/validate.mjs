// Build-time data validation. Errors fail the build; warnings are reported.
// Never fixes data — it only reports. Run: npm run validate
import { stat } from 'node:fs/promises';
import { path, readJSON } from './lib/util.mjs';

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const { vehicles } = await readJSON('data/vehicles.json');
const business = await readJSON('data/business.json');
const team = await readJSON('data/team.json');
const curation = await readJSON('data/curation.json');
const manifest = await readJSON('data/media-manifest.json');
const testimonials = await readJSON('data/testimonials.json');

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const E164_ZA = /^\+27[1-9]\d{8}$/;
const STATUSES = new Set(['available', 'reserved', 'sold', 'poa', 'unknown']);
const fileExists = async (p) => { try { const s = await stat(path(p)); return s.size > 0 ? 'ok' : 'empty'; } catch { return 'missing'; } };

// ---------------------------------------------------------------- vehicles
const ids = new Set(), slugs = new Set();
for (const v of vehicles) {
  const at = v.id ?? '(no id)';
  if (!v.id) err(`vehicle without id: ${v.title}`);
  if (ids.has(v.id)) err(`duplicate vehicle id ${v.id}`); ids.add(v.id);
  if (!v.slug || !/^[a-z0-9-]+$/.test(v.slug)) err(`${at}: malformed slug "${v.slug}"`);
  if (slugs.has(v.slug)) err(`duplicate slug ${v.slug}`); slugs.add(v.slug);
  if (!STATUSES.has(v.status)) err(`${at}: invalid status "${v.status}"`);
  if (!v.sourceUrls?.length) err(`${at}: no source provenance`);
  for (const u of v.sourceUrls ?? []) if (!URL_RE.test(u)) err(`${at}: malformed source URL ${u}`);

  if (v.status === 'available') {
    if (!v.make || !v.model || !v.year) err(`${at}: available listing without make/model/year`);
    if (v.year && (v.year < 1900 || v.year > new Date().getFullYear() + 1)) err(`${at}: implausible year ${v.year}`);
    if (!v.priceOnApplication && !(Number.isInteger(v.priceZAR) && v.priceZAR >= 10000)) err(`${at}: malformed price ${v.priceZAR}`);
    if (v.priceOnApplication && v.priceZAR != null) err(`${at}: POA vehicle also has a price`);
    if (!(Number.isInteger(v.mileageKm) && v.mileageKm >= 0 && v.mileageKm < 2_000_000)) err(`${at}: malformed mileage ${v.mileageKm}`);
    if (!URL_RE.test(v.dealerListingUrl ?? '')) err(`${at}: missing dealer listing URL`);
    if (!v.lastVerifiedAt) err(`${at}: no lastVerifiedAt`);
    if (!v.images?.length) warn(`${at}: available but no media yet (not published)`);
    if (v.powerKw != null && !v.fieldProvenance?.powerKw) err(`${at}: powerKw without quoted source text`);
    if (v.torqueNm != null && !v.fieldProvenance?.torqueNm) err(`${at}: torqueNm without quoted source text`);
  }
  if (v.status === 'sold' && !v.sourceUrls.includes('https://lussoauto.co.za/sold/')) err(`${at}: sold without Sold-portfolio provenance`);

  for (const [i, im] of (v.images ?? []).entries()) {
    if (!im.alt) err(`${at}: image ${i + 1} has no alt text`);
    if (/[—–]/.test(im.alt)) err(`${at}: image ${i + 1} alt contains an em/en dash`);
    if (!im.width || !im.height) err(`${at}: image ${i + 1} missing dimensions`);
    for (const variant of im.variants ?? []) {
      const s = await fileExists(`public/${variant.path}`);
      if (s !== 'ok') err(`${at}: ${s} file public/${variant.path}`);
    }
  }
}

// Duplicate heroes across different vehicles (exact file hash).
const heroHash = new Map();
for (const a of manifest.assets.filter((a) => a.order === 1 && !a.excluded)) {
  const v = vehicles.find((x) => x.id === a.vehicleId);
  if (!v || curation.soldExclude[v.id]) continue;
  if (heroHash.has(a.sha256)) err(`duplicate hero image: ${a.vehicleId} and ${heroHash.get(a.sha256)}`);
  heroHash.set(a.sha256, a.vehicleId);
}
// Manifest integrity.
const assetIds = new Set();
for (const a of manifest.assets) {
  if (assetIds.has(a.id)) err(`duplicate manifest asset ${a.id}`); assetIds.add(a.id);
  if (!URL_RE.test(a.originalUrl)) err(`manifest ${a.id}: malformed original URL`);
  if (a.vehicleId && !ids.has(a.vehicleId)) err(`manifest ${a.id}: unknown vehicle ${a.vehicleId}`);
}
for (const p of manifest.problems ?? []) warn(`media: ${p.asset ?? p.vehicle}: ${p.issue}`);

// ---------------------------------------------------------------- curation references
for (const s of curation.soldFeatured) { const v = vehicles.find((x) => x.slug === s); if (!v) err(`curation.soldFeatured: unknown ${s}`); else if (v.status !== 'sold') err(`curation.soldFeatured: ${s} is not sold`); else if (!v.images?.length) err(`curation.soldFeatured: ${s} has no image`); }
for (const s of Object.keys(curation.titleOverrides)) if (!slugs.has(s)) err(`curation.titleOverrides: unknown ${s}`);
for (const id of Object.keys(curation.soldExclude)) if (!ids.has(id)) err(`curation.soldExclude: unknown ${id}`);
const homeRefs = [curation.home.heroVehicle, curation.home.featureVehicle, ...curation.home.arrivals];
for (const s of homeRefs) { const v = vehicles.find((x) => x.slug === s); if (!v) err(`curation.home: unknown ${s}`); else if (v.status !== 'available') err(`curation.home: ${s} is ${v.status}, only available cars may be featured as current`); }
for (const ref of [...curation.images.mosaic, curation.images.sell, curation.images.about, curation.images.aboutServices]) {
  const v = vehicles.find((x) => x.slug === ref.vehicle);
  if (!v) err(`curation.images: unknown ${ref.vehicle}`); else if (!v.images?.[ref.index ?? 0]) err(`curation.images: ${ref.vehicle}#${ref.index} missing`);
  if (!ref.alt) err(`curation.images: ${ref.vehicle}#${ref.index} has no alt`);
}

// ---------------------------------------------------------------- business & team
const phones = [business.phone.primary.e164, business.whatsapp.e164];
for (const p of phones) if (!E164_ZA.test(p)) err(`business: malformed phone ${p}`);
for (const e of [business.email.general, business.email.primary]) if (!EMAIL_RE.test(e)) err(`business: malformed email ${e}`);
for (const [k, u] of Object.entries(business.social)) if (k !== 'sources' && !URL_RE.test(u)) err(`business: malformed URL ${k}`);
if (business.hours.display) warn('business.hours.display is set although hours are unresolved');
for (const m of team.members) {
  if (!m.name || !m.role) err(`team: incomplete entry ${m.id}`);
  if (!E164_ZA.test(m.phone?.e164 ?? '')) err(`team ${m.id}: malformed phone`);
  if (!EMAIL_RE.test(m.email ?? '')) err(`team ${m.id}: malformed email`);
  if (!m.sources?.length) err(`team ${m.id}: no sources`);
  if (m.nameConflict && !m.displayName) err(`team ${m.id}: unresolved name conflict but no safe displayName`);
}
for (const r of testimonials.reviews) if (r.use && (!r.url || !r.date || !r.platform)) err(`testimonial ${r.id}: missing attribution`);

// ---------------------------------------------------------------- report
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(`\nvalidate: ${vehicles.length} vehicles, ${manifest.assets.length} media assets — ${errors.length} errors, ${warnings.length} warnings`);
if (errors.length) process.exit(1);
