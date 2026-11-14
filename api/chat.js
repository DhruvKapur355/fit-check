import { handleChat } from '../lib/pipeline.js';
import { getConfig } from '../lib/config.js';

// Simple per-instance rate limit so nobody can hammer your Dialogflow quota or your PC.
const hits = new Map();
function rateLimited(ip, perMinute) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > perMinute;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip, getConfig().limits.perMinutePerIp)) {
    return res.status(429).json({ error: 'Slow down a little - try again in a minute.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  try {
    const out = await handleChat({
      message: body.message,
      sessionId: body.sessionId,
      polish: body.polish !== false,
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(out);
  } catch (err) {
    console.error('[chat]', err.message);
    const showDetail = process.env.VERCEL_ENV !== 'production';
    return res.status(err.status || 500).json({
      error: err.publicMessage || 'Something went wrong.',
      ...(showDetail ? { detail: err.message } : {}),
    });
  }
}
