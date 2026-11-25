# Bug Lifecycle — EventEase

**Member 5 – Security & Quality Assurance (EC4206 Section 3.8)**

![EventEase bug lifecycle](diagrams/bug-lifecycle.png)

*Diagram source: `diagrams/bug-lifecycle.svg` (hand-drawn SVG, rendered to PNG). This is a process diagram, not a screenshot.*

## 1. Process actually used in this project

Bugs are recorded in `bug-register.md` (one row and one detail block per bug, with severity, priority, status, related test and evidence). Fixes are meant to be made on a Git branch and merged by pull request, then re-tested by QA. No external bug tracker such as Jira was used; the register is a Markdown file in the repository. One bug (BUG-001) has been taken through the whole lifecycle (section 6); the other 17 are in the first state.

## 2. States and transitions

| State | Meaning | Who moves it | Exit criterion |
|---|---|---|---|
| **New** | Reported by a tester with steps, expected/actual result and evidence | Tester (Member 5) | Reproduced by a second person or a re-run test |
| **Assigned** | Triaged, severity/priority set, owner chosen | QA lead / team | Owner accepts |
| **Open** | Confirmed valid and accepted into the fix queue | Owner | Work starts |
| **In Progress** | Developer is changing code on a branch | Developer | Patch ready for review |
| **Fixed** | Patch merged to the integration branch | Developer | Build available for QA |
| **Retest** | QA repeats the original test plus a regression check | Tester | Result recorded |
| **Verified** | Retest passed; bug no longer reproducible | Tester | Reviewer agrees |
| **Closed** | Final state; evidence of the retest is attached | QA lead | — |
| **Reopened** | Retest failed or the bug returned; goes back to Assigned | Tester | New analysis |
| **Rejected** | Not a defect, duplicate, or works as designed (reason recorded) | QA lead | — |
| **Deferred** | Valid but accepted as a known risk and scheduled later | Product owner / team | Re-triage at next planning |

## 3. Rules

1. A bug cannot be Closed without a recorded retest and, for security bugs, the same test that found it must now pass.
2. Every Fixed bug triggers a regression run of the related test group (e.g. all A07 tests after a login change).
3. Severity sets the response target: Critical within 24 h; High within the current sprint; Medium next sprint; Low backlog.
4. A Rejected or Deferred decision needs a written reason in the register.

## 4. Current status of the 18 registered bugs

| State | Count | Bugs |
|---|---|---|
| New | 17 | BUG-002 ... BUG-018 |
| Closed | 1 | BUG-001 |
| Assigned / Open / In Progress / Fixed / Retest / Verified / Reopened / Rejected / Deferred | 0 | none (BUG-001 passed through them on its way to Closed) |

**Suggested next:** BUG-002 and BUG-010 (the other P1 bugs), because each has a small, well-defined fix.

## 5. Real lifecycle record: BUG-001 (no rate limiting on login)

| State | Date / time | What happened | Evidence |
|---|---|---|---|
| **New** | 2026-11-24 | Test A07-01 sent 20 wrong-password logins; all returned 401 and the correct password still worked. Logged as BUG-001, High / P1 | `owasp-18-login-rate-limit-terminal.png` |
| **Assigned** | 2026-11-25 | Triage: High / P1, owner Member 5 (the tester and the fixer are the same person in this assignment) | `bug-register.md` |
| **Open** | 2026-11-25 | Confirmed from source: `express-rate-limit` was installed but never imported | `root-cause-analysis.md` (RCA-1) |
| **In Progress** | 2026-11-25 | Change made on branch `member5-security-qa`: limiter on `POST /api/auth/login`, 10 failed attempts per 15 minutes, `skipSuccessfulRequests: true` so valid users and load tests are unaffected | `server/src/routes/authRoutes.js` |
| **Fixed** | 2026-11-25 10:36 | Commit `e7c406c` (+12 / -1 lines in one file) | `git log` |
| **Retest** | 2026-11-25 | Re-ran A07-01 against a private copy of the fixed API (port 5099, so the team's running server was not disturbed): attempts 1-10 returned 401, attempts 11 and 12 returned 429 with "Too many failed login attempts. Try again in 15 minutes." Regression check: five valid logins in a row returned 200 | `owasp-26-login-rate-limit-retest-after-fix-terminal.png` |
| **Verified** | 2026-11-25 | Retest passed and no regression found | this section |
| **Closed** | 2026-11-25 | No reopen condition met | `bug-register.md` |

**Known limitations of the fix (not reopened, but worth knowing):** the limit is per client IP, so several users behind one IP share the 10-attempt allowance, and while the limit is reached even the correct password gets 429 until the window ends. The counter is held in server memory, so it resets when the server restarts and is not shared between several server instances. These are acceptable for this project and can be improved with a shared store (for example Redis) and per-account limits.
