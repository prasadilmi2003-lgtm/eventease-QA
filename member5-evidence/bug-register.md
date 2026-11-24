# Bug Register — EventEase

**Member 5 – Security & Quality Assurance (EC4206 Section 3.8)**
**Build under test:** branch `member5-security-qa` (commit `8030765`), development configuration (`NODE_ENV=development`), 2026-11-24
**Method:** every entry below comes from a test that was actually executed (OWASP tests, browser walkthrough with axe-core, SonarQube). Nothing was invented; each bug names its test and evidence. No application code was changed by Member 5, so **all bugs are still open**.

## 1. Rating scales

| Severity | Meaning |
|---|---|
| **Critical** | Direct compromise of accounts/data or total loss of service with no workaround |
| **High** | Realistic attack or failure with serious impact; fix before release |
| **Medium** | Weakens a security control or breaks a feature; fix in the next iteration |
| **Low** | Hardening, minor usability/accessibility or best-practice gap |

| Priority | Meaning |
|---|---|
| **P1** | Fix immediately (cheap and risky to leave) |
| **P2** | Fix in current sprint |
| **P3** | Schedule / backlog |

## 2. Summary

| ID | Title | Severity | Priority | Status | Test |
|---|---|---|---|---|---|
| BUG-001 | No rate limiting or lockout on login | High | P1 | New | A07-01 |
| BUG-002 | Unhandled HTTP 500 with internal error text on forgot/reset-password and contact | Medium | P1 | New | A03-02/03/04, A05-05 |
| BUG-003 | Logout does not invalidate the session token | Medium | P2 | New | A07-05 |
| BUG-004 | CORS trusts every origin (with credentials) outside production | Medium | P2 | New | A05-03 |
| BUG-005 | `profileImage` accepts any string (e.g. `javascript:`) on the API | Low | P3 | New | A03-08 |
| BUG-006 | Review endpoints unreachable (route mounted without event id) | Medium | P2 | New | A03-09 |
| BUG-007 | No common/breached-password check on registration | Low | P3 | New | A07-03 |
| BUG-008 | Registration reveals which e-mails are registered (user enumeration) | Low | P3 | New | A07-04 |
| BUG-009 | Production frontend config has no security headers (CSP, X-Frame-Options …) | Medium | P2 | New | A05-02 |
| BUG-010 | Vulnerable dependencies: 3 high, 2 moderate | High | P1 | New | A06-01/02 |
| BUG-011 | Insufficient colour contrast on 17 of 21 pages (156 elements) | Medium | P2 | New | UX walkthrough / axe |
| BUG-012 | No "skip to content" link on any page | Low | P3 | New | UX walkthrough / axe |
| BUG-013 | 404 page has no `<h1>`; heading levels skipped on 11 pages | Low | P3 | New | UX walkthrough / axe |
| BUG-014 | Email regex has quadratic backtracking (ReDoS) | Medium | P2 | New | SonarQube S8786 + timing |
| BUG-015 | Hard-coded demo password in seed/test/mock code | Low | P3 | New | SonarQube S2068 |
| BUG-016 | Mobile: floating AI-chat button overlaps the Search button | Low | P3 | New | UX walkthrough |

**By severity:** High 2 · Medium 7 · Low 7 · Critical 0 · **Total 16**.
**By source:** security tests 10 · accessibility/usability 4 · SonarQube 2.

## 3. Detailed entries

### BUG-001 — No rate limiting or lockout on login
- **Description:** The login endpoint can be called unlimited times. `express-rate-limit` is listed in `server/package.json` but is never imported anywhere in `server/src`.
- **Steps to reproduce:** 1) Register/use a test account. 2) Send 20 `POST /api/auth/login` requests with a wrong password. 3) Send one request with the correct password.
- **Expected:** HTTP 429 (or temporary lockout) after a small number of failures.
- **Actual:** 20 × HTTP 401, then the correct password still returns HTTP 200.
- **Severity / Priority:** High / P1 · **Status:** New
- **Related test:** A07-01 · **Evidence:** `screenshots/owasp-18-login-rate-limit-terminal.png`

### BUG-002 — Unhandled HTTP 500 with internal error text
- **Description:** `forgot-password`, `reset-password` and `contact` call string methods on unvalidated JSON fields. Sending an object instead of a string throws a `TypeError`; the central error handler returns `err.message` for every 500.
- **Steps:** `POST /api/auth/forgot-password` with `{"email":{"$ne":null}}`; `POST /api/auth/reset-password` with `{"token":{"$ne":null},"password":"Abcd1234"}`; `POST /api/contact` with `{"name":{"$ne":1},…}`.
- **Expected:** HTTP 400 validation error; generic message for server faults.
- **Actual:** HTTP 500 with `"email.includes is not a function"`, a Node `"data" argument must be of type string…` message and `"name.trim is not a function"`.
- **Severity / Priority:** Medium / P1 · **Status:** New
- **Related test:** A03-02, A03-03, A03-04, A05-05 · **Evidence:** `screenshots/owasp-15-error-handling-500-terminal.png`

