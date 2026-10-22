# API test cases

Tests that call the HTTP API directly with Playwright's `request` fixture: no browser.
See [README.md](README.md) for conventions, priorities and the traceability table.

**Starting state:** fresh database, event 1 *QA Automation Meetup*, capacity 25, 21 confirmed
(sign-up id 1 is Ada Lovelace, `ada.lovelace@example.com`), waitlist empty, 4 seats open.

**Every error response** is JSON in one shape: `{ "error": { "code", "message", "fieldErrors"? } }`.
The tests check the status code first, then the `Content-Type`, `code`, and (where stated) the exact
`message` and `fieldErrors`.

| Spec file | Section |
|---|---|
| `tests/tests-api/101-status-codes.spec.ts` | 1. Status codes |
| `tests/tests-api/102-validation.spec.ts` | 2. Validation |
| `tests/tests-api/103-create.spec.ts` | 3. Create |
| `tests/tests-api/104-read.spec.ts` | 4. Read |
| `tests/tests-api/105-update.spec.ts` | 5. Update |
| `tests/tests-api/106-delete.spec.ts` | 6. Delete |
| `tests/tests-api/107-concurrency.spec.ts` | 7. Concurrency |
| `tests/tests-api/108-response-schemas.spec.ts` | 8. Response schemas |

---

## 1. Status codes

### Success codes

| ID | Priority | Title | Request | Expected |
|---|---|---|---|---|
| API-101 | P1 | Should return 200 and { status: "ok" } from the health check | `GET /api/health` | **200** `{ "status": "ok" }` |
| API-102 | P1 | Should return 200 and the list of events | `GET /api/events` | **200**, one event: id 1, capacity 25, 21 confirmed, 0 waitlisted, 4 available |
| API-103 | P1 | Should return 200 and the seeded event with 21 of 25 seats taken | `GET /api/events/1` | **200**, exactly the seeded summary |
| API-104 | P0 | Should return 201 Created for a valid sign-up | `POST /api/events/1/signups` with one valid person | **201**, JSON |
| API-105 | P1 | Should return 200 when a sign-up is removed | `DELETE /api/events/1/signups/1` | **200** |

### Error codes

| ID | Priority | Title | Request | Expected |
|---|---|---|---|---|
| API-106 | P1 | Should return 404 for an event id that doesn't exist or isn't a whole number | `GET /api/events/{id}` for `999`, `0`, `-1`, `abc`, `1.5` (5 data rows) | **404** `NOT_FOUND`, "Event {id} was not found." |
| API-107 | P3 | Should treat an id with leading zeros ("01") as the same as "1" | `GET /api/events/01`, `GET /api/events/1/signups/001` | Both **200**, returning event 1 and sign-up 1 (documents current behaviour) |
| API-108 | P2 | Should return 404, not crash, for an id too large to be a valid number | `GET` event, `GET` and `DELETE` sign-up with id `99999999999999999999` | All **404** `NOT_FOUND`; `/api/health` still 200 |
| API-109 | P1 | Should return 404 when getting or removing a sign-up that doesn't exist | `GET` and `DELETE /api/events/1/signups/9999` | **404** `NOT_FOUND`, "Sign-up 9999 was not found for event 1." |
| API-110 | P1 | Should return 404 when signing up for an event that doesn't exist | `POST /api/events/999/signups`, valid body | **404**, "Event 999 was not found." |
| API-111 | P2 | Should return 404 with a JSON error for an unknown API route | `GET /api/nope`, `PUT /api/events/1`, `PATCH /api/events/1/signups/1` (3 data rows) | **404** `NOT_FOUND`, "No API route for {METHOD} {path}." |
| API-112 | P1 | Should return 415 when the sign-up body isn't JSON | `POST …/signups` as plain text, as form data, and with no body (3 data rows) | **415** `UNSUPPORTED_MEDIA_TYPE`, "Request body must be JSON (Content-Type: application/json)." |
| API-113 | P1 | Should return 400 when the JSON body is malformed | `POST …/signups`, JSON content type, body `{"attendees": [` | **400** `INVALID_JSON`, "Request body is not valid JSON." |
| API-114 | P1 | Should return 400 with field errors when a field is invalid | One person with email `not-an-email` | **400** `VALIDATION_ERROR`, "Some fields are not valid.", `{ "attendees[0].email": "Email is not valid." }` |
| API-115 | P0 | Should return 409 Conflict when the email is already signed up | One person with `ada.lovelace@example.com` | **409** `DUPLICATE_EMAIL`, "One or more people are already signed up for this event." |

