import type { Locator, Page } from '@playwright/test';

/** The yes/no pop-up for destructive actions, e.g. "Remove all" on the Confirmed list. */
export class ConfirmDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly message: Locator;
  readonly cautionIcon: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.dialog = page.locator('dialog#confirm-dialog');
    this.title = this.dialog.getByRole('heading');
    this.message = this.dialog.locator('#confirm-dialog-message');
    this.cautionIcon = this.dialog.locator('.caution-icon');
    this.confirmButton = this.dialog.locator('#confirm-dialog-confirm');
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }
}
