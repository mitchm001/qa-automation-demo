/** Every event holds this many confirmed seats. */
export const EVENT_CAPACITY = 25;

/** How many seats are already taken when the app starts (or after a test reset). */
export const SEEDED_CONFIRMED_COUNT = 21;

/** One sign-up request can include between 1 and this many people (the form allows this many rows). */
export const MAX_ATTENDEES_PER_REQUEST = 5;

export const SIGNUP_STATUS = {
  CONFIRMED: 'confirmed',
  WAITLISTED: 'waitlisted',
} as const;
