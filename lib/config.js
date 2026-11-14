// Central settings. Everything secret comes from environment variables
// (set them in Vercel → Project → Settings → Environment Variables, or in .env locally).

const env = (name, fallback = '') => (process.env[name] ?? fallback).toString().trim();
const list = (name) => env(name).split(',').map((s) => s.trim()).filter(Boolean);

export function getConfig() {
  return {
    bot: {
      name: env('BOT_NAME', 'Fit Check'),
      domain: env(
        'BOT_DOMAIN',
        'helping first-time electric-vehicle buyers through the Tesla customer journey'
      ),
    },

    dialogflow: {
      mock: env('DIALOGFLOW_MOCK') === '1',
      agentType: env('DIALOGFLOW_AGENT_TYPE', 'es').toLowerCase(), // "es" or "cx"
      projectId: env('DIALOGFLOW_PROJECT_ID'),
      location: env('DIALOGFLOW_LOCATION', 'global'),
      agentId: env('DIALOGFLOW_AGENT_ID'), // CX only
      languageCode: env('DIALOGFLOW_LANGUAGE', 'en'),
      credentials: env('GOOGLE_CREDENTIALS'), // full service-account JSON (or base64 of it)
    },

    llm: {
      // Any OpenAI-compatible chat-completions URL on your PC, e.g.
      //   Open WebUI:  https://your-openwebui-host/api/chat/completions
      //   pc-gateway:  https://your-tunnel-host/v1/chat/completions
      chatUrl: env('LLM_CHAT_URL'),
      apiKey: env('LLM_API_KEY'),
      model: env('LLM_MODEL', 'llama3.1:8b'),
      timeoutMs: Number(env('LLM_TIMEOUT_MS', '20000')),
      // Intents that must never be rewritten (e.g. legal disclaimers, welcome).
      noPolishIntents: list('NO_POLISH_INTENTS'),
    },

    guard: {
      maxWords: Number(env('POLISH_MAX_WORDS', '170')),
      // Product / feature names the AI may only mention if Dialogflow or a source already did.
      watchTerms: list('GUARD_WATCH_TERMS').length
        ? list('GUARD_WATCH_TERMS')
        : [
            'Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster', 'Semi',
            'Supercharger', 'Full Self-Driving', 'FSD', 'Autopilot', 'Powerwall',
            'tax credit', 'rebate', 'warranty', 'lease', 'financing', 'APR',
          ],
    },

    limits: {
      maxMessageChars: 500,
      perMinutePerIp: Number(env('RATE_LIMIT_PER_MIN', '20')),
    },
  };
}

export class PublicError extends Error {
  constructor(status, publicMessage, detail) {
    super(detail || publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
  }
}
