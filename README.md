# MTC3 Portal — System Build

A full-stack SaaS-style application I designed and built to simulate real-world support, debugging, and operational workflows including authentication, scheduled processes, notifications, and integrations.

This repo provides a realistic system context used to practice troubleshooting, testing, and operational workflows.

If you're evaluating me for an implementation, technical-operations, or "builder" role, the right reading order is:

1. **`qa_portfolio_mtc`** — how I tested this system end-to-end (test plans, execution rounds, observability improvements, automation in Python + Playwright, AI-output testing).
2. **This repo** — the system both of those repos refer to. Skim for context; dive into the files listed below if you want to see how I think about operational mechanics.

---

## Why a system this big

The roles I’m targeting involve troubleshooting complex systems, supporting operational workflows, and identifying opportunities to improve reliability and reduce manual effort.

To practice this in a realistic way, I built a platform with the same types of components found in production environments: authentication, scheduled processes, notifications, third-party integrations, and a database as the source of truth.

This system is used to simulate real support scenarios — reproducing issues, validating workflows, and testing how systems behave across edge cases and integrations.

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

## Where to look 

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

- **Operational system understanding** — working across integrations, scheduled processes, and system state to understand how real applications behave end-to-end.
- **Troubleshooting & debugging** — investigating issues using API responses, logs, database queries, and system behavior across multiple services.
- **Cross-platform integration awareness** — working with Stripe, Postmark, Twilio, and OpenAI to understand how external services impact system reliability.
- **Async / scheduled workflows** — understanding and validating background jobs (BullMQ) for module lifecycle changes, notifications, and processing tasks.
- **Scripting against real systems** — Python + `requests` + API-based workflows to simulate real-world support, testing, and data validation scenarios.
- **AI in production paths** — validating structured outputs, handling edge cases, and identifying failure modes in LLM-assisted workflows.
- **End-to-end system visibility** — built, tested, and debugged across frontend, backend, database, and queue systems to fully understand system behavior.

For the testing discipline behind this system, see the QA portfolio repo. For automation examples and workflow improvements, see the automation examples repo.
