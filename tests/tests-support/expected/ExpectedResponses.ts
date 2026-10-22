import { expect } from '@playwright/test';
import { CAPACITY, EVENT_ID, EVENT_NAME, SEEDED_CONFIRMED, SEEDED_PERSON, type Attendee } from '../helpers/testData';

type Status = 'confirmed' | 'waitlisted';

/**
    One source of truth for the JSON the API sends back. Tests compare against these instead of
    writing objects inline: expect(await response.json()).toEqual(ExpectedResponses.seededEvent).
*/
export class ExpectedResponses {
  static readonly health = { status: 'ok' };
  static readonly demoReset = { status: 'reset' };
  static readonly loggedOut = { status: 'logged-out' };

  static loggedIn(username: string) {
    return { username };
  }

  /** The fields every sign-up has, alphabetically. */
  static readonly signupFields = ['email', 'eventId', 'firstName', 'id', 'lastName', 'status'];

  /** Seat counts for the event; seats available is worked out from the capacity. */
  static counts(confirmed: number, waitlisted = 0) {
    return { confirmedCount: confirmed, waitlistCount: waitlisted, seatsAvailable: Math.max(CAPACITY - confirmed, 0) };
  }

  /** The full event summary, e.g. event(23) after two more people are confirmed. */
  static event(confirmed: number = SEEDED_CONFIRMED, waitlisted = 0) {
    return { id: EVENT_ID, name: EVENT_NAME, capacity: CAPACITY, ...ExpectedResponses.counts(confirmed, waitlisted) };
  }

  static readonly seededEvent = ExpectedResponses.event();
  static readonly eventList = [ExpectedResponses.seededEvent];

  /** A sign-up as the API returns it. Leave out id when the test doesn't know it in advance. */
  static signup(person: Attendee, status: Status = 'confirmed', id?: number) {
    return { id: id ?? expect.any(Number), eventId: EVENT_ID, ...person, status };
  }

  static readonly seededPersonSignup = ExpectedResponses.signup(
    { firstName: SEEDED_PERSON.firstName, lastName: SEEDED_PERSON.lastName, email: SEEDED_PERSON.email },
    'confirmed',
    SEEDED_PERSON.id,
  );

  static removeResult(removed: object, promoted: object | null = null) {
    return { removed, promoted };
  }

  static clearWaitlistResult(removedCount: number) {
    return { removedCount };
  }

  static clearConfirmedResult(removedCount: number, promoted: object[] = []) {
    return { removedCount, promoted };
  }
}
