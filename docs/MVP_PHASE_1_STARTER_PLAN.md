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
9. Hide public workshop date/time/location behind locked UI with a tooltip and join/register path. Implemented 2026-09-26 in the homepage runner.
10. Enforce workshop dates as a hard invariant. Implemented 2026-09-26:
   - frontend workshop creation forms block missing/invalid dates;
   - backend workshop creation rejects missing/invalid dates;
   - migration `back_end/migrations/require_workshop_date_not_null.sql` fails if existing workshops are undated, then makes `workshops.workshop_date` `NOT NULL` and adds a real-date check constraint.
11. Add public-safe processing/completed module previews. Implemented 2026-09-26:
   - homepage feed includes processing/completed modules as `publicPreviewModules`;
   - only approved response snippets are exposed;
   - public preview UI anonymizes identities and locks private user details;
   - pending modules remain hidden.

Acceptance checks:

- Refreshing the homepage does not erase locally submitted preview responses.
- Changing to a different current workshop/module does not reuse old preview responses incorrectly.
- Entering an email submits the intended responses once.
- Existing registered email stays local until login instead of silently attaching.
- Copy accurately describes the RSVP path.
- Saving midway through preview still lets the guest continue responding.
- Multi-module workshops do not unlock RSVP until all required modules/prompts are completed.

## Step 2 — Add public archive route and API shape

Likely frontend routes:

- `/archive`
- possible archive detail routes later, such as `/archive/workshops/:workshopId`

Likely backend surface:

- New public endpoint under `/api/homepage` or a dedicated archive router.
- Existing `workshops.js` endpoints are likely token-gated and should not be reused directly unless safely split.

Actions:

1. Find the homepage "all workshops" button/CTA and confirm where it currently routes.
2. Create a public archive page if missing.
3. Return completed/archived workshops in a safe public shape:
   - title/name;
   - description;
   - date;
   - public summary;
   - safe module/prompt metadata if desired;
   - public approved snippets only if intentionally allowed.
4. Include archived/completed showcases in the archive or link to a public showcase listing.
5. Keep private fields out of public archive responses:
   - hidden event location/time where applicable;
   - personal response records;
   - RSVP attendee details unless explicitly public;
   - admin analysis drafts;
   - moderation controls.

Acceptance checks:

- Logged-out users can reach `/archive`.
- Archive does not require an access token.
- Archive does not expose private participant/admin endpoints.
- Homepage "all workshops" CTA lands somewhere real and useful.

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
  - can browse public showcases with locked time/location;
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
4. public archive route stub or route implementation if small.

Then make access policy hardening a second commit/PR-sized chunk.
