# MVP Phase 1 Starter Plan

Use this when returning to the project to begin the first implementation phase. It translates `docs/MVP_PRODUCT_MEMORY.md` into concrete starting actions.

## Phase 1 objective

Make the public-to-participant path honest, safe, and coherent before expanding the rest of the MVP.

Phase 1 should answer:

- Can a public visitor understand and try the current workshop?
- Are preview responses preserved locally and submitted only after email/account context?
- Are public archive/showcase views accessible without accidentally exposing private tools or data?
- Are workshop/module phase permissions enforced by the backend rather than only by frontend routing?
- Can admins moderate responses cleanly, and can rejected users revise while the module is still open?

## Step 1 — Audit current homepage preview behavior

Files likely involved:

- `back_end/homepage.js`
- `front_end/my-app-vite/src/HomePage.jsx`
- `front_end/my-app-vite/src/HomepageModuleRunner.jsx` or equivalent homepage runner component
- `front_end/my-app-vite/src/Templates.jsx`

Audit notes are now captured in `docs/HOMEPAGE_BEHAVIOR_AUDIT.md`. Read that file before changing
the homepage preview or archive flow.

Actions:

1. Confirm what `/api/homepage/feed` currently returns:
   - current workshop;
   - open modules;
   - first prompt path;
   - public snippets;
   - sample analytics.
2. Confirm whether the homepage runner currently uses one module, all open modules, or a single prompt.
3. Confirm where unsent preview responses are stored:
   - React state only;
   - `localStorage`;
   - `sessionStorage`;
   - another custom cache.
4. Add/standardize `localStorage` persistence for public preview responses. Implemented 2026-09-26 for locally submitted homepage preview responses.
5. Ensure stored preview responses are keyed by workshop/module/prompt identity so stale responses from an older workshop do not leak into a new preview. Implemented 2026-09-26.
6. Audit the submit path that sends preview responses after email capture.
7. Update end-of-preview copy. Implemented 2026-09-26:
   - do not promise immediate RSVP;
   - explain that email saves/continues work;
   - explain that RSVP requires completing all required modules.
8. Add a post-save path back to the remaining preview modules/prompts, not only "Create Full Account." Implemented 2026-09-26.
9. Show public workshop date/time, but hide location behind a flat lock affordance with a registration tooltip. Implemented 2026-09-26 in the homepage runner.
10. Enforce workshop dates as a hard invariant. Implemented 2026-09-26:
   - frontend workshop creation forms block missing/invalid dates;
   - backend workshop creation rejects missing/invalid dates;
   - migration `back_end/migrations/require_workshop_date_not_null.sql` fails if existing workshops are undated, then makes `workshops.workshop_date` `NOT NULL` and adds a real-date check constraint.
11. Add public-safe processing/completed module previews. Implemented 2026-09-26:
   - homepage feed includes processing/completed modules as `publicPreviewModules`;
   - only approved response snippets are exposed;
   - public preview UI anonymizes identities and locks private user details;
   - pending modules remain hidden.
12. Public feed privacy hardening: response snippets contain text only, without participant names or response IDs. Public previews never receive stored admin/AI analysis. Current processing previews omit analysis sections; current completed and archived previews show locked Admin Analysis and AI Analysis headings with registration/login tooltips. Authenticated participant and admin analysis views retain their existing behavior. No separate public-analysis fields or migration are required.

Acceptance checks:

- Refreshing the homepage does not erase locally submitted preview responses.
- Moving among open modules keeps each answer with its prompt; when the current workshop changes over time, old answers do not appear in the new runner.
- Entering an email submits the intended responses once.
- Returning-guest saves clear only the prompt answers confirmed by the API; duplicate answers stay local for account follow-up.
- Existing registered email stays local until login instead of silently attaching.
- Copy accurately describes the RSVP path.
- Saving midway through preview still lets the guest continue responding.
- Multi-module workshops do not unlock RSVP until all required modules/prompts are completed.
- Partial guest saves enqueue the incomplete-workshop email and create no RSVP; complete guest saves create one unconfirmed RSVP and enqueue the earned-but-account-required email.
- The partial-save email's Continue link returns to the same workshop (including an upcoming unlinked workshop after the default homepage selection changes), and its registration link preserves that workshop ID for local-answer import.
- Continuation emails use a signed, seven-day guest link. It restores saved prompt answers and the email, skips repeated email capture, and resumes at the first unanswered prompt. A guest upgrade requires the emailed token; email/guest ID alone cannot claim the record. Older or expired links can request a fresh email without revealing whether the address exists.
- The preview landing rows show prompts left or a completed/check state with read-only answer review. Continue skips completed work. On the last available answer, an emailed guest continuation auto-saves and shows `Join Workshop` only when the API confirms the RSVP; failed saves remain retryable. Unsigned visitors still submit an email for their first database save.
- Registration import of the final locally held prompt creates one RSVP; a partial import creates none. Repeated saves and an explicit `/rsvp/create` check do not create duplicates.
- Guest RSVP detail/status access and self-confirmation remain blocked until account upgrade and email verification. Admin access and check-in of unconfirmed RSVPs remain allowed. Apply `back_end/migrations/unique_workshop_rsvp_per_user.sql` after resolving any duplicate rows, then verify duplicate submissions cannot create another RSVP.

## Step 2 — Add scoped archive views and public API shapes

Frontend direction:

- Keep `/showcases` as the public entry point.
- Use a `Current` / `Archive` view control on the showcase list.
- Preserve the same scoped view pattern inside `/showcases/:showcaseId` for linked workshops.
- When the selected showcase is already past, show its archive directly without a redundant Upcoming/Archive control.
- Keep the selected view in the URL query string so archive views are linkable and browser navigation works.

Backend surface:

