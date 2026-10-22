/** Where the setup step saves the demo user's login (cookies), for every test to reuse. Not committed. */
export const AUTH_FILE = 'playwright/.auth/demo-user.json';

/** Use with test.use({ storageState: LOGGED_OUT }) for tests that must start without a session. */
export const LOGGED_OUT = { cookies: [], origins: [] };
