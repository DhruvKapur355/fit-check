# Fit Check: a rule-based EV chatbot for college students

Fit Check helps **college students buying their first car** decide whether an electric car fits their life and budget, with a focus on Tesla's Model 3 and Model Y. It walks the automaker customer journey: awareness (why EV, costs), consideration (charging, range, models, used, insurance, financing), and purchase (test drive, ordering).

**It is rule-based.** Every reply is hard-coded in a Dialogflow ES agent. The website only shows what Dialogflow returns. An optional "AI polish" switch can reword answers using a model on our own PC. It is **off by default**, and the bot works fully without it.

```
User message ──► Dialogflow ES agent (intents + contexts, hard-coded responses) ──► reply shown
                                  │
                                  └─ only if "AI polish" is switched on, and only for non-quiz, matched intents:
                                     local LLM rewords the reply and checks it against listed sources;
                                     code guardrails throw the rewrite out if it adds anything.
```

---

## What's in the agent (`FitCheck-Dialogflow-ES.zip`)

46 intents and 430 training phrases, all with fixed text responses:

| Journey stage | Intents |
|---|---|
| Start / navigation | Default Welcome, Default Fallback, `menu.help`, `smalltalk.thanks_bye`, `human.handoff` |
| Awareness | `ev.why`, `cost.overview`, `cost.tax_credit`, `cost.charging_vs_gas` |
| Consideration | `charging.basics`, `charging.no_home`, `charging.campus`, `charging.road_trip`, `range.basics`, `range.winter`, `models.compare`, `buy.used`, `battery.warranty`, `insurance.tips`, `financing.no_credit`, `maintenance.basics`, `fsd.autopilot` |
| Purchase | `testdrive.book`, `buy.process` |
| **Fit Check quiz** | `quiz.start`, 6 answer intents, 7 context fallbacks, 8 results |

### The quiz is a hard-coded decision tree

Three questions, each answered A or B. Dialogflow **contexts** track where you are (`quiz-q1` → `quiz-q2-home` / `quiz-q2-public` → `quiz-q3-…`). If the answer doesn't match, a context-specific fallback asks the same question again.

| Charge at home? | Budget | Driving | Result | Pick |
|---|---|---|---|---|
| Yes | Used | Local | GREAT FIT | Used Model 3 |
| Yes | Used | Long trips | GREAT FIT | Used Model 3 Long Range (now "Premium") |
| Yes | New | Local | GREAT FIT | New Model 3 Standard |
| Yes | New | Long trips | GREAT FIT | Model 3 Premium, or Model Y for cargo |
| No | Used | Local | GOOD FIT, WITH PLANNING | Used Model 3 + campus/public charging plan |
| No | Used | Long trips | RISKY FIT RIGHT NOW | Wait, or a used Long Range near a Supercharger |
| No | New | Local | GOOD FIT, WITH PLANNING | Model 3 Standard + charging plan |
| No | New | Long trips | RISKY FIT RIGHT NOW | Model 3 Premium only if a Supercharger is close |

The rule: **charging access matters most, then driving pattern, then budget.**

Facts were checked in November 2026 against Tesla, U.S. DOT, DOE, AAA, KBB, and IU Parking pages. Every source is listed in `agent/fitcheck-agent.mjs`. Prices are 2026 model-year **launch** prices and change often, so the bot tells users to check tesla.com.

---

## Step 1: Put the agent into Dialogflow (about 5 minutes)

1. Go to https://dialogflow.cloud.google.com and sign in with a **personal** Google account. School accounts often block the keys you need in step 2.
2. **Create agent:** name it `FitCheck`, set the language to English and the time zone to America/Indiana/Indianapolis, and let it create a new Google project.
3. Click the **⚙ gear** next to the agent name → **Export and Import** → **RESTORE FROM ZIP** → choose `FitCheck-Dialogflow-ES.zip` → type `RESTORE`.
4. Wait for training to finish (the bell icon). Then test it in the simulator on the right: try `hi`, `take the quiz`, `A`, `B`, `A`.

> **Backup:** if the ZIP import ever fails, run `npm run push:agent` after step 2. It uploads the same intents through Google's API and trains the agent. For this, the service account needs the **Dialogflow API Admin** role.

