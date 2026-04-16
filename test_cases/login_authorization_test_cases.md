# Manual Test Cases: Login / Authorization

## Feature Scope

**Files analyzed:**

- `back_end/app.js` — JWT middleware (`authenticateToken`, `authenticateTokenAdmin`, `verifyToken`)
- `back_end/users.js` — login endpoint, registration, forgot/reset password, email confirmation
- `front_end/my-app-vite/src/pages/LogInPage.jsx`
- `front_end/my-app-vite/src/pages/ResetPasswordPage.jsx`
- `front_end/my-app-vite/src/pages/ConfirmEmailPage.jsx`
- `front_end/my-app-vite/src/pages/RegistrationPage.jsx`
- `front_end/my-app-vite/src/pages/Settings.jsx` — logout
- `front_end/my-app-vite/src/layout/Root.jsx` — auth state in UI
- `front_end/my-app-vite/src/utils/validation.js`

---

## LOGIN — Happy Path

---

### TC-AUTH-001: Successful login with email

- **Feature / Requirement:** `POST /api/users/login` — email-based authentication
- **Priority:** P0 (Critical)
- **Preconditions:** A registered user exists with email `test@example.com` and a known bcrypt-hashed password.
- **Test Data:** `{ email: "test@example.com", password: "ValidPass1!" }`
- **Steps:**
  1. Navigate to `/login`.
  2. Enter `test@example.com` in the "Email or Username" field.
  3. Enter `ValidPass1!` in the "Password" field.
  4. Click the Log In button (or press Enter).
- **Expected Result:**
  - API returns 200 with `{ message: "Login successful", accessToken: "<JWT>", user: { user_id, email, username, first_name, last_name, user_type, is_admin, avatar_config } }`.
  - `localStorage.accessToken` is set.
  - User is navigated to `/showcases`.
  - No error message displayed.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Core happy path. Verifies JWT issuance, localStorage write, and redirect target.

---

### TC-AUTH-002: Successful login with username

- **Feature / Requirement:** `POST /api/users/login` — username-based login (backend queries `WHERE email = ? OR username = ?`)
- **Priority:** P0
- **Preconditions:** A registered user with username `testuser123` exists.
- **Test Data:** `{ email: "testuser123", password: "ValidPass1!" }`
- **Steps:**
  1. Navigate to `/login`.
  2. Enter `testuser123` in the "Email or Username" field.
  3. Enter valid password and submit.
- **Expected Result:** 200 response, token stored, navigated to `/showcases`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** The frontend sends the value as `email` in the payload body regardless of whether it's an email or username — backend handles the OR lookup.

---

### TC-AUTH-003: JWT payload contains expected claims

- **Feature / Requirement:** Token payload structure (`users.js:97–106`)
- **Priority:** P1
- **Preconditions:** Successful login.
- **Test Data:** Any valid credentials.
- **Steps:**
  1. Perform a successful login via API.
  2. Decode the returned JWT.
- **Expected Result:** Payload contains: `user_id`, `email`, `username`, `first_name`, `last_name`, `user_type`, `is_admin` (boolean), `avatar_config` (object or null), `iat`, `exp`. Token expires in 1 hour (`expiresIn: "1h"` at `users.js:110`).
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Downstream components (`jwtDecode` in `Settings.jsx`, admin checks in `WorkshopsPage`) depend on all these claims existing. Note: JWT payloads are base64-encoded, not encrypted — PII in claims (email, name, etc.) is readable by anyone with the token. This is standard for JWTs and the token is already visible in the Network tab; the `console.log` in `LogInPage.jsx:52` increases surface area by making it more persistent/scrapable.

---

### TC-AUTH-004: Login trims whitespace from email/username input

- **Feature / Requirement:** Frontend sends `emailOrUsername.trim()` (`LogInPage.jsx:50`)
- **Priority:** P2
- **Preconditions:** Registered user `test@example.com`.
- **Test Data:** `"  test@example.com  "`
- **Steps:**
  1. Enter `"  test@example.com  "` (leading/trailing spaces) and valid password.
  2. Submit.
- **Expected Result:** Login succeeds (frontend trims before sending).
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** UX edge case — copy-paste from email clients often includes trailing spaces.

---

## LOGIN — Negative / Validation

---

