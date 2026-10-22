import { Router } from 'express';
import type { SignupService } from '../classes/SignupService.js';

/**
    Demo routes used by the page itself (the "Reset UI" button).
    Unlike /api/testing/*, these are always on, so anyone using the app can reset it.
    Revisit before hosting a public demo.
*/
export function createDemoRouter(service: SignupService): Router {
  const router = Router();

  /** POST /api/demo/reset: put the Confirmed list and waitlist back to the original 21 people */
  router.post('/reset', async (_req, res) => {
    await service.reset();
    res.json({ status: 'reset' });
  });

  return router;
}
