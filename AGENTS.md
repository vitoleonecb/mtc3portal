# AGENTS.md

Use this file as the source of truth for AI coding agents working in this repository.

For product intent, MVP scope, access-level decisions, and unresolved product questions, also read
`docs/MVP_PRODUCT_MEMORY.md` before planning or implementing feature work. If implementation details
conflict with that memory file, treat it as a clarification point rather than silently changing the
product direction.

For the immediate MVP kickoff sequence, read `docs/MVP_PHASE_1_STARTER_PLAN.md`. Keep it updated as
phase-one implementation decisions are made.

## Project layout

- Backend API: `back_end/` (Node.js + Express, MySQL, Redis/BullMQ for background jobs)
- Frontend: `front_end/my-app-vite/` (Vite + React)
- Product memory: `docs/MVP_PRODUCT_MEMORY.md`
- MVP phase-one starter plan: `docs/MVP_PHASE_1_STARTER_PLAN.md`
- Database changes: `back_end/migrations/` (SQL files applied manually; there is no migration runner)
- API exploration fixtures: `back_end/postman_collections/`
- Seed and analysis utilities: `back_end/script_testing/`

## Runtime prerequisites

- Node.js 20+
- MySQL 8 or a compatible server
- Redis for BullMQ queues and workers
- External credentials are needed only for the integrations being exercised: Stripe, Postmark, Twilio, and OpenAI
- Both Node applications use ES modules (`"type": "module"`)

There is no root package workspace. Run npm commands from the relevant `back_end/` or
`front_end/my-app-vite/` directory.

---

## Style choices

### Visual language

The UI follows a **neo-brutalist / cartoon-card** aesthetic:

- **Black 1 px borders** + **`-4px 4px black` box-shadows** on all interactive surfaces (buttons, cards, inputs, textareas, dropdowns).
- Shadows reduce to `-2px 2px` on hover and disappear entirely on focus/active, giving a "press-in" feel.
- **20 px border-radius** is the default for most elements (cards, pills, inputs). Smaller radii (10–12 px) are used on icon buttons and internal containers.
- Background is white; primary accent is `#D2A478` (warm tan/gold, used for selected states and progress). Secondary accent is `#57A15E` (green, used for completion/success). Error/destructive color is `rgb(153, 66, 66)`.
- Typography is `sans-serif` with `font-weight: lighter` for body/heading text — keeps the overall feel airy.

### CSS architecture

- **No CSS modules or CSS-in-JS.** Most application-specific styles live in two global files:
  - `src/index.css` — Tailwind directives (`@tailwind base/components/utilities`), shadcn/ui CSS variables (HSL tokens for `--background`, `--foreground`, `--border`, etc.), and chart color overrides.
  - `src/App.css` — All custom component styles using plain CSS class selectors (`.workshopCardContainer`, `.logInButton`, `.Heading1`, etc.).
- **Tailwind** (v3) is available and configured via `tailwind.config.js`. It extends the default theme with shadcn/ui color tokens and border-radius vars. Tailwind is primarily used in `components/ui/` and for small layout utilities, not for the bulk of the app's UI.
- **shadcn/ui** is configured (`components.json`, `new-york` style, JSX, no RSC) and used selectively for chart wrappers and primitives under `components/ui/`. Most product UI is hand-built with the custom CSS classes in `App.css`.
- A responsive `--element-width` CSS variable (defined in `:root` and overridden via media queries at 100 px breakpoint intervals from 700 px up to 1500 px+) controls the width of the main content column. Nearly every block-level component binds `width: var(--element-width)` with `transition: width .5s ease`.

### Component patterns

- Interactive elements (buttons, cards, inputs) follow a consistent hover → focus → disabled lifecycle with the shadow/border animation described above.
- Card decorations: small SVG characters positioned absolutely on cards via `.cardDecoration` + position utility classes (`-top-right`, `-bottom-left`, etc.). They sit behind card content (`z-index: -1`) except on nav cards where they layer above the background.
- Icons are inline SVGs (mostly custom); `lucide-react` is also available as a dependency.
- `framer-motion` is used for drag-and-drop interactions (`DragAndDropArea` in `Buttons.jsx`) and some transition animations.
- `recharts` powers analytics charts, wrapped by the shadcn/ui `ChartContainer` abstraction in `components/ui/chart.jsx`.

