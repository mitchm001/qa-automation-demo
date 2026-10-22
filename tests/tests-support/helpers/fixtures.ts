import { test as base, expect } from '@playwright/test';
import { EventPage } from '../pages/EventPage';
import { AUTH_FILE } from './auth';
import { LoginPage } from '../pages/LoginPage';
import { EventsApi } from './EventsApi';

interface Fixtures {
  /** API client for setup and API tests. */
  eventsApi: EventsApi;
  /** Always logged in, even in LOGGED_OUT tests: for checking data behind the scenes. */
  loggedInApi: EventsApi;
  /** The app page, not yet opened (call eventPage.goto()). */
  eventPage: EventPage;
  /** The login page, not yet opened (call loginPage.goto()). */
  loginPage: LoginPage;
  /** Runs automatically: every test starts from the seeded state (21 of 25 confirmed). */
  cleanDatabase: void;
}

/**
    API and UI specs import `test` and `expect` from here instead of '@playwright/test'.
    Unit specs don't need the server, so they import from '@playwright/test' directly.
*/
export const test = base.extend<Fixtures>({
  /**
      Playwright's own `request` client doesn't pick up the saved login, so this one is built with the same
      storageState as the browser: logged in as the demo user unless a test opts out with LOGGED_OUT.
  */
  request: async ({ playwright, baseURL, storageState }, use) => {
    const request = await playwright.request.newContext({ baseURL, storageState });
    await use(request);
    await request.dispose();
  },

  eventsApi: async ({ request }, use) => {
    await use(new EventsApi(request));
  },

  loggedInApi: async ({ playwright, baseURL }, use) => {
    const request = await playwright.request.newContext({ baseURL, storageState: AUTH_FILE });
    await use(new EventsApi(request));
    await request.dispose();
  },

  eventPage: async ({ page }, use) => {
    await use(new EventPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  cleanDatabase: [
    async ({ eventsApi }, use) => {
      const response = await eventsApi.reset();
      expect(response.status(), 'POST /api/testing/reset should succeed').toBe(200);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
