// Fetches Lusso Auto's own WordPress site (lussoauto.co.za) through its public
// REST API and parses: vehicle pages, the Buying index, the Sold portfolio,
// team business cards and site-wide contact details. Raw responses are kept
// alongside the parsed output so every value can be traced back.
import { writeFile, mkdir } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const OUT_DIR = new URL('data/sources/lussoauto-site/', ROOT);
const SITE = 'https://lussoauto.co.za';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const today = new Date().toISOString().slice(0, 10);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#8211': '–', '#8212': '—', '#8217': '’', '#8216': '‘', '#8220': '“', '#8221': '”', '#8230': '…', '#038': '&', '#8243': '″', '#215': '×' };
const decode = (s) => s.replace(/&(#?\w+);/g, (m, e) => ENTITIES[e] ?? (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : m));
const strip = (h) => decode(h.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '|'));
const textLines = (h) => strip(h).split('|').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
const unique = (a) => [...new Set(a)];

const res = await fetch(`${SITE}/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,link,modified,date,title,content`, { headers: { 'user-agent': UA } });
if (!res.ok) throw new Error(`WP pages API ${res.status}`);
const pages = await res.json();
await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL('pages.raw.json', OUT_DIR), JSON.stringify(pages));
const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));
const html = (slug) => bySlug[slug]?.content.rendered ?? '';

// ---------- Buying index: the site's own list of "available stock" ----------
const buyingLinks = unique([...html('buying').matchAll(/href="https:\/\/lussoauto\.co\.za\/([^"/]+)\/"/g)].map((m) => m[1]))
  .filter((s) => bySlug[s] && !['about-us', 'buying', 'selling', 'sold', 'contact-us'].includes(s));

// ---------- Vehicle pages ----------
const LABELS = ['LAST UPDATED', 'PREVIOUS OWNERS', 'MANUFACTURERS COLOUR', 'BODY TYPE', 'FUEL TYPE', 'MILEAGE', 'TRANSMISSION', 'Service History'];
const isVehiclePage = (p) => /^(\d{4}-|audi-)/.test(p.slug);

const vehiclePages = pages.filter(isVehiclePage).map((p) => {
  const h = p.content.rendered;
  const lines = textLines(h);
  const titleIdx = lines.findIndex((l) => l === decode(p.title.rendered));
  const price = lines.slice(titleIdx, titleIdx + 4).find((l) => /^R\s?[\d\s]+$|^POA$/i.test(l)) ?? null;
  const commentsStart = lines.indexOf('Seller Comments');
  const commentsEnd = lines.findIndex((l) => l === 'LAST UPDATED');
  const attributes = {};
  for (const label of LABELS) {
    const i = lines.findIndex((l) => l.toUpperCase() === label.toUpperCase());
    if (i >= 0 && lines[i + 1] && !LABELS.some((x) => x.toUpperCase() === lines[i + 1].toUpperCase())) attributes[label] = lines[i + 1];
  }
  const gallery = [...h.matchAll(/<img[^>]+class="swiper-slide-image"[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/g)].map((m) => ({ src: m[1], alt: decode(m[2]) }));
  const galleryUnique = gallery.filter((g, i) => gallery.findIndex((x) => x.src === g.src) === i);
  const autotrader = unique([...h.matchAll(/href="(https:\/\/www\.autotrader\.co\.za\/car-for-sale\/[^"?]+)/g)].map((m) => m[1]));
  return {
    slug: p.slug,
    url: p.link,
    title: decode(p.title.rendered),
    published: p.date,
    modified: p.modified,
    listedOnBuyingPage: buyingLinks.includes(p.slug),
    priceText: price,
    sellerComments: commentsStart >= 0 ? lines.slice(commentsStart + 1, commentsEnd > commentsStart ? commentsEnd : undefined) : [],
    attributes,
    autotraderUrls: autotrader,
    gallery: galleryUnique,
    galleryDuplicatesRemoved: gallery.length - galleryUnique.length,
  };
});

// ---------- Sold portfolio ----------
const soldHtml = html('sold');
const sold = [...soldHtml.matchAll(/<figure class="elementor-image-box-img"><img[^>]*width="(\d+)" height="(\d+)" src="([^"]+)"[^>]*class="[^"]*wp-image-(\d+)[^"]*"[\s\S]*?<h3 class="elementor-image-box-title">([\s\S]*?)<\/h3>/g)]
  .map((m, i) => ({ order: i + 1, title: decode(m[5].replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(), image: { src: m[3], width: +m[1], height: +m[2], wpId: +m[4] } }));

// ---------- Team ----------
const card = (slug) => {
  const h = html(slug);
  return {
    source: bySlug[slug]?.link, modified: bySlug[slug]?.modified,
    tel: unique([...h.matchAll(/href="tel:([^"]+)"/g)].map((m) => m[1])),
    email: unique([...h.matchAll(/href="mailto:([^"]+)"/g)].map((m) => m[1])),
    images: unique([...h.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1])),
  };
};
const about = html('about-us');
const teamSeg = about.slice(about.indexOf('Team Members'), about.indexOf('Some of our brands'));
const teamPhotos = [...teamSeg.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const teamRoles = textLines(teamSeg).filter((l) => l !== 'Team Members');
const contactLines = textLines(html('contact-us'));

const parsed = {
  source: SITE,
  retrievedAt: today,
  buyingIndex: buyingLinks,
  vehiclePages,
  sold,
  team: {
    aboutPage: { url: bySlug['about-us']?.link, modified: bySlug['about-us']?.modified, rolesInOrder: teamRoles, photosInOrder: teamPhotos },
    businessCards: { arno: card('bc-lusso-arno'), fay: card('bc-lusso-fay'), riccardo: card('bc-lusso-riccardo') },
  },
  contactPage: {
    url: bySlug['contact-us']?.link, modified: bySlug['contact-us']?.modified,
    lines: contactLines.slice(contactLines.indexOf('Get In Touch'), contactLines.indexOf('Send us a message')),
  },
  footer: { lines: contactLines.slice(contactLines.indexOf('Opening Hours:'), contactLines.indexOf('Opening Hours:') + 6) },
  aboutText: textLines(about).slice(textLines(about).indexOf('About Lusso Auto'), textLines(about).indexOf('Team Members')),
  sellingText: textLines(html('selling')).slice(textLines(html('selling')).indexOf('SOLD BY LUSSO AUTO'), textLines(html('selling')).indexOf('Opening Hours:')),
};
await writeFile(new URL('parsed.json', OUT_DIR), JSON.stringify(parsed, null, 2));
console.log(`vehicle pages: ${vehiclePages.length} (on Buying index: ${buyingLinks.length}), sold entries: ${sold.length}`);
