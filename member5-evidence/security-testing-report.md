# Security Testing Report — EventEase

**Member 5 – Security & Quality Assurance (EC4206 Section 3.7)** · Target: local copy only · Date: 2026-11-23/24 · Detailed per-test records: `owasp-test-results.md`

## 1. Scope and rules of engagement
- **In scope:** the EventEase API (`localhost:5000`) and web app (`localhost:5180`) running from branch `member5-security-qa`, plus its dependencies and source code.
- **Out of scope:** any public site, the production deployment, the Gemini AI service, load/performance testing (Member 4).
- **Safety:** only seeded demo accounts and a self-registered QA account were used; brute-force tests targeted the QA account only; destructive actions (cancelling real bookings, ReDoS against the live server) were avoided; no dependency was upgraded; no secret appears in reports or screenshots.

## 2. Approach
Grey-box testing against the OWASP Top 10: black-box requests (curl, Node `fetch`, Chrome automation) guided by a read of the source (routes, controllers, middleware, `app.js`, `vercel.json`, deployment doc). 53 tests were recorded with expected vs actual results (`owasp-test-results.md`) and evidence images in `screenshots/`.

## 3. Results at a glance
37 PASS · 14 FAIL · 1 OBSERVATION · 1 NOT TESTED. Executed pass rate **72.5 %**.

| Area | Verdict |
|---|---|
| **A01 Access control** | **Strong.** Admin/organizer/attendee restrictions, IDOR on bookings (404 with no data leaked), cross-organizer edit/delete/publish/attendee-list (403), forged and `alg:none` tokens (401), mass assignment of `role` (blocked). |
| **A02 Sensitive data** | **Good.** HttpOnly + SameSite=Lax cookie; JWT holds only user id; no password hash/reset token in responses; nothing in local/session storage; admin quick-login credentials are not in a production bundle (dev-only). `Secure` must be re-checked on HTTPS. |
| **A03 Injection / XSS** | **Mostly good.** NoSQL operator objects rejected on login/register; query-string operators inert; XSS payloads in event title, contact form and profile name rendered as text. **Weak:** three endpoints crash with HTTP 500 on object input; `profileImage` unvalidated server-side; review endpoints unreachable so review XSS is untested. |
| **A05 Misconfiguration** | **Mixed.** Helmet headers present, body-size limit works, `.env` ignored. **Weak:** CORS reflects any origin outside production, production frontend config has no headers, 500s expose internal messages. |
| **A06 Components** | **Weak.** 3 high + 2 moderate advisories (fixes available). |
| **A07 Authentication** | **Weak.** No rate limiting/lockout, logout does not revoke the token, no breached-password check, registration reveals existing e-mails. Reset-token flow is good (hashed, one-time, 1 h, weak passwords rejected, old password stops working). |

## 4. Findings by severity (see `bug-register.md`)
| Severity | Findings |
|---|---|
| High | BUG-001 no login rate limit · BUG-010 vulnerable dependencies |
| Medium | BUG-002 unhandled 500 + message leak · BUG-003 logout keeps token valid · BUG-004 CORS fail-open · BUG-006 reviews unreachable · BUG-009 no frontend security headers · BUG-014 ReDoS-prone regex |
| Low | BUG-005, 007, 008, 015 (security hygiene) |
| Critical | none found |

## 5. Attack scenarios the findings enable
1. **Credential guessing at scale** (BUG-001): unlimited password attempts against any account; combined with BUG-007/008 an attacker can enumerate registered e-mails and try common passwords.
2. **Session theft persists** (BUG-003): a leaked cookie works for up to 7 days even after the victim logs out.
3. **Service degradation** (BUG-002, BUG-014, BUG-010): cheap malformed requests cause server errors; a very long e-mail string can block the Node event loop for seconds or more (timing measured offline: 4.7 s at 80 k characters, growing quadratically).
4. **Cross-site abuse if mis-deployed** (BUG-004): if the API is started without `NODE_ENV=production`, any website can call it with the user's cookie (partly limited by SameSite=Lax).

## 6. What was **not** tested
A04 insecure design in depth, A08 integrity, A09 logging/monitoring, A10 SSRF, OWASP ZAP, HTTPS/TLS behaviour, production deployment settings, review XSS, destructive cross-user booking cancellation, live ReDoS impact, performance/DoS load. These are listed so the report is not read as a complete penetration test.

## 7. Evidence integrity statement
Images in `screenshots/` are unedited captures of the real EventEase UI in Chrome, of real PowerShell windows running the shown commands, or of the real SonarQube UI. Raw machine output is in `raw/` (cookies and tokens redacted). Items moved to `generated-panels-not-screenshots/` (script-rendered panels, not captures) and `superseded/` (blank or scrolled-off captures) are **not** part of the evidence. Test data created: QA accounts `qa.m5.*` (several, from repeated harness runs) and `qa.common.*`, a few harmless contact messages marked "[QA-M5]", and event(s) created and deleted by the cross-organizer test.
