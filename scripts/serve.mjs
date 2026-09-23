// Minimal static server for dist/, mounted at BASE_PATH so local URLs match GitHub Pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import config from '../config/site.config.mjs';

const root = new URL('../dist/', import.meta.url).pathname;
const base = config.BASE_PATH;
const port = Number(process.env.PORT ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (p === '/' && base !== '/') { res.writeHead(302, { location: base }); return res.end(); }
  if (!p.startsWith(base)) return notFound(res);
  p = normalize(join(root, p.slice(base.length)));
  if (!p.startsWith(root)) return notFound(res);
  try {
    if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { notFound(res); }
}).listen(port, () => console.log(`serving dist/ at http://localhost:${port}${base}`));

async function notFound(res) {
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
  res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
}