### When adding new UI

- Prefer the existing plain-CSS class patterns in `App.css` for new components. Use the same border/shadow/radius/color conventions.
- Tailwind utility classes are fine for small one-off layout tweaks but should not replace the established card/button/input class patterns.
- New interactive elements should follow the same hover (shadow shrink) → focus (shadow gone) → disabled (opacity + `not-allowed`) states.

---

## Backend: Node/Express API (`back_end/`)

### Responsibilities

- REST API for users, workshops, modules, prompts, productions, showcases, and analytics
- Authentication and authorization via JWT
- MySQL access via a shared connection pool
- Background jobs for module status automation, notifications, and AI analysis (BullMQ + Redis)
- Stripe subscriptions, showcase ticket payments, and webhook processing
- Transactional email/SMS through Postmark and Twilio
- OpenAI-powered prompt analysis

### Key files

- `app.js`
  - Creates the MySQL pool (`connection`) and exports it for use across the backend.
  - Configures Express routers under `/api/users`, `/api/workshops`, `/api/productions`, `/api/analytics`, `/api/materials`, `/api/cycle`, `/api/stripe`, `/api/showcases`, and `/api/homepage`.
  - Loads environment from `.env` in `back_end/`.
  - Defines `authenticateToken` (general user access) and `authenticateTokenAdmin` (admin-only access) middleware on top of JWT.
  - Exposes `/health` with a configuration snapshot. It reports DB identifiers but does not execute a DB connectivity check.
- `users.js`
  - Implements user listing, basic admin check, and user CRUD endpoints.
  - `POST /api/users/login` validates email/password against the DB and returns a signed access token plus user payload; the frontend stores this token in `localStorage`.
- `workshops.js`
  - Core workshop/module/prompt API surface.
  - Routes cover: listing workshops, module lists and statuses, prompts within modules, RSVP creation and status, per-prompt responses (create/read), and admin moderation endpoints.
  - Implements the logic to automatically create RSVPs when a user has completed all prompts across all modules in a workshop.
- `productions.js`
  - Similar concepts to workshops but in the "productions" domain (productions, modules, prompts, and responses).
- `analytics.js` + `services/analyticsService.js`
  - Exposes analytics endpoints for specific prompt templates (`/api/analytics/multiplechoice/:promptId`, `/api/analytics/checklist/:promptId`).
  - `analyticsService.js` reads accepted responses, normalizes JSON payloads, and aggregates per-question option counts and response time-series for chart components.
- `materials.js`
  - CRUD for workshop scripts, warmups, experiments, beats, and their nested content.
- `showcases.js`
  - Showcase creation/listing, attendee data, membership ticket claims, and ticket confirmation/cancellation.
- `stripe.js`
  - Membership subscriptions, showcase PaymentIntents, and webhook handling. The raw webhook body middleware in `app.js` must remain mounted before `express.json()` or Stripe signature verification will fail.
- `homepage.js`
  - Homepage feed and featured-prompt response flow, including guest registration invitations.
- `cycleScheduler.js` + `services/cycleService.js`
  - Admin cycle configuration and timezone-aware scheduling. Cycle calculations use `America/New_York`.
- `services/notificationService.js`
  - Preference-aware Postmark email and Twilio SMS delivery.
- `services/aiAnalysisService.js`
  - OpenAI analysis of accepted prompt responses with structured, fail-soft output handling.
- `queues/` and `workers/`
  - `moduleQueue` / `moduleWorker.js`: module lifecycle transitions and downstream notification/analysis jobs.
  - `notificationQueue` / `notificationWorker.js`: email/SMS jobs and the monthly showcase check.
  - `aiAnalysisQueue` / `aiAnalysisWorker.js`: asynchronous prompt analysis during processing.

