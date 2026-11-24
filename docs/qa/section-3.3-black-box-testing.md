# 3.3 Black-Box Testing

- **Project:** EventEase – Event Management & Registration Platform
- **Member role:** Member 2 – Black-Box Testing
- **Date of execution:** 24 November 2026
- **Test level:** Component / API level (specification-based)
- **Tooling:** Vitest 5.1 (test runner), model test doubles instead of a live MongoDB

---

## 3.3.1 Objective and Scope

Black-box testing treats each unit as an opaque box: test cases are derived **only** from the
specification (API contract, validation rules and business rules), never from the source
structure. Pass or fail is decided purely on observable outputs — HTTP status code, response
message, error fields, session cookie and ticket stock.

Two units were selected because together they carry all of EventEase's input validation and all
of its business rules:

| Unit under test | Endpoint | Source | Why selected |
| --- | --- | --- | --- |
| `register()` | `POST /api/auth/register` | `server/src/controllers/authController.js` | Pure input-domain validation → ideal for Equivalence Partitioning and Boundary Value Analysis |
| `createBooking()` | `POST /api/bookings` | `server/src/controllers/bookingController.js` | Nine interacting business rules → ideal for a Decision Table |

Out of scope: `login()` (covered by Member 3 under white-box and BDD testing), UI-level
automation (Member 4), and load testing.

**Executable test suites**

| File | Technique | Cases |
| --- | --- | --- |
| `server/tests/blackbox.register.test.js` | Equivalence Partitioning + Boundary Value Analysis | 22 |
| `server/tests/blackbox.booking.test.js` | Decision Table + Boundary Value Analysis | 21 |

Run with:

```bash
cd server
npm install
npm run test:blackbox
```

---

## 3.3.2 Specification Under Test

Derived from `docs/api-contract.md` and the validation schemas.

**Registration (`POST /api/auth/register`)**

| Field | Rule |
| --- | --- |
| `name` | required, trimmed, 2–80 characters |
| `email` | required, trimmed, valid email format, ≤ 254 characters, must not already exist, stored lower-case |
| `password` | required, 8–72 characters, at least one letter **and** at least one digit |
| `role` | optional, one of `attendee` / `organizer` (defaults to `attendee`); `admin` must not be self-assignable |

Outputs: `201` + `eventease_token` cookie + public user object (never the password hash);
`400 Validation failed` with a per-field `errors` object; `400 This email is already registered`.

**Booking (`POST /api/bookings`)**

1. Event must exist, have a valid id and be `published` → else `404`.
2. The event must not have ended → else `400`.
3. At least one ticket line must be supplied → else `400`.
4. Every `quantity` must be an integer ≥ 1 → else `400`.
5. Every `ticketTypeId` must belong to the event → else `400`.
6. The current time must be inside each ticket type's sales window → else `400`.
7. Remaining stock (`quantity − sold`) must cover the request → else `409`.
8. The total across all lines must be ≤ 10 tickets → else `400`.
9. A free event may be registered for only once per attendee → else `409`.
10. Success → `201`, stock incremented atomically, one ticket row generated per seat.

---

## 3.3.3 Equivalence Partitioning

The input domain of each registration field is split into classes that the specification treats
identically; one representative value per class is tested. Invalid classes are tested one at a
time (single-fault assumption) so the reported error can be attributed to one field.

### Partition table

| Field | ID | Partition | Valid? | Representative value | Expected result |
| --- | --- | --- | --- | --- | --- |
| name | EP1 | 2–80 characters | ✔ | `Nimal Perera` | accepted |
| name | EP2 | < 2 characters | ✘ | `N` | 400, `name: must be at least 2 characters` |
| name | EP3 | > 80 characters | ✘ | 81 × `N` | 400, `name: cannot exceed 80 characters` |
| email | EP4 | well-formed, unused, ≤ 254 chars | ✔ | `nimal@test.com` | accepted, stored lower-case |
| email | EP5 | malformed (no `@`, no domain) | ✘ | `nimaltest.com` | 400, `email: Enter a valid email address` |
| email | EP6 | well-formed but already registered | ✘ | `taken@test.com` | 400, `This email is already registered` |
| password | EP7 | 8–72 chars with letter + digit | ✔ | `Pass1234` | accepted |
| password | EP8 | < 8 characters | ✘ | `Pass12` | 400, `password: at least 8 characters` |
| password | EP9 | > 72 characters | ✘ | 73 chars | 400, `password: is too long` |
| password | EP10 | letters only | ✘ | `Password` | 400, `password: at least one number` |
| password | EP11 | digits only | ✘ | `12345678` | 400, `password: at least one letter` |
| role | EP12 | `attendee` or `organizer` | ✔ | `organizer` | accepted with that role |
| role | EP13 | any other value, incl. `admin` | ✘ | `admin` | 400, no user created |
| role | EP14 | omitted | ✔ | *(absent)* | accepted as `attendee` |

