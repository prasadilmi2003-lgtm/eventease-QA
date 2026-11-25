# Agile and DevOps Reflection — EventEase

**Member 5 – Security & Quality Assurance (EC4206 Section 3.10)**

> This reflection is grounded in what the repository and the testing actually showed. It does not claim practices that were not used. Team meetings and communication channels are not recorded anywhere in the repository, so they are deliberately not described.

## 1. What the project workflow actually looked like
| Observation | Evidence |
|---|---|
| Work was split into role-based packages, one Git branch per member | remote branches `member3-whitebox-bdd`, `member4-automation`, `member5-security-qa`, plus `main` |
| Very small commit history on `main` (an initial commit and a refactor commit) | `git log` |
| Deployment is documented (MongoDB Atlas → Render API → Vercel site) | `docs/deployment.md` |
| No CI workflow file exists on the Member 5 branch | `git ls-files` finds no `.github`, Jenkins or GitLab files |
| The only automated test is a custom happy-path script | `npm test` → `testSuite.js`; no coverage, no negative cases |
| Quality activities (security, usability, static analysis) were performed **after** the features were built | this report |

## 2. Testing throughout development (shift-left)
The assignment structure puts security and quality assurance at the end. The results show the cost: issues such as the unused rate limiter, the unreachable review routes and the unvalidated endpoints are exactly the kind that a test written *with* the feature would have caught the same day. An Agile team would put an abuse-case or negative test in each user story's acceptance criteria instead of auditing later. **Lesson:** testing late finds the same bugs but at higher rework cost.

## 3. Continuous integration and delivery
- **What exists:** push-to-deploy hosting is described (Render/Vercel), which is a form of continuous delivery, but nothing gates the deploy.
- **What is missing:** an automated pipeline that runs install, audit, lint, tests and SonarQube on every pull request. Every tool used in this report (`npm audit`, SonarScanner, axe, the API test harness) is scriptable, so each could become a pipeline stage with "fail on new high vulnerability / new bug" gates.
- **Honest note:** Member 4's CI/CD work lives on another branch and was not reviewed by Member 5, so no statement is made about it here.

## 4. Security testing (DevSecOps)
Dynamic testing found real weaknesses that static analysis did not: SonarQube reported nothing about missing rate limiting, CORS fail-open, token revocation or unreachable routes, while it did find the ReDoS-prone regex that tests would not have spotted. The lesson is to combine **SAST (SonarQube), dependency scanning (`npm audit`) and DAST-style tests** in the pipeline, and to re-run the same tests after each fix as regression tests.

## 5. Code quality
SonarQube rated maintainability A with 0.4 % duplication, but coverage is 0 % and the Quality Gate only checks new code. A passed gate gave false comfort: quality depends on the gate's rules. Recommended: gate on coverage of new code, no new vulnerabilities, and no new high-severity bugs.

## 6. Bug management
Bugs were recorded in a structured register (severity, priority, evidence) and analysed with 5-Whys. Three recurring root causes emerged: controls added but not wired in, inconsistent validation between endpoints, and no automated negative/accessibility testing. The defined lifecycle (New → … → Closed/Reopened) was documented, but BUG-001 was fixed, retested and closed to demonstrate the cycle, while the other 17 remain **New**. In a real Agile team these would be triaged into the next sprint backlog by priority (P1 first).

## 7. Collaboration
Evidence is organised as plain files (screenshots, raw JSON, Markdown) in one folder so that any member can reproduce a finding. The work of other members is expected to connect to these results (for example, black-box and white-box test cases may cover the same validation gaps, and the CI/CD pipeline is where the recommended checks belong) but Member 5 did not review those deliverables.

## 8. Improvements for future development
1. Write security and negative tests with each story; keep them in the repository.
2. Add a CI pipeline with audit, lint, tests, coverage and SonarQube gates.
3. Use a shared validation layer (zod middleware) and a safe error handler.
4. Treat accessibility as a requirement: contrast tokens, axe in CI, keyboard testing.
5. Small pull requests with review checklists (input validated? abuse case? docs/contract updated?).
6. Run usability tests earlier and record task-level data: the SUS questionnaire was completed by five participants only after development, without per-task timings (`usability-testing-results.md`).
7. Keep demo credentials and dev-only conveniences (CORS bypass, quick-login) behind an explicit environment check that fails safe.

## 9. Limitations of this reflection
It reflects the repository state on 2026-11-24 and Member 5's own work. It does not describe sprint ceremonies, because none were evidenced in the repository.
