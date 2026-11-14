// BACKUP to importing the ZIP: uploads every intent straight to Dialogflow ES
// through Google's API, then trains the agent.
//
//   npm run push:agent              (create/update intents)
//   npm run push:agent -- --replace (also delete intents that aren't in fitcheck-agent.mjs)
//
// Needs in .env: GOOGLE_CREDENTIALS, DIALOGFLOW_PROJECT_ID
// The service account needs the "Dialogflow API Admin" role for this script
// (the website itself only needs "Dialogflow API Client").

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';
import { AGENT, INTENTS, payloadFor } from './fitcheck-agent.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

let raw = (process.env.GOOGLE_CREDENTIALS || '').trim();
if (!raw) { console.error('GOOGLE_CREDENTIALS is not set (put it in .env).'); process.exit(1); }
if (!raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
const creds = JSON.parse(raw);
if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
const project = process.env.DIALOGFLOW_PROJECT_ID || creds.project_id;
const BASE = `https://dialogflow.googleapis.com/v2/projects/${project}/agent`;
const REPLACE = process.argv.includes('--replace');

const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const client = await auth.getClient();

async function api(method, url, body) {
  const { token } = await client.getAccessToken();
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

async function waitFor(op) {
  let cur = op;
  while (!cur.done) {
    await new Promise((r) => setTimeout(r, 2000));
    cur = await api('GET', `https://dialogflow.googleapis.com/v2/${op.name}`);
  }
  if (cur.error) throw new Error(JSON.stringify(cur.error));
  return cur;
}

// 1. Make sure the agent exists
try {
  await api('GET', BASE);
  console.log(`Agent found in project ${project}.`);
} catch {
  console.log(`No agent in ${project} yet - creating "${AGENT.displayName}"...`);
  await api('POST', BASE, {
    parent: `projects/${project}`,
    displayName: AGENT.displayName,
    defaultLanguageCode: 'en',
    timeZone: AGENT.timezone,
    description: AGENT.description,
  });
}

// 2. Existing intents (to update in place rather than duplicate)
const existing = new Map();
let pageToken = '';
do {
  const page = await api('GET', `${BASE}/intents?pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`);
  for (const it of page.intents || []) existing.set(it.displayName, it.name);
  pageToken = page.nextPageToken || '';
} while (pageToken);

const ctx = (name) => `projects/${project}/agent/sessions/-/contexts/${name}`;
const intents = INTENTS.map((i) => {
  const messages = i.messages.map((t) => ({ text: { text: [t] } }));
  const payload = payloadFor(i);
  if (payload) messages.push({ payload });
  return {
    ...(existing.has(i.name) ? { name: existing.get(i.name) } : {}),
    displayName: i.name,
    priority: 500000,
    isFallback: Boolean(i.fallback),
    action: i.action || undefined,
    events: i.events,
    inputContextNames: i.inputContexts.map(ctx),
    outputContexts: i.outputContexts.map((c) => ({ name: ctx(c.name), lifespanCount: c.lifespan })),
    trainingPhrases: i.phrases.map((p) => ({ type: 'EXAMPLE', parts: [{ text: p }] })),
    messages,
  };
});

console.log(`Uploading ${intents.length} intents...`);
await waitFor(await api('POST', `${BASE}/intents:batchUpdate`, { languageCode: 'en', intentBatchInline: { intents } }));

if (REPLACE) {
  const ours = new Set(INTENTS.map((i) => i.name));
  const extra = [...existing].filter(([display]) => !ours.has(display)).map(([, name]) => ({ name }));
  if (extra.length) {
    console.log(`Deleting ${extra.length} old intents...`);
    await waitFor(await api('POST', `${BASE}/intents:batchDelete`, { intents: extra }));
  }
}

console.log('Training...');
await waitFor(await api('POST', `${BASE}:train`, {}));
console.log('Done. Try it in the Dialogflow console simulator or on the website.');
