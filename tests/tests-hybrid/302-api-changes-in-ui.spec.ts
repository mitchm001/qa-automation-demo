import { ApiErrors } from '../tests-support/expected/ApiErrors';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { UiMessages } from '../tests-support/expected/Messages';
import { expectApiError, getCounts } from '../tests-support/helpers/apiAssertions';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillEventAndWaitlist } from '../tests-support/helpers/setup';
import { buildAttendees, CAPACITY, fullName, SEEDED_CONFIRMED, SEEDED_PERSON } from '../tests-support/helpers/testData';

/**
    Hybrid: change data directly through the API, then confirm the page shows it,
    or change it in the page and confirm through the API.
*/
test.describe('Hybrid: API changes appear in the UI', () => {
  test('HYB-003: Should show people added through the API in the Confirmed list', { tag: ['@P1'] }, async ({ eventsApi, eventPage }) => {
    const people = buildAttendees(2);

    const response = await eventsApi.signUp(people);
    expect(response.status()).toBe(201);
    await eventPage.goto();

    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED + people.length));
    await expect(eventPage.confirmed.nameCells.last()).toHaveText(fullName(people[1]));
    for (const person of people) await expect(eventPage.confirmed.rowFor(person)).toBeVisible();
  });

  test('HYB-004: Should show an API removal, and who moved up, after the page reloads', { tag: ['@P1'] }, async ({ eventsApi, eventPage, page }) => {
    const [w1, w2] = await fillEventAndWaitlist(eventsApi, 2);
    await eventPage.goto();
    await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toBeVisible();

    const response = await eventsApi.removeSignup(SEEDED_PERSON.id);
    expect(response.status()).toBe(200);
    await page.reload();

    await expect(eventPage.confirmed.rowFor(SEEDED_PERSON)).toHaveCount(0);
    await expect(eventPage.confirmed.rowFor(w1)).toBeVisible();
    await expect(eventPage.waitlist.nameCells).toHaveText([fullName(w2)]);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(CAPACITY));
  });

  test('HYB-005: Should show an empty waitlist after the waitlist is cleared through the API', { tag: ['@P2'] }, async ({ eventsApi, eventPage, page }) => {
    const waitlisted = await fillEventAndWaitlist(eventsApi, 3);
    await eventPage.goto();
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(waitlisted.length));

    expect((await eventsApi.clearWaitlist()).status()).toBe(200);
    await page.reload();

    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
    await expect(eventPage.confirmed.rows).toHaveCount(CAPACITY);
  });

  test('HYB-006: Should show an empty Confirmed list after everyone is removed through the API', { tag: ['@P2'] }, async ({ eventsApi, eventPage, page }) => {
    await eventPage.goto();

    expect((await eventsApi.clearConfirmed()).status()).toBe(200);
    await page.reload();

    await expect(eventPage.confirmed.heading).toHaveText(UiMessages.confirmedHeading(0));
    await expect(eventPage.confirmed.rows).toHaveCount(0);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(0));
  });
});

test.describe('Hybrid: UI changes confirmed through the API', () => {
  test('HYB-007: Should delete the person on the server when they are removed in the UI', { tag: ['@P1'] }, async ({ eventsApi, eventPage }) => {
    await eventPage.goto();

    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();
    await expectSuccessMessage(eventPage, UiMessages.removed(SEEDED_PERSON));

    await expectApiError(await eventsApi.getSignup(SEEDED_PERSON.id), ApiErrors.signupNotFound(SEEDED_PERSON.id));
    expect(await getCounts(eventsApi)).toEqual(ExpectedResponses.counts(SEEDED_CONFIRMED - 1));
  });
});
