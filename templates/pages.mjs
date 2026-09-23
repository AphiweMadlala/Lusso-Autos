import { esc, u, img, price, km, icon, plural, telHref, waHref, mailHref, absolute } from './helpers.mjs';
import { vehicleCard, vehicleUrl, soldTile, enquiryActions, teamList, breadcrumb, viewingForm } from './partials.mjs';

const intro = ({ crumbs, title, lede, extra = '' }) => `
<div class="wrap page-intro">
  ${crumbs ? breadcrumb(crumbs) : ''}
  <h1 class="display">${title}</h1>
  ${lede ? `<p class="lede">${lede}</p>` : ''}
  ${extra}
</div>`;

// =====================================================================================================
// HOME
// =====================================================================================================
export function home(d) {
  const { business, curation, available, byId, soldFeatured, mosaic } = d;
  const hero = byId(curation.home.heroVehicle);
  const heroImage = hero.images[curation.home.heroImageIndex ?? 0];
  const arrivals = curation.home.arrivals.map(byId).filter(Boolean);
  const feature = byId(curation.home.featureVehicle);
  const quote = curation.home.founderQuote;

  const featureFacts = [
    ['Price', price(feature)],
    ['Mileage', km(feature.mileageKm)],
    feature.engine && ['Engine', feature.engine],
    feature.transmissionDetail && ['Gearbox', feature.transmissionDetail],
    feature.exteriorColour && ['Colour', `${feature.exteriorColour}${feature.interiorColour ? ` over ${feature.interiorColour}` : ''}`],
    feature.serviceHistory && ['History', feature.serviceHistory],
  ].filter(Boolean);

  const body = `
<section class="hero" aria-labelledby="hero-title">
  <div class="hero__media">${img(heroImage, { sizes: '100vw', eager: true, alt: `${hero.title} in ${hero.exteriorColour}, in the Lusso Auto showroom` })}<span data-hero-end style="position:absolute;bottom:0;height:1px;width:1px"></span></div>
  <div class="wrap hero__content">
    <h1 class="hero__title" id="hero-title">Special cars, shown by appointment.</h1>
    <p class="hero__caption"><span>Pictured</span><a href="${vehicleUrl(hero)}">${esc(hero.title)} ${icon('arrow-up-right')}</a></p>
    <div class="hero__actions"><a class="btn btn--on-photo" href="${u('collection/')}"><span>View the collection</span>${icon('arrow-right')}</a></div>
  </div>
</section>

<section class="section" aria-labelledby="arrivals-title">
  <div class="wrap">
    <div class="section-head">
      <h2 class="display display--md" id="arrivals-title">Now in the showroom</h2>
      <a class="arrow-link" href="${u('collection/')}">View the collection ${icon('arrow-right')}</a>
    </div>
    <div class="arrivals">
      ${arrivals.map((v, i) => `<div>${vehicleCard(v, { sizes: i === 0 ? '(min-width: 1024px) 56vw, 100vw' : '(min-width: 1024px) 38vw, (min-width: 600px) 48vw, 100vw' })}</div>`).join('')}
    </div>
  </div>
</section>

<section class="section seam" aria-labelledby="philosophy-title">
  <div class="wrap philosophy">
    <div class="philosophy__text">
      <h2 class="display display--md" id="philosophy-title">Twelve years with Ferrari. Now a showroom of his own.</h2>
      <div class="prose">
        <p>Lusso Auto opened in March 2024. Its founder, Arno Cloete, spent almost twelve years with Scuderia South Africa in Cape Town, the official Ferrari dealer, latterly as general manager. Before that came Mercedes-Benz, and five years running BMW dealerships in Abu Dhabi.</p>
        <p>The idea is simple. A small, carefully chosen collection. Every car inspected, road tested and honestly described, with any imperfection or modification disclosed up front.</p>
      </div>
      <blockquote>
        <p>“${esc(quote.text)}”</p>
        <footer>${esc(quote.attribution)}</footer>
      </blockquote>
    </div>
    <div class="philosophy__media">
      <div class="frame frame--3x4">${img(mosaic[0].image, { sizes: '(min-width: 1024px) 38vw, 100vw', alt: mosaic[0].alt })}</div>
    </div>
  </div>
</section>

<section class="feature" aria-labelledby="feature-title">
  <div class="feature__media"><div class="frame">${img(feature.images[curation.home.featureImageIndex ?? 0], { sizes: '100vw', alt: `${feature.title} in ${feature.exteriorColour}` })}</div></div>
  <div class="wrap feature__body">
    <div class="feature__intro">
      <h2 class="display display--md" id="feature-title">${esc(feature.title)}</h2>
      <div class="prose">${feature.description.split('\n\n').slice(0, curation.home.featureParagraphs ?? 2).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      <p class="meta">${esc(curation.home.featureTextSource)}</p>
      <div><a class="btn btn--ghost" href="${vehicleUrl(feature)}"><span>See this car</span>${icon('arrow-right')}</a></div>
    </div>
    <dl class="feature__facts">
      ${featureFacts.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>
  </div>
</section>

<section class="section" aria-labelledby="services-title">
  <div class="wrap">
    <div class="section-head"><h2 class="title" id="services-title">How we can help</h2></div>
    <div class="services">
      <div class="service"><h3>Buying</h3><p>Every car in the collection can be seen privately, by appointment. Finance is available through all major banks, and selected trade-ins are welcome.</p><a class="arrow-link" href="${u('collection/')}">View the collection ${icon('arrow-right')}</a></div>
      <div class="service"><h3>Selling</h3><p>Consign your car with us or sell it to us outright. We handle the appraisal and the paperwork, and present it to our network of buyers.</p><a class="arrow-link" href="${u('sell/')}">Sell your car ${icon('arrow-right')}</a></div>
      <div class="service"><h3>Sourcing</h3><p>Looking for something specific? Tell us the car and the specification, and we will look for it through our network.</p><a class="arrow-link" href="${u('source/')}">Source a car ${icon('arrow-right')}</a></div>
      <div class="service"><h3>Private viewing</h3><p>Viewings are strictly by appointment, so the time is yours. Arno, Fay or Riccardo will walk you through the car.</p><a class="arrow-link" href="${u('contact/#book')}">Book a viewing ${icon('arrow-right')}</a></div>
    </div>
  </div>
</section>

<section class="section section--surface" aria-labelledby="sold-title">
  <div class="wrap">
    <div class="section-head">
      <h2 class="title" id="sold-title">Sold by Lusso</h2>
      <div class="section-head__tools">
        <div class="strip-nav"><button class="icon-btn" type="button" data-strip="prev" aria-controls="sold-strip" aria-label="Scroll sold cars back">${icon('caret-left')}</button><button class="icon-btn" type="button" data-strip="next" aria-controls="sold-strip" aria-label="Scroll sold cars forward">${icon('caret-right')}</button></div>
        <a class="arrow-link" href="${u('sold/')}">The sold archive ${icon('arrow-right')}</a>
      </div>
    </div>
  </div>
  <div class="wrap">
    <div class="strip" id="sold-strip" tabindex="0" role="region" aria-label="Cars sold by Lusso Auto">
      ${soldFeatured.slice(0, 10).map((s) => soldTile(s.vehicle, { title: s.title, sizes: '(min-width: 1024px) 26vw, 72vw' })).join('')}
    </div>
  </div>
</section>

<section class="section" aria-labelledby="showroom-title">
  <div class="wrap">
    <div class="section-head"><h2 class="title" id="showroom-title">The showroom</h2></div>
    <div class="mosaic">
      ${mosaic.slice(1, 6).map((m) => `<figure style="margin:0"><div class="frame">${img(m.image, { sizes: '(min-width: 1024px) 50vw, 100vw', alt: m.alt })}</div></figure>`).join('')}
    </div>
  </div>
</section>

<section class="section seam" aria-labelledby="contact-title">
  <div class="wrap contact-band">
    <div class="contact-band__text">
      <h2 class="display display--md" id="contact-title">Book a private viewing.</h2>
      <p class="lede">Viewing is by appointment at our showroom in ${esc(business.showroom.area)}, Milnerton. Message or call and we will find a time that suits you.</p>
    </div>
    <div class="contact-band__actions">${enquiryActions(business, { layout: 'stack' })}</div>
  </div>
</section>`;

  return {
    path: '',
    title: '',
    description: 'Lusso Auto, Cape Town. Special, performance and collector cars, bought, sold and sourced by appointment. Founded by Arno Cloete, formerly of Scuderia South Africa (Ferrari).',
    overlay: true,
    body,
    ogImage: heroImage.variants.at(-1).path,
    preload: { href: u(heroImage.variants.at(-1).path), srcset: heroImage.variants.map((v) => `${u(v.path)} ${v.width}w`).join(', '), sizes: '100vw' },
  };
}