### TC-AUTH-005: Login fails with wrong password

- **Feature / Requirement:** bcrypt compare failure → 401
- **Priority:** P0
- **Preconditions:** Registered user exists.
- **Test Data:** Correct email, wrong password.
- **Steps:**
  1. Enter valid email and incorrect password.
  2. Submit.
- **Expected Result:**
  - API returns 401 `{ message: "Invalid email/username or password." }`.
  - Frontend displays "Invalid email/username or password".
  - `localStorage.accessToken` is NOT set.
  - User remains on `/login`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** The error message is intentionally vague (does not reveal whether email exists) — verify this.

---

### TC-AUTH-006: Login fails with non-existent email/username

- **Feature / Requirement:** User lookup returns no rows → 401
- **Priority:** P0
- **Preconditions:** No user with email `ghost@example.com` exists.
- **Test Data:** `{ email: "ghost@example.com", password: "anything" }`
- **Steps:**
  1. Enter non-existent email and any password.
  2. Submit.
- **Expected Result:** 401 with message `"Invalid email/username or password."` — same message as wrong-password to prevent user enumeration.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** User enumeration prevention.

---

### TC-AUTH-007: Login with empty email field — frontend validation

- **Feature / Requirement:** `LogInPage.jsx:39–42` checks `!emailOrUsername.trim()`
- **Priority:** P1
- **Preconditions:** On login page.
- **Test Data:** Email field empty, password field populated.
- **Steps:**
  1. Leave email/username blank. Enter a password. Submit.
- **Expected Result:** Error message "Please enter your email or username" displayed. No API call made.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Client-side guard before network request.

---

### TC-AUTH-008: Login with empty password field — frontend validation

- **Feature / Requirement:** `LogInPage.jsx:43–46` checks `!password`
- **Priority:** P1
- **Preconditions:** On login page.
- **Test Data:** Email populated, password empty.
- **Steps:**
  1. Enter an email. Leave password empty. Submit.
- **Expected Result:** Error message "Please enter your password" displayed. No API call made.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Client-side guard.

---

### TC-AUTH-009: Login with both fields empty — backend validation

- **Feature / Requirement:** `users.js:60–62` — returns 400 if `!email || !password`
- **Priority:** P1
- **Preconditions:** N/A (API-level test).
- **Test Data:** `POST /api/users/login` with `{ email: "", password: "" }` or missing body fields.
- **Steps:**
  1. Send POST directly to API with empty/missing email and password.
- **Expected Result:** 400 `{ message: "Email/username and password are required." }`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Backend defense-in-depth. Frontend guards exist but API must reject independently.

---

### TC-AUTH-010: Error message clears on input change

- **Feature / Requirement:** `LogInPage.jsx:21,26` — `if (error) setError('')` on keystroke
- **Priority:** P2
- **Preconditions:** An error message is currently displayed on the login form.
- **Test Data:** N/A.
- **Steps:**
  1. Trigger an error (e.g., submit empty form).
  2. Type any character in either the email or password field.
- **Expected Result:** Error message disappears immediately.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** UX polish.

---

### TC-AUTH-011: Login handles non-401 server errors gracefully

- **Feature / Requirement:** `LogInPage.jsx:59–61` — catch-all for non-401 errors
- **Priority:** P2
- **Preconditions:** Backend is down or returns 500.
- **Test Data:** Valid credentials but backend unreachable or DB down.
- **Steps:**
  1. Attempt login when backend is unavailable.
- **Expected Result:** Frontend shows "Something went wrong. Please try again." (not a raw error or blank screen).
- **Suggested Automation?** No (requires infrastructure manipulation)
- **Notes / Risk Covered:** Resilience / graceful degradation.

---

## JWT MIDDLEWARE / TOKEN VERIFICATION

---

### TC-AUTH-012: Authenticated route rejects request with no token

- **Feature / Requirement:** `verifyToken` in `app.js:71–73` — returns 401 if no `Authorization` header
- **Priority:** P0
- **Preconditions:** N/A.
- **Test Data:** `GET /api/users` with no `Authorization` header.
- **Steps:**
  1. Call any `authenticateToken`-protected route without a token.
- **Expected Result:** 401 response body: `"No Access Token Provided"`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Baseline auth enforcement.

---

