// Step 2 (optional): send the Dialogflow answer + trusted source excerpts to the
// LLM running on your own PC. It verifies the claims and rewrites the wording.
// It never decides WHAT to say - Dialogflow already did that.

import { getConfig } from './config.js';

export function buildMessages({ bot, userMessage, df, sources }) {
  const system = `You rewrite replies for "${bot.name}", a rule-based Dialogflow chatbot ${bot.domain}.
Rewrite the RULE-BASED ANSWER so it sounds friendly and clear to a college student.
Keep every fact, number, recommendation and question. Add nothing that is not in the answer or the sources. If you use a source, cite it like [1].
Then check the answer's claims against the sources.
Reply with JSON only:
{"polished": "...", "verdict": "supported" | "partially_supported" | "unsupported" | "no_sources", "claims": [{"claim": "...", "status": "supported" | "unsupported" | "not_checkable", "source": 1}], "notes": "one short sentence"}`;

  const sourceBlock = sources.length
    ? sources.map((s) => `[${s.id}] ${s.title}${s.url ? ` - ${s.url}` : ''}\n${s.excerpt || '(no excerpt provided)'}`).join('\n\n')
    : '(none)';

  const user = `USER MESSAGE: ${userMessage}
MATCHED INTENT: ${df.intent || 'unknown'}
RULE-BASED ANSWER (authoritative): ${df.text}

SOURCE EXCERPTS:
${sourceBlock}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export function parseLLMJson(content) {
  const text = String(content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    if (typeof obj.polished !== 'string') return null;
    const verdicts = ['supported', 'partially_supported', 'unsupported', 'no_sources'];
    return {
      polished: obj.polished.trim(),
      verdict: verdicts.includes(obj.verdict) ? obj.verdict : 'unknown',
      claims: Array.isArray(obj.claims)
        ? obj.claims.slice(0, 8).map((c) => ({
            claim: String(c?.claim || '').slice(0, 300),
            status: ['supported', 'unsupported', 'not_checkable'].includes(c?.status) ? c.status : 'not_checkable',
            source: Number.isInteger(c?.source) ? c.source : null,
          }))
        : [],
      notes: typeof obj.notes === 'string' ? obj.notes.slice(0, 300) : '',
    };
  } catch {
    return null;
  }
}

async function post(cfg, body) {
  return fetch(cfg.chatUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  });
}

export async function callLLM(messages) {
  const cfg = getConfig().llm;
  const body = {
    model: cfg.model,
    messages,
    temperature: 0.2,
    max_tokens: 600,
    stream: false,
    response_format: { type: 'json_object' },
  };
  let res = await post(cfg, body);
  if (res.status === 400 || res.status === 422) {
    // Some servers don't accept response_format - retry without it.
    delete body.response_format;
    res = await post(cfg, body);
  }
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

export function llmConfigured() {
  return Boolean(getConfig().llm.chatUrl);
}

let healthCache = { at: 0, value: null };

export async function llmHealth() {
  const cfg = getConfig().llm;
  if (!cfg.chatUrl) return { configured: false, online: false };
  if (Date.now() - healthCache.at < 30000 && healthCache.value) return healthCache.value;
  const modelsUrl = cfg.chatUrl.replace(/\/chat\/completions\/?$/, '/models');
  const t0 = Date.now();
  let value;
  try {
    const res = await fetch(modelsUrl, {
      headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
      signal: AbortSignal.timeout(4000),
    });
    value = { configured: true, online: res.ok, model: cfg.model, ms: Date.now() - t0 };
  } catch {
    value = { configured: true, online: false, model: cfg.model };
  }
  healthCache = { at: Date.now(), value };
  return value;
}