// =====================================================================================================
// COLLECTION
// =====================================================================================================
export function collection(d) {
  const { available, business } = d;
  const opts = (values) => [...new Set(values.filter(Boolean))].sort().map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  const makes = opts(available.map((v) => v.make));
  const bodies = opts(available.map((v) => v.bodyType));
  const trans = opts(available.map((v) => v.transmission));
  const fuels = opts(available.map((v) => v.fuelType));
  const hasPoa = available.some((v) => v.priceOnApplication);

  const byPrice = [...available].sort((a, b) => (b.priceZAR ?? -1) - (a.priceZAR ?? -1));
  const cards = byPrice.map((v, i) => {
    const search = [v.year, v.make, v.model, v.variant, v.exteriorColour, v.bodyType].join(' ').toLowerCase();
    return `<div data-order="${i}" data-make="${esc(v.make)}" data-body="${esc(v.bodyType)}" data-transmission="${esc(v.transmission)}" data-fuel="${esc(v.fuelType)}" data-price="${v.priceZAR ?? ''}" data-poa="${v.priceOnApplication}" data-year="${v.year}" data-mileage="${v.mileageKm ?? ''}" data-search="${esc(search)}"${i >= 12 ? ' hidden' : ''}>${vehicleCard(v, { eager: i < 3, headingLevel: 2 })}</div>`;
  }).join('');

  const body = `
${intro({ title: 'The collection', lede: `${plural(available.length, 'car')} currently available. Every viewing is by appointment.` })}
<form class="toolbar" data-collection-form role="search" aria-label="Filter the collection">
  <div class="wrap">
    <div class="toolbar__row">
      <div class="search"><label class="visually-hidden" for="q">Search by make, model or variant</label>${icon('magnifying-glass')}<input class="input" id="q" name="q" type="search" placeholder="Search make, model, variant" autocomplete="off"></div>
      <label class="visually-hidden" for="sort">Sort</label>
      <select class="select" id="sort" name="sort">
        <option value="price-desc" selected>Price, high to low</option>
        <option value="price-asc">Price, low to high</option>
        <option value="mileage-asc">Mileage, lowest first</option>
        <option value="mileage-desc">Mileage, highest first</option>
        <option value="year-desc">Year, newest first</option>
        <option value="year-asc">Year, oldest first</option>
      </select>
      <button class="btn btn--quiet filter-toggle" type="button" data-filter-toggle aria-expanded="false" aria-controls="filters">${icon('sliders-horizontal')}<span>Filters</span></button>
      <p class="toolbar__count" data-count aria-live="polite">${plural(available.length, 'car')}</p>
    </div>
    <div class="filters" id="filters" hidden>
      <div class="field"><label for="f-make">Make</label><select class="select" id="f-make" name="make"><option value="">All makes</option>${makes}</select></div>
      <div class="field"><label for="f-body">Body</label><select class="select" id="f-body" name="body"><option value="">All bodies</option>${bodies}</select></div>
      <div class="field"><label for="f-price">Price</label><select class="select" id="f-price" name="price"><option value="">Any price</option><option value="lt-1m">Under R1 million</option><option value="1m-3m">R1 to R3 million</option><option value="3m-plus">Over R3 million</option>${hasPoa ? '<option value="poa">Price on application</option>' : ''}</select></div>
      <div class="field"><label for="f-year">Year</label><select class="select" id="f-year" name="year"><option value="">Any year</option><option value="pre-2010">Before 2010</option><option value="2010-2019">2010 to 2019</option><option value="2020-plus">2020 onwards</option></select></div>
      <div class="field"><label for="f-trans">Transmission</label><select class="select" id="f-trans" name="transmission"><option value="">Any</option>${trans}</select></div>
      <div class="field"><label for="f-fuel">Fuel</label><select class="select" id="f-fuel" name="fuel"><option value="">Any</option>${fuels}</select></div>
      <div class="filters__actions"><button class="btn btn--quiet" type="reset">Clear all</button></div>
    </div>
  </div>
</form>
<div class="wrap section--tight" style="padding-top:0">
  <div class="grid" data-collection>${cards}</div>
  <div class="empty" data-empty hidden>
    <p class="title">Nothing matches those filters.</p>
    <p class="muted">We may still be able to find it. Tell us what you are looking for and we will search our network.</p>
    <div class="btn-row"><button class="btn btn--quiet" type="button" data-clear>Clear filters</button><a class="btn btn--ghost" href="${u('source/')}">Source a car</a></div>
  </div>
  <div class="more" data-more${available.length > 12 ? '' : ' hidden'}><button class="btn btn--quiet" type="button">Show more</button></div>
</div>
<section class="section seam" aria-labelledby="c-sold">
  <div class="wrap contact-band">
    <div class="contact-band__text"><h2 class="title" id="c-sold">Looking for something that isn't here?</h2><p class="muted">See what has passed through our hands, or ask us to find one for you.</p></div>
    <div class="contact-band__actions"><a class="btn btn--quiet" href="${u('sold/')}"><span>The sold archive</span>${icon('arrow-right')}</a><a class="btn btn--quiet" href="${u('source/')}"><span>Source a car</span>${icon('arrow-right')}</a></div>
  </div>
</section>`;
  return {
    path: 'collection/', section: 'collection', title: 'The collection', scripts: ['collection'],
    description: `${plural(available.length, 'special car')} currently available from Lusso Auto in Cape Town, viewing by appointment.`,
    body,
    preload: available[0] && { href: u(available[0].images[0].variants.find((v) => v.width >= 800)?.path ?? available[0].images[0].src), srcset: available[0].images[0].variants.map((v) => `${u(v.path)} ${v.width}w`).join(', '), sizes: '(min-width: 1024px) 31vw, (min-width: 600px) 48vw, 100vw' },
  };
}

