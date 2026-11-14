# Fit Check: rule-based EV buying chatbot

Fit Check is a website for our Dialogflow chatbot that helps first-time EV buyers. **Dialogflow's rules decide every answer.** An optional local AI, running on our own PC, can only do two things after that:

1. **Verify:** check the Dialogflow answer against trusted sources we list.
2. **Polish:** reword the answer so it reads naturally. It can add detail only from those sources, with `[1]` citations.

```
User message
   │
   ▼
Dialogflow (ES or CX)  ── picks the intent and the response     ← ALWAYS runs, ALWAYS decides
   │
   ├─ No match / fallback?  ──► show Dialogflow's fallback. The AI is never called.
   ├─ Intent marked "no polish"? ──► show the exact Dialogflow text.
   ├─ AI toggle off or PC offline? ──► show the exact Dialogflow text.
   │
   ▼
Local LLM on our PC (Ollama / Open WebUI)
   │  gets: user message + Dialogflow answer + source excerpts
   │  returns: reworded answer + claim-by-claim verification
   ▼
Code guardrails (lib/guard.js). The rewrite is thrown out if it:
   • adds any number, price, or date that isn't in Dialogflow/sources
   • adds links or cites a source that doesn't exist
   • mentions products/money terms Dialogflow didn't (Model Y, Supercharger, tax credit…)
   • drops Dialogflow's follow-up question (which drives the conversation flow)
   • runs too long
   │
   ▼
Reply shown, with a "How was this answered?" panel that shows the original Dialogflow
response, matched intent and confidence, verification result, and sources.
```

The **AI polish** switch in the header turns the AI layer off completely. The site works fully rule-based without it.

---

## Run it locally (2 minutes, no Google account needed)

```bash
npm install
npm run dev:mock        # fake keyword matcher in place of Dialogflow, for UI testing only
# open http://localhost:3000
npm test                # guardrail + pipeline tests
```

With real Dialogflow: `cp .env.example .env`, fill it in, then run `npm run dev`.

---

## Step 1: Give the site access to Dialogflow

1. Find the Google Cloud **project ID** of the agent:
   - **ES:** Dialogflow ES console → gear icon → *Project ID*.
   - **CX:** Agent settings → note the *project*, *location* (e.g. `global`, `us-central1`), and *agent ID* (the long ID in the agent URL).
2. Go to https://console.cloud.google.com, select that project, then open **IAM & Admin → Service Accounts → Create service account**.
   - Name: `fit-check-web`
   - Role: **Dialogflow API Client**
3. Open the new account → **Keys → Add key → Create new key → JSON**. A file downloads.
   **Never commit this file.** `.gitignore` already blocks common names.
4. Use the whole contents of that JSON file as the `GOOGLE_CREDENTIALS` value in step 4.

> If key creation is blocked, the project probably belongs to a school-managed Google account. Create the agent (or export/import it) in a project under a personal Google account instead.

## Step 2: Connect the AI on your PC (optional)

The site calls any **OpenAI-compatible** chat endpoint. Pick one option.

### Option A: Use Open WebUI's built-in API (no new software)
1. In Open WebUI: **Admin Panel → Settings → General → enable API keys** (wording varies by version).
2. **Settings → Account → API keys → Create**. Copy the `sk-…` key.
3. Vercel env vars:
   - `LLM_CHAT_URL` = `https://<your-open-webui-host>/api/chat/completions`
   - `LLM_API_KEY` = the `sk-…` key
   - `LLM_MODEL` = a model name exactly as Open WebUI lists it (e.g. `llama3.1:8b`)

### Option B: Use the small gateway in front of Ollama (`pc-gateway/`)
On the PC:
```bash
# bash / macOS / Linux
GATEWAY_TOKEN="$(openssl rand -hex 24)" node pc-gateway/server.mjs
# PowerShell
$env:GATEWAY_TOKEN="paste-a-long-random-string"; node pc-gateway/server.mjs
```
The gateway listens only on `127.0.0.1:8787`. It requires the token and caps request size. Expose it to the internet with a free tunnel. You don't need to buy a domain:
- **Tailscale Funnel:** `tailscale funnel --bg 8787` gives a stable `https://<pc-name>.<tailnet>.ts.net` URL.
- **Cloudflare Tunnel:** if you already route a domain through Cloudflare, add a public hostname (e.g. `llm.yourdomain.com`) pointing to `http://localhost:8787`.
- **Cloudflare quick tunnel:** `cloudflared tunnel --url http://localhost:8787` (free, but the URL changes on every restart).

