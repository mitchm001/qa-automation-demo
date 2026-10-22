import { Router } from 'express';
import type { SignupService } from '../classes/SignupService.js';

/**
    Test-only routes. app.ts only mounts these when ENABLE_TEST_ROUTES=true,
    so they never exist in a normal or public run.
*/
export function createTestingRouter(service: SignupService): Router {
  const router = Router();

  /** POST /api/testing/reset: wipe the database and reload the demo data (21 of 25 seats taken) */
  router.post('/reset', async (_req, res) => {
    await service.reset();
    res.json({ status: 'reset' });
  });

  return router;
}
