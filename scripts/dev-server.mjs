// Local preview without the Vercel CLI:  npm run dev   (or  npm run dev:mock)
// Serves public/ and runs the same api/ handlers Vercel runs.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env loader
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const PORT = Number(process.env.PORT || 3000);

function shim(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
  return res;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, '');
    const file = path.join(root, 'api', `${name}.js`);
    if (!fs.existsSync(file)) return shim(res).status(404).json({ error: 'Not found' });
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
    const { default: handler } = await import(file);
    return handler(req, shim(res));
  }
  let p = path.normalize(path.join(root, 'public', url.pathname === '/' ? 'index.html' : url.pathname));
  if (!p.startsWith(path.join(root, 'public')) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.statusCode = 404; return res.end('Not found');
  }
  res.setHeader('Content-Type', TYPES[path.extname(p)] || 'application/octet-stream');
  fs.createReadStream(p).pipe(res);
}).listen(PORT, () => {
  console.log(`Fit Check running at http://localhost:${PORT}`);
  if (process.env.DIALOGFLOW_MOCK === '1') console.log('  (mock Dialogflow - for local testing only)');
});
