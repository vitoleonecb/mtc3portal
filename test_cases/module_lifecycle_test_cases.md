# Manual Test Cases: Module Creation, Status Transitions & Module-Level Completion

## Feature Scope

**Files analyzed:**

- `back_end/workshops.js` — module CRUD, response submission, progress endpoints, RSVP creation
- `back_end/queues/moduleQueue.js` + `back_end/workers/moduleWorker.js` — BullMQ status automation
- `back_end/cycleScheduler.js` — scheduled cycle start, preset-driven timing
- `front_end/my-app-vite/src/pages/WorkshopModules.jsx` — module list, grouping by status, progress display, RSVP detail card
- `front_end/my-app-vite/src/pages/WorkshopPromptsPage.jsx` — progress bar, response submission, end-of-module logic, RSVP creation
- `front_end/my-app-vite/src/pages/WorkshopsPromptsEditor.jsx` — admin prompt authoring & submit
- `front_end/my-app-vite/src/EdgePages.jsx` — `ModuleEdge` (end-of-module screen), `RSVP` (RSVP view/confirm)
- `front_end/my-app-vite/src/context/ProgressContext.jsx` — global progress state

---

## MODULE CREATION (Admin)

---

### TC-MOD-001: Admin creates a module via the UI

- **Feature / Requirement:** `POST /api/workshops/:workshopid/modules` (admin-only, `workshops.js:659–669`)
- **Priority:** P0
- **Preconditions:** Admin user logged in. Workshop exists. On the `WorkshopModules` page.
- **Test Data:** Module name: `"Module A"` (≤20 chars)
- **Steps:**
  1. Click the "Create" button.
  2. Enter `"Module A"` in the module name input.
  3. Press Enter.
- **Expected Result:**
  - 201 response from API.
  - Module appears in the "Pending" section of the page.
  - Module status is `pending`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** The input has `maxLength={20}` on the frontend (`WorkshopModules.jsx:592`). Backend has NO length validation — only frontend enforces it.

---

### TC-MOD-002: Non-admin user cannot see the Create button

- **Feature / Requirement:** `WorkshopModules.jsx:581` — `{isAdmin && <CreateButton />}`
- **Priority:** P0
- **Preconditions:** Regular user logged in.
- **Test Data:** N/A
- **Steps:**
  1. Navigate to a workshop's module page.
- **Expected Result:** "Create" button is NOT rendered. No way to create a module from the UI.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** UI-level guard. Backend also enforces via `authenticateTokenAdmin`.

---

### TC-MOD-003: Non-admin API call to create module is rejected

- **Feature / Requirement:** `authenticateTokenAdmin` middleware on `POST /:workshopid/modules`
- **Priority:** P0
- **Preconditions:** Regular user token.
- **Test Data:** `POST /api/workshops/1/modules` with `{ workshop_module_name: "test" }` using regular user bearer token.
- **Steps:**
  1. Call the API directly with a non-admin token.
- **Expected Result:** 403 `"Access Denied: admin privileges required"`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Backend authorization enforcement.

---

### TC-MOD-004: Module created with empty name

- **Feature / Requirement:** Backend does not validate empty module name.
- **Priority:** P1
- **Preconditions:** Admin user.
- **Test Data:** `{ workshop_module_name: "" }`
- **Steps:**
  1. Call `POST /api/workshops/:id/modules` with empty name (or submit empty field from UI).
- **Expected Result:** Backend accepts the insert — module is created with empty/null name. **This is a gap.** Frontend input allows submitting empty on Enter key press; there's no `trim()` check.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Missing validation. The frontend input has no `required` attribute and `handleSubmit` doesn't check if `moduleName` is empty.

---

### TC-MOD-005: Module delete by admin

- **Feature / Requirement:** `DELETE /api/workshops/:workshopid/modules/:moduleid` (`workshops.js:672–686`)
- **Priority:** P1
- **Preconditions:** Admin token. Module exists.
- **Test Data:** Valid `moduleid`.
- **Steps:**
  1. Call DELETE endpoint.
- **Expected Result:** 201 `"Module Successfully Deleted"`. Module no longer appears in subsequent GET calls.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Uses `moduleExists.length === 1` check — if module doesn't exist returns 404.

