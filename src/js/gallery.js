// Vehicle gallery: mobile swipe counter + accessible fullscreen lightbox.
import { trapFocus } from './site.js';

const gallery = document.querySelector('[data-gallery]');
const data = document.getElementById('gallery-data');
const lb = document.getElementById('lightbox');

if (gallery && data && lb) {
  const images = JSON.parse(data.textContent);
  const img = lb.querySelector('img');
  const counter = lb.querySelector('[data-lb-count]');
  const caption = lb.querySelector('[data-lb-caption]');
  let index = 0;
  let opener = null;
  let release = null;

  const srcset = (im) => im.variants.map((v) => `${v.url} ${v.width}w`).join(', ');
  function show(i) {
    index = (i + images.length) % images.length;
    const im = images[index];
    img.classList.add('is-loading');
    img.onload = () => img.classList.remove('is-loading');
    img.srcset = srcset(im);
    img.sizes = '100vw';
    img.src = im.variants.at(-1).url;
    img.alt = im.alt;
    img.width = im.width;
    img.height = im.height;
    counter.textContent = `${index + 1} / ${images.length}`;
    caption.textContent = im.alt;
    // Warm the neighbours so next/prev is instant.
    for (const n of [index + 1, index - 1]) { const p = images[(n + images.length) % images.length]; const pre = new Image(); pre.sizes = '100vw'; pre.srcset = srcset(p); }
  }
  function open(i, from) {
    opener = from ?? document.activeElement;
    show(i);
    lb.hidden = false;
    lb.inert = false;
    void lb.offsetWidth; // commit the un-hidden state so the opacity transition runs
    lb.classList.add('is-open'); // visible now, so focus() below can land inside the dialog
    document.body.classList.add('is-locked');
    release = trapFocus(lb, close);
    lb.querySelector('[data-lb-close]').focus();
  }
  function close() {
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    release?.();
    lb.inert = true;
    setTimeout(() => { lb.hidden = true; }, 200);
    opener?.focus();
  }

  gallery.querySelectorAll('[data-open]').forEach((btn) => btn.addEventListener('click', () => open(Number(btn.dataset.open), btn)));
  lb.querySelector('[data-lb-close]').addEventListener('click', close);
  lb.querySelector('[data-lb-prev]').addEventListener('click', () => show(index - 1));
  lb.querySelector('[data-lb-next]').addEventListener('click', () => show(index + 1));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
  });
  // Close when the backdrop (not the image or controls) is clicked.
  lb.querySelector('.lightbox__stage').addEventListener('click', (e) => { if (e.target === e.currentTarget) close(); });

  // Swipe.
  let x0 = null, y0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });

  // Mobile carousel counter.
  const track = gallery.querySelector('.gallery__track');
  const count = gallery.querySelector('.gallery__count');
  if (track && count && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) count.textContent = `${Number(e.target.dataset.open) + 1} / ${images.length}`;
    }, { root: track, threshold: 0.6 });
    track.querySelectorAll('[data-open]').forEach((el) => io.observe(el));
  }
  lb.inert = true;
}
