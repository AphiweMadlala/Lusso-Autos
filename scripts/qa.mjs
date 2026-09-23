// Functional + responsive QA with Playwright. Requires `npm run serve` (dist/ on :4173).
//   node scripts/qa.mjs            → reports/qa-results.json + console summary
// Uses the playwright-core bundled with the Playwright CLI (Chromium installed via `playwright-cli install-browser chromium`).
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import config from '../config/site.config.mjs';
import { path } from './lib/util.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE ?? '/usr/local/share/nvm/versions/node/v24.21.0/lib/node_modules/@playwright/cli/node_modules/playwright-core');

const ORIGIN = process.env.QA_ORIGIN ?? 'http://localhost:4173';
const BASE = `${ORIGIN}${config.BASE_PATH}`;
const VIEWPORTS = [[375, 812], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const results = { startedAt: new Date().toISOString(), checks: [], pages: {} };
let failures = 0;
const check = (name, ok, detail = '') => { results.checks.push({ name, ok, detail }); if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };

// ---------------------------------------------------------------- page inventory from dist/
async function htmlPages(dir = path('dist/'), rel = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...(await htmlPages(new URL(`${e.name}/`, dir), `${rel}${e.name}/`)));
    else if (e.name === 'index.html') out.push(rel);
  }
  return out;
}
const pages = (await htmlPages()).sort();
const browser = await chromium.launch();

// ---------------------------------------------------------------- sitewide sweep
const linkTargets = new Set();
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: w < 1024 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`request failed: ${r.url()} ${r.failure()?.errorText}`); });
  for (const p of pages) {
    errors.length = 0;
    const res = await page.goto(BASE + p, { waitUntil: 'load' });
    // Scroll through so lazy images load, then audit.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } window.scrollTo(0, 0); });
    await page.waitForLoadState('networkidle');
    const audit = await page.evaluate(() => {
      const imgs = [...document.images].filter((i) => i.offsetParent !== null || i.closest('.gallery__track'));
      return {
        broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
        missingAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
        missingDims: [...document.images].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: document.querySelectorAll('h1').length,
        robots: document.querySelector('meta[name=robots]')?.content ?? null,
        links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
        smallTargets: [...document.querySelectorAll('a, button, input, select, textarea')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('.visually-hidden, .skip-link, p, .card__title, label') && (r.height < 24 || r.width < 24); }).map((el) => `${el.tagName.toLowerCase()}:${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}`).slice(0, 5),
        headingSkips: (() => { let prev = 0, bad = []; for (const hEl of document.querySelectorAll('h1,h2,h3,h4')) { const l = +hEl.tagName[1]; if (prev && l > prev + 1) bad.push(`${hEl.tagName}:${hEl.textContent.trim().slice(0, 30)}`); prev = l; } return bad; })(),
      };
    });
    audit.links.forEach((l) => linkTargets.add(l));
    const key = `${p || 'home'} @${w}`;
    results.pages[key] = { status: res.status(), ...audit, links: undefined, consoleErrors: [...errors] };
    if (res.status() !== 200) check(`${key} status`, false, res.status());
    if (audit.broken.length) check(`${key} broken images`, false, audit.broken.slice(0, 3).join(', '));
    if (audit.overflow > 0) check(`${key} horizontal overflow`, false, `${audit.overflow}px`);
    if (audit.h1 !== 1) check(`${key} single h1`, false, `${audit.h1} h1s`);
    if (errors.length) check(`${key} console errors`, false, errors.slice(0, 2).join(' | '));
    if (audit.missingAlt || audit.missingDims) check(`${key} img alt/dimensions`, false, `alt:${audit.missingAlt} dims:${audit.missingDims}`);
    if (audit.headingSkips.length) check(`${key} heading order`, false, audit.headingSkips.join(', '));
    if (w < 768 && audit.smallTargets.length) check(`${key} touch targets ≥ 24px`, false, audit.smallTargets.join(', '));
    if (config.PROPOSAL_MODE && audit.robots !== 'noindex, nofollow') check(`${key} noindex meta`, false, audit.robots);
  }
  check(`sweep @${w}×${h}: ${pages.length} pages loaded`, true);
  await ctx.close();
}