### TC-AUTH-013: Authenticated route rejects request with invalid/tampered token

- **Feature / Requirement:** `jwt.verify` throws → `app.js:104` returns 403
- **Priority:** P0
- **Preconditions:** N/A.
- **Test Data:** `Authorization: Bearer invalidjunktoken`
- **Steps:**
  1. Call a protected route with a garbage token.
- **Expected Result:** 403 with body `"Invalid Token: <jwt error message>"`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Tampering resistance.

---

### TC-AUTH-014: Authenticated route rejects expired token

- **Feature / Requirement:** JWT `expiresIn: "1h"` — `jwt.verify` rejects expired tokens
- **Priority:** P0
- **Preconditions:** A JWT that was issued > 1 hour ago.
- **Test Data:** Manually craft an expired token, or wait for expiry.
- **Steps:**
  1. Call a protected route with the expired token.
- **Expected Result:** 403 with `"Invalid Token: jwt expired"`.
- **Suggested Automation?** Yes (create token with past `exp`)
- **Notes / Risk Covered:** Session expiry enforcement.

---

### TC-AUTH-015: Token for deleted user is rejected

- **Feature / Requirement:** `app.js:84–86` — user lookup returns no row → 403 `"Invalid user"`
- **Priority:** P1
- **Preconditions:** A valid JWT for a user who has since been deleted from the DB.
- **Test Data:** JWT with valid signature but `email` not in `users` table.
- **Steps:**
  1. Log in and get a token. Delete the user from DB. Call a protected route.
- **Expected Result:** 403 `"Invalid user"`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Prevents stale tokens from granting access after account removal.

---

### TC-AUTH-016: Admin route rejects non-admin user

- **Feature / Requirement:** `authenticateTokenAdmin` → `requireAdmin && !isAdmin` → 403 (`app.js:91–93`)
- **Priority:** P0
- **Preconditions:** A valid JWT for a regular (non-admin) user.
- **Test Data:** `GET /api/users/list` with a regular user's token.
- **Steps:**
  1. Log in as regular user. Call `/api/users/list`.
- **Expected Result:** 403 `"Access Denied: admin privileges required"`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Privilege escalation prevention.

---

### TC-AUTH-017: Admin route accepts admin user

- **Feature / Requirement:** `authenticateTokenAdmin` passes when `user_type === 'admin'`
- **Priority:** P0
- **Preconditions:** A valid JWT for an admin user.
- **Test Data:** `GET /api/users/list` with admin token.
- **Steps:**
  1. Log in as admin. Call `/api/users/list`.
- **Expected Result:** 200 with list of users.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Happy path for admin access.

---

### TC-AUTH-018: `req.user` is populated with fresh DB data, not just token claims

- **Feature / Requirement:** `app.js:79–100` — verifyToken re-queries DB for `user_type`
- **Priority:** P1
- **Preconditions:** User was regular when token was issued, then promoted to admin in DB.
- **Test Data:** JWT with `user_type: "user"`, but DB now has `user_type: "admin"`.
- **Steps:**
  1. Log in as regular user. Promote user to admin in DB directly. Call admin route with same token.
- **Expected Result:** Access is **granted** because `verifyToken` reads from DB, not token claims. `req.user.is_admin` is `true`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** This is a **positive security property** — role changes take effect immediately without re-login. However, it also means a demotion takes effect immediately (verify with reverse scenario).

---

## FORGOT PASSWORD / RESET PASSWORD

---

### TC-AUTH-019: Forgot password — valid email sends reset link

- **Feature / Requirement:** `POST /api/users/forgot-password` (`users.js:342–371`)
- **Priority:** P0
- **Preconditions:** User with `test@example.com` exists.
- **Test Data:** `{ email: "test@example.com" }`
- **Steps:**
  1. On login page, click "Forgot Password?".
  2. Enter `test@example.com`. Submit.
- **Expected Result:**
  - API returns 200 `{ ok: true }`.
  - A `resetPassword` job is enqueued in `notificationQueue`.
  - Frontend shows "Check your email for a reset link".
- **Suggested Automation?** Partial (API yes, email delivery no)
- **Notes / Risk Covered:** Happy path for password recovery.

---

### TC-AUTH-020: Forgot password — non-existent email still returns 200

