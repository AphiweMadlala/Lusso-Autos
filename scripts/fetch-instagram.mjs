// Extracts @lussoautoexclusive posts through Apify's Instagram Scraper actor
// (apify/instagram-scraper) using APIFY_TOKEN from the environment, then
// normalises them into data/instagram-posts.json. The raw dataset is kept in
// data/sources/instagram/ for provenance.
//
//   APIFY_TOKEN must be a valid token (apify_api_…). Usage:
//   node scripts/fetch-instagram.mjs [--limit=150] [--from-raw]
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const RAW_DIR = new URL('data/sources/instagram/', ROOT);
const PROFILE = 'https://www.instagram.com/lussoautoexclusive/';
const ACTOR = 'apify~instagram-scraper';
const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const limit = Number(arg('limit', 150));
const today = new Date().toISOString().slice(0, 10);

let items;
if (process.argv.includes('--from-raw')) {
  items = JSON.parse(await readFile(new URL('posts.raw.json', RAW_DIR), 'utf8')).items;
} else {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN is not set');
  const me = await fetch('https://api.apify.com/v2/users/me', { headers: { authorization: `Bearer ${token}` } });
  if (!me.ok) throw new Error(`APIFY_TOKEN rejected by Apify (HTTP ${me.status}). Replace the Codespaces secret with a valid apify_api_… token.`);

  console.log(`Running ${ACTOR} for ${PROFILE} (limit ${limit})…`);
  const res = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=600`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ directUrls: [PROFILE], resultsType: 'posts', resultsLimit: limit, addParentData: false }),
  });
  if (!res.ok) throw new Error(`Apify run failed: HTTP ${res.status} ${await res.text()}`);
  items = await res.json();
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(new URL('posts.raw.json', RAW_DIR), JSON.stringify({ actor: ACTOR, profile: PROFILE, retrievedAt: today, items }, null, 1));
}

const posts = items
  .filter((p) => p.shortCode || p.shortcode)
  .map((p) => {
    const shortcode = p.shortCode ?? p.shortcode;
    const children = (p.childPosts?.length ? p.childPosts : null) ?? (p.images?.length > 1 ? p.images.map((url) => ({ displayUrl: url })) : null);
    return {
      id: String(p.id),
      shortcode,
      url: p.url ?? `https://www.instagram.com/p/${shortcode}/`,
      date: p.timestamp ?? null,
      type: p.type ?? null, // Image | Sidecar | Video
      productType: p.productType ?? null, // e.g. clips (reel)
      caption: p.caption ?? '',
      hashtags: p.hashtags ?? [],
      mentions: p.mentions ?? [],
      location: p.locationName ? { name: p.locationName, id: p.locationId ?? null } : null,
      alt: p.alt ?? null,
      likes: p.likesCount ?? null,
      comments: p.commentsCount ?? null,
      videoViews: p.videoViewCount ?? p.videoPlayCount ?? null,
      media: children
        ? children.map((c, i) => ({ order: i + 1, type: c.type === 'Video' || c.videoUrl ? 'video' : 'image', imageUrl: c.displayUrl, videoUrl: c.videoUrl ?? null, width: c.dimensionsWidth ?? null, height: c.dimensionsHeight ?? null, alt: c.alt ?? null }))
        : [{ order: 1, type: p.type === 'Video' ? 'video' : 'image', imageUrl: p.displayUrl, videoUrl: p.videoUrl ?? null, width: p.dimensionsWidth ?? null, height: p.dimensionsHeight ?? null, alt: p.alt ?? null }],
      retrievedAt: today,
      source: `Apify ${ACTOR}`,
    };
  })
  .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

await writeFile(new URL('data/instagram-posts.json', ROOT), JSON.stringify({ profile: PROFILE, retrievedAt: today, count: posts.length, posts }, null, 2));
console.log(`${posts.length} posts written to data/instagram-posts.json`);
