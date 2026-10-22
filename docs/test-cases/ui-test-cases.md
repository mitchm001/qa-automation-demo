# UI test cases

Browser tests for the event sign-up page. See [README.md](README.md) for conventions, priorities and the traceability table.

**Starting state for every case** (unless *Preconditions* says otherwise): fresh database, *QA Automation Meetup*,
21 of 25 seats filled, waitlist empty, and the form allows up to 5 people per sign-up.
The seeded people include international names (Fernando Corbató, 行弘 松本, Muhammad al-Khwārizmī, Ole-Johan Dahl). Seeded person used below: **Ada Lovelace**, `ada.lovelace@example.com`.

The app shows one status banner near the top of the page. A **green success message** means the banner has the
success styling: light green background `#e7f6ec`, dark green text `#146c2e`.

---

## 1. Page load

### UI-001: Should load the event page showing 21 of 25 seats filled
**Priority:** P1 · **Automated:** `tests/tests-ui/201-page-load.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Open the app | Page title heading is "QA Automation Meetup" |
| 2 | Look at the header | "21 of 25 seats filled" |
| 3 | Look at the Confirmed card | Heading "Confirmed (21)", 21 rows |
| 4 | Look at the Waitlist card | Heading "Waitlist (0)", text "Nobody is on the waitlist." |

### UI-040: Should show the empty Waitlist card with "Nobody is on the waitlist." when nobody is waitlisted
**Priority:** P2 · **Automated:** `tests/tests-ui/201-page-load.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Open the app (nobody is waitlisted) | Waitlist heading "Waitlist (0)" |
| 2 | Look at the Waitlist card | Text "Nobody is on the waitlist." is shown; no table; no **Clear waitlist** button |

### UI-002: Should have no automatically detectable accessibility violations
**Priority:** P2 · **Automated:** `tests/tests-ui/201-page-load.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Open the app | Page loads |
| 2 | Run an axe-core scan of the whole page | Zero violations |

---

## 2. Sign-up form: field validation

These checks run in the browser. When they fail, nothing is sent to the server and the seat picker doesn't open.

### UI-003: Should display "First name is required." when First name is left empty
**Priority:** P1 · **Automated:** `tests/tests-ui/202-signup-validation.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | In Person 1, leave **First name** empty; enter a Last name and a valid Email | — |
| 2 | Click **Sign up** | Under First name: "First name is required."; the field is outlined red (`aria-invalid="true"`) and has focus |
| 3 | Check the other fields | Last name and Email show no error |
| 4 | Check the header | Still "21 of 25 seats filled"; Confirmed still has 21 rows |

### UI-004: Should display "Last name is required." when Last name is left empty
**Priority:** P1 · **Automated:** `tests/tests-ui/202-signup-validation.spec.ts`

Same as UI-003, but **Last name** is empty. Expected message: "Last name is required." Only Last name is flagged and focused.

### UI-005: Should display "Email is required." when Email is left empty
**Priority:** P1 · **Automated:** `tests/tests-ui/202-signup-validation.spec.ts`

Same as UI-003, but **Email** is empty. Expected message: "Email is required." Only Email is flagged and focused.

### UI-006: Should display "Email is not valid." for an invalid email
**Priority:** P1 · **Automated:** `tests/tests-ui/202-signup-validation.spec.ts` (data-driven: one test per value)

**Test data:** `jane`, `jane@`, `jane@example`, `jane doe@example.com`, `@example.com`

| Step | Action | Expected result |
|---|---|---|
| 1 | In Person 1, enter a valid First and Last name and an Email from the test data | — |
| 2 | Click **Sign up** | Under Email: "Email is not valid."; Email is outlined red |
| 3 | Check the other fields | First and Last name show no error |
| 4 | Check the header | Still "21 of 25 seats filled" |

