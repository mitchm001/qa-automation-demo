import { EVENT_ID, SEEDED_PERSON, type AttendeeField } from '../tests-support/helpers/testData';

/** Required fields: one case per field, each with its own test case ID (UI-003 to UI-005) */
export const REQUIRED_FIELD_CASES: Array<{ id: string; field: AttendeeField }> = [
  { id: 'UI-003', field: 'firstName' },
  { id: 'UI-004', field: 'lastName' },
  { id: 'UI-005', field: 'email' },
];
export const ALL_FIELDS: AttendeeField[] = ['firstName', 'lastName', 'email'];

/** Badly formed emails the form rejects (UI-006) */
export const INVALID_EMAILS = ['jane', 'jane@', 'jane@example', 'jane doe@example.com', '@example.com'];

/** One emoji per field (UI-045) */
export const EMOJI_FIELD_CASES: Array<{ field: AttendeeField; emoji: string }> = [
  { field: 'firstName', emoji: '😀' },
  { field: 'lastName', emoji: '👍🏽' },
  { field: 'email', emoji: '🇺🇸' },
];

/** The seeded person's email, written two ways (UI-011) */
export const DUPLICATE_EMAIL_CASES = [
  { label: 'same email', email: SEEDED_PERSON.email },
  { label: 'same email in different capitals', email: SEEDED_PERSON.email.toUpperCase() },
];

/** How a disabled button looks (UI-034) */
export const GREYED_OUT_OPACITY = '0.5';

/** Requests to intercept when simulating an unreachable server (UI-038, UI-039) */
export const SIGNUP_REQUESTS = '**/api/events/*/signups';
export const EVENT_REQUEST = `**/api/events/${EVENT_ID}`;
