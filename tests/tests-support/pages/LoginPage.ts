import { expect, type Locator, type Page } from '@playwright/test';

/** The login page (/login.html). */
export class LoginPage {
  readonly heading: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;
  readonly usernameError: Locator;
  readonly passwordError: Locator;
  readonly formError: Locator;
  readonly demoHint: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Log in' });
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Log in' });
    this.usernameError = page.locator('[data-error-for="username"]');
    this.passwordError = page.locator('[data-error-for="password"]');
    this.formError = page.locator('#login-error');
    this.demoHint = page.locator('.demo-hint');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login.html');
    await expect(this.heading).toBeVisible();
  }

  async logIn(credentials: { username: string; password: string }): Promise<void> {
    await this.username.fill(credentials.username);
    await this.password.fill(credentials.password);
    await this.submitButton.click();
  }
}