Queue connections currently use the default local Redis connection; no Redis host/password environment variables are wired into the queue definitions. Queue files import `ioredis` directly even though it is currently available transitively through BullMQ rather than declared directly in `back_end/package.json`; avoid relying on that detail when changing dependencies.

### Environment & configuration

Backend config is loaded from `.env` (in `back_end/`):

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- `ACCESS_TOKEN_SECRET` (JWT signing and verification)
- `PORT` (Express server port, default `3036`)
- `APP_BASE_URL` (frontend URL used in outgoing email/SMS links)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MEMBERSHIP_PRICE_ID`
- `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `DISABLE_APP_LISTEN=true` for scripts that need to import the DB pool or backend modules without starting HTTP

Use `back_end/.env.example` as the canonical backend variable list. Never commit populated `.env` files or secrets.

JWT payloads include `user_id`, `email`, `user_type`, `is_admin`, etc.

### Common backend commands

Run from `back_end/`:

```bash
cp .env.example .env
npm install
npm run dev      # or: npm start (both invoke node app.js)
```

Run workers in separate terminals when exercising async behavior (Redis must be running):

```bash
node workers/moduleWorker.js
node workers/notificationWorker.js
node workers/aiAnalysisWorker.js
```

Apply the SQL files in `back_end/migrations/` manually to the target database. Inspect migration dependencies before applying them; no command records or enforces migration order.

---

## Frontend: Vite React app (`front_end/my-app-vite/`)

### High-level architecture

- Entry: `src/main.jsx` mounts `<App />` to `#root`.
- `src/App.jsx` configures the router (`react-router-dom`) and wraps it with `ProgressProvider` → `OverlayProvider` → `StripeProvider`.
- `layout/Root.jsx` is the root layout route. Renders the fixed header bar (menu icon, progress bar, editor submit button) and the global overlay layer.

### Context providers

- `ProgressContext` — global progress state `{ current, max }` and `moduleStatus` string for the current module.
- `EditorSubmitContext` — currently exports a bare context intended for editor/header coordination. There is no `EditorSubmitProvider` mounted in `App.jsx`; verify the current consumers before relying on it.
- `OverlayContext` — manages modal overlays (error dialogs, confirmations).
- `StripeContext` — provides Stripe Elements for the ticket purchase flow.

### Route map

- `/` → `HomePage` — landing page with community stats, featured prompt, module runner preview, CTAs.
- `/login` → `LogInPage` — email/password login.
- `/register` → `RegistrationPage` — account creation with avatar builder.
- `/reset-password` → `ResetPasswordPage` — password reset flow.
- `/confirm-email` → `ConfirmEmailPage` — email confirmation.
- `/workshops/create` → `WorkshopCreateForm` — admin: multi-step workshop creation wizard.
- `/workshops/:workshopId/modules` → `WorkshopModules` — module list grouped by status.
- `/workshops/:workshopId/modules/:moduleId/prompts/:promptId` → `WorkshopPromptsPage` — core prompt runner (read, respond, review).
- `/workshops/:workshopId/modules/:moduleId/prompts/edit` → `WorkshopPromptsEditor` — admin: prompt authoring.
- `/workshops/:workshopId/materials` → `WorkshopMaterialsViewer` — view workshop materials (scripts, warmups, experiments).
- `/workshops/:workshopId/materials/edit` → `WorkshopMaterialsEditor` — admin: author workshop materials.
- `/workshops/:workshopId/rsvp/:userId` → `RSVP` — RSVP / edge-state page.
- `/rsvp/checkin/:token` → `RsvpCheckinPage` — RSVP QR check-in.
- `/admin/rsvp-scan` → `RsvpScanner` — admin: scan RSVP QR codes.
- `/admin/cycle` → `CycleConfigPage` — admin: configure module cycle timing.
- `/showcases` → `ShowcasesPage` — browse showcases.
- `/showcases/:showcaseId` → `ShowcaseDetailPage` — showcase detail with ticket options.
- `/showcases/:showcaseId/ticket` → `TicketPurchasePage` — Stripe-powered ticket purchase.
- `/showcases/:showcaseId/ticket/view` → `ShowcaseTicketViewPage` — view purchased ticket.
- `/membership` → `MembershipPage` — membership info/purchase.
- `/profile` → `Settings` — user profile and notification settings.
- `/analytics` → `Analytics` — higher-level analytics views.
- `/nav` → `NavPage` — full navigation menu.
- `/documentation` → `DocumentationPage` — app documentation.
- `/dropdown` → standalone `DropDown` demo/development route; do not treat it as a primary product route.

