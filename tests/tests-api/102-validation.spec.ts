import {
  BADLY_FORMED_EMAILS,
  EMOJI_FIELDS,
  EMOJI_SAMPLES,
  INVALID_PEOPLE_COUNTS,
  MISSING_OR_WRONG_TYPE_EMAILS,
  MISSING_OR_WRONG_TYPE_NAMES,
  NAME_FIELDS,
  NOT_A_LIST_BODIES,
  NOT_AN_OBJECT_PEOPLE,
  VALID_PEOPLE_COUNTS,
} from '../constants/constants-api';
import { ApiErrors, fieldPath } from '../tests-support/expected/ApiErrors';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { FIELD_LABELS, FieldMessages } from '../tests-support/expected/Messages';
import { expectApiError, getCounts, listSignups } from '../tests-support/helpers/apiAssertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import {
  buildAttendee,
  buildAttendees,
  EMAIL_MAX_LENGTH,
  emailOfLength,
  INVALID_EMAIL,
  NAME_MAX_LENGTH,
  nameOfLength,
  SEEDED_CONFIRMED,
} from '../tests-support/helpers/testData';

test.describe('Validation: request shape', () => {
  for (const { label, body } of NOT_A_LIST_BODIES) {
    test(`API-116: Should return 400 when attendees isn't a list (${label})`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const response = await eventsApi.signUpRaw(body);

      await expectApiError(response, ApiErrors.validation({ attendees: FieldMessages.attendeesNotList }));
    });
  }

  for (const count of INVALID_PEOPLE_COUNTS) {
    test(`API-117: Should return 400 for ${count} people in one sign-up (allowed: 1-5)`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const response = await eventsApi.signUp(buildAttendees(count));

      await expectApiError(response, ApiErrors.validation({ attendees: FieldMessages.peopleCount }));
    });
  }

  for (const count of VALID_PEOPLE_COUNTS) {
    test(`API-118: Should accept ${count} ${count === 1 ? 'person' : 'people'} in one sign-up (boundary)`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const response = await eventsApi.signUp(buildAttendees(count));

      expect(response.status()).toBe(201);
      expect((await response.json()).signups).toHaveLength(count);
    });
  }

  for (const { label, person } of NOT_AN_OBJECT_PEOPLE) {
    test(`API-119: Should return 400 when a person is ${label} instead of an object`, { tag: ['@P2'] }, async ({ eventsApi }) => {
      const response = await eventsApi.signUpRaw({ attendees: [person] });

      await expectApiError(response, ApiErrors.validation({ [fieldPath(0)]: FieldMessages.personNotObject }));
    });
  }
});

test.describe('Validation: names', () => {
  for (const field of NAME_FIELDS) {
    for (const { label, value } of MISSING_OR_WRONG_TYPE_NAMES) {
      test(`API-120: Should return 400 "${FieldMessages.required(field)}" when ${FIELD_LABELS[field]} is ${label}`, { tag: ['@P1'] }, async ({ eventsApi }) => {
        const person: Record<string, unknown> = { ...buildAttendee(), [field]: value };
        if (value === undefined) delete person[field];

        const response = await eventsApi.signUpRaw({ attendees: [person] });

        await expectApiError(response, ApiErrors.validation({ [fieldPath(0, field)]: FieldMessages.required(field) }));
      });
    }

    test(`API-121: Should accept a ${FIELD_LABELS[field]} of exactly ${NAME_MAX_LENGTH} characters and reject ${NAME_MAX_LENGTH + 1}`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const longest = nameOfLength(NAME_MAX_LENGTH);
      const accepted = await eventsApi.signUp([buildAttendee({ [field]: longest })]);
      expect(accepted.status()).toBe(201);
      expect((await accepted.json()).signups[0][field]).toBe(longest);

      const rejected = await eventsApi.signUp([buildAttendee({ [field]: nameOfLength(NAME_MAX_LENGTH + 1) })]);
      await expectApiError(rejected, ApiErrors.validation({ [fieldPath(0, field)]: FieldMessages.tooLong(field) }));
    });
  }
});

