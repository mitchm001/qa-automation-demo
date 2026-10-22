import { EVENT_ID, type AttendeeField } from '../helpers/testData';

/** What a test expects back from a failing API request. Leave out message/fieldErrors to skip checking them. */
export interface ExpectedApiError {
  status: number;
  code: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

/** The key the API uses for a field error: fieldPath(2, 'email') is "attendees[2].email"; fieldPath(0) is "attendees[0]". */
export function fieldPath(index: number, field?: AttendeeField): string {
  return field ? `attendees[${index}].${field}` : `attendees[${index}]`;
}

/**
    One source of truth for every error the API returns: status code, error code and message.
    Tests pass these to expectApiError(response, ApiErrors.eventNotFound(999)).
*/
export class ApiErrors {
  /** 404 with any message, when the exact wording isn't what the test is about. */
  static readonly notFound: ExpectedApiError = { status: 404, code: 'NOT_FOUND' };

  static eventNotFound(eventId: number | string): ExpectedApiError {
    return { status: 404, code: 'NOT_FOUND', message: `Event ${eventId} was not found.` };
  }

  /** Pass eventId: null when the sign-up id itself isn't a valid number (the message then doesn't mention the event). */
  static signupNotFound(signupId: number | string, eventId: number | null = EVENT_ID): ExpectedApiError {
    const suffix = eventId === null ? '' : ` for event ${eventId}`;
    return { status: 404, code: 'NOT_FOUND', message: `Sign-up ${signupId} was not found${suffix}.` };
  }

  static noApiRoute(method: string, path: string): ExpectedApiError {
    return { status: 404, code: 'NOT_FOUND', message: `No API route for ${method} ${path}.` };
  }

  static readonly notJson: ExpectedApiError = {
    status: 415,
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'Request body must be JSON (Content-Type: application/json).',
  };

  static readonly malformedJson: ExpectedApiError = { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON.' };

  /** 401 for any event request without a valid session. */
  static readonly unauthorized: ExpectedApiError = { status: 401, code: 'UNAUTHORIZED', message: 'You need to log in.' };

  /** 401 for a wrong username or password (same message for both). */
  static readonly invalidCredentials: ExpectedApiError = { status: 401, code: 'INVALID_CREDENTIALS', message: 'Username or password is incorrect.' };

  static readonly payloadTooLarge: ExpectedApiError = { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' };

  /** 400 "Some fields are not valid." with the exact field errors, e.g. { [fieldPath(0, 'email')]: FieldMessages.emailInvalid } */
  static validation(fieldErrors?: Record<string, string>): ExpectedApiError {
    return { status: 400, code: 'VALIDATION_ERROR', message: 'Some fields are not valid.', fieldErrors };
  }

  /** 409 when one or more emails are already signed up for the event. */
  static duplicateEmail(fieldErrors?: Record<string, string>): ExpectedApiError {
    return { status: 409, code: 'DUPLICATE_EMAIL', message: 'One or more people are already signed up for this event.', fieldErrors };
  }
}
