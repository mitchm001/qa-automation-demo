import { SCHEMA_CASES } from '../constants/constants-api';
import { expect, test } from '../tests-support/helpers/fixtures';
import { expectToMatchSchema } from '../tests-support/helpers/schemas';

/**
    Every response checked against its documented shape (tests-support/helpers/schemas.ts):
    field names, types, allowed values, and no extra fields.
*/
test.describe('Response schemas', () => {
  for (const { label, status, schema, send } of SCHEMA_CASES) {
    test(`API-154: Should match the documented response schema (${label})`, { tag: ['@P1'] }, async ({ eventsApi, request }) => {
      const response = await send(eventsApi, request);

      expect(response.status()).toBe(status);
      expectToMatchSchema(await response.json(), schema);
    });
  }
});
