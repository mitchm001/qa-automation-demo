import { UiMessages } from '../tests-support/expected/Messages';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillEventAndWaitlist } from '../tests-support/helpers/setup';
import { CAPACITY, fullName, SEEDED_CONFIRMED, SEEDED_PERSON } from '../tests-support/helpers/testData';

test.describe('Confirmed list: removing a person', () => {
  test.beforeEach(async ({ eventPage }) => {
    await eventPage.goto();
  });

  test('UI-019: Should remove the person from the Confirmed list', { tag: ['@P1'] }, async ({ eventPage }) => {
    await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toBeVisible();

    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();

    await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toHaveCount(0);
    await expect(eventPage.confirmed.rows).toHaveCount(SEEDED_CONFIRMED - 1);
  });

  test('UI-020: Should update the "Confirmed (n)" heading after a removal', { tag: ['@P2'] }, async ({ eventPage }) => {
    await expect(eventPage.confirmed.heading).toHaveText(UiMessages.confirmedHeading(SEEDED_CONFIRMED));

    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();

    await expect(eventPage.confirmed.heading).toHaveText(UiMessages.confirmedHeading(SEEDED_CONFIRMED - 1));
  });

  test('UI-021: Should update "n of 25 seats filled" after a removal', { tag: ['@P2'] }, async ({ eventPage }) => {
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));

    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();

    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED - 1));
  });

  test('UI-022: Should update the seat progress bar after a removal', { tag: ['@P2'] }, async ({ eventPage }) => {
    await expect(eventPage.seatProgress).toHaveJSProperty('max', CAPACITY);
    await expect(eventPage.seatProgress).toHaveJSProperty('value', SEEDED_CONFIRMED);

    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();

    await expect(eventPage.seatProgress).toHaveJSProperty('value', SEEDED_CONFIRMED - 1);
    await expect(eventPage.seatProgress).toHaveJSProperty('max', CAPACITY);
  });

  test('UI-023: Should display the green success message "Removed Ada Lovelace." after a removal', { tag: ['@P2'] }, async ({ eventPage }) => {
    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();

    await expectSuccessMessage(eventPage, UiMessages.removed(SEEDED_PERSON));
  });
});

test.describe('Confirmed list: removing a person when people are waitlisted', () => {
  test('UI-032: Should move the first waitlisted person into the freed seat', { tag: ['@P0'] }, async ({ eventsApi, eventPage }) => {
    const waitlisted = await fillEventAndWaitlist(eventsApi, 3); // 25 confirmed + 3 waitlisted, via the API
    const [first, second, third] = waitlisted;
    await eventPage.goto();
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(waitlisted.length));

    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();

    await expectSuccessMessage(eventPage, UiMessages.removedAndMovedUp(SEEDED_PERSON, first));
    await expect(eventPage.confirmed.rowFor(first)).toContainText(fullName(first));
    await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toHaveCount(0);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(CAPACITY)); // the seat didn't stay empty
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(waitlisted.length - 1));
    await expect(eventPage.waitlist.nameCells).toHaveText([fullName(second), fullName(third)]);
  });
});
