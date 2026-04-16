# Manual Test Cases: Notifications (Email & SMS)

## Feature Scope

**Files analyzed:**

- `back_end/services/notificationService.js` — Postmark email + Twilio SMS dispatch, channel-preference routing
- `back_end/queues/notificationQueue.js` — BullMQ queue definition
- `back_end/workers/notificationWorker.js` — all 10 job handlers + helpers (`getEligibleUsers`, `getUserById`, `processShowcaseBatchTickets`)
- `back_end/templates/emails/*.js` — all email templates (confirmEmail, resetPassword, moduleOpen, lastDayToSubmit, materialsReady, workshopRsvpUnconfirmed, showcaseRsvpUnconfirmed, showcaseTicket, newShowcase, guestRegistrationInvite)
- `back_end/users.js` — GET/PUT `/notification-settings`, registration with settings, `confirmEmail` and `resetPassword` enqueue
- `back_end/workshops.js` — `workshopRsvpUnconfirmed` enqueue
- `back_end/showcases.js` — `newShowcase` and `showcaseCreatedFallback` enqueue
- `back_end/stripe.js` — `showcaseTicket` enqueue on payment success
- `back_end/homepage.js` — `guestRegistrationInvite` and `workshopRsvpUnconfirmed` enqueue for guests
- `back_end/workers/moduleWorker.js` — `moduleOpen` and `lastDayReminder` enqueue
- `back_end/migrations/add_notification_settings.sql` — DB schema for settings JSON + monthly tracking
- `front_end/my-app-vite/src/pages/Settings.jsx` — notification preference UI (profile)
- `front_end/my-app-vite/src/pages/RegistrationPage.jsx` — notification preference UI (registration step)

---

## NOTIFICATION SERVICE: CHANNEL ROUTING

---

### TC-NOTIF-001: Email sent when user channel is `email`

- **Feature / Requirement:** `notificationService.js:86–88` — email sent when channel is `email` or `both`
- **Priority:** P0
- **Preconditions:** User has `notification_settings.channel = "email"` and a valid `email` address.
- **Test Data:** Trigger any preference-gated notification (e.g., `moduleOpen`).
- **Steps:**
  1. Set user's notification channel to `email`.
  2. Trigger a moduleOpen notification for that user.
- **Expected Result:** Email is sent via Postmark. No SMS is sent.
- **Suggested Automation?** Yes (mock Postmark/Twilio in integration test)
- **Notes / Risk Covered:** Core routing logic. Verified at `notifyUser` level.

---

### TC-NOTIF-002: SMS sent when user channel is `sms`

- **Feature / Requirement:** `notificationService.js:90–92` — SMS sent when channel is `sms` or `both`
- **Priority:** P0
- **Preconditions:** User has `notification_settings.channel = "sms"` and a valid `user_phone`.
- **Test Data:** Trigger any preference-gated notification.
- **Steps:**
  1. Set user's notification channel to `sms`.
  2. Trigger a notification.
- **Expected Result:** SMS sent via Twilio. No email is sent.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** SMS-only delivery path.

---

### TC-NOTIF-003: Both email and SMS sent when channel is `both`

- **Feature / Requirement:** `notificationService.js:86–92` — both channels active
- **Priority:** P0
- **Preconditions:** User has `channel = "both"`, valid email, valid phone.
- **Test Data:** Trigger any preference-gated notification.
- **Steps:**
  1. Set channel to `both`.
  2. Trigger notification.
- **Expected Result:** Both Postmark email and Twilio SMS are sent concurrently (`Promise.allSettled`).
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Dual-delivery path.

---

### TC-NOTIF-004: No notification sent when channel is `none`

- **Feature / Requirement:** `notificationService.js:82` — early return on `none`
- **Priority:** P0
- **Preconditions:** User has `channel = "none"`.
- **Test Data:** Trigger any preference-gated notification.
- **Steps:**
  1. Set channel to `none`.
  2. Trigger notification.
- **Expected Result:** Neither email nor SMS is sent. Function returns immediately.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Opt-out enforcement.

---

### TC-NOTIF-005: SMS skipped when user_phone is empty/null

