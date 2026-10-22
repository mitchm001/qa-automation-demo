# Bug reports

Defects found by the automated suite while testing the event sign-up app. Each bug has a matching
automated test that is marked `test.skip()` with a `bug` annotation until the fix ships. The test
asserts the **correct** behaviour, so removing `.skip` turns it into the regression test for the fix.

| ID | Title | Severity | Priority | Status | Test |
|---|---|---|---|---|---|
| BUG-001 | Duplicate email within one sign-up is reported against the wrong person | Minor | P2 | Open | UI-041 |
| BUG-002 | Double-clicking "Sign up" sends the sign-up twice and shows a false duplicate error | Minor | P2 | Open | UI-042 |
| BUG-003 | An oversized request body returns 500 Internal Server Error instead of 413 | Minor | P2 | Open | SEC-007 |

**Severity scale:** Critical (data loss or wrong seats) · Major (a core flow is blocked) · Minor (wrong or confusing feedback, data is still correct) · Trivial (cosmetic).

---

## BUG-001: Duplicate email within one sign-up is reported against the wrong person

| Field | Value |
|---|---|
| **Severity** | Minor: no wrong data is saved, but the error message points at the wrong person |
| **Priority** | P2 |
| **Status** | Open |
| **Found by** | Automated test UI-041 (`tests/tests-ui/204-duplicate-email.spec.ts`), exploratory follow-up |
| **Component** | Sign-up form (browser) and seat picker |
| **Environment** | Local build, Chromium (Playwright Desktop Chrome), Node 24, macOS |

### Steps to reproduce
1. Start from the seeded state (21 of 25 seats filled, 4 open).
2. In the sign-up form, enter 5 people. Give **Person 5** the same email as **Person 1**.
3. Click **Sign up**.
4. In the "Only 4 seats left" pop-up, check Persons 2, 3, 4 and 5.
5. Click **Seat selected, waitlist the rest**.

### Expected result
The form catches the repeated email **before** the seat picker opens, and shows under Person 5:
"This email is already used by person 1 in this list."

### Actual result
- The seat picker opens even though the form contains a repeated email.
- After choosing seats, the error appears under **Person 1** and reads
  "This email is already used by **person 4** in this list." No one on screen is Person 4 with that email.
- Nobody is signed up (correct), but the user has to work out which rows actually clash.

### Cause
The browser only checks required fields and email format. The repeated-email check happens on the server,
which numbers people in the order they were **sent**. The seat picker sends the seated people first, so the
server's order no longer matches the form's row numbers.

### Suggested fix
Also check for repeated emails in the browser, in form order, before the seat picker opens
(`SignupForm.validate()` in `platform-ui/src/client/classes/SignupForm.ts`). The exact code is in the
comments of test UI-041. Verified: with that change applied, UI-041 passes.

---

## BUG-002: Double-clicking "Sign up" sends the sign-up twice and shows a false duplicate error

| Field | Value |
|---|---|
| **Severity** | Minor: the person is signed up once (correct), but an error message wrongly suggests a problem |
| **Priority** | P2 |
| **Status** | Open |
| **Found by** | Automated test UI-042 (`tests/tests-ui/203-signup-open-seats.spec.ts`) |
| **Component** | Sign-up form (browser) |
| **Environment** | Local build, Chromium (Playwright Desktop Chrome), Node 24, macOS |
| **Reproducibility** | Every time with Playwright's `dblclick()`; intermittent by hand (a slow double-click lets the first request finish) |

### Steps to reproduce
1. Start from the seeded state.
2. Fill in Person 1 with a new, valid person.
3. Double-click **Sign up** quickly.

### Expected result
One sign-up request is sent. The page shows only "Signed up 1 person: 1 confirmed, 0 waitlisted."

### Actual result
- Two `POST /api/events/1/signups` requests are sent. The first returns **201**, the second **409 Conflict**.
- The page shows the success message **and**, under the now-empty form, "One or more people are already
  signed up for this event." plus a duplicate-email error on the empty row.
- Data is correct: the person is saved once (22 of 25). The server's duplicate check prevented a double booking.

### Cause
The **Sign up** button stays enabled while the request is in progress, so a second click starts a second submit.

### Suggested fix
Disable the **Sign up** button at the start of a submit and re-enable it when the submit finishes
(`form.onSubmit` in `platform-ui/src/client/main.ts`). The exact code is in the comments of test UI-042.
Verified: with that change applied, UI-042 passes.

### Note
The server side of this is already covered and passing: API-152 and API-153 send simultaneous sign-ups
from separate clients and confirm the event never goes over capacity.

---

## BUG-003: An oversized request body returns 500 Internal Server Error instead of 413

| Field | Value |
|---|---|
| **Severity** | Minor: the request is correctly refused, but with the wrong status code, and it's logged as a server crash |
| **Priority** | P2 |
| **Status** | Open |
| **Found by** | API probing while writing the security tests; covered by SEC-007 (`tests/tests-security/402-api-security.spec.ts`) |
| **Component** | API error handling (`platform-ui/src/middleware/errorHandler.ts`) |
| **Environment** | Local build, Node 24, macOS |

### Steps to reproduce
1. `POST /api/events/1/signups` with `Content-Type: application/json` and a body larger than 100 KB,
   e.g. one person whose `firstName` is 200,000 characters.

### Expected result
**413 Payload Too Large**, `{ "error": { "code": "PAYLOAD_TOO_LARGE", "message": "Request body is too large." } }`

### Actual result
**500 Internal Server Error**, `{ "error": { "code": "INTERNAL_ERROR", "message": "Something went wrong on the server." } }`,
and the server logs `PayloadTooLargeError: request entity too large` as an unexpected error.

Good news, checked by SEC-008: the 500 response doesn't leak a stack trace or other internal details,
and nothing is saved.

### Cause
`express.json()` rejects bodies over its 100 KB limit with an error of type `entity.too.large` (status 413).
The error handler only recognises `entity.parse.failed` (malformed JSON), so this error falls through to the
generic 500 branch.

### Suggested fix
Handle `entity.too.large` in `errorHandler` and return 413. The exact code is in the comments of SEC-007.
Verified: with that change applied, SEC-007 passes (and SEC-008 still passes).

