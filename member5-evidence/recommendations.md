# Recommendations — EventEase

**Member 5 – Security & Quality Assurance (EC4206 Section 3.10)** · Every item points to the evidence that justifies it. Only R1 (login rate limiting, BUG-001) has been implemented and verified by Member 5; the rest are proposals for the team.

## 1. Fix first (P1 — small effort, high value)

| # | Recommendation | Fixes | Effort | How |
|---|---|---|---|---|
| R1 | **Rate-limit authentication endpoints** | BUG-001 | ~30 min | `express-rate-limit` is already installed. In `authRoutes.js` apply `rateLimit({ windowMs: 15*60*1000, limit: 10, standardHeaders: true })` to `/login`, `/register`, `/forgot-password`. Re-run test A07-01: expect HTTP 429. |
| R2 | **Validate every request body with zod; hide 5xx details** | BUG-002 | ~1–2 h | Add schemas for `forgot-password`, `reset-password`, `contact`; in `errorHandler.js` return `"Something went wrong"` for `status >= 500` and log the real error. Re-run A03-02/03/04 and A05-05. |
| R3 | **Update vulnerable dependencies** | BUG-010 | ~1 h | `npm audit fix` (non-breaking) in both packages fixes `body-parser`, `mongoose`, `follow-redirects`. Treat `nodemon` (dev only, semver-major) separately. Do **not** use `--force`. Run `npm test` after. |

## 2. Fix this sprint (P2)

| # | Recommendation | Fixes | Notes |
|---|---|---|---|
| R4 | Make logout effective: add a `tokenVersion` (or `jti` deny-list) to the JWT and compare it in `protect`; increment on logout and password reset. Optionally shorten token life (e.g. 1 h + refresh). | BUG-003 | Retest A07-05 → 401. |
| R5 | Remove the `NODE_ENV !== 'production'` bypass in the CORS callback; rely on the allow-list and the Vite proxy. Fail start-up if `NODE_ENV`/`CLIENT_URL` is unset in production. | BUG-004 | Retest A05-03 → no `Access-Control-Allow-Origin`. |
| R6 | Mount review routes correctly (`/api/events/:id/reviews`; `DELETE /api/reviews/:id`), document them in `docs/api-contract.md`, add a test, then wire the UI. | BUG-006 | Re-run A03-09 and test review XSS afterwards (not yet testable). |
| R7 | Add security headers for the production frontend in `client/vercel.json` (`headers` block: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`). | BUG-009 | Verify on the deployed URL. |
| R8 | Replace the three email regexes with `z.string().trim().max(254).email()` (or cap length before matching). | BUG-014 | Re-time with `regex-timing.js`. |
| R9 | Raise contrast: orange-500 buttons → orange-600/700 (or dark text), teal/sky/pink/green text → 600–700 steps, `slate-400` captions → `slate-500/600`. Re-run axe until `color-contrast` is clean. | BUG-011 | Affects 17 pages. |

## 3. Backlog (P3)

| # | Recommendation | Fixes |
|---|---|---|
| R10 | Validate `profileImage` on the server (http/https only, max length). | BUG-005 |
| R11 | Reject common passwords (blocklist or `zxcvbn`), per NIST SP 800-63B. | BUG-007 |
| R12 | Make the registration response non-revealing (generic message, e-mail verification) if enumeration matters. | BUG-008 |
| R13 | Add a skip-to-content link; fix heading order; add an `<h1>` to the 404 page; resolve the chat-button overlap on mobile; give the Home search controls a visible `focus-visible` ring; render navbar actions as a link or a button, not a button inside a link. | BUG-012, 013, 016, 017, 018 |
| R14 | Do not seed the shared-demo-password accounts when `NODE_ENV=production`; keep the demo password out of source (use env/seed config). | BUG-015 |
| R15 | Consider an approval step for self-registered **organizers** (currently anyone can pick the role). | Observation A01-17 |
| R16 | Add a confirmation step (ticket summary) before a booking is submitted. | UX-06 |

## 4. Process improvements (prevent recurrence)

1. **Security tests in the test suite.** Extend `testSuite.js` (or Jest/Supertest) with negative tests: wrong-type inputs, rate limit, forged tokens, cross-role access, CORS origin. Most tests in this report can be re-used as they are (`raw/api-security-run.json` documents each request).
2. **CI pipeline (GitHub Actions)** on every pull request: `npm ci`, `npm audit --audit-level=high`, lint (`oxlint`), unit/API tests, SonarQube scan with a "no new bugs/vulnerabilities" gate, and axe on key pages.
3. **Coverage.** Generate a coverage report so SonarQube shows a real figure (0 % today); target ≥ 60 % on controllers first.
4. **Definition of done** gets three lines: input validated with a schema; abuse case considered (rate limit, auth); accessibility contrast checked.
5. **Extend the usability study**: SUS (n = 5, mean 73.5) is a good start; add task-level measures (success, time, errors) and a larger, independent sample, then re-test after fixing BUG-011, BUG-017 and BUG-018.
6. **Optional extra scan**: run OWASP ZAP baseline against the staging site (not done here).

## 5. Expected effect
Implementing R1–R9 addresses both High bugs and all seven Medium bugs. Eleven of the 14 failed security tests map to those items, so a re-run would be expected to reach about 94 % (48/51); the three remaining failures would be the Low items (A03-08, A07-03, A07-04).

*(This is a projection based on which tests map to which bugs, not a measured result.)*
