// LOCAL TESTING ONLY (DIALOGFLOW_MOCK=1).
// Runs the exact same intents, responses, and contexts as the real agent
// (agent/fitcheck-agent.mjs) with a simple word-overlap matcher, so the whole
// site and every quiz path can be tested without Google credentials.
// Real Dialogflow's matching is smarter; the responses are identical.

import { INTENTS, payloadFor } from '../agent/fitcheck-agent.mjs';

const STOP = new Set('a an the i im i\'m me my is are am do does did to of for on in at it its this that what whats how can could would should will be with and or you your about tell please there any some much'.split(' '));
const norm = (s) => String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (s) => norm(s).split(' ').filter((t) => t && !STOP.has(t));

function score(query, phrase) {
  if (norm(query) === norm(phrase)) return 1;
  const q = tokens(query);
  const p = tokens(phrase);
  if (!q.length || !p.length) return 0;
  const ps = new Set(p);
  const inter = [...new Set(q)].filter((t) => ps.has(t)).length;
  return (2 * inter) / (new Set(q).size + ps.size);
}

const sessions = new Map();
const THRESHOLD = 0.55;

export function resetMockSessions() { sessions.clear(); }

export function mockDetectIntent(text, sessionId = 'local') {
  if (!sessions.has(sessionId)) sessions.set(sessionId, new Map());
  const contexts = sessions.get(sessionId);
  const active = new Set([...contexts].filter(([, n]) => n > 0).map(([k]) => k));
  const eligible = (i) => i.inputContexts.every((c) => active.has(c));

  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    if (intent.fallback || !eligible(intent)) continue;
    for (const p of intent.phrases) {
      // Intents that need a context win ties, like Dialogflow's context priority
      const s = score(text, p) + (intent.inputContexts.length ? 0.05 : 0);
      if (s > bestScore) { bestScore = s; best = intent; }
    }
  }

  let matched = best;
  let isFallback = false;
  if (!best || bestScore < THRESHOLD) {
    isFallback = true;
    matched = INTENTS
      .filter((i) => i.fallback && eligible(i))
      .sort((a, b) => b.inputContexts.length - a.inputContexts.length)[0];
  }

  // Contexts: every active context loses one turn, then the intent's output contexts apply
  for (const [k, n] of contexts) contexts.set(k, n - 1);
  for (const c of matched.outputContexts) contexts.set(c.name, c.lifespan);
  for (const [k, n] of contexts) if (n <= 0) contexts.delete(k);

  return {
    engine: 'Local simulator',
    intent: matched.name,
    page: null,
    confidence: isFallback ? 1 : Math.min(1, Number(bestScore.toFixed(2))),
    isFallback,
    matchType: isFallback ? 'FALLBACK' : 'INTENT',
    text: matched.messages.join('\n\n'),
    payload: payloadFor(matched),
    parameters: {},
  };
}