- **Feature / Requirement:** `notificationService.js:90` — `&& user.user_phone` check; `sendSms:43` — `if (!to) return`
- **Priority:** P1
- **Preconditions:** User has `channel = "both"` but `user_phone` is null or empty.
- **Test Data:** N/A.
- **Steps:**
  1. Set channel to `both`, leave phone blank.
  2. Trigger notification.
- **Expected Result:** Email is sent. SMS is silently skipped (no error).
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Graceful degradation when phone is missing.

---

### TC-NOTIF-006: Email failure does not block SMS (and vice versa)

- **Feature / Requirement:** `notificationService.js:94` — `Promise.allSettled` used for parallel dispatch
- **Priority:** P1
- **Preconditions:** Channel is `both`. One service is intentionally broken (e.g., invalid Postmark token).
- **Test Data:** N/A.
- **Steps:**
  1. Cause Postmark to reject (bad token).
  2. Trigger notification.
- **Expected Result:** Email fails and is logged. SMS still sends successfully. No unhandled exception.
- **Suggested Automation?** Yes (mock services)
- **Notes / Risk Covered:** `Promise.allSettled` ensures one failure doesn't abort the other.

---

### TC-NOTIF-007: parseSettings defaults to `{ channel: 'both' }` when settings are null

- **Feature / Requirement:** `notificationService.js:63`
- **Priority:** P2
- **Preconditions:** User has `notification_settings = NULL` in DB (e.g., pre-migration user).
- **Test Data:** User with null settings.
- **Steps:**
  1. Trigger a preference-gated notification for this user.
- **Expected Result:** `parseSettings` returns `{ channel: 'both' }`. User receives both email and SMS.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Backward compatibility for users created before the notification_settings column existed.

---

## TRANSACTIONAL NOTIFICATIONS (No Preference Check)

---

### TC-NOTIF-008: Confirm email — always sent regardless of preferences

- **Feature / Requirement:** `notificationWorker.js:410–422` — uses `sendEmail` directly, comment: "Always send, no preference check"
- **Priority:** P0
- **Preconditions:** User just registered.
- **Test Data:** New registration.
- **Steps:**
  1. Register a new user.
  2. Check that `confirmEmail` job is enqueued and processed.
- **Expected Result:**
  - Email sent to the registered address.
  - Subject: `[TEST] CONFIRM_EMAIL — MTC3`.
  - Body contains the user's name and a confirm URL with token.
  - Sent even if user's channel is `none`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Transactional emails must bypass preferences. Only email is sent (no SMS variant).

---

### TC-NOTIF-009: Reset password — always sent regardless of preferences

- **Feature / Requirement:** `notificationWorker.js:427–438` — `sendEmail` directly, no preference check
- **Priority:** P0
- **Preconditions:** User triggered forgot-password.
- **Test Data:** Valid email.
- **Steps:**
  1. Call `POST /api/users/forgot-password` with a valid email.
  2. Observe `resetPassword` job processing.
- **Expected Result:** Email sent with reset URL. Subject: `[TEST] RESET_PASSWORD — MTC3`. Preferences ignored.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Security-critical transactional email.

---

### TC-NOTIF-010: Guest registration invite — always sent regardless of preferences

- **Feature / Requirement:** `notificationWorker.js:444–455` — `sendEmail` directly
- **Priority:** P1
- **Preconditions:** Guest user created via homepage flow.
- **Test Data:** Guest email submission.
- **Steps:**
  1. Submit responses as a guest on the homepage.
  2. Observe `guestRegistrationInvite` job.
- **Expected Result:** Email sent to guest's email. Contains registration URL with `?guest=<userId>&email=<email>`. No SMS.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Onboarding funnel — must always be delivered.

---

## PREFERENCE-GATED NOTIFICATIONS

---

### TC-NOTIF-011: Module Open — sent to eligible users with `module_open = true`

- **Feature / Requirement:** `notificationWorker.js:124–147` — `getEligibleUsers('module_open')`
- **Priority:** P0
- **Preconditions:** Module transitions to `open` via worker. Users exist with `module_open = true` and `channel != 'none'`.
- **Test Data:** Workshop with module. Multiple users: one with `module_open = true`, one with `module_open = false`, one with `channel = 'none'`.
- **Steps:**
  1. Trigger `openModule` job → module becomes open → worker enqueues `moduleOpen`.
  2. Observe `moduleOpen` job processing.
