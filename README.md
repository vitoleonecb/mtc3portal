# MTC3 Portal

A full-stack application for creative theater workshops and showcases. Participants can explore workshops, respond to prompts, track their progress, and earn RSVPs. Administrators can author workshops and materials, review responses, and manage event workflows.

Public visitors can browse upcoming showcases and preview eligible workshop modules. Account holders can continue through workshop participation, while members can claim included showcase tickets and non-members can purchase tickets.

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

## Key implementation areas

- **`back_end/homepage.js`** — public workshop discovery, preview data, and guest response saving.
- **`back_end/workshops.js`** — workshop modules, prompts, responses, moderation, and RSVPs.
- **`back_end/showcases.js`** and **`back_end/stripe.js`** — public showcase details, tickets, memberships, and payment verification.
- **`back_end/workers/`** and **`back_end/queues/`** — BullMQ + Redis jobs for module transitions, notifications, and AI analysis.
- **`back_end/services/cycleService.js`** — the scheduling math behind module status transitions, timezone-aware via dayjs.
- **`back_end/services/notificationService.js`** — preference-aware Postmark and Twilio delivery.
- **`back_end/services/aiAnalysisService.js`** — structured OpenAI analysis with defensive parsing.
- **`front_end/my-app-vite/src/`** — the React application and public/participant/admin interfaces.

Product decisions and current MVP priorities are recorded in `docs/MVP_PRODUCT_MEMORY.md` and `docs/MVP_PHASE_1_STARTER_PLAN.md`.

---

## Tech stack

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
  homepage.js                   Public homepage and guest preview endpoints
  materials.js                  Workshop materials (scripts, warmups, experiments)
  productions.js                Productions (workshop sibling domain)
  services/                     Shared logic (notifications, analytics, AI, cycle)
  queues/                       BullMQ queue definitions
  workers/                      BullMQ workers (module lifecycle, notifications, AI)
  templates/emails/             Hand-built HTML email templates
  migrations/                   SQL migrations
  postman_collections/          Postman collections for manual API exploration
  script_testing/               Python + Node scripts for seeding / smoke testing

front_end/my-app-vite/          Vite + React SPA

back_end/ecosystem.config.cjs    PM2 definition for the API and workers
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

Review migration dependencies and apply the needed SQL files in `back_end/migrations/` manually. There is no migration runner. The `/health` endpoint reports a configuration snapshot; it does not test database connectivity.

### Frontend

```bash
cd front_end/my-app-vite
cp .env.example .env.local
npm install
npm run dev                   # Vite dev server, typically http://localhost:5173
```
