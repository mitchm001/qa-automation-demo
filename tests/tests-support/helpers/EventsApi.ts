import type { APIRequestContext, APIResponse } from '@playwright/test';
import { EVENT_ID, type Attendee } from './testData';

/**
    A thin wrapper around the app's HTTP API. Each method returns the raw APIResponse,
    so the test still asserts the status code first, then reads the body.
*/
export class EventsApi {
  constructor(private readonly request: APIRequestContext) {}

  health(): Promise<APIResponse> {
    return this.request.get('/api/health');
  }

  /** Wipes the database and reloads the demo data (21 of 25 confirmed). */
  reset(): Promise<APIResponse> {
    return this.request.post('/api/testing/reset');
  }

  logIn(credentials: { username?: unknown; password?: unknown }): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: credentials });
  }

  logOut(): Promise<APIResponse> {
    return this.request.post('/api/auth/logout');
  }

  me(): Promise<APIResponse> {
    return this.request.get('/api/auth/me');
  }

  /** The always-on reset behind the page's "Reset UI" button. */
  resetDemo(): Promise<APIResponse> {
    return this.request.post('/api/demo/reset');
  }

  listEvents(): Promise<APIResponse> {
    return this.request.get('/api/events');
  }

  getEvent(eventId: number | string = EVENT_ID): Promise<APIResponse> {
    return this.request.get(`/api/events/${eventId}`);
  }

  listSignups(eventId: number | string = EVENT_ID): Promise<APIResponse> {
    return this.request.get(`/api/events/${eventId}/signups`);
  }

  getSignup(signupId: number | string, eventId: number | string = EVENT_ID): Promise<APIResponse> {
    return this.request.get(`/api/events/${eventId}/signups/${signupId}`);
  }

  signUp(attendees: Attendee[], eventId: number | string = EVENT_ID): Promise<APIResponse> {
    return this.request.post(`/api/events/${eventId}/signups`, { data: { attendees } });
  }

  /** Sends any body as-is. For negative tests: wrong types, missing fields, extra fields. */
  signUpRaw(body: unknown, eventId: number | string = EVENT_ID): Promise<APIResponse> {
    return this.request.post(`/api/events/${eventId}/signups`, { data: body });
  }

  removeSignup(signupId: number | string, eventId: number | string = EVENT_ID): Promise<APIResponse> {
    return this.request.delete(`/api/events/${eventId}/signups/${signupId}`);
  }

  /** Removes everyone confirmed; the waitlist then moves up into the freed seats. */
  clearConfirmed(eventId: number | string = EVENT_ID): Promise<APIResponse> {
    return this.request.delete(`/api/events/${eventId}/confirmed`);
  }

  clearWaitlist(eventId: number | string = EVENT_ID): Promise<APIResponse> {
    return this.request.delete(`/api/events/${eventId}/waitlist`);
  }
}