- **Expected Result:**
  - User with `module_open = true`, `channel = 'email'` → email sent.
  - User with `module_open = false` → no notification.
  - User with `channel = 'none'` → no notification.
  - Email subject: `New Module Open — <workshopName>`.
  - SMS contains module name and app URL.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Broadcast notification with sub-option filtering. The `moduleOpen` template is the only one with a fully designed HTML layout (not a test scaffold).

---

### TC-NOTIF-012: Last Day Reminder — filters out users who already completed all prompts

- **Feature / Requirement:** `notificationWorker.js:152–207` — per-user response count check
- **Priority:** P0
- **Preconditions:** Module is open, about to transition to processing. Users exist: one who completed all prompts, one who hasn't.
- **Test Data:** Module with 3 prompts. User A: 3 responses. User B: 1 response. Both have `last_day_reminder = true`.
- **Steps:**
  1. `lastDayReminder` job fires (~12s before processing).
  2. Observe which users receive notifications.
- **Expected Result:**
  - User A (completed) → NOT notified.
  - User B (incomplete) → notified.
  - Email includes deadline date from `cycle_jobs.scheduled_for`.
  - If no `cycle_jobs` row found, deadline shows `"soon"`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Critical UX — don't nag users who already finished. The per-user query loop (line 183–193) is an N+1 pattern for large user bases.

---

### TC-NOTIF-013: Materials Ready — respects `materials_ready` sub-option

- **Feature / Requirement:** `notificationWorker.js:212–237` — per-user settings check
- **Priority:** P1
- **Preconditions:** All modules completed. Worker sends `materialsReady` with eligible user IDs.
- **Test Data:** 2 eligible users: one with `materials_ready = true`, one with `materials_ready = false`.
- **Steps:**
  1. All modules complete → worker enqueues `materialsReady`.
  2. Observe notification delivery.
- **Expected Result:** Only user with `materials_ready = true` receives notification.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Sub-option gating in the worker (not via `getEligibleUsers` — uses manual check loop).

---

### TC-NOTIF-014: Workshop RSVP Unconfirmed — respects `workshop_rsvp` sub-option

- **Feature / Requirement:** `notificationWorker.js:242–263` — checks `settings.workshop_rsvp`
- **Priority:** P0
- **Preconditions:** RSVP created for a user (via module completion or manual creation).
- **Test Data:** User with `workshop_rsvp = true`, user with `workshop_rsvp = false`.
- **Steps:**
  1. RSVP created → `workshopRsvpUnconfirmed` enqueued.
  2. Worker processes job.
- **Expected Result:** User with `workshop_rsvp = true` receives email/SMS. User with `workshop_rsvp = false` does not.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Targeted single-user notification.

---

### TC-NOTIF-015: Showcase Ticket — respects `showcase_ticket` sub-option

- **Feature / Requirement:** `notificationWorker.js:344–368`
- **Priority:** P1
- **Preconditions:** Stripe webhook fires `payment_intent.succeeded` with `metadata.type = 'showcase_ticket'`.
- **Test Data:** User with `showcase_ticket = true`.
- **Steps:**
  1. Simulate successful Stripe payment.
  2. `showcaseTicket` job enqueued and processed.
- **Expected Result:** User receives email/SMS confirming their ticket. Subject includes showcase name and date.
- **Suggested Automation?** Partial (requires Stripe webhook mock)
- **Notes / Risk Covered:** Payment confirmation notification.

---

### TC-NOTIF-016: New Showcase — sent only to non-subscribers with `showcase_announcements = true`

- **Feature / Requirement:** `notificationWorker.js:373–405` — explicit `NOT IN (active subscribers)` query
- **Priority:** P1
- **Preconditions:** Admin creates a new showcase. Mix of subscribers and non-subscribers.
- **Test Data:** 3 users: subscriber with `showcase_announcements = true`, non-subscriber with `showcase_announcements = true`, non-subscriber with `showcase_announcements = false`.
- **Steps:**
  1. Admin creates showcase via `POST /api/showcases`.
  2. `newShowcase` job processes.