### Template components (`Templates.jsx`)

Each prompt has a `prompt_template_id` that maps to a template renderer:

- `MultipleChoiceTemplate` (ID 1)
- `CheckListTemplate` (ID 3)
- `ShortResponseTemplate` (ID 4)
- `DragAndDropTemplate` (ID 6)
- `SampleRaterTemplate` (ID 7)
- `ScriptNotationTemplate` (ID 8)
- `DropDownTemplate` (ID 9)

Each template reads normalized config from the API and writes back normalized `responseData`.

### Key UI components

- `Buttons.jsx` — `ModuleNavigator`, `MultipleChoiceGroup`, `CheckBoxButton`, `ShortResponseArea`, `OpenResponse`, `StarRater`, `DragAndDropArea`, `WorkshopCard`, `MainNavCard`, `NextButton`, `CreateButton`, `DropDown`.
- `Processing.jsx` — `ResponseProcessor` (fetches analytics, renders charts) and `ProcessorCard` (individual response card with admin moderation controls).
- `components/ui/chart.jsx` — Themable `ChartContainer` wrapping `recharts`.
- `RandomBackgroundLayer.jsx` / `ScrollBackgroundLayer.jsx` — Decorative background shapes.
- `card-characters.jsx` — Small SVG character decorations on cards.
- `components/pdf/` — React-PDF renderers for exporting materials (scripts, warmups, experiments, beats) to PDF.

### Frontend environment

- `VITE_API_URL` — base URL for the backend API (e.g. `http://localhost:3036/api`).
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key used by `StripeProvider`.
- API calls use `${import.meta.env.VITE_API_URL}/...`. Routes requiring authentication generally attach `Authorization: Bearer` from `localStorage.accessToken`; public authentication/homepage calls intentionally do not.

Use `front_end/my-app-vite/.env.example` as the canonical frontend variable list. Copy it to `.env.local`; only `VITE_`-prefixed values are exposed to the client, so never place server secrets there.

### Common frontend commands

Run from `front_end/my-app-vite/`:

