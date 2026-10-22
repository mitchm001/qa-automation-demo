import { requireElement } from '../helpers/dom.helpers.js';

export interface ConfirmOptions {
  title: string;
  /** Optional extra line under the title. */
  message?: string;
  confirmLabel: string;
}

/**
    A yes/no pop-up for destructive actions, with the red warning icon.
    Cancel comes first, so it's the button that gets focus when the pop-up opens:
    pressing Enter by accident doesn't delete anything.
*/
export class ConfirmDialog {
  private readonly title = requireElement<HTMLElement>('#confirm-dialog-title');
  private readonly message = requireElement<HTMLElement>('#confirm-dialog-message');
  private readonly confirmButton = requireElement<HTMLButtonElement>('#confirm-dialog-confirm');
  private readonly cancelButton = requireElement<HTMLButtonElement>('#confirm-dialog-cancel');

  constructor(private readonly dialog: HTMLDialogElement) {}

  /** Resolves true if the user confirmed, false if they cancelled (button or Escape). */
  open({ title, message, confirmLabel }: ConfirmOptions): Promise<boolean> {
    this.title.textContent = title;
    this.message.textContent = message ?? '';
    this.message.hidden = !message;
    this.confirmButton.textContent = confirmLabel;
    this.dialog.showModal();

    return new Promise((resolve) => {
      const finish = (confirmed: boolean) => {
        this.confirmButton.onclick = this.cancelButton.onclick = null;
        this.dialog.onclose = null;
        this.dialog.close();
        resolve(confirmed);
      };
      this.confirmButton.onclick = () => finish(true);
      this.cancelButton.onclick = () => finish(false);
      this.dialog.onclose = () => finish(false); /** e.g. the Escape key */
    });
  }
}
