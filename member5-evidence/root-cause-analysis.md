# Root Cause Analysis (5 Whys) — EventEase

**Member 5 – Security & Quality Assurance (EC4206 Section 3.8)**

Seven of the eighteen bugs in `bug-register.md` were selected because they are the most significant (security impact, a broken feature, or a repeated pattern). Each "why" is backed by code or test output that was actually inspected. Where a cause is a **process inference** (we cannot see the team's discussions), it is marked *(inferred)*.

---

## RCA-1 — BUG-001: No rate limiting on login

**Problem:** 20 wrong-password logins in a row all returned HTTP 401 and the right password then still worked (A07-01).

| # | Why? | Evidence |
|---|---|---|
| 1 | Why can an attacker guess passwords without being slowed? | The login handler has nothing that counts or limits attempts (`authController.js` `login`). |
| 2 | Why is there no limiter? | No rate-limit middleware is attached to `/api/auth/*` or anywhere in `app.js`. |
| 3 | Why not, if the package is installed? | `express-rate-limit` is a dependency in `server/package.json`, but a search of `server/src` finds no import of it. It was added and never wired in. |
| 4 | Why was it never wired in? | The auth work concentrated on validation (zod) and hashing (bcrypt, 12 rounds); abuse cases such as brute force were not an acceptance criterion *(inferred)*. |
| 5 | Why was it not caught later? | The existing `testSuite.js` only tests happy paths (register, login, booking …); no negative or abuse test exists, and there was no security review before this assignment. |

**Root cause:** a security control was installed but never integrated, and no abuse-case requirement or test existed to expose the gap.
**Corrective action:** add `rateLimit({ windowMs: 15*60*1000, limit: 10 })` to `/api/auth/login`, `/register`, `/forgot-password`; return 429.
**Preventive action:** add "abuse cases" to the definition of done for any auth endpoint; add an automated test that fires N bad logins and expects 429; fail CI if a dependency is declared but unused (`depcheck`).

---

## RCA-2 — BUG-002: HTTP 500 with internal error text

**Problem:** `forgot-password`, `reset-password` and `contact` crash with `TypeError` on object-valued fields and return the JavaScript message to the client (A03-02/03/04).

| # | Why? | Evidence |
|---|---|---|
| 1 | Why did the request return 500? | `forgotPassword` calls `email.includes('@')`; with an object this throws `email.includes is not a function`. `contactController` calls `name.trim()`; `resetPassword` passes the token to `crypto.createHash().update()`. |
| 2 | Why do they assume strings? | These handlers read `req.body` directly and only test for truthiness. |
| 3 | Why is validation different from login/register? | `login` and `register` use zod schemas (and correctly return 400 for the same attack, test A03-01/A03-05); the three failing endpoints use hand-written checks. |
| 4 | Why is there no shared validation layer? | Each controller validates in its own way; no middleware applies a schema before the handler runs *(inferred from code structure)*. |
| 5 | Why does the TypeError reach the user? | `errorHandler.js` returns `err.message` for every status, including 500. |

**Root cause:** inconsistent input validation (zod not applied to every endpoint) combined with an error handler that exposes internal messages.
**Corrective action:** add zod schemas for the three endpoints; in `errorHandler`, return a fixed message such as "Something went wrong" when `status >= 500` and log the real error server-side.
**Preventive action:** a `validate(schema)` middleware used by every route; add "wrong-type input" cases to the API tests; enable the SonarQube/ESLint rule set that flags unvalidated input.

---

## RCA-3 — BUG-003: Logout does not invalidate the token

**Problem:** A cookie copied before logout still returns the user's profile afterwards (A07-05).

| # | Why? | Evidence |
|---|---|---|
| 1 | Why does the old cookie still work? | `protect` accepts any JWT with a valid signature whose user is active. |
| 2 | Why does a valid signature suffice? | The server keeps no session state; the JWT is the session (`createToken`, 7-day expiry). |
| 3 | Why does logout not help? | `logout` only calls `res.clearCookie(...)`, which affects the browser, not the token. |
| 4 | Why is there no revocation? | The `User` model has no token-version/`jti` field and there is no deny-list. |
| 5 | Why was this design chosen? | Stateless JWTs are the simplest way to authenticate an SPA with a separate API; the revocation trade-off was not addressed *(inferred)*. |

**Root cause:** stateless JWT design with no server-side revocation mechanism.
**Corrective action:** add `tokenVersion` to `User`, put it in the JWT, compare in `protect`, increment on logout/password reset.
**Preventive action:** shorten token lifetime (e.g. 1 h) with refresh, and add a "token invalid after logout/password change" test.

---

## RCA-4 — BUG-004: CORS trusts every origin outside production

**Problem:** `Origin: https://evil.example` receives `Access-Control-Allow-Origin: https://evil.example` plus `Allow-Credentials: true` (A05-03).

| # | Why? | Evidence |
|---|---|---|
| 1 | Why is an unknown origin allowed? | In `app.js` the CORS callback returns `callback(null, true)` whenever `NODE_ENV !== 'production'`. |
| 2 | Why was a blanket rule added? | The comment says "permissive for local development"; the dev server ran on several ports (ports 5180, 5181 and 5182 were observed in use at the same time on this machine, and the allow-list also names 5173/5174/3000). |
| 3 | Why is that not needed? | `vite.config.js` already proxies `/api` to the backend, so the browser talks to one origin and CORS is not involved. |
| 4 | Why does the relaxation matter? | The secure behaviour depends on an environment variable; if production is started without `NODE_ENV=production`, the API fails open. |
| 5 | Why was it written that way? | Convenience was favoured over a secure default *(inferred)*; an allow-list already exists in the same file but is bypassed. |

**Root cause:** environment-dependent security relaxation (fail-open default).
**Corrective action:** remove the `NODE_ENV` bypass and rely on the allow-list (plus the Vite proxy for development).
**Preventive action:** a startup check that refuses to boot with a missing `NODE_ENV`/`CLIENT_URL`, and a test that asserts an unknown origin gets no CORS headers.

---

## RCA-5 — BUG-006: Review endpoints unreachable

**Problem:** every review URL returns 404/401 and the client never calls reviews (A03-09).

| # | Why? | Evidence |
|---|---|---|
| 1 | Why does `GET /api/events/:id/reviews` return 404? | No such route exists; `eventRoutes.js` does not include reviews. |
| 2 | Why does `GET /api/reviews` return "Event not found"? | `getEventReviews` reads `req.params.id`, which is `undefined` on this path. |
| 3 | Why is it `undefined`? | `app.js` mounts `app.use('/api/reviews', reviewRoutes)` without an `:id` segment, although the router was created with `mergeParams: true` (which only helps when mounted under a path that has the parameter). |
| 4 | Why was the mismatch not noticed? | No client code, API-contract entry (`docs/api-contract.md` has no reviews section) or test in `testSuite.js` exercises reviews. |
| 5 | Why was the feature left half-integrated? | Backend code was written ahead of the UI and contract without an end-to-end check *(inferred)*. |

**Root cause:** route mount path does not match the handler contract, and nothing (contract, UI, test) verified the feature end to end.
**Corrective action:** mount as `app.use('/api/events/:id/reviews', reviewRoutes)` (and `DELETE /api/reviews/:id` separately), or change handlers to take `eventId` from the path they are mounted on.
**Preventive action:** document every endpoint in `api-contract.md` and add one integration test per route; track features in a backlog with a "demoable end-to-end" acceptance rule.

---

## RCA-6 — BUG-014: Email regex with quadratic backtracking

**Problem:** an 80 000-character string takes 4.7 s to test; timings roughly quadruple when the input doubles (screenshot `owasp-24`).

| # | Why? | Evidence |
|---|---|---|
| 1 | Why is matching slow? | The engine backtracks over many ways to split the string around `.` and `@`. |
| 2 | Why does it backtrack so much? | In `[^\s@]+\.[^\s@]+$` the `.` is also matched by `[^\s@]`, so the same characters can be assigned to either group. |
| 3 | Why was this pattern used? | A short, common "email-ish" pattern was copied into three places (`contactController.js:9`, `User.js:21`, client `validate.js:5`) instead of using the zod `.email()` already used for auth. |
| 4 | Why can attackers feed it long input? | `contactController` applies the regex to the raw `email` with no length cap; the only limit is the 2 MB body limit. |
| 5 | Why was it not found earlier? | No static analysis ran before this assignment; the first SonarQube scan flagged all three (rule S8786). |

**Root cause:** backtracking-prone regex applied to unbounded input, with no static-analysis gate.
**Corrective action:** validate with zod `z.string().trim().max(254).email()` (or add `.max(254)` before the regex).
**Preventive action:** run SonarQube (rule S8786) and `eslint-plugin-security`'s `detect-unsafe-regex` in CI and fail the build on new findings.

---

## RCA-7 — BUG-011: Insufficient colour contrast

**Problem:** 156 elements on 17 of 21 pages fail WCAG AA contrast (axe-core).

| # | Why? | Evidence |
|---|---|---|
| 1 | Why is text hard to read? | White text on orange `#f97316` is 2.8:1; teal `#14b8a6` on white 2.48:1; `slate-400` `#90a1b9` on white 2.63:1 (need 4.5:1). |
| 2 | Why those colours? | Light Tailwind palette steps (orange-500, teal-500, sky-500, slate-400) are used directly for text and buttons. |
| 3 | Why were light steps chosen for text? | They match the bright, playful brand look; contrast was not part of the colour decision *(inferred)*. |
| 4 | Why not caught during development? | No accessibility check (axe, Lighthouse) is part of the workflow; visual review alone does not reveal ratios. |
| 5 | Why is accessibility not checked? | It is not in the definition of done or the test plan *(inferred)*. |

**Root cause:** brand colours were applied to text without contrast validation, and no automated accessibility check exists.
**Corrective action:** darken text/button colours (e.g. orange-600/700 with white text, teal-700, slate-500/600 for secondary text).
**Preventive action:** define contrast-checked colour tokens; run `@axe-core/playwright` or Lighthouse CI on key pages in the pipeline.

---

## Pattern across the analyses

Three themes explain most of the defects: **(1)** controls added but not enforced end to end (rate limit, review route), **(2)** inconsistent validation and error handling between endpoints, and **(3)** no automated negative/security/accessibility testing in the workflow. Fixing the process (a shared validation layer, abuse-case tests, SonarQube + axe in CI) prevents whole classes of bugs, not just these instances.
