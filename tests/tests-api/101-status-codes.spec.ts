import {
  INVALID_EVENT_IDS,
  LEADING_ZERO_EVENT_ID,
  LEADING_ZERO_SIGNUP_ID,
  MALFORMED_JSON,
  NON_JSON_BODIES,
  SIGNUPS_URL,
  TOO_LARGE_ID,
  UNKNOWN_ROUTES,
} from '../constants/constants-api';
import { ApiErrors, fieldPath } from '../tests-support/expected/ApiErrors';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { FieldMessages } from '../tests-support/expected/Messages';
import { expectApiError } from '../tests-support/helpers/apiAssertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { buildAttendee, EVENT_ID, INVALID_EMAIL, MISSING_EVENT_ID, MISSING_SIGNUP_ID, SEEDED_PERSON } from '../tests-support/helpers/testData';

test.describe('Status codes: success', () => {
  test('API-101: Should return 200 and { status: "ok" } from the health check', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.health();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.health);
  });

  test('API-102: Should return 200 and the list of events', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.listEvents();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.eventList);
  });

  test('API-103: Should return 200 and the seeded event with 21 of 25 seats taken', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.getEvent();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.seededEvent);
  });

  test('API-104: Should return 201 Created for a valid sign-up', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const response = await eventsApi.signUp([buildAttendee()]);

    expect(response.status()).toBe(201);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('API-105: Should return 200 when a sign-up is removed', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.removeSignup(SEEDED_PERSON.id);

    expect(response.status()).toBe(200);
  });
});

test.describe('Status codes: errors', () => {
  for (const eventId of INVALID_EVENT_IDS) {
    test(`API-106: Should return 404 for an event id that doesn't exist or isn't a whole number ("${eventId}")`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const response = await eventsApi.getEvent(eventId);

      await expectApiError(response, ApiErrors.eventNotFound(eventId));
    });
  }

  test('API-107: Should treat an id with leading zeros ("01") as the same as "1"', { tag: ['@P3'] }, async ({ eventsApi }) => {
    const event = await eventsApi.getEvent(LEADING_ZERO_EVENT_ID);
    expect(event.status()).toBe(200);
    expect((await event.json()).id).toBe(EVENT_ID);

    const signup = await eventsApi.getSignup(LEADING_ZERO_SIGNUP_ID);
    expect(signup.status()).toBe(200);
    expect((await signup.json()).id).toBe(SEEDED_PERSON.id);
  });

  test('API-108: Should return 404, not crash, for an id too large to be a valid number', { tag: ['@P2'] }, async ({ eventsApi }) => {
    await expectApiError(await eventsApi.getEvent(TOO_LARGE_ID), ApiErrors.eventNotFound(TOO_LARGE_ID));
    await expectApiError(await eventsApi.getSignup(TOO_LARGE_ID), ApiErrors.signupNotFound(TOO_LARGE_ID, null));
    await expectApiError(await eventsApi.removeSignup(TOO_LARGE_ID), ApiErrors.notFound);
    expect((await eventsApi.health()).status()).toBe(200); // the server is still fine
  });

  test("API-109: Should return 404 when getting or removing a sign-up that doesn't exist", { tag: ['@P1'] }, async ({ eventsApi }) => {
    await expectApiError(await eventsApi.getSignup(MISSING_SIGNUP_ID), ApiErrors.signupNotFound(MISSING_SIGNUP_ID));
    await expectApiError(await eventsApi.removeSignup(MISSING_SIGNUP_ID), ApiErrors.signupNotFound(MISSING_SIGNUP_ID));
  });

  test("API-110: Should return 404 when signing up for an event that doesn't exist", { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.signUp([buildAttendee()], MISSING_EVENT_ID);

    await expectApiError(response, ApiErrors.eventNotFound(MISSING_EVENT_ID));
  });

  for (const { method, path } of UNKNOWN_ROUTES) {
    test(`API-111: Should return 404 with a JSON error for an unknown API route (${method} ${path})`, { tag: ['@P2'] }, async ({ request }) => {
      const response = await request.fetch(path, { method, data: method === 'GET' ? undefined : {} });

      await expectApiError(response, ApiErrors.noApiRoute(method, path));
    });
  }

  for (const { label, options } of NON_JSON_BODIES) {
    test(`API-112: Should return 415 when the sign-up body isn't JSON (${label})`, { tag: ['@P1'] }, async ({ request }) => {
      const response = await request.post(SIGNUPS_URL, options);

      await expectApiError(response, ApiErrors.notJson);
    });
  }

  test('API-113: Should return 400 when the JSON body is malformed', { tag: ['@P1'] }, async ({ request }) => {
    const response = await request.post(SIGNUPS_URL, { headers: { 'Content-Type': 'application/json' }, data: MALFORMED_JSON });

    await expectApiError(response, ApiErrors.malformedJson);
  });

  test('API-114: Should return 400 with field errors when a field is invalid', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.signUp([buildAttendee({ email: INVALID_EMAIL })]);

    await expectApiError(response, ApiErrors.validation({ [fieldPath(0, 'email')]: FieldMessages.emailInvalid }));
  });

  test('API-115: Should return 409 Conflict when the email is already signed up', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const response = await eventsApi.signUp([buildAttendee({ email: SEEDED_PERSON.email })]);

    await expectApiError(response, ApiErrors.duplicateEmail());
  });
});
