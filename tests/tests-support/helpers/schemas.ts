import { expect } from '@playwright/test';
import { z } from 'zod';

/**
    The documented shape of every API response, written with zod.
    `.strict()` means an unexpected extra field fails the check, so a renamed, retyped,
    missing OR added field is caught, not just the fields a test happens to look at.
*/

const count = z.number().int().nonnegative();
const id = z.number().int().positive();

export const HealthSchema = z.object({ status: z.literal('ok') }).strict();

export const EventSummarySchema = z
  .object({
    id,
    name: z.string().min(1),
    capacity: z.number().int().positive(),
    confirmedCount: count,
    waitlistCount: count,
    seatsAvailable: count,
  })
  .strict();

export const SignupSchema = z
  .object({
    id,
    eventId: id,
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.email(),
    status: z.enum(['confirmed', 'waitlisted']),
  })
  .strict();

export const SignupResultSchema = z.object({ event: EventSummarySchema, signups: z.array(SignupSchema).min(1).max(5) }).strict();
export const RemoveResultSchema = z.object({ removed: SignupSchema, promoted: SignupSchema.nullable() }).strict();
export const ClearWaitlistResultSchema = z.object({ removedCount: count }).strict();
export const DemoResetSchema = z.object({ status: z.literal('reset') }).strict();
export const ClearConfirmedResultSchema = z.object({ removedCount: count, promoted: z.array(SignupSchema) }).strict();

export const ErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string().regex(/^[A-Z_]+$/),
        message: z.string().min(1),
        fieldErrors: z.record(z.string(), z.string()).optional(),
      })
      .strict(),
  })
  .strict();

/** Fails with a readable list of every mismatch (path + problem), not just the first one. */
export function expectToMatchSchema(body: unknown, schema: z.ZodType): void {
  const result = schema.safeParse(body);
  const problems = result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
  expect(problems, 'response does not match its schema').toEqual([]);
}
