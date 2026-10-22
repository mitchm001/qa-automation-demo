import { hashPassword, verifyPassword } from '../helpers/password.helpers.js';
import { InvalidCredentialsError } from './HttpError.js';
import { SessionStore } from './SessionStore.js';

export interface DemoUser {
  username: string;
  password: string;
}

/** Logging in and out for the single demo account. Routes call these methods; sessions live in the SessionStore. */
export class AuthService {
  private constructor(
    private readonly username: string,
    private readonly passwordHash: string,
    private readonly sessions: SessionStore,
  ) {}

  /** Hashes the demo password once at startup, so the plain-text password isn't kept around. */
  static async create(user: DemoUser, sessions: SessionStore): Promise<AuthService> {
    return new AuthService(user.username, await hashPassword(user.password), sessions);
  }

  /** Returns a new session id, or throws InvalidCredentialsError (401) for a wrong username or password. */
  async logIn(username: string, password: string): Promise<string> {
    /** The password is always checked, even for an unknown username, so both cases take the same time. */
    const passwordOk = await verifyPassword(password, this.passwordHash);
    if (username !== this.username || !passwordOk) throw new InvalidCredentialsError();
    return this.sessions.create(username);
  }

  logOut(sessionId: string | undefined): void {
    this.sessions.destroy(sessionId);
  }

  /** The logged-in username for a session id, or null. */
  currentUser(sessionId: string | undefined): string | null {
    return this.sessions.find(sessionId);
  }
}