### UI-044: Should clear a field's error as soon as the user starts typing in it
**Priority:** P2 · **Automated:** `tests/tests-ui/202-signup-validation.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Leave every field empty and click **Sign up** | All three fields show "… is required." |
| 2 | Type one character into **First name** | First name's error disappears and the field is no longer outlined red |
| 3 | Check the other fields | Last name and Email still show their errors |

### UI-045: Should display "{Field} can't contain emoji." when a field has an emoji
**Priority:** P2 · **Automated:** `tests/tests-ui/202-signup-validation.spec.ts` (data-driven: one test per field)

**Test data:** First name `Ada😀` · Last name `Lovelace👍🏽` · Email `ada🇺🇸@example.com`

| Step | Action | Expected result |
|---|---|---|
| 1 | Fill Person 1 with valid details, except the field from the test data | — |
| 2 | Click **Sign up** | Under that field: "First name / Last name / Email can't contain emoji."; outlined red |
| 3 | Check the header | Still "21 of 25 seats filled" (nothing was sent) |

---

## 3. Sign up: seats available

### UI-007: Should confirm everyone and display "Signed up 2 people: 2 confirmed, 0 waitlisted."
**Priority:** P1 · **Automated:** `tests/tests-ui/203-signup-open-seats.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Fill Person 1; click **Add another person**; fill Person 2 (unique emails) | Two rows: "Person 1", "Person 2" |
| 2 | Click **Sign up** | No seat picker. Green success message "Signed up 2 people: 2 confirmed, 0 waitlisted." |
| 3 | Check the page | "23 of 25 seats filled"; both people appear in Confirmed; waitlist still empty |

### UI-043: Should reset the form to one empty "Person 1" row after a successful sign-up
**Priority:** P2 · **Automated:** `tests/tests-ui/203-signup-open-seats.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 3 people and click **Sign up** | "Signed up 3 people: 3 confirmed, 0 waitlisted." |
| 2 | Check the form | One row, "Person 1", with empty First name, Last name and Email; no Remove link on it; **Add another person** enabled; no error under the form |

### UI-008: Should fill every open seat using "Add another person" without waitlisting anyone
**Priority:** P0 · **Automated:** `tests/tests-ui/203-signup-open-seats.spec.ts`

Boundary test: exactly as many people as open seats (4).

| Step | Action | Expected result |
|---|---|---|
| 1 | Use **Add another person** to create 4 rows; fill each with unique details | 4 rows |
| 2 | Click **Sign up** | No seat picker. Green success message "Signed up 4 people: 4 confirmed, 0 waitlisted." |
| 3 | Check the page | "25 of 25 seats filled"; Confirmed has 25 rows, the 4th new person is last; "Waitlist (0)", "Nobody is on the waitlist." |

### UI-034: Should disable "Add another person" once 5 people are entered
**Priority:** P1 · **Automated:** `tests/tests-ui/203-signup-open-seats.spec.ts`

Boundary test: the form allows at most 5 "Person" rows.

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Add another person** 4 times and fill all 5 rows | 5 rows: Person 1–5 |
| 2 | Look at **Add another person** | Disabled and greyed out (50% opacity) |
| 3 | Click **Remove** in Person 5 | 4 rows; **Add another person** is enabled again |
| 4 | Click **Add another person** | 5 rows; the button is disabled again |

### UI-009: Should not sign up a person whose row was removed from the form before submitting
**Priority:** P2 · **Automated:** `tests/tests-ui/203-signup-open-seats.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Create 3 rows with **Add another person** and fill all three | Person 1, 2, 3 |
| 2 | Click **Remove** in Person 2 | 2 rows remain, renumbered "Person 1" and "Person 2"; the new Person 2 holds the third person's details |
| 3 | Click **Sign up** | "Signed up 2 people: 2 confirmed, 0 waitlisted." |
| 4 | Check both lists | People 1 and 3 are in Confirmed; the removed person is in neither list |