- **Feature / Requirement:** `users.js:353` — `if (!user) return res.status(200)` to prevent email enumeration
- **Priority:** P1
- **Preconditions:** No user with `nobody@example.com`.
- **Test Data:** `{ email: "nobody@example.com" }`
- **Steps:**
  1. Enter non-existent email in forgot password form. Submit.
- **Expected Result:** 200 `{ ok: true }`. Frontend shows success message. No notification is queued.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** User enumeration prevention — critical security behavior.

---

### TC-AUTH-021: Forgot password — frontend validates email format

- **Feature / Requirement:** `LogInPage.jsx:68` calls `validateEmail(forgotEmail)` before API call
- **Priority:** P2
- **Preconditions:** On forgot password sub-form.
- **Test Data:** `"notanemail"`
- **Steps:**
  1. Enter `"notanemail"` in the forgot password email field. Submit.
- **Expected Result:** Error "Please enter a valid email address" displayed. No API call.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Client-side validation guard.

---

### TC-AUTH-022: Reset password — valid token and strong password

- **Feature / Requirement:** `POST /api/users/reset-password` (`users.js:375–431`)
- **Priority:** P0
- **Preconditions:** A valid `password_reset` JWT token.
- **Test Data:** `{ token: "<valid>", newPassword: "NewStrong1!" }`
- **Steps:**
  1. Navigate to `/reset-password?token=<valid>`.
  2. Enter new password and confirm it. Submit.
- **Expected Result:**
  - Password is updated (bcrypt-hashed) in DB.
  - Response includes a new `accessToken` for auto-login.
  - `localStorage.accessToken` is set.
  - User is navigated to `/showcases`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Full password reset + auto-login flow.

---

### TC-AUTH-023: Reset password — expired token

- **Feature / Requirement:** Reset tokens expire in 1h (`users.js:358`)
- **Priority:** P1
- **Preconditions:** An expired `password_reset` token.
- **Test Data:** Expired token.
- **Steps:**
  1. Navigate to `/reset-password?token=<expired>`.
  2. Enter new password and submit.
- **Expected Result:** 400 `{ error: "Invalid or expired token: jwt expired" }`. Frontend shows the error. Password is not changed.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Token expiry enforcement.

---

### TC-AUTH-024: Reset password — token with wrong `type` claim rejected

- **Feature / Requirement:** `users.js:383–385` — checks `decoded.type !== 'password_reset'`
- **Priority:** P1
- **Preconditions:** A valid JWT but with `type: 'email_confirm'`.
- **Test Data:** Use an email confirmation token as the reset token.
- **Steps:**
  1. Call `POST /api/users/reset-password` with an `email_confirm` token.
- **Expected Result:** 400 `{ error: "Invalid token type" }`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Cross-purpose token reuse prevention.

---

### TC-AUTH-025: Reset password — missing token in URL shows error

- **Feature / Requirement:** `ResetPasswordPage.jsx:18–25` — renders "Invalid or missing reset link" if `!token`
- **Priority:** P2
- **Preconditions:** N/A.
- **Test Data:** Navigate to `/reset-password` with no `?token=` param.
- **Steps:**
  1. Navigate to `/reset-password` (no query string).
- **Expected Result:** Page displays "Invalid or missing reset link." No form fields shown.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Edge case UX.

---

### TC-AUTH-026: Reset password — frontend validates password complexity

- **Feature / Requirement:** `ResetPasswordPage.jsx:30–37` uses `validatePassword` and `validateConfirmPassword`
- **Priority:** P1
- **Preconditions:** On reset password page with valid token.
- **Test Data:** `"short"` (too short), `"alllowercase1!"` (no uppercase), mismatched confirm.
- **Steps:**
  1. Enter `"short"` → submit → expect "Password must be at least 8 characters".
  2. Enter `"alllowercase1!"` → expect "Password must contain at least one uppercase letter".
  3. Enter valid password, mismatched confirm → expect "Passwords do not match".
- **Expected Result:** Field-level errors are shown. No API call on validation failure.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Validation rules: ≥8 chars, ≤128 chars, uppercase, lowercase, digit, special char, match confirm.

---

## EMAIL CONFIRMATION

---

### TC-AUTH-027: Confirm email — valid token

