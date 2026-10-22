import { SIGNUP_STATUS } from '../constants/event.constants.js';
import { seedDatabase } from '../helpers/seed.helpers.js';
import type { EventRepository, EventStore } from '../storage/EventStore.js';
import type { Attendee, EventSummary, FieldErrors, Signup } from '../types/event.types.js';
import { DuplicateEmailError, NotFoundError } from './HttpError.js';

export interface SignupResult {
  event: EventSummary;
  signups: Signup[];
}

export interface ClearConfirmedResult {
  removedCount: number;
  /** Waitlisted people who moved into the freed seats, in waitlist order. */
  promoted: Signup[];
}

export interface RemoveResult {
  removed: Signup;
  /** The waitlisted person who got the freed seat, if there was one. */
  promoted: Signup | null;
}

/**
    The business rules. Routes call these methods; these methods call the store.
    1. An event never has more confirmed people than its capacity.
    2. People are seated in the order they are sent. Once the event is full, the rest are waitlisted.
    3. An email can only appear once per event (confirmed or waitlisted).
    4. When a confirmed person is removed, the longest-waiting person on the waitlist takes the seat.
    Removing everyone confirmed works the same way: the waitlist fills the freed seats in order.
    5. A waitlist only exists while the event is full. Rules 1, 2 and 4 make this hold on their own:
    nobody is waitlisted while a seat is open, and the moment a seat frees up, the next person
    in line takes it.
*/
export class SignupService {
  constructor(private readonly store: EventStore) {}

  listEvents(): Promise<EventSummary[]> {
    return this.store.transaction((repo) => repo.listEvents());
  }

  getEvent(eventId: number): Promise<EventSummary> {
    return this.store.transaction((repo) => this.requireEvent(repo, eventId));
  }

  listSignups(eventId: number): Promise<Signup[]> {
    return this.store.transaction(async (repo) => {
      await this.requireEvent(repo, eventId);
      return repo.listSignups(eventId);
    });
  }

  getSignup(eventId: number, signupId: number): Promise<Signup> {
    return this.store.transaction((repo) => this.requireSignup(repo, eventId, signupId));
  }

  /** All-or-nothing: if any one person fails a the duplicate email check, error is thrown and nobody is saved. */
  signUp(eventId: number, attendees: Attendee[]): Promise<SignupResult> {
    return this.store.transaction(async (repo) => {
      const event = await this.requireEvent(repo, eventId);

      const existing = new Set(await repo.findExistingEmails(eventId, attendees.map((a) => a.email)));
      if (existing.size > 0) {
        const fieldErrors: FieldErrors = {};
        attendees.forEach((attendee, index) => {
          if (existing.has(attendee.email)) {
            fieldErrors[`attendees[${index}].email`] = `${attendee.email} is already signed up for this event.`;
          }
        });
        throw new DuplicateEmailError(fieldErrors);
      }

      let confirmedCount = await repo.countConfirmed(eventId);
      const signups: Signup[] = [];
      for (const attendee of attendees) {
        const hasSeat = confirmedCount < event.capacity;
        const status = hasSeat ? SIGNUP_STATUS.CONFIRMED : SIGNUP_STATUS.WAITLISTED;
        signups.push(await repo.insertSignup(eventId, attendee, status));
        if (hasSeat) confirmedCount++;
      }

      return { event: await this.requireEvent(repo, eventId), signups };
    });
  }

  /** Removes one person from Confirmed list. If there is a person in the Waitlist, they are promoted to the Confirmed list. */
  removeSignup(eventId: number, signupId: number): Promise<RemoveResult> {
    return this.store.transaction(async (repo) => {
      const removed = await this.requireSignup(repo, eventId, signupId);
      await repo.deleteSignup(signupId);

      let promoted: Signup | null = null;
      if (removed.status === SIGNUP_STATUS.CONFIRMED) {
        const next = await repo.getFirstWaitlisted(eventId);
        if (next) {
          await repo.updateSignupStatus(next.id, SIGNUP_STATUS.CONFIRMED);
          promoted = { ...next, status: SIGNUP_STATUS.CONFIRMED };
        }
      }
      return { removed, promoted };
    });
  }

  clearWaitlist(eventId: number): Promise<{ removedCount: number }> {
    return this.store.transaction(async (repo) => {
      await this.requireEvent(repo, eventId);
      return { removedCount: await repo.deleteSignupsByStatus(eventId, SIGNUP_STATUS.WAITLISTED) };
    });
  }

  /** Removes everyone Confirmed list, Then promotes people from the Waitlist to Confirmed list. */
  clearConfirmed(eventId: number): Promise<ClearConfirmedResult> {
    return this.store.transaction(async (repo) => {
      const event = await this.requireEvent(repo, eventId);
      const removedCount = await repo.deleteSignupsByStatus(eventId, SIGNUP_STATUS.CONFIRMED);

      const promoted: Signup[] = [];
      while (promoted.length < event.capacity) {
        const next = await repo.getFirstWaitlisted(eventId);
        if (!next) break;
        await repo.updateSignupStatus(next.id, SIGNUP_STATUS.CONFIRMED);
        promoted.push({ ...next, status: SIGNUP_STATUS.CONFIRMED });
      }
      return { removedCount, promoted };
    });
  }

  /** Wipes everything and loads the page to its original state with demo data. Used on first start and by the test-only reset route. */
  reset(): Promise<void> {
    return this.store.transaction(async (repo) => {
      await repo.deleteEverything();
      await seedDatabase(repo);
    });
  }

  /** Loads the original demo data only when the database is empty (first start), so the Confirmed list and Waitlist are kept between restarts. */
  seedIfEmpty(): Promise<void> {
    return this.store.transaction(async (repo) => {
      if ((await repo.listEvents()).length === 0) await seedDatabase(repo);
    });
  }

  /** Finds the event, or throws a 404 Not Found error if it doesn't exist. Every method that needs the event checks it here first. */
  private async requireEvent(repo: EventRepository, eventId: number): Promise<EventSummary> {
    const event = await repo.getEvent(eventId);
    if (!event) throw new NotFoundError(`Event ${eventId} was not found.`);
    return event;
  }

  /** Finds one person on the Confirmed list or Waitlist, or throws a 404 Not Found error if the event or the person doesn't exist. */
  private async requireSignup(repo: EventRepository, eventId: number, signupId: number): Promise<Signup> {
    await this.requireEvent(repo, eventId);
    const signup = await repo.getSignup(eventId, signupId);
    if (!signup) throw new NotFoundError(`Sign-up ${signupId} was not found for event ${eventId}.`);
    return signup;
  }
}
