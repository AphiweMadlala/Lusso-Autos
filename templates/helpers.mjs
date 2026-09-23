import { readFileSync } from 'node:fs';
import config from '../config/site.config.mjs';

const BASE = config.BASE_PATH.endsWith('/') ? config.BASE_PATH : `${config.BASE_PATH}/`;

// Visible text never carries em/en dashes (DESIGN.md §9). Source text (e.g. dealer listings) is
// normalised at render time only: numeric ranges take a hyphen, spaced dashes become commas.
const undash = (s) => s.replace(/(\d)\s?[\u2013\u2014]\s?(\d)/g, '$1-$2').replace(/\s[\u2013\u2014]\s/g, ', ').replace(/[\u2013\u2014]/g, '-');
export const esc = (s) => undash(String(s ?? '')).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const attr = esc;

/** Site-relative URL honouring BASE_PATH. `u('collection/')` → '/Lusso-Autos/collection/' */
export const u = (p = '') => `${BASE}${String(p).replace(/^\//, '')}`;
export const absolute = (p = '') => `${config.SITE_URL.replace(/\/$/, '')}${u(p)}`;

// South African number grouping with a narrow no-break space.
const group = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const price = (v) => (v.priceOnApplication || v.priceZAR == null ? 'Price on application' : `R ${group(v.priceZAR)}`);
export const km = (n) => (n == null ? '' : `${group(n)} km`);

// Phosphor icons inlined at build time (never hand-drawn).
const iconCache = new Map();
export function icon(name, cls = '') {
  if (!iconCache.has(name)) {
    const svg = readFileSync(new URL(`../node_modules/@phosphor-icons/core/assets/regular/${name}.svg`, import.meta.url), 'utf8');
    iconCache.set(name, svg);
  }
  return iconCache.get(name).replace('<svg ', `<svg aria-hidden="true" focusable="false"${cls ? ` class="${cls}"` : ''} `);
}

/**
 * Responsive <img>. `image` is a vehicles.json image entry.
 * sizes: the rendered width expression. eager: LCP candidates only.
 */
export function img(image, { sizes = '100vw', eager = false, alt, cls = '' } = {}) {
  if (!image) return '';
  const srcset = image.variants.map((v) => `${u(v.path)} ${v.width}w`).join(', ');
  const fallback = image.variants.find((v) => v.width >= 800) ?? image.variants.at(-1);
  return `<img src="${u(fallback.path)}" srcset="${srcset}" sizes="${sizes}" width="${image.width}" height="${image.height}" alt="${esc(alt ?? image.alt ?? '')}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}>`;
}

export const telHref = (e164) => `tel:${e164}`;
export const waHref = (e164, text) => `https://wa.me/${e164.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const mailHref = (email, subject) => `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Visible copy must not contain em/en dashes (DESIGN.md §9). Build fails if one slips in. */
export function assertNoDashes(html, where) {
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  const m = text.match(/.{0,40}[—–].{0,40}/);
  if (m) throw new Error(`Em/en dash in visible copy on ${where}: "${m[0].trim()}"`);
}
