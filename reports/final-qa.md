# Final QA

Run date: **23 September 2026**. Build: 28 pages (home, collection, 20 vehicle pages, sold, sell, source, about, contact, 404), `BASE_PATH=/Lusso-Autos/`, `PROPOSAL_MODE=true`.

Reproduce:

```sh
npm run build          # validate.mjs (fails on errors) → build.mjs → dist/
npm run serve          # dist/ on http://localhost:4173/Lusso-Autos/
node scripts/qa.mjs    # Playwright suite → reports/qa-results.json
```

## Result

| Stage | Result |
|---|---|
| Data validation (`scripts/validate.mjs`) | **0 errors**, 26 warnings (201 vehicles, 623 media assets). Warnings listed below. |
| Playwright functional suite (`scripts/qa.mjs`) | **57 / 57 checks pass** |
| Sitewide sweep: 27 pages × 7 viewports (189 page loads) | 0 broken images · 0 console errors · 0 horizontal overflow · 0 images missing `alt` · 0 images missing dimensions · 0 interactive targets < 24px (WCAG 2.2 AA minimum; the mobile enquiry bar is 56px) · 0 heading-level skips · exactly one `h1` per page · `noindex, nofollow` on every page |
| Impeccable critique + polish | Done. Findings and what changed are listed below. |

Viewports: 375×812, 390×844, 430×932, 768×1024, 1024×768, 1440×900, 1920×1080.

## Functional checks (all pass)

| Area | Checks |
|---|---|
| Links | Internal links resolve (27 unique) · `tel:` well-formed (+27 76 079 9966, +27 61 580 7236, +27 64 681 2010) · WhatsApp `wa.me` well-formed (one number) · `mailto:` well-formed (info@, arno@, fay@, riccardo@) · unknown URL returns the 404 page with HTTP 404 |
| Collection | First page shows 12 of 20 · "Show more" reveals the rest · filter panel toggles · make filter (6 Ferraris) · filter state written to the URL and restored on reload · price low→high with POA last · price high→low · mileage sort · search (4 results) · empty state · "Clear" restores results |
| Vehicle page | POA car shows "Price on application" and no rand figure · similar vehicles are relevant (550 Maranello → Dino 308 GT4, SF90, GTC4Lusso, all Ferrari) |
| Lightbox | Opens from lead image · focus moves into the dialog · body scroll locked · ArrowRight advances · ArrowLeft wraps to last · Tab focus trapped · Escape closes · focus returns to opener · scroll lock released · thumbnail opens at its own index |
| Enquiry form | Empty submit shows errors · focus moves to first invalid field · valid submit composes a pre-filled WhatsApp message to Lusso (no fake backend) |
| Mobile | Gallery counter visible and follows swipe · sticky bar shows Call / WhatsApp / Book a viewing on one line, 56px tall · bar hides when the enquiry section is on screen · lightbox swipe advances |
| Menu | Opens · `aria-expanded` · focus inside sheet · Escape closes and restores focus · navigation sets `aria-current` |
| Theme | Dark ("Showroom") by default · toggles to light ("Floor") · choice persists |
| Motion | With `prefers-reduced-motion: reduce`, all reveal content is shown immediately (0 pending) |
| Performance (local, unthrottled) | Home LCP 136 ms (element: 550 Maranello hero, `03-1600.webp`) · CLS 0.000 |

Per-check detail is in `reports/qa-results.json`.

## Validation warnings (accepted)

- **Media, informational:** 12 SVR gallery thumbnails (540×360) excluded; 3 exact-duplicate images excluded (SF90, 320d, California 30); 1 near-duplicate flag on the 718 Cayman reviewed and kept (front vs rear three-quarter shots against the same backdrop). See `reports/media-reconciliation.md`.
- **Data:** field-level source conflicts (years on the Dino, i8 and SVR; M240i price; 296 GTS mileage) are flagged in `data/sources/reconciliation.json` and `reports/research-audit.md` §5, not merged.

## Design review (Impeccable critique → polish)

**Critique, own assessment first (31/40).** It reads as authored for Lusso: their own photography, the LA cyan used sparingly, the steel-hall palette and appointment-first language. The template risks it found:

| Priority | Finding | Change |
|---|---|---|
| P1 | Hero headline sat over the car body at 1440px | Hero reworked to photo plus a solid caption band; crop re-centred (`object-position: center 42%`); verified by screenshot at 1440 and 390 |
| P1 | Every home section used the same display h2 + arrow link, so the page had no typographic peaks | Secondary sections ("How we can help", "Sold by Lusso", "The showroom") dropped to the `title` style. Display size is kept for "Now in the showroom", the philosophy, the featured car and the contact call to action |
| P2 | Card meta line ran together; price not dominant | Meta separators added; price set at 16px/500 in primary ink |
| P2 | Sold strip had no scroll affordance on desktop | Previous/next strip controls added (hidden on touch devices, disabled at the ends) |
| P3 | Same intent, three labels ("View the collection" / "All 19 cars" / "The collection") | Unified to "View the collection" |
| Detector | Coloured side borders on the quote and notice (a template tell) | Quote uses a short cyan rule above it; notice uses a top hairline |
| Detector | Tight leading on card and sold-tile titles | 1.2 → 1.3 and 1.25 → 1.35 |
| Detector | Lightbox `<img>` rendered without a `src` before first open | Given the first image's `src` with lazy loading |
| Polish | Spec group headings sat visually below body text | Given a clear step above body text |
| Polish | Browser surfaces | Themed scrollbar and cyan caret |

**Detector re-run after polish (8 key pages): 51 warnings, all accepted.** 41 `cramped-padding` flag the hairline seams (DESIGN.md §2: the seams are dividers, not container edges, so content sits against them on purpose). 8 `clipped-overflow-container` flag `body { overflow-x: clip }`, which prevents horizontal scroll and has no popovers to clip. 1 `flat-type-hierarchy` on Sold comes from its 13px caps group labels, which are labels by design. 1 `tight-leading` (1.27×) is on single-line display text. No contrast, glow, gradient or "slop" findings.

## Not tested / known limitations

- **Instagram content is absent.** Apify token invalid (HTTP 401), and Instagram requires login from this Codespace. No Instagram data is used anywhere. See the research audit §1.
- **10 AutoTrader listings could not be fetched** (HTTP 503 rate-limit, still blocked on the 23 Sep retry; one more link returns 404). Those cars are UNKNOWN and not shown as stock.
- Performance numbers are local and unthrottled. Run Lighthouse with mobile throttling on the deployed GitHub Pages URL before presenting.
- Tested in Chromium only (Playwright). Safari/iOS should be checked on a real device, especially the swipe gallery and the `100dvh` hero.
- Screen-reader testing was structural only (roles, labels, focus order, `aria-*`). There was no manual VoiceOver/NVDA pass.
