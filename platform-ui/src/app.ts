import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import type { AuthService } from './classes/AuthService.js';
import type { SignupService } from './classes/SignupService.js';
import { requireAuth } from './middleware/requireAuth.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createDemoRouter } from './routes/demo.routes.js';
import { createEventsRouter } from './routes/events.routes.js';
import { createHealthRouter } from './routes/health.routes.js';
import { createTestingRouter } from './routes/testing.routes.js';

const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));

export interface AppOptions {
  service: SignupService;
  auth: AuthService;
  enableTestRoutes: boolean;
}

/** Builds the Express app without starting it, so the setup is easy to read in one place. */
export function createApp({ service, auth, enableTestRoutes }: AppOptions): express.Express {
  const app = express();

  /**
      Security headers on every response (Content-Security-Policy, X-Content-Type-Options, ...).
      upgrade-insecure-requests is turned off because the app runs over plain http on localhost.
  */
  app.use(helmet({ contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } } }));
  app.use(express.json());

  /** Public: health check and logging in/out. Everything about the event needs a logged-in user. */
  app.use('/api/health', createHealthRouter());
  app.use('/api/auth', createAuthRouter(auth));
  app.use('/api/events', requireAuth(auth), createEventsRouter(service));
  app.use('/api/demo', requireAuth(auth), createDemoRouter(service));
  if (enableTestRoutes) app.use('/api/testing', createTestingRouter(service));
  app.use('/api', apiNotFound);

  /** The front end: index.html, styles.css and the compiled browser code in public/js. */
  app.use(express.static(PUBLIC_DIR));

  app.use(errorHandler);
  return app;
}
