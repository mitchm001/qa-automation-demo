import AxeBuilder from '@axe-core/playwright';
import { UiMessages } from '../tests-support/expected/Messages';
import { expect, test } from '../tests-support/helpers/fixtures';
import { EVENT_NAME, SEEDED_CONFIRMED } from '../tests-support/helpers/testData';

test.describe('Page load', () => {
  test('UI-001: Should load the event page showing 21 of 25 seats filled', { tag: ['@P1'] }, async ({ eventPage }) => {
    await eventPage.goto();

    await expect(eventPage.eventName).toHaveText(EVENT_NAME);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
    await expect(eventPage.confirmed.heading).toHaveText(UiMessages.confirmedHeading(SEEDED_CONFIRMED));
    await expect(eventPage.confirmed.rows).toHaveCount(SEEDED_CONFIRMED);
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
  });

  test('UI-040: Should show the empty Waitlist card with "Nobody is on the waitlist." when nobody is waitlisted', { tag: ['@P2'] }, async ({ eventPage }) => {
    await eventPage.goto();

    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
    await expect(eventPage.waitlistEmptyMessage).toHaveText(UiMessages.waitlistEmpty);
    await expect(eventPage.waitlist.table).toBeHidden();
    await expect(eventPage.clearWaitlistButton).toBeHidden();
  });

  test('UI-002: Should have no automatically detectable accessibility violations', { tag: ['@P2'] }, async ({ eventPage, page }) => {
    await eventPage.goto();

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
});