// =====================================================================================================
// VEHICLE DETAIL
// =====================================================================================================
export function vehicle(d, v) {
  const { business, team, similar } = d;
  const url = absolute(`collection/${v.slug}/`);
  const n = v.images.length;
  const specGroups = [
    ['Vehicle', [['Year', v.year], ['Mileage', km(v.mileageKm)], ['Body', v.bodyType], ['Exterior', v.exteriorColour], ['Interior', v.interiorColour]]],
    ['Drivetrain', [['Engine', v.engine], ['Power', v.powerKw && `${v.powerKw} kW`], ['Torque', v.torqueNm && `${v.torqueNm} Nm`], ['Transmission', v.transmissionDetail || v.transmission], ['Drive', v.drivetrain], ['Fuel', v.fuelType]]],
    ['History', [['Previous owners', v.owners ?? (v.ownersText && v.ownersText !== 'Unknown' ? v.ownersText : null)], ['Service history', v.serviceHistory], ['Warranty', v.warranty], ['Keys', v.keys], ['Books', v.books]]],
  ].map(([name, rows]) => [name, rows.filter(([, val]) => val !== null && val !== undefined && val !== '')]).filter(([, rows]) => rows.length);

  const galleryData = v.images.map((im) => ({ alt: im.alt, width: im.width, height: im.height, variants: im.variants.map((x) => ({ width: x.width, url: u(x.path) })) }));
  const thumbs = v.images.slice(1, 5);
  const message = `Hi Lusso, I'm interested in the ${v.title} (${url}). Could we arrange a viewing?`;
  const paragraphs = v.description.split('\n\n').filter(Boolean);

  const body = `
<div class="wrap" style="padding-top:20px">${breadcrumb([{ href: u('collection/'), label: 'Collection' }, { label: v.title }])}</div>
<div class="wrap vd-head">
  <div class="vd-gallery">
    <div class="gallery" data-gallery>
      <button class="gallery__lead" type="button" data-open="0" aria-label="Open photograph 1 of ${n} full screen"><div class="frame">${img(v.images[0], { sizes: '(min-width: 1024px) 64vw, 100vw', eager: true })}</div></button>
      <div class="gallery__thumbs">
        ${thumbs.map((im, i) => `<button class="gallery__thumb" type="button" data-open="${i + 1}" aria-label="${i === thumbs.length - 1 && n > 5 ? `View all ${n} photographs` : `Open photograph ${i + 2} of ${n}`}"><div class="frame">${img(im, { sizes: '(min-width: 1024px) 16vw, 25vw' })}</div>${i === thumbs.length - 1 && n > 5 ? `<span class="gallery__all">All ${n} photos</span>` : ''}</button>`).join('')}
      </div>
      <div class="gallery__track" aria-label="Photographs, swipe to browse">
        ${v.images.map((im, i) => `<button type="button" data-open="${i}" aria-label="Open photograph ${i + 1} of ${n} full screen"><div class="frame">${img(im, { sizes: '100vw', eager: i === 0 })}</div></button>`).join('')}
      </div>
      <span class="gallery__count" aria-hidden="true">1 / ${n}</span>
    </div>
  </div>
  <aside class="vd-summary" aria-labelledby="vd-title">
    <div>
      <h1 class="vd-title" id="vd-title">${esc(v.title)}</h1>
      ${v.exteriorColour ? `<p class="vd-variant">${esc(v.exteriorColour)}${v.bodyType ? `, ${esc(v.bodyType.toLowerCase())}` : ''}</p>` : ''}
    </div>
    <div class="vd-price">
      ${v.priceOnApplication ? '<span class="vd-price__poa">Price on application</span><span class="meta">Ask Arno, Fay or Riccardo for details.</span>' : `<span class="vd-price__value">${price(v)}</span>`}
    </div>
    <dl class="vd-keyfacts">
      <div><dt>Mileage</dt><dd>${km(v.mileageKm)}</dd></div>
      <div><dt>Year</dt><dd>${esc(v.year)}</dd></div>
      ${v.transmission ? `<div><dt>Transmission</dt><dd>${esc(v.transmission)}</dd></div>` : ''}
      ${v.exteriorColour ? `<div><dt>Colour</dt><dd>${esc(v.exteriorColour)}</dd></div>` : ''}
    </dl>
    ${enquiryActions(business, { message, bookHref: '#enquire' })}
    <p class="vd-note">Viewing strictly by appointment.${v.dealerServices?.financeViaBanks ? ' Finance available through all major banks.' : ''}${v.dealerServices?.tradeInsWelcome ? ' Selected trade-ins welcome.' : ''}</p>
  </aside>
</div>

<div class="wrap section vd-body">
  <div class="vd-main">
    ${specGroups.length ? `<section aria-labelledby="spec-title"><h2 class="title" id="spec-title" style="margin-bottom:24px">Specification</h2><div class="spec-groups">${specGroups.map(([name, rows]) => `<div class="spec-group"><h3>${name}</h3><dl>${rows.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl></div>`).join('')}</div></section>` : ''}
    ${paragraphs.length ? `<section aria-labelledby="desc-title"><h2 class="title" id="desc-title" style="margin-bottom:20px">About this car</h2><div class="prose">${paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}</div></section>` : ''}
    ${v.highlights.length ? `<section aria-labelledby="hl-title"><h2 class="title" id="hl-title" style="margin-bottom:20px">Highlights</h2><ul class="highlights">${v.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></section>` : ''}
    ${v.features.length ? `<details class="disclosure"><summary>Full specification list (${v.features.length})</summary><div><ul class="features-list">${v.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div></details>` : ''}
    <p class="source-note">Details as listed by Lusso Auto${v.listingLastUpdated ? `, last updated ${esc(v.listingLastUpdated)}` : ''}. Please confirm the specification with the team before purchase.</p>
  </div>
  <aside class="vd-aside" id="enquire" aria-labelledby="enquire-title">
    <h2 class="title" id="enquire-title" style="margin-bottom:8px">Talk to the team</h2>
    <p class="muted" style="margin-bottom:12px">Call or email directly.</p>
    ${teamList(team)}
    <div style="margin-top:40px">${viewingForm(business, { id: 'enquire', vehicle: { title: v.title, url }, heading: 'Book a viewing of this car' })}</div>
  </aside>
</div>

${similar.length ? `<section class="section seam" aria-labelledby="similar-title"><div class="wrap"><div class="section-head"><h2 class="title" id="similar-title">You may also like</h2><a class="arrow-link" href="${u('collection/')}">The collection ${icon('arrow-right')}</a></div><div class="grid" style="padding-top:0">${similar.map((s) => vehicleCard(s)).join('')}</div></div></section>` : ''}

<script type="application/json" id="gallery-data">${JSON.stringify(galleryData).replace(/</g, '\\u003c')}</script>`;

  const after = `
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Photographs of the ${esc(v.title)}" hidden>
  <div class="lightbox__bar"><span class="lightbox__count" data-lb-count aria-live="polite"></span><button class="icon-btn" type="button" data-lb-close aria-label="Close photographs">${icon('x')}</button></div>
  <div class="lightbox__stage">
    <img src="${u(v.images[0].variants[0].path)}" alt="" width="${v.images[0].width}" height="${v.images[0].height}" loading="lazy" decoding="async">
    <button class="icon-btn lightbox__nav lightbox__nav--prev" type="button" data-lb-prev aria-label="Previous photograph">${icon('caret-left')}</button>
    <button class="icon-btn lightbox__nav lightbox__nav--next" type="button" data-lb-next aria-label="Next photograph">${icon('caret-right')}</button>
  </div>
  <p class="lightbox__caption" data-lb-caption></p>
</div>
<nav class="enquiry-bar" aria-label="Enquire about this car">
  <a href="${telHref(business.phone.primary.e164)}">${icon('phone')}Call</a>
  <a href="${waHref(business.whatsapp.e164, message)}" target="_blank" rel="noopener">${icon('whatsapp-logo')}WhatsApp</a>
  <a href="#enquire">${icon('calendar-blank')}Book a viewing</a>
</nav>`;

  return {
    path: `collection/${v.slug}/`, section: 'collection', title: v.title, scripts: ['gallery', 'enquiry'],
    description: `${v.title}${v.exteriorColour ? ` in ${v.exteriorColour}` : ''}, ${km(v.mileageKm)}, ${price(v)}. Available from Lusso Auto, Cape Town. Viewing by appointment.`,
    body, after, ogImage: v.images[0].variants.at(-1).path,
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Car', name: v.title, brand: { '@type': 'Brand', name: v.make }, model: v.model,
      vehicleModelDate: String(v.year), mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.mileageKm, unitCode: 'KMT' }, color: v.exteriorColour || undefined,
      offers: v.priceOnApplication ? undefined : { '@type': 'Offer', price: v.priceZAR, priceCurrency: 'ZAR', availability: 'https://schema.org/InStock', seller: { '@type': 'AutoDealer', name: 'Lusso Auto' } },
    },
  };
}