---

### TC-MOD-006: Delete non-existent module returns 404

- **Feature / Requirement:** `workshops.js:681`
- **Priority:** P2
- **Preconditions:** Admin token.
- **Test Data:** `moduleid = 99999` (doesn't exist).
- **Steps:**
  1. Call `DELETE /api/workshops/1/modules/99999`.
- **Expected Result:** 404 `"Module Doesn't exist"`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Negative path.

---

## MODULE STATUS TRANSITIONS

---

### TC-MOD-007: Admin manually changes module status via API

- **Feature / Requirement:** `PUT /api/workshops/:workshopid/modules/:moduleid` (`workshops.js:768–779`)
- **Priority:** P0
- **Preconditions:** Admin token. Module exists in `pending` status.
- **Test Data:** `{ newStatus: "open" }`
- **Steps:**
  1. Call `PUT /api/workshops/1/modules/5` with `{ newStatus: "open" }`.
- **Expected Result:** 201 response. Module status updated in DB. Next GET shows `workshop_module_status = "open"`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Backend does NOT validate `newStatus` against an enum. Arbitrary strings (e.g. `"banana"`) would be accepted. See risks section.

---

### TC-MOD-008: Cycle scheduler starts and queues all three transitions

- **Feature / Requirement:** `POST /api/cycle/start/:workshopId` (`cycleScheduler.js:103–200`)
- **Priority:** P0
- **Preconditions:** Admin token. Cycle config saved. At least one pending module with prompts.
- **Test Data:** Workshop with 2 pending modules, each having ≥1 prompt. Preset: `quick_test`.
- **Steps:**
  1. Save cycle config with `quick_test` preset.
  2. Call `POST /api/cycle/start/:workshopId`.
- **Expected Result:**
  - 3 BullMQ jobs enqueued per module: `openModule`, `processModule`, `completeModule`.
  - `cycle_jobs` table populated with all jobs.
  - With `quick_test`, open fires immediately, processing ~2min later, completed ~4min later.
- **Suggested Automation?** Partial (can verify job creation; timing needs observation)
- **Notes / Risk Covered:** Happy path for the automated lifecycle.

---

### TC-MOD-009: Cycle start rejects workshop with no pending modules

- **Feature / Requirement:** `cycleScheduler.js:122–124`
- **Priority:** P1
- **Preconditions:** All modules in the workshop are already `open` or `completed`.
- **Test Data:** Workshop where all modules have status other than `pending`.
- **Steps:**
  1. Call `POST /api/cycle/start/:workshopId`.
- **Expected Result:** 400 `{ error: "No pending modules found for this workshop." }`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Negative path — prevents re-cycling already-active modules.

---

### TC-MOD-010: Cycle start rejects modules without prompts

- **Feature / Requirement:** `cycleScheduler.js:127–146` — validation that every pending module has ≥1 prompt
- **Priority:** P0
- **Preconditions:** Admin has created a module but has not added prompts to it.
- **Test Data:** Pending module with 0 prompts.
- **Steps:**
  1. Save cycle config. Call `POST /api/cycle/start/:workshopId`.
- **Expected Result:** 400 `{ error: "Some modules are missing prompts", modules: [...] }` listing the offending modules.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Critical guard — opening an empty module would give users nothing to respond to.

---

### TC-MOD-011: Worker transitions module from pending → open

- **Feature / Requirement:** `moduleWorker.js:32–33` — `openModule` job sets status to `open`
- **Priority:** P0
- **Preconditions:** Module exists in `pending` status. `openModule` job queued.
- **Test Data:** N/A (worker-driven).
- **Steps:**
  1. Observe module status after `openModule` job fires.
- **Expected Result:**
  - DB: `workshop_module_status = 'open'`.
  - `moduleOpen` notification is enqueued (`moduleWorker.js:56–63`).
  - Corresponding `cycle_jobs` row marked `completed`.
- **Suggested Automation?** Yes (integration test with quick_test preset)
- **Notes / Risk Covered:** Happy path for automated open.

---

### TC-MOD-012: Worker transitions module from open → processing

- **Feature / Requirement:** `moduleWorker.js:36–37` + lines 78–99
- **Priority:** P0
- **Preconditions:** Module in `open` status.
- **Test Data:** N/A.
- **Steps:**
  1. Observe after `processModule` job fires.
- **Expected Result:**
  - DB: `workshop_module_status = 'processing'`.
  - AI analysis jobs enqueued for each prompt in the module.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** The processing transition also triggers downstream AI work.

---

### TC-MOD-013: Worker transitions module from processing → completed

- **Feature / Requirement:** `moduleWorker.js:40–41` + lines 101–148
- **Priority:** P0
- **Preconditions:** Module in `processing` status.
- **Test Data:** N/A.
- **Steps:**
  1. Observe after `completeModule` job fires.
- **Expected Result:**
  - DB: `workshop_module_status = 'completed'`.
  - If ALL modules in the workshop are now completed, `scheduleNextCycle` is called and `materialsReady` notification enqueued.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** End of module lifecycle + auto-repeat trigger.

---

### TC-MOD-014: Worker handles unknown job name gracefully

- **Feature / Requirement:** `moduleWorker.js:44–46` — `default` case logs `Unknown job`
- **Priority:** P2
- **Preconditions:** N/A.
- **Test Data:** Job with name `"unknownJob"` queued to `moduleQueue`.
- **Expected Result:** Worker logs "Unknown job: unknownJob". The subsequent `db.execute` will attempt `SET workshop_module_status = undefined` — this will likely throw a DB error. **Risk: no early return before the UPDATE.**
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Bug: `newStatus` is undefined in the default case but the worker still executes the UPDATE query.

---

## FRONTEND: MODULE LIST & STATUS GROUPING

---

### TC-MOD-015: Modules are grouped by status on the modules page

- **Feature / Requirement:** `WorkshopModules.jsx:276–279` — filters by `open`, `processing`, `completed`, `pending`
- **Priority:** P0
- **Preconditions:** Workshop has modules in multiple statuses.
- **Test Data:** 1 open, 1 processing, 1 completed, 1 pending module.
- **Steps:**
  1. Navigate to the workshop's modules page.
- **Expected Result:**
  - Open modules show under "Open" heading with progress bar.
  - Processing modules show under "Processing" heading.
  - Completed modules show under "Completed" heading.
  - Pending modules show under "Pending" heading.
  - Section headings only render if that status has modules.
- **Suggested Automation?** Yes (Playwright)
- **Notes / Risk Covered:** Core display logic.

---

### TC-MOD-016: Open modules show per-module progress (responses / prompts)

- **Feature / Requirement:** `GET /api/workshops/:workshopid/modulesprogress` (`workshops.js:57–90`); displayed via `OpenButton` in `WorkshopModules.jsx:462–478`
- **Priority:** P0
- **Preconditions:** Open module with 5 prompts. User has responded to 3.
- **Test Data:** N/A.
- **Steps:**
  1. Navigate to workshop modules page.
- **Expected Result:** The open module card shows progress: `3 / 5` (or the equivalent visual bar). The values come from the API's `prompt_count` and `response_count`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** The modulesprogress query only counts modules with `workshop_module_status = "open"`. Progress for processing/completed modules is NOT returned.

---

### TC-MOD-017: Pending modules link to editor for admins, no link for regular users

- **Feature / Requirement:** `WorkshopModules.jsx:552–579`
- **Priority:** P1
- **Preconditions:** Pending module exists.
- **Test Data:** N/A.
- **Steps:**
  1. (Admin) Navigate to modules page → pending module is a clickable link to `/prompts/edit`.
  2. (Regular user) Navigate to modules page → pending module is rendered as a non-clickable card.
- **Expected Result:** Admin gets a Link, regular user gets a static button.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Role-based UI behavior.

---

### TC-MOD-018: Processing modules are accessible only to admins and RSVP holders

- **Feature / Requirement:** `WorkshopModules.jsx:497–520`
- **Priority:** P1
- **Preconditions:** Module in processing status. Regular user without RSVP.
- **Test Data:** N/A.
- **Steps:**
  1. (Admin) → processing module is clickable link.
  2. (User with RSVP) → processing module is clickable link.
  3. (User without RSVP) → processing module is a non-clickable card.
- **Expected Result:** Link rendering depends on `isAdmin || RSVPStatus`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Gating visibility of processing-phase content.

---

## PROGRESS BAR & MODULE-LEVEL PROGRESS

---

### TC-MOD-019: Progress bar shows in header during open-phase module reading

- **Feature / Requirement:** `Root.jsx:24,27` — `isOpenPhaseReader && !isEditor` → `showProgressBar = true`
- **Priority:** P0
- **Preconditions:** User navigates to a prompt within an open module.
- **Test Data:** Open module, route `/workshops/1/modules/2/prompts/3`.
- **Steps:**
  1. Navigate to prompt within an open module (passing `moduleStatus: 'open'` via router state).
- **Expected Result:** Progress bar is visible in the header. Shows `current / max` values.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Progress bar only shows for `open` status — hidden for `processing` and `completed`.

---

### TC-MOD-020: Progress count updates after fetching from API

- **Feature / Requirement:** `WorkshopPromptsPage.jsx:159–178` — `GET /api/workshops/modules/:moduleid/progress`
- **Priority:** P0
- **Preconditions:** User is in a module with 4 prompts, has responded to 2.
- **Test Data:** N/A.
- **Steps:**
  1. Navigate into the module.
- **Expected Result:** Progress context is set to `{ current: 2, max: 4 }`. Progress bar reflects this.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** `max` is set from `promptsList.length` on the frontend (not the API). `current` comes from `GET /modules/:moduleid/progress` → `count`.

---

### TC-MOD-021: Module complete flag set when current === max

- **Feature / Requirement:** `WorkshopPromptsPage.jsx:180–184` — `setModuleComplete(progressState.current === promptsList.length)`
- **Priority:** P1
- **Preconditions:** User has responded to all prompts in the module.
- **Test Data:** Module with 3 prompts, 3 responses.
- **Steps:**
  1. Navigate into the module.
- **Expected Result:** `moduleComplete` state is `true`.
- **Suggested Automation?** Yes (verify via DOM state or behavior)
- **Notes / Risk Covered:** This drives end-of-module behavior when the last prompt is submitted.

---

## RESPONSE SUBMISSION & END-OF-MODULE

---

### TC-MOD-022: Submitting a response via the new endpoint

- **Feature / Requirement:** `POST /api/workshops/:workshopid/modules/:moduleid/prompts/:promptid/response` (`workshops.js:793–826`)
- **Priority:** P0
- **Preconditions:** Authenticated user. Open module.
- **Test Data:** `{ workshop_response_content: {...}, prompt_template_id: 1 }`
- **Steps:**
  1. Respond to a prompt and click submit.
- **Expected Result:**
  - 201 `{ ok: true, prompt_id: <number> }`.
  - Row inserted in `workshop_responses`.
  - For template IDs 1, 3, 6, 7, 9: `workshop_response_acceptance = 1` (auto-accepted).
  - For template ID 4, 8: `workshop_response_acceptance = 0` (requires moderation).
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Auto-accept logic at `workshops.js:806`.

---

### TC-MOD-023: Empty response is blocked on frontend

- **Feature / Requirement:** `WorkshopPromptsPage.jsx:399–411` — `isEmptyResponse(responseData)` guard
- **Priority:** P1
- **Preconditions:** User has not interacted with the prompt template.
- **Test Data:** Default empty responseData.
- **Steps:**
  1. Click submit without selecting/entering anything.
- **Expected Result:** `handleSubmit` returns `false`. No API call made. Console logs "Nothing to submit".
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Client-side guard. Backend has no equivalent empty-response validation.

---

### TC-MOD-024: After last prompt submit, handleEndOfModule determines next action

- **Feature / Requirement:** `WorkshopPromptsPage.jsx:437–497`
- **Priority:** P0
- **Preconditions:** User is on the last prompt of an open module.
- **Test Data:** Module with 3 prompts. User is on prompt 3.
- **Steps:**
  1. Submit response on the last prompt.
- **Expected Result:** `handleEndOfModule` fires:
  - Fetches `modulesprogress` for the workshop.
  - If other unfinished modules exist → sets `nextModulePath` and `remainingModules`.
  - If ALL modules complete → creates RSVP via `POST /api/workshops/rsvp/create`, sets `RSVPEarned = true`.
  - `endOfPrompts` is set to `true`, which renders `ModuleEdge`.
- **Suggested Automation?** Partial (full E2E integration)
- **Notes / Risk Covered:** This is the critical module-completion decision point.

---

### TC-MOD-025: ModuleEdge screen — remaining modules

- **Feature / Requirement:** `EdgePages.jsx:40–66` — `ModuleEdge` component
- **Priority:** P0
- **Preconditions:** User completed module 1, but modules 2 and 3 are unfinished.
- **Test Data:** `remainingModules = 2`.
- **Steps:**
  1. Complete the last prompt in module 1.
- **Expected Result:** Screen shows "Module Complete!" with "2 modules left to RSVP." and "Next" / "Leave" buttons. "Next" links to the first prompt of the next unfinished module.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Verifies correct remaining count and navigation path.

---

### TC-MOD-026: ModuleEdge screen — all modules complete, RSVP earned

- **Feature / Requirement:** `EdgePages.jsx:46–53` — `remainingModules === 0` branch
- **Priority:** P0
- **Preconditions:** User just completed the last prompt of the last open module.
- **Test Data:** `remainingModules = 0`, `RSVPEarned = true`.
- **Steps:**
  1. Complete the final prompt of the final module.
- **Expected Result:** Screen shows "Module Complete!" with "Your RSVP is ready." and "RSVP" / "Leave" buttons. "RSVP" navigates to `/workshops/:workshopId/rsvp/:userId`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Full completion happy path.

---

### TC-MOD-027: RSVP auto-created on final prompt submission (legacy endpoint)

- **Feature / Requirement:** `workshops.js:210–237` — the older POST endpoint checks view-based RSVP readiness
- **Priority:** P1
- **Preconditions:** User has responded to all prompts across all modules in the workshop. Using the legacy endpoint.
- **Test Data:** N/A.
- **Steps:**
  1. Submit the final response through the legacy `POST /:workshopid/modules/:moduleid/prompts/:promptid`.
- **Expected Result:**
  - Compares `number_of_prompts_per_workshop_view.length === user_rsvp_ready_view.length`.
  - If equal → RSVP row inserted, `workshopRsvpUnconfirmed` notification enqueued.
  - 201 with RSVP message.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** The new endpoint (`/response`) does NOT do this RSVP check — the frontend handles it in `handleEndOfModule` instead. **Risk: Two different RSVP-creation code paths exist.**

---

### TC-MOD-028: RSVP created via frontend's handleEndOfModule

- **Feature / Requirement:** `WorkshopPromptsPage.jsx:479–492`
- **Priority:** P0
- **Preconditions:** All modules complete (no unfinished in progressData).
- **Test Data:** N/A.
- **Steps:**
  1. Complete last prompt of last module (triggers handleEndOfModule).
- **Expected Result:** Frontend calls `POST /api/workshops/rsvp/create` with `{ user_id, workshop_id }`. RSVP row created. `RSVPEarned` set to true.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** This is the active code path for RSVP creation in the Vite app.

---

## WORKSHOP DETAIL CARD & RSVP STATUS ON MODULES PAGE

---

### TC-MOD-029: Detail card shows locked state when user has not completed all open modules

- **Feature / Requirement:** `WorkshopModules.jsx:249–266` — `detailCardState` derivation
- **Priority:** P1
- **Preconditions:** User has NOT completed all open modules. No RSVP exists.
- **Test Data:** Workshop with 2 open modules, user completed 1.
- **Steps:**
  1. Navigate to workshop modules page.
- **Expected Result:** Detail card background is black (`#000000`). RSVP button shows a lock icon, is disabled.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Visual gating of RSVP access.

---

### TC-MOD-030: Detail card transitions to rsvp-ready when all open modules completed

- **Feature / Requirement:** `allOpenModulesCompleted` memo at `WorkshopModules.jsx:249–257`
- **Priority:** P1
- **Preconditions:** User has completed all open modules (response_count ≥ prompt_count for each). RSVP may or may not exist yet.
- **Test Data:** N/A.
- **Steps:**
  1. Navigate to modules page after completing all open modules.
- **Expected Result:** Card shows gold/brown background (`#D2A478`). "RSVP" button is active, navigates to RSVP page.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Transitional UI state.

---

### TC-MOD-031: Detail card shows confirmed state when RSVP is confirmed

- **Feature / Requirement:** `detailCardState === 'confirmed'` at `WorkshopModules.jsx:262`
- **Priority:** P1
- **Preconditions:** RSVP exists with `rsvp_confirmation_status = 'confirmed'`.
- **Test Data:** N/A.
- **Steps:**
  1. Navigate to modules page.
- **Expected Result:** Card shows green background (`#57A15E`). Button reads "View RSVP".
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Final confirmed state.

---

## ADMIN: PROMPT EDITOR SUBMIT

---

### TC-MOD-032: Admin submits prompts via editor

- **Feature / Requirement:** `POST /api/workshops/:workshopid/modules/:moduleid/prompts` (`workshops.js:689–749`); triggered from `WorkshopsPromptsEditor.jsx:56–74`
- **Priority:** P0
- **Preconditions:** Admin on the prompt editor page for a pending module.
- **Test Data:** 2 prompts: one Multiple Choice (template 1), one Short Response (template 4).
- **Steps:**
  1. Select "Multiple Choice" from dropdown, configure options, click Next.
  2. Select "Short Response", configure question, click Submit (header button).
- **Expected Result:**
  - API returns 201 `"Prompts Inserted Successfully"`.
  - Prompts are inserted in `workshop_prompts` table.
  - Success message "Prompts added and module is now open!" shown on screen.
  - **Note:** Module status does NOT change to open — the editor comment says "Module stays pending — the cycle scheduler controls status transitions."
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Contrary to the success message text, the module remains `pending`. Status only changes when the cycle scheduler fires or admin manually updates.

---

### TC-MOD-033: Editor prevents advancing without selecting a template

- **Feature / Requirement:** `WorkshopsPromptsEditor.jsx:146–149`
- **Priority:** P2
- **Preconditions:** Admin on editor, no template selected for current prompt slot.
- **Test Data:** N/A.
- **Steps:**
  1. Click Next without selecting a template from the dropdown.
- **Expected Result:** Alert: "Please select a template before proceeding." Prompt index does not advance.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** UX guard.

---

---

## Questions / Risks

1. **No validation on `newStatus` in PUT module status.** `workshops.js:772` blindly sets `workshop_module_status = ?` with whatever string is sent. No enum check. Sending `{ newStatus: "garbage" }` succeeds. **Risk: DB contains invalid status strings.**

2. **Worker default case doesn't return early.** In `moduleWorker.js:44–46`, if `job.name` is unknown, `newStatus` is `undefined`, but the worker still executes `db.execute('UPDATE ... SET workshop_module_status = ?', [undefined, moduleId])`. This will likely set the column to `NULL` or throw. **Bug: Missing `return` in the default case.**

3. **Two RSVP-creation code paths.** The legacy endpoint (`POST /:workshopid/modules/:moduleid/prompts/:promptid` at `workshops.js:210`) creates RSVPs server-side using view comparisons. The newer flow uses the frontend `handleEndOfModule` to call `POST /rsvp/create`. If a user hits the legacy endpoint (e.g., from the CRA app), they get RSVP creation. If they use the new endpoint (`/response`), only the frontend creates the RSVP. **Risk: Inconsistent RSVP creation depending on code path.**

4. **Double `res.send()` in legacy response endpoint.** `workshops.js:231` sends `res.status(201).send(...)` inside the RSVP-if-block, then `workshops.js:233` sends `res.status(201).send(response)` unconditionally. If the RSVP block fires, Express will log a "headers already sent" error. **Bug: Missing `return` before `res.status(201).send(response)`.**

5. **Module name validation gap.** Frontend enforces `maxLength={20}` but backend has no length or empty-string check. Direct API calls can create modules with empty names or names of any length. **Risk: Empty or excessively long module names in DB.**

6. **Progress endpoint only counts `open` modules.** `modulesprogress` query (`workshops.js:66`) filters `WHERE wm.workshop_module_status = "open"`. If a module transitions to `processing` while the user is on the modules page, their progress data disappears. **Risk: Progress bar vanishes mid-session if module transitions.**

7. **Prompt editor success message is misleading.** `WorkshopsPromptsEditor.jsx:275` says "Prompts added and module is now open!" but the code comment at line 65 says "Module stays pending — the cycle scheduler controls status transitions." The message is inaccurate.

8. **No duplicate-response guard on the newer endpoint.** `POST /response` at `workshops.js:809` always does an INSERT. There's no UPSERT or check for existing responses. If a user double-clicks submit, they could get a duplicate row (unless there's a DB unique constraint not visible in code). The comment says "Idempotent upsert" but the SQL is a plain INSERT. **Bug: Comment says upsert, code does INSERT.**

