import { ApiErrors } from '../tests-support/expected/ApiErrors';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { expectApiError, getCounts, listSignups } from '../tests-support/helpers/apiAssertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillEventAndWaitlist } from '../tests-support/helpers/setup';
import { buildAttendee, CAPACITY, MISSING_EVENT_ID, SEEDED_CONFIRMED, SEEDED_PERSON } from '../tests-support/helpers/testData';

/** Delete: remove one sign-up, clear the waitlist, or remove everyone confirmed, then read back to prove it. */
test.describe('Delete: one sign-up', () => {
  test('API-143: Should remove one sign-up so it can no longer be read', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const response = await eventsApi.removeSignup(SEEDED_PERSON.id);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.removeResult(ExpectedResponses.seededPersonSignup));
    await expectApiError(await eventsApi.getSignup(SEEDED_PERSON.id), ApiErrors.signupNotFound(SEEDED_PERSON.id));
    expect((await listSignups(eventsApi)).map((s) => s.email)).not.toContain(SEEDED_PERSON.email);
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(SEEDED_CONFIRMED - 1));
  });

  test('API-144: Should return 404 when the same sign-up is removed twice', { tag: ['@P2'] }, async ({ eventsApi }) => {
    expect((await eventsApi.removeSignup(SEEDED_PERSON.id)).status()).toBe(200);

    await expectApiError(await eventsApi.removeSignup(SEEDED_PERSON.id), ApiErrors.signupNotFound(SEEDED_PERSON.id));
  });

  test('API-145: Should not move anyone up when a waitlisted person is removed', { tag: ['@P1'] }, async ({ eventsApi }) => {
    await fillEventAndWaitlist(eventsApi, 2);
    const waitlisted = (await listSignups(eventsApi)).filter((s) => s.status === 'waitlisted');

    const response = await eventsApi.removeSignup(waitlisted[0].id);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.removeResult(waitlisted[0]));
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(CAPACITY, 1));
  });

  test('API-146: Should leave the seat open when a confirmed person is removed and nobody is waiting', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.removeSignup(SEEDED_PERSON.id);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.removeResult(ExpectedResponses.seededPersonSignup));
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(SEEDED_CONFIRMED - 1));
  });
});

test.describe('Delete: ids are never reused', () => {
  test('API-147: Should give a new sign-up a fresh id, never the id of a deleted sign-up', { tag: ['@P2'] }, async ({ eventsApi }) => {
    const created = await eventsApi.signUp([buildAttendee()]);
    expect(created.status()).toBe(201);
    const deletedId: number = (await created.json()).signups[0].id; // the newest id (22)
    expect((await eventsApi.removeSignup(deletedId)).status()).toBe(200);

    const next = await eventsApi.signUp([buildAttendee()]);

    expect(next.status()).toBe(201);
    expect((await next.json()).signups[0].id).toBeGreaterThan(deletedId); // 23, not 22 again
  });
});

test.describe('Delete: whole lists', () => {
  test('API-148: Should clear the waitlist and leave the confirmed list alone', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const waitlisted = await fillEventAndWaitlist(eventsApi, 3);

    const response = await eventsApi.clearWaitlist();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.clearWaitlistResult(waitlisted.length));
    expect((await listSignups(eventsApi)).filter((s) => s.status === 'waitlisted')).toHaveLength(0);
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(CAPACITY));

    // Clearing an empty waitlist is fine and removes nobody
    const again = await eventsApi.clearWaitlist();
    expect(again.status()).toBe(200);
    expect(await again.json()).toEqual(ExpectedResponses.clearWaitlistResult(0));
  });

  test('API-149: Should remove everyone confirmed with one request', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const response = await eventsApi.clearConfirmed();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.clearConfirmedResult(SEEDED_CONFIRMED));
    expect(await listSignups(eventsApi)).toEqual([]);
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(0));
  });

  test("API-150: Should return 404 when clearing lists on an event that doesn't exist", { tag: ['@P2'] }, async ({ eventsApi }) => {
    await expectApiError(await eventsApi.clearWaitlist(MISSING_EVENT_ID), ApiErrors.eventNotFound(MISSING_EVENT_ID));
    await expectApiError(await eventsApi.clearConfirmed(MISSING_EVENT_ID), ApiErrors.eventNotFound(MISSING_EVENT_ID));
  });

  test('API-151: Should put both lists back to the original 21 people with the Reset UI route', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const original = await listSignups(eventsApi);
    await fillEventAndWaitlist(eventsApi, 3);
    expect((await eventsApi.removeSignup(SEEDED_PERSON.id)).status()).toBe(200);

    const response = await eventsApi.resetDemo();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(ExpectedResponses.demoReset);
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(SEEDED_CONFIRMED));
    expect(await listSignups(eventsApi)).toEqual(original); // same people, same ids, same order
  });
});
