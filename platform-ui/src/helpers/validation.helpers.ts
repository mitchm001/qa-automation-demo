import { MAX_ATTENDEES_PER_REQUEST } from '../constants/event.constants.js';
import { EMAIL_MAX_LENGTH, EMAIL_PATTERN, EMOJI_PATTERN, NAME_MAX_LENGTH } from '../constants/validation.constants.js';
import type { Attendee, FieldErrors } from '../types/event.types.js';

/**
    Pure functions: no database, no Express. They take input and return a result,
    which makes them easy to unit test with boundary values.
*/

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; fieldErrors: FieldErrors };

/** Emails are compared lowercase, so "Ada@Example.com" and "ada@example.com" count as the same person. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Returns an error message, or null if the name is fine. */
export function validateName(value: unknown, label: string): string | null {
  if (typeof value !== 'string') return `${label} is required.`;
  const trimmed = value.trim();
  if (trimmed.length === 0) return `${label} is required.`;
  if (EMOJI_PATTERN.test(trimmed)) return `${label} can't contain emoji.`;
  if (trimmed.length > NAME_MAX_LENGTH) return `${label} must be ${NAME_MAX_LENGTH} characters or fewer.`;
  return null;
}

/** Returns an error message, or null if the email is fine. */
export function validateEmail(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return 'Email is required.';
  const trimmed = value.trim();
  if (EMOJI_PATTERN.test(trimmed)) return "Email can't contain emoji.";
  if (trimmed.length > EMAIL_MAX_LENGTH) return `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`;
  if (!EMAIL_PATTERN.test(trimmed)) return 'Email is not valid.';
  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
    Validates a POST /signups body: { attendees: [{ firstName, lastName, email }, ...] }.
    Only the three known fields are copied out, so extra fields (like "role": "admin") are ignored.
*/
export function validateSignupRequest(body: unknown): ValidationResult<Attendee[]> {
  const fieldErrors: FieldErrors = {};

  if (!isPlainObject(body) || !Array.isArray(body.attendees)) {
    return { ok: false, fieldErrors: { attendees: 'attendees must be a list of people.' } };
  }

  const list = body.attendees;
  if (list.length === 0 || list.length > MAX_ATTENDEES_PER_REQUEST) {
    return {
      ok: false,
      fieldErrors: { attendees: `Add between 1 and ${MAX_ATTENDEES_PER_REQUEST} people per sign-up.` },
    };
  }

  const attendees: Attendee[] = [];
  const firstIndexByEmail = new Map<string, number>();

  list.forEach((item, index) => {
    const path = `attendees[${index}]`;
    if (!isPlainObject(item)) {
      fieldErrors[path] = 'Each person must be an object with firstName, lastName and email.';
      return;
    }

    const firstNameError = validateName(item.firstName, 'First name');
    const lastNameError = validateName(item.lastName, 'Last name');
    const emailError = validateEmail(item.email);
    if (firstNameError) fieldErrors[`${path}.firstName`] = firstNameError;
    if (lastNameError) fieldErrors[`${path}.lastName`] = lastNameError;
    if (emailError) fieldErrors[`${path}.email`] = emailError;
    if (firstNameError || lastNameError || emailError) return;

    const email = normalizeEmail(item.email as string);
    const firstIndex = firstIndexByEmail.get(email);
    if (firstIndex !== undefined) {
      fieldErrors[`${path}.email`] = `This email is already used by person ${firstIndex + 1} in this list.`;
      return;
    }
    firstIndexByEmail.set(email, index);

    attendees.push({
      firstName: (item.firstName as string).trim(),
      lastName: (item.lastName as string).trim(),
      email,
    });
  });

  return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: true, value: attendees };
}