## Step 2: Give the website a key

1. In Dialogflow, click ⚙ → **General** and click the **Project ID** link. This opens Google Cloud.
2. Go to **IAM & Admin → Service Accounts → Create service account**. Name it `fit-check-web` and give it the role **Dialogflow API Client** (or **Dialogflow API Admin** if you'll use `push:agent`).
3. Open the account → **Keys → Add key → Create new key → JSON**. Keep the downloaded file private and never commit it.

## Step 3: Run it on your laptop

```bash
npm install
cp .env.example .env     # fill in DIALOGFLOW_PROJECT_ID and paste the whole key JSON into GOOGLE_CREDENTIALS
npm run dev              # http://localhost:3000, talking to your real Dialogflow agent
```
To work without Google at all, run `npm run dev:mock`. It uses a local simulator that runs the same intents, responses, and contexts. `npm test` walks every quiz path and checks that every button matches an intent.

## Step 4: GitHub → Vercel (free `*.vercel.app` URL)

```bash
git remote add origin https://github.com/<your-username>/fit-check.git
git push -u origin main
```
1. Create an **empty** GitHub repo first. This folder is already a git repo with a commit.
2. Go to https://vercel.com/new → import the repo → Framework: **Other**.
3. **Environment Variables:** `DIALOGFLOW_AGENT_TYPE=es`, `DIALOGFLOW_PROJECT_ID`, and `GOOGLE_CREDENTIALS` (the whole JSON). Add the `LLM_*` vars only if you use AI polish.
4. Deploy. Your site is `https://<project-name>.vercel.app`. Rename the project under Settings → General for a nicer URL.

## Optional: AI polish from your PC

The switch is **off by default**, so a visitor (or a grader) sees pure Dialogflow output unless they turn it on. When it's on:
- Quiz questions, the welcome message, and fallbacks are never rewritten (the agent marks them `"polish": false`).
- For other replies, your PC's model rewords the answer and checks it against the sources for that intent.
- `lib/guard.js` rejects the rewrite if it adds numbers, links, product or money terms, or drops the follow-up question. The original then shows instead.

Setup, either option:
- **Open WebUI:** `LLM_CHAT_URL=https://<your-open-webui-host>/api/chat/completions`, `LLM_API_KEY=<Open WebUI API key>`, `LLM_MODEL=<model name>`.
- **Gateway for Ollama:** run `GATEWAY_TOKEN=<long random string> npm run gateway` on the PC and expose port 8787 with Tailscale Funnel or a Cloudflare Tunnel. Then set `LLM_CHAT_URL=https://<tunnel-host>/v1/chat/completions` and `LLM_API_KEY=<GATEWAY_TOKEN>`.

## Changing the bot

1. Edit `agent/fitcheck-agent.mjs`, which holds all intents, phrases, responses, buttons, and sources.
2. Run `npm run build:agent`. This rebuilds the ZIP and `data/sources.js`.
3. Run `npm test`.
4. Restore the new ZIP in Dialogflow, or run `npm run push:agent`.

Site text and the home-screen buttons are in `public/config.js`.

## Demo script
1. Show the welcome message → click **Take the Fit Check quiz** → answer the 3 questions → show the result.
2. Open **How was this answered?** It shows the matched Dialogflow intent and the exact hard-coded response.
3. Type something mid-quiz like "purple elephant". The quiz fallback asks the same question again (the context is kept).
4. Ask an off-topic question. The Default Fallback answers.
5. Optional: turn on AI polish and compare the reworded answer with the original in the details panel.

## File map
```
agent/fitcheck-agent.mjs   THE BOT: every intent, phrase, response, quiz rule, and source
agent/build-agent.mjs      builds FitCheck-Dialogflow-ES.zip + data/sources.js
agent/push-agent.mjs       backup uploader (Dialogflow API)
FitCheck-Dialogflow-ES.zip import this into Dialogflow ES
api/chat.js, api/health.js Vercel serverless functions
lib/                       pipeline, Dialogflow client, local simulator, optional LLM + guardrails
public/                    the website
pc-gateway/                optional token-protected proxy for Ollama
tests/                     npm test
```
