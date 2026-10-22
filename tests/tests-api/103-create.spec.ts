import { DUPLICATE_EMAIL_VARIANTS } from '../constants/constants-api';
import { ApiErrors, fieldPath } from '../tests-support/expected/ApiErrors';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { FieldMessages } from '../tests-support/expected/Messages';
import { expectApiError, getCounts, listSignups, type SignupJson } from '../tests-support/helpers/apiAssertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillEventAndWaitlist, fillRemainingSeats } from '../tests-support/helpers/setup';
import { buildAttendee, buildAttendees, CAPACITY, MAX_PEOPLE_PER_SIGNUP, SEEDED_CONFIRMED, SEEDED_PERSON } from '../tests-support/helpers/testData';

/**
    Create: POST /api/events/:eventId/signups. Each test checks the status code, then reads the data back.
    Signing up for a full event is still a 201: the person comes back `waitlisted`, so the data is checked too.
*/
test.describe('Create: sign-ups', () => {
  test('API-130: Should create a sign-up and read the same data back by id', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const person = buildAttendee();

    const created = await eventsApi.signUp([person]);

    expect(created.status()).toBe(201);
    const body = await created.json();
    expect(body.event).toEqual(ExpectedResponses.event(SEEDED_CONFIRMED + 1));
    const [signup] = body.signups as SignupJson[];
    expect(signup).toEqual(ExpectedResponses.signup(person));

    const readBack = await eventsApi.getSignup(signup.id);
    expect(readBack.status()).toBe(200);
    expect(await readBack.json()).toEqual(signup);
  });

  test('API-131: Should seat people in the order sent and waitlist anyone past the capacity', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const people = buildAttendees(MAX_PEOPLE_PER_SIGNUP); // 4 seats are open
    const [p1, p2, p3, p4, p5] = people;

    const response = await eventsApi.signUp(people);

    expect(response.status()).toBe(201); // waitlisting is a success, not an error
    expect((await response.json()).signups).toEqual([
      ExpectedResponses.signup(p1),
      ExpectedResponses.signup(p2),
      ExpectedResponses.signup(p3),
      ExpectedResponses.signup(p4),
      ExpectedResponses.signup(p5, 'waitlisted'),
    ]);
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(CAPACITY, 1));
  });

  test('API-132: Should waitlist every new sign-up once the event is full, in arrival order', { tag: ['@P0'] }, async ({ eventsApi }) => {
    await fillRemainingSeats(eventsApi);
    const first = buildAttendees(2);
    const second = buildAttendees(2);

    const r1 = await eventsApi.signUp(first);
    const r2 = await eventsApi.signUp(second);

    expect(r1.status()).toBe(201);
    expect(r2.status()).toBe(201);
    const waitlist = (await listSignups(eventsApi)).filter((s) => s.status === 'waitlisted');
    expect(waitlist.map((s) => s.email)).toEqual([...first, ...second].map((p) => p.email));
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(CAPACITY, 4));
  });
});

test.describe('Create: duplicate emails', () => {
  for (const { label, email } of DUPLICATE_EMAIL_VARIANTS) {
    test(`API-133: Should return 409 for an email already confirmed (${label})`, { tag: ['@P0'] }, async ({ eventsApi }) => {
      const response = await eventsApi.signUp([buildAttendee({ email })]);

      await expectApiError(response, ApiErrors.duplicateEmail({ [fieldPath(0, 'email')]: FieldMessages.alreadySignedUp(SEEDED_PERSON.email) }));
      expect((await getCounts(eventsApi)).confirmedCount).toBe(SEEDED_CONFIRMED);
    });
  }

  test('API-134: Should return 409 for an email that is on the waitlist', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const [waitlisted] = await fillEventAndWaitlist(eventsApi, 1);

    const response = await eventsApi.signUp([buildAttendee({ email: waitlisted.email })]);

    await expectApiError(response, ApiErrors.duplicateEmail({ [fieldPath(0, 'email')]: FieldMessages.alreadySignedUp(waitlisted.email) }));
    expect((await getCounts(eventsApi)).waitlistCount).toBe(1);
  });

  test('API-135: Should save nobody when one person in the request is a duplicate', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const [newA, newB] = buildAttendees(2);

    const response = await eventsApi.signUp([newA, newB, buildAttendee({ email: SEEDED_PERSON.email })]);

    // only the duplicate is flagged
    await expectApiError(response, ApiErrors.duplicateEmail({ [fieldPath(2, 'email')]: FieldMessages.alreadySignedUp(SEEDED_PERSON.email) }));
    const emails = (await listSignups(eventsApi)).map((s) => s.email);
    expect(emails).not.toContain(newA.email);
    expect(emails).not.toContain(newB.email);
    expect((await getCounts(eventsApi)).confirmedCount).toBe(SEEDED_CONFIRMED);
  });

  test('API-136: Should allow an email to sign up again after that person is removed', { tag: ['@P1'] }, async ({ eventsApi }) => {
    expect((await eventsApi.removeSignup(SEEDED_PERSON.id)).status()).toBe(200);
    const newcomer = buildAttendee({ email: SEEDED_PERSON.email });

    const response = await eventsApi.signUp([newcomer]);

    expect(response.status()).toBe(201);
    expect((await response.json()).signups[0]).toEqual(ExpectedResponses.signup(newcomer));
  });
});
