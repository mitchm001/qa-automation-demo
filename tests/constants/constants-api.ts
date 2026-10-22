import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { z } from 'zod';
import type { EventsApi } from '../tests-support/helpers/EventsApi';
import {
  ClearConfirmedResultSchema,
  ClearWaitlistResultSchema,
  DemoResetSchema,
  ErrorSchema,
  EventSummarySchema,
  HealthSchema,
  RemoveResultSchema,
  SignupResultSchema,
  SignupSchema,
} from '../tests-support/helpers/schemas';
import { fillEventAndWaitlist } from '../tests-support/helpers/setup';
import {
  buildAttendee,
  buildAttendees,
  EVENT_ID,
  fullName,
  INVALID_EMAIL,
  MAX_PEOPLE_PER_SIGNUP,
  MISSING_EVENT_ID,
  SEEDED_PERSON,
  type AttendeeField,
} from '../tests-support/helpers/testData';

/** A person used only as filler inside bodies that are invalid for another reason. */
const SAMPLE_PERSON = buildAttendee();

/** Endpoints */
export const SIGNUPS_URL = `/api/events/${EVENT_ID}/signups`;

/** Ids */
export const INVALID_EVENT_IDS = [String(MISSING_EVENT_ID), '0', '-1', 'abc', '1.5'];
export const TOO_LARGE_ID = '99999999999999999999';
export const LEADING_ZERO_EVENT_ID = '01';
export const LEADING_ZERO_SIGNUP_ID = '001';

/** Unknown routes */
export const UNKNOWN_ROUTES = [
  { method: 'GET', path: '/api/nope' },
  { method: 'PUT', path: `/api/events/${EVENT_ID}` },
  { method: 'PATCH', path: `/api/events/${EVENT_ID}/signups/${SEEDED_PERSON.id}` },
];

/** Request bodies that aren't JSON (expect 415) */
export const NON_JSON_BODIES = [
  { label: 'plain text', options: { headers: { 'Content-Type': 'text/plain' }, data: fullName(SAMPLE_PERSON) } },
  { label: 'form data', options: { form: { firstName: SAMPLE_PERSON.firstName } } },
  { label: 'no body', options: {} },
];

/** JSON that's cut off halfway (expect 400 INVALID_JSON) */
export const MALFORMED_JSON = '{"attendees": [';

/** Validation: request shape */
export const NOT_A_LIST_BODIES = [
  { label: 'empty object', body: {} },
  { label: 'attendees is a string', body: { attendees: fullName(SAMPLE_PERSON) } },
  { label: 'attendees is an object', body: { attendees: SAMPLE_PERSON } },
  { label: 'body is an array', body: [SAMPLE_PERSON] },
];
export const INVALID_PEOPLE_COUNTS = [0, MAX_PEOPLE_PER_SIGNUP + 1];
export const VALID_PEOPLE_COUNTS = [1, MAX_PEOPLE_PER_SIGNUP];
export const NOT_AN_OBJECT_PEOPLE = [
  { label: 'null', person: null },
  { label: 'a string', person: fullName(SAMPLE_PERSON) },
  { label: 'a number', person: 42 },
  { label: 'a list', person: [SAMPLE_PERSON.firstName, SAMPLE_PERSON.lastName] },
];

/** Validation: names */
export const NAME_FIELDS: AttendeeField[] = ['firstName', 'lastName'];
export const MISSING_OR_WRONG_TYPE_NAMES = [
  { label: 'missing', value: undefined },
  { label: 'empty', value: '' },
  { label: 'only spaces', value: '   ' },
  { label: 'null', value: null },
  { label: 'a number', value: 42 },
  { label: 'a boolean', value: true },
];

/** Validation: email */
export const MISSING_OR_WRONG_TYPE_EMAILS = [
  { label: 'missing', value: undefined },
  { label: 'empty', value: '' },
  { label: 'only spaces', value: '   ' },
  { label: 'null', value: null },
  { label: 'a number', value: 42 },
];
export const BADLY_FORMED_EMAILS = ['jane', 'jane@', 'jane@example', '@example.com', 'jane doe@example.com', 'jane@exa mple.com', 'jane@@example.com'];

