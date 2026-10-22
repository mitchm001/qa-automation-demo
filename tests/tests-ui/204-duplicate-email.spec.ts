import { DUPLICATE_EMAIL_CASES } from '../constants/constants-ui';
import { FieldMessages, UiMessages } from '../tests-support/expected/Messages';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillEventAndWaitlist } from '../tests-support/helpers/setup';
import { buildAttendee, buildAttendees, fullName, MAX_PEOPLE_PER_SIGNUP, SEEDED_CONFIRMED, SEEDED_PERSON } from '../tests-support/helpers/testData';

test.describe('Sign up: duplicate emails', () => {
  test.beforeEach(async ({ eventPage }) => {
    await eventPage.goto();
  });

  for (const { label, email } of DUPLICATE_EMAIL_CASES) {
    test(`UI-011: Should block a sign-up whose email is already signed up (${label})`, { tag: ['@P0'] }, async ({ eventPage }) => {
      const { form } = eventPage;
      const newcomer = buildAttendee({ email });

      await eventPage.signUp([newcomer]);

      await expect(form.fieldError(1, 'email')).toHaveText(FieldMessages.alreadySignedUp(SEEDED_PERSON.email));
      await expect(form.input(1, 'email')).toHaveAttribute('aria-invalid', 'true');
      await expect(form.formError).toHaveText(FieldMessages.duplicateSummary);
      // Nothing changed
      await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
      await expect(eventPage.confirmed.rows).toHaveCount(SEEDED_CONFIRMED);
      await expect(eventPage.confirmed.rows.filter({ hasText: fullName(newcomer) })).toHaveCount(0);
    });
  }

  test('UI-012: Should allow a sign-up with that email after the existing person is removed from the Confirmed list', { tag: ['@P1'] }, async ({ eventPage }) => {
    const { form } = eventPage;
    const newcomer = buildAttendee({ email: SEEDED_PERSON.email });

    await eventPage.signUp([newcomer]);
    await expect(form.fieldError(1, 'email')).toHaveText(FieldMessages.alreadySignedUp(SEEDED_PERSON.email));

    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();
    await expectSuccessMessage(eventPage, UiMessages.removed(SEEDED_PERSON));

    await form.submit(); // the form still holds the newcomer's details

    await expectSuccessMessage(eventPage, UiMessages.signedUp(1, 0));
    await expect(eventPage.confirmed.rowFor(newcomer)).toContainText(fullName(newcomer));
    await expect(eventPage.confirmed.rows.filter({ hasText: fullName(SEEDED_PERSON) })).toHaveCount(0);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
  });

  test('UI-036: Should block a sign-up whose email belongs to someone on the waitlist', { tag: ['@P0'] }, async ({ eventsApi, eventPage }) => {
    const { form, seatPicker } = eventPage;
    const [waitlisted] = await fillEventAndWaitlist(eventsApi, 1); // 25 confirmed + 1 waitlisted, via the API
    const newcomer = buildAttendee({ email: waitlisted.email });
    await eventPage.goto();

    await eventPage.signUp([newcomer]);
    await seatPicker.addSelectedToWaitlistButton.click(); // the event is full, so the waitlist pop-up opens first

    await expect(form.fieldError(1, 'email')).toHaveText(FieldMessages.alreadySignedUp(waitlisted.email));
    await expect(form.formError).toHaveText(FieldMessages.duplicateSummary);
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(1));
    await expect(eventPage.waitlist.rows.filter({ hasText: fullName(newcomer) })).toHaveCount(0);
  });

  test.skip(
    'UI-041: Should flag the repeated email on the correct person when the same email is entered twice in one sign-up',
    {
      tag: ['@P2', '@bug'],
      annotation: [
        { type: 'bug', description: 'BUG-001: duplicate email within one sign-up is reported against the wrong person number (see docs/bug-reports.md)' },
        { type: 'skipped', description: 'Known bug, logged and not fixed yet. Remove .skip once BUG-001 is fixed.' },
      ],
    },
    async ({ eventPage }) => {
      const { form, seatPicker } = eventPage;
      const people = buildAttendees(MAX_PEOPLE_PER_SIGNUP); // 5 people for 4 open seats
      people[4] = { ...people[4], email: people[0].email }; // Person 5 repeats Person 1's email
      await eventPage.goto();

      await eventPage.signUp(people);

      // FAILING LINE (current, unfixed app): the seat picker opens instead of the form catching the repeat.
      // After choosing seats, the server's error lands under Person 1 and says "person 4".
      await expect(form.fieldError(5, 'email')).toHaveText(FieldMessages.repeatedInRequest(1));
      await expect(seatPicker.dialog).toBeHidden();

      // WORKING CODE: the fix for BUG-001. This test is marked .skip() and the bug is logged in
      // docs/bug-reports.md to demonstrate QA practice. With this change in the app, the lines above pass.
      // In platform-ui/src/client/classes/SignupForm.ts, at the end of validate(), before focusFirstError():
      //
      //   const firstRowByEmail = new Map<string, number>();
      //   this.rows().forEach((row, index) => {
      //     const email = this.getAttendees()[index].email.trim().toLowerCase();
      //     if (email === '' || this.input(row, 'email').getAttribute('aria-invalid')) return;
      //     const firstIndex = firstRowByEmail.get(email);
      //     if (firstIndex === undefined) { firstRowByEmail.set(email, index); return; }
      //     this.setFieldError(row, 'email', `This email is already used by person ${firstIndex + 1} in this list.`);
      //     valid = false;
      //   });
    },
  );
});
