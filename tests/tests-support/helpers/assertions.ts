import { expect } from '@playwright/test';
import type { EventPage } from '../pages/EventPage';

/** The success banner's colours from styles.css (--success-bg / --success-text). */
const SUCCESS_BACKGROUND = 'rgb(231, 246, 236)';
const SUCCESS_TEXT = 'rgb(20, 108, 46)';

/** The error banner's colours from styles.css (--error-bg / --danger). */
const ERROR_BACKGROUND = 'rgb(253, 236, 234)';
const ERROR_TEXT = 'rgb(180, 35, 24)';

/** The status banner shows exactly this text, styled as a green success message. */
export async function expectSuccessMessage(eventPage: EventPage, text: string): Promise<void> {
  const banner = eventPage.statusMessage;
  await expect(banner).toHaveText(text);
  await expect(banner).toHaveAttribute('data-kind', 'success');
  await expect(banner).toHaveCSS('background-color', SUCCESS_BACKGROUND);
  await expect(banner).toHaveCSS('color', SUCCESS_TEXT);
}

/** The status banner shows exactly this text, styled as a red error message. */
export async function expectErrorMessage(eventPage: EventPage, text: string): Promise<void> {
  const banner = eventPage.statusMessage;
  await expect(banner).toHaveText(text);
  await expect(banner).toHaveAttribute('data-kind', 'error');
  await expect(banner).toHaveCSS('background-color', ERROR_BACKGROUND);
  await expect(banner).toHaveCSS('color', ERROR_TEXT);
}