```bash
cp .env.example .env.local
npm install
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test script or test runner is currently configured. `src/App.test.js` is a legacy file and should not be treated as runnable coverage without adding test tooling.

---

## Database and migrations

- MySQL is the source of truth. Most backend modules issue SQL directly rather than through an ORM.
- Schema changes belong in a new SQL file under `back_end/migrations/`; do not silently depend on a local schema mutation.
- Queries should continue to use placeholders/parameter arrays for user-controlled values.
- Some services and workers create their own MySQL pools instead of importing the pool from `app.js`; account for both API and worker processes when changing DB configuration.
- Responses and several prompt configurations are JSON stored in SQL columns. Preserve backward-compatible normalization when changing their shapes.

## Async jobs and lifecycle cautions

- Starting the API does not start workers. Features that enqueue jobs can appear successful while work remains unprocessed if the appropriate worker is not running.
- Module lifecycle is `pending → open → processing → completed`. The scheduler persists BullMQ job IDs in cycle tables so cancellation/replacement logic must keep Redis and MySQL records consistent.
- Moving a module to `processing` enqueues per-prompt AI analysis. Moving modules through lifecycle stages can also enqueue notifications and materials-ready work.
- The notification worker owns a repeatable monthly showcase check in addition to one-off delivery jobs.
- Keep BullMQ job payloads backward compatible when API producers and workers may be deployed separately.

## External integration cautions

- Stripe webhook signature verification requires the unparsed raw request body.
- Stripe webhook/ticket creation paths should remain idempotent because providers can retry events.
- Postmark, Twilio, and OpenAI paths are designed to fail soft when credentials are absent; preserve clear logging without leaking secrets or user content.
- Never perform real charges or send real email/SMS as part of routine validation. Use test credentials or mocks/manual inspection.

## Deployment

- `back_end/ecosystem.config.cjs` is the complete PM2 definition for the API and all three workers.
- The root `ecosystem.config.js` contains production-specific `/var/www/mtc3portal` paths and starts only the API; treat it as a legacy/deployment-specific configuration unless intentionally updating that environment.
- Frontend production output is generated by `npm run build`; the repository does not define a frontend PM2 process.

## Validation before handing off changes

Frontend changes, run from `front_end/my-app-vite/`:

```bash
npm run lint
npm run build
```

Backend changes, run from `back_end/`:

- Start the API and inspect `/health` for basic configuration/startup errors.
- Exercise the affected endpoint with safe local/test data.
- If queue behavior changed, run the affected worker with Redis available and inspect both producer and consumer logs.
- If schema behavior changed, add/review a migration and verify affected SQL against a disposable database when available.

There is no configured automated test suite. Do not claim tests passed when only lint/build or manual checks were run. If required infrastructure or credentials are unavailable, report exactly which validation was skipped.

---

## General use cases

### For participants (regular users)

- **Join a workshop** — browse available workshops, enter an open module, and work through prompts one at a time.
- **Respond to prompts** — interact with various template types (multiple choice, checklist, short response, drag-and-drop, rating, notation, dropdown). Responses are saved to the backend per-prompt.
- **Track progress** — see module-level and prompt-level progress bars. When all prompts in a module are complete, the system automatically advances module status and checks for workshop-level completion.
- **Earn an RSVP** — completing all modules in a workshop unlocks an RSVP. The RSVP page shows event details, attendee list, and a QR code for check-in.
- **View community responses** — after responding to a prompt (or after RSVP), see aggregated analytics and individual peer responses via `ResponseProcessor`.
- **Browse and attend showcases** — view upcoming showcases, purchase tickets (Stripe), and view tickets with QR codes.
- **Manage profile** — update account info, avatar, and notification preferences from the settings page.

### For admins

- **Create workshops** — use the multi-step wizard on `WorkshopCreateForm` to define workshop name, description, date, location, and modules.
- **Author prompts** — use the prompts editor to add prompts to a pending module. Saving prompts transitions the module to `open`.
- **Author materials** — use the materials editor to create scripts (with scenes, characters, dialogue), warmups, and experiments for a workshop.
- **Configure module cycles** — set timing for automatic module status transitions via `CycleConfigPage`.
- **Moderate responses** — accept or decline individual user responses from the `ProcessorCard` UI. Only accepted responses are included in analytics.
- **Review workshop responses** — use `WorkshopReviewPanel` to browse all responses by module and prompt, with admin analysis and AI analysis sections.
- **Scan RSVPs** — use the QR scanner (`RsvpScanner`) to check in attendees at events.

---

## User story flows

### 1. New user registration → first workshop

1. User lands on `HomePage`, sees community stats and a featured prompt preview.
2. Clicks "Sign Up" → navigates to `/register`.
3. Fills in name, email, password; builds an avatar via the `RegistrationAvatarBuilder`.
4. Submits → backend creates the user, returns a JWT → frontend stores it in `localStorage.accessToken`.
5. Redirected to `/` (now logged in). Clicks a workshop CTA or navigates to a workshop's module list.
6. Sees modules grouped by status (`open`, `processing`, `completed`, `pending`). Clicks an open module.
7. Enters the prompt runner (`WorkshopPromptsPage`). Prompt content loads; user interacts with the template (e.g. selects a multiple-choice option).
8. Clicks the submit button → `ModuleNavigator` POSTs the response → button flips to a next-arrow.
9. Clicks next → advances to the next prompt. Progress bar updates.
10. After the last prompt, the page checks workshop-level progress. If all modules are complete, an RSVP is created and the user is navigated to the RSVP page.

### 2. Admin creates a workshop and publishes prompts

1. Admin logs in → navigates to `/workshops/create`.
2. Steps through the creation wizard: workshop name, description, date (calendar picker), location, and defines modules (name + description for each).
3. Submits → backend creates the workshop + modules (all in `pending` status).
4. Admin navigates to the workshop's module list → clicks a pending module → enters the prompts editor (`WorkshopPromptsEditor`).
5. Adds prompts (selects template type, fills in questions/options/config for each).
6. Clicks submit → prompts are POSTed to the backend → module status updated to `open`.
7. Participants can now see and enter the module.

### 3. Module lifecycle (status transitions)

1. **Pending** — module exists but has no prompts. Only admins can access it (to author prompts).
2. **Open** — prompts are published. Participants can enter and respond.
3. **Processing** — transitional state (triggered by BullMQ worker or admin action). Participants who already started can finish, but new responses may be limited.
4. **Completed** — all expected work is done. Responses are locked; analytics and community views are available.

Status transitions can happen automatically via the BullMQ worker (`moduleWorker.js`) or through admin-configured cycle timing (`CycleConfigPage`).

### 4. RSVP and event check-in

1. User completes all modules in a workshop → system auto-creates an RSVP.
2. User is navigated to `/workshops/:workshopId/rsvp/:userId`. Sees event details (date, location), attendee avatars, and a confirm/unconfirm button.
3. A QR code is generated for the RSVP.
4. At the event, an admin opens `/admin/rsvp-scan` and scans the user's QR code → marks them as checked in.
5. Alternatively, the user can self-check-in via `/rsvp/checkin/:token`.

### 5. Showcase discovery and ticket purchase

1. User navigates to `/showcases` → sees a list of showcases.
2. Clicks a showcase → `ShowcaseDetailPage` shows details and ticket availability.
3. Clicks "Get Ticket" → `TicketPurchasePage` loads Stripe Elements via `StripeProvider`.
4. Completes payment → ticket is created → user is navigated to `ShowcaseTicketViewPage` with a viewable/scannable ticket.

### 6. Admin reviews responses and runs analytics

1. Admin navigates to a completed module's prompt page → sees their own response plus a `WorkshopReviewPanel`.
2. Selects a module and prompt from dropdowns → individual responses appear as `ProcessorCard`s in a horizontal scroller.
3. For each response, admin can accept ✓ or decline ✗.
4. `ResponseProcessor` renders aggregate charts (bar charts, line charts) using only accepted responses.
5. Admin can also write analysis notes in the `AdminAnalysisTextarea`. AI-generated analysis (word bubbles, summary sections) may appear in `AiAnalysisContainer`.

---

## How the pieces fit together

- **Authentication** — login returns a JWT stored as `localStorage.accessToken`. All API calls attach it as `Authorization: Bearer`. Backend middleware (`authenticateToken` / `authenticateTokenAdmin`) populates `req.user`.
- **Workshops → Modules → Prompts → Responses** — the core data hierarchy. Each prompt has a `prompt_template_id` determining its renderer. Responses are JSON stored in `workshop_responses.workshop_response_content`.
- **Analytics and moderation** — accepted responses (`workshop_response_acceptance = 1`) are aggregated by `analyticsService.js` and exposed via `/api/analytics/*`. `ResponseProcessor` renders charts; `ProcessorCard` renders individual responses with moderation controls.
- **Showcases** — a separate event/ticketing flow using Stripe for payments, with QR-based tickets.
- **Materials** — scripts, warmups, and experiments that admins author per-workshop, viewable by participants and exportable to PDF.
