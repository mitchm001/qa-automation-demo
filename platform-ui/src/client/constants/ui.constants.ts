/** The app shows a single event: the one the server seeds. */
export const EVENT_ID = 1;

export const API_BASE = '/api';

/** Where the browser goes when it isn't logged in, and where it goes after logging in. */
export const LOGIN_PAGE = '/login.html';
export const HOME_PAGE = '/';

/** The form allows this many "Person" rows. Matches the server's per-request limit. */
export const MAX_PEOPLE_PER_SIGNUP = 5;

export const ATTENDEE_FIELDS = [
  { key: 'firstName', label: 'First name', type: 'text', autocomplete: 'given-name' },
  { key: 'lastName', label: 'Last name', type: 'text', autocomplete: 'family-name' },
  { key: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
] as const;