---

## 2. Validation

All failures below return **400** `VALIDATION_ERROR` with the exact `fieldErrors` shown.

### Request shape

| ID | Priority | Title | Test data | Expected `fieldErrors` |
|---|---|---|---|---|
| API-116 | P1 | Should return 400 when attendees isn't a list | `{}` · `{ attendees: "Ada Lovelace" }` · `{ attendees: { … } }` · body is an array (4 data rows) | `attendees`: "attendees must be a list of people." |
| API-117 | P1 | Should return 400 for 0 or 6 people in one sign-up | 0 people · 6 people (2 data rows) | `attendees`: "Add between 1 and 5 people per sign-up." |
| API-118 | P1 | Should accept 1 or 5 people in one sign-up (boundary) | 1 person · 5 people (2 data rows) | **201**; the response lists that many sign-ups |
| API-119 | P2 | Should return 400 when a person isn't an object | `null` · `"Ada Lovelace"` · `42` · `["Ada","Lovelace"]` (4 data rows) | `attendees[0]`: "Each person must be an object with firstName, lastName and email." |

### Names (First name and Last name each)

| ID | Priority | Title | Test data | Expected |
|---|---|---|---|---|
| API-120 | P1 | Should return 400 "{Label} is required." when the name is missing, empty or the wrong type | missing · `""` · `"   "` · `null` · `42` · `true`, for each name field (12 data rows) | `attendees[0].{field}`: "{Label} is required." |
| API-121 | P1 | Should accept a name of exactly 50 characters and reject 51 | 50 characters, then 51, for each name field (2 data rows) | 50 → **201**, saved exactly; 51 → "{Label} must be 50 characters or fewer." |

### Email

| ID | Priority | Title | Test data | Expected |
|---|---|---|---|---|
| API-122 | P1 | Should return 400 "Email is required." when the email is missing, empty or the wrong type | missing · `""` · `"   "` · `null` · `42` (5 data rows) | `attendees[0].email`: "Email is required." |
| API-123 | P1 | Should return 400 "Email is not valid." for a badly formed email | `jane` · `jane@` · `jane@example` · `@example.com` · `jane doe@example.com` · `jane@exa mple.com` · `jane@@example.com` (7 data rows) | `attendees[0].email`: "Email is not valid." |
| API-124 | P2 | Should accept an email of exactly 254 characters and reject 255 | 254 characters, then 255 | 254 → **201**; 255 → "Email must be 254 characters or fewer." |

### Whole request

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| API-125 | P1 | Should report every invalid field at once, keyed by person and field | Send 3 people: #1 empty first name + bad email, #2 valid, #3 missing last name | **400** with exactly `attendees[0].firstName`, `attendees[0].email`, `attendees[2].lastName` |
| API-126 | P1 | Should return 400 when the same email appears twice in one request, ignoring capitals | Send 2 people; the second uses the first's email in capitals | **400**, `attendees[1].email`: "This email is already used by person 1 in this list." |
| API-127 | P0 | Should save nobody when any person in the request is invalid | Send 1 valid + 1 invalid person; then read the event and sign-ups | **400**; still 21 confirmed; the valid person was **not** saved |
| API-128 | P2 | Should trim spaces from every field and save the email in lowercase | Send `"  Grace "`, `" Hopper  "`, `"  Grace.HOPPER.trim@Example.COM "`; then `GET` it by id | **201**; saved and read back as `Grace`, `Hopper`, `grace.hopper.trim@example.com` |
| API-129 | P2 | Should return 400 "{Field} can't contain emoji." for any field containing an emoji | Each field (first name, last name, email) × 😀, 👍🏽 (skin tone), 🇺🇸 (flag), ❤️, 👨‍👩‍👧 (combined) (15 data rows) | `attendees[0].{field}`: "First name / Last name / Email can't contain emoji."; nobody saved. Letters from any language (é, ü, 李) are still allowed |

