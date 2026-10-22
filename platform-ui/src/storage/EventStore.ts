import type { Attendee, EventRecord, EventSummary, Signup, SignupStatus } from '../types/event.types.js';

/**
    Every database operation the app needs. The business rules only talk to this
    interface, so SQLite can later be swapped for Postgres without touching them.
*/
export interface EventRepository {
  listEvents(): Promise<EventSummary[]>;
  getEvent(eventId: number): Promise<EventSummary | undefined>;
  insertEvent(name: string, capacity: number): Promise<EventRecord>;

  listSignups(eventId: number): Promise<Signup[]>;
  getSignup(eventId: number, signupId: number): Promise<Signup | undefined>;
  findExistingEmails(eventId: number, emails: string[]): Promise<string[]>;
  countConfirmed(eventId: number): Promise<number>;
  insertSignup(eventId: number, attendee: Attendee, status: SignupStatus): Promise<Signup>;
  updateSignupStatus(signupId: number, status: SignupStatus): Promise<void>;
  deleteSignup(signupId: number): Promise<void>;
  getFirstWaitlisted(eventId: number): Promise<Signup | undefined>;
  /** Deletes every sign-up with this status for the event. Returns how many were deleted. */
  deleteSignupsByStatus(eventId: number, status: SignupStatus): Promise<number>;

  deleteEverything(): Promise<void>;
}

export interface EventStore {
  /** Creates tables if they don't exist yet. */
  init(): Promise<void>;

  /**
      Runs `work` as one all-or-nothing database transaction.
      Transactions never overlap, so check-then-save logic inside is safe.
  */
  transaction<T>(work: (repo: EventRepository) => Promise<T>): Promise<T>;

  close(): Promise<void>;
}
