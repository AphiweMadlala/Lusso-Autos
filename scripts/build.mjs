// Static site generator: data/*.json + templates/ → dist/
// Every vehicle page is generated from data/vehicles.json; nothing is hand-written per car.
import { mkdir, writeFile, cp, rm, readdir } from 'node:fs/promises';
import config from '../config/site.config.mjs';
import { path, readJSON } from './lib/util.mjs';
import { layout } from '../templates/layout.mjs';
import { assertNoDashes } from '../templates/helpers.mjs';
import * as pages from '../templates/pages.mjs';

const DIST = path('dist/');
const t0 = Date.now();

// ---------------------------------------------------------------- data
const { vehicles, generatedAt } = await readJSON('data/vehicles.json');
const business = await readJSON('data/business.json');
const team = await readJSON('data/team.json');
const testimonials = await readJSON('data/testimonials.json');
const curation = await readJSON('data/curation.json');

const bySlug = new Map(vehicles.map((v) => [v.slug, v]));
const byId = (slug) => {
  const v = bySlug.get(slug);
  if (!v) throw new Error(`curation references unknown vehicle "${slug}"`);
  return v;
};

// Current stock keeps AutoTrader's dealer order (Lusso's own ordering), which is the default sort.
const available = vehicles.filter((v) => v.status === 'available' && v.images?.length);
const missingMedia = vehicles.filter((v) => v.status === 'available' && !v.images?.length);
if (missingMedia.length) console.warn(`! ${missingMedia.length} available vehicles have no media yet and are not published: ${missingMedia.map((v) => v.slug).join(', ')}`);

const displayTitle = (v) => curation.titleOverrides[v.slug]?.display ?? v.title;
const soldAll = vehicles.filter((v) => v.status === 'sold' && !curation.soldExclude[v.id]);
const soldFeatured = curation.soldFeatured.map((slug) => ({ vehicle: byId(slug), title: displayTitle(byId(slug)) }));
const soldRegister = soldAll.map((v) => ({ title: displayTitle(v), make: v.make, order: v.archiveOrder })).sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true }));

const resolveImage = (ref) => {
  const v = byId(ref.vehicle);
  const image = v.images[ref.index ?? 0];
  if (!image) throw new Error(`curation image ${ref.vehicle}#${ref.index} does not exist`);
  return { image, alt: ref.alt };
};

// Similar vehicles: same make first, then same body, then nearest price. Never random.
function similarTo(v) {
  const score = (o) => {
    let s = 0;
    if (o.make === v.make) s += 3;
    if (o.bodyType && o.bodyType === v.bodyType) s += 2;
    if (o.priceZAR && v.priceZAR) {
      const ratio = Math.abs(Math.log(o.priceZAR / v.priceZAR));
      if (ratio < 0.35) s += 2; else if (ratio < 0.7) s += 1;
    } else if (o.priceOnApplication && v.priceOnApplication) s += 1;
    return s;
  };
  return available.filter((o) => o.id !== v.id).map((o) => ({ o, s: score(o) })).filter((x) => x.s >= 3).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.o);
}

const data = {
  business, team, testimonials, curation, available, byId, soldFeatured, soldRegister,
  buildId: Date.now().toString(36),
  generatedAtLabel: new Date(generatedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }),
  mosaic: curation.images.mosaic.map(resolveImage),
  sellImage: resolveImage(curation.images.sell),
  aboutImage: resolveImage(curation.images.about),
};

// ---------------------------------------------------------------- output
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

let count = 0;
async function emit(page) {
  const html = layout({ ...page, data });
  assertNoDashes(html, page.path || 'home');
  const file = page.path.endsWith('.html') ? page.path : `${page.path}index.html`;
  const out = path(`dist/${file}`);
  await mkdir(new URL('.', out), { recursive: true });
  await writeFile(out, html);
  count++;
}

await emit(pages.home(data));
await emit(pages.collection(data));
for (const v of available) await emit(pages.vehicle({ ...data, similar: similarTo(v) }, v));
await emit(pages.sold(data));
await emit(pages.sell(data));
await emit(pages.source(data));
await emit(pages.about(data));
await emit(pages.contact(data));
await emit(pages.notFound(data));

// Only publish images the site actually references (keeps the deploy small).
await cp(path('src/css/'), path('dist/css/'), { recursive: true });
await cp(path('src/js/'), path('dist/js/'), { recursive: true });
await cp(path('src/brand/'), path('dist/brand/'), { recursive: true });
await mkdir(path('dist/fonts/'), { recursive: true });
await cp(path('node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2'), path('dist/fonts/archivo-latin-standard-normal.woff2'));
const usedDirs = new Set([...available, ...soldFeatured.map((s) => s.vehicle)].map((v) => v.images[0]?.src.split('/').slice(0, 3).join('/')));
for (const ref of [...curation.images.mosaic, curation.images.sell, curation.images.about]) usedDirs.add(byId(ref.vehicle).images[0].src.split('/').slice(0, 3).join('/'));
for (const dir of usedDirs) await cp(path(`public/${dir}/`), path(`dist/${dir}/`), { recursive: true });

await writeFile(path('dist/robots.txt'), config.PROPOSAL_MODE ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${config.SITE_URL}${config.BASE_PATH}sitemap.xml\n`);
await writeFile(path('dist/.nojekyll'), '');

console.log(`built ${count} pages (${available.length} vehicles, ${soldFeatured.length} featured sold) in ${Date.now() - t0}ms → dist/  [BASE_PATH=${config.BASE_PATH} PROPOSAL_MODE=${config.PROPOSAL_MODE}]`);