test.describe('Validation: email', () => {
  for (const { label, value } of MISSING_OR_WRONG_TYPE_EMAILS) {
    test(`API-122: Should return 400 "Email is required." when the email is ${label}`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const person: Record<string, unknown> = { ...buildAttendee(), email: value };
      if (value === undefined) delete person.email;

      const response = await eventsApi.signUpRaw({ attendees: [person] });

      await expectApiError(response, ApiErrors.validation({ [fieldPath(0, 'email')]: FieldMessages.required('email') }));
    });
  }

  for (const email of BADLY_FORMED_EMAILS) {
    test(`API-123: Should return 400 "Email is not valid." for "${email}"`, { tag: ['@P1'] }, async ({ eventsApi }) => {
      const response = await eventsApi.signUp([buildAttendee({ email })]);

      await expectApiError(response, ApiErrors.validation({ [fieldPath(0, 'email')]: FieldMessages.emailInvalid }));
    });
  }

  test(`API-124: Should accept an email of exactly ${EMAIL_MAX_LENGTH} characters and reject ${EMAIL_MAX_LENGTH + 1}`, { tag: ['@P2'] }, async ({ eventsApi }) => {
    const accepted = await eventsApi.signUp([buildAttendee({ email: emailOfLength(EMAIL_MAX_LENGTH) })]);
    expect(accepted.status()).toBe(201);

    const rejected = await eventsApi.signUp([buildAttendee({ email: emailOfLength(EMAIL_MAX_LENGTH + 1) })]);
    await expectApiError(rejected, ApiErrors.validation({ [fieldPath(0, 'email')]: FieldMessages.tooLong('email') }));
  });
});

test.describe('Validation: whole request', () => {
  test('API-125: Should report every invalid field at once, keyed by person and field', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const { lastName: _omitted, ...missingLastName } = buildAttendee();

    const response = await eventsApi.signUpRaw({
      attendees: [buildAttendee({ firstName: '', email: INVALID_EMAIL }), buildAttendee(), missingLastName],
    });

    await expectApiError(
      response,
      ApiErrors.validation({
        [fieldPath(0, 'firstName')]: FieldMessages.required('firstName'),
        [fieldPath(0, 'email')]: FieldMessages.emailInvalid,
        [fieldPath(2, 'lastName')]: FieldMessages.required('lastName'),
      }),
    );
  });

  test('API-126: Should return 400 when the same email appears twice in one request, ignoring capitals', { tag: ['@P1'] }, async ({ eventsApi }) => {
    const first = buildAttendee();
    const repeat = buildAttendee({ email: first.email.toUpperCase() });

    const response = await eventsApi.signUp([first, repeat]);

    await expectApiError(response, ApiErrors.validation({ [fieldPath(1, 'email')]: FieldMessages.repeatedInRequest(1) }));
  });

  test('API-127: Should save nobody when any person in the request is invalid', { tag: ['@P0'] }, async ({ eventsApi }) => {
    const valid = buildAttendee();

    const response = await eventsApi.signUp([valid, buildAttendee({ email: INVALID_EMAIL })]);

    expect(response.status()).toBe(400);
    expect((await getCounts(eventsApi)).confirmedCount).toBe(SEEDED_CONFIRMED);
    expect((await listSignups(eventsApi)).map((s) => s.email)).not.toContain(valid.email);
  });

  test('API-128: Should trim spaces from every field and save the email in lowercase', { tag: ['@P2'] }, async ({ eventsApi }) => {
    const person = buildAttendee();
    const padded = { firstName: `  ${person.firstName} `, lastName: ` ${person.lastName}  `, email: `  ${person.email.toUpperCase()} ` };

    const response = await eventsApi.signUp([padded]);

    expect(response.status()).toBe(201);
    const [saved] = (await response.json()).signups;
    expect(saved).toEqual(ExpectedResponses.signup(person));

    const readBack = await eventsApi.getSignup(saved.id);
    expect(readBack.status()).toBe(200);
    expect(await readBack.json()).toEqual(ExpectedResponses.signup(person, 'confirmed', saved.id));
  });
});

test.describe('Validation: no emoji', () => {
  for (const { field, withEmoji } of EMOJI_FIELDS) {
    for (const { label, value } of EMOJI_SAMPLES) {
      test(`API-129: Should return 400 "${FieldMessages.noEmoji(field)}" for ${field} containing an emoji (${label})`, { tag: ['@P2'] }, async ({ eventsApi }) => {
        const response = await eventsApi.signUp([buildAttendee({ [field]: withEmoji(value) })]);

        await expectApiError(response, ApiErrors.validation({ [fieldPath(0, field)]: FieldMessages.noEmoji(field) }));
        expect((await getCounts(eventsApi)).confirmedCount).toBe(SEEDED_CONFIRMED);
      });
    }
  }
});
