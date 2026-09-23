// Downloads vehicle/showroom photography from Lusso-controlled sources, audits it
// and generates responsive WebP derivatives.
//
//   originals  → media/originals/<group>/<slug>/NN.<ext>   (git-ignored, re-downloadable cache)
//   derivatives→ public/images/<group>/<slug>/NN-<width>.webp
//   manifest   → data/media-manifest.json
//   vehicles   → data/vehicles.json `images` updated in original gallery order
//
// Source preference per vehicle: Lusso site gallery (Lusso-owned) → AutoTrader dealer gallery. Both are the same Lusso studio photography; they are never
// mixed for one vehicle, which would create duplicates.
import { mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { path, readJSON, writeJSON, today } from './lib/util.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const WIDTHS = [480, 800, 1600]; // + native width when the source is ≤ 1600px
const MAX_PER_VEHICLE = Number(process.argv.find((a) => a.startsWith('--max='))?.split('=')[1] ?? 30);
const QUALITY = 82;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const data = await readJSON('data/vehicles.json');
const previousManifest = await readJSON('data/media-manifest.json', { assets: [] });
const manifest = [];
const problems = [];

async function download(url, file) {
  try { const s = await stat(file); if (s.size > 0) return { cached: true }; } catch {}
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    const type = res.headers.get('content-type') ?? '';
    if (res.ok && type.startsWith('image/')) {
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(new URL('.', file), { recursive: true });
      await writeFile(file, buf);
      return { cached: false };
    }
    if (res.status === 404 || res.status === 403) throw new Error(`${res.status} ${url}`);
    if (process.argv.includes('--fast-fail')) throw new Error(`${res.status} ${url}`);
    await sleep(8000 * attempt);
  }
  throw new Error(`download failed ${url}`);
}

// 64-bit difference hash for near-duplicate detection.
async function dHash(file) {
  const px = await sharp(file).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0';
  return BigInt('0b' + bits).toString(16).padStart(16, '0');
}
const hamming = (a, b) => [...(BigInt('0x' + a) ^ BigInt('0x' + b)).toString(2)].filter((c) => c === '1').length;

async function processAsset({ group, slug, index, url, vehicleId, postId = null, alt, sourcePage }) {
  const n = String(index).padStart(2, '0');
  const ext = (url.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase();
  const orig = path(`media/originals/${group}/${slug}/${n}.${ext}`);
  await download(url, orig);
  const buf = await readFile(orig);
  if (!buf.length) throw new Error('zero-byte file');
  const meta = await sharp(buf).metadata(); // throws on corrupt data
  const sha256 = createHash('sha256').update(buf).digest('hex');
  const hash = await dHash(buf);
  const outDir = path(`public/images/${group}/${slug}/`);
  await mkdir(outDir, { recursive: true });
  const widths = WIDTHS.filter((w) => w < meta.width).concat(meta.width <= 1600 ? [meta.width] : []).filter((w, i, a) => a.indexOf(w) === i);
  const variants = [];
  for (const w of widths) {
    const out = new URL(`${n}-${w}.webp`, outDir);
    let exists = false;
    try { exists = (await stat(out)).size > 0; } catch {}
    if (!exists) await sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY, smartSubsample: true }).toFile(out.pathname);
    variants.push({ width: w, height: Math.round((meta.height / meta.width) * w), path: `images/${group}/${slug}/${n}-${w}.webp` });
  }
  const asset = {
    id: `${group}/${slug}/${n}`, group, vehicleId, instagramPostId: postId, sourcePage, originalUrl: url,
    localOriginal: `media/originals/${group}/${slug}/${n}.${ext}`,
    mediaType: 'image', width: meta.width, height: meta.height, bytes: buf.length, sha256, dHash: hash,
    variants, alt, order: index, extractedAt: previousManifest.assets.find((a) => a.originalUrl === url)?.extractedAt ?? today(),
  };
  if (meta.width < 1000 && meta.width >= 800) problems.push({ asset: asset.id, issue: `below 1000px wide (${meta.width}×${meta.height})` });
  if (meta.width < 800 && group === 'sold') problems.push({ asset: asset.id, issue: `low resolution ${meta.width}×${meta.height}` });
  manifest.push(asset);
  return asset;
}

const toImage = (a) => ({ src: a.variants.at(-1).path, width: a.width, height: a.height, alt: a.alt, variants: a.variants.map(({ width, path }) => ({ width, path })) });

// ---------------------------------------------------------------- vehicles
const altFor = (v, i, total) => `${v.title}${v.exteriorColour ? ` in ${v.exteriorColour}` : ''}, photograph ${i} of ${total}`;
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]; // available | sold | showroom
const targets = data.vehicles
  .filter((v) => v.status === 'available' || (v.status === 'sold' && v.archiveTier === 'collector'))
  .filter((v) => !only || only === v.status);
