# MVP Product Memory

This document captures current product decisions for the MTC3 portal MVP. Treat it as product memory: when implementation details conflict with this file, pause and clarify before changing the intended user experience.

## MVP north star

The MVP should support a complete public-to-member journey:

- Public visitors can discover the project, browse upcoming showcases, and preview workshop interactions.
- Visitors can create accounts and become participants.
- Participants can respond to workshop prompts, see community responses only after they have responded, and earn workshop RSVPs by completing all required modules.
- Admins can author workshops/prompts/materials, review responses, approve/decline visibility, write admin analysis, and manually trigger AI analysis where appropriate.
- Members can claim included showcase tickets.
- Paid non-members can purchase showcase tickets through Stripe.
- Notifications should be polished enough for real users and real admins.

## Current product decisions

### Public homepage and no-account prompt preview

- Public visitors should be able to test the interaction model through current modules from the current workshop on the homepage.
- The current workshop should be selected by nearest upcoming workshop date, not simply latest workshop ID with open modules.
- Workshops must always have a real `workshop_date`; creation without a date is invalid, and migrations must not backfill placeholder dates.
- The preview should hold responses locally until the visitor offers an email.
- Preview responses should survive page refresh using browser storage, preferably `localStorage`, until submitted, cleared, or intentionally replaced.
- After email capture, those preview responses may be submitted to the database.
- The local-response holding behavior needs to be audited and tested.
- Current end-of-preview copy is misleading if it claims that entering an email immediately earns an RSVP. An RSVP requires completing all required modules for the workshop, not just the homepage preview module.
- Preferred copy direction: email capture saves or continues the visitor's work, creates a path into the full workshop, and explains that RSVP eligibility requires completing the remaining required modules.
- Public/guest users may save responses midway through preview participation. After saving, the UI should offer both account creation and a path back to continue remaining modules/prompts.
- Public homepage snippets and public showcase browsing can be read-only without an account. Any CRUD or personalized access requires email/account context.
- Public guest users should not see workshop date/time/location. Show the relevant icon/emoji affordance with a lock icon and tooltip explaining that the details are revealed to registered users, with a link/path to join.
- Public guest users should have more flexible current-workshop preview access:
  - pending modules remain hidden;
  - open modules can be previewed/responded to through the public preview path;
  - processing/completed modules may show public-safe response/analysis previews, with names and private details hidden or locked;
  - when no public-previewable module is available, use simple "New workshop coming soon" messaging with an email opt-in for module-open notifications.
- If a returning guest saves responses again with the same email, the MVP must handle the case intentionally instead of falling into generic errors. Current likely direction: require full signup/login before overwriting existing prompt responses.

### Public archive

- Previous workshops should be accessible to public visitors through a public archive.
- The existing homepage "all workshops" style CTA should route to a real archive page if it does not already.
- The archive can combine public-facing workshop and showcase lists, scoped to archived/completed items.
- Existing completed workshop pages may currently be gated by access token checks; MVP should add a safe public archive/read-only view instead of exposing private participant/admin pages directly.
- Public archive views should avoid exposing private response details, personal analytics, hidden event details, or tools that require login.
- The public archive should create curiosity and confidence: what happened, what kinds of prompts existed, what public/community outputs are safe to show, and how someone can join future workshops/showcases.

### Account and email requirements

- Email should be required for any database-changing user action except:
  - viewing public homepage snippets;
  - creating an account;
  - using the public homepage preview before submission.
- Users need an account/email context to:
  - RSVP to a workshop;
  - purchase tickets;
  - view responses;
  - view modules other than the public homepage preview module;
  - view personal analytics;
  - access the private dashboard.
- If a visitor uses an email that belongs to an existing registered user during the guest/preview flow, keep the preview work local until login rather than attaching it automatically or rejecting it.

### Public vs private dashboard

- The logged-in dashboard should prioritize a "next action" card.
- Users should immediately understand what they can do right now, including when there are no currently open modules.
- If a module is processing and the user responded before it locked, the dashboard should surface that they can view relevant analysis/community output when available.
- The private dashboard should feel like the homepage plus personalized previews into the rest of the app:
  - next action;
  - current workshop/module status;
  - recent/community response previews;
  - personal analytics;
  - RSVP/ticket/membership state;
  - available materials;
  - admin shortcuts when applicable.
- The existing nav directory can help public users discover locked areas. Locked cards should use lock icons and tooltips that explain what login, participation, membership, or access level unlocks.
- App areas that increase curiosity about workshops or showcases should be prioritized in both public and logged-in states.

### Module lifecycle and role access

