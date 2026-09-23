# Lusso Auto — Design System

> Derived from Lusso's own material: the cyan **LA** monogram, the steel-clad showroom hall,
> the pale polished floor, and the house photography style. The cars carry the colour.

**Design read.** A brand site and working catalogue for collectors and serious buyers of special
cars in Cape Town. Quiet, architectural, editorial. It should feel like walking into the showroom
by appointment — not like a marketplace.

**Dials.** Variance 6 · Motion 4 · Density 4 (editorial above the fold, precise and practical in the catalogue).

---

## 1. Source material

| Observation (from Lusso imagery) | Design consequence |
|---|---|
| Logo: thin-stroke geometric **L** + open triangle **A**, flat cyan `#08BAEF` (sampled from `LUSSO-SQUARE-LOGO-2.png`, 126k px) | One accent colour, used like the illuminated sign: small, precise, never as a wash |
| Current showroom: black corrugated steel cladding, black steel mezzanine and glazing, spotlights | Canvas is a cool, slightly blue-black (not warm, not pure black); hairlines behave like steel seams |
| Floor: pale grey polished epoxy with soft reflections | Light theme ("Floor") is a cool pale grey, never cream/beige |
| Previous showroom (Sold archive photos): raw concrete pillars, city windows, LED LA sign | Concrete grey mid-tones for secondary surfaces |
| Photography: 3/4 front, car centred, low camera, whole car in frame, 4:3 | Default image ratio 4:3; heroes may crop to 16:9/21:9 but never cut the car off |
| Listing voice: "BY APPOINTMENT ONLY", enthusiast specification lists | Appointment language is first-class UI; specs are grouped, not a hairline table |

## 2. Colour

Dark ("Showroom") is the default because it is the brand; a light ("Floor") theme is offered via a toggle and
respected when the visitor chooses it. Tokens live on `:root` in `src/css/tokens.css`.

| Token | Showroom (dark, default) | Floor (light) | Role |
|---|---|---|---|
| `--canvas` | `#0D0F11` | `#ECEEEF` | Page background |
| `--surface` | `#15181B` | `#E2E5E7` | Raised bands, gallery backdrop |
| `--surface-2` | `#1D2125` | `#D6DADD` | Inputs, hover fills |
| `--hairline` | `#262B30` | `#C6CBCF` | Seams, dividers |
| `--hairline-strong` | `#3A4047` | `#A9B0B6` | Input borders, focus-adjacent |
| `--ink` | `#EDEFF0` | `#111416` | Primary text |
| `--ink-2` | `#A7AEB5` | `#454C53` | Secondary text |
| `--ink-3` | `#7E868E` | `#5E666E` | Captions, meta (5.2:1 / 5.0:1 on canvas; ≥ 4.6:1 on surface) |
| `--accent` | `#08BAEF` | `#08BAEF` | The LA cyan — marks, focus ring, active state, primary button fill |
| `--accent-ink` | `#3CCBF5` | `#00709A` | Accent used **as text** (links) — contrast-safe per theme |
| `--on-accent` | `#061015` | `#061015` | Text on a cyan fill (8.5:1) |
| `--focus` | `#08BAEF` (8.5:1) | `#00709A` (4.8:1) | Focus ring — cyan fails 3:1 on the light floor (1.9:1), so light uses the deep accent |
| `--scrim` | `rgb(8 10 12 / .72)` | same | Text over photography |

Rules
- **One accent.** Cyan appears on: logo, focus rings, the active nav marker, primary buttons, a thin rule under key numbers. Never as a gradient, glow, or section background.
- **No gold, no red CTAs, no gradients** other than the photographic scrim.
- Status colour is typographic, not chromatic: `Sold` and `POA` are words, not coloured badges.

## 3. Typography

One family: **Archivo** (variable, self-hosted, `wght 100–900`, `wdth 62–125`). Its width axis gives two voices
without a second font: an **expanded** automotive voice for identity moments, and a **normal-width** voice for reading
and data.

| Style | Settings | Use |
|---|---|---|
| `display` | wdth 118, wght 500, 40–72px, lh 1.02, tracking -0.01em | Vehicle names on detail pages, the few editorial headlines |
| `display-caps` | wdth 125, wght 500, 12–13px, tracking 0.16em, uppercase | Wordmark lockup, nav, the rare label |
| `title` | wdth 110, wght 500, 22–28px, lh 1.15 | Section headlines, card titles |
| `body` | wdth 100, wght 400, 17px, lh 1.6, max 64ch | Prose |
| `body-sm` | wdth 100, wght 400, 15px, lh 1.5 | Card meta, captions |
| `spec-value` | wdth 100, wght 500, 17–20px, `tabular-nums` | Price, mileage, year, kW/Nm |
| `spec-label` | wdth 100, wght 400, 13px, `--ink-3` | Spec names |
| `number-display` | wdth 112, wght 400, 44–56px, tabular | Detail-page price and mileage only |

Rules: no condensed racing fonts, no scripts, no serifs, no giant headlines for effect. Emphasis uses weight within the family.
Numbers are always tabular. Prices formatted `R 2 449 000` (thin-space groups, South African convention); mileage `19 500 km`.