- **Expected Result:**
  - Subscriber → NOT notified (they get tickets via `showcaseRsvpUnconfirmed` path).
  - Non-subscriber with `showcase_announcements = true` → notified.
  - Non-subscriber with `showcase_announcements = false` → NOT notified.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Audience segmentation — subscribers and non-subscribers get different notification types for the same event.

---

### TC-NOTIF-017: Showcase RSVP Unconfirmed — sent to subscribers, respects `showcase_announcements`

- **Feature / Requirement:** `notificationWorker.js:313–338`
- **Priority:** P1
- **Preconditions:** Monthly showcase check or batch-ticket creation runs. Subscribers get unconfirmed tickets.
- **Test Data:** 2 subscribers: one with `showcase_announcements = true`, one with `showcase_announcements = false`.
- **Steps:**
  1. `showcaseRsvpUnconfirmed` job fires with user IDs.
  2. Worker processes each user.
- **Expected Result:** Only subscriber with `showcase_announcements = true` is notified.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Sub-option gating for showcase-related notifications.

---

## MONTHLY SHOWCASE CHECK (CRON)

---

### TC-NOTIF-018: Monthly showcase check — sends tickets on the 1st if an upcoming showcase exists

- **Feature / Requirement:** `notificationWorker.js:268–308` — repeatable cron `'0 14 1 * *'`
- **Priority:** P1
- **Preconditions:** An upcoming showcase exists. No monthly record for this month.
- **Test Data:** Showcase with `showcase_status = 'upcoming'` and `showcase_date >= NOW()`.
- **Steps:**
  1. `monthlyShowcaseCheck` fires (cron or manual trigger).
  2. Observe batch-ticket creation and notification dispatch.
- **Expected Result:**
  - Membership tickets created for eligible subscribers.
  - `showcaseRsvpUnconfirmed` job enqueued.
  - `monthly_showcase_notifications` row inserted with `status = 'sent'`.
- **Suggested Automation?** Yes (trigger job manually in test)
- **Notes / Risk Covered:** Monthly lifecycle for subscriber tickets.

---

### TC-NOTIF-019: Monthly showcase check — idempotent on re-run

- **Feature / Requirement:** `notificationWorker.js:276–278` — checks `status === 'sent'` and breaks
- **Priority:** P2
- **Preconditions:** `monthly_showcase_notifications` row exists for this month with `status = 'sent'`.
- **Test Data:** N/A.
- **Steps:**
  1. Trigger `monthlyShowcaseCheck` again for the same month.
- **Expected Result:** Worker logs "Monthly showcase already sent" and skips. No duplicate tickets or notifications.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Idempotency guard for repeatable cron jobs.

---

### TC-NOTIF-020: Monthly showcase check — marks pending when no showcase exists

- **Feature / Requirement:** `notificationWorker.js:298–306`
- **Priority:** P2
- **Preconditions:** No upcoming showcase in DB.
- **Test Data:** N/A.
- **Steps:**
  1. `monthlyShowcaseCheck` fires.
- **Expected Result:** `monthly_showcase_notifications` row inserted with `status = 'pending'`. No tickets or notifications.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Deferred processing — the `showcaseCreatedFallback` handler picks this up later.

---

### TC-NOTIF-021: Showcase created fallback — processes pending monthly row

- **Feature / Requirement:** `notificationWorker.js:461–482`
- **Priority:** P2
- **Preconditions:** `monthly_showcase_notifications` row exists with `status = 'pending'` for current month.
- **Test Data:** Admin creates a showcase after the 1st of the month.
- **Steps:**
  1. Admin creates showcase → `showcaseCreatedFallback` enqueued.
  2. Worker finds pending row, runs `processShowcaseBatchTickets`.
- **Expected Result:** Tickets created for subscribers. Row updated to `status = 'sent'`. Notifications dispatched.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Late-showcase scenario where showcase is created after the monthly cron already ran.

---

## NOTIFICATION SETTINGS API

---

### TC-NOTIF-022: GET notification settings returns stored preferences

