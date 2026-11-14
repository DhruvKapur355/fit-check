// Runs on YOUR PC. A tiny, password-protected door in front of Ollama so the
// Vercel site (and nobody else) can use your local model.
//
//   GATEWAY_TOKEN=some-long-random-string node pc-gateway/server.mjs
//
// Then expose port 8787 with a tunnel (Cloudflare Tunnel or Tailscale Funnel -
// see README) and set on Vercel:
//   LLM_CHAT_URL = https://<your-tunnel-host>/v1/chat/completions
//   LLM_API_KEY  = the same GATEWAY_TOKEN
//
// No npm install needed - uses only Node built-ins (Node 18+).

import http from 'node:http';
import crypto from 'node:crypto';

const TOKEN = process.env.GATEWAY_TOKEN || '';
const UPSTREAM = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const PORT = Number(process.env.PORT || 8787);
const ALLOWED_MODELS = (process.env.ALLOWED_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_BODY = 64 * 1024;

if (TOKEN.length < 16) {
  console.error('Set GATEWAY_TOKEN to a random string of at least 16 characters.');
  process.exit(1);
}

function authorized(req) {
  const got = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(TOKEN);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (path === '/health') return send(res, 200, { ok: true });
  if (!authorized(req)) return send(res, 401, { error: 'unauthorized' });

  try {
    if (req.method === 'GET' && path === '/v1/models') {
      const r = await fetch(`${UPSTREAM}/v1/models`, { signal: AbortSignal.timeout(5000) });
      return send(res, r.status, await r.json());
    }

    if (req.method === 'POST' && path === '/v1/chat/completions') {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > MAX_BODY) return send(res, 413, { error: 'request too large' });
      }
      const body = JSON.parse(raw || '{}');
      if (ALLOWED_MODELS.length && !ALLOWED_MODELS.includes(body.model)) {
        return send(res, 400, { error: `model not allowed: ${body.model}` });
      }
      body.stream = false;
      body.max_tokens = Math.min(Number(body.max_tokens) || 600, 800);
      const t0 = Date.now();
      const r = await fetch(`${UPSTREAM}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      const text = await r.text();
      console.log(`${new Date().toISOString()} ${body.model} ${r.status} ${Date.now() - t0}ms`);
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      return res.end(text);
    }

    return send(res, 404, { error: 'not found' });
  } catch (err) {
    console.error(err.message);
    return send(res, 502, { error: 'upstream error' });
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`LLM gateway on http://127.0.0.1:${PORT} -> ${UPSTREAM}`);
});