## 4. Space, grid, breakpoints

- 8px ladder: `4 8 12 16 24 32 48 64 96 128`.
- Container: `min(100% - 2×gutter, 1440px)`; gutter `clamp(16px, 4vw, 48px)`.
- 12-column grid ≥ 1024px; 6 columns 768–1023; single column < 768.
- Breakpoints tested: 375, 390, 430, 768, 1024, 1440, 1920.
- Section rhythm: `clamp(64px, 10vw, 144px)` between major sections; catalogue pages are tighter (`48–64px`).

## 5. Shape, borders, depth

- **Radius: 0 everywhere.** Buttons, inputs, images, cards, dialogs. (Steel and glass, not cushions.)
- **Borders:** 1px `--hairline` seams separate groups; never top *and* bottom on every row.
- **Shadows:** none on surfaces. Depth comes from photography and tonal steps (`canvas → surface → surface-2`).
- **Overlays:** a single bottom-weighted scrim on photography that carries text; lightbox backdrop `rgb(6 8 10 / .96)`.

## 6. Photography

- Lusso's own photography only (Lusso site, Lusso dealer listings; Instagram once extracted). Never manufacturer, stock or other dealers' images.
- Cards: 4:3, `object-fit: cover`, `object-position: center 60%` (the house style centres the car low).
- Vehicle hero: first image of the dealer gallery (dealer-chosen), verified visually per car.
- Home hero: a single full-bleed showroom photograph; no video until Instagram media is available.
- Responsive derivatives 480/800/1200/1600 WebP; `srcset` + `sizes`, explicit `width/height`, `loading="lazy"` except the LCP image (`fetchpriority="high"`, preloaded).
- Alt text is generated from verified data: "2017 Ferrari California 30 in Rosso Corsa, photograph 3 of 26".

## 7. Components

**Navigation.** 64px bar, LA mark left, five links right (`Collection · Sell · Source · About · Contact`), active link marked by a 2px cyan rule beneath. Transparent over the home hero, `--canvas` elsewhere. Mobile: mark + "Menu" button → full-height sheet, focus-trapped.

**Buttons.** Sharp, 48px min height, 0 20px padding, `display-caps` label.
- Primary: cyan fill, `--on-accent` text. One primary per view.
- Secondary: 1px `--ink` outline, transparent.
- Text link: `--accent-ink`, underline offset 4px.
- `:active` translates 1px. Focus: 2px `--focus` outline, 3px offset.
- Enquiry intents have fixed labels site-wide: **WhatsApp**, **Call**, **Book a viewing**.

**Vehicle card.** Image (4:3) → year + make/model (`title`) → variant (`body-sm`, `--ink-2`) → a single meta line: price or `Price on application` · mileage · one key spec. No borders, no background; a 1px seam appears on hover under the image. The whole card is one link.

**Spec block (detail page).** Grouped chunks, not a table: *Vehicle* (year, mileage, colour, interior), *Drivetrain* (engine, power, torque, transmission, drive), *History* (owners, service history, warranty, keys/books). Only fields that are verified render; empty fields are omitted, never shown as "N/A".

**Gallery.** Desktop: large lead image + 4-up strip and "All photographs (n)" → lightbox. Mobile: full-width scroll-snap carousel with a live "3 / 26" counter; tap opens the lightbox. Lightbox: keyboard (←/→/Esc), focus trap and restore, swipe, body scroll lock.

**Enquiry bar (mobile vehicle pages).** Fixed bottom, 56px, three equal targets — Call · WhatsApp · Book a viewing — `--surface` background with top seam. Hidden while the in-page enquiry section is visible so it never covers it.

**Forms.** Labels above inputs, helper text below, 48px inputs, `--surface-2` fill, 1px `--hairline-strong` border, cyan focus. No backend exists, so forms *compose* a WhatsApp message or email — the submit button says exactly that ("Send via WhatsApp").

**Icons.** Phosphor (regular weight, 1.5px optical stroke), inlined SVG at build time, 20px. Used only for WhatsApp/phone/mail/arrows/close.

## 8. Motion

- Easing `cubic-bezier(.2,.7,.1,1)`; durations 200ms (UI), 600ms (reveals).
- Allowed: image fade/scale-from-1.03 reveal on enter (IntersectionObserver), hover image scale 1.02 over 600ms, lightbox cross-fade, nav sheet slide.
- Not allowed: parallax, scroll hijack, cursor effects, looping animation, autoplay audio, multiple autoplay videos.
- `prefers-reduced-motion: reduce` → all transitions instant, no reveals.

## 9. Voice

Knowledgeable, understated, personal. Short sentences. Car names spelled exactly as the manufacturer does.
Never: "ultimate", "unleash", "dream machine", "redefined", "excellence", exclamation marks, emoji, superlatives we cannot evidence.
No em dashes in visible copy.

## 10. Do / Don't

Do: let one photograph fill the screen; keep prices and mileage legible at a glance; say "by appointment"; show sold cars as history.
Don't: badges on photos, carbon-fibre textures, racing stripes, gold, glows, rounded cards, star-rating widgets, countdowns, "latest" sort without a real date.
