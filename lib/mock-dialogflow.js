// LOCAL TESTING ONLY (DIALOGFLOW_MOCK=1). A tiny keyword matcher that imitates
// Dialogflow's output shape so you can work on the site without Google credentials.
// The real site never uses this - your Dialogflow agent is the source of truth.

const RULES = [
  {
    intent: 'Default Welcome Intent',
    keywords: ['hi', 'hello', 'hey', 'start'],
    text: "[Mock] Hi! I'm Fit Check. Are you shopping for your first electric car?",
  },
  {
    intent: 'charging.home',
    keywords: ['charge', 'charging', 'charger', 'plug'],
    text: '[Mock] Most owners charge at home overnight. Do you have a garage or driveway where you could install a charger?',
    payload: {
      sources: [
        {
          title: 'Mock source: home charging basics',
          url: 'https://example.com/home-charging',
          excerpt:
            'Level 1 charging uses a standard 120-volt outlet. Level 2 charging uses a 240-volt circuit and adds range much faster, which is why most owners install one at home.',
        },
      ],
    },
  },
  {
    intent: 'range.anxiety',
    keywords: ['range', 'far', 'miles', 'road trip'],
    text: '[Mock] Range depends on the model, speed, and weather. How many miles do you drive on a typical day?',
  },
];

export function mockDetectIntent(text) {
  const t = String(text).toLowerCase();
  const rule = RULES.find((r) => r.keywords.some((k) => new RegExp(`\\b${k}\\b`).test(t)));
  if (!rule) {
    return {
      engine: 'Mock Dialogflow',
      intent: 'Default Fallback Intent',
      page: null,
      confidence: 1,
      isFallback: true,
      matchType: 'FALLBACK',
      text: "[Mock] Sorry, I didn't catch that. You can ask me about charging, range, or test drives.",
      payload: null,
      parameters: {},
    };
  }
  return {
    engine: 'Mock Dialogflow',
    intent: rule.intent,
    page: null,
    confidence: 0.9,
    isFallback: false,
    matchType: 'INTENT',
    text: rule.text,
    payload: rule.payload || null,
    parameters: {},
  };
}
