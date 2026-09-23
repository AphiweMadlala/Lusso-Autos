# Project context: Lusso Auto proposal site

A proposal website for **Lusso Auto (Exclusive Collection, Cape Town)**, built only from Lusso's real vehicles, photography, contacts and identity. It is a static site generated from JSON data, meant for GitHub Pages while it remains a proposal.

Deliverables: `data/business.json`, `data/team.json`, `data/vehicles.json`, `data/instagram-posts.json`, `data/media-manifest.json`, `reports/research-audit.md`, `reports/media-reconciliation.md`, `reports/final-qa.md`, `DESIGN.md`, and this file.

---

## 1. Research sources and hierarchy

Research window: 22–23 September 2026. Every published fact traces to a source recorded in `reports/research-audit.md` (human-readable) and in the data files themselves (`sourceUrls`, `fieldProvenance`, `sources`, `conflicts`).

| Rank | Source | Role |
|---|---|---|
| 1 | **AutoTrader dealer 113036** (`autotrader.co.za/dealer/lusso-auto/113036`) | **Status authority** for current stock: dealer-maintained and updated in September 2026. Also the source for dealer-written specs, dealer photos, the showroom suburb and map coordinates, sales reps and reviews. |
| 2 | **lussoauto.co.za** (WordPress REST API) | Lusso's own site: vehicle pages and galleries, the "Our Sold Portfolio" page, team business cards, contact details and services. Used for the team and sold archive. Its address and hours are treated as possibly outdated. |
| 3 | **Instagram @lussoautoexclusive** | Intended as the primary brand source. **Not extracted:** the Apify token is invalid (HTTP 401), and Instagram requires login from this Codespace. Nothing from Instagram is used. |
| 4 | Press/profiles (e.g. Cars.co.za, 19 Jun 2024) | Founder story themes only: Arno Cloete's Ferrari career and the founding of Lusso. Paraphrased, never copied. |