// ---------------------------------------------------------------- internal links
const internal = [...linkTargets].filter((l) => l.startsWith(ORIGIN)).map((l) => l.split('#')[0]);
const uniqueInternal = [...new Set(internal)];
let badLinks = [];
for (const l of uniqueInternal) { const r = await fetch(l); if (r.status !== 200) badLinks.push(`${r.status} ${l}`); }
check(`internal links resolve (${uniqueInternal.length} unique)`, badLinks.length === 0, badLinks.slice(0, 5).join(', '));
const external = [...linkTargets].filter((l) => !l.startsWith(ORIGIN));
const tel = external.filter((l) => l.startsWith('tel:')), wa = external.filter((l) => l.startsWith('https://wa.me/')), mail = external.filter((l) => l.startsWith('mailto:'));
check('tel: links well-formed', tel.length > 0 && tel.every((l) => /^tel:\+27\d{9}$/.test(l)), [...new Set(tel)].join(', '));
check('WhatsApp links well-formed', wa.length > 0 && wa.every((l) => /^https:\/\/wa\.me\/27\d{9}(\?text=.+)?$/.test(l)), `${new Set(wa.map((l) => l.split('?')[0])).size} distinct numbers`);
check('mailto: links well-formed', mail.length > 0 && mail.every((l) => /^mailto:[^@\s]+@lussoauto\.co\.za(\?.*)?$/.test(l)), [...new Set(mail.map((l) => l.split('?')[0]))].join(', '));

// ---------------------------------------------------------------- 404
{
  const r = await fetch(`${BASE}this-car-does-not-exist/`);
  const body = await r.text();
  check('404 page served for unknown URL', r.status === 404 && body.includes('This page has moved on'), `status ${r.status}`);
}

