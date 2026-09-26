# Homepage Behavior Audit

Audit date: 2026-09-24

Manual test update: 2026-09-25

Implementation update: 2026-09-26

Scope:

- Public homepage feed
- Homepage module preview runner
- Email save flow for no-account responses
- Guest upgrade registration path
- Homepage links to workshops/archive

## Summary

The homepage preview is partially aligned with the MVP product direction, but not production-ready.

Confirmed:

- `/api/homepage/feed` is public and returns the current workshop, all open modules for that workshop, and all prompts inside those open modules.
- `HomepageModuleRunner` lets a logged-out or guest visitor move through all open modules returned by the feed.
- Preview responses are held locally before email submission.
- Email submission posts a batch to `/api/homepage/responses`.
- The backend creates/reuses a guest user for new/guest emails and rejects full existing accounts with an `existing_user` status.
- Manual testing confirmed the displayed homepage workshop was expected.
- Manual testing confirmed guest/public preview responses are not saved to the database until an email is entered.
- Manual testing confirmed multi-module preview can move from one module to the next.
- Manual testing confirmed new-email save creates a guest user and responses.
- Manual testing confirmed existing registered-user email does not attach responses.
- Manual testing confirmed guest-save followed by full account creation upgrades/uses the same user ID without duplicating responses.
- Homepage preview responses are now stored in `localStorage` by workshop/module/prompt identity after local prompt submit, so submitted preview answers can survive refreshes before email save.
- After a successful guest email save, the homepage save screen now offers a "Continue Responding" path when additional preview modules remain.
- Public homepage date/time/location values are no longer rendered directly; locked icon controls route visitors toward account creation.
- `/api/homepage/feed` now selects the nearest upcoming dated workshop with open modules. Workshops are required to have real dates.
- RSVP readiness now uses direct workshop-scoped prompt/response counts instead of unscoped view row comparisons.
- Public homepage feed now selects the nearest upcoming workshop with any non-pending module. Open modules still use the response runner; processing/completed modules can appear as public-safe anonymized approved response previews.
- Public processing/completed previews now reuse the normal response-processing UI shape: prompt analytics, admin analysis, AI analysis, and response cards are rendered from public-safe data while identity fields are redacted.
- Homepage "Members" count now excludes users with `user_type = 'guest'`.

Not aligned yet:

- The homepage "View Workshops" CTA points to `workshops`, but `App.jsx` does not currently register a `/workshops` route.
- `WorkshopsPage.jsx` exists but calls auth-protected `/api/workshops`, so it is not a safe public archive as-is.
- The guest registration stash path uses `sessionStorage`, not `localStorage`, and posts to a suspicious URL with `modules/0`, which works only because the backend route ignores `moduleid`.
- Manual testing exposed a repeat-save edge case: saving another set of responses under the same guest email can hit the public rate limiter and/or produce a poor "Something went wrong" experience. HTTP 429 now has a frontend error classification, but product behavior for returning guests who want to revise/overwrite responses still needs design.

## Backend findings

### `GET /api/homepage/feed`

File: `back_end/homepage.js`

Behavior:

- Public endpoint; no auth middleware.
- Selects the nearest upcoming workshop that has at least one non-pending module:
  - joins `workshops` to `workshop_modules`;
  - filters out `workshop_module_status = 'pending'`;
  - filters to workshops dated today/future;
  - orders by `workshop_date ASC`;
  - limits to 1.
- For that workshop, fetches all non-pending modules.
- Open modules are returned as `openModules` for the homepage runner.
- Processing/completed modules are returned as `publicPreviewModules` with approved responses only, prompt analytics, admin analysis, and AI analysis.
- Public preview response payloads do not include responder names, usernames, email addresses, moderation controls, or private user IDs.
- Returns:
  - `currentWorkshop`;
  - `openModules`;
  - `publicPreviewModules`;
  - `firstPromptPath`;
  - `recentResponses`;
  - `communityStats`;
  - `sampleAnalytics`.

Potential privacy issue:

