# Usability Testing Results — EventEase (SUS, 5 participants)

**Member 5 – Security & Quality Assurance** · Instrument: System Usability Scale (10 statements, 1–5) · Scoring: `usability-kit/calculate-sus.mjs` · Raw answers: `usability-kit/sus-responses.csv`

## 1. What was collected
Five participants (P1–P5) completed the SUS questionnaire after using EventEase. Their answers were supplied by Member 5 from the completed questionnaires and are reported as received; Member 5 recalculated every score with the SUS formula and the scoring script.

**Not recorded / not reported:** per-task success, time on task, error counts, assistance needed, participant roles (attendee or organizer), session dates and consent records. These were not supplied, so no figure for them appears in this report. Because task-level data are absent, this result measures **perceived usability only**, not task performance.

## 2. SUS answers (1 = strongly disagree, 5 = strongly agree)

| Statement | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Q1 I would like to use EventEase frequently | 4 | 3 | 4 | 5 | 3 |
| Q2 Unnecessarily complex | 2 | 2 | 2 | 2 | 3 |
| Q3 Easy to use | 5 | 4 | 4 | 4 | 4 |
| Q4 Would need technical support | 2 | 3 | 1 | 2 | 2 |
| Q5 Functions well integrated | 4 | 3 | 5 | 4 | 4 |
| Q6 Too much inconsistency | 2 | 2 | 2 | 3 | 3 |
| Q7 Most people would learn it quickly | 4 | 4 | 4 | 5 | 5 |
| Q8 Very cumbersome to use | 2 | 3 | 2 | 2 | 3 |
| Q9 Felt very confident | 5 | 4 | 4 | 4 | 4 |
| Q10 Needed to learn a lot first | 2 | 2 | 3 | 2 | 2 |

## 3. SUS scores
Odd statements score (answer − 1); even statements score (5 − answer); the ten values are added and multiplied by 2.5.

| Participant | SUS score |
|---|---|
| P1 | 80.0 |
| P2 | 65.0 |
| P3 | 77.5 |
| P4 | 77.5 |
| P5 | 67.5 |
| **Mean** | **73.5** |

| Statistic | Value |
|---|---|
| Participants (n) | 5 |
| Mean SUS | **73.5 / 100** |
| Median | 77.5 |
| Range | 65.0 – 80.0 |
| Standard deviation (sample) | 6.8 |

**Interpretation.** The widely used benchmark for an average SUS score is about 68, so a mean of 73.5 is **above average** and sits in the "good" band of the usual adjective scale (roughly 70–80). Three participants scored 77.5 or higher; two (P2 65.0, P5 67.5) were slightly below the 68 benchmark.

## 4. Per-statement view
Mean adjusted score per statement (0 = worst, 4 = best):

| Statement | Mean (0–4) |
|---|---|
| Q7 Most people would learn it quickly | **3.4** (highest) |
| Q3 Easy to use | 3.2 |
| Q9 Felt confident | 3.2 |
| Q4 Would need technical support | 3.0 |
| Q5 Functions well integrated | 3.0 |
| Q1 Would use frequently | 2.8 |
| Q2 Unnecessarily complex | 2.8 |
| Q10 Needed to learn a lot first | 2.8 |
| Q6 Too much inconsistency | **2.6** (lowest) |
| Q8 Very cumbersome | **2.6** (lowest) |

Participants found EventEase quick to learn, easy and confidence-inspiring. The weakest areas were perceived **inconsistency** (Q6) and being **cumbersome** (Q8). This is consistent with the inspection findings in `usability-heuristic-evaluation.md`: inconsistent keyboard focus styling and duplicate navbar tab stops (BUG-017, BUG-018), and the single-click booking without a confirmation step (UX-06).

## 5. Limitations
- **Small sample (n = 5):** SUS is usually reported with larger samples; a mean from five people has a wide margin of error and should not be generalised.
- **No task data:** task success, time and errors were not recorded, so SUS cannot be linked to specific problems.
- **Participant background not recorded:** roles, familiarity with the project and independence from the team are unknown; if participants were classmates or team members, they may rate more favourably than first-time public users.
- **Session conditions not recorded** (device, date, facilitator script, consent).
- SUS gives a global score; it does not say which feature caused a rating.

## 6. Conclusion
Within these limits, EventEase achieved a mean SUS of **73.5**, above the average benchmark, indicating good perceived usability. The accessibility and consistency issues in the bug register remain the most concrete improvements to make (colour contrast, focus indicators, tab order, booking confirmation).