// ---------------------------------------------------------------- functional: collection
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}collection/`);
  const visible = () => page.$$eval('[data-collection] > *', (els) => els.filter((e) => !e.hidden).length);
  const total = await page.$$eval('[data-collection] > *', (els) => els.length);
  check('collection: first page shows 12 cards', (await visible()) === Math.min(12, total), `${await visible()} of ${total}`);
  if (total > 12) { await page.click('[data-more] button'); check('collection: "Show more" reveals the rest', (await visible()) === total); }
  await page.click('[data-filter-toggle]');
  check('collection: filter panel toggles open', await page.isVisible('#filters'));
  await page.selectOption('#f-make', 'Ferrari');
  const ferraris = await page.$$eval('[data-collection] > *:not([hidden])', (els) => els.map((e) => e.dataset.make));
  check('collection: make filter', ferraris.length > 0 && ferraris.every((m) => m === 'Ferrari'), `${ferraris.length} Ferraris`);
  check('collection: filter reflected in URL', page.url().includes('make=Ferrari'));
  await page.reload();
  check('collection: URL state restored on reload', (await page.$eval('#f-make', (s) => s.value)) === 'Ferrari' && (await visible()) === ferraris.length);
  await page.selectOption('#sort', 'price-asc');
  const prices = await page.$$eval('[data-collection] > *:not([hidden])', (els) => els.map((e) => (e.dataset.price ? +e.dataset.price : null)));
  const priced = prices.filter((p) => p !== null);
  check('collection: price low→high sort, POA last', priced.every((p, i) => i === 0 || p >= priced[i - 1]) && prices.slice(priced.length).every((p) => p === null), prices.join(','));
  await page.selectOption('#sort', 'price-desc');
  const pd = await page.$$eval('[data-collection] > *:not([hidden])', (els) => els.map((e) => (e.dataset.price ? +e.dataset.price : null)));
  check('collection: price high→low sort', pd.filter((p) => p !== null).every((p, i, a) => i === 0 || p <= a[i - 1]));
  await page.click('button[type=reset]');
  await page.waitForTimeout(50);
  await page.fill('#q', 'porsche');
  const porsches = await page.$$eval('[data-collection] > *:not([hidden])', (els) => els.map((e) => e.dataset.make));
  check('collection: search', porsches.length > 0 && porsches.every((m) => m === 'Porsche'), `${porsches.length} results`);
  await page.fill('#q', 'zzzz');
  check('collection: empty state shown', await page.isVisible('[data-empty]'));
  await page.click('[data-clear]');
  await page.waitForTimeout(50);
  check('collection: clear restores results', !(await page.isVisible('[data-empty]')) && (await visible()) > 0);
  await page.selectOption('#sort', 'mileage-asc');
  const km = await page.$$eval('[data-collection] > *:not([hidden])', (els) => els.map((e) => +e.dataset.mileage));
  check('collection: mileage sort', km.every((k, i) => i === 0 || k >= km[i - 1]));
  await ctx.close();
}

// ---------------------------------------------------------------- functional: vehicle page, lightbox, POA
const vehiclePages = pages.filter((p) => /^collection\/.+/.test(p));
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const poaPage = vehiclePages.find((p) => p.includes('550-maranello')) ?? vehiclePages[0];
  await page.goto(BASE + poaPage);
  check('vehicle: POA vehicle shows "Price on application"', (await page.textContent('.vd-price')).includes('Price on application'));
  check('vehicle: no "R" price on POA vehicle', !/R\s?\d/.test(await page.textContent('.vd-price')));
  const n = JSON.parse(await page.textContent('#gallery-data')).length;
  await page.click('.gallery__lead');
  await page.waitForSelector('#lightbox.is-open');
  check('lightbox: opens from lead image', true);
  check('lightbox: focus moved into dialog', await page.evaluate(() => document.getElementById('lightbox').contains(document.activeElement)));
  check('lightbox: body scroll locked', await page.evaluate(() => document.body.classList.contains('is-locked')));
  await page.keyboard.press('ArrowRight');
  check('lightbox: ArrowRight advances', (await page.textContent('[data-lb-count]')).trim() === `2 / ${n}`);
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  check('lightbox: ArrowLeft wraps to last', (await page.textContent('[data-lb-count]')).trim() === `${n} / ${n}`);
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  check('lightbox: focus trapped while tabbing', await page.evaluate(() => document.getElementById('lightbox').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  check('lightbox: Escape closes', !(await page.evaluate(() => document.getElementById('lightbox').classList.contains('is-open'))));
  check('lightbox: focus restored to opener', await page.evaluate(() => document.activeElement?.classList.contains('gallery__lead')));
  check('lightbox: scroll lock released', !(await page.evaluate(() => document.body.classList.contains('is-locked'))));
  await page.click('.gallery__thumb >> nth=0');
  await page.waitForSelector('#lightbox.is-open');
  check('lightbox: thumbnail opens at its index', (await page.textContent('[data-lb-count]')).trim() === `2 / ${n}`);
  await page.click('[data-lb-close]');
  await page.waitForTimeout(250);
  // Similar vehicles must be genuinely related.
  const related = await page.$$eval('#similar-title ~ * .card__title a, section[aria-labelledby=similar-title] .card__title a', (as) => as.map((a) => a.textContent));
  check('vehicle: similar vehicles present and relevant', related.length > 0 && related.every((t) => t.includes('Ferrari')), related.join(' | '));
  // Viewing form: validation + compose.
  await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  await page.click('#enquire-form button[type=submit]');
  check('form: empty submit shows errors', await page.isVisible('#enquire-name-error') && (await page.getAttribute('#enquire-name', 'aria-invalid')) === 'true');
  check('form: focus moved to first invalid field', await page.evaluate(() => document.activeElement?.id === 'enquire-name'));
  await page.fill('#enquire-name', 'QA Test'); await page.fill('#enquire-phone', '0820000000');
  await page.click('#enquire-form button[type=submit]');
  const opened = await page.evaluate(() => window.__opened);
  check('form: composes a WhatsApp message to Lusso', opened.length === 1 && opened[0].startsWith('https://wa.me/27') && decodeURIComponent(opened[0]).includes('QA Test') && decodeURIComponent(opened[0]).includes('550 Maranello'), opened[0]?.slice(0, 60));
  await ctx.close();
}

// ---------------------------------------------------------------- mobile: gallery swipe, menu, enquiry bar
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(BASE + vehiclePages[0]);
  const n = JSON.parse(await page.textContent('#gallery-data')).length;
  check('mobile gallery: counter visible', (await page.textContent('.gallery__count')).trim() === `1 / ${n}`);
  await page.$eval('.gallery__track', (t) => t.scrollTo({ left: t.clientWidth, behavior: 'instant' }));
  await page.waitForTimeout(300);
  check('mobile gallery: counter follows swipe', (await page.textContent('.gallery__count')).trim() === `2 / ${n}`);
  check('mobile: enquiry bar visible', await page.isVisible('.enquiry-bar'));
  const barLinks = await page.$$eval('.enquiry-bar a', (as) => as.map((a) => [a.textContent.trim(), a.getBoundingClientRect().height]));
  check('mobile: enquiry bar has Call / WhatsApp / Book a viewing, single line', barLinks.map((b) => b[0]).join('|') === 'Call|WhatsApp|Book a viewing' && barLinks.every(([, h]) => h <= 60), JSON.stringify(barLinks));
  await page.$eval('#enquire', (el) => el.scrollIntoView());
  await page.waitForTimeout(400);
  check('mobile: enquiry bar hides over the enquiry section', await page.evaluate(() => document.querySelector('.enquiry-bar').classList.contains('is-hidden')));
  // Lightbox swipe.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.gallery__track button >> nth=0');
  await page.waitForSelector('#lightbox.is-open');
  await page.evaluate(() => {
    const lb = document.getElementById('lightbox');
    const t = (x) => new Touch({ identifier: 1, target: lb, clientX: x, clientY: 400 });
    lb.dispatchEvent(new TouchEvent('touchstart', { touches: [t(300)], changedTouches: [t(300)], bubbles: true }));
    lb.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(120)], bubbles: true }));
  });
  check('mobile lightbox: swipe left advances', (await page.textContent('[data-lb-count]')).trim().startsWith('2 /'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  // Menu.
  await page.click('[data-menu-open]');
  check('menu: opens', await page.isVisible('#menu-sheet.is-open'));
  check('menu: aria-expanded true', (await page.getAttribute('[data-menu-open]', 'aria-expanded')) === 'true');
  check('menu: focus inside sheet', await page.evaluate(() => document.getElementById('menu-sheet').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('menu: Escape closes and restores focus', !(await page.isVisible('#menu-sheet.is-open')) && (await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-open'))));
  await page.click('[data-menu-open]');
  await page.click('#menu-sheet nav a >> text=Collection');
  await page.waitForURL(/collection\/$/);
  check('menu: navigation works and aria-current set', (await page.getAttribute('.nav__link[href$="collection/"]', 'aria-current')) === 'page');
  await ctx.close();
}

// ---------------------------------------------------------------- theme toggle & reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE);
  check('theme: dark by default', (await page.getAttribute('html', 'data-theme')) === 'dark');
  await page.click('.theme-toggle');
  check('theme: toggles to light', (await page.getAttribute('html', 'data-theme')) === 'light');
  await page.reload();
  check('theme: preference persists', (await page.getAttribute('html', 'data-theme')) === 'light');
  await ctx.close();
  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await rm.newPage();
  await p2.goto(BASE);
  const pending = await p2.$$eval('.reveal, .reveal-img', (els) => els.filter((e) => !e.classList.contains('is-in')).length);
  check('reduced motion: all reveal content shown immediately', pending === 0, `${pending} pending`);
  await rm.close();
  const nm = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p3 = await nm.newPage();
  await p3.goto(BASE);
  // Collect LCP candidates for 2.5s and report the final one.
  const lcp = await p3.evaluate(() => new Promise((r) => { let last = null; new PerformanceObserver((l) => { last = l.getEntries().at(-1); }).observe({ type: 'largest-contentful-paint', buffered: true }); setTimeout(() => r(last && { t: Math.round(last.startTime), el: last.element?.tagName, url: last.url?.split('/').slice(-2).join('/') }), 2500); }));
  // Chrome treats a viewport-filling image as background for LCP, so the hero headline is the candidate.
  check('home LCP < 2.5s (local, unthrottled)', lcp && lcp.t < 2500, JSON.stringify(lcp));
  const cls = await p3.evaluate(() => new Promise((r) => { let v = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value; }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => r(v), 1500); }));
  check('home CLS < 0.1 (local)', cls < 0.1, cls.toFixed(3));
  await nm.close();
}

await browser.close();
results.finishedAt = new Date().toISOString();
results.summary = { checks: results.checks.length, failures, pages: pages.length, viewports: VIEWPORTS.map(([w, h]) => `${w}×${h}`) };
await mkdir(path('reports/'), { recursive: true });
await writeFile(path('reports/qa-results.json'), JSON.stringify(results, null, 2));
console.log(`\n${results.checks.length} checks, ${failures} failures → reports/qa-results.json`);
process.exit(failures ? 1 : 0);