// =====================================================================================================
// SOLD
// =====================================================================================================
export function sold(d) {
  const { soldFeatured, soldRegister } = d;
  const groups = {};
  for (const s of soldRegister) (groups[s.make || 'Other'] ??= []).push(s);
  const makes = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length || a.localeCompare(b));
  const body = `
${intro({ title: 'Sold by Lusso', lede: 'A selection of the cars that have passed through our hands since we opened in March 2024. None of these is for sale. If you are looking for something similar, we can help you find one.' })}
<div class="wrap section--tight" style="padding-top:8px">
  <div class="sold-grid">${soldFeatured.map((s, i) => `<div>${soldTile(s.vehicle, { title: s.title, sizes: i < 2 ? '(min-width: 1024px) 48vw, 100vw' : '(min-width: 1024px) 24vw, (min-width: 600px) 48vw, 100vw' })}</div>`).join('')}</div>
</div>
<section class="section seam" aria-labelledby="register-title">
  <div class="wrap">
    <details class="disclosure">
      <summary><h2 class="title" id="register-title" style="font-size:inherit">The full sold register (${soldRegister.length} cars)</h2></summary>
      <div>
        <p class="muted" style="margin-bottom:24px;max-width:64ch">Every car listed in Lusso's own sold portfolio, grouped by make. Titles are as Lusso recorded them.</p>
        <div class="register">${makes.map((m) => `<div class="register__group"><h3>${esc(m)} (${groups[m].length})</h3><ul>${groups[m].map((s) => `<li>${esc(s.title)}</li>`).join('')}</ul></div>`).join('')}</div>
      </div>
    </details>
  </div>
</section>
<section class="section--tight seam"><div class="wrap contact-band"><div class="contact-band__text"><h2 class="title">Want one of these?</h2><p class="muted">Tell us what you are looking for and we will look for it through our network.</p></div><div class="contact-band__actions"><a class="btn btn--primary" href="${u('source/')}"><span>Source a car</span>${icon('arrow-right')}</a></div></div></section>`;
  return { path: 'sold/', section: 'collection', title: 'Sold by Lusso', description: 'Cars sold by Lusso Auto in Cape Town, including Ferrari, Porsche, Lamborghini, Bentley and Mercedes-AMG.', body };
}