### Test cases derived from the partitions

| TC ID | Covers | Input (name / email / password / role) | Expected result | Actual | Status |
| --- | --- | --- | --- | --- | --- |
| BB-REG-01 | EP1, EP4, EP7, EP12 | `Nimal Perera` / `nimal@test.com` / `Pass1234` / `attendee` | 201 + cookie, no `passwordHash` in body | As expected | Pass |
| BB-REG-02 | EP2 | `N` / valid / valid / valid | 400, `name` error, no cookie | As expected | Pass |
| BB-REG-03 | EP3 | 81 × `N` / valid / valid / valid | 400, `name` error | As expected | Pass |
| BB-REG-04 | EP5 | valid / `nimaltest.com` / valid / valid | 400, `email` error | As expected | Pass |
| BB-REG-05 | EP6 | valid / `taken@test.com` (exists) / valid / valid | 400 `This email is already registered` | As expected | Pass |
| BB-REG-06 | EP8 | valid / valid / `Pass12` / valid | 400, `password` error | As expected | Pass |
| BB-REG-07 | EP10 | valid / valid / `Password` / valid | 400, "at least one number" | As expected | Pass |
| BB-REG-08 | EP11 | valid / valid / `12345678` / valid | 400, "at least one letter" | As expected | Pass |
| BB-REG-09 | EP12 | valid / valid / valid / `organizer` | 201, user created with role `organizer` | As expected | Pass |
| BB-REG-10 | EP13 | valid / valid / valid / `admin` | 400, no user created (no privilege escalation) | As expected | Pass |
| BB-REG-11 | EP14 | valid / valid / valid / *omitted* | 201, role defaults to `attendee` | As expected | Pass |
| BB-REG-12 | EP4 | valid / `  Nimal@TEST.com  ` / valid / valid | 201, e-mail stored as `nimal@test.com` | As expected | Pass |

*(EP9 is exercised as a boundary case, BB-REG-20.)*

---

## 3.3.4 Boundary Value Analysis

Defects cluster at the edges of a partition, so each numeric limit is probed at
**minimum − 1, minimum, maximum, maximum + 1**.

### Boundary table — registration

| TC ID | Field | Boundary | Input length | Expected result | Actual | Status |
| --- | --- | --- | --- | --- | --- | --- |
| BB-REG-13 | name | min − 1 | 1 | 400 rejected | 400 | Pass |
| BB-REG-14 | name | min | 2 | 201 accepted | 201 | Pass |
| BB-REG-15 | name | max | 80 | 201 accepted | 201 | Pass |
| BB-REG-16 | name | max + 1 | 81 | 400 rejected | 400 | Pass |
| BB-REG-17 | password | min − 1 | 7 | 400 rejected | 400 | Pass |
| BB-REG-18 | password | min | 8 | 201 accepted | 201 | Pass |
| BB-REG-19 | password | max | 72 | 201 accepted | 201 | Pass |
| BB-REG-20 | password | max + 1 | 73 | 400 rejected | 400 | Pass |
| BB-REG-21 | email | max | 254 | 201 accepted | 201 | Pass |
| BB-REG-22 | email | max + 1 | 255 | 400 rejected | 400 | Pass |

Every password boundary value keeps one digit and letters (`Pass1xxx…`) so length is the only
variable being changed.

### Boundary table — booking quantity

Valid range per request: **1 … 10** tickets; and per ticket type, **1 … remaining** where
`remaining = quantity − sold`.

