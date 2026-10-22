import type { NextFunction, Request, Response } from 'express';
import { HttpError, NotFoundError } from '../classes/HttpError.js';
import { ERROR_CODE, HTTP_STATUS } from '../constants/http.constants.js';

/** Any /api path that no route matched. */
export function apiNotFound(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`No API route for ${req.method} ${req.originalUrl}.`));
}

/**
    Turns every error into the same JSON shape:
    { "error": { "code": "...", "message": "...", "fieldErrors": { ... } } }
    Express knows this is the error handler because it takes four arguments.
*/
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, fieldErrors: err.fieldErrors } });
    return;
  }

  /** express.json() throws this when the body is malformed JSON, e.g. {"attendees": [ */
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ error: { code: ERROR_CODE.INVALID_JSON, message: 'Request body is not valid JSON.' } });
    return;
  }

  console.error(err);
  res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json({ error: { code: ERROR_CODE.INTERNAL_ERROR, message: 'Something went wrong on the server.' } });
}
