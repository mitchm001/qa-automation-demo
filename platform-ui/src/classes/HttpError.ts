import { ERROR_CODE, HTTP_STATUS } from '../constants/http.constants.js';
import type { FieldErrors } from '../types/event.types.js';

/**
    An error that already knows which HTTP response it should become.
    Route code throws these; the error-handler middleware turns them into JSON.
*/
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends HttpError {
  constructor(fieldErrors: FieldErrors) {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODE.VALIDATION_ERROR, 'Some fields are not valid.', fieldErrors);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(HTTP_STATUS.NOT_FOUND, ERROR_CODE.NOT_FOUND, message);
  }
}

export class DuplicateEmailError extends HttpError {
  constructor(fieldErrors: FieldErrors) {
    super(HTTP_STATUS.CONFLICT, ERROR_CODE.DUPLICATE_EMAIL, 'One or more people are already signed up for this event.', fieldErrors);
  }
}

/** No valid session: the request needs a logged-in user. */
export class UnauthorizedError extends HttpError {
  constructor() {
    super(HTTP_STATUS.UNAUTHORIZED, ERROR_CODE.UNAUTHORIZED, 'You need to log in.');
  }
}

/** Wrong username or password. Same message for both, so the response doesn't reveal which usernames exist. */
export class InvalidCredentialsError extends HttpError {
  constructor() {
    super(HTTP_STATUS.UNAUTHORIZED, ERROR_CODE.INVALID_CREDENTIALS, 'Username or password is incorrect.');
  }
}