### UI-010: Should allow a sign-up with the same name as an existing person when the email is different
**Priority:** P1 · **Automated:** `tests/tests-ui/203-signup-open-seats.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter First name "Ada", Last name "Lovelace", and a new unique email | — |
| 2 | Click **Sign up** | "Signed up 1 person: 1 confirmed, 0 waitlisted." |
| 3 | Check Confirmed | Two "Ada Lovelace" rows: the seeded one and the new one (different emails) |

### UI-042: Should send only one sign-up request when "Sign up" is double-clicked ⚠️ known bug
**Priority:** P2 · **Automated:** `tests/tests-ui/203-signup-open-seats.spec.ts`, marked `test.skip()`, linked to **BUG-002** in [../bug-reports.md](../bug-reports.md)

| Step | Action | Expected result |
|---|---|---|
| 1 | Fill Person 1 with a new person | — |
| 2 | Double-click **Sign up** quickly | Exactly one sign-up request is sent |
| 3 | Check the page | Only "Signed up 1 person: 1 confirmed, 0 waitlisted."; no error under the form; "22 of 25 seats filled" |

**Currently:** two requests are sent (201, then 409) and a false duplicate error appears under the emptied form.

---

## 4. Sign up: duplicate emails

Duplicates are checked by email only, ignoring capital letters, against everyone already in the event (confirmed or waitlisted).

### UI-011: Should block a sign-up whose email is already signed up
**Priority:** P0 · **Automated:** `tests/tests-ui/204-duplicate-email.spec.ts` (data-driven)

**Test data:** `ada.lovelace@example.com` (same) · `ADA.LOVELACE@EXAMPLE.COM` (different capitals)

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter "Augusta King" with an email from the test data | — |
| 2 | Click **Sign up** | Under Email: "ada.lovelace@example.com is already signed up for this event."; Email outlined red; below the form: "One or more people are already signed up for this event." |
| 3 | Check the page | Still "21 of 25 seats filled", 21 confirmed, no "Augusta King" row |

### UI-012: Should allow a sign-up with that email after the existing person is removed from the Confirmed list
**Priority:** P1 · **Automated:** `tests/tests-ui/204-duplicate-email.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter "Augusta King" with `ada.lovelace@example.com`; click **Sign up** | Duplicate error under Email (as in UI-011) |
| 2 | In Confirmed, click **Remove** for Ada Lovelace | Green success message "Removed Ada Lovelace." |
| 3 | Click **Sign up** again (the form still holds Augusta's details) | "Signed up 1 person: 1 confirmed, 0 waitlisted." |
| 4 | Check Confirmed | The `ada.lovelace@example.com` row now shows "Augusta King"; no "Ada Lovelace" row; "21 of 25 seats filled" |

### UI-036: Should block a sign-up whose email belongs to someone on the waitlist
**Priority:** P0 · **Automated:** `tests/tests-ui/204-duplicate-email.spec.ts`
**Preconditions:** event full plus 1 person (W1) on the waitlist, via the API.

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter "Augusta King" with W1's email; click **Sign up** | "This event is full" pop-up (the event is full) |
| 2 | Click **Add selected to the waitlist** | Under Email: "&lt;W1 email&gt; is already signed up for this event."; below the form: "One or more people are already signed up for this event." |
| 3 | Check the Waitlist | Still "Waitlist (1)"; no "Augusta King" row |

### UI-041: Should flag the repeated email on the correct person when the same email is entered twice in one sign-up ⚠️ known bug
**Priority:** P2 · **Automated:** `tests/tests-ui/204-duplicate-email.spec.ts`, marked `test.skip()`, linked to **BUG-001** in [../bug-reports.md](../bug-reports.md)

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 5 people; give Person 5 the same email as Person 1 | — |
| 2 | Click **Sign up** | The seat picker does **not** open. Under Person 5's Email: "This email is already used by person 1 in this list." |

**Currently:** the seat picker opens; after choosing seats, the error appears under Person 1 and says "person 4".

---

## 5. Seat picker and waitlist

### UI-013: Should seat the selected people and waitlist the rest
**Priority:** P0 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 5 people (P1–P5) and click **Sign up** | Pop-up titled "Only 4 seats left"; "Seat selected, waitlist the rest" is disabled |
| 2 | Check P1, P2, P4, P5 | Counter "4 of 4 seats selected"; P3's checkbox is now disabled (limit reached) |
| 3 | Click **Seat selected, waitlist the rest** | Green success message "Signed up 5 people: 4 confirmed, 1 waitlisted." |
| 4 | Check the lists | "25 of 25 seats filled"; P1, P2, P4, P5 in Confirmed; Waitlist shows P3 |

### UI-035: Should seat the selected people and leave out the rest with "Seat selected, don't add the rest"
**Priority:** P1 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 5 people (P1–P5) and click **Sign up** | "Only 4 seats left" pop-up; "Seat selected, don't add the rest" is disabled |
| 2 | Check P1, P2, P3, P5; click **Seat selected, don't add the rest** | Green success message "Signed up 4 people: 4 confirmed, 0 waitlisted." |
| 3 | Check the lists | "25 of 25 seats filled"; P1, P2, P3, P5 in Confirmed; P4 in neither list; "Nobody is on the waitlist." |

### UI-029: Should close the "Only 4 seats left" pop-up without signing anyone up
**Priority:** P1 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` (data-driven)

**Test data:** close with the **Cancel** button · close with the **Escape** key

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 5 people and click **Sign up** | "Only 4 seats left" pop-up |
| 2 | Close it using the method from the test data | Pop-up closes; no status message |
| 3 | Check the page | Still "21 of 25 seats filled"; "Waitlist (0)" |
| 4 | Check the form | Still 5 rows with the entered details, ready to edit and resubmit |

### UI-014: Should add one person to the waitlist when the event is full
**Priority:** P0 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts`
**Preconditions:** event full (4 more people signed up via the API → 25 of 25).

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter one new person and click **Sign up** | Pop-up titled "This event is full" with a red caution icon; text starts "There are no open seats."; the person's checkbox is checked |
| 2 | Click **Add selected to the waitlist** | Pop-up closes |
| 3 | Check the page | "Waitlist (1)" listing the person; still "25 of 25 seats filled", 25 confirmed |

### UI-015: Should add several people entered with "Add another person" to the waitlist when the event is full
**Priority:** P1 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts`
**Preconditions:** event full (via the API).

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 3 people using **Add another person**; click **Sign up** | "This event is full" pop-up with 3 checkboxes; counter "3 of 3 selected for the waitlist" |
| 2 | Click **Add selected to the waitlist** | "Waitlist (3)" listing all three in the order entered; Confirmed still 25 |

### UI-016: Should add only the checked people to the waitlist when some are unchecked
**Priority:** P1 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts`
**Preconditions:** event full (via the API).

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 4 people (P1–P4); click **Sign up** | "This event is full" pop-up, all 4 checked |
| 2 | Uncheck P2 and P4 (don't use Select all) | Counter "2 of 4 selected for the waitlist"; Select all shows the partial (dash) state |
| 3 | Click **Add selected to the waitlist** | Waitlist shows P1 then P3 |
| 4 | Check both lists | P2 and P4 are in neither list |

### UI-017: Should add everyone to the waitlist using "Select all"
**Priority:** P1 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts`
**Preconditions:** event full (via the API).

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 3 people; click **Sign up** | "Select all" is checked by default |
| 2 | Uncheck **Select all** | All 3 people unchecked; "Add selected to the waitlist" disabled |
| 3 | Check **Select all** | All 3 checked; counter "3 of 3 selected for the waitlist" |
| 4 | Click **Add selected to the waitlist** | All 3 on the waitlist, in the order entered |

### UI-030: Should close the "This event is full" pop-up without waitlisting anyone
**Priority:** P1 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts` (data-driven)
**Preconditions:** event full (via the API).

**Test data:** close with the **Cancel** button · close with the **Escape** key

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 2 people and click **Sign up** | "This event is full" pop-up |
| 2 | Close it using the method from the test data | Pop-up closes; no status message |
| 3 | Check the page | "Waitlist (0)", "Nobody is on the waitlist."; Confirmed still 25 |
| 4 | Check the form | Still 2 rows |

### UI-018: Should display "Signed up 2 people: 0 confirmed, 2 waitlisted." when everyone goes on the waitlist
**Priority:** P2 · **Automated:** `tests/tests-ui/205-seat-picker-and-waitlist.spec.ts`
**Preconditions:** event full (via the API).

| Step | Action | Expected result |
|---|---|---|
| 1 | Enter 2 people; click **Sign up**; click **Add selected to the waitlist** | Green success message "Signed up 2 people: 0 confirmed, 2 waitlisted." |

---

## 6. Confirmed list: removing a person

Each case removes the seeded person **Ada Lovelace** with the **Remove** link in her row.

### UI-019: Should remove the person from the Confirmed list
**Priority:** P1 · **Automated:** `tests/tests-ui/206-remove-confirmed.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Find Ada Lovelace in Confirmed | Row is visible |
| 2 | Click **Remove** in her row | Her row disappears; Confirmed has 20 rows |

### UI-020: Should update the "Confirmed (n)" heading after a removal
**Priority:** P2 · **Automated:** `tests/tests-ui/206-remove-confirmed.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Check the heading | "Confirmed (21)" |
| 2 | Remove Ada Lovelace | "Confirmed (20)" |

### UI-021: Should update "n of 25 seats filled" after a removal
**Priority:** P2 · **Automated:** `tests/tests-ui/206-remove-confirmed.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Check the header | "21 of 25 seats filled" |
| 2 | Remove Ada Lovelace | "20 of 25 seats filled" |

### UI-022: Should update the seat progress bar after a removal
**Priority:** P2 · **Automated:** `tests/tests-ui/206-remove-confirmed.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Check the progress bar under "n of 25 seats filled" | Value 21, maximum 25 |
| 2 | Remove Ada Lovelace | Value 20, maximum still 25 |

### UI-023: Should display the green success message "Removed Ada Lovelace." after a removal
**Priority:** P2 · **Automated:** `tests/tests-ui/206-remove-confirmed.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Remove Ada Lovelace | Green success message "Removed Ada Lovelace." |

### UI-032: Should move the first waitlisted person into the freed seat
**Priority:** P0 · **Automated:** `tests/tests-ui/206-remove-confirmed.spec.ts`
**Preconditions:** event full plus 3 people on the waitlist (W1, W2, W3), via the API.

| Step | Action | Expected result |
|---|---|---|
| 1 | Check the Waitlist | "Waitlist (3)" |
| 2 | Remove Ada Lovelace from Confirmed | Green success message "Removed Ada Lovelace. &lt;W1 first&gt; &lt;W1 last&gt; moved from the waitlist into the open seat." |
| 3 | Check Confirmed | W1 is now confirmed; Ada Lovelace is gone; still "25 of 25 seats filled" |
| 4 | Check the Waitlist | "Waitlist (2)" showing W2 then W3 |

---

## 7. Waitlist: removing people

**Preconditions for this section:** event full plus 3 people on the waitlist (W1, W2, W3), all via the API.

### UI-024: Should remove one person from the waitlist and display "Removed &lt;first&gt; &lt;last&gt;."
**Priority:** P2 · **Automated:** `tests/tests-ui/207-waitlist-management.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Remove** for W2 in the Waitlist | Green success message "Removed &lt;W2 first&gt; &lt;W2 last&gt;." |
| 2 | Check the lists | Waitlist shows W1 then W3; Confirmed still 25 |

### UI-037: Should renumber the "#" column in both lists after people are removed
**Priority:** P2 · **Automated:** `tests/tests-ui/207-waitlist-management.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Remove W2 from the Waitlist | Waitlist shows W1, W3 numbered 1, 2 |
| 2 | Remove Ada Lovelace from Confirmed (W1 moves up) | Waitlist shows W3 numbered 1; Confirmed is numbered 1–25 with no gaps |

### UI-025: Should empty the waitlist with "Clear waitlist"
**Priority:** P1 · **Automated:** `tests/tests-ui/207-waitlist-management.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Clear waitlist** | "Waitlist (0)"; "Nobody is on the waitlist."; the table and the Clear waitlist button are hidden |
| 2 | Check the header | Still "25 of 25 seats filled" |

### UI-026: Should display "Removed 3 people from the waitlist." after "Clear waitlist"
**Priority:** P2 · **Automated:** `tests/tests-ui/207-waitlist-management.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Clear waitlist** | Green success message "Removed 3 people from the waitlist." (different from UI-024's single-person message) |

---

## 8. Network errors

These tests use Playwright's `page.route()` to make the browser's request fail, as if the server were unreachable.

### UI-038: Should display a red "Could not reach the server" message and keep the form filled when sign-up fails
**Priority:** P2 · **Automated:** `tests/tests-ui/208-network-errors.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Open the app; make the sign-up request fail | — |
| 2 | Enter a person and click **Sign up** | Red error message "Could not reach the server. Please try again." (light red background `#fdecea`, red text `#b42318`) |
| 3 | Check the form and header | The person's details are still in the form; still "21 of 25 seats filled" |

### UI-039: Should display a red "Could not load the event" message when the page cannot load the event
**Priority:** P2 · **Automated:** `tests/tests-ui/208-network-errors.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Make the request for the event fail, then open the app | Red error message "Could not load the event. Is the server running?" |
| 2 | Check the header | Still shows "Loading event…" |

---

## 9. Confirmed list: Remove all

### UI-031: Should close the "Remove all" pop-up without removing anyone
**Priority:** P1 · **Automated:** `tests/tests-ui/209-remove-all-confirmed.spec.ts` (data-driven)

**Test data:** close with the **Cancel** button · close with the **Escape** key

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Remove all** | Confirmation pop-up opens; **Cancel** has focus (the safe default) |
| 2 | Close it using the method from the test data | Pop-up closes; no status message |
| 3 | Check the page | Still "Confirmed (21)", 21 rows, "21 of 25 seats filled" |

### UI-033: Should move waitlisted people into the freed seats, in waitlist order, after "Remove all"
**Priority:** P0 · **Automated:** `tests/tests-ui/209-remove-all-confirmed.spec.ts`
**Preconditions:** event full plus 3 people on the waitlist (W1, W2, W3), via the API.

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Remove all** | Pop-up also says "People on the waitlist will move into the open seats, in waitlist order." |
| 2 | Click **Remove all** in the pop-up | Green success message "Removed 25 people from the Confirmed list. 3 people moved from the waitlist into seats." |
| 3 | Check Confirmed | Exactly W1, W2, W3, in that order; "3 of 25 seats filled" |
| 4 | Check the Waitlist | "Waitlist (0)", "Nobody is on the waitlist." |

### UI-027: Should remove everyone from the Confirmed list after confirming "Remove all"
**Priority:** P1 · **Automated:** `tests/tests-ui/209-remove-all-confirmed.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Remove all** at the bottom of the Confirmed card | Pop-up with a red caution icon asking "Are you sure you want to remove all users from the Confirmed list?" |
| 2 | Click **Remove all** in the pop-up | Pop-up closes; green success message "Removed 21 people from the Confirmed list." |
| 3 | Check Confirmed | No rows |

### UI-028: Should show an empty Confirmed list after everyone is removed
**Priority:** P2 · **Automated:** `tests/tests-ui/209-remove-all-confirmed.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Remove all**, then confirm | — |
| 2 | Check the Confirmed card | Heading "Confirmed (0)", no rows, the **Remove all** button is hidden |
| 3 | Check the header | "0 of 25 seats filled"; progress bar value 0 |

---

## 10. Reset UI

Runs last. **Preconditions for this section (set up through the API before each test):** 4 new people fill the event,
3 more join the waitlist (W1, W2, W3), then Ada Lovelace is removed so W1 moves up. Each test first confirms the
page shows 25 confirmed, Waitlist W2, W3, and no Ada, so a reset has something to undo.

### UI-046: Should show what Reset UI does when hovering the "i" icon
**Priority:** P3 · **Automated:** `tests/tests-ui/210-reset-ui.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Look at the top right, next to **Reset UI** | The explanation is hidden |
| 2 | Hover the **i** icon | Shows: "Resets the Confirmed list and the waitlist to their original testing state: the 21 starting people, nobody waitlisted. Anyone you've added or removed will be lost." |
| 3 | Move the mouse away | The explanation hides again |

### UI-047: Should ask for confirmation before resetting
**Priority:** P2 · **Automated:** `tests/tests-ui/210-reset-ui.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Reset UI** | Pop-up with a red caution icon: "Reset to the original testing data?" and "This puts the Confirmed list and the waitlist back to the original 21 people. Anyone you've added or removed will be lost." Buttons **Cancel** (focused) and **Reset** |

### UI-048: Should keep both lists unchanged when the Reset UI pop-up is closed
**Priority:** P1 · **Automated:** `tests/tests-ui/210-reset-ui.spec.ts` (data-driven)

**Test data:** close with the **Cancel** button · close with the **Escape** key

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Reset UI**, then close the pop-up with the method from the test data | Pop-up closes; no status message |
| 2 | Check both lists | Unchanged: 25 confirmed without Ada; Waitlist W2, W3 |

### UI-049: Should restore the original 21 people and empty the waitlist after confirming Reset UI
**Priority:** P1 · **Automated:** `tests/tests-ui/210-reset-ui.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Type a person into the form (don't submit) | — |
| 2 | Click **Reset UI**, then **Reset** | Green success message "Reset to the original testing data: 21 of 25 seats filled, nobody waitlisted." |
| 3 | Check Confirmed | "Confirmed (21)"; Ada Lovelace is back in first place; none of the 7 added people remain |
| 4 | Check the Waitlist and form | "Waitlist (0)", "Nobody is on the waitlist."; the form is back to one empty row |

### UI-050: Should save the reset on the server so it is still there after a page reload
**Priority:** P2 · **Automated:** `tests/tests-ui/210-reset-ui.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Click **Reset UI**, then **Reset** | "21 of 25 seats filled" |
| 2 | Reload the page | Still "21 of 25 seats filled"; Ada Lovelace is listed; "Nobody is on the waitlist." |

