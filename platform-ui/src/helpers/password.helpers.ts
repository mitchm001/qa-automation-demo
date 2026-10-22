import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

/**
    Passwords are never stored as plain text. scrypt is a deliberately slow hash, so guessing passwords
    from a stolen hash is expensive. Each hash gets its own random salt; the result is "salt:hash".
*/
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${hash.toString('hex')}`;
}

/** Compares in constant time, so response timing doesn't hint at how close a guess was. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHex] = stored.split(':');
  const actual = await scryptAsync(password, salt, KEY_LENGTH);
  return timingSafeEqual(actual, Buffer.from(expectedHex, 'hex'));
}
