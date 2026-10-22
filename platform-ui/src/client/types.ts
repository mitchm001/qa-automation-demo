/**
    Shapes of the JSON the API returns. These mirror src/types/event.types.ts;
    the browser build is compiled separately, so it keeps its own copy.
*/
export type SignupStatus = 'confirmed' | 'waitlisted';

export interface AttendeeInput {
  firstName: string;
  lastName: string;
  email: string;
}

export interface Signup extends AttendeeInput {
  id: number;
  eventId: number;
  status: SignupStatus;
}

export interface EventSummary {
  id: number;
  name: string;
  capacity: number;
  confirmedCount: number;
  waitlistCount: number;
  seatsAvailable: number;
}

export interface SignupResult {
  event: EventSummary;
  signups: Signup[];
}

export interface RemoveResult {
  removed: Signup;
  promoted: Signup | null;
}

export interface ClearConfirmedResult {
  removedCount: number;
  promoted: Signup[];
}

export type FieldErrors = Record<string, string>;
