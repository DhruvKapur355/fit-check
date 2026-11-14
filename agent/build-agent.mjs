// Builds a Dialogflow ES agent export from agent/fitcheck-agent.mjs
//   npm run build:agent
// Output:
//   dialogflow-agent/                (readable JSON, same layout as a Dialogflow export)
//   FitCheck-Dialogflow-ES.zip       (import this in the Dialogflow ES console)
//   data/sources.js                  (sources per intent, for the website's verification step)

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { AGENT, INTENTS, SOURCE_MAP, payloadFor } from './fitcheck-agent.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'dialogflow-agent');
const MAX_TEXT = 600;

// Stable UUIDs so rebuilding doesn't churn every file
const uuid = (seed) => {
  const h = crypto.createHash('sha1').update(seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

function validate() {
  const names = new Set();
  for (const i of INTENTS) {
    if (names.has(i.name)) throw new Error(`Duplicate intent name: ${i.name}`);
    names.add(i.name);
    if (!i.fallback && !i.phrases.length && !i.events.length) throw new Error(`${i.name} has no training phrases`);
    for (const m of i.messages) {
      if (m.length > MAX_TEXT) throw new Error(`${i.name}: message is ${m.length} chars (max ${MAX_TEXT})`);
    }
    for (const c of [...i.inputContexts, ...i.outputContexts.map((o) => o.name)]) {
      if (!/^[a-z0-9_-]+$/.test(c)) throw new Error(`${i.name}: bad context name ${c}`);
    }
  }
}

function intentJson(i) {
  const messages = i.messages.map((text) => ({
    type: '0', title: '', textToSpeech: '', lang: 'en', speech: [text], condition: '',
  }));
  const payload = payloadFor(i);
  if (payload) messages.push({ type: '4', title: '', payload, textToSpeech: '', lang: 'en', condition: '' });
  return {
    id: uuid(`intent:${i.name}`),
    name: i.name,
    auto: true,
    contexts: i.inputContexts,
    responses: [{
      resetContexts: false,
      action: i.action || '',
      affectedContexts: i.outputContexts.map((c) => ({ name: c.name, lifespan: c.lifespan })),
      parameters: [],
      messages,
      speech: [],
    }],
    priority: 500000,
    webhookUsed: false,
    webhookForSlotFilling: false,
    fallbackIntent: Boolean(i.fallback),
    events: i.events.map((name) => ({ name })),
    conditionalResponses: [],
    condition: '',
    conditionalFollowupEvents: [],
  };
}

function usersaysJson(i) {
  return i.phrases.map((p) => ({
    id: uuid(`phrase:${i.name}:${p}`),
    data: [{ text: p, userDefined: false }],
    isTemplate: false,
    count: 0,
    lang: 'en',
    updated: 0,
  }));
}

const agentJson = {
  description: AGENT.description,
  language: 'en',
  shortDescription: '',
  examples: '',
  linkToDocs: '',
  displayName: AGENT.displayName,
  disableInteractionLogs: false,
  disableStackdriverLogs: true,
  defaultTimezone: AGENT.timezone,
  webhook: { url: '', username: '', headers: {}, available: false, useForDomains: false, cloudFunctionsEnabled: false, cloudFunctionsInitialized: false },
  isPrivate: true,
  mlMinConfidence: 0.3,
  supportedLanguages: [],
  enableOnePlatformApi: true,
  onePlatformApiVersion: 'v2',
  analyzeQueryTextSentiment: false,
  enabledKnowledgeBaseNames: [],
  knowledgeServiceConfidenceAdjustment: 0.0,
  dialogBuilderMode: false,
  baseActionPackagesUrl: '',
  enableSpellCorrection: false,
};

// ---- minimal ZIP writer (deflate), no dependencies
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const DOS_DATE = ((2026 - 1980) << 9) | (11 << 5) | 14;
function makeZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8');
    const comp = zlib.deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(DOS_DATE, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, comp);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(8, 10); central.writeUInt16LE(0, 12); central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(comp.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28); central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

// ---- build
validate();
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'intents'), { recursive: true });

const files = [
  { name: 'agent.json', data: agentJson },
  { name: 'package.json', data: { version: '1.0.0' } },
];
for (const i of INTENTS) {
  files.push({ name: `intents/${i.name}.json`, data: intentJson(i) });
  const says = usersaysJson(i);
  if (says.length) files.push({ name: `intents/${i.name}_usersays_en.json`, data: says });
}
const encoded = files.map((f) => ({ name: f.name, data: Buffer.from(JSON.stringify(f.data, null, 2), 'utf8') }));
for (const f of encoded) fs.writeFileSync(path.join(outDir, f.name), f.data);
fs.writeFileSync(path.join(root, 'FitCheck-Dialogflow-ES.zip'), makeZip(encoded));

fs.writeFileSync(
  path.join(root, 'data', 'sources.js'),
  `// GENERATED by agent/build-agent.mjs from agent/fitcheck-agent.mjs - edit sources there.\n` +
  `// Trusted sources per intent. The optional AI polish uses these to verify each answer.\n` +
  `export default ${JSON.stringify(SOURCE_MAP, null, 2)};\n`
);

const phrases = INTENTS.reduce((n, i) => n + i.phrases.length, 0);
console.log(`Built ${INTENTS.length} intents, ${phrases} training phrases -> FitCheck-Dialogflow-ES.zip`);
