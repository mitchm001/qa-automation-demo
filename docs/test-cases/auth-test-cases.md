# Auth test cases

Login, logout and access control. See [README.md](README.md) for conventions, priorities and the traceability table.

**Demo account:** `demo` / `demo1234`. A setup step logs in once through the login page and saves the session;
the other suites reuse it. Tests marked *logged out* start without a session. Tests that log out log in
first on their own, so they never end the shared session.

---

## API

**Spec:** `tests/tests-auth/601-login-api.spec.ts` (all start logged out)

| ID | Priority | Title | Steps / test data | Expected |
|---|---|---|---|---|
| AUTH-001 | P0 | Should log in with the demo account and set a secure session cookie | `POST /api/auth/login` with the demo account | **200** `{ username: "demo" }`; `Set-Cookie: sid=<64 hex chars>` with `HttpOnly`, `SameSite=Lax`, `Path=/` |
| AUTH-002 | P0 | Should return 401 "Username or password is incorrect." for a wrong password | Demo username, wrong password | **401** `INVALID_CREDENTIALS`; no cookie set |
| AUTH-003 | P1 | Should return the same 401 for an unknown username, so usernames can't be discovered | Unknown username, demo password | Same **401** and message as AUTH-002; no cookie |
| AUTH-004 | P1 | Should return 400 with field errors when logging in with missing fields | No username · no password · both empty · username only spaces (4 data rows) | **400** `VALIDATION_ERROR` with "Username is required." / "Password is required." for exactly the missing fields |
| AUTH-005 | P0 | Should return 401 and change nothing when not logged in | Every event request: list/get events, list/get/create/remove sign-ups, clear waitlist, remove all confirmed, demo reset (9 data rows) | **401** `UNAUTHORIZED`, "You need to log in."; a logged-in check shows still 21 confirmed |
| AUTH-006 | P0 | Should return 401 for a made-up session cookie | `GET /api/events/1` with `sid=aaaa…` | **401** `UNAUTHORIZED` |
| AUTH-007 | P2 | Should keep the health check public | `GET /api/health` logged out | **200** `{ status: "ok" }` |
| AUTH-008 | P1 | Should report who is logged in, and 401 when nobody is | `GET /api/auth/me` logged out, then logged in | **401** `UNAUTHORIZED`; then **200** `{ username: "demo" }` |
| AUTH-009 | P0 | Should end the session on logout, so the same cookie no longer works | Log in; `GET` event (**200**); `POST /api/auth/logout`; `GET` event again | Logout **200** `{ status: "logged-out" }`; the same client then gets **401** |

---

## UI

**Spec:** `tests/tests-auth/602-login-ui.spec.ts`

| ID | Priority | Title | Steps | Expected |
|---|---|---|---|---|
| AUTH-010 | P0 | Should send a logged-out visitor from the event page to the login page | *Logged out:* open `/` | Lands on `/login.html` with the "Log in" heading |
| AUTH-011 | P0 | Should log in with the demo account and open the event page | *Logged out:* open the login page; check the hint; log in as demo | Hint reads "Demo account: demo / demo1234"; event page opens showing "Signed in as demo" and "21 of 25 seats filled" |
| AUTH-012 | P1 | Should show "Username or password is incorrect." and stay on the login page for a wrong password | *Logged out:* log in with a wrong password | Error shown under the form; still on `/login.html`; password field emptied and focused |
| AUTH-013 | P1 | Should show "Username is required." and "Password is required." when both fields are empty | *Logged out:* click **Log in** with both fields empty | Both messages shown; Username outlined red and focused; still on `/login.html` |
| AUTH-014 | P0 | Should log out with "Log out" and keep the event page closed afterwards | *Logged out:* log in; click **Log out**; open `/` again | Back on `/login.html`; opening `/` sends you to the login page again |
| AUTH-015 | P1 | Should send the user to the login page when their session ends while the page is open | *Logged out:* log in; end the session through the API (as if logged out in another tab); click **Remove** next to Ada | The page goes to `/login.html` |
| AUTH-016 | P0 | Should keep the session cookie out of reach of page scripts | Logged in: open the event page; read the cookie jar and `document.cookie` | The `sid` cookie is `HttpOnly`; `document.cookie` doesn't contain it |
