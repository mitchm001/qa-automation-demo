import { EMAIL_PATTERN, EMOJI_PATTERN, MESSAGES } from '../constants/validation.constants.js';
import type { AttendeeInput } from '../types.js';

export type AttendeeErrors = Partial<Record<keyof AttendeeInput, string>>;

/** Checks one person's fields. Returns an empty object when everything is fine. */
export function validateAttendee(person: AttendeeInput): AttendeeErrors {
  const errors: AttendeeErrors = {};
  const email = person.email.trim();

  if (person.firstName.trim() === '') errors.firstName = MESSAGES.firstNameRequired;
  else if (EMOJI_PATTERN.test(person.firstName)) errors.firstName = MESSAGES.firstNameEmoji;
  if (person.lastName.trim() === '') errors.lastName = MESSAGES.lastNameRequired;
  else if (EMOJI_PATTERN.test(person.lastName)) errors.lastName = MESSAGES.lastNameEmoji;
  if (email === '') errors.email = MESSAGES.emailRequired;
  else if (EMOJI_PATTERN.test(email)) errors.email = MESSAGES.emailEmoji;
  else if (!EMAIL_PATTERN.test(email)) errors.email = MESSAGES.emailInvalid;

  return errors;
}
