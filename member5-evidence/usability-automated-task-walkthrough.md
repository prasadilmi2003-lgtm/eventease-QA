# Automated Task Walkthrough — EventEase

**Member 5 – Security & Quality Assurance** · 2026-11-24 · Raw data: `raw/automated-task-walkthrough.json`, `raw/keyboard-focus-check.json`

> **This is NOT user testing.** A script drove real Chrome through the same tasks as `usability-testing-plan.md`. It shows that each workflow **can be completed** and how many clicks the shortest path needs. It cannot measure confusion, learnability, satisfaction or a **SUS score**, which need real people. No participant data was invented; `usability-testing-results.md` still does not exist.

## 1. Method
Playwright controlled Google Chrome against `http://localhost:5180` using the seeded demo accounts. Each task started from a fresh browser context. The script counts clicks and typed fields along the path it takes and checks a success condition on the resulting page. Machine time is not reported because it says nothing about human speed.

Selectors were corrected during the run when the script clicked the wrong element (for example a category badge on an event card instead of the filter, and an event the demo user had already registered for). Those were script faults, not application faults; the final run is the one reported.

## 2. Task results

| ID | Role | Task | Result | Clicks | Fields typed | Evidence |
|---|---|---|---|---|---|---|
| T1 | Attendee | Find a **Tech** event and open it | **Success** (Find Events → Tech filter → first event) | 3 | 0 | `usability-auto-T1-find-tech-event.png` |
| T2 | Attendee | Book one ticket for an open event | **Success** (event → + ticket → Register) | 3 | 0 | `usability-auto-T2-booking-confirmed.png` |
| T2b | Attendee | Cancel that booking | **Success** (Cancel → confirm; status "Cancelled") | 2 | 0 | `usability-auto-T2b-booking-cancelled.png` |
| T3 | Attendee | Find ticket and QR code | **Success** (Dashboard → My tickets; QR, ticket code and Download button shown) | 2 | 0 | `usability-auto-T3-my-tickets.png` |
| T4 | Attendee | Save an event and find it under Saved events | **Success** | 3 | 0 | `usability-auto-T4-saved-events.png` |
| T5 | Organizer | Create an event with one free ticket type and submit it | **Success** (event shows *Pending*) | 4 | 8 | `usability-auto-T5-event-submitted.png` |
| T6 | Organizer | Check in a ticket by code | **NOT RUN** — a check-in permanently marks a seeded ticket as used | — | — | — |
| T7 | Organizer | Find how many tickets are sold | **Success** (Dashboard → Manage events, "Sold" column) | 2 | 0 | `usability-auto-T7-tickets-sold.png` |

**Summary:** 7 of 7 runnable tasks are completable (T6 not run). The shortest paths are short (2–4 clicks; T5 needs 8 fields), which is a good sign for efficiency, but a first-time human may take longer or choose another route.

## 3. Keyboard-only checks

| ID | Check | Result |
|---|---|---|
| K1 | Tab presses from page load to the first control inside `<main>` on Home | **12** (no skip link exists, see BUG-012) |
| K2 | Tab presses to reach the login form | 12 |
| K3 | Visible focus indicator on the first 15 Tab stops of `/` and `/login` (30 stops) | Links, buttons and login inputs show an outline or ring; the **4 hero search controls on Home show none** (BUG-017) |
| K4 | Duplicate stops | Navbar "Create an Event", "Log in" and "Sign up" are each a link wrapping a button, so each takes 2 Tab presses (BUG-018) |

Screenshot: `usability-auto-keyboard-first-main-focus.png` (the focused "Event name" field has no visible ring). Only two pages were checked; the rest of the app was not keyboard-tested and no screen reader was used.

## 4. Additional observations
- **Clear feedback:** trying to book an event the user is already registered for shows "You are already registered for this event" (seen while the script was being developed).
- **A cancelled ticket still shows a QR code** (greyed, with a "Cancelled" badge) on the booking page; see `usability-auto-T2b-booking-cancelled.png`. Hiding the QR for cancelled tickets would avoid confusion at the gate (minor).
- Booking and cancel flows are short and give a success toast.

## 5. Residue left by this run (all reversible and disclosed)
- The demo attendee (`attendee@demo.com`) now has **3 extra cancelled bookings** (Charity 10K Fun Run) created while the script was being corrected; each cancellation restored the ticket inventory.
- Test events titled "[QA-M5] automated usability test event" were created and **deleted** on each run (delete status 200).
- "Save event" for one event was toggled on and off.
- No ticket was checked in; no database was reset.

## 6. What still needs real people
Task success under real conditions, time on task, error counts and the SUS score. The plan, questionnaire and scoring tool are ready in `usability-testing-plan.md` and `usability-kit/`.