// =====================================================================================================
// SELL
// =====================================================================================================
function composeForm({ business, id, subject, fields, note }) {
  return `<form class="form" id="${id}" data-compose data-whatsapp="${business.whatsapp.e164.replace(/\D/g, '')}" data-email="${esc(business.email.general)}" data-subject="${esc(subject)}" novalidate>
  ${fields}
  <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label">Send it by</legend>
    <div class="btn-row"><label class="btn btn--quiet"><input type="radio" name="channel" value="whatsapp" checked> WhatsApp</label><label class="btn btn--quiet"><input type="radio" name="channel" value="email"> Email</label></div>
  </fieldset>
  <div class="form__submit"><button class="btn btn--primary" type="submit"><span>Send via WhatsApp</span>${icon('arrow-right')}</button></div>
  <p class="form__note">${note}</p>
</form>`;
}
const field = (id, label, { required, type = 'text', line, optional, placeholder, ac, textarea, inputmode } = {}) => `<div class="field"><label for="${id}">${label}${optional ? ' <span class="meta">(optional)</span>' : ''}</label>${textarea ? `<textarea class="textarea" id="${id}" data-line="${line ?? label}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}${required ? ` required aria-describedby="${id}-error"` : ''}></textarea>` : `<input class="input" id="${id}" type="${type}" data-line="${line ?? label}"${ac ? ` autocomplete="${ac}"` : ''}${inputmode ? ` inputmode="${inputmode}"` : ''}${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}${required ? ` required aria-describedby="${id}-error"` : ''}>`}${required ? `<p class="error" id="${id}-error" hidden>This is needed so we can reply.</p>` : ''}</div>`;
const NOTE = 'This proposal has no server: the button opens WhatsApp or your email app with your details filled in, and nothing is stored on this site.';

