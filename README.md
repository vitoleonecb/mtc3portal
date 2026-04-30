# MTC3 Portal — System Build (Supporting Evidence)

A full-stack web application I designed and built solo to operate creative theater workshops end-to-end: authoring workshops, modules, and prompts; running a time-based module lifecycle on a configurable schedule; collecting interactive responses; routing notifications across email and SMS; processing payments; and enriching analytics with AI.

This repo is **supporting evidence**, not the headliner. It exists so that the work in my other portfolio repos has a realistic, end-to-end substrate behind it — a real running system with users, schedules, integrations, and async jobs, instead of a contrived demo.

If you're evaluating me for an implementation, technical-operations, or "builder" role, the right reading order is:

1. **`ops_automation_examples`** — focused scripts and integrations that delete manual workflows. *(My headliner repo for ops/implementation roles.)*
2. **`qa_portfolio_mtc`** — how I tested this system end-to-end (test plans, execution rounds, observability improvements, automation in Python + Playwright, AI-output testing).
3. **This repo** — the system both of those repos refer to. Skim for context; dive into the files listed below if you want to see how I think about operational mechanics.

---

## Why a system this big

The job descriptions I'm targeting want someone who can sit between operational teams and the systems they depend on, identify manual work, and replace it with scripts and integrations. To practice that without faking it, I needed a real platform with the same moving parts a real operations team works with: authentication, scheduled state transitions, multi-channel notifications, third-party billing, an LLM in the loop, and a database holding the source of truth.

So I built one. Designing and shipping the whole thing is what gave the QA portfolio and the upcoming automation repo something honest to point at.

---

## What the system does

A modular platform where members and administrators collaborate to shape in-person theater workshops and showcases:

- **JWT-based authentication and role-based authorization** — login, registration, password reset, email confirmation, with session handling that re-validates against the database on every request.
- **Time-based module lifecycle** — modules transition `pending → open → processing → completed` on a configurable weekly cycle, driven by background workers rather than admin clicks.
- **Async notification system** — email (Postmark) and SMS (Twilio) dispatch behind a per-user preferences abstraction; module-open notices, last-day reminders, RSVP unconfirmed nudges, ticket receipts, monthly showcase checks.
- **Payments** — Stripe subscriptions for memberships, one-off payment intents for showcase tickets, idempotent webhook handling.
- **AI-enriched analytics** — three-pass OpenAI integration (keyword bubbles, neutral thematic labels, similarity clusters) with structured-JSON outputs, fail-soft behavior when keys are missing.
- **Time-gated outcomes** — RSVPs auto-issue when a user has responded to every prompt across every module; tickets batch-create for active subscribers when a new showcase publishes.

---

## Where to look (if you're evaluating ops / implementation work)

The pieces in this repo that map directly to implementation, integration, and automation work:

- **`back_end/script_testing/scripts/seed_prompt_responses.py`** — Python + `requests` + OpenAI + DB seeding. Authenticates against the API, pulls config from MySQL via the API, generates realistic responses with the OpenAI Chat Completions API, and writes them back across a controlled time window. The same shape as a bulk-onboarding or data-migration script against a vendor system.
- **`back_end/workers/`** and **`back_end/queues/`** — BullMQ + Redis worker layer that replaces what would otherwise be admin clicks. Modules transition state on a schedule, last-day reminders fire 12 seconds before deadline, monthly showcase checks run on cron, tickets batch-create for active subscribers when a showcase publishes.
- **`back_end/services/cycleService.js`** — the scheduling math behind module status transitions, timezone-aware via dayjs.
- **`back_end/services/notificationService.js`** — the per-user preferences abstraction over Postmark + Twilio so the right channel gets used per recipient.
- **`back_end/services/aiAnalysisService.js`** — OpenAI integration with three structured-JSON passes and defensive parsing.
- **`back_end/stripe.js`** — payments + raw-body-verified webhook handling, idempotent ticket creation.

If you're evaluating UI/frontend work, the relevant code lives in `front_end/my-app-vite/src/` — but it's not the point of this repo for the roles I'm applying to.

---

## Tech stack (for context only)

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite, React Router v7, Recharts, Framer Motion, React-PDF |
| Backend | Node.js + Express (ES modules) |
| Database | MySQL (via `mysql2/promise`) |
| Queue System | Redis + BullMQ |
| Auth | JWT + bcrypt |
| Payments | Stripe (subscriptions + one-off PaymentIntents + webhooks) |
| Notifications | Postmark (email), Twilio (SMS) |
| AI | OpenAI Chat Completions |
| Scripting | Python (`requests`, `openai`, `dotenv`) for seeding/smoke testing |

---

## Repository layout

```
back_end/                       Node/Express API
  app.js                        Server entry, JWT middleware, MySQL pool
  users.js                      Auth, registration, password reset, email confirm
  workshops.js                  Workshops, modules, prompts, responses, RSVPs
  showcases.js                  Showcases, ticketing
  stripe.js                     Stripe subscriptions, payment intents, webhook
  analytics.js                  Per-prompt aggregation endpoints
  cycleScheduler.js             Admin endpoints for module-cycle config
  homepage.js                   Public homepage stats endpoint
  materials.js                  Workshop materials (scripts, warmups, experiments)
  productions.js                Productions (workshop sibling domain)
  services/                     Shared logic (notifications, analytics, AI, cycle)
  queues/                       BullMQ queue definitions
  workers/                      BullMQ workers (module lifecycle, notifications, AI)
  templates/emails/             Hand-built HTML email templates
  migrations/                   SQL migrations
  postman_collections/          Postman collections for manual API exploration
  script_testing/               Python + Node scripts for seeding / smoke testing

front_end/my-app-vite/          Vite + React SPA (context, not the focus here)

ecosystem.config.js             PM2 process definition for the backend
```

---

## Local development

### Prerequisites

- Node.js 20+
- MySQL 8 (or compatible)
- Redis (for BullMQ workers)
- Stripe / Postmark / Twilio / OpenAI accounts only if you want those integrations to actually send / charge / call out — the code fails soft when the corresponding env vars are missing.

### Backend

```bash
cd back_end
cp .env.example .env          # then fill in values
npm install
npm run dev                   # starts Express on http://localhost:3036

# In separate terminals (Redis must be running):
node workers/moduleWorker.js
node workers/notificationWorker.js
node workers/aiAnalysisWorker.js
```

Apply the SQL files in `back_end/migrations/` against your database in order. A `/health` endpoint reports basic env / DB connectivity.

### Frontend

```bash
cd front_end/my-app-vite
cp .env.example .env.local
npm install
npm run dev                   # Vite dev server, typically http://localhost:5173
```

---

## What this repo demonstrates

- **Operational-system thinking** — designing the integrations, schedules, and state machines that let manual work disappear, not just the user-facing UI.
- **Cross-platform integration** — Stripe, Postmark, Twilio, and OpenAI wired in behind small abstractions so each channel can be tuned per-user without rewriting callers.
- **Async / scheduled automation** — BullMQ workers replacing admin clicks for module lifecycle, reminders, batch ticket creation, and AI analysis.
- **Scripting against real systems** — Python + `requests` + OpenAI + DB scripts that operate the API the same way bulk-onboarding or data-migration tooling would in a real ops job.
- **AI in production paths** — structured-JSON outputs, defensive parsing, fail-soft behavior when keys are absent.
- **End-to-end ownership** — designed, built, deployed, and tested solo, which is the only way I could honestly say I understand the full surface.

For the testing discipline behind this system, see the QA portfolio repo. For the ops-automation patterns this system gave me a substrate to practice, see the automation examples repo.