---

## Coverage Summary

- **Module creation:** admin create (UI + API), non-admin rejection, empty name gap, delete (exists/not exists)
- **Status transitions:** manual admin PUT, cycle scheduler start (happy + validation), worker transitions (open/processing/completed/unknown), notification side effects
- **Module list UI:** status grouping, pending/open/processing/completed rendering, role-based linking
- **Progress tracking:** progress bar visibility, count update from API, moduleComplete derivation
- **Response submission:** new endpoint happy path, empty response guard, auto-accept logic
- **End-of-module:** handleEndOfModule decision (remaining modules vs. all complete), ModuleEdge screens, RSVP creation
- **RSVP detail card:** locked/rsvp-ready/confirmed visual states
- **Prompt editor:** admin submit, template guard

---

## Missing Test Scenarios

1. **What happens if the user navigates away mid-module and comes back?** — Does progress persist correctly? What if prompts were added/removed by admin in the interim?
2. **Race condition: module transitions to `processing` while user is mid-submission.** — The response INSERT would succeed, but progress queries stop counting that module.
3. **Duplicate RSVP creation.** — If the user somehow triggers both the legacy and new RSVP paths, or double-clicks, a duplicate RSVP row could be inserted. No unique constraint is visible.
4. **Module with 0 prompts opened manually by admin.** — The cycle scheduler validates this, but the manual `PUT` status endpoint does not.
5. **Concurrent users completing the last module simultaneously.** — Both could trigger RSVP creation; depends on DB constraint behavior.

