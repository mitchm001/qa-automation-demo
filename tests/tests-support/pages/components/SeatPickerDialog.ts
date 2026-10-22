import type { Locator, Page } from '@playwright/test';
import { fullName, type Attendee } from '../../helpers/testData';

/**
    The pop-up shown when more people are entered than there are seats.
    Title is "Only N seats left" (some seats) or "This event is full" (none).
*/
export class SeatPickerDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly cautionIcon: Locator;
  readonly counter: Locator;
  readonly selectAll: Locator;
  readonly personCheckboxes: Locator;

  // "Only N seats left" mode
  readonly seatAndWaitlistRestButton: Locator;
  readonly seatAndDropRestButton: Locator;
  // "This event is full" mode
  readonly addSelectedToWaitlistButton: Locator;

  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.dialog = page.locator('dialog#seat-picker');
    this.title = this.dialog.getByRole('heading');
    this.description = this.dialog.locator('#seat-picker-description');
    this.cautionIcon = this.dialog.locator('#seat-picker-icon');
    this.counter = this.dialog.locator('#seat-picker-counter');
    this.selectAll = this.dialog.getByRole('checkbox', { name: 'Select all' });
    this.personCheckboxes = this.dialog.locator('#seat-picker-list').getByRole('checkbox');
    this.seatAndWaitlistRestButton = this.dialog.getByRole('button', { name: 'Seat selected, waitlist the rest' });
    this.seatAndDropRestButton = this.dialog.getByRole('button', { name: "Seat selected, don't add the rest" });
    this.addSelectedToWaitlistButton = this.dialog.getByRole('button', { name: 'Add selected to the waitlist' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  /** The checkbox for one person. Its label is "First Last (email)". */
  checkboxFor(person: Attendee): Locator {
    return this.dialog.getByRole('checkbox', { name: `${fullName(person)} (${person.email})` });
  }

  async select(people: Attendee[]): Promise<void> {
    for (const person of people) await this.checkboxFor(person).check();
  }

  async deselect(people: Attendee[]): Promise<void> {
    for (const person of people) await this.checkboxFor(person).uncheck();
  }
}
