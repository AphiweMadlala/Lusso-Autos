// Collection page: search, filter, sort with URL state, progressive reveal.
// Cards are server-rendered; this script only reorders/hides them using data-* attributes.
const grid = document.querySelector('[data-collection]');
if (grid) {
  const cards = [...grid.children];
  const form = document.querySelector('[data-collection-form]');
  const count = document.querySelector('[data-count]');
  const empty = document.querySelector('[data-empty]');
  const moreWrap = document.querySelector('[data-more]');
  const moreBtn = moreWrap?.querySelector('button');
  const filterToggle = document.querySelector('[data-filter-toggle]');
  const filterPanel = document.getElementById('filters');
  const PAGE = 12;
  let shown = PAGE;

  const fields = ['q', 'make', 'body', 'transmission', 'fuel', 'price', 'year', 'sort'];
  const DEFAULT_SORT = 'price-desc';
  const read = () => Object.fromEntries(fields.map((f) => [f, form.elements[f]?.value ?? '']));

  // Restore state from the URL.
  const params = new URLSearchParams(location.search);
  for (const f of fields) if (params.has(f) && form.elements[f]) form.elements[f].value = params.get(f);
  if (fields.some((f) => f !== 'q' && f !== 'sort' && params.get(f))) {
    filterPanel.hidden = false;
    filterToggle.setAttribute('aria-expanded', 'true');
  }

  const priceBands = { 'lt-1m': [0, 999999], '1m-3m': [1000000, 2999999], '3m-plus': [3000000, Infinity] };
  const yearBands = { 'pre-2010': [0, 2009], '2010-2019': [2010, 2019], '2020-plus': [2020, 9999] };

  function matches(card, s) {
    const d = card.dataset;
    if (s.q) {
      const terms = s.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every((t) => d.search.includes(t))) return false;
    }
    if (s.make && d.make !== s.make) return false;
    if (s.body && d.body !== s.body) return false;
    if (s.transmission && d.transmission !== s.transmission) return false;
    if (s.fuel && d.fuel !== s.fuel) return false;
    if (s.price) {
      if (s.price === 'poa') { if (d.poa !== 'true') return false; }
      else {
        const [lo, hi] = priceBands[s.price];
        const p = Number(d.price);
        if (!p || p < lo || p > hi) return false;
      }
    }
    if (s.year) {
      const [lo, hi] = yearBands[s.year];
      const y = Number(d.year);
      if (y < lo || y > hi) return false;
    }
    return true;
  }

  // POA vehicles sort after priced ones in both price directions (no invented values).
  const sorters = {
    'price-asc': (a, b) => (Number(a.dataset.price) || Infinity) - (Number(b.dataset.price) || Infinity),
    'price-desc': (a, b) => (Number(b.dataset.price) || -1) - (Number(a.dataset.price) || -1),
    'mileage-asc': (a, b) => (a.dataset.mileage === '' ? Infinity : Number(a.dataset.mileage)) - (b.dataset.mileage === '' ? Infinity : Number(b.dataset.mileage)),
    'mileage-desc': (a, b) => (b.dataset.mileage === '' ? -1 : Number(b.dataset.mileage)) - (a.dataset.mileage === '' ? -1 : Number(a.dataset.mileage)),
    'year-desc': (a, b) => Number(b.dataset.year) - Number(a.dataset.year),
    'year-asc': (a, b) => Number(a.dataset.year) - Number(b.dataset.year),
  };

  function apply({ push = true } = {}) {
    const s = read();
    const visible = cards.filter((c) => matches(c, s)).sort(sorters[s.sort] ?? sorters[DEFAULT_SORT]);
    const hidden = cards.filter((c) => !visible.includes(c));
    visible.forEach((c, i) => { c.hidden = i >= shown; grid.appendChild(c); });
    hidden.forEach((c) => { c.hidden = true; });
    const n = visible.length;
    count.textContent = `${n} ${n === 1 ? 'car' : 'cars'}`;
    empty.hidden = n > 0;
    moreWrap.hidden = n <= shown;
    if (moreBtn) moreBtn.textContent = `Show ${Math.min(PAGE, n - shown)} more`;
    if (push) {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(s)) if (v && !(k === 'sort' && v === DEFAULT_SORT)) q.set(k, v);
      history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}`);
    }
  }

  form.addEventListener('input', (e) => { if (e.target.name === 'q') { shown = PAGE; apply(); } });
  form.addEventListener('change', () => { shown = PAGE; apply(); });
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('reset', () => setTimeout(() => { shown = PAGE; apply(); }));
  document.querySelectorAll('[data-clear]').forEach((b) => b.addEventListener('click', () => { form.reset(); }));
  moreBtn?.addEventListener('click', () => {
    const firstNew = cards.filter((c) => !c.hidden).length;
    shown += PAGE;
    apply({ push: false });
    grid.children[firstNew]?.querySelector('a')?.focus();
  });
  filterToggle.addEventListener('click', () => {
    const open = filterToggle.getAttribute('aria-expanded') !== 'true';
    filterToggle.setAttribute('aria-expanded', String(open));
    filterPanel.hidden = !open;
    if (open) filterPanel.querySelector('select')?.focus();
  });
  apply({ push: false });
}
