import { UiMessages } from '../tests-support/expected/Messages';
import { expectSuccessMessage } from '../tests-support/helpers/assertions';
import { CLOSE_METHODS } from '../tests-support/helpers/dialogs';
import { expect, test } from '../tests-support/helpers/fixtures';
import { fillRemainingSeats } from '../tests-support/helpers/setup';
import { buildAttendees, CAPACITY, fullName, MAX_PEOPLE_PER_SIGNUP, SEATS_LEFT_AFTER_RESET, SEEDED_CONFIRMED } from '../tests-support/helpers/testData';

test.describe('Seat picker: more people than open seats', () => {
  test('UI-013: Should seat the selected people and waitlist the rest, displaying "Signed up 5 people: 4 confirmed, 1 waitlisted."', { tag: ['@P0'] }, async ({ eventPage }) => {
    const { seatPicker } = eventPage;
    const people = buildAttendees(MAX_PEOPLE_PER_SIGNUP); // 4 seats are open
    const [p1, p2, p3, p4, p5] = people;
    await eventPage.goto();

    await eventPage.signUp(people);

    await expect(seatPicker.title).toHaveText(UiMessages.seatsLeftTitle(SEATS_LEFT_AFTER_RESET));
    await expect(seatPicker.seatAndWaitlistRestButton).toBeDisabled();
    await seatPicker.select([p1, p2, p4, p5]);
    await expect(seatPicker.counter).toHaveText(UiMessages.seatsSelected(SEATS_LEFT_AFTER_RESET, SEATS_LEFT_AFTER_RESET));
    await expect(seatPicker.checkboxFor(p3)).toBeDisabled(); // the limit is reached
    await seatPicker.seatAndWaitlistRestButton.click();

    await expectSuccessMessage(eventPage, UiMessages.signedUp(SEATS_LEFT_AFTER_RESET, 1));
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(CAPACITY));
    for (const seated of [p1, p2, p4, p5]) {
      await expect(eventPage.confirmed.rowFor(seated)).toContainText(fullName(seated));
    }
    await expect(eventPage.waitlist.nameCells).toHaveText([fullName(p3)]);
  });

  test(`UI-035: Should seat the selected people and leave out the rest with "Seat selected, don't add the rest"`, { tag: ['@P1'] }, async ({ eventPage }) => {
    const { seatPicker } = eventPage;
    const people = buildAttendees(MAX_PEOPLE_PER_SIGNUP); // 4 seats are open
    const [p1, p2, p3, p4, p5] = people;
    await eventPage.goto();

    await eventPage.signUp(people);
    await expect(seatPicker.seatAndDropRestButton).toBeDisabled();
    await seatPicker.select([p1, p2, p3, p5]);
    await seatPicker.seatAndDropRestButton.click();

    await expectSuccessMessage(eventPage, UiMessages.signedUp(SEATS_LEFT_AFTER_RESET, 0));
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(CAPACITY));
    for (const seated of [p1, p2, p3, p5]) {
      await expect(eventPage.confirmed.rowFor(seated)).toBeVisible();
    }
    // The person who wasn't picked is in neither list
    await expect(eventPage.confirmed.rowFor(p4)).toHaveCount(0);
    await expect(eventPage.waitlist.rowFor(p4)).toHaveCount(0);
    await expect(eventPage.waitlistEmptyMessage).toBeVisible();
  });

  for (const { method, close } of CLOSE_METHODS) {
    test(`UI-029: Should close the "Only 4 seats left" pop-up with ${method} without signing anyone up`, { tag: ['@P1'] }, async ({ eventPage, page }) => {
      const { seatPicker, form } = eventPage;
      const people = buildAttendees(MAX_PEOPLE_PER_SIGNUP);
      await eventPage.goto();
      await eventPage.signUp(people);
      await expect(seatPicker.title).toHaveText(UiMessages.seatsLeftTitle(SEATS_LEFT_AFTER_RESET));

      await close(seatPicker.cancelButton, page);

      await expect(seatPicker.dialog).toBeHidden();
      await expect(eventPage.statusMessage).toBeHidden(); // no message shown
      await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
      await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
      // The form keeps what was entered, so the user can change it and try again
      await expect(form.rows).toHaveCount(people.length);
      await expect(form.input(people.length, 'email')).toHaveValue(people[people.length - 1].email);
    });
  }
});

