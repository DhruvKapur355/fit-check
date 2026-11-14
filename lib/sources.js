import SOURCE_MAP from '../data/sources.js';

const MAX_SOURCES = 4;
const MAX_EXCERPT = 900;

// Collect sources for the matched intent: Dialogflow custom payload first, then data/sources.js.
export function getSources(intent, payload, map = SOURCE_MAP) {
  const fromPayload = Array.isArray(payload?.sources) ? payload.sources : [];
  const fromMap = (intent && Array.isArray(map[intent])) ? map[intent] : [];
  const seen = new Set();
  const out = [];
  for (const s of [...fromPayload, ...fromMap]) {
    if (!s || typeof s !== 'object') continue;
    const key = s.url || s.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: out.length + 1,
      title: String(s.title || s.url).slice(0, 160),
      url: typeof s.url === 'string' && /^https?:\/\//.test(s.url) ? s.url : null,
      excerpt: String(s.excerpt || '').slice(0, MAX_EXCERPT),
    });
    if (out.length >= MAX_SOURCES) break;
  }
  return out;
}