- **Feature / Requirement:** `GET /api/users/:id/notification-settings` (`users.js:457–475`)
- **Priority:** P0
- **Preconditions:** Authenticated user with stored notification settings.
- **Test Data:** User with `{ channel: "email", module_open: true, last_day_reminder: false, ... }`.
- **Steps:**
  1. Call `GET /api/users/:id/notification-settings`.
- **Expected Result:** 200 with the parsed JSON settings object.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Happy path for settings retrieval.

---

### TC-NOTIF-023: GET notification settings for non-existent user returns 404

- **Feature / Requirement:** `users.js:465`
- **Priority:** P2
- **Preconditions:** Authenticated user with valid token.
- **Test Data:** `id = 99999`.
- **Steps:**
  1. Call `GET /api/users/99999/notification-settings`.
- **Expected Result:** 404 `{ error: "User not found" }`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Negative path.

---

### TC-NOTIF-024: PUT notification settings — valid channel values

- **Feature / Requirement:** `PUT /api/users/:id/notification-settings` (`users.js:477–506`)
- **Priority:** P0
- **Preconditions:** Authenticated user.
- **Test Data:** `{ channel: "sms", module_open: true, last_day_reminder: false, materials_ready: true, workshop_rsvp: true, showcase_announcements: true, showcase_ticket: false }`
- **Steps:**
  1. Call PUT with valid payload.
- **Expected Result:** 200 `{ ok: true }`. DB updated.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Happy path for settings update.

---

### TC-NOTIF-025: PUT notification settings — rejects invalid channel

- **Feature / Requirement:** `users.js:484–487` — validates against `['none', 'email', 'sms', 'both']`
- **Priority:** P1
- **Preconditions:** Authenticated user.
- **Test Data:** `{ channel: "telegram" }`
- **Steps:**
  1. Call PUT with invalid channel.
- **Expected Result:** 400 `{ error: "Invalid channel value" }`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Input validation.

---

### TC-NOTIF-026: PUT notification settings — rejects non-boolean sub-options

- **Feature / Requirement:** `users.js:490–495` — type check on boolean keys
- **Priority:** P1
- **Preconditions:** Authenticated user.
- **Test Data:** `{ channel: "email", module_open: "yes" }`
- **Steps:**
  1. Call PUT with string value for a boolean field.
- **Expected Result:** 400 `{ error: "module_open must be a boolean" }`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Type validation.

---

### TC-NOTIF-027: PUT notification settings — does not validate user owns the ID

- **Feature / Requirement:** `users.js:478` — uses `authenticateToken` but does NOT check `req.user.user_id === id`
- **Priority:** P1 (Security)
- **Preconditions:** User A is authenticated. User B exists with a different ID.
- **Test Data:** User A calls `PUT /api/users/<UserB_id>/notification-settings`.
- **Steps:**
  1. Log in as User A. Call PUT with User B's ID.
- **Expected Result:** Currently: 200 success — **User A can modify User B's notification settings.** This is a missing authorization check.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** **Bug/Security issue:** Any authenticated user can modify any other user's notification settings via the API. The endpoint only checks authentication, not ownership.

---

## FRONTEND: NOTIFICATION PREFERENCES (Registration)

---

### TC-NOTIF-028: Registration defaults to email-only notifications with all sub-options on

- **Feature / Requirement:** `RegistrationPage.jsx:59–67` — `DEFAULT_NOTIF_SETTINGS`
- **Priority:** P1
- **Preconditions:** On registration page, at the notifications step.
- **Test Data:** N/A.
- **Steps:**
  1. Progress to the notification preferences step.
- **Expected Result:** Master toggle is ON. Text updates toggle is OFF. Channel is `email`. All 6 sub-options are toggled ON.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Default state differs from DB migration default (`both`) and Settings page default (`none`). See risks.

---

### TC-NOTIF-029: Registration requires phone number when text updates are enabled

- **Feature / Requirement:** `RegistrationPage.jsx:275–281` — `validatePhone` called when channel is `sms` or `both`
- **Priority:** P1
- **Preconditions:** User enables text updates on the notification step.
- **Test Data:** Toggle text updates ON, leave phone blank or enter `"123"`.
- **Steps:**
  1. Enable text updates. Leave phone blank. Click Next.
  2. Enter `"123"`. Click Next.
