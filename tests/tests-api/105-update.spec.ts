import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { getCounts, listSignups } from '../tests-support/helpers/apiAssertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillEventAndWaitlist, fillRemainingSeats } from '../tests-support/helpers/setup';
import { buildAttendees, CAPACITY, MAX_PEOPLE_PER_SIGNUP, SEEDED_PERSON } from '../tests-support/helpers/testData';

/**
    Update: there's no endpoint to edit a sign-up directly. The only update is a status change from
    `waitlisted` to `confirmed`, which happens when a seat frees up. Each test checks who moved up, in what order.
*/
test.describe('Update: moving up from the waitlist', () => {
  test('API-140: Should move the longest-waiting person into a freed seat when a confirmed person is removed', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const [w1, w2, w3] = await fillEventAndWaitlist(eventsApi, 3);

    const response = await eventsApi.removeSignup(SEEDED_PERSON.id);

    expect(response.status()).toBe(200);
    const { promoted } = await response.json();
    expect(promoted).toEqual(ExpectedResponses.signup(w1, 'confirmed'));

    const readBack = await eventsApi.getSignup(promoted.id);
    expect(readBack.status()).toBe(200);
    expect(await readBack.json()).toEqual(ExpectedResponses.signup(w1, 'confirmed', promoted.id));
    const waitlist = (await listSignups(eventsApi)).filter((s) => s.status === 'waitlisted');
    expect(waitlist.map((s) => s.email)).toEqual([w2.email, w3.email]);
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(CAPACITY, 2));
  });

  test('API-141: Should move the whole waitlist up, in order, when everyone confirmed is removed', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const waitlisted = await fillEventAndWaitlist(eventsApi, 3);

    const response = await eventsApi.clearConfirmed();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(
      ExpectedResponses.clearConfirmedResult(CAPACITY, waitlisted.map((person) => ExpectedResponses.signup(person, 'confirmed'))),
    );
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(waitlisted.length));
  });

  test('API-142: Should move up at most 25 people when the waitlist is longer than the capacity', { tag: ['@P1'] }, async ({ eventsApi }) => {
    await fillRemainingSeats(eventsApi);
    const waitlisted = buildAttendees(CAPACITY + MAX_PEOPLE_PER_SIGNUP); // 30: more than the event holds
    for (let i = 0; i < waitlisted.length; i += MAX_PEOPLE_PER_SIGNUP) {
      expect((await eventsApi.signUp(waitlisted.slice(i, i + MAX_PEOPLE_PER_SIGNUP))).status()).toBe(201);
    }

    const response = await eventsApi.clearConfirmed();

    expect(response.status()).toBe(200);
    const movedUp = waitlisted.slice(0, CAPACITY); // the first 25, in order
    const stillWaiting = waitlisted.slice(CAPACITY); // the last 5 keep waiting
    expect(await response.json()).toEqual(
      ExpectedResponses.clearConfirmedResult(CAPACITY, movedUp.map((person) => ExpectedResponses.signup(person, 'confirmed'))),
    );
    const waitlist = (await listSignups(eventsApi)).filter((s) => s.status === 'waitlisted');
    expect(waitlist.map((s) => s.email)).toEqual(stillWaiting.map((p) => p.email));
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(CAPACITY, stillWaiting.length));
  });
});