// Keep manifest entries for groups not processed in this run.
if (only) manifest.push(...previousManifest.assets.filter((a) => (only === 'showroom' ? a.group !== 'showroom' : a.group === 'showroom' || data.vehicles.find((v) => v.id === a.vehicleId)?.status !== only)));

for (const v of targets) {
  const group = v.status === 'sold' ? 'sold' : 'vehicles';
  // Lusso's own site first (Lusso-owned, often larger originals, Lusso's own gallery order),
  // then the AutoTrader dealer gallery (same photography, uploaded by Lusso).
  const candidates = [
    ...(v.mediaSources?.lussoSite?.length ? [{ name: 'lussoSite', urls: v.mediaSources.lussoSite, page: v.lussoSiteUrl || v.sourceUrls[0] }] : []),
    ...(v.mediaSources?.autotrader?.length ? [{ name: 'autotrader', urls: v.mediaSources.autotrader.map((m) => m.url), page: v.dealerListingUrl }] : []),
  ];
  let assets = null;
  for (const c of candidates) {
    try {
      const urls = c.urls.slice(0, MAX_PER_VEHICLE);
      assets = [];
      for (const [i, url] of urls.entries()) {
        assets.push(await processAsset({ group, slug: v.slug, index: i + 1, url, vehicleId: v.id, alt: altFor(v, i + 1, urls.length), sourcePage: c.page }));
      }
      v.imageSource = c.name;
      break;
    } catch (e) {
      problems.push({ vehicle: v.id, issue: `${c.name} gallery failed: ${e.message}` });
      manifest.splice(manifest.length - (assets?.length ?? 0));
      assets = null;
    }
  }
  if (!assets) { problems.push({ vehicle: v.id, issue: 'no media could be downloaded' }); v.images = []; continue; }

  // Exact and near duplicates within one gallery.
  const keep = [];
  for (const a of assets) {
    const exact = keep.find((k) => k.sha256 === a.sha256);
    const near = keep.find((k) => hamming(k.dHash, a.dHash) <= 3);
    if (exact) { problems.push({ asset: a.id, issue: `exact duplicate of ${exact.id} — removed from gallery` }); a.excluded = 'duplicate'; continue; }
    if (near) problems.push({ asset: a.id, issue: `near-duplicate of ${near.id} (dHash distance ${hamming(near.dHash, a.dHash)}) — kept, review` });
    keep.push(a);
  }
  // Drop thumbnails when the gallery has enough full-size photographs.
  const full = keep.filter((a) => a.width >= 800);
  const gallery = full.length >= 8 ? full : keep;
  for (const a of keep.filter((a) => !gallery.includes(a))) { a.excluded = 'low-resolution'; problems.push({ asset: a.id, issue: `excluded from gallery: ${a.width}×${a.height} thumbnail` }); }
  v.images = gallery.map(toImage);
  console.log(`✓ ${v.slug}: ${keep.length} images (${v.imageSource})`);
}

// Same image used as hero for two vehicles?
const heroes = new Map();
for (const v of targets) {
  const hero = manifest.find((a) => a.vehicleId === v.id && a.order === 1);
  if (!hero) continue;
  if (heroes.has(hero.sha256)) problems.push({ vehicle: v.id, issue: `hero image identical to ${heroes.get(hero.sha256)}` });
  heroes.set(hero.sha256, v.id);
}

// ---------------------------------------------------------------- showroom (AutoTrader dealer gallery) & brand
const dealer = await readJSON('data/sources/autotrader/dealer-profile.raw.json');
const showroom = [];
for (const [i, g] of (!only || only === 'showroom' ? dealer.galleryModel?.galleryImages ?? [] : []).entries()) {
  try {
    showroom.push(await processAsset({ group: 'showroom', slug: 'lusso', index: i + 1, url: g.originalImageUrl, vehicleId: null, alt: '', sourcePage: 'https://www.autotrader.co.za/dealer/lusso-auto/113036' }));
  } catch (e) { problems.push({ asset: `showroom/${i + 1}`, issue: e.message }); }
}

for (const a of manifest.filter((a) => a.excluded)) for (const x of a.variants) await rm(path(`public/${x.path}`), { force: true });

await writeJSON('data/vehicles.json', data);
await writeJSON('data/media-manifest.json', {
  generatedAt: today(),
  note: 'Every derivative in public/images traces to an original URL here. Alt text for showroom images is set in data/showroom.json after visual review.',
  totals: { assets: manifest.length, byGroup: manifest.reduce((a, m) => ({ ...a, [m.group]: (a[m.group] ?? 0) + 1 }), {}) },
  problems,
  assets: manifest,
});
console.log(`\nassets: ${manifest.length}, problems: ${problems.length}`);
