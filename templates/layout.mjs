import config from '../config/site.config.mjs';
import { esc, u, absolute, icon, telHref, waHref, mailHref } from './helpers.mjs';

export const NAV = [
  { href: 'collection/', label: 'Collection', key: 'collection' },
  { href: 'sell/', label: 'Sell', key: 'sell' },
  { href: 'source/', label: 'Source', key: 'source' },
  { href: 'about/', label: 'About', key: 'about' },
  { href: 'contact/', label: 'Contact', key: 'contact' },
];

function header({ section, overlay, business }) {
  const links = NAV.map((n) => `<a class="nav__link" href="${u(n.href)}"${section === n.key ? ' aria-current="page"' : ''}>${n.label}</a>`).join('');
  const sheetLinks = NAV.map((n) => `<a href="${u(n.href)}"${section === n.key ? ' aria-current="page"' : ''}>${n.label}${icon('arrow-right')}</a>`).join('');
  return `
<header class="site-header${overlay ? ' site-header--overlay' : ''}">
  <div class="wrap">
    <a class="brand" href="${u()}" aria-label="Lusso Auto, home">
      <img src="${u('brand/la-mark-48.png')}" srcset="${u('brand/la-mark-48.png')} 1x, ${u('brand/la-mark-96.png')} 2x" width="59" height="24" alt="">
      <span class="brand__word">Lusso Auto</span>
    </a>
    <nav class="nav" aria-label="Main">${links}</nav>
    <div class="header-tools">
      <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to light theme">${icon('sun', 'i-moon')}${icon('moon', 'i-sun')}</button>
      <button class="menu-btn caps" type="button" data-menu-open aria-expanded="false" aria-controls="menu-sheet">Menu ${icon('list')}</button>
    </div>
  </div>
</header>
<div class="menu-sheet" id="menu-sheet" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true">
  <div class="menu-sheet__top">
    <a class="brand" href="${u()}" aria-label="Lusso Auto, home"><img src="${u('brand/la-mark-48.png')}" srcset="${u('brand/la-mark-48.png')} 1x, ${u('brand/la-mark-96.png')} 2x" width="59" height="24" alt=""></a>
    <button class="icon-btn" type="button" data-menu-close aria-label="Close menu">${icon('x')}</button>
  </div>
  <nav aria-label="Main">${sheetLinks}</nav>
  <div class="menu-sheet__contact">
    <a class="btn btn--primary" href="${waHref(business.whatsapp.e164, 'Hi Lusso, I would like to arrange a viewing.')}" target="_blank" rel="noopener">WhatsApp ${icon('whatsapp-logo')}</a>
    <a class="btn btn--quiet" href="${telHref(business.phone.primary.e164)}">Call ${icon('phone')}</a>
    <button class="btn btn--quiet" type="button" data-theme-toggle aria-pressed="false">Light / dark theme</button>
  </div>
</div>`;
}

function footer({ business, generatedAt }) {
  const b = business;
  return `
<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__grid">
      <div>
        <img src="${u('brand/la-mark-48.png')}" srcset="${u('brand/la-mark-48.png')} 1x, ${u('brand/la-mark-96.png')} 2x" width="59" height="24" alt="Lusso Auto">
        <p style="margin-top:16px;max-width:36ch">Special cars in Cape Town, bought, sold and sourced by people who care about them. Viewing by appointment.</p>
      </div>
      <div>
        <h2>Cars</h2>
        <ul><li><a href="${u('collection/')}">Collection</a></li><li><a href="${u('sold/')}">Sold archive</a></li><li><a href="${u('sell/')}">Sell your car</a></li><li><a href="${u('source/')}">Source a car</a></li></ul>
      </div>
      <div>
        <h2>Lusso</h2>
        <ul><li><a href="${u('about/')}">About</a></li><li><a href="${u('contact/')}">Contact</a></li><li><a href="${esc(b.social.instagram)}" rel="noopener" target="_blank">Instagram</a></li><li><a href="${esc(b.social.facebook)}" rel="noopener" target="_blank">Facebook</a></li></ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li><a href="${telHref(b.phone.primary.e164)}">${esc(b.phone.primary.display)}</a></li>
          <li><a href="${mailHref(b.email.general)}">${esc(b.email.general)}</a></li>
          <li>${esc(b.showroom.area)}, Milnerton</li>
        </ul>
      </div>
    </div>
    <div class="site-footer__base">
      <span>Lusso Auto, Cape Town</span>
      ${config.PROPOSAL_MODE ? `<span>Design proposal prepared for Lusso Auto. Not the official website. Vehicle details from Lusso's public listings, ${esc(generatedAt)}.</span>` : ''}
    </div>
  </div>
</footer>`;
}

/**
 * Full HTML document.
 * @param {object} o
 *  title, description, path (site-relative, e.g. 'collection/'), section (nav key), body,
 *  overlay (transparent header over a hero), preload (hero image {href, srcset, sizes}), scripts (module names), ogImage
 */
export function layout(o) {
  const { business } = o.data;
  const title = o.title ? `${o.title} | Lusso Auto` : 'Lusso Auto | Exclusive Collection, Cape Town';
  const scripts = ['site', ...(o.scripts ?? [])];
  return `<!doctype html>
<html lang="en-ZA" class="no-js" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(o.description)}">
${config.PROPOSAL_MODE ? '<meta name="robots" content="noindex, nofollow">\n' : `<link rel="canonical" href="${absolute(o.path)}">\n`}<meta name="theme-color" content="#0d0f11">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(o.description)}">
${o.ogImage ? `<meta property="og:image" content="${absolute(o.ogImage)}">\n` : ''}<link rel="icon" href="${u('brand/favicon-32.png')}" sizes="32x32">
<link rel="apple-touch-icon" href="${u('brand/apple-touch-icon.png')}">
<link rel="preload" href="${u('fonts/archivo-latin-standard-normal.woff2')}" as="font" type="font/woff2" crossorigin>
${o.preload ? `<link rel="preload" as="image" href="${o.preload.href}" imagesrcset="${o.preload.srcset}" imagesizes="${o.preload.sizes}" fetchpriority="high">\n` : ''}<link rel="stylesheet" href="${u('css/site.css')}?v=${o.data.buildId}">
<script>try{var t=localStorage.getItem('lusso-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
${scripts.map((s) => `<script type="module" src="${u(`js/${s}.js`)}"></script>`).join('\n')}
${o.jsonLd ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd)}</script>` : ''}
</head>
<body class="page-${esc(o.section ?? 'home')}">
<a class="skip-link" href="#main">Skip to content</a>
${header({ section: o.section, overlay: o.overlay, business })}
<main id="main" tabindex="-1">
${o.body}
</main>
${footer({ business, generatedAt: o.data.generatedAtLabel })}
${o.after ?? ''}
</body>
</html>`;
}