- **Feature / Requirement:** `GET /api/users/confirm-email?token=<valid>` (`users.js:135–154`)
- **Priority:** P1
- **Preconditions:** User registered but `email_verified = FALSE`. Have a valid `email_confirm` JWT.
- **Test Data:** Valid token.
- **Steps:**
  1. Navigate to `/confirm-email?token=<valid>`.
- **Expected Result:**
  - DB updated: `email_verified = TRUE`.
  - Page shows "Your email has been confirmed!" with a "Log In" button.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Happy path email confirmation.

---

### TC-AUTH-028: Confirm email — expired/invalid token

- **Feature / Requirement:** Tokens expire in 24h. Invalid token → 400.
- **Priority:** P1
- **Preconditions:** An expired or invalid token.
- **Test Data:** Expired `email_confirm` token.
- **Steps:**
  1. Navigate to `/confirm-email?token=<expired>`.
- **Expected Result:** Page shows error message. Resend form is rendered below with email input and "Resend" button.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Expired link recovery path.

---

### TC-AUTH-029: Resend confirmation email — valid flow

- **Feature / Requirement:** `POST /api/users/resend-confirm-email` (`users.js:307–339`)
- **Priority:** P2
- **Preconditions:** User exists with `email_verified = FALSE`.
- **Test Data:** User's email.
- **Steps:**
  1. On the error state of confirm-email page, enter email and click "Resend".
- **Expected Result:** API returns 200 `{ ok: true }`. Page shows "If that email is in our system, a new confirmation link has been sent."
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** The response is always 200 regardless of whether the email exists or is already verified — prevents enumeration.

---

## LOGOUT

---

### TC-AUTH-030: Logout clears token and redirects

- **Feature / Requirement:** `Settings.jsx:73–76` — `localStorage.removeItem("accessToken")` then `navigate("/login")`
- **Priority:** P0
- **Preconditions:** User is logged in.
- **Test Data:** N/A.
- **Steps:**
  1. Navigate to `/profile` (Settings page).
  2. Click the Logout button.
- **Expected Result:** `localStorage.accessToken` is removed. User is navigated to `/login`. Avatar icon is no longer shown in header.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Session termination.

---

## AUTH STATE IN UI

---

### TC-AUTH-031: Root layout hides avatar when not logged in

- **Feature / Requirement:** `Root.jsx:30–31` — `isLoggedIn = !!localStorage.getItem('accessToken')`
- **Priority:** P2
- **Preconditions:** No `accessToken` in localStorage.
- **Test Data:** N/A.
- **Steps:**
  1. Clear localStorage. Navigate to `/login` or `/`.
- **Expected Result:** `AccountAvatarButton` is NOT rendered in the header.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** UI state consistency.

---

### TC-AUTH-032: Settings page redirects unauthenticated user to login

- **Feature / Requirement:** `Settings.jsx:37` — `if (!accessToken) { navigate("/login"); return; }`
- **Priority:** P1
- **Preconditions:** No token in localStorage.
- **Test Data:** N/A.
- **Steps:**
  1. Navigate directly to `/profile` without being logged in.
- **Expected Result:** User is immediately redirected to `/login`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Only Settings implements this guard — see "Questions / Risks" below.

---

## REGISTRATION → AUTO-LOGIN

---

### TC-AUTH-033: Successful registration auto-logs in

- **Feature / Requirement:** `RegistrationPage.jsx:132–137` — immediately calls login after registration
- **Priority:** P0
- **Preconditions:** N/A.
- **Test Data:** Fresh user data.
- **Steps:**
  1. Complete all registration steps.
  2. Submit final step.
- **Expected Result:** User is registered, then automatically logged in (token stored in localStorage). Success overlay is shown. Clicking "Go to Showcases" navigates to `/showcases`.
- **Suggested Automation?** Yes
- **Notes / Risk Covered:** Two sequential API calls (register then login) — verify both succeed atomically from the user's perspective.

---

## Questions / Risks

1. **No frontend route guards for most pages.** Only `Settings.jsx` checks for `accessToken` and redirects to `/login`. Other protected pages (workshops, analytics, etc.) don't have client-side guards — they will make API calls that return 401/403, but the user may see partial UI or confusing errors rather than a redirect. **Risk: Poor UX for expired sessions.**

