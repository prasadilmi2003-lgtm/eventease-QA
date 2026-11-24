# Member 5 Final Report — Security & Quality Assurance

**Course:** EC4206 Software Testing and Quality Assurance · **Project:** EventEase (MERN event-management platform)
**Sections covered:** 3.7, 3.8, 3.9, 3.10 · **Branch:** `member5-security-qa` · **Date:** 2026-11-24
**Nothing was committed or pushed.** The application source code was not modified.

## 1. Executive summary
Member 5 tested EventEase for security, usability/accessibility and code quality. **53 security tests** were recorded (37 PASS, 14 FAIL, 1 observation, 1 not tested; executed pass rate **72.5 %**). Access control and XSS defences are strong; authentication hardening, error handling, CORS, dependencies and production headers are weak. **18 bugs** were logged (0 Critical, 2 High, 7 Medium, 9 Low), seven were analysed with 5-Whys, and a bug lifecycle was defined. SonarQube (Docker) analysed 6,697 lines: Quality Gate **Passed**, ratings Security C / Reliability C / Maintainability A, coverage 0 %, duplication 0.4 %. An expert usability and accessibility inspection of 21 pages found 156 contrast failures on 17 pages; **user testing with participants and the SUS score are still to be done by the team.**

## 2. Requirement checklist

| # | Requirement (from the task sheet) | Status | Deliverable |
|---|---|---|---|
| 1 | Conduct OWASP security testing | **Done** (6 of 10 categories; ZAP optional scan not run) | `owasp-test-results.md`, `security-testing-report.md` |
| 2 | Perform usability testing | **Partly done.** Plan, SUS questionnaire and scoring tool are ready; an expert inspection and a scripted task walkthrough in real Chrome are complete; **participant sessions and the SUS score are not done** (they need real people) | `usability-testing-plan.md`, `usability-heuristic-evaluation.md`, `usability-automated-task-walkthrough.md`, `usability-kit/` |
| 3 | Track bugs | **Done** (18 bugs) | `bug-register.md` |
| 4 | Root Cause Analysis | **Done** (7 bugs, 5 Whys) | `root-cause-analysis.md` |
| 5 | Document the bug lifecycle | **Done** | `bug-lifecycle.md`, `diagrams/bug-lifecycle.png/.svg` |
| 6 | Run SonarQube analysis | **Done** (Docker, real dashboard screenshots) | `sonarqube-analysis.md` |
| 7 | Report quality metrics | **Done** (SUS and task metrics marked n/a) | `quality-metrics.md` |
| 8 | Recommend improvements | **Done** | `recommendations.md` |
| 9 | Agile and DevOps reflection | **Done** (based only on repository evidence; team meetings and tools are not described because they are not recorded) | `agile-devops-reflection.md` |

## 3. Key security results
| Test group | Result |
|---|---|
| Role and ownership checks (A01) | 17/17 executed pass; IDOR response leaks nothing |
| Injection and XSS (A03) | NoSQL, query-operator, event-title / contact / profile XSS all safe; 3 endpoints return 500 on object input |
| Sensitive data (A02) | HttpOnly SameSite cookie, minimal JWT, no secrets in responses or storage |
| Misconfiguration (A05) | Helmet OK; CORS fail-open, no frontend headers, 500 messages leak |
| Components (A06) | 3 high, 2 moderate advisories (baseline kept, nothing upgraded) |
| Authentication (A07) | No rate limiting, logout keeps token valid, weak-password list missing, enumeration via register |

## 4. Bug register summary
| Severity | Count | IDs |
|---|---|---|
| High | 2 | BUG-001 (no rate limit), BUG-010 (dependencies) |
| Medium | 7 | BUG-002, 003, 004, 006, 009, 011, 014 |
| Low | 9 | BUG-005, 007, 008, 012, 013, 015, 016, 017, 018 |
All are in state **New**; none fixed.

## 5. Root-cause summary
Seven analyses point to three themes: (1) controls installed but not enforced end to end (rate limiter, review route); (2) inconsistent input validation and an error handler that exposes internals; (3) no automated negative, security or accessibility tests or static-analysis gate.

## 6. SonarQube summary
Community Build 26.11.0 in Docker; 101 files, 6,697 LoC; Quality Gate Passed; 23 issues (9 bug-type, 5 vulnerability-type, 9 code smells), mostly low impact or probable false positives; two produced real bugs (ReDoS-prone regex, hard-coded demo password). Security hotspots 0; coverage 0 %; duplications 0.4 %; debt 78 min.