/** Validation: emoji (each field gets each emoji added to an otherwise valid value) */
export const EMOJI_SAMPLES = [
  { label: 'smiley', value: '😀' },
  { label: 'skin tone', value: '👍🏽' },
  { label: 'flag', value: '🇺🇸' },
  { label: 'heart', value: '❤️' },
  { label: 'family (combined emoji)', value: '👨‍👩‍👧' },
];
export const EMOJI_FIELDS: Array<{ field: AttendeeField; withEmoji: (emoji: string) => string }> = [
  { field: 'firstName', withEmoji: (emoji) => `${SAMPLE_PERSON.firstName}${emoji}` },
  { field: 'lastName', withEmoji: (emoji) => `${SAMPLE_PERSON.lastName}${emoji}` },
  { field: 'email', withEmoji: (emoji) => SAMPLE_PERSON.email.replace('@', `${emoji}@`) },
];

/** Duplicate emails: the seeded person's email, written three ways */
export const DUPLICATE_EMAIL_VARIANTS = [
  { label: 'exact match', email: SEEDED_PERSON.email },
  { label: 'different capitals', email: SEEDED_PERSON.email.toUpperCase() },
  { label: 'extra spaces', email: `  ${SEEDED_PERSON.email}  ` },
];

/** Concurrency */
export const CONCURRENT_SIGNUPS = 20;
export const LAST_SEAT_CONTENDERS = 10;

/** Response schemas: one request per documented response */
export interface SchemaCase {
  label: string;
  status: number;
  schema: z.ZodType;
  send: (api: EventsApi, request: APIRequestContext) => Promise<APIResponse>;
}

export const SCHEMA_CASES: SchemaCase[] = [
  { label: 'GET /api/health', status: 200, schema: HealthSchema, send: (api) => api.health() },
  { label: 'GET /api/events', status: 200, schema: EventSummarySchema.array().min(1), send: (api) => api.listEvents() },
  { label: 'GET /api/events/1', status: 200, schema: EventSummarySchema, send: (api) => api.getEvent() },
  { label: 'GET /api/events/1/signups', status: 200, schema: SignupSchema.array(), send: (api) => api.listSignups() },
  { label: 'GET /api/events/1/signups/:id', status: 200, schema: SignupSchema, send: (api) => api.getSignup(SEEDED_PERSON.id) },
  // 5 people for 4 seats, so the response holds both a confirmed and a waitlisted sign-up
  { label: 'POST /api/events/1/signups', status: 201, schema: SignupResultSchema, send: (api) => api.signUp(buildAttendees(MAX_PEOPLE_PER_SIGNUP)) },
  {
    label: 'DELETE /api/events/1/signups/:id (someone moves up)',
    status: 200,
    schema: RemoveResultSchema,
    send: async (api) => {
      await fillEventAndWaitlist(api, 1);
      return api.removeSignup(SEEDED_PERSON.id);
    },
  },
  { label: 'DELETE /api/events/1/signups/:id (nobody moves up)', status: 200, schema: RemoveResultSchema, send: (api) => api.removeSignup(SEEDED_PERSON.id) },
  {
    label: 'DELETE /api/events/1/waitlist',
    status: 200,
    schema: ClearWaitlistResultSchema,
    send: async (api) => {
      await fillEventAndWaitlist(api, 2);
      return api.clearWaitlist();
    },
  },
  {
    label: 'DELETE /api/events/1/confirmed',
    status: 200,
    schema: ClearConfirmedResultSchema,
    send: async (api) => {
      await fillEventAndWaitlist(api, 2);
      return api.clearConfirmed();
    },
  },
  { label: 'POST /api/demo/reset', status: 200, schema: DemoResetSchema, send: (api) => api.resetDemo() },
  { label: '400 validation error', status: 400, schema: ErrorSchema, send: (api) => api.signUp([buildAttendee({ email: INVALID_EMAIL })]) },
  { label: '400 malformed JSON', status: 400, schema: ErrorSchema, send: (_api, request) => request.post(SIGNUPS_URL, { headers: { 'Content-Type': 'application/json' }, data: MALFORMED_JSON }) },
  { label: '404 not found', status: 404, schema: ErrorSchema, send: (api) => api.getEvent(MISSING_EVENT_ID) },
  { label: '409 duplicate', status: 409, schema: ErrorSchema, send: (api) => api.signUp([buildAttendee({ email: SEEDED_PERSON.email })]) },
  { label: '415 not JSON', status: 415, schema: ErrorSchema, send: (_api, request) => request.post(SIGNUPS_URL, NON_JSON_BODIES[0].options) },
];
