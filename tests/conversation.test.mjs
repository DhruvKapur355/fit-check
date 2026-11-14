// Walks real conversations through the agent definition (same intents/contexts as Dialogflow).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { mockDetectIntent, resetMockSessions } from '../lib/mock-dialogflow.js';
import { INTENTS } from '../agent/fitcheck-agent.mjs';

let n = 0;
const session = () => `t${++n}`;
const say = (s, text) => mockDetectIntent(text, s);

test('every FAQ / menu button lands on a real intent from a fresh chat', () => {
  const quizChips = new Set(['I can charge at home', 'Only campus or public chargers', 'Under $35,000, used is fine', '$35,000 or more, new', 'Mostly around campus', 'Long trips home']);
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(new URL('../public/config.js', import.meta.url), 'utf8'), sandbox);
  const chips = new Set([...sandbox.window.FIT_CHECK.suggestions, ...INTENTS.flatMap((i) => i.suggestions)]);
  for (const chip of chips) {
    if (quizChips.has(chip)) continue;
    const r = say(session(), chip);
    assert.equal(r.isFallback, false, `"${chip}" fell back`);
  }
});

const PATHS = [
  ['I can charge at home', 'Under $35,000, used is fine', 'Mostly around campus', 'quiz.result.home-used-local', 'GREAT FIT'],
  ['I can charge at home', 'Under $35,000, used is fine', 'Long trips home', 'quiz.result.home-used-trips', 'GREAT FIT'],
  ['I can charge at home', '$35,000 or more, new', 'Mostly around campus', 'quiz.result.home-new-local', 'GREAT FIT'],
  ['I can charge at home', '$35,000 or more, new', 'Long trips home', 'quiz.result.home-new-trips', 'GREAT FIT'],
  ['Only campus or public chargers', 'Under $35,000, used is fine', 'Mostly around campus', 'quiz.result.public-used-local', 'GOOD FIT'],
  ['Only campus or public chargers', 'Under $35,000, used is fine', 'Long trips home', 'quiz.result.public-used-trips', 'RISKY FIT'],
  ['Only campus or public chargers', '$35,000 or more, new', 'Mostly around campus', 'quiz.result.public-new-local', 'GOOD FIT'],
  ['Only campus or public chargers', '$35,000 or more, new', 'Long trips home', 'quiz.result.public-new-trips', 'RISKY FIT'],
];

for (const [a1, a2, a3, expected, label] of PATHS) {
  test(`quiz path -> ${expected} (buttons)`, () => {
    const s = session();
    assert.equal(say(s, 'Take the Fit Check quiz').intent, 'quiz.start');
    say(s, a1);
    say(s, a2);
    const r = say(s, a3);
    assert.equal(r.intent, expected);
    assert.match(r.text, new RegExp(label));
  });
}

test('quiz works with typed letters A/B', () => {
  const s = session();
  say(s, 'start the quiz');
  assert.equal(say(s, 'B').intent, 'quiz.q1.public');
  assert.equal(say(s, 'a').intent, 'quiz.q2.public.used');
  assert.equal(say(s, 'b').intent, 'quiz.result.public-used-trips');
});

test('quiz works with natural answers', () => {
  const s = session();
  say(s, 'is an EV right for me');
  assert.equal(say(s, 'I live in a dorm').intent, 'quiz.q1.public');
  assert.equal(say(s, "I'm on a budget").intent, 'quiz.q2.public.used');
  assert.equal(say(s, 'I drive home on breaks').intent, 'quiz.result.public-used-trips');
});

test('nonsense mid-quiz re-asks the same question and keeps your place', () => {
  const s = session();
  say(s, 'quiz');
  say(s, 'home');
  const r = say(s, 'purple elephant');
  assert.equal(r.intent, 'quiz.q2.home.fallback');
  assert.match(r.text, /Question 2 of 3/);
  assert.equal(say(s, 'new').intent, 'quiz.q2.home.new');
});

test('a quiz answer outside the quiz falls back', () => {
  const r = say(session(), 'B');
  assert.equal(r.intent, 'Default Fallback Intent');
});

test('you can ask a question mid-quiz and still finish', () => {
  const s = session();
  say(s, 'quiz');
  say(s, 'home');
  assert.equal(say(s, 'is a Tesla expensive to insure').intent, 'insurance.tips');
  assert.equal(say(s, 'used').intent, 'quiz.q2.home.used');
});

test('restarting clears old answers', () => {
  const s = session();
  say(s, 'quiz'); say(s, 'home'); say(s, 'used');
  say(s, 'retake the quiz');
  assert.equal(say(s, 'A').intent, 'quiz.q1.home');
});

test('common free-text questions match the right intent', () => {
  const cases = {
    'hi': 'Default Welcome Intent',
    'is there a tax credit for EVs?': 'cost.tax_credit',
    'how old do I have to be to test drive': 'testdrive.book',
    'what happens to range in the cold': 'range.winter',
    'can I charge at school': 'charging.campus',
    'I live in an apartment': 'charging.no_home',
    'I have no credit': 'financing.no_credit',
    'Model 3 or Model Y': 'models.compare',
    'do EVs need oil changes': 'maintenance.basics',
    'does a Tesla drive itself': 'fsd.autopilot',
    'what is the weather on mars': 'Default Fallback Intent',
  };
  for (const [q, intent] of Object.entries(cases)) assert.equal(say(session(), q).intent, intent, q);
});

test('quiz steps carry buttons and are never AI-polished; results can be', () => {
  const s = session();
  const start = say(s, 'quiz');
  assert.equal(start.payload.polish, false);
  assert.ok(start.payload.suggestions.length === 2);
  say(s, 'home'); say(s, 'used');
  const result = say(s, 'local');
  assert.equal(result.payload.polish, undefined);
  resetMockSessions();
});