- `/api/showcases/public` returns public showcase marketing details, including location, without user-specific fields.
- `/api/showcases/public/:showcaseId` returns safe showcase detail plus linked workshop card metadata.
- `/api/homepage/feed?workshopId=:workshopId` selects one workshop. Upcoming workshops with non-pending modules can be reopened by exact-workshop guest email links even without a linked showcase; any upcoming open module shown there accepts responses. Past previews remain showcase-linked and read-only. Without the parameter, the feed selects the nearest upcoming workshop for the response runner.
- Existing authenticated workshop endpoints remain private and should not be reused for guests.

Actions:

1. Route homepage workshop discovery CTAs to `/showcases`.
2. Add optional archive views to the showcase list and showcase detail rather than creating a separate archive page.
3. Return linked workshops in a safe public shape:
   - title/name;
   - description;
   - date;
   - whether a homepage preview is available.
   Do not return workshop addresses; public cards render the map-pin/lock tooltip without a location label until login.
4. For guest current/upcoming workshop cards, label the exact-workshop action `Respond` when the workshop is upcoming and has open modules; otherwise use `Preview` for read-only access. Label the account action `Sign Up`. Past workshop cards provide only `Preview` when available; past cards without a preview have no action. Logged-in users, including admins, open archived cards in the authenticated module view even when no public preview is available. Do not repeat the active archive tab in a separate list heading for either audience.
5. Keep private fields out of public responses:
   - workshop locations;
   - personal response records;
   - RSVP attendee details unless explicitly public;
   - admin analysis drafts;
   - moderation controls.
6. Use actual safe workshop/showcase records. Do not use test data or ship private data behind a visual blur.
7. Treat past showcase details as archive-only and block new paid/member ticket creation after the showcase time.

Acceptance checks:

- Logged-out users can switch between current and archive views at each showcase-tree level.
- Public list/detail browsing does not require an access token.
- Public responses expose showcase logistics but not workshop locations or private participant/admin data.
- A guest can open an eligible workshop's exact homepage preview from its card.
- A guest can save responses from a showcase-selected upcoming workshop while its modules are `open`, including earlier on the workshop day.
- A guest cannot submit from a past workshop preview, including a module whose status still says `open`.
- Homepage workshop-discovery CTAs land on `/showcases`.
- Past showcase pages have no ticket action, and ticket creation endpoints reject past showcases.
- Ticket confirmation verifies a succeeded Stripe PaymentIntent for the exact showcase, user, currency, and amount before inserting a ticket. Delayed fulfillment of a payment begun before closing remains allowed.
- New ticket purchases are blocked when any ticket row already exists for that user and showcase, including a cancelled row; repurchase/reissue needs a separate lifecycle decision before charging again.

## Step 3 — Centralize access policy for MVP-critical checks

Goal: stop relying on frontend-only gates for module phases and role visibility.

Create or identify a backend access helper that can answer:

- Can this request view public homepage/archive data?
- Can this user view this module?
- Can this user submit/edit a response for this prompt?
- Can this user view community responses/analytics for this prompt?
- Can this user view materials for this module/workshop?
- Can this user moderate responses?
- Can this user trigger AI analysis?

Rules to encode first:

- Public users:
  - can view homepage snippets;
  - can use homepage preview locally before DB submit;
  - can browse public archive;
  - can browse public showcases with date/time/location;
  - cannot view private modules/responses/materials/personal analytics.
- Participants:
  - can submit only while module is `open`;
  - can view community responses/analytics only after responding to that prompt;
  - can view materials only when module is `completed`;
  - can revise rejected responses only while module remains `open`.
- Admin/staff:
  - can moderate responses;
  - can write admin analysis during processing/completed states;
  - can manually trigger AI analysis for eligible prompt types;
  - should not submit prompt responses during `processing`.

Acceptance checks:

- Direct API calls cannot submit/edit after a module enters `processing`.
- Direct API calls cannot fetch private module/material/analytics data while logged out.
- Frontend state and backend decisions agree.

Implementation update (2026-10-04): submission routes now check prompt ownership and `open` status; public email batches require the current workshop; community reads require a prior answer (admin bypass); workshop-level materials wait until all modules complete; direct RSVP creation checks eligibility. Backend policy tests run with `npm test`. Manual browser checks and a successful test-email save remain the final acceptance pass.

## Step 4 — Fix moderation and rejected-response revision flow

Actions:

1. Replace two persistent approve/decline buttons with a clear dynamic moderation control.
2. Show current moderation state:
   - pending/unreviewed;
   - approved;
   - declined.
3. Allow admins to intentionally change/toggle moderation state.
4. When a response is declined:
   - notify the user;
   - include the module closing/processing deadline if known;
   - link to edit the response if module is still `open`.
5. Add frontend edit affordance only when:
   - response belongs to the user;
   - response is declined;
   - module status is `open`;
   - prompt is still editable/submittable by policy.

Acceptance checks:

- Approved/declined responses do not still show confusing twin buttons.
- Declined users can revise while open.
- Declined users cannot revise after processing.
- Rejected responses are excluded from analytics/AI analysis.

## Step 5 — Update first-pass docs during implementation

As code changes happen, keep these docs current:

- `docs/MVP_PRODUCT_MEMORY.md`
- `docs/MVP_PHASE_1_STARTER_PLAN.md`
- `AGENTS.md` if new route maps, env vars, commands, or architectural decisions emerge.

Do not bury product decisions only in code comments.

## Suggested first branch

Use a branch name like:

```text
codex/mvp-phase-1-public-preview-access
```

## Suggested first commit scope

Keep the first implementation commit narrow:

1. homepage preview audit/fix;
2. localStorage persistence;
3. copy correction;
4. scoped showcase/archive view implementation if small.

Then make access policy hardening a second commit/PR-sized chunk.