- **Expected Result:**
  - Blank phone: no error (phone is optional per `validatePhone`, returns `''` for empty).
  - `"123"`: error "Please enter a valid 10-digit phone number".
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Phone validation only fires when channel includes SMS. Empty phone is allowed, which means a user with `channel = 'both'` but no phone gets email-only silently.

---

### TC-NOTIF-030: Registration notification settings are saved with the user record

- **Feature / Requirement:** `RegistrationPage.jsx:116–127` — `notification_settings: notifSettings` sent in POST body; `users.js:273` — inserted as JSON
- **Priority:** P0
- **Preconditions:** N/A.
- **Test Data:** Custom notification settings (e.g., toggle off `materials_ready`).
- **Steps:**
  1. During registration, toggle off "Materials ready".
  2. Complete registration.
  3. Verify via `GET /api/users/:id/notification-settings`.
- **Expected Result:** Settings persisted with `materials_ready: false` and other values as configured.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** End-to-end settings persistence from registration.

---

## FRONTEND: NOTIFICATION PREFERENCES (Settings Page)

---

### TC-NOTIF-031: Settings page loads saved notification preferences on mount

- **Feature / Requirement:** `Settings.jsx:56–68` — fetches from `GET /notification-settings`
- **Priority:** P0
- **Preconditions:** User logged in. Has custom notification settings.
- **Test Data:** User with `channel = "sms"`, `module_open = false`.
- **Steps:**
  1. Navigate to `/profile`.
- **Expected Result:** Master toggle is ON. Channel selector shows "Text only". Module opened toggle is OFF.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Correct hydration of saved state.

---

### TC-NOTIF-032: Settings page master toggle disables all notifications

- **Feature / Requirement:** `Settings.jsx:98–99` — toggles between `none` and `email`
- **Priority:** P0
- **Preconditions:** Notifications currently enabled.
- **Test Data:** N/A.
- **Steps:**
  1. Click master toggle to OFF.
- **Expected Result:** Channel set to `none`. PUT fires immediately. Sub-option toggles hidden. No notifications will be delivered.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Immediate persistence via `persistSettings`.

---

### TC-NOTIF-033: Settings page delivery channel cycles through email → sms → both

- **Feature / Requirement:** `Settings.jsx:102–106` — `cycleChannel`
- **Priority:** P1
- **Preconditions:** Notifications enabled, channel starts at `email`.
- **Test Data:** N/A.
- **Steps:**
  1. Click "Email only" button → changes to "Text only".
  2. Click again → changes to "Email & Text".
  3. Click again → back to "Email only".
- **Expected Result:** Each click advances through `["email", "sms", "both"]` cycle. PUT fires on each change.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** UI matches the three valid channel values.

---

### TC-NOTIF-034: Settings page individual sub-option toggles persist immediately

- **Feature / Requirement:** `Settings.jsx:90–96, 192–200`
- **Priority:** P1
- **Preconditions:** Notifications enabled.
- **Test Data:** N/A.
- **Steps:**
  1. Toggle "Materials ready" OFF.
  2. Reload the page.
- **Expected Result:** "Materials ready" is OFF after reload. PUT was fired on toggle. Backend has `materials_ready: false`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Each toggle immediately persists via PUT, no save button needed.

---

## TEMPLATE CONTENT VERIFICATION

---

### TC-NOTIF-035: Module Open email template contains correct dynamic data

- **Feature / Requirement:** `templates/emails/moduleOpen.js` — fully designed HTML template
- **Priority:** P1
- **Preconditions:** Module opening triggers notification.
- **Test Data:** Workshop "Jazz Workshop", Module "Week 1".
- **Steps:**
  1. Trigger `moduleOpen` notification.
  2. Inspect the sent email HTML.
- **Expected Result:**
  - Subject: `New Module Open — Jazz Workshop`.
  - Body contains workshop name in italics, module name in bold.
  - CTA button links to correct workshop modules URL.
  - Footer contains account/contact/unsubscribe links.
- **Suggested Automation?** Yes (template unit test)
- **Notes / Risk Covered:** Only `moduleOpen` has a production-quality template. All others use `[TEST]` scaffold subjects.