### BUG-003 — Logout does not invalidate the session token
- **Description:** `POST /api/auth/logout` only clears the cookie in the browser. The 7-day JWT stays valid on the server.
- **Steps:** Log in, save the cookie, call `/api/auth/logout`, replay the saved cookie on `GET /api/auth/me`.
- **Expected:** HTTP 401. **Actual:** HTTP 200 with the user profile.
- **Severity / Priority:** Medium / P2 · **Status:** New
- **Related test:** A07-05 · **Evidence:** `screenshots/owasp-20-session-after-logout-terminal.png`

### BUG-004 — CORS trusts every origin outside production
- **Description:** `server/src/app.js` accepts any origin when `NODE_ENV !== 'production'` and `credentials: true`.
- **Steps:** `curl -H "Origin: https://evil.example" http://localhost:5000/api/auth/me` and an `OPTIONS` pre-flight.
- **Expected:** No `Access-Control-Allow-Origin` for an untrusted origin.
- **Actual:** `Access-Control-Allow-Origin: https://evil.example` and `Access-Control-Allow-Credentials: true`.
- **Severity / Priority:** Medium (Low when `NODE_ENV=production` is set as in `docs/deployment.md`) / P2 · **Status:** New
- **Related test:** A05-03 · **Evidence:** `screenshots/owasp-17-cors-untrusted-origin-terminal.png`

### BUG-005 — `profileImage` not validated server-side
- **Description:** Only the React form checks that the image URL is http(s). `PATCH /api/auth/me` stores any string.
- **Steps:** Log in as a test account; `PATCH /api/auth/me {"profileImage":"javascript:alert(1)"}`.
- **Expected:** HTTP 400. **Actual:** HTTP 200 and the value is stored (it is not rendered unsafely today because `Profile.jsx` re-checks it).
- **Severity / Priority:** Low / P3 · **Status:** New
- **Related test:** A03-08 · **Evidence:** `screenshots/owasp-23-profileimage-no-server-validation-terminal.png`

### BUG-006 — Review endpoints unreachable
- **Description:** `reviewRoutes` is mounted at `/api/reviews`, but its handlers read `req.params.id` (the event id), which that mount path never supplies. The client does not call reviews at all.
- **Steps:** `GET /api/events/:id/reviews`, `GET /api/reviews`, `POST /api/reviews`.
- **Expected:** List/add reviews for an event. **Actual:** 404 `Cannot GET …`, 404 `Event not found`, 401 — the review feature cannot be used.
- **Severity / Priority:** Medium / P2 · **Status:** New
- **Related test:** A03-09 · **Evidence:** `screenshots/owasp-22-review-endpoints-unreachable-terminal.png`

### BUG-007 — No common-password check
- **Description:** Password rules are length 8–72 plus a letter and a digit. `password1` is accepted.
- **Steps:** Register a QA account with `password1`. **Expected:** HTTP 400 (blocklist). **Actual:** HTTP 201.
- **Severity / Priority:** Low / P3 · **Status:** New
- **Related test:** A07-03 · **Evidence:** `raw/api-security-run.json` (test A07-03)

### BUG-008 — User enumeration through registration
- **Description:** Registering an existing e-mail returns "This email is already registered". Login and forgot-password are correctly generic.
- **Steps:** Register `attendee@demo.com`. **Actual:** HTTP 400 with that message.
- **Severity / Priority:** Low / P3 · **Status:** New
- **Related test:** A07-04 · **Evidence:** `screenshots/owasp-19-password-policy-enumeration-terminal.png`

### BUG-009 — No security headers for the production frontend
- **Description:** `client/vercel.json` (documented production host) contains only rewrites. The dev server also returns no CSP, X-Frame-Options, X-Content-Type-Options or Referrer-Policy. Helmet protects the API only.
- **Steps:** `curl -D - http://localhost:5180/`; read `client/vercel.json`.
- **Expected:** Security headers on HTML responses. **Actual:** none.
- **Severity / Priority:** Medium / P2 · **Status:** New
- **Related test:** A05-02 · **Evidence:** `screenshots/owasp-16b-security-headers-frontend-terminal.png`

### BUG-010 — Vulnerable dependencies
- **Description:** `npm audit` reports server: body-parser (high, DoS), mongoose (high, two advisories), minimatch and nodemon (moderate, dev tool); client: follow-redirects (high).
- **Expected:** No high/critical advisories. **Actual:** 3 high, 2 moderate, 0 critical.
- **Severity / Priority:** High / P1 · **Status:** New (nothing upgraded, baseline preserved)
- **Related test:** A06-01, A06-02 · **Evidence:** `screenshots/owasp-01-backend-npm-audit.png`, `owasp-02-frontend-npm-audit.png`, `raw/npm-audit-*.txt`

