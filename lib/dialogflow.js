// Step 1 of every reply: ask Dialogflow (the rule-based engine) what to say.
// Uses the Dialogflow REST API so it works for both ES (v2) and CX (v3)
// without the heavy gRPC client libraries.

import { GoogleAuth } from 'google-auth-library';
import { getConfig, PublicError } from './config.js';
import { mockDetectIntent } from './mock-dialogflow.js';

let clientPromise = null;

function parseCredentials(raw) {
  if (!raw) {
    throw new PublicError(500, 'The chatbot is not configured yet.', 'GOOGLE_CREDENTIALS is not set');
  }
  let text = raw.trim();
  if (!text.startsWith('{')) text = Buffer.from(text, 'base64').toString('utf8');
  let creds;
  try {
    creds = JSON.parse(text);
  } catch {
    throw new PublicError(500, 'The chatbot is not configured yet.', 'GOOGLE_CREDENTIALS is not valid JSON');
  }
  if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  return creds;
}

async function getToken(cfg) {
  if (!clientPromise) {
    const credentials = parseCredentials(cfg.credentials);
    const auth = new GoogleAuth({
      credentials,
      projectId: cfg.projectId || credentials.project_id,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    clientPromise = auth.getClient();
  }
  try {
    const client = await clientPromise;
    const { token } = await client.getAccessToken();
    return token;
  } catch (err) {
    clientPromise = null; // let the next request retry
    throw err;
  }
}

export function cleanSessionId(id) {
  const cleaned = String(id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 36);
  return cleaned || `anon-${Math.random().toString(36).slice(2, 12)}`;
}

function projectOf(cfg) {
  if (cfg.projectId) return cfg.projectId;
  try {
    return parseCredentials(cfg.credentials).project_id;
  } catch {
    return '';
  }
}

function buildRequest(cfg, text, sessionId) {
  const project = projectOf(cfg);
  if (!project) throw new PublicError(500, 'The chatbot is not configured yet.', 'DIALOGFLOW_PROJECT_ID is not set');
  const loc = cfg.location || 'global';
  const host = loc === 'global' ? 'dialogflow.googleapis.com' : `${loc}-dialogflow.googleapis.com`;

  if (cfg.agentType === 'cx') {
    if (!cfg.agentId) throw new PublicError(500, 'The chatbot is not configured yet.', 'DIALOGFLOW_AGENT_ID is required for CX');
    return {
      url: `https://${host}/v3/projects/${project}/locations/${loc}/agents/${cfg.agentId}/sessions/${sessionId}:detectIntent`,
      body: { queryInput: { text: { text }, languageCode: cfg.languageCode } },
    };
  }
  const base = loc === 'global'
    ? `https://${host}/v2/projects/${project}/agent`
    : `https://${host}/v2/projects/${project}/locations/${loc}/agent`;
  return {
    url: `${base}/sessions/${sessionId}:detectIntent`,
    body: { queryInput: { text: { text, languageCode: cfg.languageCode } } },
  };
}

// Turn ES or CX output into one shape the rest of the app understands.
export function normalize(agentType, data) {
  const qr = data?.queryResult || {};
  if (agentType === 'cx') {
    const msgs = qr.responseMessages || [];
    const texts = msgs.flatMap((m) => m.text?.text || []).filter(Boolean);
    const payload = Object.assign({}, ...msgs.filter((m) => m.payload).map((m) => m.payload));
    const match = qr.match || {};
    const matchType = match.matchType || 'MATCH_TYPE_UNSPECIFIED';
    return {
      engine: 'Dialogflow CX',
      intent: match.intent?.displayName || qr.intent?.displayName || null,
      page: qr.currentPage?.displayName || null,
      confidence: typeof match.confidence === 'number' ? match.confidence : null,
      isFallback: matchType === 'NO_MATCH' || matchType === 'NO_INPUT',
      matchType,
      text: texts.join('\n\n'),
      payload: Object.keys(payload).length ? payload : null,
      parameters: qr.parameters || {},
    };
  }
  const msgs = qr.fulfillmentMessages || [];
  const texts = msgs.flatMap((m) => m.text?.text || []).filter(Boolean);
  const payload = Object.assign({}, ...msgs.filter((m) => m.payload).map((m) => m.payload));
  return {
    engine: 'Dialogflow ES',
    intent: qr.intent?.displayName || null,
    page: null,
    confidence: typeof qr.intentDetectionConfidence === 'number' ? qr.intentDetectionConfidence : null,
    isFallback: Boolean(qr.intent?.isFallback) || !qr.intent,
    matchType: qr.intent?.isFallback ? 'FALLBACK' : qr.intent ? 'INTENT' : 'NO_MATCH',
    text: (texts.length ? texts : [qr.fulfillmentText]).filter(Boolean).join('\n\n'),
    payload: Object.keys(payload).length ? payload : null,
    parameters: qr.parameters || {},
  };
}

export async function detectIntent(text, rawSessionId) {
  const cfg = getConfig().dialogflow;
  const sessionId = cleanSessionId(rawSessionId);
  if (cfg.mock) return mockDetectIntent(text);

  const { url, body } = buildRequest(cfg, text, sessionId);
  let res;
  try {
    const token = await getToken(cfg);
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    if (err instanceof PublicError) throw err;
    throw new PublicError(502, "Couldn't reach Dialogflow. Try again in a moment.", err.message);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new PublicError(502, "Couldn't reach Dialogflow. Try again in a moment.", `Dialogflow ${res.status}: ${detail.slice(0, 400)}`);
  }
  return normalize(cfg.agentType, await res.json());
}

export function dialogflowStatus() {
  const cfg = getConfig().dialogflow;
  if (cfg.mock) return { configured: true, mode: 'mock' };
  return {
    configured: Boolean(cfg.credentials && (cfg.agentType !== 'cx' || cfg.agentId)),
    mode: cfg.agentType === 'cx' ? 'Dialogflow CX' : 'Dialogflow ES',
  };
}
