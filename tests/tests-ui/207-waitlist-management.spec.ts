import { UiMessages } from '../tests-support/expected/Messages';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillEventAndWaitlist } from '../tests-support/helpers/setup';
import { CAPACITY, fullName, positions, SEEDED_PERSON, type Attendee } from '../tests-support/helpers/testData';

test.describe('Waitlist: removing people', () => {
  let waitlisted: Attendee[];

  test.beforeEach(async ({ eventsApi, eventPage }) => {
    waitlisted = await fillEventAndWaitlist(eventsApi, 3); // 25 confirmed + 3 waitlisted, via the API
    await eventPage.goto();
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(waitlisted.length));
  });

  test('UI-024: Should remove one person from the waitlist and display "Removed <first> <last>."', { tag: ['@P2'] }, async ({ eventPage }) => {
    const [first, middle, last] = waitlisted;

    await eventPage.waitlist.removeButtonFor(middle).click();

    await expectSuccessMessage(eventPage, UiMessages.removed(middle));
    await expect(eventPage.waitlist.nameCells).toHaveText([fullName(first), fullName(last)]);
    await expect(eventPage.confirmed.rows).toHaveCount(CAPACITY); // confirmed list untouched
  });

  test('UI-037: Should renumber the "#" column in both lists after people are removed', { tag: ['@P2'] }, async ({ eventPage }) => {
    const [first, middle, last] = waitlisted;

    await eventPage.waitlist.removeButtonFor(middle).click();
    await expect(eventPage.waitlist.nameCells).toHaveText([fullName(first), fullName(last)]);
    await expect(eventPage.waitlist.positionCells).toHaveText(positions(2));

    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click(); // the first waitlisted person moves up
    await expect(eventPage.waitlist.positionCells).toHaveText(positions(1));
    await expect(eventPage.confirmed.positionCells).toHaveText(positions(CAPACITY)); // 1-25, no gaps
  });

  test('UI-025: Should empty the waitlist with "Clear waitlist"', { tag: ['@P1'] }, async ({ eventPage }) => {
    await eventPage.clearWaitlistButton.click();

    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
    await expect(eventPage.waitlist.table).toBeHidden();
    await expect(eventPage.clearWaitlistButton).toBeHidden();
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(CAPACITY)); // confirmed list untouched
  });

  test('UI-026: Should display "Removed 3 people from the waitlist." after "Clear waitlist"', { tag: ['@P2'] }, async ({ eventPage }) => {
    await eventPage.clearWaitlistButton.click();

    await expectSuccessMessage(eventPage, UiMessages.clearedWaitlist(waitlisted.length));
  });
});