export function sell(d) {
  const { business, sellImage } = d;
  const body = `
${intro({ title: 'Sell your car', lede: 'Consign it with us, or sell it to us outright. Either way, the people you speak to are the people who will present your car.' })}
<div class="wrap section--tight" style="padding-top:0"><div class="frame frame--21x9">${img(sellImage.image, { sizes: '100vw', alt: sellImage.alt, eager: true })}</div></div>
<div class="wrap section split">
  <div class="split__main">
    <h2 class="title" style="margin-bottom:24px">Tell us about the car</h2>
    ${composeForm({ business, id: 'sell-form', subject: 'Selling my car', note: NOTE, fields: `
      <div class="form__row">${field('s-make', 'Make and model', { required: true, line: 'Car', placeholder: 'e.g. Porsche 911 GT3' })}${field('s-year', 'Year', { required: true, inputmode: 'numeric' })}</div>
      <div class="form__row">${field('s-km', 'Mileage (km)', { required: true, inputmode: 'numeric', line: 'Mileage' })}${field('s-history', 'Service history', { optional: true, placeholder: 'e.g. full franchise' })}</div>
      ${field('s-notes', 'Anything we should know', { optional: true, textarea: true, line: 'Notes', placeholder: 'Options, modifications, condition, what you would like to achieve' })}
      <div class="form__row">${field('s-name', 'Your name', { required: true, ac: 'name', line: 'Name' })}${field('s-phone', 'Phone', { required: true, type: 'tel', ac: 'tel', line: 'Phone' })}</div>` })}
  </div>
  <aside class="split__aside">
    <h2 class="title" style="margin-bottom:16px">How it works</h2>
    <ol class="steps">
      <li><h3>Consign or sell outright</h3><p>You can leave the car with us to sell on your behalf, or we can buy it from you directly.</p></li>
      <li><h3>Appraisal and paperwork</h3><p>We look at the car, agree the approach with you, and handle the paperwork.</p></li>
      <li><h3>Presentation</h3><p>Paint correction, detailing and protection film can be arranged, and the car is photographed and shown to our network of buyers.</p></li>
    </ol>
    <div style="margin-top:32px">${enquiryActions(business, { message: 'Hi Lusso, I would like to talk about selling my car.' })}</div>
  </aside>
</div>`;
  return { path: 'sell/', section: 'sell', title: 'Sell your car', scripts: ['enquiry'], description: 'Sell or consign your special car with Lusso Auto in Cape Town.', body };
}

