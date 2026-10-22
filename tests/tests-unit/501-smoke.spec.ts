import { expect, test } from '@playwright/test';
import { normalizeEmail, validateEmail } from '../../platform-ui/src/helpers/validation.helpers';

// Setup check: unit tests can import the app's plain functions directly, with no server or browser.
test.describe('Suite setup: unit', () => {
  test('UNIT-001: Should import and call the app validation functions directly', { tag: ['@P3'] }, () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com');
    expect(validateEmail('ada@example.com')).toBeNull();
  });
});
