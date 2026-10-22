# QA Automation Demo

A small event sign-up app built as a system under test, with a layered **Playwright + TypeScript** test suite
covering its API, UI, security and login. The app is deliberately simple; the tests are the point.

## The app

An event has 25 seats and starts with 21 people signed up. You can sign up 1–5 people at a time; once the event
is full, new sign-ups join a waitlist, and removing a confirmed person moves the longest-waiting person into the
seat. Emails must be unique per event. Everything sits behind a login (demo account `demo` / `demo1234`).

Stack: Node.js, Express, TypeScript, SQLite (behind a small storage interface so it can move to Postgres later),
and a plain HTML/TypeScript front end with no framework.

## What this project demonstrates

| Skill | Where to look |
|---|---|
| Layered test design: unit, API, UI, hybrid, security and auth, one Playwright project each | `playwright.config.ts`, `tests/` |
| API testing with the `request` fixture: status codes, validation, create/read/update/delete, business rules | `tests/tests-api/` |
| Boundary-value and data-driven tests (0/1/5/6 people, 50/51-character names, 254/255-character emails) | `tests/tests-api/102-validation.spec.ts` |
| Response schema checks (every field, type and allowed value, no extras) with `zod` | `tests/tests-api/108-response-schemas.spec.ts` |
| Race-condition tests: simultaneous sign-ups never exceed capacity, verified to fail without server locking | `tests/tests-api/107-concurrency.spec.ts` |
| UI tests with the Page Object Model and role/label locators | `tests/tests-ui/`, `tests/tests-support/pages/` |
| Hybrid tests: change data through the API, check it in the UI (and the reverse) | `tests/tests-hybrid/` |
| Network failure mocking with `page.route()` | `tests/tests-ui/208-network-errors.spec.ts` |
| Security checks: HTML/SQL-like input, ignored extra fields, security headers, no leaked internals | `tests/tests-security/` |
| Auth: login/logout, 401s on protected requests, secure cookies, one saved login (`storageState`) reused by every suite | `tests/tests-auth/`, `tests/tests-support/setup/` |
| One source of truth for expected responses, error messages and page text | `tests/tests-support/expected/` |
| Written test cases with priorities (P0–P4) and traceability to the automated tests | `docs/test-cases/` |
| Bug reporting: real bugs the suite found, logged with skipped tests that document the fix | `docs/bug-reports.md` |

## Example quality problem

Before this suite, checking a release meant clicking through the same scenarios by hand: does a full event
waitlist people instead of over-booking? Does removing someone move the right person up? Is a duplicate email
blocked even in different capitals? Does a wrong password leak which usernames exist? Each check is easy alone,
but together they take most of an afternoon and get skipped under pressure. The suite runs all of them, plus
the edge cases nobody clicks through by hand (20 sign-ups arriving at the same moment, a 255-character email,
`<script>` in a name), in about 25 seconds.

## Run locally

Requires Node.js 20 or newer.

```bash
git clone https://github.com/mitchm001/qa-automation-demo.git
cd qa-automation-demo
npm install
npx playwright install chromium
npx playwright test
```

Playwright builds and starts the app on its own port with a separate test database, runs every suite, and opens
the HTML report when it finishes.

To use the app yourself: `npm run app`, then open http://localhost:3000 and log in with `demo` / `demo1234`.

### Useful commands

| Command | What it does |
|---|---|
| `npm test` | Runs every suite |
| `npm run test:api` / `test:ui` / `test:hybrid` / `test:security` / `test:auth` | Runs one suite |
| `npx playwright test --grep @P0` | Runs only the critical (P0) tests |
| `npx playwright test --grep "API-131"` | Runs one test case by its ID |
| `npm run report` | Reopens the last HTML report |
| `npm run app:fresh` | Resets the local data to the starting 21 people and starts the app |

## Project layout

```
platform-ui/            the app: Express API + browser front end
tests/
├── tests-unit/         plain functions, no server
├── tests-api/          101–108: status codes, validation, create/read/update/delete, concurrency, schemas
├── tests-ui/           201–210: user flows through the page
├── tests-hybrid/       301–302: API and UI together
├── tests-security/     401–402: injection, headers, error responses
├── tests-auth/         601–602: login, logout, access control
├── constants/          test inputs for each suite
└── tests-support/      Page Objects, helpers, login setup, expected values
docs/
├── test-cases/         every test case with ID, priority, steps and the spec that automates it
└── bug-reports.md      bugs found by the suite
```

## Known bugs

The suite found three real bugs, logged in [docs/bug-reports.md](docs/bug-reports.md). Each has a test that
asserts the correct behaviour, marked `test.skip()` with a `bug` annotation until it's fixed, so the report
shows them as known issues rather than hiding them.

## Note

My professional automation work lives in employer-owned repositories I can't share, so I built this project to
show how I approach test design, structure and coverage end to end.
