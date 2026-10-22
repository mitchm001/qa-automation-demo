import { ALL_FIELDS, EMOJI_FIELD_CASES, INVALID_EMAILS, REQUIRED_FIELD_CASES } from '../constants/constants-ui';
import { FIELD_LABELS, FieldMessages, UiMessages } from '../tests-support/expected/Messages';
import { expect, test } from '../tests-support/helpers/fixtures';
import { buildAttendee, SEEDED_CONFIRMED, withEmoji } from '../tests-support/helpers/testData';

test.describe('Sign-up form: field validation', () => {
  test.beforeEach(async ({ eventPage }) => {
    await eventPage.goto();
  });

  for (const { id, field } of REQUIRED_FIELD_CASES) {
    test(`${id}: Should display "${FieldMessages.required(field)}" when ${FIELD_LABELS[field]} is left empty`, { tag: ['@P1'] }, async ({ eventPage }) => {
      const { form } = eventPage;

      await form.fillPerson(1, buildAttendee({ [field]: '' }));
      await form.submit();

      await expect(form.fieldError(1, field)).toHaveText(FieldMessages.required(field));
      await expect(form.input(1, field)).toHaveAttribute('aria-invalid', 'true');
      await expect(form.input(1, field)).toBeFocused();
      // Only the empty field is flagged
      for (const other of ALL_FIELDS.filter((f) => f !== field)) {
        await expect(form.fieldError(1, other)).toBeEmpty();
      }
      // Nobody was signed up
      await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
      await expect(eventPage.confirmed.rows).toHaveCount(SEEDED_CONFIRMED);
    });
  }

  for (const email of INVALID_EMAILS) {
    test(`UI-006: Should display "Email is not valid." for the email "${email}"`, { tag: ['@P1'] }, async ({ eventPage }) => {
      const { form } = eventPage;

      await form.fillPerson(1, buildAttendee({ email }));
      await form.submit();

      await expect(form.fieldError(1, 'email')).toHaveText(FieldMessages.emailInvalid);
      await expect(form.input(1, 'email')).toHaveAttribute('aria-invalid', 'true');
      await expect(form.fieldError(1, 'firstName')).toBeEmpty();
      await expect(form.fieldError(1, 'lastName')).toBeEmpty();
      await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
    });
  }

  test("UI-044: Should clear a field's error as soon as the user starts typing in it", { tag: ['@P2'] }, async ({ eventPage }) => {
    const { form } = eventPage;
    await form.submit(); // all three fields empty

    await expect(form.fieldError(1, 'firstName')).toHaveText(FieldMessages.required('firstName'));
    await expect(form.fieldError(1, 'lastName')).toHaveText(FieldMessages.required('lastName'));

    await form.input(1, 'firstName').pressSequentially(buildAttendee().firstName.charAt(0));

    await expect(form.fieldError(1, 'firstName')).toBeEmpty();
    await expect(form.input(1, 'firstName')).not.toHaveAttribute('aria-invalid');
    // The other fields keep their errors until they are edited
    await expect(form.fieldError(1, 'lastName')).toHaveText(FieldMessages.required('lastName'));
    await expect(form.fieldError(1, 'email')).toHaveText(FieldMessages.required('email'));
  });

  for (const { field, emoji } of EMOJI_FIELD_CASES) {
    test(`UI-045: Should display "${FieldMessages.noEmoji(field)}" when ${FIELD_LABELS[field]} has an emoji`, { tag: ['@P2'] }, async ({ eventPage }) => {
      const { form } = eventPage;

      await form.fillPerson(1, withEmoji(buildAttendee(), field, emoji));
      await form.submit();

      await expect(form.fieldError(1, field)).toHaveText(FieldMessages.noEmoji(field));
      await expect(form.input(1, field)).toHaveAttribute('aria-invalid', 'true');
      await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED)); // nothing was sent
    });
  }
});
