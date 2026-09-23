import { esc, u, img, price, km, icon, telHref, waHref, mailHref } from './helpers.mjs';

export const vehicleUrl = (v) => u(`collection/${v.slug}/`);

/** One short, verified distinguishing spec for a card (never invented). */
export function keySpec(v) {
  if (v.transmissionDetail && /manual/i.test(v.transmissionDetail)) return v.transmissionDetail.replace(/\s*transmission$/i, '');
  if (v.powerKw) return `${v.powerKw} kW`;
  if (v.transmission === 'Manual') return 'Manual';
  return v.fuelType === 'Hybrid' ? 'Hybrid' : '';
}

export function vehicleCard(v, { sizes = '(min-width: 1024px) 31vw, (min-width: 600px) 48vw, 100vw', eager = false, headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  const spec = keySpec(v);
  return `<article class="card">
  <div class="frame frame--4x3">${img(v.images[0], { sizes, eager, alt: `${v.title}${v.exteriorColour ? ` in ${v.exteriorColour}` : ''}` })}</div>
  <div class="card__body">
    <${h} class="card__title"><a href="${vehicleUrl(v)}">${esc(v.year)} ${esc(v.make)} ${esc(v.model)}</a></${h}>
    ${v.variant ? `<p class="card__variant">${esc(v.variant)}</p>` : ''}
    <p class="card__meta"><span class="price num">${price(v)}</span><span class="num">${km(v.mileageKm)}</span>${spec ? `<span>${esc(spec)}</span>` : ''}</p>
  </div>
</article>`;
}

export function soldTile(v, { sizes = '(min-width: 1024px) 24vw, (min-width: 600px) 48vw, 100vw', title } = {}) {
  return `<figure class="sold-tile" style="margin:0">
  <div class="frame frame--4x3">${img(v.images[0], { sizes, alt: `${title ?? v.title}, sold by Lusso Auto` })}</div>
  <figcaption><span class="sold-tile__title">${esc(title ?? v.title)}</span><br><span class="sold-tile__status">Sold</span></figcaption>
</figure>`;
}

/** Enquiry actions. Labels are fixed site-wide: WhatsApp, Call, Book a viewing. */
export function enquiryActions(business, { message, bookHref = u('contact/#book'), layout = 'stack' } = {}) {
  const wa = waHref(business.whatsapp.e164, message ?? 'Hi Lusso, I would like to arrange a viewing.');
  return `<div class="${layout === 'stack' ? 'vd-actions' : 'btn-row'}">
  <a class="btn btn--primary" href="${wa}" target="_blank" rel="noopener"><span>WhatsApp</span>${icon('whatsapp-logo')}</a>
  <a class="btn btn--quiet" href="${telHref(business.phone.primary.e164)}"><span>Call ${esc(business.phone.primary.display)}</span>${icon('phone')}</a>
  <a class="btn btn--quiet" href="${bookHref}"><span>Book a viewing</span>${icon('calendar-blank')}</a>
</div>`;
}

export function teamList(team) {
  return `<ul class="team-list">${team.members.map((m) => `
  <li class="team-person">
    <span class="team-person__name">${esc(m.displayName ?? m.name)}</span>
    <span class="team-person__role">${esc(m.role)}</span>
    <span class="team-person__links">
      <a href="${telHref(m.phone.e164)}">${icon('phone')}<span class="num">${esc(m.phone.display)}</span></a>
      <a href="${mailHref(m.email)}">${icon('envelope-simple')}<span>${esc(m.email)}</span></a>
    </span>
  </li>`).join('')}</ul>`;
}

export const breadcrumb = (items) => `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((it, i) => (i < items.length - 1 ? `<a href="${it.href}">${esc(it.label)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${esc(it.label)}</span>`)).join('')}</nav>`;

/** Viewing-request form. No backend: composes a WhatsApp message or an email (DESIGN.md §7 Forms). */
export function viewingForm(business, { id = 'book', vehicle = null, heading = 'Book a private viewing' } = {}) {
  const f = (name) => `${id}-${name}`;
  return `<form class="form" id="${id}-form" data-compose data-whatsapp="${business.whatsapp.e164.replace(/\D/g, '')}" data-email="${esc(business.email.general)}" data-subject="${esc(vehicle ? `Viewing request: ${vehicle.title}` : 'Viewing request')}" novalidate>
  <h3 class="title" id="${id}-title">${esc(heading)}</h3>
  ${vehicle ? `<input type="hidden" data-line="Car" value="${esc(`${vehicle.title} (${vehicle.url})`)}">` : `<div class="field"><label for="${f('car')}">Which car? <span class="meta">(optional)</span></label><input class="input" id="${f('car')}" data-line="Car" autocomplete="off"></div>`}
  <div class="form__row">
    <div class="field"><label for="${f('name')}">Your name</label><input class="input" id="${f('name')}" name="name" data-line="Name" autocomplete="name" required aria-describedby="${f('name')}-error"><p class="error" id="${f('name')}-error" hidden>Please add your name.</p></div>
    <div class="field"><label for="${f('phone')}">Phone</label><input class="input" id="${f('phone')}" name="phone" type="tel" data-line="Phone" autocomplete="tel" inputmode="tel" required aria-describedby="${f('phone')}-error"><p class="error" id="${f('phone')}-error" hidden>Please add a number we can reach you on.</p></div>
  </div>
  <div class="field"><label for="${f('when')}">When suits you? <span class="meta">(optional)</span></label><input class="input" id="${f('when')}" data-line="Preferred time" placeholder="e.g. Saturday morning"></div>
  <div class="field"><label for="${f('msg')}">Anything we should know? <span class="meta">(optional)</span></label><textarea class="textarea" id="${f('msg')}" data-line="Message"></textarea></div>
  <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label">Send it by</legend>
    <div class="btn-row"><label class="btn btn--quiet"><input type="radio" name="channel" value="whatsapp" checked> WhatsApp</label><label class="btn btn--quiet"><input type="radio" name="channel" value="email"> Email</label></div>
  </fieldset>
  <div class="form__submit"><button class="btn btn--primary" type="submit"><span>Send via WhatsApp</span>${icon('arrow-right')}</button></div>
  <p class="form__note">This proposal has no server: the button opens WhatsApp or your email app with the details filled in, and nothing is stored on this site.</p>
</form>`;
}