- `currentWorkshop` still includes `workshopLocation` and `workshopDate` in the API response for frontend compatibility.
- The public homepage runner no longer renders those raw values; it shows locked icon controls with tooltips that route toward account creation.

### `POST /api/homepage/responses`

File: `back_end/homepage.js`

Behavior:

- Public endpoint with IP rate limit of 5 submissions/hour.
- Requires `email` and non-empty `responses[]`.
- Existing full user:
  - returns `status: "existing_user"`;
  - does not attach responses.
- Existing guest:
  - reuses the guest user ID.
- New email:
  - creates a `guest` user with a random password.
- Inserts each response unless that guest already has a response for the same prompt.
- Auto-accepts template IDs `1, 3, 6, 7, 9`.
- Short response and notation, IDs `4` and `8`, are not auto-accepted.
- Checks RSVP readiness after insert and creates a workshop RSVP if the user appears to have completed the workshop.
- Enqueues:
  - `workshopRsvpUnconfirmed` when RSVP is unlocked;
  - `guestRegistrationInvite` after save.

Implementation note:

- RSVP readiness now calls `ensureWorkshopRsvpForCompletedPrompts`, which compares all distinct prompts in the submitted workshop against the user's distinct responses to prompts in that same workshop. RSVP creation is skipped when the workshop has zero prompts or the user has not answered every workshop prompt.
- Returning guest duplicate/revision behavior is not fully designed. Current backend skips duplicate prompt inserts for returning guests, so it does not overwrite existing responses.

## Frontend findings

### `HomePage.jsx`

File: `front_end/my-app-vite/src/pages/HomePage.jsx`

Behavior:

- Fetches `/homepage/feed`.
- Determines logged-in and guest state from `localStorage.accessToken`.
- Logged-in non-guest users see a simple current workshop CTA.
- Logged-out users and guest users see `HomepageModuleRunner`.
- The analytics section includes a CTA:
  - `Link to="workshops"`
  - text: `View Workshops`

Issue:

- `App.jsx` does not register a `/workshops` route.
- `WorkshopsPage.jsx` exists but is not imported/registered in `App.jsx`.
- Even if registered, `WorkshopsPage.jsx` currently depends on auth-protected `/api/workshops`, so it does not satisfy the public archive goal.

### `HomepageModuleRunner.jsx`

File: `front_end/my-app-vite/src/components/HomepageModuleRunner.jsx`

Behavior:

- Phases:
  - `landing`;
  - `running`;
  - `edge`;
  - `save`.
- Can run through all open modules in the feed.
- Stores submitted prompt responses in React state and `localStorage`.
- `localStorage` keys are scoped by workshop ID, and individual response entries are keyed by module ID and prompt ID.
- At module edge, if more open modules remain:
  - shows "Module Complete!";
  - offers "Next Module";
  - offers "Save Responses."
- At save phase:
  - copy explains that saving preserves work and that RSVP eligibility requires all required workshop modules/prompts.
- Email save posts to `/homepage/responses`.
- "Create Full Account" stashes responses into `sessionStorage.guestResponses`.

Issue:

- "Save Responses" at a module edge allows partial save before completing all open modules. This is valid, and the copy is now clearer, but returning guest overwrite/revision behavior still needs deliberate design.

### `RegistrationPage.jsx`

File: `front_end/my-app-vite/src/pages/RegistrationPage.jsx`

Behavior:

- Reads `sessionStorage.guestEmail`.
- Reads `sessionStorage.guestResponses`.
- After registration and auto-login, posts stashed guest responses to:
  - `/workshops/${workshopId}/modules/0/prompts/${r.promptId}/response`

Issue:

- This storage is `sessionStorage`, not `localStorage`.
- The route uses `modules/0`, which is misleading. The backend response route currently ignores `moduleid`, so this may work accidentally, but it is brittle and confusing.
- If responses have already been saved by `/homepage/responses`, then later account creation via guest upgrade should not also create duplicate records. The normal authenticated response endpoint does not deduplicate; duplicate handling depends on DB constraints, if any. This needs runtime/manual verification.
- Manual testing found guest-save followed by full registration appears to upgrade/link the same user record and does not duplicate responses. Keep this behavior.

