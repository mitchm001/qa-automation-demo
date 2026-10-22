import { SEEDED_CONFIRMED_COUNT, SIGNUP_STATUS } from '../constants/event.constants.js';
import { SEED_ATTENDEE_NAMES, SEED_EVENT } from '../constants/seed.constants.js';
import type { EventRepository } from '../storage/EventStore.js';
import type { Attendee } from '../types/event.types.js';

/** "Fernando Corbató" -> "fernando.corbato@example.com" (accents removed, only a-z . - kept). */
function emailFromName(firstName: string, lastName: string): string {
  const plain = `${firstName}.${lastName}`.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return plain.replace(/[^a-z.-]/g, '') + '@example.com';
}

export function buildSeedAttendees(): Attendee[] {
  return SEED_ATTENDEE_NAMES.slice(0, SEEDED_CONFIRMED_COUNT).map(([firstName, lastName, email]) => ({
    firstName,
    lastName,
    email: email ?? emailFromName(firstName, lastName),
  }));
}

/** Creates the demo event with 21 of 25 seats taken. Expects an empty database. */
export async function seedDatabase(repo: EventRepository): Promise<void> {
  const event = await repo.insertEvent(SEED_EVENT.name, SEED_EVENT.capacity);
  for (const attendee of buildSeedAttendees()) {
    await repo.insertSignup(event.id, attendee, SIGNUP_STATUS.CONFIRMED);
  }
}
