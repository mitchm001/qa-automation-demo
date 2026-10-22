import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { AuthService } from './classes/AuthService.js';
import { SessionStore } from './classes/SessionStore.js';
import { SignupService } from './classes/SignupService.js';
import { DEFAULT_DEMO_PASSWORD, DEFAULT_DEMO_USERNAME, SESSION_TTL_MS } from './constants/auth.constants.js';
import { SqliteEventStore } from './storage/SqliteEventStore.js';

const PORT = Number(process.env.PORT ?? 3000);
const DB_FILE = process.env.DB_FILE ?? fileURLToPath(new URL('../data/app.db', import.meta.url));
const ENABLE_TEST_ROUTES = process.env.ENABLE_TEST_ROUTES === 'true';
const DEMO_USER = {
  username: process.env.DEMO_USERNAME ?? DEFAULT_DEMO_USERNAME,
  password: process.env.DEMO_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
};

const store = new SqliteEventStore(DB_FILE);
await store.init();

const service = new SignupService(store);
await service.seedIfEmpty();

const auth = await AuthService.create(DEMO_USER, new SessionStore(SESSION_TTL_MS));

const app = createApp({ service, auth, enableTestRoutes: ENABLE_TEST_ROUTES });
app.listen(PORT, () => {
  console.log(`Event sign-up app running at http://localhost:${PORT}`);
  if (ENABLE_TEST_ROUTES) console.log('Test routes enabled: POST /api/testing/reset');
});
