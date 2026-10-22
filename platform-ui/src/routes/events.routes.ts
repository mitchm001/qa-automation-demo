import { Router } from 'express';
import { NotFoundError, ValidationError } from '../classes/HttpError.js';
import type { SignupService } from '../classes/SignupService.js';
import { HTTP_STATUS } from '../constants/http.constants.js';
import { parseId } from '../helpers/params.helpers.js';
import { validateSignupRequest } from '../helpers/validation.helpers.js';
import { requireJson } from '../middleware/requireJson.js';

/**
    Routes are kept thin: read the request, call the service, send the response.
    The rules themselves live in SignupService.
*/
export function createEventsRouter(service: SignupService): Router {
  const router = Router();

  function eventIdFrom(raw: unknown): number {
    const id = parseId(raw);
    if (id === null) throw new NotFoundError(`Event ${String(raw)} was not found.`);
    return id;
  }

  function signupIdFrom(raw: unknown): number {
    const id = parseId(raw);
    if (id === null) throw new NotFoundError(`Sign-up ${String(raw)} was not found.`);
    return id;
  }

  /** GET /api/events: every event with its seat counts */
  router.get('/', async (_req, res) => {
    res.json(await service.listEvents());
  });

  /** GET /api/events/:eventId: one event with its seat counts */
  router.get('/:eventId', async (req, res) => {
    res.json(await service.getEvent(eventIdFrom(req.params.eventId)));
  });

  /** GET /api/events/:eventId/signups: everyone signed up, in arrival order */
  router.get('/:eventId/signups', async (req, res) => {
    res.json(await service.listSignups(eventIdFrom(req.params.eventId)));
  });

  /** POST /api/events/:eventId/signups: sign up 1-25 people at once */
  router.post('/:eventId/signups', requireJson, async (req, res) => {
    const eventId = eventIdFrom(req.params.eventId);
    const validation = validateSignupRequest(req.body);
    if (!validation.ok) throw new ValidationError(validation.fieldErrors);

    const result = await service.signUp(eventId, validation.value);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  /** GET /api/events/:eventId/signups/:signupId: one sign-up */
  router.get('/:eventId/signups/:signupId', async (req, res) => {
    res.json(await service.getSignup(eventIdFrom(req.params.eventId), signupIdFrom(req.params.signupId)));
  });

  /** DELETE /api/events/:eventId/signups/:signupId: remove one person (may promote someone from the waitlist) */
  router.delete('/:eventId/signups/:signupId', async (req, res) => {
    res.json(await service.removeSignup(eventIdFrom(req.params.eventId), signupIdFrom(req.params.signupId)));
  });

  /** DELETE /api/events/:eventId/confirmed: remove everyone confirmed (the waitlist then fills the seats) */
  router.delete('/:eventId/confirmed', async (req, res) => {
    res.json(await service.clearConfirmed(eventIdFrom(req.params.eventId)));
  });

  /** DELETE /api/events/:eventId/waitlist: remove everyone on the waitlist */
  router.delete('/:eventId/waitlist', async (req, res) => {
    res.json(await service.clearWaitlist(eventIdFrom(req.params.eventId)));
  });

  return router;
}