- Module lifecycle remains `pending → open → processing → completed`.
- `pending`: admins author prompts/materials.
- `open`: eligible users can submit responses.
- `processing`: all prompt submission is locked immediately. Admins can approve/decline responses, write admin analysis, and manually request AI analysis. Admins should not submit their own prompt responses during processing.
- `completed`: users with appropriate access can view final analysis/community output and materials.
- Materials should only become visible to a user when the relevant module is `completed`.
- Workshops may contain multiple modules. RSVP eligibility requires completing all required modules in the workshop.
- RSVP must not be created after only one module in a multi-module workshop unless that workshop truly has only one required module.
- Implementation note: current MVP RSVP readiness checks all distinct prompts in a workshop against the user's distinct prompt responses for that same workshop. This should be revisited if a separate "required module/prompt" flag is added.

### Community responses and analytics visibility

- Participants should see community responses and prompt analytics only after they have responded to that prompt themselves.
- Admins can see responses and analytics before responding because they need to review and approve responses.
- Normal users should only see approved responses in community views and analytics.
- Admin moderation is intentionally human-in-the-loop for MVP.
- Add an admin notification when a user response needs approval.
- Approval standards should be documented clearly enough that a trained AI agent could follow them in the future.
- Future direction: AI may assist with approval/rejection drafts and rationale, but human review remains the MVP standard.
- If a response is declined while the module is still `open`, users should be able to revise and resubmit before the module moves to `processing`.
- Decline/rejection notifications must warn users about the time-sensitive edit window and include a link/button back to the prompt when editing is still allowed.
- Once the module is `processing`, nobody should be able to submit or revise prompt responses, and rejected responses should not be included in analysis.
- If a response is declined, users should eventually have a clear path to ask the team for more context.

### Admin response moderation UI

- The current approval/decline UI needs refinement.
- Instead of showing both approve and decline buttons after a response has already been moderated, use a single dynamic moderation control.
- The dynamic button should make the current state clear and allow toggling/changing the moderation state intentionally, similar to the confirm/unconfirm RSVP and ticket patterns.
- States should clearly communicate approved, declined, and unreviewed/pending.

### AI analysis

- AI analysis is MVP-scoped to:
  - short response prompts;
  - script notation prompts;
  - drag-and-drop prompts.
- AI analysis should be manually triggered by an admin, not automatically queued for every prompt during module processing.
- Formulaic analytics should remain available for structured prompt types where appropriate.
- AI output should be treated as analysis support, not automatic moderation authority for MVP.

### Notifications

- Notifications are a major MVP workstream and are not considered done yet.
- Notification preferences are editable at the user level when accounts are created and later in settings.
- The product should clarify the difference between:
  - channels: email, SMS, both, or none;
  - event preferences: which kinds of messages the user wants to receive.
- Some transactional notifications may need to bypass optional marketing-style preferences, such as password reset, email confirmation, ticket receipts, and security/account messages.
- MVP notifications should include the previously identified core set:
  - email confirmation;
  - password reset;
  - guest registration invite / continue workshop;
  - module opened;
  - last day reminder;
  - materials ready;
  - workshop RSVP created/unconfirmed;
  - showcase created / upcoming showcase;
  - showcase RSVP unconfirmed;
  - showcase ticket confirmation;
  - admin response-needs-approval alert.
  - partial guest preview reminder, if the guest explicitly opts in or saves midway through the preview.

Potential reminder behavior for partial public preview saves:

- remind around 24 hours after partial save;
- or remind around 7 hours before the relevant module/workshop processing cutoff;
- final timing and opt-in semantics still need design.

### Showcases, membership, and tickets

- Showcases should be publicly browsable.
- Add a homepage/nav call-to-action for upcoming showcases.
- Public users may view showcase marketing details, but time and location can be hidden behind login/account creation.
- Locked time/location fields should use a lock icon and tooltip explaining that login or account creation unlocks details.
- Users must register or provide email/account context before buying a ticket because tickets need to be emailed and associated with a user.
- Public users may buy one-off showcase tickets by providing an email before Stripe checkout. Existing registered-user emails should be directed to login rather than silently attaching ticket purchases without authentication.
- Public showcase detail pages can hide attached workshops behind a locked account-creation affordance.
- Fixed paid ticket price for MVP: `$30`.
- Non-member ticket purchase flow should also present membership as an alternative option.
- Members have tickets included in membership. They claim/confirm an included ticket rather than paying per showcase.
- Current implementation may create tickets for every member when a showcase is created; preserve or intentionally redesign that behavior after auditing it.
- Capacity is not an MVP concern yet.
- Paid event tickets should be non-refundable for MVP; add a clear disclaimer on the payment page.
- Membership refunds should be handled automatically for MVP, likely prorated for unused remaining membership time. The exact policy/mechanics still need definition and Stripe audit.

### Workshops vs one-off events

- For MVP, a "workshop" should mean an event in the module/prompt/materials/RSVP/showcase contribution pipeline.
- One-off public events that do not contribute to that pipeline should become a separate event type/table later instead of overloading the workshop model.

### Access levels and merit tiers

