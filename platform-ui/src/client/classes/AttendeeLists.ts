import { el, fullName, requireElement } from '../helpers/dom.helpers.js';
import type { EventSummary, Signup } from '../types.js';

/** Renders the seat count, the confirmed list and the waitlist. */
export class AttendeeLists {
  private readonly eventName = requireElement<HTMLElement>('#event-name');
  private readonly seatSummary = requireElement<HTMLElement>('#seat-summary');
  private readonly seatProgress = requireElement<HTMLProgressElement>('#seat-progress');
  private readonly confirmedHeading = requireElement<HTMLElement>('#confirmed-heading');
  private readonly confirmedBody = requireElement<HTMLElement>('#confirmed-list');
  private readonly waitlistHeading = requireElement<HTMLElement>('#waitlist-heading');
  private readonly waitlistBody = requireElement<HTMLElement>('#waitlist-list');
  private readonly waitlistEmpty = requireElement<HTMLElement>('#waitlist-empty');
  private readonly waitlistTable = requireElement<HTMLElement>('#waitlist-table');
  private readonly clearWaitlistButton = requireElement<HTMLButtonElement>('#clear-waitlist');
  private readonly removeAllConfirmedButton = requireElement<HTMLButtonElement>('#remove-all-confirmed');

  constructor(
    private readonly onRemove: (signup: Signup) => void,
    onClearWaitlist: () => void,
    onRemoveAllConfirmed: () => void,
  ) {
    this.clearWaitlistButton.addEventListener('click', onClearWaitlist);
    this.removeAllConfirmedButton.addEventListener('click', onRemoveAllConfirmed);
  }

  render(event: EventSummary, signups: Signup[]): void {
    const confirmed = signups.filter((s) => s.status === 'confirmed');
    const waitlisted = signups.filter((s) => s.status === 'waitlisted');

    this.eventName.textContent = event.name;
    this.seatSummary.textContent = `${event.confirmedCount} of ${event.capacity} seats filled`;
    this.seatProgress.max = event.capacity;
    this.seatProgress.value = event.confirmedCount;

    this.confirmedHeading.textContent = `Confirmed (${confirmed.length})`;
    this.confirmedBody.replaceChildren(...confirmed.map((signup, i) => this.row(signup, i + 1)));
    this.removeAllConfirmedButton.hidden = confirmed.length === 0;

    this.waitlistHeading.textContent = `Waitlist (${waitlisted.length})`;
    this.waitlistBody.replaceChildren(...waitlisted.map((signup, i) => this.row(signup, i + 1)));
    this.waitlistTable.hidden = waitlisted.length === 0;
    this.waitlistEmpty.hidden = waitlisted.length > 0;
    this.clearWaitlistButton.hidden = waitlisted.length === 0;
  }

  /** Lets a long email wrap just before the "@" (via <wbr>) instead of mid-word. */
  private emailWithBreak(email: string): Array<Node | string> {
    const at = email.indexOf('@');
    return at > 0 ? [email.slice(0, at), el('wbr'), email.slice(at)] : [email];
  }

  private row(signup: Signup, position: number): HTMLTableRowElement {
    const removeButton = el('button', { type: 'button', class: 'link-button', 'aria-label': `Remove ${fullName(signup)}` }, 'Remove');
    removeButton.addEventListener('click', () => this.onRemove(signup));

    return el(
      'tr',
      {},
      el('td', {}, String(position)),
      el('td', {}, fullName(signup)),
      el('td', { class: 'email-cell' }, ...this.emailWithBreak(signup.email)),
      el('td', {}, removeButton),
    );
  }
}
