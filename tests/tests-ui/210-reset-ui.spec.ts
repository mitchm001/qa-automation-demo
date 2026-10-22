import { UiMessages } from '../tests-support/expected/Messages';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { CLOSE_METHODS } from '../tests-support/helpers/dialogs';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillRemainingSeats } from '../tests-support/helpers/setup';
import { buildAttendee, buildAttendees, CAPACITY, fullName, SEEDED_CONFIRMED, SEEDED_PERSON, type Attendee } from '../tests-support/helpers/testData';

test.describe('Reset UI', () => {
  let added: Attendee[]; // people who aren't in the original data
  let waitlisted: Attendee[];

  // Both lists need people in them, and differ from the original data, so a reset has something to undo:
  // 4 new people fill the event, 3 join the waitlist, then Ada is removed (the first waitlisted person moves up).
  test.beforeEach(async ({ eventsApi, eventPage }) => {
    const seated = await fillRemainingSeats(eventsApi);
    const queued = buildAttendees(3);
    expect((await eventsApi.signUp(queued)).status()).toBe(201);
    expect((await eventsApi.removeSignup(SEEDED_PERSON.id)).status()).toBe(200);
    added = [...seated, ...queued];
    waitlisted = queued.slice(1);

    await eventPage.goto();
    await expect(eventPage.confirmed.rows).toHaveCount(CAPACITY);
    await expect(eventPage.waitlist.nameCells).toHaveText(waitlisted.map(fullName));
    await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toHaveCount(0);
  });

  test('UI-046: Should show what Reset UI does when hovering the "i" icon', { tag: ['@P3'] }, async ({ eventPage, page }) => {
    await expect(eventPage.resetUiTooltip).toBeHidden();

    await eventPage.resetUiInfoIcon.hover();

    await expect(eventPage.resetUiTooltip).toBeVisible();
    await expect(eventPage.resetUiTooltip).toHaveText(UiMessages.resetTooltip);

    await page.mouse.move(0, 0); // move away
    await expect(eventPage.resetUiTooltip).toBeHidden();
  });

  test('UI-047: Should ask for confirmation before resetting', { tag: ['@P2'] }, async ({ eventPage }) => {
    const { confirmDialog } = eventPage;

    await eventPage.resetUiButton.click();

    await expect(confirmDialog.title).toHaveText(UiMessages.resetTitle);
    await expect(confirmDialog.message).toHaveText(UiMessages.resetMessage);
    await expect(confirmDialog.cautionIcon).toBeVisible();
    await expect(confirmDialog.confirmButton).toHaveText(UiMessages.resetConfirmLabel);
    await expect(confirmDialog.cancelButton).toBeFocused(); // the safe choice is the default
  });

  for (const { method, close } of CLOSE_METHODS) {
    test(`UI-048: Should keep both lists unchanged when the Reset UI pop-up is closed with ${method}`, { tag: ['@P1'] }, async ({ eventPage, page }) => {
      await eventPage.resetUiButton.click();
      await expect(eventPage.confirmDialog.dialog).toBeVisible();

      await close(eventPage.confirmDialog.cancelButton, page);

      await expect(eventPage.confirmDialog.dialog).toBeHidden();
      await expect(eventPage.statusMessage).toBeHidden(); // no message shown
      await expect(eventPage.confirmed.rows).toHaveCount(CAPACITY);
      await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toHaveCount(0);
      await expect(eventPage.waitlist.nameCells).toHaveText(waitlisted.map(fullName));
    });
  }

  test('UI-049: Should restore the original 21 people and empty the waitlist after confirming Reset UI', { tag: ['@P1'] }, async ({ eventPage }) => {
    const { form } = eventPage;
    await form.fillPerson(1, buildAttendee()); // something typed but not submitted

    await eventPage.resetUiButton.click();
    await eventPage.confirmDialog.confirmButton.click();

    await expectSuccessMessage(eventPage, UiMessages.resetDone);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
    await expect(eventPage.confirmed.heading).toHaveText(UiMessages.confirmedHeading(SEEDED_CONFIRMED));
    await expect(eventPage.confirmed.rows).toHaveCount(SEEDED_CONFIRMED);
    await expect(eventPage.confirmed.nameCells.first()).toHaveText(fullName(SEEDED_PERSON)); // back, in first place
    for (const person of added) {
      await expect(eventPage.confirmed.rowFor(person)).toHaveCount(0);
    }
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
    // The form is cleared too
    await expect(form.rows).toHaveCount(1);
    await expect(form.input(1, 'email')).toHaveValue('');
  });

  test('UI-050: Should save the reset on the server so it is still there after a page reload', { tag: ['@P2'] }, async ({ eventPage, page }) => {
    await eventPage.resetUiButton.click();
    await eventPage.confirmDialog.confirmButton.click();
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));

    await page.reload();

    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
    await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toBeVisible();
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
  });
});
