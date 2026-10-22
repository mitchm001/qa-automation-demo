import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../classes/HttpError.js';
import { ERROR_CODE, HTTP_STATUS } from '../constants/http.constants.js';

/** Rejects requests whose body isn't JSON with 415 Unsupported Media Type. */
export function requireJson(req: Request, _res: Response, next: NextFunction): void {
  if (!req.is('application/json')) {
    throw new HttpError(
      HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
      ERROR_CODE.UNSUPPORTED_MEDIA_TYPE,
      'Request body must be JSON (Content-Type: application/json).',
    );
  }
  next();
}
