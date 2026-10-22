import { el, fullName, pluralize, requireElement } from '../helpers/dom.helpers.js';
import type { AttendeeInput } from '../types.js';

export interface SeatChoice {
  /** Positions (in the list passed to open) of the people who get the open seats. */
  seatedIndexes: number[];
  /** Positions of the people who go on the waitlist. Anyone in neither list is dropped. */
  waitlistIndexes: number[];
}

/**
    The pop-up shown when more people are entered than there are open seats. It has two modes:
    - Some seats left: pick exactly as many people as there are open seats (the checkboxes
    lock at that number), then choose whether everyone else is waitlisted or dropped.
    - Event full: every person is listed with a checkbox, all checked by default, plus a
    "Select all" box. Only the checked people are added to the waitlist.
*/
export class SeatPickerDialog {
  private readonly icon = document.querySelector<SVGSVGElement>('#seat-picker-icon')!;
  private readonly title = requireElement<HTMLElement>('#seat-picker-title');
  private readonly description = requireElement<HTMLElement>('#seat-picker-description');
  private readonly selectAllRow = requireElement<HTMLElement>('#seat-picker-select-all-row');
  private readonly selectAll = requireElement<HTMLInputElement>('#seat-picker-select-all');
  private readonly list = requireElement<HTMLElement>('#seat-picker-list');
  private readonly counter = requireElement<HTMLElement>('#seat-picker-counter');
  private readonly waitlistButton = requireElement<HTMLButtonElement>('#seat-picker-waitlist');
  private readonly discardButton = requireElement<HTMLButtonElement>('#seat-picker-discard');
  private readonly cancelButton = requireElement<HTMLButtonElement>('#seat-picker-cancel');

  private seatsAvailable = 0;

  constructor(private readonly dialog: HTMLDialogElement) {
    this.selectAll.addEventListener('change', () => {
      this.checkboxes().forEach((checkbox) => (checkbox.checked = this.selectAll.checked));
      this.updateState();
    });
  }

  /** Resolves with the choice, or null if the dialog was cancelled (button or Escape). */
  open(people: AttendeeInput[], seatsAvailable: number): Promise<SeatChoice | null> {
    this.seatsAvailable = seatsAvailable;
    this.render(people);
    this.dialog.showModal();

    return new Promise((resolve) => {
      const finish = (choice: SeatChoice | null) => {
        this.waitlistButton.onclick = this.discardButton.onclick = this.cancelButton.onclick = null;
        this.dialog.onclose = null;
        this.dialog.close();
        resolve(choice);
      };

      this.waitlistButton.onclick = () => {
        const checked = this.checkedIndexes();
        const unchecked = people.map((_, index) => index).filter((index) => !checked.includes(index));
        /** Event full: the checked people are the waitlist. Seats left: the checked people get seats, the rest wait. */
        finish(this.isFull() ? { seatedIndexes: [], waitlistIndexes: checked } : { seatedIndexes: checked, waitlistIndexes: unchecked });
      };
      this.discardButton.onclick = () => finish({ seatedIndexes: this.checkedIndexes(), waitlistIndexes: [] });
      this.cancelButton.onclick = () => finish(null);
      this.dialog.onclose = () => finish(null); /** e.g. the Escape key */
    });
  }

  private isFull(): boolean {
    return this.seatsAvailable === 0;
  }

  private render(people: AttendeeInput[]): void {
    const full = this.isFull();
    const peopleCount = pluralize(people.length, 'person', 'people');

    this.icon.toggleAttribute('hidden', !full); /** an <svg> has no .hidden property, so set the attribute */
    this.selectAllRow.hidden = !full;
    this.discardButton.hidden = full;

    if (full) {
      this.title.textContent = 'This event is full';
      this.description.textContent = 'There are no open seats.\nSelect the people entered to add to the waitlist.';
      this.waitlistButton.textContent = 'Add selected to the waitlist';
    } else {
      this.title.textContent = `Only ${pluralize(this.seatsAvailable, 'seat')} left`;
      this.description.textContent = `You entered ${peopleCount}. Choose ${this.seatsAvailable} to get a seat, then decide what happens to the rest.`;
      this.waitlistButton.textContent = 'Seat selected, waitlist the rest';
      this.discardButton.textContent = "Seat selected, don't add the rest";
    }

    this.list.replaceChildren(
      ...people.map((person, index) => {
        /** Event full: everyone starts checked, so the default is "add them all to the waitlist". */
        const checkbox = el('input', { type: 'checkbox', id: `seat-pick-${index}`, value: index });
        checkbox.checked = full;
        checkbox.addEventListener('change', () => this.updateState());
        return el('li', {}, checkbox, el('label', { for: `seat-pick-${index}` }, `${fullName(person)} (${person.email})`));
      }),
    );
    this.updateState();
  }

  /** Keeps the counter, the "Select all" box, the seat limit and the buttons in sync with the checkboxes. */
  private updateState(): void {
    const total = this.checkboxes().length;
    const selected = this.checkedIndexes().length;

    if (this.isFull()) {
      this.selectAll.checked = selected === total;
      this.selectAll.indeterminate = selected > 0 && selected < total; /** the "some checked" dash */
      this.counter.textContent = `${selected} of ${total} selected for the waitlist`;
      this.waitlistButton.disabled = selected === 0;
      return;
    }

    const allSeatsAssigned = selected === this.seatsAvailable;
    this.checkboxes().forEach((checkbox) => (checkbox.disabled = !checkbox.checked && allSeatsAssigned));
    this.counter.textContent = `${selected} of ${this.seatsAvailable} seats selected`;
    this.waitlistButton.disabled = !allSeatsAssigned;
    this.discardButton.disabled = !allSeatsAssigned;
  }

  private checkboxes(): HTMLInputElement[] {
    return Array.from(this.list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
  }

  private checkedIndexes(): number[] {
    return this.checkboxes().filter((box) => box.checked).map((box) => Number(box.value));
  }
}