2. **No refresh token mechanism.** JWT expires in 1 hour (`expiresIn: "1h"`). There is no refresh token flow. After 1 hour, **all** API calls will silently fail with 403. The frontend has no global interceptor to detect this and redirect to login. **Risk: Users will encounter broken UI mid-session with no explanation.**

3. **JWT leaks sensitive data.** The token payload includes `avatar_config` (a potentially large JSON object), `first_name`, `last_name`, `email`, and `username`. JWTs are base64-encoded, not encrypted. Anyone with the token can decode all PII. **Risk: Information exposure if token is logged or leaked.**

4. **No password validation on backend login.** The backend `login` route does not validate password complexity — it only checks bcrypt match. This is technically correct for login, but means there's no enforcement that legacy accounts (created before `validatePassword` was added) have strong passwords. **Risk: Weak legacy passwords persist.**

5. **`avatar_config` parsing in login — silent failure.** `users.js:90–93`: if `avatar_config` JSON is corrupt, it silently sets to `null`. Login succeeds but avatar data is lost. No error is surfaced to the user. **Risk: Silent data corruption.**

6. **No rate limiting on login endpoint.** `POST /api/users/login` has no rate limiting or brute-force protection. **Risk: Credential stuffing / brute force attacks.**

7. **Frontend logs JWT payload to console.** `LogInPage.jsx:52` — `console.log(JSON.stringify(response.data))` logs the full access token to the browser console. **Risk: Token exposure in production.**

---

## Coverage Summary

- **Login happy path:** email login, username login, JWT claims, whitespace trimming
- **Login negative:** wrong password, non-existent user, empty fields (FE + BE), error clearing, server error
- **JWT middleware:** no token, invalid token, expired token, deleted user, admin enforcement, DB re-query freshness
- **Forgot/reset password:** happy path, enumeration prevention, token expiry, token type cross-use, FE validation
- **Email confirmation:** valid token, expired token, resend flow
- **Logout:** token removal and redirect
- **UI auth state:** avatar visibility, settings redirect guard
- **Registration auto-login:** post-registration token storage

---

## Missing Test Scenarios

1. **Concurrent login from multiple devices** — does second login invalidate first? (No — both tokens are valid since there's no token blacklist.)
2. **SQL injection in email/username** — parameterized queries are used, but should verify.
3. **XSS in JWT payload fields** — if `first_name` contains HTML, does it render unsafely anywhere?
4. **Case sensitivity of email login** — MySQL collation may be case-insensitive, but should verify explicitly.
5. **Guest account login** — guest `user_type` accounts can apparently be looked up by login, but they may not have a password set. Behavior is undefined.

---

## Best Candidates for Automation

- **TC-AUTH-001, 002, 005, 006, 009** — API-level login tests (fast, no UI needed)
- **TC-AUTH-012, 013, 014, 015, 016, 017** — JWT middleware (pure API, high coverage per test)
- **TC-AUTH-022, 023, 024** — Reset password API flow
- **TC-AUTH-007, 008, 010** — Frontend form validation (Playwright/Cypress)

---

## Bugs or Suspicious Logic Noticed

1. **`verifyToken` queries DB by `email` only (`app.js:80`), but the `users` table allows login by username too.** If two users somehow share an email (shouldn't be possible, but no unique constraint is visible in code), the `LIMIT 1` could return the wrong user.

2. **Token claims vs. DB divergence.** The JWT payload stores `is_admin`, `user_type`, etc. at sign time, but `verifyToken` re-queries the DB for the authoritative `user_type`. This is correct for security, but means the `is_admin` and `user_type` claims in the JWT payload (read by frontend `jwtDecode` in Settings, WorkshopsPage, etc.) can be **stale** until the user re-logs in. The frontend trusts the token claims for UI decisions (showing admin controls), while the backend trusts the DB. **Risk: UI shows admin controls after demotion until token refresh.**

3. **No `email_verified` check at login.** The login endpoint does not check whether `email_verified` is `TRUE`. A user can register, skip email confirmation entirely, and use the full application. If email verification is meant to gate access, this is a **missing requirement**.

4. **Console logging of password-adjacent data in production.** `users.js:212` logs `req.body` for registration, which includes `user_password` in plaintext. `LogInPage.jsx:52` logs the full API response including the access token. Both should be removed or gated behind `NODE_ENV`.
