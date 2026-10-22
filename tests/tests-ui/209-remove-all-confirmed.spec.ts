import { UiMessages } from '../tests-support/expected/Messages';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { CLOSE_METHODS } from '../tests-support/helpers/dialogs';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillEventAndWaitlist } from '../tests-support/helpers/setup';
import { CAPACITY, fullName, SEEDED_CONFIRMED } from '../tests-support/helpers/testData';

test.describe('Confirmed list: Remove all, cancelling and waitlist promotion', () => {
  for (const { method, close } of CLOSE_METHODS) {
    test(`UI-031: Should close the "Remove all" pop-up with ${method} without removing anyone`, { tag: ['@P1'] }, async ({ eventPage, page }) => {
      const { confirmDialog } = eventPage;
      await eventPage.goto();
      await eventPage.removeAllConfirmedButton.click();
      await expect(confirmDialog.dialog).toBeVisible();
      await expect(confirmDialog.cancelButton).toBeFocused(); // the safe choice is the default

      await close(confirmDialog.cancelButton, page);

      await expect(confirmDialog.dialog).toBeHidden();
      await expect(eventPage.statusMessage).toBeHidden(); // no message shown
      await expect(eventPage.confirmed.heading).toHaveText(UiMessages.confirmedHeading(SEEDED_CONFIRMED));
      await expect(eventPage.confirmed.rows).toHaveCount(SEEDED_CONFIRMED);
      await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
    });
  }

  test('UI-033: Should move waitlisted people into the freed seats, in waitlist order, after "Remove all"', { tag: ['@P0'] }, async ({ eventsApi, eventPage }) => {
    const { confirmDialog } = eventPage;
    const waitlisted = await fillEventAndWaitlist(eventsApi, 3); // 25 confirmed + 3 waitlisted, via the API
    await eventPage.goto();

    await eventPage.removeAllConfirmedButton.click();
    await expect(confirmDialog.message).toHaveText(UiMessages.removeAllWaitlistNote);
    await confirmDialog.confirmButton.click();

    await expectSuccessMessage(eventPage, UiMessages.removedAllConfirmed(CAPACITY, waitlisted.length));
    await expect(eventPage.confirmed.nameCells).toHaveText(waitlisted.map(fullName));
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(waitlisted.length));
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
  });
});

test.describe('Confirmed list: Remove all', () => {
  test.beforeEach(async ({ eventPage }) => {
    await eventPage.goto();
  });

  test('UI-027: Should remove everyone from the Confirmed list after confirming "Remove all"', { tag: ['@P1'] }, async ({ eventPage }) => {
    const { confirmDialog } = eventPage;

    await eventPage.removeAllConfirmedButton.click();

    await expect(confirmDialog.title).toHaveText(UiMessages.removeAllTitle);
    await expect(confirmDialog.cautionIcon).toBeVisible();
    await confirmDialog.confirmButton.click();

    await expect(confirmDialog.dialog).toBeHidden();
    await expectSuccessMessage(eventPage, UiMessages.removedAllConfirmed(SEEDED_CONFIRMED));
    await expect(eventPage.confirmed.rows).toHaveCount(0);
  });

  test('UI-028: Should show an empty Confirmed list after everyone is removed', { tag: ['@P2'] }, async ({ eventPage }) => {
    await eventPage.removeAllConfirmedButton.click();
    await eventPage.confirmDialog.confirmButton.click();

    await expect(eventPage.confirmed.heading).toHaveText(UiMessages.confirmedHeading(0));
    await expect(eventPage.confirmed.rows).toHaveCount(0);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(0));
    await expect(eventPage.seatProgress).toHaveJSProperty('value', 0);
    await expect(eventPage.removeAllConfirmedButton).toBeHidden();
  });
});
