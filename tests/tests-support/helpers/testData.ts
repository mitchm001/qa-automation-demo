/**
    Test data and the known starting state after POST /api/testing/reset.
    These numbers are written out on purpose instead of imported from the app:
    a test that reads its expected values from the code under test can't catch
    a wrong value in that code.
*/

export const EVENT_ID = 1;
export const EVENT_NAME = 'QA Automation Meetup';
export const CAPACITY = 25;
export const SEEDED_CONFIRMED = 21;
export const SEATS_LEFT_AFTER_RESET = CAPACITY - SEEDED_CONFIRMED; // 4

/** Most "Person" rows the form allows, and most people per sign-up request. */
export const MAX_PEOPLE_PER_SIGNUP = 5;

export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 254;

/** The demo account (DEMO_USERNAME / DEMO_PASSWORD defaults in the app). */
export const DEMO_USER = { username: 'demo', password: 'demo1234' };

/** Ids that never exist, for "not found" tests. */
export const MISSING_EVENT_ID = 999;
export const MISSING_SIGNUP_ID = 9999;

/** An email the app rejects as badly formed. */
export const INVALID_EMAIL = 'not-an-email';

/** Someone who is always signed up after a reset; useful for duplicate-email tests. */
export const SEEDED_PERSON = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada.lovelace@example.com', id: 1 };

export type AttendeeField = 'firstName' | 'lastName' | 'email';

export interface Attendee {
  firstName: string;
  lastName: string;
  email: string;
}

let counter = 0;

/** A valid person with a unique email. Pass overrides to change any field. */
export function buildAttendee(overrides: Partial<Attendee> = {}): Attendee {
  counter++;
  return {
    firstName: 'Test',
    lastName: `Person${counter}`,
    email: `test.person${counter}.${Date.now()}@example.com`,
    ...overrides,
  };
}

/** `count` valid people, e.g. buildAttendees(6) for "more people than seats". */
export function buildAttendees(count: number): Attendee[] {
  return Array.from({ length: count }, () => buildAttendee());
}

export function fullName(person: Pick<Attendee, 'firstName' | 'lastName'>): string {
  return `${person.firstName} ${person.lastName}`;
}

/** A name of exactly `length` characters, for length-limit tests. */
export function nameOfLength(length: number): string {
  return 'N'.repeat(length);
}

/** An email of exactly `length` characters, e.g. aaaa...a@example.com */
export function emailOfLength(length: number): string {
  const domain = '@example.com';
  return 'a'.repeat(length - domain.length) + domain;
}

/** Adds an emoji to one field of a person: names get it at the end, emails just before the "@". */
export function withEmoji(person: Attendee, field: keyof Attendee, emoji: string): Attendee {
  const value = field === 'email' ? person.email.replace('@', `${emoji}@`) : `${person[field]}${emoji}`;
  return { ...person, [field]: value };
}

/** The "#" column values for a list of `count` rows: ['1', '2', ..., String(count)]. */
export function positions(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