---

## 3. Create

`POST /api/events/:eventId/signups`. Signing up for a full event is still a **201**: the person comes back
`waitlisted`, so each test checks the status code and then reads the data back.

**Spec:** `tests/tests-api/103-create.spec.ts`

### Sign-ups

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| API-130 | P0 | Should create a sign-up and read the same data back by id | `POST` one person; `GET …/signups/{new id}` | **201**: response has the event (22 confirmed) and the sign-up `{ id, eventId: 1, firstName, lastName, email, status: "confirmed" }`. **200**: the GET returns the identical object |
| API-131 | P0 | Should seat people in the order sent and waitlist anyone past the capacity | Send 5 people (4 seats open) | **201**; people 1–4 `confirmed`, person 5 `waitlisted`; 25 confirmed, 1 waitlisted |
| API-132 | P0 | Should waitlist every new sign-up once the event is full, in arrival order | Fill the event; send 2 people, then 2 more | Both **201**; waitlist is those 4 in arrival order; 25 confirmed, 4 waitlisted |

### Duplicate emails

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| API-133 | P0 | Should return 409 for an email already confirmed | Send Ada's email as: exact · capitals · with spaces (3 data rows) | **409** `DUPLICATE_EMAIL`, `attendees[0].email`: "ada.lovelace@example.com is already signed up for this event."; still 21 confirmed |
| API-134 | P0 | Should return 409 for an email that is on the waitlist | Fill + 1 waitlisted; sign up with the waitlisted email | **409**; still 1 waitlisted |
| API-135 | P0 | Should save nobody when one person in the request is a duplicate | Send 2 new people + Ada's email | **409**, only `attendees[2].email` flagged; neither new person saved; still 21 confirmed |
| API-136 | P1 | Should allow an email to sign up again after that person is removed | Remove Ada; sign up "Augusta King" with Ada's email | **201**, `confirmed` |

---

## 4. Read

`GET` the events and sign-ups, and check exactly what comes back.

**Spec:** `tests/tests-api/104-read.spec.ts`

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| API-137 | P2 | Should return exactly the documented fields for a sign-up | `GET …/signups/1` | **200**; fields are exactly `email, eventId, firstName, id, lastName, status`, nothing extra |
| API-138 | P1 | Should list every sign-up in arrival order, with new sign-ups last | `GET …/signups`; `POST` 2 people; `GET` again | 21 rows, first is Ada (id 1), ids ascending; then 23 rows with the 2 new people last, in order |
| API-139 | P2 | Should include the event with live seat counts in the event list | `POST` 2 people; `GET /api/events` | **200**; event 1 shows 23 confirmed, 0 waitlisted, 2 available |

---

## 5. Update

There's no endpoint to edit a sign-up directly. The only update is a status change from `waitlisted` to
`confirmed`, which happens when a seat frees up.

**Spec:** `tests/tests-api/105-update.spec.ts`

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| API-140 | P0 | Should move the longest-waiting person into a freed seat when a confirmed person is removed | Fill + 3 waitlisted (W1–W3); remove Ada | **200**, `promoted` is W1 with `confirmed`; GET W1 → `confirmed`; waitlist W2, W3; 25 / 2 |
| API-141 | P0 | Should move the whole waitlist up, in order, when everyone confirmed is removed | Fill + 3 waitlisted; `DELETE …/confirmed` | **200**, `removedCount: 25`, `promoted` = W1, W2, W3 in order, all `confirmed`; 3 confirmed, 0 waitlisted |
| API-142 | P1 | Should move up at most 25 people when the waitlist is longer than the capacity | Fill + 30 waitlisted (6 requests of 5); `DELETE …/confirmed` | `promoted` = the first 25 waitlisted, in order; the last 5 still waiting, in order; 25 / 5 |

