# Usability Testing Plan — EventEase

**Member 5 – Security & Quality Assurance (EC4206 Section 3.7 / usability testing)**

> **Status: plan and materials are ready. Participant sessions have NOT been run.** No participant, response or SUS score exists yet, so `usability-testing-results.md` has deliberately not been created. The expert evaluation that *was* carried out on the real application is in `usability-heuristic-evaluation.md`.

## 1. Objectives
1. Check that a first-time **attendee** can find an event, understand tickets and see their booking without help.
2. Check that an **organizer** can create, submit and manage an event and check in a ticket.
3. Measure perceived usability with the **System Usability Scale (SUS)**.
4. Find the points where users hesitate, make errors or need help.

## 2. Method
Moderated, task-based test (think-aloud) on a laptop in Chrome against the local app (`http://localhost:5180`, seeded data). One facilitator reads the task, one observer records time/errors. Each session ≈ 20 minutes: 2 min briefing + consent, 3 attendee tasks, 3 organizer tasks (organizer participants only), SUS, 3 debrief questions.

## 3. Participants (to be recruited by the team)
- **Minimum 5** (Nielsen: five users reveal most usability problems); ideally 3 attendee-type and 2 organizer-type, fellow students are acceptable.
- Record only an ID (P1, P2 …), role and prior experience; **no names or personal data** in the report.
- Each participant must give verbal consent (script in §8).

## 4. Environment
- Seeded database, backend `:5000`, frontend `:5180`. Use the demo accounts `attendee@demo.com` / `organizer@demo.com` (credentials in the README, never printed in reports).
- Reset between participants only with the team's agreement (do not reset the shared DB without approval): use a fresh demo attendee booking each time or choose a different event.
- Screen recording optional (needs consent).

## 5. Tasks and success criteria

| ID | Role | Task (read aloud) | Success = | Target |
|---|---|---|---|---|
| T1 | Attendee | "Find a **Tech** event and open its details." | Reaches an event detail page of category Tech | ≤ 60 s |
| T2 | Attendee | "Book **one ticket** for any open event." | Booking confirmation shown | ≤ 120 s, ≤ 1 error |
| T3 | Attendee | "Find your booking and show the ticket QR code." | Ticket/QR visible under My Tickets | ≤ 60 s |
| T4 | Attendee | "Save an event to favourites and find it again later." | Event listed under Saved events | ≤ 60 s |
| T5 | Organizer | "Create a new event with one free ticket type and submit it for approval." | Event shows status *Pending* | ≤ 240 s |
| T6 | Organizer | "Check in the ticket with code `<code supplied by facilitator>`." | Check-in result shows success | ≤ 90 s |
| T7 | Organizer | "Find how many tickets have been sold for one event." | Reads the sold figure (Manage events or Analytics) | ≤ 60 s |

(Pick the code for T6 from a seeded booking beforehand; do not use real personal data.)

## 6. Metrics
- **Task success rate** (completed without help / attempts).
- **Time on task** (seconds), **error count**, **assistance needed**.
- **SUS score** (0–100), calculated with `usability-kit/calculate-sus.mjs`.
- Qualitative notes and severity of each observed problem (use the 0–4 scale in the heuristic evaluation).

Interpretation guide for SUS: ≥ 80 excellent, 68 average, < 51 poor.

## 7. Data to record (files supplied)
| File | Purpose |
|---|---|
| `usability-kit/task-observations-TEMPLATE.csv` | One row per participant per task |
| `usability-kit/sus-responses-TEMPLATE.csv` | One row per participant, answers 1–5 for the 10 SUS items |
| `usability-kit/calculate-sus.mjs` | `node calculate-sus.mjs sus-responses.csv` → per-person score and mean |

The calculator was verified only against the three textbook boundary cases (all 3s → 50, perfect → 100, worst → 0). Those self-check values are not study data.

## 8. Facilitator script and consent
> "Thank you for helping. We are testing the website, not you; there are no wrong answers. Please think aloud. You can stop at any time. We will record only your task times and comments under an anonymous ID such as P1, and we will not share your name. Do you agree to take part?" *(wait for a verbal yes and note it)*

Debrief questions: (1) What was the most confusing part? (2) What did you like most? (3) What would you change first?

## 9. SUS questionnaire (give to the participant after the tasks)
Rate each statement from **1 = Strongly disagree** to **5 = Strongly agree**.

| # | Statement |
|---|---|
| 1 | I think that I would like to use EventEase frequently. |
| 2 | I found EventEase unnecessarily complex. |
| 3 | I thought EventEase was easy to use. |
| 4 | I think that I would need the support of a technical person to be able to use EventEase. |
| 5 | I found the various functions in EventEase were well integrated. |
| 6 | I thought there was too much inconsistency in EventEase. |
| 7 | I would imagine that most people would learn to use EventEase very quickly. |
| 8 | I found EventEase very cumbersome to use. |
| 9 | I felt very confident using EventEase. |
| 10 | I needed to learn a lot of things before I could get going with EventEase. |

**Scoring:** odd items: answer − 1; even items: 5 − answer; add the ten values and multiply by 2.5.

## 10. Observation sheet (per participant)

| Task | Done? (Y/N) | Time (s) | Errors | Help needed? | Notes / quote |
|---|---|---|---|---|---|
| T1 | | | | | |
| T2 | | | | | |
| T3 | | | | | |
| T4 | | | | | |
| T5 | | | | | |
| T6 | | | | | |
| T7 | | | | | |

## 11. What the team still has to do
1. Recruit ≥ 5 participants and run the sessions (consent required).
2. Fill the two CSV files with the real observations and answers.
3. Run `node usability-kit/calculate-sus.mjs usability-kit/sus-responses.csv`, then write `usability-testing-results.md` from the genuine numbers.
4. Optionally add 1–2 real session photos/screenshots (with consent) to `screenshots/`.
