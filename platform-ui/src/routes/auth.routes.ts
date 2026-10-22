import { Router, type CookieOptions } from 'express';
import type { AuthService } from '../classes/AuthService.js';
import { UnauthorizedError, ValidationError } from '../classes/HttpError.js';
import { SESSION_COOKIE, SESSION_TTL_MS } from '../constants/auth.constants.js';
import { parseCookies } from '../helpers/cookie.helpers.js';
import { requireJson } from '../middleware/requireJson.js';
import type { FieldErrors } from '../types/event.types.js';

/**
    httpOnly: page scripts can't read the cookie, so injected JavaScript can't steal the session.
    sameSite 'lax': the browser doesn't send it on requests started by other sites (protects against CSRF).
    secure: only sent over https in production; local testing runs on plain http.
*/
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_MS,
};

export function createAuthRouter(auth: AuthService): Router {
  const router = Router();

  /** POST /api/auth/login: { username, password } -> sets the session cookie */
  router.post('/login', requireJson, async (req, res) => {
    const { username, password } = req.body ?? {};
    const fieldErrors: FieldErrors = {};
    if (typeof username !== 'string' || username.trim() === '') fieldErrors.username = 'Username is required.';
    if (typeof password !== 'string' || password === '') fieldErrors.password = 'Password is required.';
    if (Object.keys(fieldErrors).length > 0) throw new ValidationError(fieldErrors);

    const sessionId = await auth.logIn(username.trim(), password);
    res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
    res.json({ username: username.trim() });
  });

  /** POST /api/auth/logout: ends the session on the server and clears the cookie */
  router.post('/logout', (req, res) => {
    auth.logOut(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, { ...COOKIE_OPTIONS, maxAge: undefined });
    res.json({ status: 'logged-out' });
  });

  /** GET /api/auth/me: who is logged in (the page checks this on load) */
  router.get('/me', (req, res) => {
    const username = auth.currentUser(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
    if (!username) throw new UnauthorizedError();
    res.json({ username });
  });

  return router;
}