---

### TC-NOTIF-036: SMS body contains correct data and app URL

- **Feature / Requirement:** Various SMS strings in `notificationWorker.js` (e.g., line 144, 204, 260)
- **Priority:** P1
- **Preconditions:** User with `channel = 'sms'`.
- **Test Data:** Trigger each notification type.
- **Steps:**
  1. For each notification type, verify the SMS body string.
- **Expected Result:** Each SMS includes: `MTC3 —` prefix, relevant names/dates, and a clickable URL. SMS is a single string (no HTML).
- **Suggested Automation?** Yes (unit tests for SMS string generation)
- **Notes / Risk Covered:** SMS has character limits (~160 for standard). Some SMS bodies may exceed this. No truncation logic exists.

---

## WORKER ERROR HANDLING

---

### TC-NOTIF-037: Worker handles missing module/workshop gracefully

- **Feature / Requirement:** `notificationWorker.js:132` — `if (!mod || !ws) break`
- **Priority:** P2
- **Preconditions:** `moduleOpen` job enqueued with an invalid `moduleId`.
- **Test Data:** `{ moduleId: 99999, workshopId: 1 }`
- **Steps:**
  1. Enqueue `moduleOpen` job with non-existent module.
- **Expected Result:** Worker breaks out of the case. No notification sent. No crash.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Same pattern exists for most notification types — they all break on missing DB rows.

---

### TC-NOTIF-038: Worker handles unknown job name

- **Feature / Requirement:** `notificationWorker.js:484–485` — default case
- **Priority:** P2
- **Preconditions:** Job with name `"foobar"` enqueued to `notificationQueue`.
- **Test Data:** N/A.
- **Steps:**
  1. Enqueue unknown job.
- **Expected Result:** Worker logs `[notificationWorker] Unknown job: foobar`. No crash.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Unlike the module worker, this default case is safe — no subsequent DB operations.

---

---

## Questions / Risks

1. **Three different default channel values.** The DB migration defaults to `channel: 'both'` (line 8 of migration). The registration page defaults to `channel: 'email'` (`RegistrationPage.jsx:60`). The Settings page defaults to `channel: 'none'` (`Settings.jsx:9`). **Risk:** If a user is created through a code path that doesn't set `notification_settings` (e.g., old registration flow, direct DB insert), they get `both` by default — meaning email AND SMS — which may surprise the user. If Settings can't fetch saved prefs, it defaults to `none`, hiding all toggles.

2. **No ownership check on PUT /notification-settings.** `users.js:478` uses `authenticateToken` but does not verify `req.user.user_id === req.params.id`. Any authenticated user can modify any other user's notification preferences. **Bug: IDOR vulnerability.**

3. **`getEligibleUsers` uses string interpolation in SQL.** `notificationWorker.js:49` — `'$.${subOption}'` — the `subOption` parameter is embedded via template literal into the SQL string. While `subOption` is always a hardcoded string from worker code (never user input), this is a maintenance risk — if this helper were ever called with external input, it would be a SQL injection vector.

4. **All email templates except `moduleOpen` use `[TEST]` subject prefixes.** Templates like `confirmEmail`, `resetPassword`, `lastDayToSubmit`, etc. still have `[TEST]` in their subjects (e.g., `[TEST] CONFIRM_EMAIL — MTC3`). **Risk:** These will look unprofessional if sent to real users. Likely a leftover from development.

5. **N+1 query pattern in `lastDayReminder`.** `notificationWorker.js:183–193` loops over all eligible users and runs a per-user response count query. For large user bases, this will be slow. Could be optimized with a single query using GROUP BY.

