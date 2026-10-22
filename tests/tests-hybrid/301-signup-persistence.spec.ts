import { OTHER_USER_SIGNUPS, PEOPLE_ENTERED_AFTER } from '../constants/constants-hybrid';
import { ExpectedResponses } from '../tests-support/expected/ExpectedResponses';
import { UiMessages } from '../tests-support/expected/Messages';
import { listSignups } from '../tests-support/helpers/apiAssertions';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { expect, test } from '../tests-support/helpers/fixtures';
import { buildAttendee, buildAttendees, CAPACITY, fullName, SEATS_LEFT_AFTER_RESET, SEEDED_CONFIRMED } from '../tests-support/helpers/testData';

/**
    Hybrid tests: the UI and the API are both part of what's being tested
    (one changes the data, the other checks it). Tests that only use the API
    to set up a starting state stay in tests-ui/.
*/
test.describe('Hybrid: UI and API agree', () => {
  test('HYB-001: Should save a UI sign-up on the server so it is still there after a page reload', { tag: ['@P1'] }, async ({ eventPage, eventsApi, page }) => {
    const person = buildAttendee();
    await eventPage.goto();

    await eventPage.signUp([person]);
    await expectSuccessMessage(eventPage, UiMessages.signedUp(1, 0));

    // The API returns the person as confirmed
    const saved = (await listSignups(eventsApi)).find((s) => s.email === person.email);
    expect(saved).toEqual(ExpectedResponses.signup(person));

    // A fresh page load still shows them
    await page.reload();
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED + 1));
    await expect(eventPage.confirmed.rowFor(person)).toContainText(fullName(person));
  });

  test('HYB-002: Should use the latest seat count when seats are taken after the page has loaded', { tag: ['@P0'] }, async ({ eventPage, eventsApi }) => {
    const { seatPicker } = eventPage;
    const seatsLeft = SEATS_LEFT_AFTER_RESET - OTHER_USER_SIGNUPS;
    await eventPage.goto();
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));

    // Someone else takes 2 of the 4 open seats while this page is open
    const otherSignup = await eventsApi.signUp(buildAttendees(OTHER_USER_SIGNUPS));
    expect(otherSignup.status()).toBe(201);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED)); // the page doesn't know yet

    const people = buildAttendees(PEOPLE_ENTERED_AFTER);
    const [p1, p2, p3, p4] = people;
    await eventPage.signUp(people);

    await expect(seatPicker.title).toHaveText(UiMessages.seatsLeftTitle(seatsLeft)); // not 4
    await seatPicker.select([p1, p3]);
    await seatPicker.seatAndWaitlistRestButton.click();

    await expectSuccessMessage(eventPage, UiMessages.signedUp(seatsLeft, PEOPLE_ENTERED_AFTER - seatsLeft));
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(CAPACITY));
    await expect(eventPage.waitlist.nameCells).toHaveText([fullName(p2), fullName(p4)]);
  });
});
