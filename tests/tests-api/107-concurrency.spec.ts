import { CONCURRENT_SIGNUPS, LAST_SEAT_CONTENDERS } from '../constants/constants-api';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { signUpAtTheSameTime } from '../tests-support/helpers/concurrency';
import { expect, test } from '../tests-support/helpers/fixtures';
import { buildAttendees, CAPACITY, SEATS_LEFT_AFTER_RESET } from '../tests-support/helpers/testData';

/**
    Race-condition tests. Every request is sent at once from its own client, so the server receives
    them at (nearly) the same moment, which a browser double-click can't reliably do.
    Without the server's locking, several requests can read "1 seat left" and all get it.
    Verified: with the locking removed, both tests fail on every run.
*/
test.describe('Concurrency: sign-ups arriving at the same time', () => {
  test('API-152: Should never confirm more people than the capacity when 20 sign-ups arrive at once', { tag: ['@P0'] }, async ({ eventsApi, playwright, baseURL }) => {
    const waitlisted = CONCURRENT_SIGNUPS - SEATS_LEFT_AFTER_RESET;

    const results = await signUpAtTheSameTime(playwright, baseURL, buildAttendees(CONCURRENT_SIGNUPS));

    for (const { status } of results) expect(status).toBe(201);
    expect(results.filter((r) => r.signupStatus === 'confirmed')).toHaveLength(SEATS_LEFT_AFTER_RESET);
    expect(results.filter((r) => r.signupStatus === 'waitlisted')).toHaveLength(waitlisted);

    const eventResponse = await eventsApi.getEvent();
    expect(eventResponse.status()).toBe(200);
    expect(await eventResponse.json()).toEqual(ExpectedResponses.event(CAPACITY, waitlisted));
  });

  test('API-153: Should give the last seat to exactly one person when 10 people sign up for it at the same time', { tag: ['@P0'] }, async ({ eventsApi, playwright, baseURL }) => {
    expect((await eventsApi.signUp(buildAttendees(SEATS_LEFT_AFTER_RESET - 1))).status()).toBe(201); // 24 of 25: one seat left

    const results = await signUpAtTheSameTime(playwright, baseURL, buildAttendees(LAST_SEAT_CONTENDERS));

    for (const { status } of results) expect(status).toBe(201);
    expect(results.filter((r) => r.signupStatus === 'confirmed')).toHaveLength(1);
    expect(results.filter((r) => r.signupStatus === 'waitlisted')).toHaveLength(LAST_SEAT_CONTENDERS - 1);

    const eventResponse = await eventsApi.getEvent();
    expect(eventResponse.status()).toBe(200);
    expect(await eventResponse.json()).toEqual(ExpectedResponses.event(CAPACITY, LAST_SEAT_CONTENDERS - 1));
  });
});