6. **No retry/dead-letter configuration on the notification queue.** The queue is created with no explicit `defaultJobOptions` for retries or backoff. If Postmark or Twilio are temporarily unavailable, the job will fail and not be retried (BullMQ defaults may apply, but there's no explicit configuration).

7. **SMS length is not validated.** Some SMS bodies (e.g., `newShowcase` at line 402) could exceed 160 characters, leading to multi-segment messages and higher Twilio costs. No truncation or length check exists.

8. **`showcaseRsvpUnconfirmed` is gated by `showcase_announcements` sub-option (`notificationWorker.js:327`), not `showcase_ticket`.** This means the "showcase RSVP" notification shares a toggle with "new showcase announcements." A user who wants ticket confirmations but not new showcase promotions cannot distinguish them.

---

## Coverage Summary

- **Channel routing:** email-only, sms-only, both, none, missing phone, failure isolation, null settings fallback
- **Transactional (3):** confirmEmail, resetPassword, guestRegistrationInvite — all bypass preferences
- **Preference-gated (7):** moduleOpen, lastDayReminder, materialsReady, workshopRsvpUnconfirmed, showcaseTicket, newShowcase, showcaseRsvpUnconfirmed — each with sub-option filtering
- **Monthly cron:** happy path, idempotency, pending state, fallback on late showcase creation
- **Settings API:** GET, PUT (valid + invalid channel + invalid boolean type), IDOR vulnerability
- **Frontend (Registration):** defaults, phone validation, persistence
- **Frontend (Settings):** load saved prefs, master toggle, channel cycle, sub-option toggle
- **Templates:** dynamic data verification, SMS content
- **Error handling:** missing DB rows, unknown job names

---

## Missing Test Scenarios

1. **Rate limiting on notification sending.** No rate limit exists for Postmark or Twilio calls. If 10,000 users are eligible for a `moduleOpen` notification, all emails fire in a tight loop. Postmark and Twilio both have rate limits.
2. **Unsubscribe link in emails.** The `moduleOpen` template includes an "unsubscribe" link in the footer, but it just links to the app URL — there's no actual unsubscribe handler or one-click unsubscribe header. CAN-SPAM compliance risk.
3. **Email deliverability testing.** Postmark bounce/spam complaint handling. No webhook handler for Postmark delivery events.
4. **Phone number format.** Frontend validates 10 digits, but Twilio requires E.164 format (e.g., `+1XXXXXXXXXX`). The stored `user_phone` may not be E.164. **Risk: SMS delivery failure.**
5. **Notification when user is deleted.** If a user is deleted between job enqueue and worker processing, `getUserById` returns undefined, and the worker breaks — but the job is marked complete. No alerting.

---

## Best Candidates for Automation

- **TC-NOTIF-001–007** — Channel routing logic (unit-testable with mocked Postmark/Twilio)
- **TC-NOTIF-008, 009, 010** — Transactional email dispatch (integration with mocked email service)
- **TC-NOTIF-022–027** — Settings API (pure HTTP, no external deps)
- **TC-NOTIF-025, 026** — Validation negative cases (fast, isolated)
- **TC-NOTIF-035** — Template unit tests (pure function, no I/O)

---

## Bugs or Suspicious Logic Noticed

1. **IDOR on PUT /notification-settings.** Any authenticated user can update any other user's notification settings. Missing `req.user.user_id === req.params.id` check.

2. **`[TEST]` subject prefixes on 8 of 10 email templates.** Only `moduleOpen` has a production subject. All others (`confirmEmail`, `resetPassword`, `lastDayToSubmit`, `materialsReady`, `workshopRsvpUnconfirmed`, `showcaseRsvpUnconfirmed`, `showcaseTicket`, `guestRegistrationInvite`, `newShowcase`) use `[TEST]` prefixed subjects and minimal HTML scaffolding.

3. **Phone number format mismatch.** Frontend validates 10 raw digits. Twilio requires E.164 (`+1XXXXXXXXXX`). No formatting step exists between DB storage and `sendSms(to, body)`. SMS delivery will likely fail for US numbers stored as `"1234567890"` instead of `"+11234567890"`.

4. **`getEligibleUsers` SQL uses template literal interpolation** for the JSON path (`'$.${subOption}'`). Safe today because `subOption` is always a hardcoded string, but fragile if the function is ever generalized.

5. **`showcaseRsvpUnconfirmed` uses `showcase_announcements` toggle** instead of a dedicated `showcase_rsvp` sub-option. Users can't separately control "new showcase" announcements vs. "your RSVP" confirmations.

6. **No explicit retry config on notification queue.** Failed email/SMS sends are not automatically retried.
