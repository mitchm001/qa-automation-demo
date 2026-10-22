# Security test cases

See [README.md](README.md) for conventions, priorities and the traceability table.

**Starting state:** fresh database, 21 of 25 seats filled, waitlist empty.

---

## UI security

### SEC-001: Should show a name containing HTML as plain text and not run it
**Priority:** P0 · **Automated:** `tests/tests-security/401-html-injection.spec.ts` (data-driven: one test per value)

Names are shown to everyone who views the page. If the app inserted a name as HTML, a script hidden in a
name would run in every visitor's browser (stored cross-site scripting, "XSS").

**Test data (First name; Last name is "Tester"):**
`<b>Bold</b>` · `<img src=x onerror="window.__xss=1">` · `<script>window.__xss=1</script>`

| Step | Action | Expected result |
|---|---|---|
| 1 | Sign up a person whose First name is a value from the test data | Green success message "Signed up 1 person: 1 confirmed, 0 waitlisted." |
| 2 | Find their row in Confirmed | The Name cell shows the exact characters typed, e.g. `<b>Bold</b> Tester`, as plain text |
| 3 | Inspect the row | No `<b>`, `<img>` or `<script>` element was created |
| 4 | Check whether the script ran | `window.__xss` is not set |

---

## API security

**Automated:** `tests/tests-security/402-api-security.spec.ts`

| ID | Priority | Title | Steps / test data | Expected |
|---|---|---|---|---|
| SEC-002 | P1 | Should send the security headers on every response | `GET` a 200 API response, a 404 API response, the web page, and a script file (4 data rows) | `X-Content-Type-Options: nosniff`; `X-Frame-Options: SAMEORIGIN`; `Referrer-Policy: no-referrer`; `Content-Security-Policy` includes `default-src 'self'`, `script-src 'self'`, `object-src 'none'`; **no** `X-Powered-By` header |
| SEC-003 | P0 | Should ignore extra fields such as "role", "id" and "eventId" in a sign-up | Sign up with extra `role: "admin"`, `id: 9999`, `eventId: 2`, `isAdmin: true`; GET it back | **201**; id isn't 9999; eventId is 1; no `role`/`isAdmin`; GET shows only the 6 documented fields |
| SEC-004 | P0 | Should not let a sign-up skip the waitlist by sending "status": "confirmed" | Fill the event; sign up with `status: "confirmed"` | **201** but `waitlisted`; event 25 confirmed, 1 waitlisted |
| SEC-005 | P0 | Should store SQL-like text exactly as typed without affecting the database | Sign up `Robert'); DROP TABLE signups;--` / `' OR '1'='1` / `o'reilly.sql@example.com`; GET it back | **201**; read back exactly as sent; the list has 22 rows (table intact) |
| SEC-006 | P1 | Should return 404 for an event id containing SQL-like text | `GET /api/events/1 OR 1=1`, `/api/events/1'--`, `/api/events/1;DROP TABLE events` (3 data rows) | **404** `NOT_FOUND`; still 21 confirmed |
| SEC-007 | P2 | ⚠️ BUG-003 (skipped): Should reject a request body over 100 KB with 413 Payload Too Large | Sign up with a 200,000-character first name | **413** `PAYLOAD_TOO_LARGE`, "Request body is too large." **Currently: 500 `INTERNAL_ERROR`.** Marked `test.skip()`; see [../bug-reports.md](../bug-reports.md) |
| SEC-008 | P1 | Should not reveal internal details in error responses | Trigger a 400, 404, 409, and a 500 (oversized body) (4 data rows) | Body is only `{ error: { code, message, fieldErrors? } }`; no `stack`, stack-trace lines, `node_modules`, `SQLITE`, file paths |
| SEC-009 | P0 | Should not expose the database reset route when test routes are turned off | Start a second copy of the app **without** `ENABLE_TEST_ROUTES`; `POST /api/testing/reset` | **404** "No API route for POST /api/testing/reset."; `/api/health` still 200 |
