// The whole reply flow, in order:
//   1. Dialogflow (rule-based) decides the answer.            <- always runs, always authoritative
//   2. Fallback / no-match / opted-out intents stop here.       <- no AI involved
//   3. Local LLM verifies the answer against trusted sources and rewrites the wording.
//   4. Code guardrails check the rewrite; if anything was added, the original is shown instead.

import { getConfig, PublicError } from './config.js';
import { detectIntent as realDetectIntent } from './dialogflow.js';
import { callLLM as realCallLLM, buildMessages, parseLLMJson, llmConfigured as realLlmConfigured } from './llm.js';
import { getSources as realGetSources } from './sources.js';
import { checkPolished } from './guard.js';

const EMPTY_REPLY = "Sorry, I don't have an answer for that yet. Try asking another way.";

export async function handleChat(
  { message, sessionId, polish = true },
  deps = {}
) {
  const {
    detectIntent = realDetectIntent,
    callLLM = realCallLLM,
    getSources = realGetSources,
    llmConfigured = realLlmConfigured,
  } = deps;
  const cfg = getConfig();

  const userMessage = String(message ?? '').trim();
  if (!userMessage) throw new PublicError(400, 'Type a message first.');
  if (userMessage.length > cfg.limits.maxMessageChars) {
    throw new PublicError(400, `Please keep messages under ${cfg.limits.maxMessageChars} characters.`);
  }

  // 1. Rule-based answer
  const t0 = Date.now();
  const df = await detectIntent(userMessage, sessionId);
  const dfMs = Date.now() - t0;
  const ruleText = df.text || EMPTY_REPLY;
  const sources = getSources(df.intent, df.payload);

  const result = {
    answer: ruleText,
    answeredBy: 'rule-based',
    ruleBased: {
      engine: df.engine,
      intent: df.intent,
      page: df.page,
      confidence: df.confidence,
      isFallback: df.isFallback,
      matchType: df.matchType,
      text: ruleText,
      parameters: df.parameters,
    },
    sources,
    polish: { status: 'off', reason: 'AI polish is turned off - this is the raw Dialogflow response.' },
    timings: { dialogflowMs: dfMs },
  };

  // 2. Cases where AI is never used
  if (!polish) return result;
  if (df.isFallback || !df.text) {
    result.polish = { status: 'skipped', reason: "Dialogflow didn't match an intent, so the reply stays 100% rule-based (the AI never answers on its own)." };
    return result;
  }
  if (df.payload?.polish === false || cfg.llm.noPolishIntents.includes(df.intent)) {
    result.polish = { status: 'skipped', reason: 'This intent is marked "no polish", so the exact Dialogflow wording is shown.' };
    return result;
  }
  if (!llmConfigured()) {
    result.polish = { status: 'unavailable', reason: 'The local AI is not configured, so the Dialogflow response is shown as-is.' };
    return result;
  }

  // 3. Verify + polish on the local LLM
  const t1 = Date.now();
  let parsed;
  try {
    const content = await callLLM(buildMessages({ bot: cfg.bot, userMessage, df: { ...df, text: ruleText }, sources }));
    parsed = parseLLMJson(content);
  } catch (err) {
    console.error('[llm]', err.message);
    result.polish = { status: 'unavailable', reason: 'The local AI is offline right now, so the Dialogflow response is shown as-is.' };
    result.timings.llmMs = Date.now() - t1;
    return result;
  }
  result.timings.llmMs = Date.now() - t1;

  if (!parsed) {
    result.polish = { status: 'rejected', reason: "The AI's reply wasn't in the expected format, so the Dialogflow response is shown instead." };
    return result;
  }

  const verification = {
    verdict: sources.length ? parsed.verdict : 'no_sources',
    claims: parsed.claims,
    notes: parsed.notes,
  };

  // 4. Guardrails
  const check = checkPolished({ polished: parsed.polished, ruleText, userMessage, sources, guard: cfg.guard });
  if (!check.ok) {
    result.polish = {
      status: 'rejected',
      reason: `Guardrail blocked the AI rewrite (${check.reasons.join('; ')}), so the Dialogflow response is shown instead.`,
      attempted: parsed.polished,
      verification,
      model: cfg.llm.model,
    };
    return result;
  }

  result.answer = parsed.polished;
  result.answeredBy = 'rule-based + ai-polish';
  result.polish = {
    status: 'applied',
    reason: 'Dialogflow chose the answer; the local AI only reworded it and checked it against the listed sources.',
    verification,
    model: cfg.llm.model,
  };
  return result;
}
