import { ATTENDEE_FIELDS } from '../constants/ui.constants.js';
import { el } from '../helpers/dom.helpers.js';
import { validateAttendee } from '../helpers/validation.helpers.js';
import type { AttendeeInput, FieldErrors } from '../types.js';

/**
    The sign-up form: one row (First name, Last name, Email) per person,
    with "Add another person" up to the event's capacity.
    Validation happens twice:
    - here in the browser (required fields, email format) for instant feedback, and
    - on the server, which checks everything again. Its errors show next to the matching input too.
    The form uses `novalidate` so the browser's own pop-up bubbles don't replace our messages.
*/
export class SignupForm {
  private maxRows = 1;
  private nextRowKey = 0;

  constructor(
    private readonly form: HTMLFormElement,
    private readonly rowsContainer: HTMLElement,
    private readonly addButton: HTMLButtonElement,
    private readonly formError: HTMLElement,
  ) {
    this.addButton.addEventListener('click', () => {
      this.addRow().querySelector('input')?.focus();
    });
    this.addRow();
  }

  onSubmit(handler: (attendees: AttendeeInput[]) => void): void {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler(this.getAttendees());
    });
  }

  setMaxRows(maxRows: number): void {
    this.maxRows = maxRows;
    this.refreshRows();
  }

  getAttendees(): AttendeeInput[] {
    return this.rows().map((row) => ({
      firstName: this.input(row, 'firstName').value,
      lastName: this.input(row, 'lastName').value,
      email: this.input(row, 'email').value,
    }));
  }

  /**
      Checks every row (required fields, email format) and shows any errors inline.
      Returns true when the form is ready to send.
  */
  validate(): boolean {
    let valid = true;
    this.rows().forEach((row, index) => {
      const errors = validateAttendee(this.getAttendees()[index]);
      for (const [field, message] of Object.entries(errors)) {
        this.setFieldError(row, field, message);
        valid = false;
      }
    });
    this.focusFirstError();
    return valid;
  }

  /**
      Shows server field errors such as { "attendees[2].email": "..." }.
      `rowForIndex[i]` says which form row the i-th person sent to the API came from,
      because the seat picker may have changed the order.
  */
  showFieldErrors(fieldErrors: FieldErrors, rowForIndex: number[]): void {
    const rows = this.rows();
    for (const [path, message] of Object.entries(fieldErrors)) {
      const match = /^attendees\[(\d+)\]\.(\w+)$/.exec(path);
      const row = match ? rows[rowForIndex[Number(match[1])]] : undefined;
      if (!match || !row) {
        this.showFormError(message);
        continue;
      }
      this.setFieldError(row, match[2], message);
    }
    this.focusFirstError();
  }

  showFormError(message: string): void {
    this.formError.textContent = message;
  }

  clearErrors(): void {
    this.formError.textContent = '';
    this.form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
    this.form.querySelectorAll('[data-error-for]').forEach((span) => (span.textContent = ''));
  }

  private setFieldError(row: HTMLElement, field: string, message: string): void {
    this.input(row, field).setAttribute('aria-invalid', 'true');
    const errorText = row.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    if (errorText) errorText.textContent = message;
  }

  private clearFieldError(row: HTMLElement, field: string): void {
    this.input(row, field).removeAttribute('aria-invalid');
    const errorText = row.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    if (errorText) errorText.textContent = '';
  }

  private focusFirstError(): void {
    this.form.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  }

  /** Back to a single empty row. */
  reset(): void {
    this.rowsContainer.replaceChildren();
    this.clearErrors();
    this.addRow();
  }

  private addRow(): HTMLFieldSetElement {
    const key = this.nextRowKey++;
    const legend = el('legend');
    const removeButton = el('button', { type: 'button', class: 'link-button' }, 'Remove');
    const row = el('fieldset', { class: 'attendee-row' }, legend);

    for (const field of ATTENDEE_FIELDS) {
      const id = `attendee-${key}-${field.key}`;
      const input = el('input', {
        id,
        name: field.key,
        type: field.type,
        autocomplete: field.autocomplete,
        'aria-required': 'true',
        'aria-describedby': `${id}-error`,
      });
      /** Once the user starts fixing a field, its old error message goes away. */
      input.addEventListener('input', () => this.clearFieldError(row, field.key));

      row.append(
        el(
          'div',
          { class: 'field' },
          el('label', { for: id }, field.label),
          input,
          el('span', { id: `${id}-error`, class: 'field-error', 'data-error-for': field.key }),
        ),
      );
    }

    row.append(removeButton);
    removeButton.addEventListener('click', () => {
      row.remove();
      this.refreshRows();
      this.addButton.focus();
    });

    this.rowsContainer.append(row);
    this.refreshRows();
    return row;
  }

  /** Renumbers the rows and enables/disables the add and remove buttons. */
  private refreshRows(): void {
    const rows = this.rows();
    rows.forEach((row, index) => {
      row.querySelector('legend')!.textContent = `Person ${index + 1}`;
      const removeButton = row.querySelector<HTMLButtonElement>('.link-button')!;
      removeButton.hidden = rows.length === 1;
      removeButton.setAttribute('aria-label', `Remove person ${index + 1}`);
    });
    this.addButton.disabled = rows.length >= this.maxRows;
  }

  private rows(): HTMLFieldSetElement[] {
    return Array.from(this.rowsContainer.querySelectorAll<HTMLFieldSetElement>('.attendee-row'));
  }

  private input(row: HTMLElement, name: string): HTMLInputElement {
    return row.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
  }
}