test.describe('Waitlist: event is full', () => {
  test.beforeEach(async ({ eventsApi, eventPage }) => {
    await fillRemainingSeats(eventsApi); // 25 of 25, via the API
    await eventPage.goto();
  });

  test('UI-014: Should add one person to the waitlist when the event is full', { tag: ['@P0'] }, async ({ eventPage }) => {
    const { seatPicker } = eventPage;
    const [person] = buildAttendees(1);

    await eventPage.signUp([person]);

    await expect(seatPicker.title).toHaveText(UiMessages.eventFullTitle);
    await expect(seatPicker.cautionIcon).toBeVisible();
    await expect(seatPicker.description).toContainText(UiMessages.eventFullDescriptionStart);
    await expect(seatPicker.checkboxFor(person)).toBeChecked();
    await seatPicker.addSelectedToWaitlistButton.click();

    await expect(seatPicker.dialog).toBeHidden();
    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(1));
    await expect(eventPage.waitlist.nameCells).toHaveText([fullName(person)]);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(CAPACITY));
    await expect(eventPage.confirmed.rows).toHaveCount(CAPACITY);
  });

  test('UI-015: Should add several people entered with "Add another person" to the waitlist when the event is full', { tag: ['@P1'] }, async ({ eventPage }) => {
    const { seatPicker } = eventPage;
    const people = buildAttendees(3);

    await eventPage.signUp(people);

    await expect(seatPicker.title).toHaveText(UiMessages.eventFullTitle);
    await expect(seatPicker.personCheckboxes).toHaveCount(people.length);
    await expect(seatPicker.counter).toHaveText(UiMessages.selectedForWaitlist(people.length, people.length));
    await seatPicker.addSelectedToWaitlistButton.click();

    await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(people.length));
    await expect(eventPage.waitlist.nameCells).toHaveText(people.map(fullName));
    await expect(eventPage.confirmed.rows).toHaveCount(CAPACITY);
  });

  test('UI-016: Should add only the checked people to the waitlist when some are unchecked', { tag: ['@P1'] }, async ({ eventPage }) => {
    const { seatPicker } = eventPage;
    const people = buildAttendees(4);
    const [p1, p2, p3, p4] = people;

    await eventPage.signUp(people);
    await seatPicker.deselect([p2, p4]); // everyone starts checked

    await expect(seatPicker.counter).toHaveText(UiMessages.selectedForWaitlist(2, people.length));
    await expect(seatPicker.selectAll).not.toBeChecked();
    await expect(seatPicker.selectAll).toHaveJSProperty('indeterminate', true); // the "some selected" dash
    await seatPicker.addSelectedToWaitlistButton.click();

    await expect(eventPage.waitlist.nameCells).toHaveText([fullName(p1), fullName(p3)]);
    for (const left of [p2, p4]) {
      await expect(eventPage.waitlist.rowFor(left)).toHaveCount(0);
      await expect(eventPage.confirmed.rowFor(left)).toHaveCount(0);
    }
  });

  test('UI-017: Should add everyone to the waitlist using "Select all"', { tag: ['@P1'] }, async ({ eventPage }) => {
    const { seatPicker } = eventPage;
    const people = buildAttendees(3);

    await eventPage.signUp(people);
    await expect(seatPicker.selectAll).toBeChecked(); // checked by default

    await seatPicker.selectAll.uncheck();
    for (const person of people) await expect(seatPicker.checkboxFor(person)).not.toBeChecked();
    await expect(seatPicker.addSelectedToWaitlistButton).toBeDisabled();

    await seatPicker.selectAll.check();
    for (const person of people) await expect(seatPicker.checkboxFor(person)).toBeChecked();
    await expect(seatPicker.counter).toHaveText(UiMessages.selectedForWaitlist(people.length, people.length));
    await seatPicker.addSelectedToWaitlistButton.click();

    await expect(eventPage.waitlist.nameCells).toHaveText(people.map(fullName));
  });

  for (const { method, close } of CLOSE_METHODS) {
    test(`UI-030: Should close the "This event is full" pop-up with ${method} without waitlisting anyone`, { tag: ['@P1'] }, async ({ eventPage, page }) => {
      const { seatPicker, form } = eventPage;
      const people = buildAttendees(2);
      await eventPage.signUp(people);
      await expect(seatPicker.title).toHaveText(UiMessages.eventFullTitle);

      await close(seatPicker.cancelButton, page);

      await expect(seatPicker.dialog).toBeHidden();
      await expect(eventPage.statusMessage).toBeHidden(); // no message shown
      await expect(eventPage.waitlist.heading).toHaveText(UiMessages.waitlistHeading(0));
      await expect(eventPage.waitlistEmptyMessage).toBeVisible();
      await expect(eventPage.confirmed.rows).toHaveCount(CAPACITY);
      await expect(form.rows).toHaveCount(people.length);
    });
  }

  test('UI-018: Should display "Signed up 2 people: 0 confirmed, 2 waitlisted." when everyone goes on the waitlist', { tag: ['@P2'] }, async ({ eventPage }) => {
    const people = buildAttendees(2);

    await eventPage.signUp(people);
    await eventPage.seatPicker.addSelectedToWaitlistButton.click();

    await expectSuccessMessage(eventPage, UiMessages.signedUp(0, people.length));
  });
});
