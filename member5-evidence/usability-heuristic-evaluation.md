# Usability Inspection of the Real Application (Heuristic + Accessibility)

**Member 5 – Security & Quality Assurance** · Evaluator: QA (expert review, **no end-user participants**) · Date: 2026-11-24

This is an **expert inspection**, not a user test: it complements the participant SUS results in `usability-testing-results.md` and produces no SUS score itself.

## 1. What was inspected
21 page states in real Chrome (Playwright) at 1366×860 (17) and 375×812 mobile (4), covering attendee, organizer, visitor and error pages. Each page was screenshotted and scanned with **axe-core 4.10.2** (WCAG 2.x A/AA rules). Raw output: `raw/usability-walkthrough-axe.json`.

| Workflow | Pages / screenshots |
|---|---|
| Visitor: discover | Home `usability-01`, Explore `02`, Event details `03` |
| Authentication | Login validation `04`, Sign-up validation `05`, Forgot password `06`, 404 `07` |
| Attendee | Dashboard `08`, My tickets `09`, Saved events `10`, Profile `11` |
| Organizer | Dashboard `12`, Manage events `13`, Create-event validation `14`, Attendees `15`, Analytics `16`, QR check-in `17` |
| Mobile (375 px) | Home `18`, Explore `19`, Event details `20`, Login `21` |

Screenshot notes: `usability-04a`/`05a` are earlier captures taken before the form submit registered (wrong selector). They are kept unaltered for transparency; `04` and `05` are the correct re-captures.

## 2. Findings

Severity (Nielsen): 0 none · 1 cosmetic · 2 minor · 3 major · 4 catastrophe.

| ID | Heuristic / WCAG | Finding | Evidence | Sev. | Bug |
|---|---|---|---|---|---|
| UX-01 | Visibility / WCAG 1.4.3 | White text on orange `#f97316` buttons is 2.8:1 (needs 4.5:1); affects "Create an Event", "Create event" and similar buttons on most pages | `usability-01`, `13`; axe `color-contrast` | 3 | BUG-011 |
| UX-02 | WCAG 1.4.3 | Category labels (teal 2.48:1, sky 2.77:1, pink 3.52:1, green 3.24:1) and grey `slate-400` captions (2.63:1) at 10–12 px | `usability-02`, `09`, `10` | 3 | BUG-011 |
| UX-03 | WCAG 2.4.1 | No skip-to-content link on any of the 21 pages | axe/JS check `skipLink=false` ×21 | 2 | BUG-012 |
| UX-04 | WCAG 1.3.1 / 2.4.6 | Heading levels skipped on 11 pages (e.g. `h4` after page title); 404 page has no `h1` | `usability-07`; axe `heading-order`, `page-has-heading-one` | 1–2 | BUG-013 |
| UX-05 | Flexibility / layout | At 375 px the floating AI-chat button covers the right end of the hero **Search** button | `usability-18` | 2 | BUG-016 |
| UX-06 | Error prevention | Booking is submitted by a single click on the event page (`EventDetails.jsx` `book()` posts immediately), with no review/confirm step. Cancellation exists until 24 h before. **Code inspection only; no booking was made to avoid changing data.** | source | 2 | — |
| UX-07 | Legibility | Dashboard pages place headings and sub-text over a blurred photograph; grey sub-titles have low contrast over the orange area | `usability-13`, `17` | 1 | — |
| UX-08 | Recognition vs recall | Row actions on Manage events (edit, attendees, analytics, cancel, delete) are icon-only; axe found accessible names for them (no `button-name` violation), but new sighted users must still learn what each icon means | `usability-13` | 1 | — |

## 3. What works well (observed)
- **Clear inline validation**: login, sign-up and create-event forms show field-level messages in plain language and a toast ("Please fix the highlighted fields") — `usability-04`, `05`, `14`.
- **No horizontal overflow** at 375 px on all four mobile pages checked (`overflowX=false`).
- **Consistent navigation** and role-specific sidebars (organizer: Dashboard, Manage Events, QR Check-in, Profile) with clear status chips (Draft, Pending, Published).
- Pages with **zero** axe violations: Create-event form, Event analytics, QR check-in.
- Every page had a single `h1` (except 404) and a `<main>` landmark.

## 4. Accessibility totals (axe-core)
| Rule | Pages affected (of 21) | Elements |
|---|---|---|
| `color-contrast` (serious) | 17 | 156 |
| `heading-order` (moderate) | 11 | 11 |
| `page-has-heading-one` (moderate) | 1 | 1 |
| Pages with ≥ 1 violation | 18 | — |
| Pages with none | 3 | — |

Load times were measured on the Vite **development** server (unminified, no cache) and are **not** reported as performance evidence.

## 5. Limitations
Automated tools detect only part of all accessibility issues; keyboard-only and screen-reader walkthroughs were **not** performed. No real users took part, so learnability, task success and satisfaction are unmeasured.