---

## 6. Delete

Remove one sign-up, clear the waitlist, or remove everyone confirmed, then read back to prove it.

**Spec:** `tests/tests-api/106-delete.spec.ts`

### One sign-up

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| API-143 | P0 | Should remove one sign-up so it can no longer be read | `DELETE …/signups/1`; `GET …/signups/1`; list; event | **200** `{ removed: { Ada… }, promoted: null }`; GET → **404**; Ada absent from the list; 20 confirmed, 5 available |
| API-144 | P2 | Should return 404 when the same sign-up is removed twice | `DELETE …/signups/1` twice | First **200**, second **404** |
| API-145 | P1 | Should not move anyone up when a waitlisted person is removed | Fill + 2 waitlisted; remove the first waitlisted | **200**, `promoted: null`; 25 confirmed, 1 waitlisted |
| API-146 | P1 | Should leave the seat open when a confirmed person is removed and nobody is waiting | Remove Ada (no waitlist) | **200**, `promoted: null`; 20 confirmed, 5 available |

### Whole lists

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| API-147 | P2 | Should give a new sign-up a fresh id, never the id of a deleted sign-up | Create one (id 22); delete it; create another | New id is greater than 22 (23), so links to deleted records never point at someone else |
| API-148 | P1 | Should clear the waitlist and leave the confirmed list alone | Event full + 3 waitlisted; `DELETE …/waitlist`; then again | **200** `{ removedCount: 3 }`; no waitlisted rows; 25 confirmed. Second call: **200** `{ removedCount: 0 }` |
| API-149 | P1 | Should remove everyone confirmed with one request | `DELETE …/confirmed` | **200** `{ removedCount: 21, promoted: [] }`; list is empty; 0 confirmed, 25 available |
| API-150 | P2 | Should return 404 when clearing lists on an event that doesn't exist | `DELETE /api/events/999/waitlist` and `/confirmed` | Both **404**, "Event 999 was not found." |
| API-151 | P1 | Should put both lists back to the original 21 people with the Reset UI route | Fill + 3 waitlisted, remove Ada; `POST /api/demo/reset` | **200** `{ status: "reset" }`; 21 confirmed, 0 waitlisted, 4 available; the sign-up list is identical to the original (same people, ids, order) |

---

## 7. Concurrency (race conditions)

Each person signs up from **their own API client**, all at the same moment (`Promise.all`). This is how two
real users would collide. A shared client can space the requests out and hide the race. In testing, a
shared-client version of API-153 passed even with the server's locking removed.

**Verified red/green:** with the server's locking removed, both tests fail on every run (5 of 5 each);
with it restored, both pass on every run.

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| API-152 | P0 | Should never confirm more people than the capacity when 20 sign-ups arrive at once | 20 single-person sign-ups at the same moment (4 seats open) | All **201**; exactly 4 `confirmed`, 16 `waitlisted`; event 25 / 16 / 0 available |
| API-153 | P0 | Should give the last seat to exactly one person when 10 people sign up for it at the same time | Sign up 3 normally (24 of 25), then 10 at the same moment | All **201**; exactly 1 `confirmed`, 9 `waitlisted`; event 25 / 9 |

---

## 8. Response schemas

Every response is checked against its documented shape in `tests/tests-support/helpers/schemas.ts` (written with
`zod`): field names, types, allowed values (e.g. `status` is only `confirmed` or `waitlisted`), and **no extra
fields**. One check covers every field, not just the ones a test happens to look at. On failure it lists every mismatch.

**Spec:** `tests/tests-api/108-response-schemas.spec.ts`

| ID | Priority | Title | Responses checked (16 data rows) | Expected |
|---|---|---|---|---|
| API-154 | P1 | Should match the documented response schema | `GET` health, events, event, sign-ups, sign-up · `POST` sign-ups (confirmed + waitlisted) · `DELETE` sign-up (with and without someone moving up), waitlist, confirmed · `POST` demo reset · errors 400 (validation), 400 (malformed JSON), 404, 409, 415 | Expected status code, and the body matches its schema exactly |