| TC ID | Boundary | Input | Expected result | Actual | Status |
| --- | --- | --- | --- | --- | --- |
| BB-BOOK-12 | min − 1 | quantity `0` | 400 `Invalid quantity` | As expected | Pass |
| BB-BOOK-13 | min | quantity `1` | 201 created | As expected | Pass |
| BB-BOOK-14 | max | quantity `10` | 201 created | As expected | Pass |
| BB-BOOK-15 | max + 1 | quantity `11` | 400 `You can book at most 10 tickets at once` | As expected | Pass |
| BB-BOOK-16 | below range | quantity `-1` | 400 `Invalid quantity` | As expected | Pass |
| BB-BOOK-17 | non-integer | quantity `1.5` | 400 `Invalid quantity` | As expected | Pass |
| BB-BOOK-18 | wrong type | quantity `"two"` | 400 `Invalid quantity` | As expected | Pass |
| BB-BOOK-19 | stock max | quantity `2`, remaining `2` | 201, ticket type becomes sold out (`sold = 10`) | As expected | Pass |
| BB-BOOK-09 | stock max + 1 | quantity `3`, remaining `2` | 409 `Only 2 left for General`, stock unchanged | As expected | Pass |
| BB-BOOK-20 | split over stock | two lines of 3 against remaining `5` | 409 and the first decrement rolled back (`sold = 0`) | As expected | Pass |
| BB-BOOK-21 | both limits broken | quantity `11`, remaining `2` | 409 `Only 2 left for General` — the stock rule is reached before the 10-ticket cap (see OBS-1) | As expected | Pass |

BB-BOOK-20 is the critical anti-overselling case: the two lines pass the per-line stock check
individually, so only the atomic conditional update plus its rollback can keep the inventory
correct. Stock returned to `0` and no booking was created.

---

## 3.3.5 Decision Tables

### Decision table — booking creation

Conditions are evaluated in specification order; `—` means "not reached / irrelevant" because an
earlier condition already determined the outcome. The 9 binary conditions give 2⁹ = 512 possible
combinations; the table collapses them to **10 executable rules** using don't-care entries.

| Condition | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C1 Event id valid, event exists | T | **F** | T | T | T | T | T | T | T | T |
| C2 Event is `published` | T | — | **F** | T | T | T | T | T | T | T |
| C3 Event has not ended | T | — | — | **F** | T | T | T | T | T | T |
| C4 At least one ticket line | T | — | — | — | **F** | T | T | T | T | T |
| C5 Quantity is an integer ≥ 1 | T | — | — | — | — | T | T | T | T | T |
| C6 Ticket type belongs to event | T | — | — | — | — | **F** | T | T | T | T |
| C7 Inside the sales window | T | — | — | — | — | — | **F** (not started) | **F** (ended) | T | T |
| C8 Remaining stock ≥ requested | T | — | — | — | — | — | — | — | **F** | T |
| C9 Not a repeat free registration | T | — | — | — | — | — | — | — | — | **F** |
| **Action** | | | | | | | | | | |
| HTTP status | 201 | 404 | 404 | 400 | 400 | 400 | 400 | 400 | 409 | 409 |
| Message | booking returned | Event not found or not open for booking | Event not found or not open for booking | This event has already ended | Select at least one ticket | Invalid ticket type | *X* is not on sale yet | Sales have ended for *X* | Only *N* left for *X* | You are already registered for this event |
| Stock decremented | **Yes** | No | No | No | No | No | No | No | No | No |
| Tickets issued | **Yes** | No | No | No | No | No | No | No | No | No |

Rule C5 (`quantity` not an integer ≥ 1 → `400 Invalid quantity`) is covered separately by the
boundary cases BB-BOOK-12, 16, 17 and 18, as the quantity domain is numeric rather than binary.

### Test cases derived from the decision table

