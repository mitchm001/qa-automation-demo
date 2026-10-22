import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE } from '../helpers/auth';
import { DEMO_USER } from '../helpers/testData';
import { LoginPage } from '../pages/LoginPage';

/** Runs once before the other projects: logs in through the login page and saves the session to AUTH_FILE. */
setup('Should log in as the demo user and save the session', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.logIn(DEMO_USER);

  await expect(page).toHaveURL('/');
  await page.context().storageState({ path: AUTH_FILE });
});
