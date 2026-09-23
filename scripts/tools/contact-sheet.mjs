// Renders labelled contact sheets of manifest assets for visual verification.
// usage: node scripts/tools/contact-sheet.mjs <group> <outDir> [perSheet] [heroes | vehicle-id prefix | slug fragment]
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { path, readJSON } from '../lib/util.mjs';
const [group, outDir, per = 24, only] = process.argv.slice(2);
const { assets } = await readJSON('data/media-manifest.json');
const { vehicles } = await readJSON('data/vehicles.json');
const title = (id) => vehicles.find((v) => v.id === id)?.title ?? '';
const list = assets.filter((a) => a.group === group && !a.excluded && (only === 'heroes' ? a.order === 1 : !only || a.vehicleId?.startsWith(only) || a.id.includes(only)));
const W = 300, H = 200, L = 34, COLS = 6;
const esc = (s) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]);
await mkdir(outDir, { recursive: true });
for (let s = 0; s * per < list.length; s++) {
  const chunk = list.slice(s * per, (s + 1) * per);
  const rows = Math.ceil(chunk.length / COLS);
  const tiles = await Promise.all(chunk.map(async (a, i) => {
    const img = await sharp(path(a.localOriginal).pathname).resize(W, H, { fit: 'cover' }).toBuffer();
    const label = Buffer.from(`<svg width="${W}" height="${L}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="14" font-size="12" fill="#fff" font-family="sans-serif">${esc(`${s * per + i + 1}. ${title(a.vehicleId) || a.id}`).slice(0, 48)}</text><text x="4" y="29" font-size="10" fill="#9cf" font-family="sans-serif">${esc(a.id)} ${a.width}×${a.height}</text></svg>`);
    return [{ input: img, left: (i % COLS) * W, top: Math.floor(i / COLS) * (H + L) }, { input: label, left: (i % COLS) * W, top: Math.floor(i / COLS) * (H + L) + H }];
  }));
  await sharp({ create: { width: COLS * W, height: rows * (H + L), channels: 3, background: '#222' } }).composite(tiles.flat()).jpeg({ quality: 80 }).toFile(`${outDir}/${group}-${s + 1}.jpg`);
}
console.log(`${list.length} assets → ${Math.ceil(list.length / per)} sheets in ${outDir}`);
