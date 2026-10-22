import sqlite3 from 'sqlite3';
import { SIGNUP_STATUS } from '../constants/event.constants.js';
import { Mutex } from '../classes/Mutex.js';
import type { Attendee, EventRecord, EventSummary, Signup, SignupStatus } from '../types/event.types.js';
import type { EventRepository, EventStore } from './EventStore.js';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS events (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0)
  );

  CREATE TABLE IF NOT EXISTS signups (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    first_name TEXT    NOT NULL,
    last_name  TEXT    NOT NULL,
    email      TEXT    NOT NULL,
    status     TEXT    NOT NULL CHECK (status IN ('confirmed', 'waitlisted')),
    UNIQUE (event_id, email)   -- safety net: the database itself refuses duplicate emails
  );
`;

const EVENT_SUMMARY_SELECT = `
  SELECT e.id, e.name, e.capacity,
    (SELECT COUNT(*) FROM signups s WHERE s.event_id = e.id AND s.status = 'confirmed')  AS confirmedCount,
    (SELECT COUNT(*) FROM signups s WHERE s.event_id = e.id AND s.status = 'waitlisted') AS waitlistCount
  FROM events e
`;

const SIGNUP_SELECT = `
  SELECT id, event_id AS eventId, first_name AS firstName, last_name AS lastName, email, status
  FROM signups
`;

type EventRow = Omit<EventSummary, 'seatsAvailable'>;

function toSummary(row: EventRow): EventSummary {
  return { ...row, seatsAvailable: Math.max(row.capacity - row.confirmedCount, 0) };
}

/** EventStore backed by a single SQLite file, using the async `sqlite3` driver. */
export class SqliteEventStore implements EventStore {
  private readonly db: sqlite3.Database;
  private readonly lock = new Mutex();
  private readonly repo: EventRepository;

  constructor(filename: string) {
    this.db = new sqlite3.Database(filename);
    this.repo = new SqliteEventRepository(this);
  }

  async init(): Promise<void> {
    await this.run('PRAGMA foreign_keys = ON');
    await this.exec(SCHEMA);
  }

  transaction<T>(work: (repo: EventRepository) => Promise<T>): Promise<T> {
    /** There's one shared connection, so the lock makes each transaction wait its turn. */
    return this.lock.runExclusive(async () => {
      await this.run('BEGIN IMMEDIATE');
      try {
        const result = await work(this.repo);
        await this.run('COMMIT');
        return result;
      } catch (error) {
        await this.run('ROLLBACK');
        throw error;
      }
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => this.db.close((err) => (err ? reject(err) : resolve())));
  }

  /** --- Promise wrappers around the callback-style sqlite3 API --- */

  run(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row as T | undefined)));
    });
  }

  all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows as T[])));
    });
  }

  private exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => this.db.exec(sql, (err) => (err ? reject(err) : resolve())));
  }
}

/** The SQL behind each EventRepository method. */
class SqliteEventRepository implements EventRepository {
  constructor(private readonly db: SqliteEventStore) {}

  async listEvents(): Promise<EventSummary[]> {
    const rows = await this.db.all<EventRow>(`${EVENT_SUMMARY_SELECT} ORDER BY e.id`);
    return rows.map(toSummary);
  }

  async getEvent(eventId: number): Promise<EventSummary | undefined> {
    const row = await this.db.get<EventRow>(`${EVENT_SUMMARY_SELECT} WHERE e.id = ?`, [eventId]);
    return row && toSummary(row);
  }

  async insertEvent(name: string, capacity: number): Promise<EventRecord> {
    const { lastID } = await this.db.run('INSERT INTO events (name, capacity) VALUES (?, ?)', [name, capacity]);
    return { id: lastID, name, capacity };
  }

  listSignups(eventId: number): Promise<Signup[]> {
    /** Ordered by id = order of arrival, which is also the waitlist order. */
    return this.db.all<Signup>(`${SIGNUP_SELECT} WHERE event_id = ? ORDER BY id`, [eventId]);
  }

  getSignup(eventId: number, signupId: number): Promise<Signup | undefined> {
    return this.db.get<Signup>(`${SIGNUP_SELECT} WHERE event_id = ? AND id = ?`, [eventId, signupId]);
  }

  async findExistingEmails(eventId: number, emails: string[]): Promise<string[]> {
    if (emails.length === 0) return [];
    const placeholders = emails.map(() => '?').join(', ');
    const rows = await this.db.all<{ email: string }>(
      `SELECT email FROM signups WHERE event_id = ? AND email IN (${placeholders})`,
      [eventId, ...emails],
    );
    return rows.map((row) => row.email);
  }

  async countConfirmed(eventId: number): Promise<number> {
    const row = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) AS count FROM signups WHERE event_id = ? AND status = ?',
      [eventId, SIGNUP_STATUS.CONFIRMED],
    );
    return row?.count ?? 0;
  }

  async insertSignup(eventId: number, attendee: Attendee, status: SignupStatus): Promise<Signup> {
    const { lastID } = await this.db.run(
      'INSERT INTO signups (event_id, first_name, last_name, email, status) VALUES (?, ?, ?, ?, ?)',
      [eventId, attendee.firstName, attendee.lastName, attendee.email, status],
    );
    return { id: lastID, eventId, ...attendee, status };
  }

  async updateSignupStatus(signupId: number, status: SignupStatus): Promise<void> {
    await this.db.run('UPDATE signups SET status = ? WHERE id = ?', [status, signupId]);
  }

  async deleteSignup(signupId: number): Promise<void> {
    await this.db.run('DELETE FROM signups WHERE id = ?', [signupId]);
  }

  getFirstWaitlisted(eventId: number): Promise<Signup | undefined> {
    return this.db.get<Signup>(`${SIGNUP_SELECT} WHERE event_id = ? AND status = ? ORDER BY id LIMIT 1`, [
      eventId,
      SIGNUP_STATUS.WAITLISTED,
    ]);
  }

  async deleteSignupsByStatus(eventId: number, status: SignupStatus): Promise<number> {
    const { changes } = await this.db.run('DELETE FROM signups WHERE event_id = ? AND status = ?', [eventId, status]);
    return changes;
  }

  async deleteEverything(): Promise<void> {
    await this.db.run('DELETE FROM signups');
    await this.db.run('DELETE FROM events');
    /** Restart id numbering so a fresh database always has event id 1, signup ids 1..21. */
    await this.db.run("DELETE FROM sqlite_sequence WHERE name IN ('events', 'signups')");
  }
}
