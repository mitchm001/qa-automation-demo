import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { listSignups } from '../tests-support/helpers/apiAssertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { buildAttendees, SEEDED_CONFIRMED, SEEDED_PERSON } from '../tests-support/helpers/testData';

/** Read: GET the events and sign-ups, and check exactly what comes back. */
test.describe('Read: events and sign-ups', () => {
  test('API-137: Should return exactly the documented fields for a sign-up', { tag: ['@P2'] }, async ({ eventsApi }) => {
    const response = await eventsApi.getSignup(SEEDED_PERSON.id);

    expect(response.status()).toBe(200);
    expect(Object.keys(await response.json()).sort()).toEqual(ExpectedResponses.signupFields);
  });

  test('API-138: Should list every sign-up in arrival order, with new sign-ups last', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const before = await listSignups(eventsApi);
    expect(before).toHaveLength(SEEDED_CONFIRMED);
    expect(before[0]).toEqual(ExpectedResponses.seededPersonSignup);
    const ids = before.map((s) => s.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));

    const newPeople = buildAttendees(2);
    expect((await eventsApi.signUp(newPeople)).status()).toBe(201);

    const after = await listSignups(eventsApi);
    expect(after).toHaveLength(SEEDED_CONFIRMED + 2);
    expect(after.slice(-2).map((s) => s.email)).toEqual(newPeople.map((p) => p.email));
  });

  test('API-139: Should include the event with live seat counts in the event list', { tag: ['@P2'] }, async ({ eventsApi }) => {
    expect((await eventsApi.signUp(buildAttendees(2))).status()).toBe(201);

    const response = await eventsApi.listEvents();

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([ExpectedResponses.event(SEEDED_CONFIRMED + 2)]);
  });
});
