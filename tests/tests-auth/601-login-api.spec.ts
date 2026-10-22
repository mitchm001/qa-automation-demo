import { LOGGED_OUT } from '../tests-support/helpers/auth';
import {
  MADE_UP_SESSION,
  MISSING_CREDENTIALS,
  PROTECTED_REQUESTS,
  SESSION_COOKIE,
  SESSION_COOKIE_FLAGS,
  UNKNOWN_USER,
  WRONG_PASSWORD,
} from '../constants/constants-auth';
import { ApiErrors } from '../tests-support/expected/ApiErrors';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { AuthMessages } from '../tests-support/expected/Messages';
import { expectApiError, getCounts } from '../tests-support/helpers/apiAssertions';
import { EventsApi } from '../tests-support/helpers/EventsApi';
import { expect, test } from '../tests-support/helpers/fixtures';
import { DEMO_USER, SEEDED_CONFIRMED } from '../tests-support/helpers/testData';

/** Every test here starts logged out; `loggedInApi` checks the data behind the scenes. */
test.use({ storageState: LOGGED_OUT });

test.describe('Auth API: logging in', () => {
  test('AUTH-001: Should log in with the demo account and set a secure session cookie', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const response = await eventsApi.logIn(DEMO_USER);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.loggedIn(DEMO_USER.username));
    const cookie = response.headers()['set-cookie'];
    expect(cookie).toMatch(new RegExp(`^${SESSION_COOKIE}=[0-9a-f]{64};`)); // a long random id
    for (const flag of SESSION_COOKIE_FLAGS) expect(cookie).toContain(flag);
  });

  test('AUTH-002: Should return 401 "Username or password is incorrect." for a wrong password', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const response = await eventsApi.logIn(WRONG_PASSWORD);

    await expectApiError(response, ApiErrors.invalidCredentials);
    expect(response.headers()['set-cookie']).toBeUndefined();
  });

  test("AUTH-003: Should return the same 401 for an unknown username, so usernames can't be discovered", { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.logIn(UNKNOWN_USER);

    await expectApiError(response, ApiErrors.invalidCredentials);
    expect(response.headers()['set-cookie']).toBeUndefined();
  });

  for (const { label, body, fields } of MISSING_CREDENTIALS) {
    test(`AUTH-004: Should return 400 with field errors when logging in with ${label}`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const response = await eventsApi.logIn(body);

      const messages: Record<string, string> = { username: AuthMessages.usernameRequired, password: AuthMessages.passwordRequired };
      await expectApiError(response, ApiErrors.validation(Object.fromEntries(fields.map((field) => [field, messages[field]]))));
    });
  }
});

test.describe('Auth API: protected requests', () => {
  for (const { label, send } of PROTECTED_REQUESTS) {
    test(`AUTH-005: Should return 401 and change nothing when not logged in (${label})`, { tag: ['@P0'] }, async ({ eventsApi, loggedInApi }) => {
      const response = await send(eventsApi);

      await expectApiError(response, ApiErrors.unauthorized);
      expect(await getCounts(loggedInApi)).toEqual(ExpectedResponses.counts(SEEDED_CONFIRMED));
    });
  }

  test('AUTH-006: Should return 401 for a made-up session cookie', { tag: ['@P0'] }, async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Cookie: `${SESSION_COOKIE}=${MADE_UP_SESSION}` } });

    await expectApiError(await new EventsApi(request).getEvent(), ApiErrors.unauthorized);
    await request.dispose();
  });

  test('AUTH-007: Should keep the health check public', { tag: ['@P2'] }, async ({ eventsApi }) => {
    const response = await eventsApi.health();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.health);
  });
});

test.describe('Auth API: sessions', () => {
  test('AUTH-008: Should report who is logged in, and 401 when nobody is', { tag: ['@P1'] }, async ({ eventsApi, loggedInApi }) => {
    await expectApiError(await eventsApi.me(), ApiErrors.unauthorized);

    const response = await loggedInApi.me();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.loggedIn(DEMO_USER.username));
  });

  test('AUTH-009: Should end the session on logout, so the same cookie no longer works', { tag: ['@P0'] }, async ({ eventsApi }) => {
    // A session of its own: logging out the shared test session would log out every other test
    expect((await eventsApi.logIn(DEMO_USER)).status()).toBe(200);
    expect((await eventsApi.getEvent()).status()).toBe(200);

    const response = await eventsApi.logOut();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.loggedOut);
    await expectApiError(await eventsApi.getEvent(), ApiErrors.unauthorized);
  });
});
