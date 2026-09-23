// Enquiry forms. There is no backend in this proposal: forms compose a WhatsApp
// message or an email in the visitor's own app, and say so on the button.
const forms = document.querySelectorAll('form[data-compose]');
for (const form of forms) {
  const channel = () => form.querySelector('[name="channel"]:checked')?.value ?? 'whatsapp';
  const submit = form.querySelector('[type="submit"]');
  const syncLabel = () => { if (submit) submit.querySelector('span').textContent = channel() === 'email' ? 'Compose email' : 'Send via WhatsApp'; };
  form.addEventListener('change', syncLabel);
  syncLabel();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstInvalid = null;
    for (const el of form.querySelectorAll('[required]')) {
      const err = form.querySelector(`#${el.id}-error`);
      const ok = el.value.trim() !== '' && el.checkValidity();
      el.setAttribute('aria-invalid', String(!ok));
      if (err) err.hidden = ok;
      if (!ok && !firstInvalid) firstInvalid = el;
    }
    if (firstInvalid) { firstInvalid.focus(); return; }

    const lines = [form.dataset.subject];
    for (const el of form.querySelectorAll('[data-line]')) {
      const v = el.value.trim();
      if (v) lines.push(`${el.dataset.line}: ${v}`);
    }
    const text = lines.join('\n');
    const url = channel() === 'email'
      ? `mailto:${form.dataset.email}?subject=${encodeURIComponent(form.dataset.subject)}&body=${encodeURIComponent(text)}`
      : `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, channel() === 'email' ? '_self' : '_blank', 'noopener');
  });
}

// Mobile vehicle enquiry bar: hide while the in-page enquiry section is on screen.
const bar = document.querySelector('.enquiry-bar');
const target = document.getElementById('enquire');
if (bar && target && 'IntersectionObserver' in window) {
  document.body.classList.add('has-enquiry-bar');
  new IntersectionObserver(([e]) => bar.classList.toggle('is-hidden', e.isIntersecting), { threshold: 0.15 }).observe(target);
}
