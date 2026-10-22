import { expect, type APIResponse } from '@playwright/test';
import type { ExpectedApiError } from '../expected/ApiErrors';
import type { EventsApi } from './EventsApi';

export interface ApiErrorBody {
  error: { code: string; message: string; fieldErrors?: Record<string, string> };
}

/**
    Checks an error response against its expected status, code, and (when given) exact message and field errors.
    Always checks it's JSON in the app's standard shape. Usage: expectApiError(response, ApiErrors.eventNotFound(999)).
*/
export async function expectApiError(response: APIResponse, expected: ExpectedApiError): Promise<ApiErrorBody> {
  expect(response.status()).toBe(expected.status);
  expect(response.headers()['content-type']).toContain('application/json');
  const body: ApiErrorBody = await response.json();
  expect(body.error.code).toBe(expected.code);
  expect(typeof body.error.message).toBe('string');
  if (expected.message !== undefined) expect(body.error.message).toBe(expected.message);
  if (expected.fieldErrors !== undefined) expect(body.error.fieldErrors).toEqual(expected.fieldErrors);
  return body;
}

export interface EventCounts {
  confirmedCount: number;
  waitlistCount: number;
  seatsAvailable: number;
}

/** GET /api/events/1 (asserting 200) and return the seat counts. */
export async function getCounts(eventsApi: EventsApi): Promise<EventCounts> {
  const response = await eventsApi.getEvent();
  expect(response.status()).toBe(200);
  const { confirmedCount, waitlistCount, seatsAvailable } = await response.json();
  return { confirmedCount, waitlistCount, seatsAvailable };
}

export interface SignupJson {
  id: number;
  eventId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: 'confirmed' | 'waitlisted';
}

/** GET /api/events/1/signups (asserting 200). */
export async function listSignups(eventsApi: EventsApi): Promise<SignupJson[]> {
  const response = await eventsApi.listSignups();
  expect(response.status()).toBe(200);
  return response.json();
}
