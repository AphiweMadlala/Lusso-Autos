// Global behaviour: mobile menu, theme toggle, header state over the hero, reveal-on-enter.
const root = document.documentElement;
root.classList.remove('no-js');

// ---------------------------------------------------------------- focus trap helper (shared)
export function trapFocus(container, onEscape) {
  const selector = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); onEscape(); return; }
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll(selector)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}

// ---------------------------------------------------------------- menu sheet
const menuBtn = document.querySelector('[data-menu-open]');
const sheet = document.getElementById('menu-sheet');
if (menuBtn && sheet) {
  let release = null;
  const close = () => {
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    sheet.inert = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    release?.();
    menuBtn.focus();
  };
  const open = () => {
    sheet.inert = false;
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    release = trapFocus(sheet, close);
    sheet.querySelector('[data-menu-close]').focus();
  };
  sheet.inert = true;
  menuBtn.addEventListener('click', open);
  sheet.querySelector('[data-menu-close]').addEventListener('click', close);
  sheet.querySelectorAll('nav a').forEach((a) => a.addEventListener('click', () => { document.body.classList.remove('is-locked'); }));
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches && sheet.classList.contains('is-open')) close(); });
}

// ---------------------------------------------------------------- theme toggle (preference is a per-viewer convenience)
document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
  const sync = () => {
    const light = root.dataset.theme === 'light';
    btn.setAttribute('aria-pressed', String(light));
    if (btn.classList.contains('icon-btn')) btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  };
  sync();
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('lusso-theme', next); } catch {}
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.dispatchEvent(new Event('theme:sync')));
    sync();
  });
  btn.addEventListener('theme:sync', sync);
});

// ---------------------------------------------------------------- header over hero
const header = document.querySelector('.site-header--overlay');
const heroSentinel = document.querySelector('[data-hero-end]');
if (header && heroSentinel && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => header.classList.toggle('is-solid', !entry.isIntersecting), { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` }).observe(heroSentinel);
}

// ---------------------------------------------------------------- reveal on enter
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealables = document.querySelectorAll('.reveal, .reveal-img');
if (reduce || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  revealables.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------- horizontal strip controls (desktop)
for (const btn of document.querySelectorAll('[data-strip]')) {
  const strip = document.getElementById(btn.getAttribute('aria-controls'));
  if (!strip) continue;
  const sync = () => {
    const max = strip.scrollWidth - strip.clientWidth - 2;
    document.querySelectorAll(`[aria-controls="${strip.id}"]`).forEach((b) => { b.disabled = b.dataset.strip === 'prev' ? strip.scrollLeft <= 2 : strip.scrollLeft >= max; });
  };
  btn.addEventListener('click', () => {
    const step = strip.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap || 0);
    strip.scrollBy({ left: (btn.dataset.strip === 'prev' ? -1 : 1) * step * 2, behavior: reduce ? 'auto' : 'smooth' });
  });
  strip.addEventListener('scroll', sync, { passive: true });
  sync();
}
