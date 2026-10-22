import { randomBytes } from 'node:crypto';

/**
    Logged-in sessions, kept in memory: session id -> who is logged in and until when.
    The id is 32 random bytes, so it can't be guessed. Restarting the server logs everyone out.
*/
export class SessionStore {
  private readonly sessions = new Map<string, { username: string; expiresAt: number }>();

  constructor(private readonly ttlMs: number) {}

  create(username: string): string {
    const id = randomBytes(32).toString('hex');
    this.sessions.set(id, { username, expiresAt: Date.now() + this.ttlMs });
    return id;
  }

  /** The username for a session id, or null if it's unknown or expired. */
  find(id: string | undefined): string | null {
    if (!id) return null;
    const session = this.sessions.get(id);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(id);
      return null;
    }
    return session.username;
  }

  destroy(id: string | undefined): void {
    if (id) this.sessions.delete(id);
  }
}
