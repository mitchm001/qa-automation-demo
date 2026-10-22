/**
    Mutex (a lock): lets only one piece of async work run at a time; the rest wait in line.
    Prevents a race condition: signing up is "check seats, then save", and every `await` lets
    Node switch to another request. Without the lock, two requests could both see "1 seat left"
    and both get it. SqliteEventStore wraps every transaction in runExclusive(), so the second
    request only checks after the first has saved. Proven by API-152 and API-153.
*/
export class Mutex {
  private tail: Promise<unknown> = Promise.resolve();

  runExclusive<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(work);
    /** The next caller waits for this one to finish, whether it succeeded or failed. */
    this.tail = result.catch(() => undefined);
    return result;
  }
}
