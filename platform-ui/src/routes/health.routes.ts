import { Router } from 'express';

export function createHealthRouter(): Router {
  const router = Router();

  /** GET /api/health: a quick "is the server up?" check for CI and Playwright's webServer. */
  router.get('/', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}
