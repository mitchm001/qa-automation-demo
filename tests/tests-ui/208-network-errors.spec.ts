import { EVENT_REQUEST, SIGNUP_REQUESTS } from '../constants/constants-ui';
import { UiMessages } from '../tests-support/expected/Messages';
import { expectErrorMessage } from '../tests-support/helpers/assertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { buildAttendee, SEEDED_CONFIRMED } from '../tests-support/helpers/testData';

/** page.route() intercepts the browser's requests, so these tests can simulate the server being unreachable. */
test.describe('Network errors', () => {
  test('UI-038: Should display a red "Could not reach the server" message and keep the form filled when sign-up fails', { tag: ['@P2'] }, async ({ eventPage, page }) => {
    const { form } = eventPage;
    const person = buildAttendee();
    await eventPage.goto();
    await page.route(SIGNUP_REQUESTS, (route) => (route.request().method() === 'POST' ? route.abort('connectionrefused') : route.continue()));

    await eventPage.signUp([person]);

    await expectErrorMessage(eventPage, UiMessages.serverUnreachable);
    await expect(form.input(1, 'email')).toHaveValue(person.email); // nothing typed is lost
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
  });

  test('UI-039: Should display a red "Could not load the event" message when the page cannot load the event', { tag: ['@P2'] }, async ({ eventPage, page }) => {
    await page.route(EVENT_REQUEST, (route) => route.abort('connectionrefused'));

    await page.goto('/');

    await expectErrorMessage(eventPage, UiMessages.eventLoadFailed);
    await expect(eventPage.eventName).toHaveText(UiMessages.eventLoading);
  });
});
