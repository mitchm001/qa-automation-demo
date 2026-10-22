import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './tests/tests-support/helpers/auth';

/** The test server gets its own port and database, so it never touches your dev server on :3000. */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({

  // Every API/UI test resets the one shared database, so tests must run one at a time.
  // (Running in parallel would need a separate event per worker; not worth it for v1.)
  workers: 1,
  fullyParallel: false,

  forbidOnly: !!process.env.CI, // a stray test.only fails the CI run instead of silently skipping tests
  retries: process.env.CI ? 1 : 0,

  reporter: [['list'], ['html', { open: process.env.CI ? 'never' : 'always' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // One project per test folder. Tests live under tests/; shared Page Objects and helpers are in tests/tests-support/.
  // 'setup' logs in once and saves the session; every project that talks to the app depends on it and reuses it.
  projects: [
    { name: 'setup', testDir: './tests/tests-support/setup', testMatch: /.*\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'unit', testDir: './tests/tests-unit' },
    { name: 'api', testDir: './tests/tests-api', dependencies: ['setup'], use: { storageState: AUTH_FILE } },
    { name: 'ui', testDir: './tests/tests-ui', dependencies: ['setup'], use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE } },
    { name: 'hybrid', testDir: './tests/tests-hybrid', dependencies: ['setup'], use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE } },
    { name: 'security', testDir: './tests/tests-security', dependencies: ['setup'], use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE } },
    { name: 'auth', testDir: './tests/tests-auth', dependencies: ['setup'], use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE } },
  ],

  // Builds and starts the app before any test runs, then stops it afterwards.
  webServer: {
    command: 'npm run build -w platform-ui && npm start -w platform-ui',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      DB_FILE: 'data/test.db', // relative to platform-ui/
      ENABLE_TEST_ROUTES: 'true', // turns on POST /api/testing/reset
    },
  },
});