// =====================================================================================================
// SOURCE
// =====================================================================================================
export function source(d) {
  const { business } = d;
  const body = `
${intro({ title: 'Tell us what you are looking for.', lede: 'Give us the model, the specification and the budget, and we will look for it through our network.' })}
<div class="wrap section split" style="padding-top:clamp(24px,3vw,40px)">
  <div class="split__main">
    ${composeForm({ business, id: 'source-form', subject: 'Sourcing request', note: NOTE, fields: `
      ${field('r-car', 'The car', { required: true, line: 'Car', placeholder: 'e.g. Ferrari 812 Superfast, or a manual 911' })}
      <div class="form__row">${field('r-years', 'Years', { optional: true, line: 'Years', placeholder: 'e.g. 2018 onwards' })}${field('r-budget', 'Budget', { optional: true, line: 'Budget', placeholder: 'e.g. up to R4 million' })}</div>
      ${field('r-spec', 'Must-haves and deal-breakers', { optional: true, textarea: true, line: 'Specification', placeholder: 'Colour, options, mileage, history' })}
      ${field('r-when', 'Timing', { optional: true, line: 'Timing', placeholder: 'e.g. within three months' })}
      <div class="form__row">${field('r-name', 'Your name', { required: true, ac: 'name', line: 'Name' })}${field('r-phone', 'Phone', { required: true, type: 'tel', ac: 'tel', line: 'Phone' })}</div>` })}
  </div>
  <aside class="split__aside">
    <div class="notice"><strong>What to expect.</strong> Sourcing depends on what is available in the market at the time. We will come back to you with what we find.</div>
    <div style="margin-top:32px">${enquiryActions(business, { message: 'Hi Lusso, I am looking for a car. Could you help me find one?' })}</div>
  </aside>
</div>`;
  return { path: 'source/', section: 'source', title: 'Source a car', scripts: ['enquiry'], description: 'Ask Lusso Auto to find a specific special car for you.', body };
}

