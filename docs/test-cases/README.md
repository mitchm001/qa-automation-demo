# Test cases

Every manual-style test case for the event sign-up app, each linked to the automated test that covers it.

| File | Scope | IDs | Spec folder |
|---|---|---|---|
| [ui-test-cases.md](ui-test-cases.md) | Browser tests: what a user sees and does | UI-001 – UI-050 | `tests/tests-ui/` |
| [api-test-cases.md](api-test-cases.md) | HTTP API called directly, no browser | API-101 – API-154 | `tests/tests-api/` |
| [hybrid-test-cases.md](hybrid-test-cases.md) | UI and API together: one changes data, the other checks it | HYB-001 – HYB-007 | `tests/tests-hybrid/` |
| [auth-test-cases.md](auth-test-cases.md) | Login, logout and access control (API and UI) | AUTH-001 – AUTH-016 | `tests/tests-auth/` |
| [security-test-cases.md](security-test-cases.md) | Security checks (UI and API) | SEC-001 – SEC-009 | `tests/tests-security/` |

Known bugs found by these tests are logged in [../bug-reports.md](../bug-reports.md). Their tests are
marked `test.skip()` with a `bug` annotation and the `@bug` tag until the fix ships.

## Conventions

- **ID**: `<level>-<number>`, where level is `UI`, `API`, `HYB`, `SEC`, `AUTH` or `UNIT`, e.g. `UI-014`.
  The automated test's title starts with it: `UI-014: Should add one person to the waitlist when the event is full`.
  Run one case with `npx playwright test --grep "UI-014"`.
  IDs are permanent: new cases get the next free number, even when they're placed earlier in the run order.
- **Title**: after the ID, starts with "Should…" and matches the written case.
- **Priority**: a tag on the test (`@P0` … `@P4`). Run one priority with `npx playwright test --grep @P0`.
- **Spec files**: numbered by folder: API `101–108`, UI `201–210`, hybrid `301–302`, security `401–402`, unit `501`, auth `601–602`.
- **Starting state**: every test starts from a fresh database: *QA Automation Meetup*, capacity 25,
  21 confirmed (seeded, including Ada Lovelace / `ada.lovelace@example.com`), waitlist empty.
  One sign-up can include 1–5 people.
- **Setup via API**: when a test needs a full event or a waitlist and that isn't what's being tested,
  the state is created through the API (faster, more reliable), then checked in the UI.

## Priorities

| Priority | Meaning | Example |
|---|---|---|
| **P0** Critical | A business rule or data-integrity failure: wrong people seated, duplicates allowed, capacity broken | UI-011 duplicate email blocked |
| **P1** High | A core user flow is broken: can't sign up, remove, or see validation errors | UI-019 remove a person |
| **P2** Medium | Feedback or display is wrong but the data is right: counters, messages, progress bar | UI-023 success message |
| **P3** Low | Cosmetic or rarely-used paths | — |
| **P4** Trivial | Nice-to-have polish | — |

## Traceability

