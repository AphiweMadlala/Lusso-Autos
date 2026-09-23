# Research audit: Lusso Auto

Retrieval window: **22–23 September 2026**. Everything shown on the proposal site traces to a row here or to a machine-readable record in `data/` (`vehicles.json` → `sourceUrls`/`fieldProvenance`, `business.json` → `sources`/`conflicts`, `team.json` → `sources`, `media-manifest.json` → `originalUrl`).

## 1. Tools and access

| Tool | Status | Effect on research |
|---|---|---|
| Apify (CLI + REST) | **Unavailable.** `APIFY_TOKEN` is set but is 14 characters long (real tokens start `apify_api_` and are about 46), and `api.apify.com/v2/users/me` returns HTTP 401. | **Instagram was not extracted.** `scripts/fetch-instagram.mjs` is written and ready. |
| Instagram (direct) | Blocked: the web API returns `require_login` (401) for this Codespace IP. | No Instagram content, captions or media are used anywhere. |
| Firecrawl | CLI installed, but `FIRECRAWL_API_KEY` **not set**. | Replaced by direct HTTP fetches and the built-in web search/fetch. |
| Agent Reach | **Not installed.** | Replaced by web search. |
| AutoTrader (HTTP) | Worked for 20 listings, then the IP was rate-limited (HTTP 503 on pages and the image CDN). A retry on 23 Sep 2026 recovered the image CDN but listing pages were still blocked. | 10 listing pages (9 from AutoTrader's page 2, plus one extra link found on page 1) could not be fetched. See §5. |
| lussoauto.co.za (WordPress REST API) | Worked. | Primary source for the team, contacts, services, the Sold portfolio and most photography. |
| Web search/fetch | Worked. | Founder profile (Cars.co.za). |

## 2. Source hierarchy used

1. **Live AutoTrader dealer listings (dealer 113036)**: current stock, price, mileage and dealer-written specifications. These are Lusso-maintained and updated 1–21 Sept 2026.
2. **lussoauto.co.za**: Lusso's own site, which is *still actively maintained* (vehicle pages edited up to 9 Sept 2026), despite being described in the brief as the previous domain. Used for team, contacts, services, the Sold portfolio and photography.
3. **Cars.co.za profile (19 Jun 2024)**: founder career and early showroom.
4. Instagram: would have ranked first for brand and currency, but was **not accessible** (§1).

Rule applied: where two Lusso-controlled sources disagree, the **more recently updated** one wins for vehicle facts. For business facts that remain ambiguous, the site shows neither value and the conflict is flagged.

## 3. Business facts

| Fact | Source(s) | URL | Retrieved | Information | Confidence | Conflicts | Final value and reasoning |
|---|---|---|---|---|---|---|---|
| Company name | AutoTrader dealer profile; Lusso site title and logo | autotrader.co.za/dealer/lusso-auto/113036 · lussoauto.co.za | 2026-09-22 | "Lusso Auto"; "Lusso Auto – Exclusive Collection" | High | Listing copy also says "Presented by Lusso Auto Investments" | **Lusso Auto** (Exclusive Collection lockup). "Lusso Auto Investments" is likely the legal entity; not shown until confirmed. |
| Founded | Cars.co.za profile | cars.co.za/motoring-news/profile-lusso-auto-in-cape-town/268096/ | 2026-09-22 | Opened March 2024 | High | None | **March 2024** |
| Founder | Lusso about/contact pages; Cars.co.za | lussoauto.co.za/about-us/ · /contact-us/ | 2026-09-22 | Arno Cloete, CEO and Founder | High | None | **Arno Cloete, CEO and Founder** |
| Founder career | Cars.co.za profile | as above | 2026-09-22 | Diamond-cutting studies → Nissan → 3 years Opel → Mercedes-Benz → 5 years managing BMW dealerships in Abu Dhabi → Scuderia Cape Town 2012 to Jan 2024 (GM of Scuderia SA Cape Town, nearly 12 years) | High (single reputable source) | LinkedIn/ZoomInfo snippets mention "National Sales Manager at Ferrari" and "Lusso Auto Design"; not verifiable (login walls) | Used only the Cars.co.za facts, paraphrased in original copy. |
| Showroom location | AutoTrader dealer profile | autotrader.co.za/dealer/lusso-auto/113036 | 2026-09-22 | Northgate Business Park, Milnerton; map pin −33.9135, 18.4881 | **Medium** | Lusso contact page (last edited 15 Jun 2026) says "Cape Town, CBD"; Cars.co.za (Jun 2024) says CBD | **Northgate Business Park, Milnerton** (no street address; none is published anywhere). Photographic evidence: every car Lusso listed up to July 2026 was shot in a concrete-pillared room with city windows (the CBD description); every September 2026 listing is shot in a black steel-clad hall. This indicates a move around Aug–Sept 2026. **Client to confirm.** |
| Opening hours | AutoTrader profile; Lusso site footer | as above | 2026-09-22 | AT: Mon–Fri 09:00–16:00, Sat 09:00–12:00. Lusso site: Mon–Fri 8am–5pm | **Unresolved** | Direct conflict between two Lusso-controlled sources | **Not displayed.** The site says "Viewing strictly by appointment" (verified in every current listing). |
| Viewing policy | All current listings; Cars.co.za quote | — | 2026-09-22 | "BY APPOINTMENT ONLY", "Viewing strictly by appointment" | High | None | **By appointment only** |
| Main phone | Lusso contact page; Arno's business-card page; footer | lussoauto.co.za/contact-us/ · /bc-lusso-arno/ | 2026-09-22 | +27 76 079 9966 (written "+27 76 0799 966" on the site) | High | None | **+27 76 079 9966** (regrouped for readability; digits unchanged) |
| WhatsApp | AutoTrader (WhatsApp enabled; number hidden) | — | 2026-09-22 | Dealer and reps are WhatsApp-enabled | **Medium** | Number not published anywhere | **wa.me/27760799966** (Arno's mobile), **assumed**. Client to confirm. |
| Emails | Lusso footer and pages | lussoauto.co.za | 2026-09-22 | info@, arno@, fay@, riccardo@lussoauto.co.za | High | None | As listed |
| Social | Lusso footer; web search | — | 2026-09-22 | instagram.com/lussoautoexclusive, facebook.com/lussoautoexclusive, tiktok.com/@lussoautoexclusive | High | None | Instagram and Facebook linked in the footer |
| Services | Lusso about/selling pages; listing boilerplate | lussoauto.co.za/about-us/ · /selling/ | 2026-09-22 | Buying; consigning and selling; sourcing; placement; paint correction; detailing; protection film; outright purchase ("professional car buying service"); finance through all major banks; selected trade-ins | High | None | Only these are mentioned. **Not claimed:** import, delivery, guaranteed sourcing, in-house warranties, finance terms. |
| Positioning | AutoTrader "About us"; Lusso home | — | 2026-09-22 | "inspected, road tested and honestly represented… disclose them upfront"; "Where passion for cars meets integrity" | High | None | Paraphrased in original copy. No superlatives ("Cape Town's #1" etc.) used. |

## 4. Team

| Person | Sources | Role | Contacts | Confidence | Conflicts | Published as |
|---|---|---|---|---|---|---|
| Arno Cloete | Lusso contact page; bc-lusso-arno; about page; Cars.co.za; every listing ("Contact Arno, Riccardo or Fay") | CEO and Founder | +27 76 079 9966 · arno@lussoauto.co.za | High | None | Full name, role, phone, email |
| Fay Sakir | Lusso contact page; bc-lusso-fay; AutoTrader sales rep #11575; listings | Account Manager (inferred from About-page column order) | +27 61 580 7236 · fay@lussoauto.co.za | High (name/contact), medium (role) | None | Full name, role, phone, email |
| Riccardo | Lusso contact page; bc-lusso-riccardo; AutoTrader rep #11576; listings | Sales Manager (column order) | +27 64 681 2010 · riccardo@lussoauto.co.za | High (first name/contact) | **Surname:** "Pantalone" (Lusso site) vs "Pantolone" (AutoTrader) | **First name only**, as Lusso itself signs listings. Client to confirm the spelling. |

Photos: the only published portraits (2024) are graphics with the LA logo drawn across each person. They are not used; the team is presented typographically.

## 5. Inventory

- The AutoTrader dealer page reported **29** listings. **20** detail pages were fetched and parsed (all dealer 113036, all "BY APPOINTMENT ONLY"). Captured: structured fields (year, make/model/variant, price or POA, mileage, transmission, fuel, colour, service history, owners, warranty, last-updated date) plus the dealer's own description and specification list.
- **Page 2** (9 listings) could only be listed through Playwright, because pagination is client-side. Their detail pages, plus one GTC4Lusso link seen on page 1, returned 503 or 404 (one X6 xDrive35i, `28536870`). They correspond to cars that lussoauto.co.za still links from /buying: McLaren 600LT, 911 GT3 (two pages), California 30 (two), X6 xDrive35i, RS4, C43 Cabriolet, Lotus Esprit S3, Bentley Continental GTC and Defender 110 V8 Carpathian. Because their current status could not be verified, **they are UNKNOWN and not shown as stock**.
- Vehicle facts use dealer-entered structured fields and dealer-written text only. AutoTrader's model-level specification database (kW, 0–100 and so on) is stored in `data/sources/autotrader/listings.json → referenceSpecifications` but **never displayed**. Power and torque appear only where the dealer wrote them; each quoted line is kept in `fieldProvenance`.
- One BMW i8 (`at-28749095`) is live. Its photos first failed (image CDN 503), then downloaded on retry on 23 Sep 2026, so it is **published** (20 current cars in total).

### Vehicle-level conflicts (flagged, not merged)

| Vehicle | Field | Values | Shown | Why |
|---|---|---|---|---|
| BMW i8 | Year | AT registration 2016 vs description "2018 BMW i8" | 2016 | Structured field; client to confirm |
| Ferrari Dino 308 GT4 | Year | AT 1977 and Lusso page title 1977 vs description "1974" | **1977** | Two structured sources agree; client to confirm |
| Range Rover Sport SVR | Year | AT 2016 and Lusso page 2016 vs description "2017" | **2016** | As above |
| BMW M240i xDrive | Price / mileage | AT R 899 000 / 33 500 km (updated 9 Sep) vs Lusso page R 979 000 / 33 000 km (22 Jun) | AutoTrader | More recent |
| Ferrari 296 GTS | Mileage | AT 7 600 km (9 Sep) vs Lusso page 8 100 km (7 Jul) | AutoTrader | More recent; a lower later reading suggests a correction. Client to confirm |
| 13 Lusso-site cars | Status | Listed on /buying vs not live on AutoTrader | UNKNOWN (hidden) | Current status not established |

## 6. Sold collection

- Source: **lussoauto.co.za/sold/** ("Our Sold Portfolio: an historical view of all the amazing cars we have sold"). 297 image boxes, which include repeated responsive blocks; de-duplicated by image URL to **165 unique entries**.
- One further duplicate was found by file hash: the Maybach S600 appears twice with the same photograph (`sold-6970` = `sold-8383`), so the dated entry is kept.
- 73 collector-grade entries downloaded and **each photo visually checked against its title** (contact sheets). 24 are featured; the full register (164) is listed as text.
- Title normalisation, all recorded in `data/curation.json`: "Ferrari Scuderia" is shown as "Ferrari 430 Scuderia" (the photo shows an F430 Scuderia, and Cars.co.za lists an F430 Scuderia in Lusso's 2024 stock); "Lambo" is spelled "Lamborghini"; one capitalisation fix.

## 7. Reviews and testimonials

| Item | Source | Used? | Reason |
|---|---|---|---|
| AutoTrader review, 27 Jun 2026, 10/10, "Cape experience." | AutoTrader dealer profile | **Yes**, quoted verbatim, attributed "AutoTrader customer, June 2026" | Genuine, attributable |
| AutoTrader review, 17 Aug 2026, 1/10, "No response at all" (Lusso replied: the lead had gone to spam) | AutoTrader | No | Recorded here; the site shows no rating widgets at all |
| AutoTrader aggregate 4.1 / 10 ratings | AutoTrader | No | No star badges by design |
| Three anonymous client messages to Arno on leaving Scuderia | lussoauto.co.za home "Our Happy Clients" | One excerpt, verbatim, labelled as a client message published by Lusso | No names are published, so none are invented |

## 8. Outstanding questions for Lusso

1. Confirm the showroom address (Northgate Business Park, Milnerton?) and whether a street address may be published.
2. Confirm opening hours, or confirm "by appointment only" is the whole message.
3. Confirm the WhatsApp number(s), and whether each team member should have a direct WhatsApp link.
4. Riccardo's surname spelling (Pantalone / Pantolone).
5. Status of the 13 cars still on lussoauto.co.za/buying but not live on AutoTrader.
6. Year of the Dino (1977 vs 1974), i8 (2016 vs 2018) and SVR (2016 vs 2017); mileage of the 296 GTS.
7. Legal entity name ("Lusso Auto Investments"?).
8. Permission to use the Instagram content once extraction works, and a valid Apify token.
