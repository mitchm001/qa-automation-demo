import { GREYED_OUT_OPACITY } from '../constants/constants-ui';
import { UiMessages } from '../tests-support/expected/Messages';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import {
  buildAttendee,
  buildAttendees,
  CAPACITY,
  fullName,
  MAX_PEOPLE_PER_SIGNUP,
  SEATS_LEFT_AFTER_RESET,
  SEEDED_CONFIRMED,
  SEEDED_PERSON,
} from '../tests-support/helpers/testData';

test.describe('Sign up: seats available', () => {
  test.beforeEach(async ({ eventPage }) => {
    await eventPage.goto();
  });

  test('UI-007: Should confirm everyone and display "Signed up 2 people: 2 confirmed, 0 waitlisted."', { tag: ['@P1'] }, async ({ eventPage }) => {
    const people = buildAttendees(2);

    await eventPage.signUp(people);

    await expectSuccessMessage(eventPage, UiMessages.signedUp(people.length, 0));
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED + people.length));
    for (const person of people) {
      await expect(eventPage.confirmed.rowFor(person)).toContainText(fullName(person));
    }
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
  });

  test('UI-043: Should reset the form to one empty "Person 1" row after a successful sign-up', { tag: ['@P2'] }, async ({ eventPage }) => {
    const { form } = eventPage;
    const people = buildAttendees(3);

    await eventPage.signUp(people);
    await expectSuccessMessage(eventPage, UiMessages.signedUp(people.length, 0));

    await expect(form.rows).toHaveCount(1);
    await expect(form.person(1)).toBeVisible();
    await expect(form.input(1, 'firstName')).toHaveValue('');
    await expect(form.input(1, 'lastName')).toHaveValue('');
    await expect(form.input(1, 'email')).toHaveValue('');
    await expect(form.removePersonButton(1)).toBeHidden(); // a single row can't be removed
    await expect(form.addPersonButton).toBeEnabled();
    await expect(form.formError).toBeEmpty();
  });

  test('UI-008: Should fill every open seat using "Add another person" without waitlisting anyone', { tag: ['@P0'] }, async ({ eventPage }) => {
    const people = buildAttendees(SEATS_LEFT_AFTER_RESET); // exactly the 4 open seats

    await eventPage.signUp(people); // adds rows with "Add another person"

    await expect(eventPage.seatPicker.dialog).toBeHidden(); // no seat picker: everyone fits
    await expectSuccessMessage(eventPage, UiMessages.signedUp(people.length, 0));
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(CAPACITY));
    await expect(eventPage.confirmed.rows).toHaveCount(CAPACITY);
    await expect(eventPage.confirmed.nameCells.last()).toHaveText(fullName(people[people.length - 1]));
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
  });

  test('UI-034: Should disable "Add another person" once 5 people are entered', { tag: ['@P1'] }, async ({ eventPage }) => {
    const { form } = eventPage;

    await form.fillPeople(buildAttendees(MAX_PEOPLE_PER_SIGNUP)); // clicks "Add another person" 4 times

    await expect(form.rows).toHaveCount(MAX_PEOPLE_PER_SIGNUP);
    await expect(form.addPersonButton).toBeDisabled();
    await expect(form.addPersonButton).toHaveCSS('opacity', GREYED_OUT_OPACITY);

    // Removing a row makes room again
    await form.removePersonButton(MAX_PEOPLE_PER_SIGNUP).click();
    await expect(form.addPersonButton).toBeEnabled();
    await form.addPersonButton.click();
    await expect(form.rows).toHaveCount(MAX_PEOPLE_PER_SIGNUP);
    await expect(form.addPersonButton).toBeDisabled();
  });

  test('UI-009: Should not sign up a person whose row was removed from the form before submitting', { tag: ['@P2'] }, async ({ eventPage }) => {
    const { form } = eventPage;
    const [first, removed, third] = buildAttendees(3);
    await form.fillPeople([first, removed, third]);

    await form.removePersonButton(2).click();

    // The remaining rows are renumbered and keep their data
    await expect(form.rows).toHaveCount(2);
    await expect(form.input(2, 'email')).toHaveValue(third.email);

    await form.submit();

    await expectSuccessMessage(eventPage, UiMessages.signedUp(2, 0));
    await expect(eventPage.confirmed.rowFor(first)).toBeVisible();
    await expect(eventPage.confirmed.rowFor(third)).toBeVisible();
    await expect(eventPage.confirmed.rowFor(removed)).toHaveCount(0);
    await expect(eventPage.waitlist.rowFor(removed)).toHaveCount(0);
  });

  test('UI-010: Should allow a sign-up with the same name as an existing person when the email is different', { tag: ['@P1'] }, async ({ eventPage }) => {
    const namesake = buildAttendee({ firstName: SEEDED_PERSON.firstName, lastName: SEEDED_PERSON.lastName });

    await eventPage.signUp([namesake]);

    await expectSuccessMessage(eventPage, UiMessages.signedUp(1, 0));
    await expect(eventPage.confirmed.rows.filter({ hasText: fullName(SEEDED_PERSON) })).toHaveCount(2);
    await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toBeVisible();
    await expect(eventPage.confirmed.rowFor(namesake)).toBeVisible();
  });

  test.skip(
    'UI-042: Should send only one sign-up request when "Sign up" is double-clicked',
    {
      tag: ['@P2', '@bug'],
      annotation: [
        { type: 'bug', description: 'BUG-002: double-clicking "Sign up" sends the sign-up twice and shows a duplicate error (see docs/bug-reports.md)' },
        { type: 'skipped', description: 'Known bug, logged and not fixed yet. Remove .skip once BUG-002 is fixed.' },
      ],
    },
    async ({ eventPage, page }) => {
      const { form } = eventPage;
      let signupRequests = 0;
      page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/signups')) signupRequests++;
      });
      await eventPage.goto();
      await form.fillPerson(1, buildAttendee());

      await form.submitButton.dblclick();

      await expectSuccessMessage(eventPage, UiMessages.signedUp(1, 0));
      await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED + 1)); // the page has finished refreshing

      // FAILING LINE (current, unfixed app): two requests go out (201, then 409), and
      // "One or more people are already signed up for this event." appears under the emptied form.
      expect(signupRequests).toBe(1);
      await expect(form.formError).toBeEmpty();

      // WORKING CODE: the fix for BUG-002. This test is marked .skip() and the bug is logged in
      // docs/bug-reports.md to demonstrate QA practice. With this change in the app, the lines above pass.
      // In platform-ui/src/client/main.ts, inside form.onSubmit, stop a second submit while one is in progress:
      //
      //   const submitButton = requireElement<HTMLButtonElement>('#signup-form button[type="submit"]');
      //   if (submitButton.disabled) return;
      //   submitButton.disabled = true;
      //   try { ...existing submit code... } finally { submitButton.disabled = false; }
    },
  );
});
