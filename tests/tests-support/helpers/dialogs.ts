import type { Locator, Page } from '@playwright/test';

/**
    The two ways to dismiss a pop-up without choosing anything.
    Loop over these to run the same "nothing changed" test for each.
*/
export const CLOSE_METHODS: Array<{ method: string; close: (cancelButton: Locator, page: Page) => Promise<void> }> = [
  { method: 'the Cancel button', close: (cancelButton) => cancelButton.click() },
  { method: 'the Escape key', close: (_cancelButton, page) => page.keyboard.press('Escape') },
];
