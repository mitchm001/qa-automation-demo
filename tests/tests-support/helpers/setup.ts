import { expect } from '@playwright/test';
import type { EventsApi } from './EventsApi';
import { buildAttendees, SEATS_LEFT_AFTER_RESET, type Attendee } from './testData';

/**
    Arrange-step shortcuts that go through the API instead of the UI.
    Fast and reliable for building state that isn't the thing being tested.
*/

/** Signs up 4 new people so the event is full (25 of 25). Returns them. */
export async function fillRemainingSeats(eventsApi: EventsApi): Promise<Attendee[]> {
  const people = buildAttendees(SEATS_LEFT_AFTER_RESET);
  const response = await eventsApi.signUp(people);
  expect(response.status(), 'setup: fill the remaining seats').toBe(201);
  return people;
}

/** Fills the event, then puts `count` more people on the waitlist. Returns the waitlisted people in order. */
export async function fillEventAndWaitlist(eventsApi: EventsApi, count: number): Promise<Attendee[]> {
  await fillRemainingSeats(eventsApi);
  const waitlisted = buildAttendees(count);
  const response = await eventsApi.signUp(waitlisted);
  expect(response.status(), 'setup: add people to the waitlist').toBe(201);
  return waitlisted;
}