| ID | Priority | Title | Spec file |
|---|---|---|---|
| UI-001 | P1 | Should load the event page showing 21 of 25 seats filled | `tests/tests-ui/201-page-load.spec.ts` |
| UI-002 | P2 | Should have no automatically detectable accessibility violations | `tests/tests-ui/201-page-load.spec.ts` |
| UI-003 | P1 | Should display "First name is required." when First name is left empty | `tests/tests-ui/202-signup-validation.spec.ts` |
| UI-004 | P1 | Should display "Last name is required." when Last name is left empty | `tests/tests-ui/202-signup-validation.spec.ts` |
| UI-005 | P1 | Should display "Email is required." when Email is left empty | `tests/tests-ui/202-signup-validation.spec.ts` |
| UI-006 | P1 | Should display "Email is not valid." for the email "…" (5 data rows) | `tests/tests-ui/202-signup-validation.spec.ts` |
| UI-007 | P1 | Should confirm everyone and display "Signed up 2 people: 2 confirmed, 0 waitlisted." | `tests/tests-ui/203-signup-open-seats.spec.ts` |
| UI-008 | P0 | Should fill every open seat using "Add another person" without waitlisting anyone | `tests/tests-ui/203-signup-open-seats.spec.ts` |
| UI-009 | P2 | Should not sign up a person whose row was removed from the form before submitting | `tests/tests-ui/203-signup-open-seats.spec.ts` |
| UI-010 | P1 | Should allow a sign-up with the same name as an existing person when the email is different | `tests/tests-ui/203-signup-open-seats.spec.ts` |
| UI-011 | P0 | Should block a sign-up whose email is already signed up (2 data rows) | `tests/tests-ui/204-duplicate-email.spec.ts` |
| UI-012 | P1 | Should allow a sign-up with that email after the existing person is removed from the Confirmed list | `tests/tests-ui/204-duplicate-email.spec.ts` |
| UI-013 | P0 | Should seat the selected people and waitlist the rest, displaying "Signed up 5 people: 4 confirmed, 1 waitlisted." | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-014 | P0 | Should add one person to the waitlist when the event is full | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-015 | P1 | Should add several people entered with "Add another person" to the waitlist when the event is full | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-016 | P1 | Should add only the checked people to the waitlist when some are unchecked | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-017 | P1 | Should add everyone to the waitlist using "Select all" | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-018 | P2 | Should display "Signed up 2 people: 0 confirmed, 2 waitlisted." when everyone goes on the waitlist | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-019 | P1 | Should remove the person from the Confirmed list | `tests/tests-ui/206-remove-confirmed.spec.ts` |
| UI-020 | P2 | Should update the "Confirmed (n)" heading after a removal | `tests/tests-ui/206-remove-confirmed.spec.ts` |
| UI-021 | P2 | Should update "n of 25 seats filled" after a removal | `tests/tests-ui/206-remove-confirmed.spec.ts` |
| UI-022 | P2 | Should update the seat progress bar after a removal | `tests/tests-ui/206-remove-confirmed.spec.ts` |
| UI-023 | P2 | Should display the green success message "Removed Ada Lovelace." after a removal | `tests/tests-ui/206-remove-confirmed.spec.ts` |
| UI-024 | P2 | Should remove one person from the waitlist and display "Removed &lt;first&gt; &lt;last&gt;." | `tests/tests-ui/207-waitlist-management.spec.ts` |
| UI-025 | P1 | Should empty the waitlist with "Clear waitlist" | `tests/tests-ui/207-waitlist-management.spec.ts` |
| UI-026 | P2 | Should display "Removed 3 people from the waitlist." after "Clear waitlist" | `tests/tests-ui/207-waitlist-management.spec.ts` |
| UI-027 | P1 | Should remove everyone from the Confirmed list after confirming "Remove all" | `tests/tests-ui/209-remove-all-confirmed.spec.ts` |
| UI-028 | P2 | Should show an empty Confirmed list after everyone is removed | `tests/tests-ui/209-remove-all-confirmed.spec.ts` |
| UI-029 | P1 | Should close the "Only 4 seats left" pop-up with the Cancel button / Escape key without signing anyone up (2 data rows) | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-030 | P1 | Should close the "This event is full" pop-up with the Cancel button / Escape key without waitlisting anyone (2 data rows) | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-031 | P1 | Should close the "Remove all" pop-up with the Cancel button / Escape key without removing anyone (2 data rows) | `tests/tests-ui/209-remove-all-confirmed.spec.ts` |
| UI-032 | P0 | Should move the first waitlisted person into the freed seat | `tests/tests-ui/206-remove-confirmed.spec.ts` |
| UI-033 | P0 | Should move waitlisted people into the freed seats, in waitlist order, after "Remove all" | `tests/tests-ui/209-remove-all-confirmed.spec.ts` |
| UI-034 | P1 | Should disable "Add another person" once 5 people are entered | `tests/tests-ui/203-signup-open-seats.spec.ts` |
| UI-035 | P1 | Should seat the selected people and leave out the rest with "Seat selected, don't add the rest" | `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` |
| UI-036 | P0 | Should block a sign-up whose email belongs to someone on the waitlist | `tests/tests-ui/204-duplicate-email.spec.ts` |
| UI-037 | P2 | Should renumber the "#" column in both lists after people are removed | `tests/tests-ui/207-waitlist-management.spec.ts` |
| UI-038 | P2 | Should display a red "Could not reach the server" message and keep the form filled when sign-up fails | `tests/tests-ui/208-network-errors.spec.ts` |
| UI-039 | P2 | Should display a red "Could not load the event" message when the page cannot load the event | `tests/tests-ui/208-network-errors.spec.ts` |
| UI-040 | P2 | Should show the empty Waitlist card with "Nobody is on the waitlist." when nobody is waitlisted | `tests/tests-ui/201-page-load.spec.ts` |
| UI-041 | P2 | ⚠️ BUG-001 (skipped): Should flag the repeated email on the correct person when the same email is entered twice in one sign-up | `tests/tests-ui/204-duplicate-email.spec.ts` |
| UI-042 | P2 | ⚠️ BUG-002 (skipped): Should send only one sign-up request when "Sign up" is double-clicked | `tests/tests-ui/203-signup-open-seats.spec.ts` |
| UI-043 | P2 | Should reset the form to one empty "Person 1" row after a successful sign-up | `tests/tests-ui/203-signup-open-seats.spec.ts` |
| UI-044 | P2 | Should clear a field's error as soon as the user starts typing in it | `tests/tests-ui/202-signup-validation.spec.ts` |
| UI-045 | P2 | Should display "{Field} can't contain emoji." when a field has an emoji (3 data rows) | `tests/tests-ui/202-signup-validation.spec.ts` |
| API-101 | P1 | Should return 200 and { status: "ok" } from the health check | `tests/tests-api/101-status-codes.spec.ts` |
| API-102 | P1 | Should return 200 and the list of events | `tests/tests-api/101-status-codes.spec.ts` |
| API-103 | P1 | Should return 200 and the seeded event with 21 of 25 seats taken | `tests/tests-api/101-status-codes.spec.ts` |
| API-104 | P0 | Should return 201 Created for a valid sign-up | `tests/tests-api/101-status-codes.spec.ts` |
| API-105 | P1 | Should return 200 when a sign-up is removed | `tests/tests-api/101-status-codes.spec.ts` |
| API-106 | P1 | Should return 404 for an event id that doesn't exist or isn't a whole number | `tests/tests-api/101-status-codes.spec.ts` |
| API-107 | P3 | Should treat an id with leading zeros ("01") as the same as "1" | `tests/tests-api/101-status-codes.spec.ts` |
| API-108 | P2 | Should return 404, not crash, for an id too large to be a valid number | `tests/tests-api/101-status-codes.spec.ts` |
| API-109 | P1 | Should return 404 when getting or removing a sign-up that doesn't exist | `tests/tests-api/101-status-codes.spec.ts` |
| API-110 | P1 | Should return 404 when signing up for an event that doesn't exist | `tests/tests-api/101-status-codes.spec.ts` |
| API-111 | P2 | Should return 404 with a JSON error for an unknown API route | `tests/tests-api/101-status-codes.spec.ts` |
| API-112 | P1 | Should return 415 when the sign-up body isn't JSON | `tests/tests-api/101-status-codes.spec.ts` |
| API-113 | P1 | Should return 400 when the JSON body is malformed | `tests/tests-api/101-status-codes.spec.ts` |
| API-114 | P1 | Should return 400 with field errors when a field is invalid | `tests/tests-api/101-status-codes.spec.ts` |
| API-115 | P0 | Should return 409 Conflict when the email is already signed up | `tests/tests-api/101-status-codes.spec.ts` |
| API-116 | P1 | Should return 400 when attendees isn't a list | `tests/tests-api/102-validation.spec.ts` |
| API-117 | P1 | Should return 400 for 0 or 6 people in one sign-up | `tests/tests-api/102-validation.spec.ts` |
| API-118 | P1 | Should accept 1 or 5 people in one sign-up (boundary) | `tests/tests-api/102-validation.spec.ts` |
| API-119 | P2 | Should return 400 when a person isn't an object | `tests/tests-api/102-validation.spec.ts` |
| API-120 | P1 | Should return 400 "{Label} is required." when the name is missing, empty or the wrong type | `tests/tests-api/102-validation.spec.ts` |
| API-121 | P1 | Should accept a name of exactly 50 characters and reject 51 | `tests/tests-api/102-validation.spec.ts` |
| API-122 | P1 | Should return 400 "Email is required." when the email is missing, empty or the wrong type | `tests/tests-api/102-validation.spec.ts` |
| API-123 | P1 | Should return 400 "Email is not valid." for a badly formed email | `tests/tests-api/102-validation.spec.ts` |
| API-124 | P2 | Should accept an email of exactly 254 characters and reject 255 | `tests/tests-api/102-validation.spec.ts` |
| API-125 | P1 | Should report every invalid field at once, keyed by person and field | `tests/tests-api/102-validation.spec.ts` |
| API-126 | P1 | Should return 400 when the same email appears twice in one request, ignoring capitals | `tests/tests-api/102-validation.spec.ts` |
| API-127 | P0 | Should save nobody when any person in the request is invalid | `tests/tests-api/102-validation.spec.ts` |
| API-128 | P2 | Should trim spaces from every field and save the email in lowercase | `tests/tests-api/102-validation.spec.ts` |
| API-129 | P2 | Should return 400 "{Field} can't contain emoji." for any field containing an emoji (15 data rows) | `tests/tests-api/102-validation.spec.ts` |
| API-130 | P0 | Should create a sign-up and read the same data back by id | `tests/tests-api/103-create.spec.ts` |
| API-131 | P0 | Should seat people in the order sent and waitlist anyone past the capacity | `tests/tests-api/103-create.spec.ts` |
| API-132 | P0 | Should waitlist every new sign-up once the event is full, in arrival order | `tests/tests-api/103-create.spec.ts` |
| API-133 | P0 | Should return 409 for an email already confirmed | `tests/tests-api/103-create.spec.ts` |
| API-134 | P0 | Should return 409 for an email that is on the waitlist | `tests/tests-api/103-create.spec.ts` |
| API-135 | P0 | Should save nobody when one person in the request is a duplicate | `tests/tests-api/103-create.spec.ts` |
| API-136 | P1 | Should allow an email to sign up again after that person is removed | `tests/tests-api/103-create.spec.ts` |
| API-137 | P2 | Should return exactly the documented fields for a sign-up | `tests/tests-api/104-read.spec.ts` |
| API-138 | P1 | Should list every sign-up in arrival order, with new sign-ups last | `tests/tests-api/104-read.spec.ts` |
| API-139 | P2 | Should include the event with live seat counts in the event list | `tests/tests-api/104-read.spec.ts` |
| API-140 | P0 | Should move the longest-waiting person into a freed seat when a confirmed person is removed | `tests/tests-api/105-update.spec.ts` |
| API-141 | P0 | Should move the whole waitlist up, in order, when everyone confirmed is removed | `tests/tests-api/105-update.spec.ts` |
| API-142 | P1 | Should move up at most 25 people when the waitlist is longer than the capacity | `tests/tests-api/105-update.spec.ts` |
| API-143 | P0 | Should remove one sign-up so it can no longer be read | `tests/tests-api/106-delete.spec.ts` |
| API-144 | P2 | Should return 404 when the same sign-up is removed twice | `tests/tests-api/106-delete.spec.ts` |
| API-145 | P1 | Should not move anyone up when a waitlisted person is removed | `tests/tests-api/106-delete.spec.ts` |
| API-146 | P1 | Should leave the seat open when a confirmed person is removed and nobody is waiting | `tests/tests-api/106-delete.spec.ts` |
| API-147 | P2 | Should give a new sign-up a fresh id, never the id of a deleted sign-up | `tests/tests-api/106-delete.spec.ts` |
| API-148 | P1 | Should clear the waitlist and leave the confirmed list alone | `tests/tests-api/106-delete.spec.ts` |
| API-149 | P1 | Should remove everyone confirmed with one request | `tests/tests-api/106-delete.spec.ts` |
| API-150 | P2 | Should return 404 when clearing lists on an event that doesn't exist | `tests/tests-api/106-delete.spec.ts` |
| API-151 | P1 | Should put both lists back to the original 21 people with the Reset UI route | `tests/tests-api/106-delete.spec.ts` |
| API-152 | P0 | Should never confirm more people than the capacity when 20 sign-ups arrive at once | `tests/tests-api/107-concurrency.spec.ts` |
| API-153 | P0 | Should give the last seat to exactly one person when 10 people sign up for it at the same time | `tests/tests-api/107-concurrency.spec.ts` |
| API-154 | P1 | Should match the documented response schema (16 data rows) | `tests/tests-api/108-response-schemas.spec.ts` |
| UI-046 | P3 | Should show what Reset UI does when hovering the "i" icon | `tests/tests-ui/210-reset-ui.spec.ts` |
| UI-047 | P2 | Should ask for confirmation before resetting | `tests/tests-ui/210-reset-ui.spec.ts` |
| UI-048 | P1 | Should keep both lists unchanged when the Reset UI pop-up is closed (Cancel / Escape) | `tests/tests-ui/210-reset-ui.spec.ts` |
| UI-049 | P1 | Should restore the original 21 people and empty the waitlist after confirming Reset UI | `tests/tests-ui/210-reset-ui.spec.ts` |
| UI-050 | P2 | Should save the reset on the server so it is still there after a page reload | `tests/tests-ui/210-reset-ui.spec.ts` |
| HYB-001 | P1 | Should save a UI sign-up on the server so it is still there after a page reload | `tests/tests-hybrid/301-signup-persistence.spec.ts` |
| HYB-002 | P0 | Should use the latest seat count when seats are taken after the page has loaded | `tests/tests-hybrid/301-signup-persistence.spec.ts` |
| HYB-003 | P1 | Should show people added through the API in the Confirmed list | `tests/tests-hybrid/302-api-changes-in-ui.spec.ts` |
| HYB-004 | P1 | Should show an API removal, and who moved up, after the page reloads | `tests/tests-hybrid/302-api-changes-in-ui.spec.ts` |
| HYB-005 | P2 | Should show an empty waitlist after the waitlist is cleared through the API | `tests/tests-hybrid/302-api-changes-in-ui.spec.ts` |
| HYB-006 | P2 | Should show an empty Confirmed list after everyone is removed through the API | `tests/tests-hybrid/302-api-changes-in-ui.spec.ts` |
| HYB-007 | P1 | Should delete the person on the server when they are removed in the UI | `tests/tests-hybrid/302-api-changes-in-ui.spec.ts` |
| SEC-001 | P0 | Should show a name containing HTML as plain text and not run it (3 data rows) | `tests/tests-security/401-html-injection.spec.ts` |
| SEC-002 | P1 | Should send the security headers on every response | `tests/tests-security/402-api-security.spec.ts` |
| SEC-003 | P0 | Should ignore extra fields such as "role", "id" and "eventId" in a sign-up | `tests/tests-security/402-api-security.spec.ts` |
| SEC-004 | P0 | Should not let a sign-up skip the waitlist by sending "status": "confirmed" | `tests/tests-security/402-api-security.spec.ts` |
| SEC-005 | P0 | Should store SQL-like text exactly as typed without affecting the database | `tests/tests-security/402-api-security.spec.ts` |
| SEC-006 | P1 | Should return 404 for an event id containing SQL-like text | `tests/tests-security/402-api-security.spec.ts` |
| SEC-007 | P2 | ⚠️ BUG-003 (skipped): Should reject a request body over 100 KB with 413 Payload Too Large | `tests/tests-security/402-api-security.spec.ts` |
| SEC-008 | P1 | Should not reveal internal details in error responses | `tests/tests-security/402-api-security.spec.ts` |
| SEC-009 | P0 | Should not expose the database reset route when test routes are turned off | `tests/tests-security/402-api-security.spec.ts` |
| UNIT-001 | P3 | Should import and call the app validation functions directly | `tests/tests-unit/501-smoke.spec.ts` |
| AUTH-001 | P0 | Should log in with the demo account and set a secure session cookie | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-002 | P0 | Should return 401 "Username or password is incorrect." for a wrong password | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-003 | P1 | Should return the same 401 for an unknown username, so usernames can't be discovered | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-004 | P1 | Should return 400 with field errors when logging in with missing fields | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-005 | P0 | Should return 401 and change nothing when not logged in | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-006 | P0 | Should return 401 for a made-up session cookie | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-007 | P2 | Should keep the health check public | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-008 | P1 | Should report who is logged in, and 401 when nobody is | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-009 | P0 | Should end the session on logout, so the same cookie no longer works | `tests/tests-auth/601-login-api.spec.ts` |
| AUTH-010 | P0 | Should send a logged-out visitor from the event page to the login page | `tests/tests-auth/602-login-ui.spec.ts` |
| AUTH-011 | P0 | Should log in with the demo account and open the event page | `tests/tests-auth/602-login-ui.spec.ts` |
| AUTH-012 | P1 | Should show "Username or password is incorrect." and stay on the login page for a wrong password | `tests/tests-auth/602-login-ui.spec.ts` |
| AUTH-013 | P1 | Should show "Username is required." and "Password is required." when both fields are empty | `tests/tests-auth/602-login-ui.spec.ts` |
| AUTH-014 | P0 | Should log out with "Log out" and keep the event page closed afterwards | `tests/tests-auth/602-login-ui.spec.ts` |
| AUTH-015 | P1 | Should send the user to the login page when their session ends while the page is open | `tests/tests-auth/602-login-ui.spec.ts` |
| AUTH-016 | P0 | Should keep the session cookie out of reach of page scripts | `tests/tests-auth/602-login-ui.spec.ts` |
