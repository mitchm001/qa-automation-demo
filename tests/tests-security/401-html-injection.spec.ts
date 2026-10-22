import { HTML_NAME_PAYLOADS, INJECTED_ELEMENTS } from '../constants/constants-security';
import { UiMessages } from '../tests-support/expected/Messages';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { buildAttendee, fullName } from '../tests-support/helpers/testData';

/**
    Names are shown on the page, so a name containing HTML must appear as plain text.
    If the app inserted it as HTML, a script in a name would run for everyone who views
    the page (stored cross-site scripting, "XSS").
*/
test.describe('Security: HTML in names', () => {
  for (const { label, firstName } of HTML_NAME_PAYLOADS) {
    test(`SEC-001: Should show a name containing HTML as plain text and not run it (${label})`, { tag: ['@P0'] }, async ({ eventPage, page }) => {
      const person = buildAttendee({ firstName });
      await eventPage.goto();

      await eventPage.signUp([person]);
      await expectSuccessMessage(eventPage, UiMessages.signedUp(1, 0));

      const row = eventPage.confirmed.rowFor(person);
      await expect(row.locator('td:nth-child(2)')).toHaveText(fullName(person)); // the exact characters, shown as text
      await expect(row.locator(INJECTED_ELEMENTS)).toHaveCount(0); // no real HTML elements were created
      expect(await page.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined(); // no script ran
    });
  }
});