## 7. Usability summary
Expert inspection plus a scripted task walkthrough (7 of 7 runnable tasks completable in 2-4 clicks; check-in not run); no human participants. Strengths: clear inline validation, no overflow at 375 px, consistent navigation. Problems: low contrast (17 pages), no skip link, heading-order issues, chat button overlaps Search on mobile, one-click booking without confirmation (code review). Also: no visible focus ring on the Home search fields and duplicate Tab stops in the navbar. **Not measured:** human task success, time on task, SUS.

## 8. Work that still needs the team (blocked for me)
1. **Run the participant usability sessions** (≥ 5 people, consent) and fill `usability-kit/*.csv`; then compute SUS with `node usability-kit/calculate-sus.mjs usability-kit/sus-responses.csv` and write `usability-testing-results.md`.
2. **Decide how the report states AI assistance**: check the course's AI-use policy and disclose as required. You may also add your own team experience (meetings, coordination) to the reflection if you want it.
3. Re-check `Secure` cookie flag, CORS and headers on the **deployed** site if the report should cover production.
4. Decide whether to apply the fixes (nothing was changed) and then re-run the tests to move bugs through Retest → Verified → Closed.
5. Optional: OWASP ZAP baseline scan (needs approval to download the image).

## 9. Known gaps and honesty notes
- **Screenshots:** every file in `screenshots/` is a genuine capture (real Chrome page, real PowerShell window, or real SonarQube UI). An earlier set of script-rendered "panels" was **not** a real screenshot, so it was moved to `generated-panels-not-screenshots/` and is not used. Blank/scrolled captures are in `superseded/`.
- Items without a screenshot (A01-06/07/09/12/14/17/19, A02-02/03/04/05, A03-05/06/07, A05-06/07, A07-03/06/07) are documented in `raw/*.json` only.
- **Residue from the automated walkthrough:** `attendee@demo.com` has 3 extra cancelled bookings; test events it created were deleted (details in `usability-automated-task-walkthrough.md` section 5).
- `usability-04a` and `usability-05a` are early captures taken before the form submit registered; kept as-is and labelled.
- Tests ran in a development configuration; production-only behaviour was not observed.
- **Test data left in the database:** several QA users named `qa.m5.*` / `qa.common.*` (created by repeated harness runs), one contact message submitted by the contact-form XSS test (sender `qa.m5.ui@example.com`). The throw-away events were deleted. The demo-account passwords were not changed. Nothing in the database was reset or dropped.
- **Environment left running:** SonarQube container `eventease-sonarqube` (≈ 2.4 GB RAM) and the dev servers. The C: drive is nearly full (≈ 2.6 GB free) after the Docker images were pulled (~4 GB).
- The SonarQube admin password was changed from the default and a scan token created; both are stored only outside the repository.

## 10. File index
`security-testing-report.md` · `owasp-test-results.md` · `usability-testing-plan.md` · `usability-heuristic-evaluation.md` · `usability-automated-task-walkthrough.md` · `bug-register.md` · `root-cause-analysis.md` · `bug-lifecycle.md` · `sonarqube-analysis.md` · `quality-metrics.md` · `recommendations.md` · `agile-devops-reflection.md` · `diagrams/` · `usability-kit/` · `raw/` · `screenshots/`
(`usability-testing-results.md` intentionally **not** created: no genuine participant data exists.)


## 11. Screenshot index (generated from the actual files)

| Group | Files | Origin |
|---|---|---|
| Setup / baseline (taken by the team member earlier) | `setup-01-api-health.png`, `owasp-01` … `owasp-08` | Real app / terminal, pre-existing |
| Browser XSS tests | `owasp-09`, `09a`, `10`, `10a`, `11` | Real Chrome (Playwright) |
| API / config tests | `owasp-12` … `owasp-25` (suffix `-terminal`) | Real PowerShell window |
| SonarQube | `sonarqube-01` … `sonarqube-06` | Real SonarQube UI in Chrome |
| Usability walkthrough | `usability-01` … `usability-21` (+ `04a`, `05a`) | Real Chrome (Playwright), desktop and 375 px mobile |
| Automated task walkthrough | `usability-auto-T1` … `T7`, `usability-auto-keyboard-first-main-focus.png` | Real Chrome driven by a script |