Rules applied throughout: never merge two conflicting values into an invented one; flag conflicts rather than resolve them by guesswork; never take specs from model-level reference data (AutoTrader's spec database is deliberately ignored), only from what the dealer wrote about *this* car.

## 2. Brand and design philosophy

Full system in `DESIGN.md`. In short: the design comes from Lusso's own material, not from the "black and gold luxury" template.

- **One accent:** the LA monogram cyan `#08BAEF`, sampled from Lusso's logo file and used like the illuminated sign (small, precise, never as a wash).
- **Canvas:** a cool blue-black taken from the steel-clad showroom (dark "Showroom" theme, the default), plus a pale polished-floor grey (light "Floor" theme, via a toggle).
- **Type:** one variable family (Archivo, self-hosted). Its width axis supplies an expanded automotive voice for identity moments and a normal width for reading and specs.
- **Photography carries the colour.** 4:3 house framing, whole car in frame; heroes crop but never cut the car off.
- **Appointment-first language** ("by appointment", "private viewing"), taken from Lusso's own listings. Status is typographic (`Sold`, `POA` are words, not coloured badges).

## 3. Architecture

Plain Node ES modules, no framework, and no client-side rendering beyond small progressive enhancements.

```
config/site.config.mjs   BASE_PATH, SITE_URL, PROPOSAL_MODE (env vars override)
data/                    canonical JSON (the only thing templates read)
  sources/               raw snapshots with provenance (autotrader/, lussoauto-site/, reconciliation.json)
  curation.json          editorial choices: home hero/feature, featured sold cars, title fixes (each with a reason)
templates/               layout.mjs, partials.mjs, pages.mjs, helpers.mjs — pure functions data → HTML
src/css/site.css         design tokens + components
src/js/                  site.js (menu, theme, reveals), collection.js (filter/sort/search/URL state),
                         gallery.js (swipe gallery + accessible lightbox), enquiry.js (form → WhatsApp/email)
public/images/           responsive WebP derivatives (committed)
media/originals/         downloaded originals (git-ignored cache, re-downloadable)
scripts/                 pipeline (below) + qa.mjs + serve.mjs
dist/                    build output (git-ignored)
```

Every vehicle page is generated from `data/vehicles.json`. No vehicle HTML is written by hand.

## 4. Pipeline

```
npm run fetch:autotrader   → data/sources/autotrader/listings.json   (raw, dealer-entered)
node scripts/fetch-lusso-site.mjs → data/sources/lussoauto-site/{pages.raw,parsed}.json
npm run fetch:instagram    → data/instagram-posts.json               (needs valid APIFY_TOKEN)
npm run data:vehicles      → data/vehicles.json + data/sources/reconciliation.json
npm run media              → media/originals/, public/images/, data/media-manifest.json
npm run build              → validate.mjs (errors fail) → build.mjs → dist/
npm run serve              → http://localhost:4173/Lusso-Autos/
node scripts/qa.mjs        → reports/qa-results.json (Playwright; needs serve running)
```

### Vehicle data (`scripts/build-vehicles.mjs`)
- Merges the AutoTrader and Lusso-site records per car. Each field records which source it came from in `fieldProvenance`.
- Parses dealer descriptions and strips boilerplate ("BY APPOINTMENT ONLY", "finance available", …) into `dealerServices` so it isn't repeated per car.
- Engine, power, torque, warranty, keys and books are filled **only** when the dealer stated them. A caption that says "V8" is not turned into "4.0L V8".
- Field conflicts between sources are written to `data/sources/reconciliation.json` and shown in the research audit. The newer dealer-maintained value is displayed, and the conflict is listed for client confirmation.
- Existing media assignments are preserved across rebuilds.

### Instagram extraction (`scripts/fetch-instagram.mjs`)
Written and ready, but not yet run successfully. It calls Apify's `apify/instagram-scraper` actor for `@lussoautoexclusive` (default `--limit=150`) and keeps the raw dataset in `data/sources/instagram/`. It then normalises each post: ID, shortcode, URL, date, caption, type, ordered carousel media, reel cover, video URL, location, hashtags, mentions, alt text and engagement. `--from-raw` re-normalises without re-fetching. `build-vehicles.mjs` links a post to a vehicle only when the match is clear. Media download for Instagram would follow the same `process-media.mjs` path with `group: instagram`.

### Media (`scripts/process-media.mjs`)
- Sources, in order of preference: Lusso's own site galleries (their order, often larger originals), then AutoTrader dealer originals (`img.autotrader.co.za/<id>`, uploaded by Lusso, no watermark). The two are **never mixed for one car**. The sold archive uses Lusso's Sold portfolio.
- Checks: rejects non-image responses, decodes every file with sharp (catches corrupt or zero-byte files), SHA-256 for exact duplicates (removed), dHash for near-duplicates (flagged for review), and excludes anything under 800px wide as a thumbnail.
- Output: WebP at 480 / 800 / 1280–1600 (up to the source's size) with explicit dimensions, used through `srcset`/`sizes`. Only the hero is eager with `fetchpriority="high"`; everything else is lazy.
- Visual verification: `node scripts/tools/contact-sheet.mjs <group> <outDir> [perSheet] [heroes|slug]` renders labelled sheets. Every current car's hero and every sold image was checked by eye (`reports/media-reconciliation.md`).

### Validation (`scripts/validate.mjs`)
Fails the build on duplicate IDs or slugs, malformed prices, mileage, URLs or emails, invalid statuses, missing provenance, missing or zero-byte image files, duplicate hero images, unidentifiable active listings, invalid team contacts and dangling file references. Optional gaps are warnings. It never fills in missing data.

## 5. Current-vs-sold status methodology

| Status | Rule | Where shown |
|---|---|---|
| **available** | AutoTrader listing fetched live under dealer 113036 in this run. Also needs at least one verified photo to be published. | Collection, home |
| **reserved** | Only if a source explicitly says so. None found. | — |
| **sold** | Listed on Lusso's own Sold portfolio. | Sold collection (24 featured with photos; the full register as text) |
| **unknown** | Anything else, e.g. still linked from lussoauto.co.za/buying but not live on AutoTrader, or the AutoTrader page could not be fetched. | **Nowhere.** Never shown as stock. |

Current counts: **20 available**, **165 sold** (164 shown after removing one duplicate), **16 unknown**.

## 6. Unresolved information

Flagged for Lusso to confirm; the site shows the conservative option in each case. Full detail is in `reports/research-audit.md` §5 and §8.

1. **Showroom address:** AutoTrader (current) says Northgate Business Park, Milnerton; lussoauto.co.za and a 2024 profile say the CBD. Photography supports a 2026 move. The site shows "Northgate Business Park, Milnerton" with no street address.
2. **Opening hours:** AutoTrader and Lusso's site disagree. The site shows "by appointment" and no hours.
3. **Riccardo's surname:** Pantalone (Lusso site) vs Pantolone (AutoTrader). First name only is shown.
4. **WhatsApp:** one verified number. Whether each team member wants a direct WhatsApp link is unconfirmed.
5. **Vehicle fields:** year of the Dino (1977 vs 1974), i8 (2016 vs 2018) and SVR (2016 vs 2017); 296 GTS mileage; M240i price (the newer AutoTrader value is shown).
6. **10 AutoTrader listings** (McLaren 600LT, 911 GT3, California 30, RS4, C43, Esprit S3, Continental GTC, Defender 110, GTC4Lusso, X6) returned HTTP 503 or 404, so they remain **unknown** until fetched.
7. Legal entity name.
8. **Instagram:** needs a valid Apify token and the client's permission to reuse the content.

## 7. Proposal configuration

`config/site.config.mjs` is the single source:

| Key | Default | Effect |
|---|---|---|
| `BASE_PATH` | `/Lusso-Autos/` | Path prefix for every URL and asset (GitHub Pages project site). Use `/` on a custom domain. |
| `SITE_URL` | `https://aphiwemadlala.github.io` | Canonical/OG URLs. |
| `PROPOSAL_MODE` | `true` | Outputs `<meta name="robots" content="noindex, nofollow">` on every page from the shared layout, a `Disallow: /` robots.txt, and a proposal note in the footer. No analytics or tracking in any mode. |

Override per build: `BASE_PATH=/ SITE_URL=https://lussoauto.co.za PROPOSAL_MODE=false npm run build`. Set `PROPOSAL_MODE=false` only after the client approves launch.

## 8. Refreshing inventory

```sh
npm run fetch:autotrader            # re-run keeps successful listings, retries failed ones; --refresh refetches all
npm run data:vehicles               # rebuild vehicles.json; sold/unknown/available recomputed from sources
npm run media                       # downloads galleries for new cars only; audits everything
node scripts/tools/contact-sheet.mjs vehicles /tmp/sheets 30 heroes   # eyeball new heroes
npm run build && npm run serve & node scripts/qa.mjs
```

AutoTrader rate-limits bursts with HTTP 503. The fetcher backs off and retries, and a later re-run picks up what failed. A car that drops off AutoTrader becomes **unknown** automatically (and leaves the collection) until it appears on the Sold portfolio. Editorial choices (home hero, featured car, featured sold cars) live in `data/curation.json` and must point at cars that are still available. The build fails if they don't.

## 9. Production integration later

- **Hosting:** the output is static. Keep GitHub Pages (add a Pages workflow running `npm ci && npm run build`), or move to Netlify/Cloudflare Pages on `lussoauto.co.za` with `BASE_PATH=/`.
- **Inventory:** replace scraping with a feed Lusso controls, such as an AutoTrader dealer/DMS export, a simple Google Sheet, or a headless CMS. Map it into the same `vehicles.json` shape and keep `validate.mjs` as the gate. A scheduled CI job (daily) could rebuild and deploy.
- **Enquiries:** the forms currently compose a WhatsApp message or an email. There is deliberately no backend. For production, add a form endpoint (e.g. Netlify Forms, Formspree, or a small serverless function sending to info@lussoauto.co.za) and keep WhatsApp as the primary action.
- **Instagram:** once the Apify token works, schedule `fetch:instagram` and feed a "showroom" strip from the latest posts, with the client's approval of the content use.
- **Analytics:** none installed. Add privacy-respecting analytics only with client approval.
- **SEO at launch:** turn off `PROPOSAL_MODE`, set `SITE_URL`, add `sitemap.xml` and vehicle `schema.org/Car` JSON-LD, and redirect old lussoauto.co.za URLs (e.g. `/buying/…`, `/sold/`) to the new routes.
