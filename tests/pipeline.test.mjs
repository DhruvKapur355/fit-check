import test from 'node:test';
import assert from 'node:assert/strict';
import { handleChat } from '../lib/pipeline.js';
import { checkPolished } from '../lib/guard.js';
import { normalize } from '../lib/dialogflow.js';
import { parseLLMJson } from '../lib/llm.js';
import { getSources } from '../lib/sources.js';
import { getConfig } from '../lib/config.js';

const guard = getConfig().guard;
const SRC = [{ id: 1, title: 'Home charging', url: 'https://example.com/a', excerpt: 'Level 2 charging uses a 240-volt circuit and is faster than Level 1.' }];

const df = (over = {}) => ({
  engine: 'test', intent: 'charging.home', page: null, confidence: 0.9, isFallback: false,
  matchType: 'INTENT', text: 'Most owners charge at home. Do you have a garage?', payload: null, parameters: {}, ...over,
});
const llmReturning = (obj) => async () => JSON.stringify(obj);
const deps = (over = {}) => ({
  detectIntent: async () => df(),
  getSources: () => SRC,
  llmConfigured: () => true,
  callLLM: llmReturning({ polished: 'Most owners charge at home, and a Level 2 setup on a 240-volt circuit is faster [1]. Do you have a garage?', verdict: 'supported', claims: [], notes: '' }),
  ...over,
});

test('applies a grounded polish', async () => {
  const r = await handleChat({ message: 'how do I charge', sessionId: 's' }, deps());
  assert.equal(r.polish.status, 'applied');
  assert.match(r.answer, /240-volt/);
  assert.equal(r.ruleBased.text, 'Most owners charge at home. Do you have a garage?');
});

test('fallback intents never reach the LLM', async () => {
  let called = false;
  const r = await handleChat({ message: 'what is the meaning of life', sessionId: 's' }, deps({
    detectIntent: async () => df({ isFallback: true, intent: 'Default Fallback Intent', text: "Sorry, I didn't get that." }),
    callLLM: async () => { called = true; return '{}'; },
  }));
  assert.equal(called, false);
  assert.equal(r.polish.status, 'skipped');
  assert.equal(r.answer, "Sorry, I didn't get that.");
});

test('polish off returns raw Dialogflow text', async () => {
  const r = await handleChat({ message: 'x', sessionId: 's', polish: false }, deps());
  assert.equal(r.polish.status, 'off');
  assert.equal(r.answer, df().text);
});

test('payload polish:false is respected', async () => {
  const r = await handleChat({ message: 'x', sessionId: 's' }, deps({ detectIntent: async () => df({ payload: { polish: false } }) }));
  assert.equal(r.polish.status, 'skipped');
});

test('invented numbers are rejected', async () => {
  const r = await handleChat({ message: 'x', sessionId: 's' }, deps({
    callLLM: llmReturning({ polished: 'A home charger costs about $1,200. Do you have a garage?', verdict: 'supported', claims: [] }),
  }));
  assert.equal(r.polish.status, 'rejected');
  assert.equal(r.answer, df().text);
  assert.match(r.polish.reason, /1200/);
});

test('invented product names are rejected', async () => {
  const r = await handleChat({ message: 'x', sessionId: 's' }, deps({
    callLLM: llmReturning({ polished: 'Most owners charge at home, and Superchargers help on trips. Do you have a garage?', verdict: 'supported', claims: [] }),
  }));
  assert.equal(r.polish.status, 'rejected');
});

test('dropping the follow-up question is rejected', async () => {
  const r = await handleChat({ message: 'x', sessionId: 's' }, deps({
    callLLM: llmReturning({ polished: 'Most owners charge at home.', verdict: 'supported', claims: [] }),
  }));
  assert.equal(r.polish.status, 'rejected');
});

test('LLM offline falls back to Dialogflow', async () => {
  const r = await handleChat({ message: 'x', sessionId: 's' }, deps({ callLLM: async () => { throw new Error('ECONNREFUSED'); } }));
  assert.equal(r.polish.status, 'unavailable');
  assert.equal(r.answer, df().text);
});

test('bad citation numbers are rejected', () => {
  const c = checkPolished({ polished: 'Faster at home [3]. Do you have a garage?', ruleText: df().text, userMessage: 'x', sources: SRC, guard });
  assert.equal(c.ok, false);
});

test('parses JSON wrapped in prose / think tags', () => {
  const p = parseLLMJson('<think>hmm</think>Sure! {"polished":"Hi?","verdict":"supported","claims":[]}');
  assert.equal(p.polished, 'Hi?');
});

test('normalizes ES and CX responses', () => {
  const es = normalize('es', { queryResult: { fulfillmentMessages: [{ text: { text: ['Hello'] } }, { payload: { sources: [] } }], intent: { displayName: 'Welcome', isFallback: false }, intentDetectionConfidence: 1 } });
  assert.equal(es.text, 'Hello'); assert.equal(es.intent, 'Welcome'); assert.equal(es.isFallback, false);
  const cx = normalize('cx', { queryResult: { responseMessages: [{ text: { text: ['Hi', 'there'] } }], match: { matchType: 'NO_MATCH', confidence: 0.2 } } });
  assert.equal(cx.isFallback, true); assert.equal(cx.text, 'Hi\n\nthere');
});

test('sources merge payload + map without duplicates', () => {
  const s = getSources('i', { sources: [{ title: 'A', url: 'https://a.com', excerpt: 'x' }] }, { i: [{ title: 'A', url: 'https://a.com' }, { title: 'B', url: 'https://b.com' }] });
  assert.deepEqual(s.map((x) => x.id), [1, 2]);
});
