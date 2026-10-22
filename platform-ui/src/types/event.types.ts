import type { SIGNUP_STATUS } from '../constants/event.constants.js';

export type SignupStatus = (typeof SIGNUP_STATUS)[keyof typeof SIGNUP_STATUS];

/** A person as entered on the form, after validation and trimming. */
export interface Attendee {
  firstName: string;
  lastName: string;
  email: string;
}

/** A saved sign-up row. */
export interface Signup extends Attendee {
  id: number;
  eventId: number;
  status: SignupStatus;
}

export interface EventRecord {
  id: number;
  name: string;
  capacity: number;
}

/** An event plus live seat counts, the shape the API returns. */
export interface EventSummary extends EventRecord {
  confirmedCount: number;
  waitlistCount: number;
  seatsAvailable: number;
}

/** Field-level messages keyed by path, e.g. { "attendees[2].email": "Email is not valid" } */
export type FieldErrors = Record<string, string>;
