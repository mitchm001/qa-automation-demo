import type { EventsApi } from '../tests-support/helpers/EventsApi';
import { buildAttendee, DEMO_USER, SEEDED_PERSON } from '../tests-support/helpers/testData';

/** Session cookie (AUTH-001, AUTH-006, AUTH-015) */
export const SESSION_COOKIE = 'sid';
export const SESSION_COOKIE_FLAGS = ['HttpOnly', 'SameSite=Lax', 'Path=/'];
export const MADE_UP_SESSION = 'a'.repeat(64);

/** Wrong logins (AUTH-002, AUTH-003) */
export const WRONG_PASSWORD = { username: DEMO_USER.username, password: `${DEMO_USER.password}-wrong` };
export const UNKNOWN_USER = { username: `${DEMO_USER.username}-nobody`, password: DEMO_USER.password };

/** Login requests with missing or empty fields, and the field errors each one gets (AUTH-004) */
export const MISSING_CREDENTIALS = [
  { label: 'no username', body: { password: DEMO_USER.password }, fields: ['username'] },
  { label: 'no password', body: { username: DEMO_USER.username }, fields: ['password'] },
  { label: 'empty username and password', body: { username: '', password: '' }, fields: ['username', 'password'] },
  { label: 'username is only spaces', body: { username: '   ', password: DEMO_USER.password }, fields: ['username'] },
];

/** Every event request that needs a login (AUTH-005) */
export const PROTECTED_REQUESTS = [
  { label: 'GET /api/events', send: (api: EventsApi) => api.listEvents() },
  { label: 'GET /api/events/1', send: (api: EventsApi) => api.getEvent() },
  { label: 'GET /api/events/1/signups', send: (api: EventsApi) => api.listSignups() },
  { label: 'GET /api/events/1/signups/:id', send: (api: EventsApi) => api.getSignup(SEEDED_PERSON.id) },
  { label: 'POST /api/events/1/signups', send: (api: EventsApi) => api.signUp([buildAttendee()]) },
  { label: 'DELETE /api/events/1/signups/:id', send: (api: EventsApi) => api.removeSignup(SEEDED_PERSON.id) },
  { label: 'DELETE /api/events/1/waitlist', send: (api: EventsApi) => api.clearWaitlist() },
  { label: 'DELETE /api/events/1/confirmed', send: (api: EventsApi) => api.clearConfirmed() },
  { label: 'POST /api/demo/reset', send: (api: EventsApi) => api.resetDemo() },
];

/** Pages */
export const LOGIN_URL = /\/login\.html$/;
export const EVENT_PAGE_URL = '/';