---

## Best Candidates for Automation

- **TC-MOD-001, 003, 004, 005, 006** — Module CRUD API tests (fast, isolated)
- **TC-MOD-007** — Status transition API (simple PUT, verify DB)
- **TC-MOD-009, 010** — Cycle scheduler validation (API-level, no worker needed)
- **TC-MOD-022, 023** — Response submission (API + frontend validation)
- **TC-MOD-015, 016, 017, 018** — Module list UI grouping (Playwright/Cypress)

---

## Bugs or Suspicious Logic Noticed

1. **`moduleWorker.js` default case — no early return.** Worker will execute `UPDATE ... SET workshop_module_status = undefined` for unknown job names, likely corrupting the DB row.

2. **`workshops.js:231,233` — double response send.** The legacy response POST handler sends `res.status(201)` inside the RSVP-if-block and then again unconditionally. Express will throw "Cannot set headers after they are sent."

3. **`workshops.js:756` — prompt delete bug.** `if (promptExists === 1)` compares the result array to the number `1`, which is always `false`. Should be `promptExists.length === 1`. Prompts can never be deleted via this endpoint.

4. **`workshops.js:806` — comment says "Idempotent upsert" but SQL is a plain INSERT.** A true upsert would use `INSERT ... ON DUPLICATE KEY UPDATE`. As-is, duplicate submissions will either create duplicate rows or throw a unique constraint error (depending on DB schema).

5. **Editor success message (`WorkshopsPromptsEditor.jsx:275`) says "module is now open" but module status is not changed.** Misleading to the admin user.

6. **`PUT /:workshopid/modules/:moduleid` (status change) has no enum validation.** Any string is accepted as a valid status.
