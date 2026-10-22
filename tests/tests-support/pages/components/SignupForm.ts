import type { Locator, Page } from '@playwright/test';
import type { Attendee, AttendeeField } from '../../helpers/testData';

const LABELS: Record<AttendeeField, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
};

/** The "Sign up" card: one "Person N" group per row, plus Add/Sign up buttons. */
export class SignupForm {
  readonly card: Locator;
  readonly addPersonButton: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.card = page.getByRole('region', { name: 'Sign up' });
    this.addPersonButton = page.getByRole('button', { name: 'Add another person' });
    this.submitButton = page.getByRole('button', { name: 'Sign up', exact: true });
    this.formError = page.locator('#form-error');
    this.rows = page.locator('#attendee-rows fieldset');
  }

  /** The "Person N" group (1-based, as shown on screen). */
  person(n: number): Locator {
    return this.page.getByRole('group', { name: `Person ${n}`, exact: true });
  }

  input(n: number, field: AttendeeField): Locator {
    return this.person(n).getByLabel(LABELS[field]);
  }

  /** The error message under a field, e.g. "Email is not valid." */
  fieldError(n: number, field: AttendeeField): Locator {
    return this.person(n).locator(`[data-error-for="${field}"]`);
  }

  removePersonButton(n: number): Locator {
    return this.person(n).getByRole('button', { name: `Remove person ${n}` });
  }

  async fillPerson(n: number, attendee: Attendee): Promise<void> {
    await this.input(n, 'firstName').fill(attendee.firstName);
    await this.input(n, 'lastName').fill(attendee.lastName);
    await this.input(n, 'email').fill(attendee.email);
  }

  /** Fills one row per person, clicking "Add another person" as needed. */
  async fillPeople(attendees: Attendee[]): Promise<void> {
    for (const [index, attendee] of attendees.entries()) {
      if (index > 0) await this.addPersonButton.click();
      await this.fillPerson(index + 1, attendee);
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
