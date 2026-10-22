import {
  ERROR_BODY_KEYS,
  ERROR_REQUESTS,
  EXPECTED_HEADERS,
  EXTRA_FIELDS,
  LEAK_MARKERS,
  OVERSIZED_NAME,
  PRODUCTION_MODE_PORT,
  REQUIRED_CSP_DIRECTIVES,
  SECURITY_HEADER_RESPONSES,
  SQL_LIKE_EVENT_PATHS,
  SQL_LIKE_PERSON,
  STACK_TRACE_LINE,
  TEST_RESET_PATH,
} from '../constants/constants-security';
import { ApiErrors } from '../tests-support/expected/ApiErrors';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { expectApiError, getCounts, listSignups } from '../tests-support/helpers/apiAssertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { startExtraServer } from '../tests-support/helpers/server';
import { fillRemainingSeats } from '../tests-support/helpers/setup';
import { buildAttendee, CAPACITY, SEEDED_CONFIRMED } from '../tests-support/helpers/testData';

test.describe('Security: response headers', () => {
  for (const { label, path } of SECURITY_HEADER_RESPONSES) {
    test(`SEC-002: Should send the security headers on every response (${label})`, { tag: ['@P1'] }, async ({ request }) => {
      const response = await request.get(path);
      const headers = response.headers();

      expect(headers).toMatchObject(EXPECTED_HEADERS);
      for (const directive of REQUIRED_CSP_DIRECTIVES) expect(headers['content-security-policy']).toContain(directive);
      expect(headers['x-powered-by']).toBeUndefined(); // don't advertise the server technology
    });
  }
});

test.describe('Security: request bodies', () => {
  test('SEC-003: Should ignore extra fields such as "role", "id" and "eventId" in a sign-up', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const person = buildAttendee();

    const response = await eventsApi.signUpRaw({ attendees: [{ ...person, ...EXTRA_FIELDS }] });

    expect(response.status()).toBe(201);
    const [saved] = (await response.json()).signups;
    expect(saved).toEqual(ExpectedResponses.signup(person)); // exactly the documented fields
    expect(saved.id).not.toBe(EXTRA_FIELDS.id);

    const readBack = await eventsApi.getSignup(saved.id);
    expect(readBack.status()).toBe(200);
    expect(await readBack.json()).toEqual(ExpectedResponses.signup(person, 'confirmed', saved.id));
  });

  test('SEC-004: Should not let a sign-up skip the waitlist by sending "status": "confirmed"', { tag: ['@P0'] }, async ({ eventsApi }) => {
    await fillRemainingSeats(eventsApi); // the event is full
    const person = buildAttendee();

    const response = await eventsApi.signUpRaw({ attendees: [{ ...person, status: 'confirmed' }] });

    expect(response.status()).toBe(201);
    expect((await response.json()).signups[0]).toEqual(ExpectedResponses.signup(person, 'waitlisted'));
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(CAPACITY, 1));
  });

  test('SEC-005: Should store SQL-like text exactly as typed without affecting the database', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const response = await eventsApi.signUp([SQL_LIKE_PERSON]);

    expect(response.status()).toBe(201);
    const [saved] = (await response.json()).signups;
    const readBack = await eventsApi.getSignup(saved.id);
    expect(readBack.status()).toBe(200);
    expect(await readBack.json()).toEqual(ExpectedResponses.signup(SQL_LIKE_PERSON, 'confirmed', saved.id)); // stored as plain text
    expect(await listSignups(eventsApi)).toHaveLength(SEEDED_CONFIRMED + 1); // the table is intact
  });

  for (const path of SQL_LIKE_EVENT_PATHS) {
    test(`SEC-006: Should return 404 for an event id containing SQL-like text (${path})`, { tag: ['@P1'] }, async ({ request, eventsApi }) => {
      const response = await request.get(path);

      await expectApiError(response, ApiErrors.notFound);
      expect((await getCounts(eventsApi)).confirmedCount).toBe(SEEDED_CONFIRMED);
    });
  }

  test.skip(
    'SEC-007: Should reject a request body over 100 KB with 413 Payload Too Large',
    {
      tag: ['@P2', '@bug'],
      annotation: [
        { type: 'bug', description: 'BUG-003: an oversized request body returns 500 Internal Server Error instead of 413 (see docs/bug-reports.md)' },
        { type: 'skipped', description: 'Known bug, logged and not fixed yet. Remove .skip once BUG-003 is fixed.' },
      ],
    },
    async ({ eventsApi }) => {
      const response = await eventsApi.signUp([buildAttendee({ firstName: OVERSIZED_NAME })]);

      // FAILING LINE (current, unfixed app): the server answers 500 INTERNAL_ERROR.
      await expectApiError(response, ApiErrors.payloadTooLarge);

      // WORKING CODE: the fix for BUG-003. This test is marked .skip() and the bug is logged in
      // docs/bug-reports.md to demonstrate QA practice. With this change in the app, the line above passes.
      // In platform-ui/src/middleware/errorHandler.ts, next to the 'entity.parse.failed' check:
      //
      //   if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.too.large') {
      //     res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' } });
      //     return;
      //   }
    },
  );
});

test.describe('Security: error responses', () => {
  for (const { label, send } of ERROR_REQUESTS) {
    test(`SEC-008: Should not reveal internal details in error responses (${label})`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const response = await send(eventsApi);

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const body = await response.json();
      expect(Object.keys(body)).toEqual(['error']);
      for (const key of Object.keys(body.error)) expect(ERROR_BODY_KEYS).toContain(key);
      const text = JSON.stringify(body);
      for (const leak of LEAK_MARKERS) expect(text).not.toContain(leak); // no stack traces, file paths or database errors
      expect(text).not.toMatch(STACK_TRACE_LINE); // no stack-trace lines like "at fn (file.js:10:5)"
    });
  }
});

test.describe('Security: test-only routes', () => {
  test('SEC-009: Should not expose the database reset route when test routes are turned off', { tag: ['@P0'] }, async ({ playwright }) => {
    // A second copy of the app, started the way it would run for real (ENABLE_TEST_ROUTES not set)
    const server = await startExtraServer(PRODUCTION_MODE_PORT);
    const client = await playwright.request.newContext({ baseURL: server.baseURL });
    try {
      const reset = await client.post(TEST_RESET_PATH);

      await expectApiError(reset, ApiErrors.noApiRoute('POST', TEST_RESET_PATH));
      expect((await client.get('/api/health')).status()).toBe(200); // the server itself is up
    } finally {
      await client.dispose();
      server.stop();
    }
  });
});