// =====================================================================================================
// ABOUT
// =====================================================================================================
export function about(d) {
  const { business, team, testimonials, aboutImage, servicesImage, curation } = d;
  const q = curation.home.founderQuote;
  const principles = curation.about.principlesQuote;
  const review = testimonials.reviews.find((r) => r.use);
  const body = `
${intro({ title: 'About Lusso Auto', lede: 'A Cape Town showroom for special cars, founded in March 2024 by Arno Cloete.' })}
<div class="wrap about-hero"><div class="frame">${img(aboutImage.image, { sizes: '100vw', alt: aboutImage.alt, eager: true })}</div></div>

<section class="section" aria-labelledby="story-title">
  <div class="wrap split">
    <div class="split__main">
      <h2 class="display display--md" id="story-title" style="margin-bottom:28px">From Ferrari to a showroom of his own</h2>
      <div class="prose">
        <p>Arno Cloete started out training as a diamond cutter before moving into the motor trade. His first job in the industry was with Nissan. He spent three years with Opel and then moved to Mercedes-Benz, where his sales results led to an offer from Abu Dhabi to manage BMW dealerships. He spent five years there.</p>
        <p>In 2012 he joined Scuderia South Africa in Cape Town, the official Ferrari dealer, and stayed for almost twelve years, leaving as general manager in January 2024. Two months later, Lusso Auto opened.</p>
        <p>Lusso is small by design. The collection is chosen car by car, viewings are by appointment, and Arno puts his approach simply: “${esc(principles.text)}”</p>
      </div>
    </div>
    <aside class="split__aside">
      <ol class="timeline">
        <li><span class="when">Early career</span><span>Nissan, then three years with Opel</span></li>
        <li><span class="when">Mercedes-Benz</span><span>Sales</span></li>
        <li><span class="when">Five years</span><span>Managing BMW dealerships in Abu Dhabi</span></li>
        <li><span class="when num">2012 to 2024</span><span>Scuderia South Africa, Cape Town (Ferrari), latterly general manager</span></li>
        <li><span class="when">March 2024</span><span>Founded Lusso Auto</span></li>
      </ol>
      <p class="source-note" style="margin-top:16px">Source: <a href="https://www.cars.co.za/motoring-news/profile-lusso-auto-in-cape-town/268096/" rel="noopener" target="_blank">Profile: Lusso Auto in Cape Town</a>, Cars.co.za, 19 June 2024.</p>
    </aside>
  </div>
</section>

<section class="section section--surface" aria-labelledby="words-title">
  <div class="wrap">
    <h2 class="title" id="words-title" style="margin-bottom:32px">In their words</h2>
    <div class="quotes">
      <figure><blockquote>“${esc(q.text)}”</blockquote><figcaption>${esc(q.attribution)}</figcaption></figure>
      ${testimonials.messagesToArno.items.slice(0, 1).map((t) => `<figure><blockquote>“${esc(t)}”</blockquote><figcaption>A client's message to Arno on leaving Scuderia, published by Lusso Auto</figcaption></figure>`).join('')}
      ${review ? `<figure><blockquote>“${esc(review.text)}”</blockquote><figcaption>${esc(review.author)}, review on ${esc(review.platform)}, June 2026</figcaption></figure>` : ''}
    </div>
  </div>
</section>

<section class="section" aria-labelledby="team-title">
  <div class="wrap split">
    <div class="split__main">
      <h2 class="display display--md" id="team-title" style="margin-bottom:20px">The team</h2>
      <p class="lede">A small team. Call or email any of us directly.</p>
    </div>
    <div class="split__aside">${teamList(team)}</div>
  </div>
</section>

<section class="section seam" aria-labelledby="svc-title">
  <div class="wrap split">
    <div class="split__main">
      <h2 class="title" id="svc-title">What we do</h2>
      <div class="frame frame--4x3 svc-image">${img(servicesImage.image, { sizes: '(min-width: 1024px) 55vw, 100vw', alt: servicesImage.alt })}</div>
    </div>
    <div class="split__aside"><ul class="steps">${business.services.verified.filter((s) => s.id !== 'private-viewing').map((s) => `<li><h3>${esc(s.label)}</h3></li>`).join('')}</ul></div>
  </div>
</section>`;
  return { path: 'about/', section: 'about', title: 'About', description: 'Lusso Auto was founded in Cape Town in March 2024 by Arno Cloete, formerly general manager of Scuderia South Africa (Ferrari) in Cape Town.', body };
}

// =====================================================================================================
// CONTACT
// =====================================================================================================
export function contact(d) {
  const { business, team } = d;
  const b = business;
  const body = `
${intro({ title: 'Contact', lede: 'Viewing is strictly by appointment. The quickest way to reach us is WhatsApp.' })}
<div class="wrap section contact-grid" style="padding-top:clamp(24px,3vw,40px)">
  <div class="contact-grid__main">
    <div class="contact-lines">
      <a href="${waHref(b.whatsapp.e164, 'Hi Lusso, I would like to arrange a viewing.')}" target="_blank" rel="noopener"><span class="lbl">${icon('whatsapp-logo')}WhatsApp</span><span class="num">${esc(b.phone.primary.display)}</span></a>
      <a href="${telHref(b.phone.primary.e164)}"><span class="lbl">${icon('phone')}Call</span><span class="num">${esc(b.phone.primary.display)}</span></a>
      <a href="${mailHref(b.email.general)}"><span class="lbl">${icon('envelope-simple')}Email</span><span>${esc(b.email.general)}</span></a>
    </div>
    <div>
      <h2 class="title" style="margin-bottom:12px">Showroom</h2>
      <p class="muted">${esc(b.showroom.area)}<br>Milnerton, Cape Town</p>
      <p class="meta" style="margin-top:8px">By appointment only. We will send directions when you book.</p>
    </div>
    <div>
      <h2 class="title" style="margin-bottom:8px">The team</h2>
      ${teamList(team)}
    </div>
  </div>
  <div class="contact-grid__aside" id="book">
    ${viewingForm(b, { id: 'book' })}
  </div>
</div>`;
  return { path: 'contact/', section: 'contact', title: 'Contact', scripts: ['enquiry'], description: 'Contact Lusso Auto in Cape Town. Viewing strictly by appointment. WhatsApp, call or email Arno, Fay or Riccardo.', body };
}

// =====================================================================================================
// 404
// =====================================================================================================
export function notFound() {
  const body = `<div class="wrap nf"><h1 class="display">This page has moved on.</h1><p class="lede">It may have been a car that has since been sold. The current collection is always up to date.</p><div class="btn-row"><a class="btn btn--primary" href="${u('collection/')}"><span>The collection</span>${icon('arrow-right')}</a><a class="btn btn--quiet" href="${u()}">Home</a></div></div>`;
  return { path: '404.html', section: '', title: 'Page not found', description: 'Page not found.', body };
}