| TC ID | Rule | Test input | Expected result | Actual | Status |
| --- | --- | --- | --- | --- | --- |
| BB-BOOK-01 | R1 | Published future event, 2 × `General` @ 1000 | 201, `sold = 2`, 2 tickets issued, `totalAmount = 2000` | As expected | Pass |
| BB-BOOK-02 | R2 | `eventId = "not-an-id"` | 404 `Event not found or not open for booking` | As expected | Pass |
| BB-BOOK-03 | R3 | Event with `status = draft` | 404 `Event not found or not open for booking` | As expected | Pass |
| BB-BOOK-04 | R4 | Event that ended 24 h ago | 400 `This event has already ended` | As expected | Pass |
| BB-BOOK-05 | R5 | `items = []` | 400 `Select at least one ticket` | As expected | Pass |
| BB-BOOK-06 | R6 | `ticketTypeId` not in the event | 400 `Invalid ticket type` | As expected | Pass |
| BB-BOOK-07 | R7 | `salesStart` 24 h in the future | 400 `General is not on sale yet` | As expected | Pass |
| BB-BOOK-08 | R8 | `salesEnd` 1 h in the past | 400 `Sales have ended for General` | As expected | Pass |
| BB-BOOK-09 | R9 | 3 requested, 2 remaining | 409 `Only 2 left for General`, stock unchanged | As expected | Pass |
| BB-BOOK-10 | R10 | Free ticket type, attendee already registered | 409 `You are already registered for this event`, stock unchanged | As expected | Pass |
| BB-BOOK-11 | — (robustness) | Database lookup throws | Error forwarded to the error handler, no response body written | As expected | Pass |

### Decision table — registration outcome

A compact table for the registration unit, combining field validity with e-mail uniqueness.

| Condition | RR1 | RR2 | RR3 |
| --- | --- | --- | --- |
| All fields inside their valid partitions | T | **F** | T |
| E-mail not already registered | T | — | **F** |
| **Action** | | | |
| HTTP status | 201 | 400 | 400 |
| Message | public user object | Validation failed + per-field `errors` | This email is already registered |
| Session cookie set | **Yes** | No | No |
| User row created | **Yes** | No | No |
| Covered by | BB-REG-01, 09, 11, 12 | BB-REG-02…04, 06…08, 10, 13…22 | BB-REG-05 |

---

## 3.3.6 Execution Results

```text
$ cd server && npm run test:blackbox

 RUN  v5.1.1  /eventease-QA/server

 ✓ tests/blackbox.register.test.js  (22 tests)
 ✓ tests/blackbox.booking.test.js   (21 tests)

 Test Files  2 passed (2)
      Tests  43 passed (43)
   Duration  272 ms
```

| Technique | Test cases | Passed | Failed | Pass rate |
| --- | --- | --- | --- | --- |
| Equivalence Partitioning | 12 | 12 | 0 | 100 % |
| Boundary Value Analysis | 20 | 20 | 0 | 100 % |
| Decision Table (incl. 1 robustness case) | 11 | 11 | 0 | 100 % |
| **Total** | **43** | **43** | **0** | **100 %** |

No functional defect was found: every specified rule, partition boundary and decision rule
behaved as the specification requires, including the anti-overselling rollback. Three
specification-level observations are recorded in 3.3.7.

---

## 3.3.7 Observations and Recommendations

Although no test failed, black-box analysis surfaced three specification-level weaknesses worth
recording.

| ID | Observation | Severity | Recommendation |
| --- | --- | --- | --- |
| OBS-1 | Order of checks makes one error message misleading: requesting 11 tickets when only 2 remain returns `409 Only 2 left for General`, because the per-line stock rule (C8) is evaluated before the 10-ticket cap, so the user is never told about the cap (confirmed by BB-BOOK-21). | Low (usability) | Validate the total-quantity cap before the stock check. |
| OBS-2 | The duplicate-registration rule (C9) applies only to free events. The same attendee can create unlimited paid bookings for the same event. | Low (business rule) | Confirm with the product owner whether a per-attendee cap is wanted for paid events. |
| OBS-3 | The password rule accepts any 8-character string containing one letter and one digit, so `password1` is accepted. No check against common passwords. | Medium (security) | Add a deny-list of common passwords, or raise the minimum length to 10. |

## 3.3.8 Conclusion

Equivalence Partitioning reduced an effectively infinite input domain for registration to 14
classes and 12 test cases; Boundary Value Analysis added 20 cases at the exact limits where
off-by-one defects live; the Decision Table collapsed 512 theoretical condition combinations in
the booking flow to 10 executable rules. 43 of 43 derived test cases passed, with the
critical business rules — no privilege escalation at sign-up, no overselling of tickets, and a
correct rollback under partial failure — all confirmed from the outside of the system only.