### BUG-011 — Insufficient colour contrast
- **Description:** axe-core reports WCAG 1.4.3 failures on 17 of 21 pages checked (156 elements). Examples: white text on orange `#f97316` = 2.8:1; category labels teal 2.48:1, sky 2.77:1, pink 3.52:1; `text-slate-400` 2.63:1 (all need 4.5:1).
- **Steps:** Open Home, Explore, Event details, dashboards; run axe-core (`raw/usability-walkthrough-axe.json`).
- **Expected:** ≥ 4.5:1 for normal text. **Actual:** 2.48–3.52:1.
- **Severity / Priority:** Medium / P2 · **Status:** New
- **Evidence:** `screenshots/usability-01-home-visitor.png`, `usability-02-explore-events.png`, `usability-13-organizer-manage-events.png`, `raw/usability-walkthrough-axe.json`

### BUG-012 — No skip-navigation link
- **Description:** None of the 21 pages offers a "skip to main content" link; keyboard users must tab through the whole navigation first (WCAG 2.4.1).
- **Severity / Priority:** Low / P3 · **Status:** New · **Evidence:** `raw/usability-walkthrough-axe.json` (`skipLink: false` on 21/21)

### BUG-013 — Missing `<h1>` on 404; skipped heading levels
- **Description:** The 404 page has no `<h1>` (axe `page-has-heading-one`); 11 pages jump heading levels (axe `heading-order`, e.g. an `<h4>` directly after the page title).
- **Severity / Priority:** Low / P3 · **Status:** New · **Evidence:** `screenshots/usability-07-not-found.png`, `raw/usability-walkthrough-axe.json`

### BUG-014 — Email regular expression with quadratic backtracking
- **Description:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (contactController.js:9, models/User.js:21; a near-identical one in client `validate.js:5`) backtracks polynomially because `.` also matches `[^\s@]`. SonarQube rule S8786 flags all three.
- **Steps:** Time the regex on `'a@' + 'a.'.repeat(n/2) + ' '`.
- **Expected:** Linear time. **Actual:** 138 ms at 10 k chars, 348 ms at 20 k, 1.4 s at 40 k, 4.7 s at 80 k (≈ quadratic). The unauthenticated `/api/contact` accepts bodies up to 2 MB, so one request could block the Node event loop for a very long time (not exercised against the live server to avoid freezing it).
- **Severity / Priority:** Medium / P2 · **Status:** New
- **Evidence:** `screenshots/owasp-24-email-regex-backtracking-terminal.png`, `screenshots/sonarqube-04-issues-code-smells.png`

### BUG-015 — Hard-coded demo password in code
- **Description:** SonarQube S2068 flags `client/src/mock/db.js:127`, `server/src/utils/testSuite.js:87,143`. The same shared demo password seeds the demo attendee/organizer accounts. If the seed script is ever run in production those accounts are guessable.
- **Severity / Priority:** Low / P3 · **Status:** New · **Evidence:** `screenshots/sonarqube-03-issues-vulnerabilities.png`

### BUG-016 — Mobile: AI-chat button overlaps Search
- **Description:** At 375 px width the floating AI-assistant button sits on top of the right end of the hero "Search" button.
- **Severity / Priority:** Low / P3 · **Status:** New · **Evidence:** `screenshots/usability-18-mobile-home.png`

## 4. Items reviewed and deliberately **not** logged as bugs

| Item | Reason |
|---|---|
| Any organizer can self-register (A01-17) | Observation: a design decision, not a defect. Listed in recommendations. |
| Admin password present in the dev-server bundle (A02-04) | Gated by `import.meta.env.DEV`; a fresh production build does not contain it (verified). Dev-only. |
| `Secure` flag off on the cookie (A02-01) | Code sets it only in production; must be re-checked on the deployed site. |
| SonarQube "Promises must be awaited" (S9383, 8 hits) and S6544 | Triaged as probable false positives / very low impact; see `sonarqube-analysis.md`. |
| Contact-message and review XSS | Not exploitable in tested paths (PASS), nothing to log. |

## 5. Positive results (no defect found)

Access control (A01-01 … A01-19), NoSQL operator injection on login/register, XSS in event title, contact form and profile name, token forgery (wrong secret, `alg:none`, garbage), mass assignment of `role`, HttpOnly + SameSite cookie, no secrets in API responses, Helmet headers on the API, request size limit, `.env` ignored by Git, password-reset token lifecycle (one-time, hashed, rejects weak passwords).
