import type { EventsApi } from '../tests-support/helpers/EventsApi';
import { buildAttendee, EVENT_ID, INVALID_EMAIL, MISSING_EVENT_ID, SEEDED_PERSON } from '../tests-support/helpers/testData';

/** HTML in names: each must show as plain text and never run (SEC-001) */
export const HTML_NAME_PAYLOADS = [
  { label: 'bold tag', firstName: '<b>Bold</b>' },
  { label: 'image with onerror script', firstName: '<img src=x onerror="window.__xss=1">' },
  { label: 'script tag', firstName: '<script>window.__xss=1</script>' },
];
export const INJECTED_ELEMENTS = 'b, img, script';

/** Responses that must carry the security headers (SEC-002) */
export const SECURITY_HEADER_RESPONSES = [
  { label: 'API success (200)', path: '/api/health' },
  { label: 'API error (404)', path: `/api/events/${MISSING_EVENT_ID}` },
  { label: 'web page', path: '/' },
  { label: 'browser script file', path: '/js/main.js' },
];

/**
    Expected security headers (SEC-002). nosniff: browsers must not guess file types. SAMEORIGIN: other sites
    can't embed the page (clickjacking). The CSP directives only allow content and scripts from this site.
*/
export const EXPECTED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'no-referrer',
};
export const REQUIRED_CSP_DIRECTIVES = ["default-src 'self'", "script-src 'self'", "object-src 'none'"];

/** Fields a client might sneak into a sign-up; all must be ignored (SEC-003) */
export const EXTRA_FIELDS = { role: 'admin', id: 9999, eventId: EVENT_ID + 1, isAdmin: true };

/** SQL-like text that must be stored exactly as typed (SEC-005) */
export const SQL_LIKE_PERSON = { firstName: "Robert'); DROP TABLE signups;--", lastName: "' OR '1'='1", email: "o'reilly.sql@example.com" };

/** Event ids containing SQL-like text (SEC-006) */
export const SQL_LIKE_EVENT_PATHS = [`/api/events/${EVENT_ID}%20OR%201=1`, `/api/events/${EVENT_ID}'--`, `/api/events/${EVENT_ID};DROP%20TABLE%20events`];

/** A first name far over the server's 100 KB body limit (SEC-007, SEC-008) */
export const OVERSIZED_NAME = 'x'.repeat(200_000);

/** One request per kind of error, for checking that error responses leak nothing (SEC-008) */
export const ERROR_REQUESTS = [
  { label: '400 invalid field', send: (api: EventsApi) => api.signUp([buildAttendee({ email: INVALID_EMAIL })]) },
  { label: '404 unknown event', send: (api: EventsApi) => api.getEvent(MISSING_EVENT_ID) },
  { label: '409 duplicate', send: (api: EventsApi) => api.signUp([buildAttendee({ email: SEEDED_PERSON.email })]) },
  { label: '500 server error (oversized body)', send: (api: EventsApi) => api.signUp([buildAttendee({ firstName: OVERSIZED_NAME })]) },
];
export const ERROR_BODY_KEYS = ['code', 'message', 'fieldErrors'];
export const LEAK_MARKERS = ['stack', 'node_modules', 'SQLITE', '/Users/', 'platform-ui'];
export const STACK_TRACE_LINE = /at .+\(.+:\d+:\d+\)/;

/** A second copy of the app started with test routes OFF, the way it would run for real (SEC-009) */
export const PRODUCTION_MODE_PORT = 3199;
export const TEST_RESET_PATH = '/api/testing/reset';
