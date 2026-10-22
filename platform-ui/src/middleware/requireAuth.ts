import type { NextFunction, Request, Response } from 'express';
import type { AuthService } from '../classes/AuthService.js';
import { UnauthorizedError } from '../classes/HttpError.js';
import { SESSION_COOKIE } from '../constants/auth.constants.js';
import { parseCookies } from '../helpers/cookie.helpers.js';

/** Lets the request through only with a valid session cookie; otherwise 401. The username is kept in res.locals. */
export function requireAuth(auth: AuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const username = auth.currentUser(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
    if (!username) throw new UnauthorizedError();
    res.locals.username = username;
    next();
  };
}