## Archive/workshop CTA findings

Files:

- `front_end/my-app-vite/src/pages/HomePage.jsx`
- `front_end/my-app-vite/src/App.jsx`
- `front_end/my-app-vite/src/pages/WorkshopsPage.jsx`
- `back_end/workshops.js`

Findings:

- `HomePage.jsx` links to `workshops`.
- `App.jsx` has no route for `workshops`.
- `WorkshopsPage.jsx` exists but is not registered.
- `WorkshopsPage.jsx` fetches `/api/workshops` with an Authorization header.
- `back_end/workshops.js` protects `GET /api/workshops` with `authenticateToken`.

Conclusion:

- There is not currently a real public workshop archive.
- Adding `/archive` is the cleaner MVP path instead of trying to expose `WorkshopsPage.jsx` directly.

## Manual tests recommended

These need runtime confirmation with a real/dev database:

1. Homepage feed shape:
   - open the homepage logged out;
   - confirm which workshop appears;
   - verify whether it is the desired "current" workshop.
2. Multi-module preview:
   - complete one prompt/module;
   - click "Next Module";
   - confirm every open module in the current workshop can be reached.
3. Refresh behavior:
   - answer a homepage preview prompt;
   - refresh;
   - confirm the answered state and displayed value both survive for multiple template types, including sample rater.
4. Email save:
   - use a new email;
   - confirmed: guest user and responses are created.
   - still verify `guestRegistrationInvite` queue behavior when workers/Redis are running.
5. Existing full-user email:
   - use an email belonging to a registered non-guest user;
   - confirmed: responses are not attached.
6. Guest upgrade:
   - save preview responses with new email;
   - click create full account;
   - register;
   - confirmed: user information updates under the same user ID and duplicate responses were not observed.
7. RSVP behavior:
   - complete only some required workshop prompts;
   - save email;
   - confirm no RSVP is created;
   - complete all required prompts;
   - confirm RSVP is created once.
8. Workshop CTA:
   - click "View Workshops";
   - confirm current behavior. Expected from static review: route is missing or unusable.
9. Public processing/completed preview:
   - make the nearest upcoming workshop contain only processing/completed public-visible modules;
   - load the homepage logged out;
   - confirm module cards are navigable, show an eye icon, and switch the selected prompt preview;
   - confirm charts, admin analysis, AI analysis, and response cards render when data exists;
   - confirm responder identity is redacted.

## Questions / decisions raised by the audit

1. Should returning guests be allowed to overwrite existing preview responses only after full signup, or should they be able to revise as guests too?
2. Should a returning guest who saves with the same email receive a magic-link style continuation email instead of an overwrite flow?
3. What exact reminder behavior should exist for guests who partially save:
   - opt-in reminder;
   - 24 hours later;
   - around 7 hours before module processing cutoff;
   - both?
4. Should the public archive show only workshop/showcase cards first, or include public prompt/module detail pages in phase one?
5. Should the RSVP completion rule count only open modules, all modules, all required modules, or all non-pending modules?

## Recommended first implementation slice

1. Change `HomepageModuleRunner` local response storage from ref-only to `localStorage`-backed state.
2. Key storage by current workshop ID and prompt ID.
3. Update save-phase and module-edge copy so RSVP is not promised prematurely.
4. Clear local saved preview responses after successful `/homepage/responses` save or after confirmed account upgrade.
5. Add `/archive` route and public archive endpoint rather than reviving `/workshops` as public.
6. Hide workshop date/time/location from public users behind lock-icon/tooltip UI.
7. Change homepage current-workshop selection to nearest upcoming workshop by date.
8. Fix RSVP readiness so multi-module workshops require all required prompts/modules before RSVP.
9. Add a post-save option to continue the remaining homepage preview modules/prompts.
10. Design returning-guest response overwrite/revision behavior.