Then set `LLM_CHAT_URL=https://<tunnel-host>/v1/chat/completions` and `LLM_API_KEY=<GATEWAY_TOKEN>`.
To keep the gateway running after you close the terminal: `npm i -g pm2 && pm2 start pc-gateway/server.mjs --name fitcheck-llm && pm2 save`.

**Model tip:** a 7–8B instruct model (Llama 3.1 8B, Qwen 2.5 7B) is plenty for rewording. Replies come back in a few seconds on a GPU.

## Step 3: Push to GitHub

Create an **empty** repo on GitHub (no README), e.g. `fit-check`, then run:
```bash
git init
git add .
git commit -m "Fit Check: rule-based Dialogflow chatbot site"
git branch -M main
git remote add origin https://github.com/<your-username>/fit-check.git
git push -u origin main
```

## Step 4: Deploy on Vercel (free `*.vercel.app` URL)

1. https://vercel.com/new → **Import** the GitHub repo.
2. Framework preset: **Other**. Leave the build and output settings as they are.
3. **Environment Variables:** add everything from `.env.example`. At minimum:
   `DIALOGFLOW_AGENT_TYPE`, `DIALOGFLOW_PROJECT_ID`, `GOOGLE_CREDENTIALS` (plus `DIALOGFLOW_LOCATION` and `DIALOGFLOW_AGENT_ID` for CX), and the `LLM_*` vars if you use the AI.
4. **Deploy.** The site goes live at `https://<project-name>.vercel.app`. Rename the project under *Settings → General* to get a cleaner URL, e.g. `fit-check-iu.vercel.app`.
5. Every push to `main` redeploys automatically. After you change env vars, redeploy from the *Deployments* tab.

---

## Adding trusted sources (for verification)

Option 1: in `data/sources.js`, key sources by **intent display name**:
```js
export default {
  'charging.home': [
    { title: 'Charging at home - DOE AFDC', url: 'https://afdc.energy.gov/…', excerpt: 'Paste 2–4 sentences from the page.' },
  ],
};
```
Option 2: in Dialogflow, add a **Custom Payload** response to the intent:
```json
{ "sources": [ { "title": "…", "url": "https://…", "excerpt": "…" } ] }
```
To force the exact wording for an intent (disclaimers, legal text), use the payload `{ "polish": false }` or add the intent to `NO_POLISH_INTENTS`.

The AI can only use what's in the excerpts, so keep them accurate and copied straight from the source page.

## Customizing
- Site text and suggestion chips: `public/config.js`. Make the chips match training phrases in your agent.
- Look and feel: `public/styles.css`.
- Guardrail terms: the `GUARD_WATCH_TERMS` env var, or the list in `lib/config.js`.

## Demo tips
- Turn **AI polish off** and show that the bot still runs the full conversation. That's the rule-based system on its own.
- Turn it back on and open **"How was this answered?"** to show the original Dialogflow response next to the polished one.
- Ask something off-topic. Dialogflow's fallback answers, and the panel shows the AI was never called.

## File map
```
api/chat.js          POST /api/chat: runs the pipeline
api/health.js        GET /api/health: Dialogflow config + local AI online/offline
lib/pipeline.js      the reply flow (start here)
lib/dialogflow.js    Dialogflow ES/CX detectIntent via REST
lib/llm.js           prompt + call to your PC's model
lib/guard.js         guardrails that reject anything the AI made up
lib/sources.js       merges sources from data/sources.js + Dialogflow payloads
data/sources.js      trusted source excerpts per intent
public/              the website (index.html, styles.css, app.js, config.js)
pc-gateway/          optional token-protected proxy for Ollama on your PC
tests/               npm test
```
