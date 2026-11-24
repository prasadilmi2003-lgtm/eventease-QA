# Quality Metrics — EventEase

**Member 5 – Security & Quality Assurance (EC4206 Section 3.10)** · All figures come from the executed tests and tool runs referenced below. Anything not measured is marked **n/a**.

## 1. Security testing (source: `owasp-test-results.md`, `raw/api-security-run.json`, `raw/ui-security-run.json`)

| Metric | Value |
|---|---|
| Security tests defined and recorded | **53** |
| PASS | 37 |
| FAIL | 14 |
| OBSERVATION (design note, not scored) | 1 |
| NOT TESTED | 1 |
| Pass rate, all 53 | 69.8 % |
| Pass rate, executed pass/fail tests (37 / 51) | **72.5 %** |
| OWASP Top 10 categories tested | 6 of 10 (A01, A02, A03, A05, A06, A07); A04 partial |

| OWASP category | Executed | PASS | FAIL | Fail rate |
|---|---|---|---|---|
| A01 Broken Access Control | 17 | 17 | 0 | 0 % |
| A02 Cryptographic Failures | 5 | 5 | 0 | 0 % |
| A03 Injection | 12 | 7 | 5 | 41.7 % |
| A05 Security Misconfiguration | 8 | 5 | 3 | 37.5 % |
| A06 Vulnerable Components | 2 | 0 | 2 | 100 % |
| A07 Authentication Failures | 7 | 3 | 4 | 57.1 % |

## 2. Vulnerabilities

| Source | Result |
|---|---|
| `npm audit` server | 4 (2 high, 2 moderate) |
| `npm audit` client | 1 (1 high) |
| `npm audit` combined | **3 high, 2 moderate, 0 critical** |
| SonarQube vulnerabilities | 5 (all "Medium" impact; S2068 ×3 hard-coded demo password, S2245 ×2 mock-data PRNG) |
| SonarQube security hotspots | 0 |
| Exploitable weaknesses found by testing | 10 bugs (BUG-001 … BUG-010), none Critical |

## 3. Bug statistics (source: `bug-register.md`)

| Metric | Value |
|---|---|
| Total bugs logged | **16** |
| Critical / High / Medium / Low | 0 / 2 / 7 / 7 |
| Priority P1 / P2 / P3 | 3 / 6 / 7 |
| By source | Security testing 10 · accessibility & usability 4 · SonarQube 2 |
| Status | New 16 · Fixed 0 · Closed 0 (no code was changed) |
| Defect density (all 16 / 6.697 KLOC) | 2.4 bugs per KLOC |
| Security-only density (10 / 6.697 KLOC) | 1.5 per KLOC |
| Root-cause analyses completed | 7 (`root-cause-analysis.md`) |

*Defect density mixes security, accessibility and static-analysis items and uses lines of code counted by SonarQube; treat it as an indicator, not a benchmark.*

## 4. Static code analysis (source: SonarQube Community Build 26.11, `sonarqube-analysis.md`)

| Metric | Value |
|---|---|
| Quality Gate | Passed (new-code gate, first analysis) |
| Lines of code / files | 6,697 / 101 |
| Security / Reliability / Maintainability rating | C / C / A |
| Open issues | 23 (9 bugs, 5 vulnerabilities, 9 smells) |
| Coverage | 0.0 % (no coverage report supplied) |
| Duplications | 0.4 % |
| Technical debt | 78 min |
| Cyclomatic / cognitive complexity | 1,497 / 725 |
| Sonar findings that became registered bugs | 6 issues → 2 bugs: S8786 ×3 → BUG-014; S2068 ×3 → BUG-015 (the other 17 were triaged as low-impact or probable false positives; see `sonarqube-analysis.md` §4) |

## 5. Usability and accessibility

| Metric | Value |
|---|---|
| Pages inspected | 21 (17 desktop, 4 mobile 375 px) |
| Pages with ≥ 1 axe violation | 18 of 21 (85.7 %) |
| Colour-contrast failures | 156 elements on 17 pages |
| Heading-order failures | 11 pages |
| Pages without skip link | 21 of 21 |
| Horizontal overflow at 375 px | 0 of 4 pages |
| **Participant task success rate** | **n/a – no participant sessions yet** |
| **SUS score** | **n/a – no genuine responses yet** |
| Time on task | n/a |

## 6. Test automation / coverage of the project's own tests
- `npm test` in `server` runs one custom script (`testSuite.js`) of happy-path functional checks; it has no negative/security/abuse cases and no coverage instrumentation (hence SonarQube coverage 0 %).
- CI/CD: no workflow files exist on the `member5-security-qa` branch (`git ls-files` finds none). Another member's branch (`origin/member4-automation`) was not inspected by Member 5.

## 7. Overall assessment
| Quality attribute (ISO 25010) | Evidence | Rating |
|---|---|---|
| Security – confidentiality / access control | 17 of 17 executed access-control tests pass | **Good** |
| Security – authentication / resilience | No rate limit, tokens not revocable, 500 errors leak messages | **Needs improvement** |
| Security – components | 3 high advisories | **Needs improvement** |
| Reliability | One unreachable feature (reviews); 500s on malformed input | **Fair** |
| Maintainability | Sonar A, 0.4 % duplication, but 0 % coverage | **Good (testing gap)** |
| Usability / accessibility | Clear validation, responsive; contrast & heading issues; users untested | **Fair (unmeasured)** |
| Performance efficiency | Not measured by Member 5 (JMeter belongs to Member 4) | **n/a** |
