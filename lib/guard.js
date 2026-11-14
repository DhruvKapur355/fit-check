// Code-level guardrails. The LLM is only trusted to reword; this checks that it did.
// If any check fails, the site shows the original Dialogflow answer instead.

const NUM_RE = /\$?\d[\d,]*(?:\.\d+)?\s?%?/g;
const URL_RE = /https?:\/\/[^\s)\]]+/gi;
const CITE_RE = /\[(\d+)\]/g;

const normNum = (n) => n.replace(/[$,%\s]/g, '').replace(/\.0+$/, '');

function numbersIn(text) {
  return (String(text).replace(CITE_RE, ' ').match(NUM_RE) || []).map(normNum).filter(Boolean);
}

const wordCount = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;

export function checkPolished({ polished, ruleText, userMessage, sources, guard }) {
  const reasons = [];
  const text = String(polished || '').trim();
  if (!text) return { ok: false, reasons: ['AI returned an empty answer'] };

  const allowedText = [ruleText, userMessage, ...sources.flatMap((s) => [s.title, s.url || '', s.excerpt])].join('\n');
  const allowedLower = allowedText.toLowerCase();

  // 1. No new numbers (prices, ranges, dates, percentages...)
  const allowedNums = new Set(numbersIn(allowedText));
  const newNums = [...new Set(numbersIn(text))].filter((n) => !allowedNums.has(n));
  if (newNums.length) reasons.push(`added numbers not in Dialogflow/sources: ${newNums.join(', ')}`);

  // 2. No new links
  const newUrls = (text.match(URL_RE) || []).filter((u) => !allowedText.includes(u.replace(/[.,]+$/, '')));
  if (newUrls.length) reasons.push('added links not in sources');

  // 3. Citations must point at real sources
  const badCites = [...text.matchAll(CITE_RE)].map((m) => Number(m[1])).filter((n) => n < 1 || n > sources.length);
  if (badCites.length) reasons.push(`cited sources that don't exist: ${badCites.join(', ')}`);

  // 4. No new product / money terms
  const newTerms = guard.watchTerms.filter((term) => {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:e?s)?\\b`, 'i');
    return re.test(text) && !allowedLower.includes(term.toLowerCase());
  });
  if (newTerms.length) reasons.push(`mentioned terms Dialogflow didn't: ${newTerms.join(', ')}`);

  // 5. Keep the dialog flow: if Dialogflow asked a question, the polished version must too
  if (/\?/.test(ruleText) && !/\?/.test(text)) reasons.push("dropped Dialogflow's follow-up question");

  // 6. Length
  if (wordCount(text) > guard.maxWords) reasons.push(`too long (${wordCount(text)} words)`);

  return { ok: reasons.length === 0, reasons };
}
