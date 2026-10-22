import { API_BASE, LOGIN_PAGE } from '../constants/ui.constants.js';
import type { AttendeeInput, ClearConfirmedResult, EventSummary, FieldErrors, RemoveResult, Signup, SignupResult } from '../types.js';

/** Thrown for any non-2xx response. Carries the API's error code and field messages. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
  }
}

/** The browser's only way of talking to the server. */
export class ApiClient {
  logIn(username: string, password: string): Promise<{ username: string }> {
    return this.request('POST', '/auth/login', { username, password });
  }

  logOut(): Promise<{ status: string }> {
    return this.request('POST', '/auth/logout');
  }

  /** Who is logged in; throws an ApiError with status 401 if nobody is. */
  me(): Promise<{ username: string }> {
    return this.request('GET', '/auth/me');
  }

  getEvent(eventId: number): Promise<EventSummary> {
    return this.request('GET', `/events/${eventId}`);
  }

  listSignups(eventId: number): Promise<Signup[]> {
    return this.request('GET', `/events/${eventId}/signups`);
  }

  signUp(eventId: number, attendees: AttendeeInput[]): Promise<SignupResult> {
    return this.request('POST', `/events/${eventId}/signups`, { attendees });
  }

  removeSignup(eventId: number, signupId: number): Promise<RemoveResult> {
    return this.request('DELETE', `/events/${eventId}/signups/${signupId}`);
  }

  clearConfirmed(eventId: number): Promise<ClearConfirmedResult> {
    return this.request('DELETE', `/events/${eventId}/confirmed`);
  }

  /** Puts the Confirmed list and waitlist back to the original 21 people. */
  resetDemo(): Promise<{ status: string }> {
    return this.request('POST', '/demo/reset');
  }

  clearWaitlist(eventId: number): Promise<{ removedCount: number }> {
    return this.request('DELETE', `/events/${eventId}/waitlist`);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      /** The session ended (expired, logged out in another tab): go back to the login page. */
      if (response.status === 401 && !path.startsWith('/auth/')) window.location.assign(LOGIN_PAGE);
      const error = data?.error ?? {};
      throw new ApiError(response.status, error.code ?? 'UNKNOWN', error.message ?? 'Request failed.', error.fieldErrors);
    }
    return data as T;
  }
}
