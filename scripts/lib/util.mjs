import { readFile, writeFile } from 'node:fs/promises';

export const ROOT = new URL('../../', import.meta.url);
export const path = (p) => new URL(p, ROOT);
export const readJSON = async (p, fallback) => {
  try { return JSON.parse(await readFile(path(p), 'utf8')); } catch (e) { if (fallback !== undefined) return fallback; throw e; }
};
export const writeJSON = (p, data) => writeFile(path(p), JSON.stringify(data, null, 2) + '\n');

export const slugify = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// "R 1 299 000" → 1299000 ; "POA" → null
export const parseRand = (s) => {
  if (!s || /POA/i.test(s)) return null;
  const n = Number(String(s).replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};
// "119 750 km" → 119750
export const parseKm = (s) => {
  if (!s) return null;
  const n = Number(String(s).replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export const today = () => new Date().toISOString().slice(0, 10);
