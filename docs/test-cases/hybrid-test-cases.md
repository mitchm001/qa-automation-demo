# Hybrid test cases

Tests where the **UI and the API are both part of what's being checked**: one changes the data, the other
confirms it. (Tests that only use the API to set up a starting state stay in the UI suite.)
See [README.md](README.md) for conventions, priorities and the traceability table.

**Starting state:** fresh database, 21 of 25 seats filled, waitlist empty.

---

### HYB-001: Should save a UI sign-up on the server so it is still there after a page reload
**Priority:** P1 · **Automated:** `tests/tests-hybrid/301-signup-persistence.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | In the UI, sign up one new person | Green success message "Signed up 1 person: 1 confirmed, 0 waitlisted." |
| 2 | API: `GET /api/events/1/signups` | **200**; the list contains the person with matching first name, last name, and status `confirmed` |
| 3 | Reload the page | "22 of 25 seats filled"; the person is in the Confirmed list |

### HYB-002: Should use the latest seat count when seats are taken after the page has loaded
**Priority:** P0 · **Automated:** `tests/tests-hybrid/301-signup-persistence.spec.ts`

| Step | Action | Expected result |
|---|---|---|
| 1 | Open the app | "21 of 25 seats filled" (4 open) |
| 2 | API: sign up 2 other people (as if another user did) | **201**. The page still says "21 of 25" (it hasn't refreshed) |
| 3 | In the UI, enter 4 people (P1–P4) and click **Sign up** | Pop-up says "Only **2** seats left" (the app re-checked), not 4 |
| 4 | Check P1 and P3; click **Seat selected, waitlist the rest** | "Signed up 4 people: 2 confirmed, 2 waitlisted."; "25 of 25 seats filled"; Waitlist shows P2 then P4 |

---

## API changes appear in the UI, and UI changes confirmed through the API

**Automated:** `tests/tests-hybrid/302-api-changes-in-ui.spec.ts`

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| HYB-003 | P1 | Should show people added through the API in the Confirmed list | API: sign up 2 people (**201**); open the app | "23 of 25 seats filled"; both people in Confirmed, the second one last |
| HYB-004 | P1 | Should show an API removal, and who moved up, after the page reloads | Fill + 2 waitlisted (W1, W2) via API; open the app; API: remove Ada (**200**); reload | Ada gone; W1 in Confirmed; Waitlist shows only W2; "25 of 25 seats filled" |
| HYB-005 | P2 | Should show an empty waitlist after the waitlist is cleared through the API | Fill + 3 waitlisted; open the app ("Waitlist (3)"); API: clear waitlist (**200**); reload | "Waitlist (0)", "Nobody is on the waitlist."; Confirmed still 25 |
| HYB-006 | P2 | Should show an empty Confirmed list after everyone is removed through the API | Open the app; API: remove everyone confirmed (**200**); reload | "Confirmed (0)", no rows, "0 of 25 seats filled" |
| HYB-007 | P1 | Should delete the person on the server when they are removed in the UI | In the UI, remove Ada ("Removed Ada Lovelace."); API: `GET …/signups/1` and the event | **404** for Ada; 20 confirmed, 5 available |

