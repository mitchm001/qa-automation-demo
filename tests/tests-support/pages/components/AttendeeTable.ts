import type { Locator, Page } from '@playwright/test';
import { fullName, type Attendee } from '../../helpers/testData';

/** The "Confirmed (N)" or "Waitlist (N)" card. Columns: #, Name, Email, Remove. */
export class AttendeeTable {
  readonly heading: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  /** The Name cell of every row. Use with toHaveText([...]) to check names and order (auto-retries). */
  readonly nameCells: Locator;
  /** The "#" cell of every row (1, 2, 3, ...). */
  readonly positionCells: Locator;

  constructor(page: Page, title: 'Confirmed' | 'Waitlist') {
    this.heading = page.getByRole('heading', { name: new RegExp(`^${title} \\(\\d+\\)$`) });
    this.table = page.getByRole('table', { name: new RegExp(`^${title}`) });
    this.rows = this.table.locator('tbody tr');
    this.nameCells = this.rows.locator('td:nth-child(2)');
    this.positionCells = this.rows.locator('td:nth-child(1)');
  }

  /** The row for one person, found by their email. */
  rowFor(person: Pick<Attendee, 'email'>): Locator {
    return this.rows.filter({ hasText: person.email });
  }

  /** A one-time read of the names (doesn't retry). Prefer expect(nameCells) in assertions. */
  names(): Promise<string[]> {
    return this.nameCells.allTextContents();
  }

  removeButtonFor(person: Pick<Attendee, 'firstName' | 'lastName'>): Locator {
    return this.table.getByRole('button', { name: `Remove ${fullName(person)}` });
  }
}