The MVP should move beyond a single admin flag toward an access-level model, but implementation can start simple. Merit/access level and staff/admin authority should be separate concepts.

- "Observer" should not be implemented as a persisted user type for MVP. It is a public/logged-out or ticket-only product state, not a separate account category.
- Staff/admin permissions should not be automatically equivalent to merit tier. A user may have high merit without staff authority, and staff may need specific operational permissions independent of merit.

#### Four currencies of power

Every user can accumulate four kinds of standing:

- Participation: modules responded to, workshops attended, reflections submitted.
- Craft: prompt quality ratings, facilitation feedback, peer reviews.
- Service: helping run sessions, mentoring, admin support.
- Stewardship: long-term consistency, conflict handling, reliability.

These combine into an access level.

#### Recommended Year 1 access levels

Start with:

- Participant
- Member
- Analyst
- Designer, likely invite-only at first

Higher levels can be documented but implemented later unless required for MVP operations.

#### Full aspirational ladder

- Level 0 — Observer: audience/ticket buyer; can view public archive, donate/follow, buy tickets, limited RSVP; no internal tools.
- Level 1 — Participant: unlocked by early module/workshop participation; full responses, RSVP priority, profile, contribution stats.
- Level 2 — Member: deeper participation; attendance list, feedback circles, prompt comments, light polls, community insights, theme viewer, archive access.
- Level 3 — Analyst: tagging, theme suggestions, cluster review, pattern flagging, manual labeling, AI override, pattern board.
- Level 4 — Prompt Designer: draft prompts, propose modules, edit prompt flow, set constraints; cannot submit to own prompts.
- Level 5 — Facilitator: run workshops, moderate spaces, resolve conflicts, approve RSVPs, use session tools.
- Level 6 — Steward: approve programs, shape schedules, manage budgets, set policies, access governance tools.

#### Unlock transparency

- Locked tools should be visible but disabled/greyed out where motivationally useful.
- Tooltips should explain the unlock path.
- Example: "Unlocks after 6 workshops + analyst certification."
- "Why locked?" documentation should show the user's path, completed requirements, missing requirements, and next step.

#### Example tool unlocks

- Theme Mapper: Member
- Cluster Editor: Analyst
- Prompt Builder: Designer
- Schedule Editor: Facilitator
- Budget View: Steward

#### Promotion metrics

Candidate thresholds:

- Participant → Member:
  - `modules >= 5`
  - `workshops >= 4`
  - `active_months >= 2`
- Member → Analyst:
  - `modules >= 10`
  - `reflections >= 5`
  - `peer_score >= 4.0`
- Analyst → Designer:
  - `shadow_prompts >= 2`
  - `accepted_suggestions >= 5`
  - `steward_approval = true`
- Designer → Facilitator:
  - `co_led_sessions >= 3`
  - `attendance_rate >= 90%`
  - `feedback >= 4.5`

#### Decay and inactivity

- Use gentle "dormant privileges," not punishment.
- After 3 months inactive: tools become read-only.
- After 6 months inactive: downgrade one level.
- Returning users should have a fast reactivation path.

#### Accountability rules

- Prompt writers cannot submit to their own prompts.
- Facilitators cannot vote on their own sessions.
- Stewards should have public/internal audit logs for governance actions.

## MVP implementation priorities

1. Create a central access policy for roles, module phases, membership, ownership, and visibility. Enforce it in the backend first.
2. Audit and test homepage preview local response capture, email submission, guest handling, and copy.
3. Add a public archive for previous/completed workshops and showcases.
4. Build the logged-in "next action" dashboard.
5. Fix response moderation UX and backend state transitions, including rejected-response editing while still open.
6. Make AI analysis manual and limited to short response, notation, and drag-and-drop prompts.
7. Finish notification templates, preferences, and delivery events.
8. Make showcases publicly browsable with locked time/location for logged-out users.
9. Harden Stripe ticket/subscription flows and add payment disclaimers/refund policy handling.
10. Add a simple access-level foundation and expose locked tool states.
11. Add production readiness checks, smoke tests, and deployment validation.

## Open questions

- If a public visitor finishes the preview and logs in later, should the app offer to merge/import the held responses?
- Should the public archive show every completed module's prompt shells, or only curated workshop/showcase summaries?
- Should archive community snippets be admin-curated, automatically pulled from approved responses, or both?
- What exact automatic membership refund formula should be implemented, and what Stripe events/actions should trigger it?
- What are the minimum MVP tiers in code: Participant/Member/Analyst/Designer only, with Observer remaining non-persisted?
- Should merit/access levels be computed nightly, computed on demand, or stored and updated when qualifying events occur?
- Who counts as staff/admin during MVP after tiers exist: legacy `is_admin`, a separate staff role table, specific permission flags, or some hybrid?
- Where should approval standards live: public docs, internal admin docs, or both?
