import { expect, type Locator, type Page } from '@playwright/test';
import type { Attendee } from '../helpers/testData';
import { AttendeeTable } from './components/AttendeeTable';
import { ConfirmDialog } from './components/ConfirmDialog';
import { SeatPickerDialog } from './components/SeatPickerDialog';
import { SignupForm } from './components/SignupForm';

/** The app's single page, made up of smaller component objects. */
export class EventPage {
  readonly eventName: Locator;
  readonly seatSummary: Locator;
  readonly seatProgress: Locator;
  readonly statusMessage: Locator;
  readonly clearWaitlistButton: Locator;
  readonly removeAllConfirmedButton: Locator;
  readonly resetUiButton: Locator;
  readonly signedInAs: Locator;
  readonly logOutButton: Locator;
  readonly aboutButton: Locator;
  readonly aboutDialog: Locator;
  readonly resetUiInfoIcon: Locator;
  readonly resetUiTooltip: Locator;
  readonly waitlistEmptyMessage: Locator;

  readonly form: SignupForm;
  readonly seatPicker: SeatPickerDialog;
  readonly confirmDialog: ConfirmDialog;
  readonly confirmed: AttendeeTable;
  readonly waitlist: AttendeeTable;

  constructor(readonly page: Page) {
    this.eventName = page.getByRole('heading', { level: 1 });
    this.seatSummary = page.locator('#seat-summary');
    this.seatProgress = page.getByRole('progressbar');
    this.statusMessage = page.getByRole('status');
    this.clearWaitlistButton = page.getByRole('button', { name: 'Clear waitlist' });
    this.removeAllConfirmedButton = page
      .getByRole('region', { name: /^Confirmed/ })
      .getByRole('button', { name: 'Remove all', exact: true });
    this.waitlistEmptyMessage = page.getByText('Nobody is on the waitlist.');
    this.signedInAs = page.locator('#signed-in-as');
    this.logOutButton = page.getByRole('button', { name: 'Log out' });
    this.aboutButton = page.getByRole('button', { name: 'About this project' });
    this.aboutDialog = page.locator('dialog#about-dialog');
    this.resetUiButton = page.getByRole('button', { name: 'Reset UI', exact: true });
    this.resetUiInfoIcon = page.getByRole('button', { name: 'About Reset UI' });
    this.resetUiTooltip = page.locator('#reset-ui-tip');

    this.form = new SignupForm(page);
    this.seatPicker = new SeatPickerDialog(page);
    this.confirmDialog = new ConfirmDialog(page);
    this.confirmed = new AttendeeTable(page, 'Confirmed');
    this.waitlist = new AttendeeTable(page, 'Waitlist');
  }

  /** Opens the page and waits until the event data has loaded. */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.seatSummary).toHaveText(/\d+ of \d+ seats filled/);
  }

  /** Fills the form with these people and clicks Sign up (the seat picker may open). */
  async signUp(attendees: Attendee[]): Promise<void> {
    await this.form.fillPeople(attendees);
    await this.form.submit();
  }
}
